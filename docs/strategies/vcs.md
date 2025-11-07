# VCS Objective Architecture

Kind: Simple Objective → Direct Strategy (currently Git)

- Objective: `Vcs` selects and returns a version control strategy. At present, only Git is supported; future kinds (Mercurial, SVN) can be added.
- Strategy surface:
  - `setup(...)` prepares environment and returns temp refs/metadata for workflows.
  - `commitVersionChange(...)`, `commitDependencyUpdate(...)`, `tagVersion(...)`, `prepareVersionBranch(...)` abstract core VCS operations.
- Orchestration:
  - No composite orchestration at the objective level; the VCS strategy may internally use tactics for reliability, but the surface remains stable.
- Types:
  - Base interfaces live under `types/strategies/vcs.ts`.
- Layout:
  - `src/strategies/Vcs.ts` (objective) returns the Git strategy for now.
  - `src/strategies/Vcs/*` contains the concrete strategy implementation(s).

Design intent: centralize VCS operations behind a strategy interface so higher‑level strategies (Version, Reference) depend only on abstractions.

