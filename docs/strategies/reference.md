# Reference Objective Architecture

Kind: Heuristic Plan (strategy as an ordered set of tactics)

- Objective: `Reference` selects a discovery approach (base‑branch vs tag‑based) depending on configuration.
- Strategy surface:
  - `findReferencePoint(baseBranch, activeBranch)` computes the version reference point.
- Orchestration:
  - Discovery is modelled as a plan of tactics, each encapsulating one heuristic: merge‑base detection, last version commit, diff‑based version commit, tag heuristics, etc.
  - Setup tactics (e.g., repository configuration) prepare the environment without polluting discovery logic.
- Tactics role:
  - Each tactic declares applicability and returns either a successful reference point or a non‑applied/failed result; the plan continues until one succeeds.
- Types:
  - Base interfaces live under `types/strategies/reference.ts` and `types/strategies/reference/*`.
- Layout:
  - `src/strategies/Reference.ts` (objective) wires to a discovery strategy (base‑branch or tag).
  - `src/strategies/Reference/tactics/*` contains concrete discovery and setup tactics.
  - Optional cleanup objective: `Reference/BranchCleanup.ts` selects a cleanup strategy (`keep‑all`, `prune‑old`, `semantic`).

Design intent: keep discovery adaptive and failure‑tolerant by composing small, focused heuristics as tactics.

