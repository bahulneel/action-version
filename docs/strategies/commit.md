# Commit Objective Architecture

Kind: Composite Strategy with sub‑objectives

- Objective: `Commit` resolves a composite strategy that coordinates parsing and formatting.
- Strategy surface:
  - `parseCommits(context)` parses repository log entries.
  - `formatVersion(context)` renders version bump commit messages.
  - `formatDependency(context)` renders dependency update commit messages.
- Orchestration:
  - Parsing plan: ordered tactics (e.g., conventional parsing, best‑guess fallback) with stop‑on‑success.
  - Formatting plans: each delegates to a sub‑objective `Format` that selects a concrete formatting strategy (conventional vs template) and exposes `formatVersion` and `formatDependency` commands.
- Tactics role:
  - Encapsulate specific parsing approaches and their applicability.
  - Return structured outcomes; do not throw for non‑critical paths.
- Types:
  - Base interfaces live under `types/strategies/commit.ts` and define the strategy operations and contexts.
- Layout:
  - `src/strategies/Commit.ts` (objective) → returns the composite strategy.
  - `src/strategies/Commit/Strategy.ts` composes plans and sub‑objectives.
  - `src/strategies/Commit/tactics/*` holds atomic parsing tactics.
  - `src/strategies/Commit/strategies/Format*` holds sub‑objective implementations.

Design intent: keep the strategy declarative and readable; move conditional decisions into tactics and selection into sub‑objectives.

