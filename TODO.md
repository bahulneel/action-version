# TODO: Fix Simplified Version Bump Logic

## Critical Bugs Identified in Scenario Analysis

### 1. Replace Version Handling with Semver Package
**Issue:** Multiple version-related bugs due to fragile custom version parsing
- `getVersionAtCommit()` returns `null` for missing versions
- `calculateBumpType()` crashes on undefined values
- Missing version initialization
- Reference version fallback issues

**Fix:** Use semver package for ALL version operations (format: 1.1.0-1, 1.1.0-2, etc.)
```javascript
const semver = require('semver');

// All version operations use semver directly
function initializeVersion(version) {
  return semver.coerce(version) || '0.0.0';
}

function calculateBumpType(fromVersion, toVersion) {
  const from = semver.coerce(fromVersion) || '0.0.0';
  const to = semver.coerce(toVersion) || '0.0.0';
  return semver.diff(from, to); // 'major', 'minor', 'patch', 'prerelease', null
}

function getNextVersion(currentVersion, commitBasedBump, historicalBump) {
  const current = semver.coerce(currentVersion) || '0.0.0';
  
  if (commitBasedBump === historicalBump) {
    // Same bump type - use prerelease with numeric identifier
    if (semver.prerelease(current)) {
      return semver.inc(current, 'prerelease'); // 1.1.0-1 → 1.1.0-2
    } else {
      return semver.inc(current, 'prerelease', '1'); // 1.1.0 → 1.1.0-1
    }
  } else {
    // Different bump type - normal semver bump
    return semver.inc(current, commitBasedBump);
  }
}

function isDepCompatible(depSpec, newVersion) {
  try {
    return semver.satisfies(newVersion, depSpec);
  } catch {
    return false;
  }
}

// Reference version fallback
referenceVersion = semver.coerce(referenceVersion || rootPkg.version) || '0.0.0';
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

### Scenario 3: Same-Type Incremental Changes
- Target branch: 1.0.0, Active branch: 1.1.0 (minor bump already applied)
- New minor changes made since 1.1.0 bump
- Expected result: Package bumped from 1.1.0 → 1.1.0-1 (prerelease for incremental minor)

## Changes Required in index.cjs

- [ ] Replace all version operations with semver package functions
- [ ] Update `getVersionAtCommit()` to use `semver.coerce()` with '0.0.0' fallback
- [ ] Replace `calculateBumpType()` with `semver.diff()` 
- [ ] Replace `bumpVersion()` with `getNextVersion()` using semver prerelease logic
- [ ] Update `isDepCompatible()` to use `semver.satisfies()`
- [ ] Update reference version fallback to use `semver.coerce()`
- [ ] Add version initialization using `semver.coerce()` in main package loop
- [ ] Improve error logging in `getLastVersionChangeCommit()`
- [ ] Create `getRootOnlyCommits()` function to exclude workspace directories
- [ ] Update root package processing to use root-only commit detection