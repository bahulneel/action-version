# Strategy Pattern Library

This directory contains the strategy pattern implementations for the version bump action.

## Structure

```
lib/
├── package-managers/          # Package manager strategies
│   ├── base.cjs              # Base PackageManagerStrategy class
│   ├── yarn.cjs              # Yarn package manager strategy
│   ├── npm.cjs               # NPM package manager strategy
│   ├── pnpm.cjs              # PNPM package manager strategy
│   ├── factory.cjs           # PackageManagerFactory
│   └── index.cjs             # Exports all package manager strategies
├── git-operations/           # Git operation strategies
│   ├── base.cjs              # Base GitOperationStrategy class
│   ├── conventional.cjs      # Conventional commit strategy
│   ├── simple.cjs            # Simple commit strategy
│   ├── factory.cjs           # GitOperationStrategyFactory
│   └── index.cjs             # Exports all git operation strategies
└── index.cjs                 # Main lib index, exports all strategies
```

## Usage

### Package Manager Strategies

Package manager strategies encapsulate the behavior for different package managers:

```javascript
const { PackageManagerFactory } = require('./lib/package-managers/factory.cjs')

const packageManager = PackageManagerFactory.getPackageManager()
await packageManager.install('./some-package')
await packageManager.test('./some-package')
```

### Git Operation Strategies

Git operation strategies encapsulate git workflow behaviors:

```javascript
const { GitOperationStrategyFactory } = require('./lib/git-operations/factory.cjs')

const gitStrategy = GitOperationStrategyFactory.getStrategy('conventional')
await gitStrategy.commitVersionChange('./package', 'my-package', '1.0.0', 'patch', template)
await gitStrategy.tagVersion('1.0.0', false, true)
```

## Design Principles

- **Behavior Encapsulation**: Each strategy encapsulates complete behaviors, not just data transformation
- **Command Construction**: Strategies handle command construction and execution internally
- **Separation of Concerns**: Package management and git operations are separate strategy families
- **Factory Pattern**: Factories provide easy access to appropriate strategies
- **Extensibility**: New strategies can be added by implementing the base class and registering with the factory

## Files use .cjs extension

All files use the `.cjs` extension to ensure they work correctly with CommonJS imports in projects that have `"type": "module"` in their package.json.
