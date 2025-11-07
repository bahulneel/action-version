# When Your Strategy Finally Gets Its Tactics: Objectives, Plans, and Real-World Code

## _A follow‑up to “When Your Strategy Needs a Strategy” — this time with a working implementation and a reified Objective._

Strategies are great at eliminating switch statements; they are not great at eliminating the branching that inevitably creeps inside the strategy itself. In the previous essay, I argued that the missing layer is tactics — small, composable units that carry both their applicability and their execution. In this follow‑up, I’ll show how I ship that idea in production code, and why I added a third ingredient: the Objective.

Working implementation: `action-version` — a TypeScript GitHub Action that bumps package versions using Conventional Commits and clean architecture. The repo is public and evolves alongside these ideas: `https://github.com/bahulneel/action-version`.

### The Triad: Strategy, Tactic, Objective

- Strategy: the public face and contract. It names the domain and exposes domain‑level operations (e.g., `parseCommits`, `formatVersion`).
- Tactic: the atomic execution unit. It answers two questions together: “Do I apply?” and “What do I do?”
- Objective: a reified bridge from configuration to a concrete strategy. It is an explicit factory with a name, not a hidden new‑call. This keeps selection logic out of strategies and out of callers.

I like to think of it this way: Strategy is intent, Tactics are means, Objective is alignment. Without an Objective, strategy selection logic leaks into places it doesn’t belong; without Tactics, conditional complexity migrates inside strategies.

### Tactics: Assess + Attempt

A tactic must be brutally honest about applicability and outcome. It does not throw for non‑critical paths; it returns what happened.

```ts
export interface TacticResult<T = unknown, C = unknown> {
  applied: boolean
  success: boolean
  result?: T
  context?: Partial<C>
  message?: string
}

export interface Tactic<T, C> {
  name: string
  assess(context: C): boolean
  attempt(context: C): Promise<TacticResult<T, C>>
}
```

- assess: “Should I even try?”
- attempt: “I tried; here’s what happened.”
- context: carry forward new knowledge (merge‑into, don’t replace) to help later tactics.

### Tactical Plans: Orchestration Without Branches

A TacticalPlan is a simple, ordered pipeline of tactics with stop‑on‑success semantics:

- Evaluate each tactic’s `assess`.
- Run `attempt` for applicable ones.
- Merge context changes.
- Stop on the first successful result.
- Continue on failure without exploding the call stack with exceptions.

```ts
const plan = new TacticalPlan([
  new ConventionalCommitTactic(),
  new BestGuessCommitTactic(),
], 'CommitParsing', 'Parse commits by convention or best guess')

const commits = await plan.execute({ logEntries, sinceRef })
```

### Objectives: Config → Strategy (Explicitly)

Objectives own the translation from configuration to an actual strategy implementation.

```ts
export interface Objective<TConfig, TStrategy> {
  strategise(config: TConfig): TStrategy
}

// Example: commit formatting is a sub‑objective under Commit
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

This reification matters because it gives the selection logic a real place to live, named and testable. It also keeps strategies thin: they orchestrate; they don’t pick themselves.

### Strategies as Composition of Plans and Sub‑Objectives

In `action-version`, the Commit strategy composes parsing and formatting via plans and the `Format` objective:

```ts
export class CommitStrategy implements Commit {
  public readonly name = 'commit'

  private parsingPlan = new TacticalPlan(
    [new ConventionalCommitTactic(), new BestGuessCommitTactic()],
    'CommitParsing',
    'Parse commits using conventional or heuristic tactics'
  )

  private formatVersionPlan: TacticalPlan<string, FormatVersionContext>
  private formatDependencyPlan: TacticalPlan<string, FormatDependencyContext>

  constructor(config: Config) {
    this.formatVersionPlan = new TacticalPlan(
      [new ObjectiveTactic(Format, config, 'formatVersion', 'FormatVersion')],
      'FormatVersion',
      'Format version commit messages'
    )

    this.formatDependencyPlan = new TacticalPlan(
      [new ObjectiveTactic(Format, config, 'formatDependency', 'FormatDependency')],
      'FormatDependency',
      'Format dependency commit messages'
    )
  }

  parseCommits(ctx: ParseCommitsContext) {
    return this.parsingPlan.execute(ctx)
  }

  formatVersion(ctx: FormatVersionContext) {
    return this.formatVersionPlan.execute(ctx)
  }

  formatDependency(ctx: FormatDependencyContext) {
    return this.formatDependencyPlan.execute(ctx)
  }
}
```

Note the absence of conditionals inside the strategy methods. Decisions live in tactics and objectives.

### Reference Workflows as Tactics

Reference discovery (merge‑base, last version commit, tag heuristics) is a perfect fit for tactics. Each heuristic is a tactic; a plan orders them. A small setup tactic (`SetupGit`) prepares the repo state without polluting discovery logic.

- SetupGit → merge‑base → last‑version‑commit → diff‑based‑version‑commit → tag heuristics
- The first successful tactic returns the reference point; others are skipped.

### The File Layout (Designed for Reading First)

```
src/strategies/
├── Commit.ts                # Objective: Config → Commit strategy
├── Commit/                  # Strategy implementation
│   ├── Strategy.ts          # Composite strategy
│   ├── tactics/             # Atomic commit tactics (parse, etc.)
│   └── strategies/          # Sub‑objectives (Format) and implementations
├── Reference.ts             # Objective: Config → Reference strategy
├── Reference/
│   ├── BranchCleanup.ts     # Objective for cleanup strategy
│   └── tactics/             # Discovery/cleanup tactics
├── Version.ts               # Objective: Config → Version strategy (WIP wiring)
└── ...
```

And the base shapes live under `src/types/strategies/*` as TypeScript interfaces. Implementation classes carry the `Strategy` suffix; the base remains an interface. This keeps coupling light and intent obvious.

### Error Handling Philosophy

- Tactics only throw for genuinely critical failures (infrastructure meltdown, invariants).
- Non‑critical “not me” or “tried and failed” surfaces via `TacticResult`.
- Plans keep moving until a tactic succeeds or all are exhausted.

This makes failure a first‑class control flow, not a side‑channel.

### Testing the Right Things

- Tactics: pure, isolated, tiny surface area. Great unit test ROI.
- Plans: orchestration and stop‑on‑success semantics. A few cases cover a lot.
- Objectives: selection correctness under different configs.
- Strategies: thin integration tests that assert wiring, not branching.

### Practical Guidelines

- Keep strategies declarative; put decisions in tactics.
- Reify selection with Objectives. The path from `Config` to concrete strategy should be explicit and named.
- Prefer `undefined` to mean “absent”; use `null` only when “intentionally nothing” matters semantically.
- Avoid the `Implementation` suffix — it’s noise. Interfaces define shape; classes carry concrete names (with `Strategy` reserved for implementations, if needed).
- Make a root file per folder (named like the folder) to provide a regular module interface.

### What This Buys You

- Lower internal cyclomatic complexity
- Reusable building blocks (tactics) across strategies
- A strategy surface that remains small even as behavior grows
- A codebase that reads top‑down: objective → strategy → plans → tactics

### Where to See It Working

The full, working implementation lives here: `https://github.com/bahulneel/action-version`.

- Commit strategy composes parsing + formatting with plans and sub‑objectives.
- Reference tactics model discovery as an ordered, failure‑tolerant search.
- Branch cleanup is an objective that will wire concrete keep/prune/semantic strategies.

### Closing the Loop

If Strategy helped us eliminate switch statements, Strategy + Tactics + Objectives help us eliminate the impulse to hide branching where readers can’t see it. We don’t just remove conditionals — we relocate them into named, composable units that wear their intent on the type.

The result isn’t merely “cleaner code.” It’s a system that reflects how people think and work: pick an approach (Objective), state intent (Strategy), and adapt through discrete, testable moves (Tactics).


