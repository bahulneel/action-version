# Monorepo Version Bump Action

Automatically bumps versions and updates dependencies in a monorepo or single-package repo using Conventional Commits.

## Features
- Detects monorepo or single-package structure
- Bumps versions based on commit history (Conventional Commits)
- Updates local dependencies and patch-bumps dependents
- Runs tests for breaking changes and fails if any test fails (after all updates)
- Each change is an atomic commit
- Customizable commit message templates
- Node.js 18+ compatible

## Usage

Add this action to your workflow:

```yaml
- uses: bahulneel/action-version@main
  with:
    # Optional: customize commit messages
    # commit-message-template: 'chore(release): bump ${package} to ${version} (${bumpType})'
    # dep-commit-message-template: 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)'
```

## Inputs

| Name                      | Description                                         | Default                                                        |
|---------------------------|-----------------------------------------------------|----------------------------------------------------------------|
| commit-message-template   | Commit message template for version bumps           | chore(release): bump ${package} to ${version} (${bumpType})    |
| dep-commit-message-template | Commit message template for dependency updates     | chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch) |

## Requirements
- Node.js 18 or higher

## License
MIT
