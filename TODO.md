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

## Test Scenario That Should Work After Fixes
- Target branch: package.json with no version field
- Active branch: 3 patch commits  
- Expected result: Package bumped from 0.0.0 → 0.0.1

## Changes Required in index.cjs

- [ ] Update `getVersionAtCommit()` to return '0.0.0' for missing versions
- [ ] Update `calculateBumpType()` to handle undefined inputs safely  
- [ ] Add version initialization logic in main package loop
- [ ] Fix reference version fallback to guarantee non-undefined value
- [ ] Improve error logging in `getLastVersionChangeCommit()`