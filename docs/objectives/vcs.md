## Objective: Vcs

- Goals:
  - setup
  - commitVersionChange
  - commitDependencyUpdate
  - tagVersion
  - prepareVersionBranch
- Strategy selection:
  - Default: Git
- Strategies:
  - Git
    - setup:
      - Maneuver: PrepareEnvironment (configure user, fetch/unshallow, temp ref)
    - commitVersionChange:
      - Tactics: FormatVersionMessage → Commit
    - commitDependencyUpdate:
      - Tactics: FormatDependencyMessage → Commit
    - tagVersion:
      - Tactic: CreateAnnotatedTag (or Noop if disabled)
    - prepareVersionBranch:
      - Maneuver: EnsureVersionBranch




