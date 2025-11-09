## Objective: Versioning

- Goals:
  - bumpVersion
  - compareVersion
- Strategy selection:
  - If `config.versioning.approach === 'semver'` → Semver
- Strategies:
  - Semver
    - bumpVersion:
      - Maneuver: ComputeNextVersion
      - Tactics: ParseCommits → DeriveBump → ApplyPrereleaseRules (→ FinalizeIfRequired)
    - compareVersion:
      - Direct (trivial comparison)




