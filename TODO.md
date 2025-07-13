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

function getNextVersion(currentVersion, commitBasedBump, historicalBump, strategy) {
  const current = semver.coerce(currentVersion) || '0.0.0';
  
  if (commitBasedBump === historicalBump) {
    // Same bump type - use configured strategy
    switch (strategy) {
      case 'do-nothing':
        return null; // Skip bump
      
      case 'apply-bump':
        return semver.inc(current, commitBasedBump); // 1.1.0 → 1.2.0
      
      case 'pre-release':
        if (semver.prerelease(current)) {
          return semver.inc(current, 'prerelease'); // 1.2.0-1 → 1.2.0-2
        } else {
          // First time: apply bump then make prerelease
          const bumped = semver.inc(current, commitBasedBump); // 1.1.0 → 1.2.0
          return semver.inc(bumped, 'prerelease', '0'); // 1.2.0 → 1.2.0-0
        }
      
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  } else {
    // Different bump type - normal semver bump
    return semver.inc(current, commitBasedBump);
  }
}

// Finalize prerelease versions when target is updated
function finalizeVersion(version) {
  const current = semver.coerce(version) || '0.0.0';
  if (semver.prerelease(current)) {
    return semver.inc(current, 'patch'); // 1.2.0-1 → 1.2.0
  }
  return current;
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

### 6. Handle git log -L Failure Gracefully
**Issue:** `git log -L '/version/:'` silently fails when version field never existed
```javascript
// Add better logging in getLastVersionChangeCommit():
core.debug(`Could not find version change for ${packageJsonPath}: using file creation fallback`);
```

### 2. Add Configurable Same-Type Bump Strategy
**Issue:** Current logic always skips when `commitBasedBump === historicalBump`
**Solution:** Make strategy configurable with new input parameter

**New Input:**
```yaml
same_type_bump_strategy: 'do-nothing' | 'apply-bump' | 'pre-release'
```

**Behaviors:**
- `do-nothing`: Skip bump (current behavior)
- `apply-bump`: Normal semver bump (1.1.0 → 1.2.0) 
- `pre-release`: Use prerelease versions (1.1.0 → 1.2.0-0, then 1.2.0-1, etc.)

### 3. Add Target Branch Update Detection
**Issue:** Need to detect when target branch is updated and finalize prerelease versions
**Solution:** Add source branch comparison and version finalization

**New Input:**
```yaml
branch: 'develop' # Default branch to compare against
```

**Logic:**
- Compare versions at HEAD of source and target branches
- If versions match and are prereleases, finalize them (1.2.0-1 → 1.2.0)
- Commit finalized versions

### 4. Add Prerelease-Aware Tagging Strategy  
**Issue:** Tagging logic needs to handle prerelease versions differently
**Solution:** Disable tag creation for prereleases unless forced

**New Input:**
```yaml
force_prerelease_tags: false # Default: don't tag prereleases
```

**Logic:**
- Skip tag creation for prerelease versions unless `force_prerelease_tags: true`
- When finalizing prereleases, create tags for final versions
- Apply same finalization logic for tags as for branch updates

### 5. Fix Root-Only Commit Detection in Workspaces
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

### Scenario 3: Same-Type Incremental Changes (Pre-release Strategy)
- Target branch: 1.0.0, Active branch: 1.1.0 (minor bump already applied)
- New minor changes made since 1.1.0 bump
- Strategy: `pre-release`
- Expected result: Package bumped from 1.1.0 → 1.2.0-0 (first prerelease applies bump)

### Scenario 4: Target Branch Update with Prerelease Finalization
- Source branch: 1.2.0-2 (prerelease version)
- Target branch: 1.0.0 (being updated)
- Expected result: Source version finalized to 1.2.0, then merged to target

### Scenario 5: Configurable Strategy Behaviors
- Same minor changes with different strategies:
  - `do-nothing`: 1.1.0 → 1.1.0 (no change)
  - `apply-bump`: 1.1.0 → 1.2.0 (normal bump)
  - `pre-release`: 1.1.0 → 1.2.0-0 (prerelease bump)

## Changes Required in index.cjs

### Core Version Operations
- [ ] Replace all version operations with semver package functions
- [ ] Update `getVersionAtCommit()` to use `semver.coerce()` with '0.0.0' fallback
- [ ] Replace `calculateBumpType()` with `semver.diff()` 
- [ ] Replace `bumpVersion()` with `getNextVersion()` using configurable strategy
- [ ] Update `isDepCompatible()` to use `semver.satisfies()`
- [ ] Update reference version fallback to use `semver.coerce()`
- [ ] Add version initialization using `semver.coerce()` in main package loop

### New Configuration Options
- [ ] Add `same_type_bump_strategy` input ('do-nothing' | 'apply-bump' | 'pre-release')
- [ ] Add `branch` input (default: 'develop')
- [ ] Add `force_prerelease_tags` input (default: false)

### Strategy Implementation
- [ ] Implement configurable same-type bump strategy in `getNextVersion()`
- [ ] Add `finalizeVersion()` function to convert prereleases to final versions
- [ ] Add target branch update detection and version finalization logic
- [ ] Update dependency compatibility to handle prerelease versions appropriately

### Tagging Logic
- [ ] Modify `tagVersion()` to skip prerelease versions unless forced
- [ ] Add prerelease finalization logic for tagging
- [ ] Coordinate tag creation with version finalization

### Bug Fixes
- [ ] Improve error logging in `getLastVersionChangeCommit()`
- [ ] Create `getRootOnlyCommits()` function to exclude workspace directories  
- [ ] Update root package processing to use root-only commit detection

### Integration
- [ ] Add source/target branch comparison logic
- [ ] Implement prerelease version finalization workflow
- [ ] Update action inputs and documentation