# Strategies with Tactics: Architecture Guide

This project implements Strategies composed of Tactics, guided by the ideas in “When Your Strategy Needs a Strategy: Tactical Error or Unfinished Business.” See: [Medium: When Your Strategy Needs a Strategy](https://medium.com/gitconnected/when-your-strategy-needs-a-strategy-tactical-error-or-unfinished-business-e42129792032).

## Overview

Traditional Strategy Pattern reduces conditional complexity at the point of selecting an algorithm. In practice, conditional complexity often migrates inside the strategy implementation. This codebase addresses that by introducing a tactical layer: strategies are declarative compositions of small, self-contained tactics orchestrated by a `TacticalPlan`.

Core ideas:

- Strategies expose a clear interface per domain (Version, Reference, Commit, Package, Output).
- Tactics encapsulate applicability and execution for one conditional path.
- Tactical plans orchestrate an ordered set of tactics and merge updated context.
- Objectives map configuration to a concrete strategy (Config → Objective → Strategy).

## Strategy File Layout

Each domain strategy follows a consistent layout that separates concerns and keeps the Strategy layer thin by composing Tactics:

```
src/strategies/
├── <Domain>.ts                # Objective: Config → <Domain>Strategy (entry point)
└── <Domain>/                  # Strategy implementation details
    ├── Strategy.ts            # (Optional) Composite strategy orchestrator for the domain
    ├── tactics/               # Domain-specific Tactics (atomic, assess + attempt)
    └── strategies/            # Sub-objectives and concrete strategy classes
```

- <Domain>.ts provides a stable module interface for the folder (root file named like the folder).
- <Domain>/Strategy.ts composes one or more `TacticalPlan`s and/or `ObjectiveTactic`s.
- <Domain>/tactics contains small, reusable units that encapsulate conditional paths.
- <Domain>/strategies contains sub-objectives and their concrete implementations.
- The base shapes live in `src/types/strategies/<domain>.ts` (interfaces only).

Examples from the repo:

Commit objective mapping to a concrete strategy:

```6:12:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Commit.ts
export class Commit {
  static strategise(config: Config): CommitStrategy {
    return new Strategy(config)
  }
}
```

Commit composite strategy orchestrating plans and sub-objectives:

```19:29:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Commit/Strategy.ts
export class Strategy implements CommitStrategy {
  public readonly name = 'commit'
  private parsingPlan: TacticalPlan<CommitInfo[], ParseCommitsContext>
  private formatVersionPlan: TacticalPlan<string, FormatVersionContext>
  private formatDependencyPlan: TacticalPlan<string, FormatDependencyContext>
```

Reference domain tactics are grouped under `Reference/tactics` (e.g., `SetupGit.ts`, `merge-base.ts`, tag-based heuristics).

Version and Reference objectives exist at `src/strategies/Version.ts` and `src/strategies/Reference.ts` respectively and will wire specific concrete strategies in `Version/*` and `Reference/*`.

## Core Abstractions (as implemented)

### Tactic and TacticResult

```1:20:/Users/bahulneel/Projects/bahulneel/action-version/src/types/tactics.ts
/**
 * Base result from a tactic execution.
 * Only reports what happened - doesn't dictate strategy behavior.
 */
export interface TacticResult<T = any, C = any> {
  applied: boolean // Did the tactic attempt to execute?
  success: boolean // If applied, did it succeed?
  result?: T // The actual result if successful
  context?: Partial<C> // Updated context information
  message?: string // Descriptive message about what happened
}

/**
 * Interface that all tactics must implement.
 */
export interface Tactic<T, C> {
  name: string
  assess(context: C): boolean
  attempt(context: C): Promise<TacticResult<T, C>>
}
```

### TacticalPlan

```1:31:/Users/bahulneel/Projects/bahulneel/action-version/src/tactics/TacticalPlan.ts
import * as core from '@actions/core'
import type { Tactic, TacticalPlanInterface } from '../types/tactics.js'

/**
 * A tactical plan - coordinates the execution of an ordered sequence of tactics.
 */
export class TacticalPlan<T, C> implements TacticalPlanInterface<T, C> {
  public readonly name: string
  public readonly description?: string | undefined

  constructor(private tactics: Tactic<T, C>[], name: string, description?: string) {
    this.name = name
    this.description = description
  }
```

```16:61:/Users/bahulneel/Projects/bahulneel/action-version/src/tactics/TacticalPlan.ts
  public async execute(context: C): Promise<T> {
    if (this.tactics.length === 0) {
      throw new Error('No tactics in this plan')
    }

    core.info(`🎯 Executing tactical plan with ${this.tactics.length} tactics`)
    if (this.description) {
      core.debug(`📋 Plan: ${this.description}`)
    }

    for (const tactic of this.tactics) {
      core.debug(`🎯 Executing tactic: ${tactic.name}`)

      // Assess if this tactic is applicable
      if (!tactic.assess(context)) {
        core.debug(`⏭️ ${tactic.name}: Not applicable to this context`)
        continue
      }

      try {
        const result = await tactic.attempt(context)

        // Update context with any new information
        if (result.context && typeof context === 'object' && context !== null) {
          Object.assign(context, result.context)
        }

        if (result.applied && result.success && result.result) {
          core.info(`✅ ${tactic.name}: ${result.message || 'Success'}`)
          return result.result
        } else if (result.applied && !result.success) {
          core.debug(`❌ ${tactic.name}: ${result.message || 'Failed'}`)
        } else {
          core.debug(`⏭️ ${tactic.name}: ${result.message || 'Not applied'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        core.debug(`❌ ${tactic.name}: Error - ${errorMessage}`)
        // Continue to next tactic on error
      }
    }

    throw new Error(`All ${this.tactics.length} tactics in plan exhausted`)
  }
}
```

### ObjectiveTactic and PlanTactic

```11:23:/Users/bahulneel/Projects/bahulneel/action-version/src/tactics/ObjectiveTactic.ts
export class ObjectiveTactic<T, C, TConfig, TStrategy extends Strategy> implements Tactic<T, C> {
  public readonly name: string
  private readonly strategy: TStrategy

  constructor(
    private objective: Objective<TConfig, TStrategy>,
    private config: TConfig,
    private strategicCommandName: Exclude<keyof TStrategy, 'name'> & string,
    name?: string
  ) {
    this.strategy = this.objective.strategise(this.config)
    this.name = name || `ObjectiveTactic(${this.strategy.name}.${this.strategicCommandName})`
  }
```

```8:49:/Users/bahulneel/Projects/bahulneel/action-version/src/tactics/PlanTactic.ts
export class PlanTactic<T, C> implements Tactic<T, C> {
  public readonly name: string

  constructor(private plan: TacticalPlanInterface<T, C>) {
    this.name = `${this.plan.name}Tactic`
  }

  public async attempt(context: C): Promise<TacticResult<T, C>> {
    try {
      core.debug(`🎯 Attempting plan tactic: ${this.name}`)

      const result = await this.plan.execute(context)

      return {
        applied: true,
        success: true,
        result,
        message: `Plan executed successfully`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.debug(`❌ ${this.name}: Error - ${errorMessage}`)

      return {
        applied: true,
        success: false,
        message: `Plan execution failed: ${errorMessage}`,
      }
    }
  }
}
```

### Objectives (Config → Strategy)

Objectives resolve a concrete strategy from configuration:

```1:9:/Users/bahulneel/Projects/bahulneel/action-version/src/types/objectives.ts
export interface Objective<TConfig, TStrategy> {
  strategise(config: TConfig): TStrategy
}
```

Example: Commit formatting sub-objective selects a `Format` strategy:

```10:19:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Commit/strategies/Format.ts
export class Format {
  static strategise(config: Config): FormatCommitStrategy {
    switch (config.commitFormat) {
      case 'conventional':
        return new Conventional()
      case 'template':
        return new Template(config.commitMsgTemplate, config.depCommitMsgTemplate)
      default:
        throw new Error(`Unknown commit format: ${config.commitFormat}`)
    }
  }
}
```

## How Strategies Compose Tactics (Examples)

### Commit Strategy

The high-level Commit strategy composes multiple tactical plans and sub-objectives for parsing and formatting:

```19:34:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Commit/Strategy.ts
export class Strategy implements CommitStrategy {
  public readonly name = 'commit'
  private parsingPlan: TacticalPlan<CommitInfo[], ParseCommitsContext>
  private formatVersionPlan: TacticalPlan<string, FormatVersionContext>
  private formatDependencyPlan: TacticalPlan<string, FormatDependencyContext>

  constructor(config: Config) {
    // Parsing plan with tactics
    this.parsingPlan = new TacticalPlan(
      [new ConventionalCommitTactic(), new BestGuessCommitTactic()],
      'CommitParsing',
      'Parse commits using conventional or heuristic tactics'
    )
```

```33:58:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Commit/Strategy.ts
    // Format version plan with objective tactic
    this.formatVersionPlan = new TacticalPlan(
      [new ObjectiveTactic(Format, config, 'formatVersion', 'FormatVersion')],
      'FormatVersion',
      'Format version commit messages'
    )

    // Format dependency plan with objective tactic
    this.formatDependencyPlan = new TacticalPlan(
      [new ObjectiveTactic(Format, config, 'formatDependency', 'FormatDependency')],
      'FormatDependency',
      'Format dependency commit messages'
    )
  }
```

### Reference Tactics

Discovery and branch workflows use discrete tactics (e.g., preparing git state):

```16:23:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Reference/tactics/SetupGit.ts
export class SetupGitTactic implements Tactic<GitSetupResult, GitSetupContext> {
  public readonly name = 'SetupGit'

  public assess(context: GitSetupContext): boolean {
    return Boolean(context.branchTemplate)
  }
```

Representative tactics in `src/strategies/Reference/tactics/`:

- `SetupGit.ts` – repository setup and unshallowing
- `merge-base.ts` – merge-base discovery
- `last-version-commit.ts` / `diff-based-version-commit.ts` – version commit discovery
- `MostRecentTag.ts` / `HighestVersionTag.ts` – tag heuristics
- `execute-plan.ts`, `VersionCommit.ts`, `fallback-version-commit.ts` – orchestration utilities

### Branch Cleanup Objective

Branch cleanup is modelled as an objective that selects a cleanup strategy and exposes a `perform` command. Strategy selection is a placeholder in the current refactor and will resolve to concrete implementations:

```23:31:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Reference/BranchCleanup.ts
export interface BranchCleanupInterface extends Strategy {
  perform(
    branches: GitBranches,
    versionedBranch: string,
    templateRegex: RegExp,
    rootBump: BumpType
  ): Promise<void>
}
```

## Version and Reference Objectives (WIP)

Version and Reference are defined as objectives that will resolve to concrete strategies based on config; these are under active implementation and currently throw while wiring is completed:

```8:23:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Version.ts
export class Version {
  static strategise(config: Config): VersionStrategy {
    switch (config.bumpStrategy) {
      case 'do-nothing':
        // TODO: Import and return DoNothingStrategy
        throw new Error('DoNothingStrategy not yet implemented')
      case 'apply-bump':
        // TODO: Import and return ApplyBumpStrategy
        throw new Error('ApplyBumpStrategy not yet implemented')
      case 'pre-release':
        // TODO: Import and return PreReleaseStrategy
        throw new Error('PreReleaseStrategy not yet implemented')
      default:
        throw new Error(`Unknown bump strategy: ${config.bumpStrategy}`)
    }
  }
}
```

```8:18:/Users/bahulneel/Projects/bahulneel/action-version/src/strategies/Reference.ts
export class Reference {
  static strategise(config: Config): ReferenceStrategy {
    // Determine strategy based on configuration
    if (config.baseBranch) {
      // TODO: Import and return BaseBranchStrategy
      throw new Error('BaseBranchStrategy not yet implemented')
    } else {
      // TODO: Import and return TagStrategy (fallback)
      throw new Error('TagStrategy not yet implemented')
    }
  }
}
```

## Practical Benefits

- Reduced internal conditional complexity inside strategies
- High reuse: tactics can be shared across strategies and plans
- Improved testing: tactics and plans are unit-testable in isolation
- Extensibility: add new tactics without modifying existing ones

## Usage Patterns

Pattern for composing a strategy from tactics:

```ts
const plan = new TacticalPlan([tacticA, tacticB, tacticC], 'MyPlan', 'Do X using A→B→C')
const result = await plan.execute(context)
```

Pattern for delegating to a sub-objective:

```ts
const plan = new TacticalPlan(
  [new ObjectiveTactic(SubObjective, config, 'someCommand', 'SomeCommand')],
  'SubObjectivePlan'
)
```

## Notes on Conventions

- Base strategy shapes are defined as TypeScript interfaces in `src/types/strategies/*`.
- Strategy implementations expose a `name` and domain-specific commands.
- Tactics follow `assess(context) → attempt(context)`; results may enrich `context`.
- Prefer `undefined` over `null` in types; use `null` only when it is semantically distinct.

## Further Reading

- Strategy/Tactic motivation and design: [Medium: When Your Strategy Needs a Strategy](https://medium.com/gitconnected/when-your-strategy-needs-a-strategy-tactical-error-or-unfinished-business-e42129792032)
