## Military Pattern (Militsty)

The Military Pattern is a structured, goal‑driven abstraction for orchestrating strategies, maneuvers, and tactics to satisfy a defined set of concrete goals. It separates declarative objectives, concrete goals, and the execution hierarchy, while remaining agnostic to implementation details.

---

## Core Components

### 1. Objective

- Represents an entry point to a set of related goals.
- Declares the outcome and constraints in domain terms.
- Provides a `strategise` method that returns a strategy capable of fulfilling the goals, based on configuration/policy.

```ts
export interface Objective<Context, Goals> {
  strategise(context: Context): Strategy<Goals>
}
```

Concrete example:

```ts
// Versioning objective returns a strategy that satisfies VersioningGoals
export const versioning: Objective<Config, VersioningGoals> = {
  strategise(config: Config): Strategy<VersioningGoals> {
    if (config.versioning.approach === 'semver') {
      return new Semver(config.versioning)
    }
    throw new Error('select and return an implementation')
  },
}
```

---

### 2. Goals

- Concrete units of work or requirements to satisfy.
- Expressed as a TypeScript interface defining the contract the strategy must implement.

```ts
interface VersionGoals {
  bumpVersion(version: string, bumpType: 'major' | 'minor' | 'patch'): string
  compareVersion(v1: string, v2: string): number // -1 | 0 | 1
}
```

---

### 3. Strategy

- A concrete implementation that fulfills the goals.
- Each goal implementation (member function) does one of the following:
  - Achieves a goal of a sub-objective
  - Executes a Maneuver
  - Selects and applies a single Tactic
  - Achieves the goal directly, if it's trivial.

Strategy type:

```ts
type Strategy<Goals> = { name: string } & Goals
```

```ts
class Semver implements Strategy<VersionGoals> {
  name = 'semver'
  constructor(private config: VersioningConfig)
  bumpVersion(version: string, bumpType: 'major' | 'minor' | 'patch'): string {
    /* ... */
  }
  compareVersion(v1: string, v2: string): number {
    /* ... */
  }
}
```

---

### 4. Maneuver

- A tactical plan that organizes multiple tactics to satisfy a goal.
- Provides an `execute` method that returns a `ManeuverResult` for consistent handling.
- Supports different execution strategies:
  - **one**: Execute tactics in sequence until one succeeds (fallback behavior)
  - **any**: Execute first matching (assessed) tactic, fail if it doesn't succeed
  - **all**: Execute all tactics and collect results into an array

```ts
export interface Maneuver<T, C> {
  name: string
  description?: string
  execute(context: C): Promise<ManeuverResult<T, C>>
}

export interface ManeuverResult<T, C> {
  success: boolean
  result?: T
  context?: Partial<C>
  message?: string
  tacticResults?: Array<{ tacticName: string; success: boolean; result?: T; message?: string }>
}
```

Create maneuvers using the factory:

```ts
import { maneuver } from '~/maneuver.js'

// Fallback chain: try conventional, fallback to best guess
export const parseCommits = maneuver.one([
  new ConventionalCommitTactic(),
  new BestGuessCommitTactic()
], 'ParseCommits', 'Parse commits with fallback')

// Execute first applicable tactic only
export const selectFormatter = maneuver.any([
  new TemplateFormatterTactic(),
  new DefaultFormatterTactic()
], 'SelectFormatter')

// Run all tactics, collect results
export const gatherMetrics = maneuver.all([
  new CoverageMetricTactic(),
  new PerformanceMetricTactic()
], 'GatherMetrics')
```

---

### 5. Tactic

- An atomic action executed within a maneuver.
- Includes assessment and attempt phases to determine applicability and produce results.
- Should report structured results for non‑critical paths instead of throwing.

```ts
interface Tactic<T, C> {
  name: string
  assess(context: C): boolean
  attempt(context: C): Promise<TacticResult<T, C>>
}
```

---

## Connective Tissue

1. Objectives define scope and provide the entry point.
2. Goals specify what must be satisfied (contract).
3. Strategies are selected based on configuration/policy and realize the goals by composing maneuvers.
4. Maneuvers organize tactics into coherent execution.
5. Tactics perform concrete steps, reporting results.

Flow: Objective → Goals → Strategy → Maneuvers → Tactics

---

## Key Principles

- Interchangeable strategies: Any implementation satisfying the goals can replace another.
- Flexible execution: Maneuvers and tactics encapsulate execution logic, so strategies remain thin coordinators.
- Context‑driven: External context/configuration is fed into `strategise`, `execute`, and `attempt`; the pattern stays agnostic to context shape.
- Prefer `undefined` over `null`; avoid `any` in favor of concrete types or `unknown`.

---

## Rationale and Background

- Objectives express intent; goals capture the contract; strategies realize the contract; maneuvers and tactics eliminate internal branching by composition.
- This aligns with the tactical layer argument: strategies compose tactics through maneuvers rather than embedding sprawling conditionals.
- Further reading: “When Your Strategy Needs a Strategy” ([link](https://medium.com/gitconnected/when-your-strategy-needs-a-strategy-tactical-error-or-unfinished-business-e42129792032)).
