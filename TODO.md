# TODO: Fix Simplified Version Bump Logic

## Critical Bugs Identified in Scenario Analysis

### 1. Fix `getVersionAtCommit()` for Missing Version Fields
**Issue:** When target branch package.json has no `version` field, function returns `null`
```javascript
// Current broken code:
const pkg = JSON.parse(content);
return pkg.version; // Returns undefined/null

// Fix needed:
return pkg.version || '0.0.0'; // Default when missing
```

### 2. Fix `calculateBumpType()` for Undefined Versions  
**Issue:** Function crashes calling `.split('.')` on undefined values
```javascript
// Current broken code:
const [fromMajor, fromMinor, fromPatch] = fromVersion.split('.').map(Number);

// Fix needed:
fromVersion = fromVersion || '0.0.0';
toVersion = toVersion || '0.0.0';
```

### 3. Initialize Missing Version in Current Package
**Issue:** Logic assumes `pkg.version` exists, but it might not
```javascript
// Add before processing each package:
if (!pkg.version) {
  pkg.version = '0.0.0';
  core.info(`[${name}] Initializing missing version to 0.0.0`);
}
```

### 4. Fix Reference Version Fallback Chain
**Issue:** Can still end up with `undefined` referenceVersion
```javascript
// Current problematic fallback:
if (!referenceVersion) {
  referenceVersion = rootPkg.version; // Also might be undefined!
}

// Fix needed:
referenceVersion = referenceVersion || rootPkg.version || '0.0.0';
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