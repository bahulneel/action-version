# Output Objective Architecture

Kind: Environment‑selected Objective (runtime selection)

- Objective: `Output` selects a summary/output strategy (e.g., GitHub Actions summary vs console) based on runtime environment.
- Strategy surface:
  - `generateSummary(results, config)` renders and emits the action summary.
- Orchestration:
  - No composite orchestration; concrete strategies map to output surfaces.
- Types:
  - Base interfaces live under `types/strategies/output.ts`.
- Layout:
  - `src/strategies/Output.ts` (objective) selects based on environment variables (e.g., `GITHUB_ACTIONS`).
  - `src/strategies/Output/*` contains surface‑specific implementations.

Design intent: decouple reporting from business logic and switch output surfaces cleanly via the objective.

