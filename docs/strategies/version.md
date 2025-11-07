# Version Objective Architecture

Kind: Environment‑selected Objective (selects among simple strategies)

- Objective: `Version` selects a version bump strategy from configuration (`do‑nothing`, `apply‑bump`, `pre‑release`).
- Strategy surface:
  - `execute(currentVersion, commitBasedBump, historicalBump)` → next version or `null`.
- Orchestration:
  - Typically no composite orchestration; each concrete strategy is a single, clear algorithm.
  - Pre‑release variants may compose internal utility tactics if needed, but the strategy surface remains simple.
- Types:
  - Base interfaces live under `types/strategies/version.ts`.
- Layout:
  - `src/strategies/Version.ts` (objective) switches by configured strategy name and returns the concrete version strategy.
  - `src/strategies/Version/*` contains the concrete implementations (e.g., ApplyBump, DoNothing, PreRelease).

Design intent: keep selection explicit and strategies small; avoid putting selection logic inside strategies.

