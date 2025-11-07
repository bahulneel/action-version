# Contributing Guide

## Prerequisites

- Node.js 20+
- npm 9+ (or your local version bundled with Node 20+)
- TypeScript 5.0+

## Getting Started

```bash
npm install
npm run type-check
npm run build
```

## Scripts

```bash
npm run build        # Build TypeScript and bundle
npm run build:tsc    # TypeScript compilation only
npm run dev          # Watch mode for development
npm run lint         # ESLint checking
npm run type-check   # TypeScript type checking (preferred before PRs)
npm run clean        # Clean build artifacts
```

## Coding Standards

- TypeScript strictness: keep types precise; avoid widening.
- Prefer `undefined` over `null`. Use `null` only to signify a distinct, deliberate absence separate from non-existence.
- Never use `any` unless absolutely necessary; when unavoidable, add an eslint disable with clear justification on the specific line.
- Do not use inline `require`; keep imports at the top of files.
- Naming:
  - Strategy base should be defined via an interface. Classes implementing strategies may use the `...Strategy` suffix.
  - Avoid the `Implementation` suffix as redundant.
  - Class hierarchies follow class-case; modules use kebab-case.
- Tactics:
  - Tactics should only throw for critical failures; non-critical paths should not throw.
  - Strategy instances may share tactics where appropriate.

## Commits

- Use Conventional Commits, e.g.:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `chore(release): bump ${package} to ${version} (${bumpType})`
- For prereleases, bump to the next version and append a single integer starting at 1 (e.g., `0.0.5-1`).

## Type Checking & Linting

- Run `npm run type-check` before pushing.
- Run `npm run lint` and fix reported issues.

## Project Structure (source)

```
src/
├── types/               # Type definitions
├── strategies/          # TS strategy implementations
│   ├── Version/         # Version bump strategies
│   ├── Reference/       # Reference discovery & BranchCleanup
│   ├── Commit/          # Commit parsing & formatting
│   ├── Output/          # Summary/output
│   └── Package/         # Package manager strategies
├── domain/              # Domain models
├── services/            # Orchestration services
├── utils/               # Utilities
└── index.ts             # Entry point
```

Note: Factories for git operations, package managers, and summary live in the compiled output under `dist/strategies/*` and are resolved at runtime.

## Opening PRs

1. Keep changes small and focused.
2. Add/update documentation when changing inputs, outputs, or behavior.
3. Include tests where feasible.
4. Ensure CI passes (type-check, lint, build).

Thanks for contributing!
