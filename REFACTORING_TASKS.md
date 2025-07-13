# Refactoring Tasks - Ordered by Significance

## Task 1: Core Semver Integration (HIGH IMPACT)
**Resolves:** Version parsing crashes, undefined handling, reference fallbacks, dependency compatibility

**Changes:**
- Replace all custom version operations with semver package functions
- Update `getVersionAtCommit()` to use `semver.coerce()` with '0.0.0' fallback
- Replace `calculateBumpType()` with `semver.diff()`
- Replace `bumpVersion()` with new `getNextVersion()` function structure
- Update `isDepCompatible()` to use `semver.satisfies()`
- Update reference version fallback chain to use `semver.coerce()`
- Add version initialization using `semver.coerce()` in main package loop

**Impact:** Fixes 4+ critical bugs, enables all future features

## Task 2: Configuration System Architecture (HIGH IMPACT)
**Resolves:** Enables configurable strategies, branch detection, tagging control

**Changes:**
- Add new action inputs to `action.yml`:
  - `same_type_bump_strategy` ('do-nothing' | 'apply-bump' | 'pre-release')
  - `branch` (default: 'develop')
  - `force_prerelease_tags` (default: false)
- Update input parsing in main function
- Create configuration validation logic

**Impact:** Enables 3 major new features

## Task 3: Configurable Bump Strategy Implementation (HIGH IMPACT)
**Resolves:** Same-type incremental changes, prerelease semantic correctness

**Changes:**
- Implement `getNextVersion()` with strategy parameter:
  - `do-nothing`: return null (skip)
  - `apply-bump`: normal semver increment
  - `pre-release`: semantically correct prerelease (apply bump first, then -0)
- Update main package processing loop to use strategy
- Handle prerelease increments (1.2.0-0 → 1.2.0-1)

**Impact:** Core new functionality, resolves workflow issues

## Task 4: Prerelease Finalization System (MEDIUM IMPACT)
**Resolves:** Target branch updates, version conflicts, release workflow

**Changes:**
- Implement `finalizeVersion()` function (1.2.0-1 → 1.2.0)
- Add branch comparison logic (source vs target)
- Add detection for matching prerelease versions
- Add finalization workflow for target branch updates
- Update dependency handling for prerelease versions

**Impact:** Completes prerelease workflow, prevents version conflicts

## Task 5: Workspace Root-Only Commit Detection (MEDIUM IMPACT)
**Resolves:** Incorrect root package bumping, workspace isolation

**Changes:**
- Create `getRootOnlyCommits()` function with workspace exclusion
- Implement git pathspec logic (`:!workspace/path`)
- Update root package processing to use root-only commits
- Coordinate with workspace processing results

**Impact:** Fixes critical workspace bug, isolated change

## Task 6: Prerelease-Aware Tagging Logic (MEDIUM IMPACT)
**Resolves:** Unwanted prerelease tags, release workflow integration

**Changes:**
- Modify `tagVersion()` to skip prerelease versions unless forced
- Add prerelease detection in tagging logic
- Coordinate tag creation with version finalization
- Handle forced prerelease tagging via input

**Impact:** Integrates tagging with new strategy, workflow improvement

## Task 7: Error Handling and Logging Improvements (LOW IMPACT)
**Resolves:** Silent failures, debugging difficulties

**Changes:**
- Improve error logging in `getLastVersionChangeCommit()`
- Add strategy selection logging
- Add prerelease finalization logging
- Add fallback strategy logging
- Improve git operation error handling

**Impact:** Better debugging, minor workflow improvement

## Task 8: Integration and Validation (LOW IMPACT)
**Resolves:** End-to-end workflow coordination, input validation

**Changes:**
- Add configuration validation (valid strategy values)
- Coordinate all new features in main workflow
- Update action documentation
- Add comprehensive error messages
- Test scenario validation

**Impact:** Ensures system reliability, completes implementation

## Dependencies
- **Task 1** must be completed first (foundation for all others)
- **Task 2** must be completed before Tasks 3-6 (enables configuration)
- **Tasks 3-6** can be done in parallel after Tasks 1-2
- **Tasks 7-8** can be done last (polish and integration)

## Testing Priority
1. **Task 1**: Test all scenarios from TODO (missing version, workspace changes, etc.)
2. **Task 3**: Test all three strategy behaviors
3. **Task 4**: Test prerelease finalization workflow
4. **Task 5**: Test workspace root-only detection
5. **Task 6**: Test tagging with different strategies
6. **Tasks 7-8**: Integration testing

## Estimated Impact
- **Tasks 1-3**: ~70% of functionality improvement
- **Tasks 4-6**: ~25% of functionality improvement  
- **Tasks 7-8**: ~5% of functionality improvement