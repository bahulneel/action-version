# Version Bump Action - TODO

## Critical Bugs to Fix

### 1. Missing Version Field Handling
**Problem:** Logic crashes when package.json has no `version` field
- `getVersionAtCommit()` returns `null` causing downstream failures
- `calculateBumpType()` crashes on `undefined.split('.')`
- No initialization logic for packages without versions

**Fix Required:**
- [ ] Add default version `'0.0.0'` in `getVersionAtCommit()` when missing
- [ ] Add defensive checks in `calculateBumpType()` for undefined versions  
- [ ] Initialize missing versions to `'0.0.0'` during package processing
- [ ] Handle case where current package.json has no version field

### 2. Reference Version Fallback Chain
**Problem:** Complex fallback logic can still result in `undefined` reference version
- Target branch package.json with no version → `null`
- Current package.json with no version → `undefined` 
- No final fallback to sensible default

**Fix Required:**
- [ ] Ensure reference version establishment always has final fallback to `'0.0.0'`
- [ ] Simplify the fallback chain to be more predictable

### 3. Git Log Strategy Robustness
**Problem:** `git log -L '/version/:'` fails silently when field doesn't exist
- Falls back to file creation which may be very old
- No clear logging about which strategy was used

**Fix Required:**
- [ ] Add better error handling and logging for git log strategies
- [ ] Consider alternative approach when version field never existed
- [ ] Clear logging about which fallback strategy was used

## Edge Cases to Handle

### 4. New Package Scenarios
- [ ] Package with no version field (current issue)
- [ ] Package that never had version field in git history
- [ ] Empty repository with no commits
- [ ] Repository with no tags and no target branch

### 5. Version Comparison Edge Cases  
- [ ] Comparing `0.0.0` with `undefined`
- [ ] Handling pre-release versions (e.g. `1.0.0-alpha.1`)
- [ ] Malformed version strings
- [ ] Version field with non-string values

### 6. Dependency Update Edge Cases
- [ ] Dependency spec parsing for various formats (`^`, `~`, exact, ranges)
- [ ] Handling workspace protocol dependencies (e.g. `workspace:*`)
- [ ] Peer dependency handling during major bumps
- [ ] Optional dependencies handling

## Testing Scenarios to Add

### 7. Comprehensive Test Coverage
- [ ] Package without version field (current scenario)
- [ ] Monorepo with mix of versioned/unversioned packages
- [ ] Major version bump with test failures
- [ ] Circular dependency scenarios
- [ ] Mixed conventional commit types
- [ ] Branch with no changes since reference
- [ ] Repository with only merge commits

### 8. Integration Tests
- [ ] End-to-end test with real git history
- [ ] Test with various package managers (npm, yarn, pnpm)
- [ ] Test with different branch strategies
- [ ] Test branch deletion scenarios

## Code Quality Improvements

### 9. Error Handling
- [ ] Wrap git operations in proper try-catch blocks
- [ ] Provide meaningful error messages for common failure modes
- [ ] Graceful degradation when git operations fail
- [ ] Validate package.json structure before processing

### 10. Logging and Debugging
- [ ] Consistent logging format across all operations
- [ ] Debug mode with verbose git operation logging
- [ ] Clear indication of which strategy/fallback was used
- [ ] Summary of decisions made for each package

## Documentation

### 11. User-Facing Documentation
- [ ] Document behavior when version field is missing
- [ ] Explain reference point selection logic
- [ ] Document dependency update behavior
- [ ] Add troubleshooting guide for common issues

### 12. Developer Documentation
- [ ] Add inline code comments explaining complex logic
- [ ] Document the decision tree for version bumping
- [ ] Add examples of edge cases and how they're handled

## Priority Order

**P0 (Critical):** Items 1-3 (fix crashes and undefined behavior)
**P1 (High):** Items 4-6 (handle edge cases properly)  
**P2 (Medium):** Items 7-8 (comprehensive testing)
**P3 (Low):** Items 9-12 (code quality and documentation)

## Notes

- The current implementation assumes all packages have version fields
- Need to be careful about backward compatibility with existing workflows
- Consider semantic versioning specification compliance
- Ensure consistent behavior between single-package and monorepo modes