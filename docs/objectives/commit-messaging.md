## Objective: CommitMessaging

- Goals:
  - parseCommits
  - formatVersion
  - formatDependency
- Strategy selection:
  - If policy === 'conventional' → Conventional
  - Else → Simple
- Strategies:
  - Conventional
    - parseCommits:
      - Tactic: ParseConventionalLog
    - formatVersion:
      - Tactic: FormatConventionalVersion
    - formatDependency:
      - Tactic: FormatConventionalDependency
  - Simple
    - parseCommits:
      - Tactic: ParseSimpleLog
    - formatVersion:
      - Tactic: FormatSimpleVersion
    - formatDependency:
      - Tactic: FormatSimpleDependency




