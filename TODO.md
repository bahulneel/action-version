# TODO: Fix Simplified Version Bump Logic

## Critical Bugs Identified in Scenario Analysis

### 1. Replace Version Handling with Semver Package
**Issue:** Multiple version-related bugs due to fragile custom version parsing
- `getVersionAtCommit()` returns `null` for missing versions
- `calculateBumpType()` crashes on undefined values
- Missing version initialization
- Reference version fallback issues

**Fix:** Use semver package with custom suffix management (format: 1.1.0-1, 1.1.0-2, etc.)
```javascript
const semver = require('semver');

// Parse version with normalized suffix
function parseVersionWithSuffix(version) {
  const match = version.match(/^(\d+\.\d+\.\d+)(?:-(\d+))?$/);
  if (!match) return null;
  return {
    base: match[1],
    suffix: match[2] ? parseInt(match[2]) : null
  };
}

// Get base version for comparisons
function getBaseVersion(version) {
  const parsed = parseVersionWithSuffix(version);
  return parsed ? parsed.base : semver.coerce(version) || '0.0.0';
}

// Get next suffix version (finds lowest available starting at 1)
async function getNextSuffixVersion(currentVersion, existingVersions) {
  const parsed = parseVersionWithSuffix(currentVersion);
  if (!parsed) return null;
  
  const sameBaseVersions = existingVersions
    .map(v => parseVersionWithSuffix(v))
    .filter(v => v && v.base === parsed.base)
    .map(v => v.suffix || 0);
  
  const maxSuffix = Math.max(0, ...sameBaseVersions);
  return `${parsed.base}-${maxSuffix + 1}`;
}
```

### 5. Handle git log -L Failure Gracefully
**Issue:** `git log -L '/version/:'` silently fails when version field never existed
```javascript
// Add better logging in getLastVersionChangeCommit():
core.debug(`Could not find version change for ${packageJsonPath}: using file creation fallback`);
```

### 6. Fix Root-Only Commit Detection in Workspaces
**Issue:** `getCommitsAffecting(rootDir, ...)` includes workspace commits when analyzing root package
```javascript
// Current broken code:
const rootCommits = await getCommitsAffecting(rootDir, rootLastVersionCommit);
// When rootDir = ".", this includes ALL commits (workspace + root)

// Fix needed - create new function:
async function getRootOnlyCommits(rootDir, workspaceDirs, sinceRef) {
  let range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
  
  // Build pathspec to exclude workspace directories  
  const pathspecs = ['.'];
  for (const wsDir of workspaceDirs) {
    const relativePath = path.relative(rootDir, wsDir);
    pathspecs.push(`:!${relativePath}`);
  }
  
  const log = await git.log([range, '--', ...pathspecs]);
  return parseCommits(log.all, sinceRef);
}

// Usage:
const rootOnlyCommits = await getRootOnlyCommits(rootDir, pkgDirs, rootLastVersionCommit);
```

## Test Scenarios That Should Work After Fixes

### Scenario 1: Missing Version Field
- Target branch: package.json with no version field
- Active branch: 3 patch commits  
- Expected result: Package bumped from 0.0.0 → 0.0.1

### Scenario 2: Workspace Root-Only Changes  
- Target branch version = Active branch version (both 1.0.0)
- No workspace changes, but bump-causing commits outside workspaces
- Expected result: Root package bumped from 1.0.0 → 1.1.0 (workspaces unchanged)

## Changes Required in index.cjs

- [ ] Update `getVersionAtCommit()` to return '0.0.0' for missing versions
- [ ] Update `calculateBumpType()` to handle undefined inputs safely  
- [ ] Add version initialization logic in main package loop
- [ ] Fix reference version fallback to guarantee non-undefined value
- [ ] Improve error logging in `getLastVersionChangeCommit()`
- [ ] Create `getRootOnlyCommits()` function to exclude workspace directories
- [ ] Update root package processing to use root-only commit detection