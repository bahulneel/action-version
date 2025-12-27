# Configuration Gap Analysis: Current vs Required Patterns

This document analyzes how well the current action-version configuration supports the branching and versioning patterns documented in `branching-patterns.md`.

## Current Configuration Model

### Available Inputs

1. **`strategy`**: Version bump strategy
   - Values: `do-nothing`, `apply-bump`, `pre-release`
   - Single value applies to entire workflow run

2. **`base`**: Base branch for comparison
   - Single branch name (e.g., `main`)
   - Used for merge-base calculation

3. **`branch`**: Active branch
   - Single branch name (default: `develop`)
   - Used for finalization detection

4. **`create_branch`**: Create separate branch for version updates
   - Boolean (default: `false`)
   - Single value applies globally

5. **`branch_template`**: Template for branch names
   - String template (default: `release/${version}`)
   - Single template

6. **`branch_cleanup`**: Branch cleanup strategy
   - Values: `keep`, `prune`, `semantic`

7. **`tag_prereleases`**: Tag prerelease versions
   - Boolean (default: `false`)

8. **Commit templates**: Customizable commit messages
   - `commit_template`
   - `dependency_commit_template`

## Pattern Support Analysis

### 1. Git Flow

**Required Behaviors:**
- `develop`: Prerelease versions (`pre-release` strategy)
- `release/*`: Finalize prerelease to stable (`apply-bump` or finalization)
- `main`: Stable versions, tags
- Sync from `main` to `develop` after release

**Current Support:**

✅ **Partially Supported**
- Can handle `develop` with `strategy: pre-release`, `base: main`, `branch: develop`
- Can handle `release/*` with `strategy: apply-bump`, but requires separate workflow
- Can handle `main` with `strategy: apply-bump`, but requires separate workflow
- ❌ **Gap**: No automatic finalization when base branch updates
- ❌ **Gap**: No version synchronization from main to develop
- ❌ **Gap**: Can't specify different strategies per branch pattern in single config
- ❌ **Gap**: No awareness of branch protection (can't auto-switch between direct commits vs branches)

**Workflow Requirements:**
- Need 3 separate workflows (develop, release/*, main)
- Each workflow needs different strategy configuration
- Manual PR creation required for protected branches
- Manual sync workflow needed for main → develop

### 2. GitHub Flow

**Required Behaviors:**
- `main`: Stable versions on each merge
- `feature/*`: No versioning (versions set on main only)
- Tags on main releases

**Current Support:**

✅ **Well Supported**
- Can handle `main` with `strategy: apply-bump`
- Feature branches don't need versioning (no action run needed)
- Tags can be created (but action doesn't handle this currently)
- ✅ No major gaps for this pattern

**Workflow Requirements:**
- Single workflow on `main` branch
- Feature branches don't trigger action

### 3. Trunk-Based Development

**Required Behaviors:**
- `main`: Versions on each merge
- Short-lived feature branches: No versioning
- Tags on releases

**Current Support:**

✅ **Well Supported**
- Similar to GitHub Flow
- Can handle `main` with `strategy: apply-bump`
- Feature branches don't need versioning
- ✅ No major gaps

**Workflow Requirements:**
- Single workflow on `main` branch

### 4. Release Branch Pattern

**Required Behaviors:**
- `main`: Stable versions
- `release/*`: Version sealing/finalization
- `develop` (optional): Prerelease versions

**Current Support:**

✅ **Partially Supported**
- Can handle each branch type with separate workflows
- ❌ **Gap**: No automatic detection of release branches
- ❌ **Gap**: Version sealing requires manual configuration
- ❌ **Gap**: No automatic sync from release to main

**Workflow Requirements:**
- Separate workflows for each branch type
- Manual configuration per workflow

### 5. GitLab Flow (Environment Branches)

**Required Behaviors:**
- `main`: Source of truth
- `pre-production`: Promotion from main
- `production`: Promotion from pre-production
- Environment-specific versioning

**Current Support:**

❌ **Not Well Supported**
- No concept of environment promotion
- No way to specify different versioning per environment
- No support for version propagation through environments
- ❌ **Major Gap**: Environment-based workflows not supported

## Key Gaps Identified

### 1. **Single-Branch Context Limitation**

**Problem**: The action only knows about one branch at a time (`branch` input). It can't make decisions based on branch patterns or multiple branch contexts.

**Impact**: 
- Must create separate workflows for each branch type
- Can't have a single configuration that handles multiple branches differently
- Workflow authors must understand which strategy to use for each branch

**Example**: For Git Flow, need 3 separate workflows:
```yaml
# workflow 1: develop
strategy: pre-release
base: main
branch: develop

# workflow 2: release/*
strategy: apply-bump
base: main
branch: ${{ github.ref_name }}

# workflow 3: main
strategy: apply-bump
base: null
branch: main
```

### 2. **No Branch Pattern Detection**

**Problem**: The action doesn't automatically detect what type of branch it's running on (develop, release/*, main, feature/*, etc.).

**Impact**:
- Can't automatically choose the right strategy based on branch pattern
- Requires explicit configuration in each workflow
- Error-prone (easy to use wrong strategy)

### 3. **No Branch Protection Awareness**

**Problem**: The action doesn't know if a branch is protected, so it can't automatically decide whether to:
- Commit directly (`create_branch: false`)
- Create a branch and PR (`create_branch: true`)

**Impact**:
- Users must know which branches are protected
- Must manually configure `create_branch` correctly
- Can't have same workflow work for both protected and unprotected scenarios

### 4. **No Version Synchronization**

**Problem**: No built-in support for syncing versions between branches (e.g., main → develop after release).

**Impact**:
- Must create separate workflows for synchronization
- Manual branch creation and PR management
- Error-prone process

**Current Workaround**: Manual git operations in workflow (like we did in canon workflows)

### 5. **No Finalization Strategy**

**Problem**: While there's logic to finalize prereleases when base branch updates, it's implicit and not clearly configurable as a strategy.

**Impact**:
- Finalization behavior is tied to base branch updates
- Can't explicitly request "finalize this prerelease to stable"
- Confusing when finalization will/won't happen

### 6. **Limited Version Strategy Options**

**Problem**: Only 3 strategies: `do-nothing`, `apply-bump`, `pre-release`

**Missing Strategies**:
- `finalize`: Explicitly convert prerelease to stable
- `sync`: Copy exact version from another branch
- `stable`: Always use stable versions (alias for apply-bump?)

### 7. **No PR Creation**

**Problem**: Action creates branches but doesn't create PRs (by design - separation of concerns).

**Impact**:
- Must use GitHub CLI or other tools to create PRs
- Adds complexity to workflows
- Inconsistent PR creation logic across users

**Note**: This might be intentional design, but for pattern-based config, PR creation could be part of the pattern definition.

### 8. **No Pattern Presets**

**Problem**: Must configure each aspect manually; no high-level pattern selection.

**Impact**:
- Steep learning curve
- Easy to misconfigure
- Verbose workflow files
- Hard to discover best practices

## Pattern Support Matrix

| Pattern | Branch Types | Current Support | Gaps |
|---------|-------------|----------------|------|
| **Git Flow** | develop, release/*, main | ⚠️ Partial | Multi-branch config, sync, protection awareness |
| **GitHub Flow** | main, feature/* | ✅ Good | None significant |
| **Trunk-Based** | main | ✅ Good | None significant |
| **Release Branches** | main, release/*, develop? | ⚠️ Partial | Pattern detection, sealing |
| **GitLab Flow** | main, pre-prod, prod | ❌ Poor | Environment promotion, multi-env config |

**Legend:**
- ✅ Good: Works well with current config
- ⚠️ Partial: Works but requires multiple workflows, verbose config
- ❌ Poor: Significant gaps, difficult to implement

## Conclusion

The current configuration model is **strategy-centric** rather than **pattern-centric**:

- ✅ Works well for simple patterns (GitHub Flow, Trunk-Based)
- ⚠️ Requires significant manual setup for complex patterns (Git Flow)
- ❌ Doesn't support environment-based patterns (GitLab Flow)

**Key Limitations:**
1. Single-branch context (one workflow = one branch behavior)
2. No branch pattern detection
3. No branch protection awareness
4. No version synchronization
5. No pattern presets

**To support all patterns trivially**, the configuration would need to:
1. Support pattern-based configuration (presets)
2. Support branch-pattern matching (e.g., `release/*`, `feature/*`)
3. Be aware of branch protection status
4. Support version synchronization workflows
5. Support environment-based patterns
