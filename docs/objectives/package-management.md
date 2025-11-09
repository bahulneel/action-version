## Objective: PackageManagement

- Goals:
  - isAvailable
  - test
  - install
- Strategy selection:
  - If lockfile/env indicates: npm | yarn | pnpm
- Strategies:
  - Npm:
    - Tactics: DetectNpm → RunNpmInstall/Test
  - Yarn:
    - Tactics: DetectYarn → RunYarnInstall/Test
  - Pnpm:
    - Tactics: DetectPnpm → RunPnpmInstall/Test




