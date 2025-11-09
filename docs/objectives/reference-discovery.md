## Objective: ReferenceDiscovery

- Goals:
  - findReferencePoint
- Strategy selection:
  - If `config.discovery.kind === 'tag'` → TagDiscovery
  - If `config.discovery.kind === 'base-branch'` → BaseBranchDiscovery
- Strategies:
  - TagDiscovery
    - findReferencePoint:
      - Tactics: ReadLatestSemverTag → VerifyTagCommit → SetFlags
  - BaseBranchDiscovery
    - findReferencePoint:
      - Tactics: LocateMergeBase → GatherCommits → SetFlags




