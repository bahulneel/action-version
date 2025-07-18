# ESLint Configuration

This project uses ESLint with the [@antfu/eslint-config](https://github.com/antfu/eslint-config) library for code quality and consistency.

## Setup

The ESLint configuration is in `eslint.config.js` at the root of the project. It's configured specifically for:

- CommonJS Node.js code
- GitHub Actions environment
- Strategy pattern implementations

## Usage

### Check for issues

```bash
npm run lint
```

### Fix issues automatically

```bash
npm run lint:fix
```

## Configuration Details

The configuration includes:

- **Node.js support**: Enabled for server-side code
- **CommonJS compatibility**: Allows `require()` statements
- **GitHub Actions**: Allows console statements for logging
- **Strategy patterns**: Allows unused parameters with underscore prefix
- **Flexible formatting**: Disabled strict formatting rules for CommonJS style

## Rules

Key rules that are disabled or modified:

- `node/prefer-global/process`: Off (CommonJS uses global process)
- `no-undef`: Warning (for functions defined elsewhere)
- `no-template-curly-in-string`: Off (for template strings)
- `unused-imports/no-unused-vars`: Error with underscore prefix pattern
- `no-unused-vars`: Off (replaced by unused-imports rule)

## Ignored Files

The following files/directories are ignored:

- `node_modules/`
- `dist/`
- `coverage/`
- `.git/`
- `*.min.js`
- `action.yml`
