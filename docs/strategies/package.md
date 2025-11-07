# Package Objective Architecture

Kind: Environment‑selected Objective (runtime detection)

- Objective: `Package` selects a package manager strategy (npm, yarn, pnpm) based on environment (lockfiles) or configuration.
- Strategy surface:
  - `isAvailable()` probes availability.
  - `install(packageDir)` installs dependencies.
  - `test(packageDir)` executes tests and reports outcomes.
- Orchestration:
  - No composite orchestration; each concrete strategy provides the same capabilities for its toolchain.
- Types:
  - Base interfaces live under `types/strategies/package.ts`.
- Layout:
  - `src/strategies/Package.ts` (objective) detects the manager and returns a concrete strategy.
  - `src/strategies/Package/*` contains manager‑specific strategies.

Design intent: standardize capabilities across package managers and select them explicitly via the objective.

