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
    # commit-template: 'chore(release): bump ${package} to ${version} (${bumpType})'
    # dependency-commit-template: 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)'
    
    # Optional: configure strategy for same-type incremental changes
    # strategy: 'do-nothing' # 'do-nothing' | 'apply-bump' | 'pre-release'
    
    # Optional: branch workflow
    # create-branch: true
    # base: 'main'
# branch: 'develop'
    
    # Optional: tagging
    # tag-prereleases: false
```

## Inputs

| Name                      | Description                                         | Default                                                        |
|---------------------------|-----------------------------------------------------|----------------------------------------------------------------|
| commit-template           | Commit message template for version bumps           | chore(release): bump ${package} to ${version} (${bumpType})    |
| dependency-commit-template | Commit message template for dependency updates     | chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch) |
| strategy                  | Strategy for same-type incremental changes          | do-nothing                                                     |
| create-branch             | Create a separate branch for version updates        | false                                                          |
| branch-template           | Template for branch name when creating branches     | release/${version}                                             |
| branch-cleanup            | Strategy for cleaning up versioned branches         | keep                                                           |
| base                      | Base branch to compare commits against              | main                                                           |
| branch                    | Active branch for prerelease finalization          | develop                                                        |
| tag-prereleases           | Create git tags for prerelease versions             | false                                                          |

## Strategy Options

The `strategy` input controls how the action handles same-type incremental changes:

- **`do-nothing`** (default): Skip bumping when the required bump type matches the historical bump type
- **`apply-bump`**: Always apply normal semver bumps (1.1.0 → 1.2.0 for minor changes)  
- **`pre-release`**: Use semantically correct prerelease versions (1.1.0 → 1.2.0-0 → 1.2.0-1)

### Prerelease Workflow

When using `strategy: 'pre-release'`:

1. **First incremental change**: 1.1.0 → 1.2.0-0 (applies bump, then makes prerelease)
2. **Subsequent changes**: 1.2.0-0 → 1.2.0-1 → 1.2.0-2 (increments prerelease)
3. **Branch merge**: 1.2.0-2 → 1.2.0 (automatically finalizes when target branch is updated)

## Branch Cleanup Options

The `branch-cleanup` input controls versioned branch management:

- **`keep`** (default): Keep all versioned branches
- **`prune`**: Keep only the latest versioned branch
- **`semantic`**: Keep only branches with the same bump type as the current release

## Requirements
- Node.js 18 or higher

## License
MIT
