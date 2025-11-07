# Action Version

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Compatible-green.svg)](https://github.com/features/actions)
[![SOLID Principles](https://img.shields.io/badge/Architecture-SOLID-orange.svg)](https://en.wikipedia.org/wiki/SOLID)

A robust GitHub Action for automated version bumping and dependency management in monorepos using Conventional Commits. Built with TypeScript, clean architecture, and SOLID design principles.

## ✨ Features

- 🔄 **Automated Version Bumping** using Conventional Commits
- 📦 **Monorepo Support** with dependency graph resolution
- 🎯 **Multiple Strategies** for version bump handling
- 🌿 **Branch Management** with configurable cleanup strategies
- 🧪 **Prerelease Support** with automatic finalization
- 📊 **Comprehensive Reporting** with GitHub Actions summaries
- 🔧 **Package Manager Detection** (NPM, Yarn, PNPM)
- ⚡ **Type-Safe Architecture** with full TypeScript support

## 🏗️ Architecture

This project follows clean architecture principles with a modular, extensible design:

### Strategy Patterns

- **Version Bump Strategies**: `do-nothing`, `apply-bump`, `pre-release`
- **Branch Cleanup Strategies**: `keep`, `prune`, `semantic`
- **Git Operation Strategies**: `conventional`, `simple`
- **Package Manager Strategies**: `npm`, `yarn`, `pnpm`

### Service Layer

- **Configuration Service**: Input parsing and validation
- **Version Bump Service**: Process orchestration
- **Discovery Service**: Git reference point detection
- **Summary Service**: Results formatting and reporting

### Domain Model

- **Package Class**: Rich domain model with encapsulated behavior
- **Type-Safe Operations**: Compile-time guarantees for all operations
- **Immutable Data Structures**: Readonly types for configuration

## 📋 Usage

```yaml
name: Version Bump
on:
  push:
    branches: [main, develop]

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Version Bump
        uses: ./
        with:
          strategy: 'apply-bump'
          base: 'main'
          branch: 'develop'
          create_branch: true
          branch_cleanup: 'semantic'
          tag_prereleases: true
```

## ⚙️ Configuration

### Inputs

| Input                               | Description                                                         | Default                                                                    | Required |
| ----------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| `strategy`                          | Version bump strategy (`do-nothing`, `apply-bump`, `pre-release`)   | `do-nothing`                                                               | No       |
| `base`                              | Base branch for comparison                                          | `main`                                                                     | No       |
| `branch`                            | Active development branch                                           | `develop`                                                                  | No       |
| `create_branch`                     | Create version-specific branches                                    | `false`                                                                    | No       |
| `branch_template`                   | Template for versioned branch name (e.g., `release/v${version}`)    | none                                                                       | No       |
| `branch_cleanup`                    | Branch cleanup strategy (`keep`, `prune`, `semantic`)               | `keep`                                                                     | No       |
| `tag_prereleases`                   | Create tags for prerelease versions; tag prereleases only when true | `false`                                                                    | No       |
| `commit_template`                   | Commit message template                                             | `chore(release): bump ${package} to ${version} (${bumpType})`              | No       |
| `dependency_commit_template`        | Dependency update commit template                                   | `chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)` | No       |
| `tactic_mergebase_lookbackcommits`  | Max commits to search for merge-base (advanced)                     | none                                                                       | No       |
| `tactic_lastversioncommit_maxcount` | Max commits to search for last version change (advanced)            | none                                                                       | No       |

### Outputs

| Output                | Description                             |
| --------------------- | --------------------------------------- |
| `packages-updated`    | Number of packages updated              |
| `releases-created`    | Number of release versions created      |
| `prereleases-created` | Number of prerelease versions created   |
| `versions-finalized`  | Number of prerelease versions finalized |
| `test-failures`       | Number of packages that failed tests    |
| `strategy-used`       | Strategy that was used                  |
| `changes-made`        | Boolean indicating if changes were made |
| `branch`              | Branch that was created or updated      |

## 🔧 Development

### Prerequisites

- Node.js 20+
- TypeScript 5.0+

### Setup

```bash
npm install
npm run build
```

### Scripts

```bash
npm run build        # Build TypeScript and bundle
npm run build:tsc    # TypeScript compilation only
npm run dev          # Watch mode for development
npm run lint         # ESLint checking
npm run type-check   # TypeScript type checking
npm run clean        # Clean build artifacts
```

### Project Structure

```
src/
├── types/               # Type definitions
├── strategies/          # Strategy implementations (TypeScript)
│   ├── Version/         # Version bump strategies (ApplyBump, DoNothing, PreRelease)
│   ├── Reference/       # Reference discovery & BranchCleanup (keep-all, prune-old, semantic)
│   ├── Commit/          # Commit parsing and formatting strategies
│   ├── Output/          # Summary/output strategies
│   └── Package/         # Package manager strategies (npm, yarn, pnpm)
├── domain/              # Domain models (e.g., Package)
├── services/            # Orchestration services (configuration, version-bump, discovery, summary)
├── utils/               # Utilities (git, workspace, versioning, templates)
└── index.ts             # Main entry point
```

Note: Compiled strategy factories resolve under `dist/strategies/*` at build time. Source organization in `src/strategies/*` differs from the compiled output paths.

## 📈 Version Bump Strategies

### Do Nothing (`do-nothing`)

Skips version bumps when the same bump type is detected. Useful for preventing duplicate bumps.

### Apply Bump (`apply-bump`)

Applies normal semantic version increments. Always increments version based on conventional commits.

### Pre-release (`pre-release`)

Creates prerelease versions (e.g., `1.2.0-0`, `1.2.0-1`) that can later be finalized to stable releases.

## 🌿 Branch Management

### Keep All (`keep`)

Preserves all version branches. Safest option with no automatic cleanup.

### Prune Old (`prune`)

Removes all old version branches except the current one. Keeps workspace clean.

### Semantic (`semantic`)

Keeps branches with different bump types while cleaning up duplicates of the same type.

## 🧪 Conventional Commits

This action uses [Conventional Commits](https://www.conventionalcommits.org/) to determine version bumps:

- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `feat!:` or `BREAKING CHANGE:` → Major version bump
- Other types (`docs:`, `style:`, etc.) → Patch version bump

## 📊 Monorepo Support

Automatically detects monorepo structure via:

- `workspaces` field in root `package.json`
- Lerna configuration
- Yarn/PNPM workspace configuration

Features:

- Dependency graph resolution
- Topological sorting for build order
- Cross-package dependency updates
- Compatibility testing for major version bumps

## 🔍 Package Manager Detection

Automatically detects and uses the appropriate package manager:

1. **Yarn** (if `yarn.lock` exists)
2. **PNPM** (if `pnpm-lock.yaml` exists)
3. **NPM** (fallback)

Each package manager strategy includes:

- Dependency installation
- Test execution
- Lock file validation

## 🎨 TypeScript & Architecture

This project showcases modern TypeScript development with:

### Type Safety

- Comprehensive type definitions for all domain concepts
- Strict TypeScript configuration with `exactOptionalPropertyTypes`
- Runtime type validation with compile-time guarantees
- Generic factory patterns for type-safe strategy creation

### SOLID Principles

- **Single Responsibility**: Each class has one clear purpose
- **Open/Closed**: Strategy patterns allow extension without modification
- **Liskov Substitution**: All strategies are interchangeable
- **Interface Segregation**: Focused interfaces for specific concerns
- **Dependency Inversion**: High-level modules depend on abstractions

### Clean Architecture

- Domain layer with rich business logic
- Service layer for orchestration
- Infrastructure layer for external dependencies
- Clear separation of concerns

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! The modular architecture makes it easy to:

- Add new version bump strategies
- Implement additional package managers
- Extend branch management options
- Improve git operation strategies

Please ensure all contributions include:

- TypeScript type definitions
- Unit tests for new functionality
- Documentation updates
- Adherence to existing code patterns

## 📚 Documentation

- [Strategy Patterns](docs/strategy-patterns.md) - Detailed strategy pattern documentation
- [Conversion Summary](CONVERSION_SUMMARY.md) - TypeScript conversion details
- [Architecture Guide](src/README.md) - Technical architecture overview
