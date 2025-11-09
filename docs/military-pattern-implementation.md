## Military Pattern – Local Implementation Guide

This document describes how we implement the Military Pattern in this repository: how to name, where to place files, and how the types map to our code.

### Folder Structure

Rooted under `src/objectives/{Objective}/`:

```
src/objectives/
  {Objective}/
    {Objective}.ts                // The objective entry point (declares goals, selects approach)
    strategies/
      {Strategy}.ts               // Concrete implementation class (optional `Strategy` suffix)
    maneuvers/
      {Maneuver}.ts               // Orchestration units (maps to TacticalPlan)
    tactics/
      {Tactic}.ts                 // Atomic assess/attempt actions
    {sub-objective}/              // Nested objective (if decomposition requires)
      {Strategy}.ts
      maneuvers/
      tactics/
```

Guidelines:

- Strategy files/classes use domain names; the `Strategy` suffix is optional locally (keep it when exporting/shared).
- Each strategy implements the objective’s `Goals` interface.
- Maneuvers compose tactics; they do not embed branching logic across steps.
- Tactics implement assess/attempt and return structured results for non‑critical paths.

### Types Mapping

- Objective: `src/types/objectives.ts` (generic shape)
- Strategy identity: `src/types/strategy.ts` (`name`, `description?`)
- Tactics and Plan: `src/types/tactics.ts` (`Tactic`, `TacticResult`, `TacticalPlanInterface`)
- Domain types: `src/types/core.ts` and related

We use these type modules to define the contracts; implementations live under `src/objectives/{Objective}/...`.

### Naming Conventions

- Objective folder and file names are domain‑centric (e.g., `Versioning/Versioning.ts`).
- Goals interface is named after the objective with `Goals` suffix (e.g., `VersionGoals`).
- Strategy classes may omit the `Strategy` suffix in local scope; use it where ambiguity or cross‑domain reuse exists.
- Maneuver files should read like plans (e.g., `ComputeNextVersion.ts`).
- Tactics are imperative verb phrases (e.g., `ParseCommits.ts`, `ApplyPrereleaseRules.ts`).

### Objective Shape (reference)

```ts
export interface Objective<Context, Goals> {
  strategise(context: Context): Strategy<Goals>
}
```

The returned implementation must fully satisfy `Goals`. The objective selects an implementation based on configuration/policy and returns it (e.g., using a field like `config.versioning.approach`).

### Strategy Type

```ts
// Strategy type: identity + the goals it must satisfy
type Strategy<Goals> = { name: string } & Goals
```

### Example

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

### Execution Flow

1. Objective receives context and chooses an implementation.
2. Objective returns a strategy (concrete class) that implements `Goals`.
3. Strategy methods delegate to maneuvers.
4. Maneuvers orchestrate tactics.
5. Tactics assess and attempt, reporting `TacticResult` without throwing for non‑critical paths.

### Migration Notes

- New work should follow this structure under `src/objectives/`.
- Existing strategies under `src/strategies/` can be migrated incrementally:
  - Move implementation into `src/objectives/{Objective}/strategies/`.
  - Introduce a `{Objective}.ts` entry that returns the selected implementation.
  - Extract orchestration into `maneuvers/` and fine‑grained steps into `tactics/`.
