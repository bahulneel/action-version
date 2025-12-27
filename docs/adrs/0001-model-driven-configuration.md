# ADR-001: Add Model-Driven Configuration Option

- Status: accepted
- Date: 2025-01-28

## Context and Problem Statement

The action-version GitHub Action currently uses a **behavior-driven configuration model** where users must specify low-level implementation details in workflow YAML:

- `strategy: pre-release` - which version bump algorithm to use
- `create_branch: true` - whether to create branches
- `base: main` - which branch to compare against
- `branch: develop` - the active branch

This approach works well for simple patterns but has limitations:

1. **Complex Patterns Require Multiple Workflows**: Git Flow needs 3 separate workflows, each with different strategy configurations
2. **No Pattern Awareness**: Action can't automatically adapt behavior based on branch patterns (e.g., `release/*` vs `develop`)
3. **Configuration Complexity**: Users must understand internal strategies rather than describing their branching model
4. **Error-Prone**: Easy to misconfigure by choosing wrong strategy for branch type

However, the behavior-driven model is valuable for:

- Fine-grained control
- Advanced use cases
- Users who understand the internals
- Backward compatibility

## Decision Drivers

- Need to support all common branching patterns (Git Flow, GitHub Flow, Trunk-Based, Release Branches, GitLab Flow)
- Desire for simpler, more intuitive configuration option
- Requirement to maintain backward compatibility with existing behavior-driven configuration
- Need for pattern-based configuration that automatically infers correct strategies
- Support for both simple (preset patterns) and complex (custom model definitions) use cases

## Considered Options

### Option 1: Replace Behavior-Driven with Model-Driven

**Pros:**

- Single configuration model
- Simpler for users

**Cons:**

- Breaking change for existing users
- Loses fine-grained control
- Forces all users to adopt new model

### Option 2: Add Model-Driven as Optional (Chosen)

**Pros:**

- Best of both worlds
- Backward compatible
- Users can choose appropriate model
- Preserves fine-grained control for advanced users

**Cons:**

- Two configuration paths to maintain
- Slightly more complex implementation

## Decision Outcome

Chosen option: **Add Model-Driven Configuration as Optional**, reading from a `.versioning.yml` file that infers the correct behavior-driven configuration from a model definition.

### Positive Consequences

- **Backward Compatible**: Existing behavior-driven configuration continues to work unchanged
- **Simplified Option**: Users can choose model-driven approach for simpler configuration
- **Pattern Support**: All documented patterns work out of the box with model-driven config
- **Flexibility**: Advanced users can still use behavior-driven config for fine-grained control
- **Automatic Inference**: Model-driven config automatically translates to correct behavior-driven settings
- **Self-Documenting**: Model definition clearly shows the branching model in use

### Negative Consequences

- **Two Configuration Paths**: Need to maintain and document both approaches
- **Implementation Complexity**: Must implement model-to-behavior translation layer
- **File-Based Config**: Requires `.versioning.yml` file in repository (additional file to manage)
- **Stricter Requirements**: Action fails if `.versioning.yml` is missing (mitigated by auto-PR creation with inferred config)

## Implementation Details

### Configuration Sources

The action supports two configuration approaches:

#### 1. Behavior-Driven (Current - Unchanged)

Configuration provided as action inputs in workflow YAML:

```yaml
# .github/workflows/version.yml
- name: Version Bump
  uses: bahulneel/action-version@v1
  with:
    # Low-level strategy: how to bump versions
    # Options: 'do-nothing', 'apply-bump', 'pre-release'
    strategy: pre-release # Use prerelease versions (e.g., 1.2.0-0, 1.2.0-1)

    # Base branch for comparison: find merge-base and compare commits since then
    base: main # Compare against main branch to determine version changes

    # Active branch: the branch we're currently operating on
    branch: develop # We're on develop branch, will create prerelease versions

    # Whether to create a separate branch for version changes
    # false = commit directly to current branch (requires branch to be unprotected)
    # true = create new branch (required for protected branches)
    create_branch: false # Commit directly to develop (assumes develop is unprotected)

    # Whether to create git tags for prerelease versions
    tag_prereleases: true # Tag prereleases like v1.2.0-0, v1.2.0-1
```

This approach remains fully supported and unchanged. Users specify exactly how the action should behave.

#### 2. Model-Driven (New - Optional)

Configuration provided via `.versioning.yml` file in repository root:

```yaml
# .versioning.yml
# Configuration uses composable presets that are merged in order, with local config overriding

# Option 1: Use one or more presets (simplest)
# Presets provide base flows and branch metadata for common patterns
presets:
  - gitflow # Available presets: 'github-flow', 'trunk-based', 'release-branches', 'gitlab-flow'

# Option 2: Override/extend preset configuration
presets:
  - gitflow # Start with gitflow preset
branches:
  # Override branch metadata (not versioning - that's in flows)
  develop:
    protected: true # Override: make develop protected (preset says false)
    tags: true # Add tagging to develop branch
  # All flows come from gitflow preset

# Option 3: Compose multiple presets (advanced)
presets:
  - github-flow # Start with github-flow base flows
  - release-branches # Layer on release branch flows
branches:
  # Add/override branch metadata
  main:
    tags: true # Add tagging to main branch

# Option 4: Define completely custom model (no presets)
# Flows are the primary abstraction - they define operations and versioning strategies
flows:
  # Flow: Prepare a release by finalizing prerelease version
  - name: release-prep
    from: develop # Source branch: where we branch from
    to: release/* # Target branch pattern: create release branches
    triggered: true # Explicitly triggered (e.g., manual workflow or branch creation)
    versioning: finalize # Convert prerelease (1.2.0-0) to stable (1.2.0)

  # Flow: Merge release branch to main (release)
  - name: release
    from: release/* # Source: release branch that was finalized
    to: main # Target: merge to main
    # No versioning specified - just merge (version already finalized)

  # Flow: Sync exact version from main back to develop after release
  - name: sync-version
    from: main # Source: main branch with released version
    to: develop # Target: sync version to develop
    # No versioning specified - sync exact version (do-nothing unless there are new commits)
    # This is correct: after release, sync the version, don't create new prerelease

  # Flow: Bump version with prerelease for active development
  - name: bump-version
    from: '*' # Match any branch (wildcard)
    from-exclude: # Except these branches
      - main
      - release/*
    versioning: pre-release # Use prerelease versions (1.2.0-0, 1.2.0-1, etc.)
    base: main # Compare against main to determine version changes

# Branch metadata: properties that affect behavior (tags, protection status)
branches:
  main:
    tags: true # Create git tags for releases on main
    protected: true # Branch is protected (action infers: must create PRs)
  develop:
    protected: false # Branch not protected (action infers: can commit directly)
  release/*:
    protected: true # Release branches are protected (action infers: must create PRs)
```

**Key Design Principles:**

1. **Flows are primary**: Flows define operations (how versions move and change), not branches
2. **Versioning is contextual**: Versioning strategy is tied to the specific flow operation, not branch properties
3. **Branch metadata only**: Branches section only contains metadata (tags, protected status) that affects behavior
4. **Automatic inference**: Action infers behavior from GitHub events and branch protection status
   - Protected branches → automatically create branches/PRs
   - Unprotected branches → commit directly when possible
5. **Operation clarity**: Each flow explicitly states what it does and when

The action reads this file and:

1. **Flow Matching** (primary action):

   - Detects current branch from `github.ref_name` and GitHub event context
   - Matches current context to flows based on `from`/`to` patterns and `triggered` status
   - Each flow defines the complete operation: source branch, target branch, versioning strategy
   - Action infers whether to create branch/PR based on branch protection status (from `branches` metadata or GitHub API)

2. **Flow Execution**:

   - Executes the matched flow with its specified versioning strategy
   - For `sync-version`: Copies exact version from source to target (do-nothing strategy unless commits changed)
   - For `bump-version`: Calculates and applies prerelease version bumps
   - For `release-prep`: Finalizes prerelease to stable version
   - For `release`: Merges finalized version (no versioning operation)

3. **Automatic Behavior Inference**:
   - Protected branches → automatically create branches/PRs
   - Unprotected branches → commit directly when safe
   - GitHub events (push, PR, etc.) matched to flow triggers

### Workflow Usage

When using model-driven configuration, the workflow becomes simpler:

```yaml
# .github/workflows/version.yml
name: Version Bump
on:
  push:
    # Trigger on all branches that need versioning
    branches: [main, develop, 'release/**'] # main, develop, and any release/* branches

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }} # Required for creating branches/PRs
          fetch-depth: 0 # Full history needed for merge-base calculation

      - name: Version Bump
        uses: bahulneel/action-version@v1
        # No inputs needed - action automatically:
        # 1. Checks for .versioning.yml in repository root
        #    - If exists: reads model configuration from file, proceeds to step 2
        #    - If not: infers model from repository structure, creates PR with .versioning.yml
        #      (or outputs to summary if PR fails), then FAILS with guidance to add the file
        # 2. Detects current branch from github.ref_name
        # 3. Matches branch to pattern in model (e.g., 'release/v1.2.0' matches 'release/*')
        # 4. Queries GitHub API (via gh CLI) for branch protection status
        # 5. Infers correct behavior-driven config from model (strategy, base, create_branch, etc.)
        # 6. Applies any action input overrides (none in this example)
        # 7. Executes version bump with final configuration

      # OR with selective overrides
      - name: Version Bump
        uses: bahulneel/action-version@v1
        with:
          # Override model-driven config: force branch creation even if model says otherwise
          create_branch: true
          # All other settings come from .versioning.yml (file must exist)
```

### Model-to-Behavior Translation

The action translates model definitions to behavior-driven configuration:

- **Preset Composition**: Presets are merged in order, with local `branches` and `flows` overriding preset values

  - Start with base (empty config or first preset)
  - Apply each preset in sequence, merging/overriding flow and branch values
  - Apply local `branches` and `flows` sections, overriding preset values
  - Final result is a complete merged configuration with flows and branch metadata

- **Flow Matching**: Action matches current GitHub event context to flows

  - Current branch matched against flow `from` patterns (with wildcards and exclusions)
  - GitHub event type matched against flow `triggered` status
  - Target branch inferred from flow `to` pattern or GitHub event (PR target, etc.)
  - Selects the best matching flow (or fails if ambiguous)

- **Versioning Strategy from Flow**: Each flow specifies its versioning strategy

  - `versioning: pre-release` → use pre-release strategy (calculate bumps, use prerelease versions)
  - `versioning: finalize` → use finalize strategy (convert prerelease to stable)
  - No versioning specified → use do-nothing strategy (for sync operations)
  - This eliminates redundancy: versioning is contextual to the operation, not branch property

- **Automatic Branch Behavior**: Action infers branch behavior from metadata and GitHub API
  - Queries GitHub API for branch protection status (or uses `branches.*.protected`)
  - Protected branches → automatically set `create_branch: true`, create PRs
  - Unprotected branches → `create_branch: false`, commit directly when safe
  - Tags creation controlled by `branches.*.tags` metadata

### Configuration Priority and Resolution

The action always operates as follows:

1. **Primary Configuration Source**:

   - If `.versioning.yml` exists → derive configuration from the file (model-driven)
   - Else → **FAIL** with helpful guidance:
     - Infer the model using trivial exploration of the repository
       - Check branch structure (existence of `develop`, `main`, `release/*` branches)
       - Analyze recent commit patterns
       - Infer most likely preset (gitflow, github-flow, trunk-based, etc.)
       - Generate `.versioning.yml` with inferred preset in `presets:` array and minimal overrides
     - Attempt to create a PR to current branch with the inferred `.versioning.yml`
     - If PR creation fails (e.g., insufficient permissions), output inferred config to action summary
     - Fail the action with clear error message asking user to add `.versioning.yml`

2. **Override Layer**:

   - Override any model-driven option via action inputs provided in workflow
   - Action inputs act as overrides, not replacements
   - If model says `create_branch: true` but input says `create_branch: false`, use `false`
   - Partial overrides allowed (only override specific options, keep rest from model)

**Note**: There is no fallback to defaults. The action requires `.versioning.yml` to exist (either already present or added via the inferred PR). This ensures explicit configuration and prevents silent misconfiguration.

This approach ensures:

- **Explicit Configuration**: Users must explicitly accept the model by adding `.versioning.yml`
- **Safe Defaults**: Inferred model provides sensible starting point, but user must review and commit
- **Clear Guidance**: Failure message provides the exact configuration needed
- **Selective Overrides**: Fine-tune specific aspects via action inputs after model is accepted

### GitHub CLI Access

The action has access to the GitHub CLI (`gh`) tool, which enables:

- **Branch Protection Detection**: Query branch protection status (`gh api repos/:owner/:repo/branches/:branch/protection`)
- **PR Creation**: Create pull requests when flows specify `action: create_pr` (`gh pr create`)
- **Branch Information**: Get branch details and metadata
- **Repository Context**: Access repository information for model inference

This CLI access is essential for:

- Automatic branch protection detection (determining `create_branch` behavior)
- PR creation from version branches
- Repository exploration for model inference

## Required Additional Behaviors and Modes

To support model-driven configuration, the following additional behaviors, options, and modes need to be implemented:

### 1. Configuration File Reading

- **Read `.versioning.yml`** from repository root
- Parse YAML configuration
- Validate configuration schema
- If file missing → proceed to model inference and PR creation (see section 1b)

### 1b. Model Inference and PR Creation (When File Missing)

- **Trivial Repository Exploration**: When `.versioning.yml` doesn't exist, infer model from repo structure

  - Check if `develop` branch exists → suggests Git Flow or Release Branch pattern
  - Check if `release/*` branches exist → suggests Release Branch pattern
  - Check branch structure and naming patterns
  - Analyze commit history patterns (feature branches, release branches)
  - Use GitHub CLI (`gh`) to query branch information
    - Infer most likely preset: `gitflow`, `github-flow`, `trunk-based`, `release-branches`
    - Generate `.versioning.yml` with `presets: [inferred-preset-name]` and minimal overrides

- **PR Creation with Inferred Config**:

  - Create a new branch (e.g., `add-versioning-config`)
  - Write inferred `.versioning.yml` to repository root
  - Commit the file with clear commit message explaining the inference
  - Create PR to current branch using `gh pr create`
  - PR body explains the inferred model and asks user to review/merge
  - If PR creation fails (permissions, etc.), output inferred config to GitHub Actions summary
  - Fail the action with clear error message directing user to add `.versioning.yml`

- **Failure Behavior**:
  - Action exits with error code
  - Error message clearly states: `.versioning.yml` file is required
  - Message includes link to PR (if created) or instructions to add file manually
  - Inferred configuration is available in PR or action summary for user to copy

### 2. Flow Matching Engine

- **Flow Pattern Matching**: Match current GitHub event context to flows
  - Match current branch against flow `from` patterns (supports globs like `release/*`, wildcards like `*`)
  - Support `from-exclude` patterns to exclude specific branches from wildcard matches
  - Match GitHub event type against flow `triggered` status (explicit triggers vs implicit)
  - Resolve flow `to` patterns based on context (target branch from PR, explicit target, etc.)
  - Handle flow priority/ordering when multiple flows match (most specific wins)

### 3. Branch Protection Detection

- **GitHub CLI Integration**: Query branch protection status using `gh` CLI
  - Use `gh api repos/:owner/:repo/branches/:branch/protection` to check protection
  - Auto-set `create_branch` based on protection status
  - Cache protection status to avoid excessive API calls
  - Handle repositories without branch protection (assume unprotected)

### 4. Additional Version Strategies

- **`finalize` Strategy**: Explicitly convert prerelease to stable version

  - Remove prerelease suffix (e.g., `1.2.0-0` → `1.2.0`)
  - Different from `apply-bump` which increments based on commits
  - Used when sealing versions on release branches

- **`sync` Strategy**: Copy exact version from another branch
  - Read version from source branch (e.g., `main`)
  - Set exact same version on target branch (e.g., `develop`)
  - Used for version synchronization workflows

### 6. Preset Composition and Merging

- **Preset System**: Composable presets that merge in order

  - Presets are defined internally (gitflow, github-flow, trunk-based, release-branches, gitlab-flow)
  - Presets provide base `flows` and `branches` (metadata only) configurations
  - Presets are applied in sequence: each preset merges into the previous result
  - Local `branches` and `flows` sections override preset values
  - Deep merge: flow arrays are merged, branch metadata is merged
  - Example: Preset defines `sync-version` flow, local adds `bump-version` flow → both apply

- **Flow Matching and Translation**: Convert flows to behavior-driven config
  - Match current GitHub event context (branch, event type) to flows
  - Flow's `versioning` field directly maps to `strategy` (pre-release → `pre-release`, finalize → `finalize`, none → `do-nothing`)
  - Flow's `from`/`to` patterns determine source and target branches
  - Flow's `base` field (if specified) maps to `base` config, otherwise inferred
  - Branch protection status (from metadata or API) determines `create_branch`
  - Generate behavior-driven config from matched flow and branch context

### 7. Automatic PR Creation

- **PR Creation**: Automatically handled based on branch protection status
  - If target branch is protected → action creates a branch and PR automatically
  - Uses version branch created by the action
  - Use GitHub CLI (`gh pr create`) for PR creation
  - Handle existing PRs (check if PR already exists, update vs create)
  - Customize PR title and body from templates
  - PR creation is inferred from flow's `to` branch protection status, not explicitly configured

### 8. Model Validation

- **Schema Validation**: Validate `.versioning.yml` structure
  - Check required fields
  - Validate preset names (must be known preset or error)
  - Validate branch role values
  - Validate versioning strategy values
  - Validate flow syntax (`name`, `from`, `to`, `triggered`, `versioning`, `base`, `from-exclude`)
  - Provide clear error messages

### 9. Preset Definition and Library

- **Preset System**: Presets are internal configurations that provide base `branches` and `flows`
  - Presets are defined in the action codebase
  - Available presets: `gitflow`, `github-flow`, `trunk-based`, `release-branches`, `gitlab-flow`
  - Each preset defines default `branches` and `flows` sections
  - Presets can be composed: multiple presets merge together
  - Users reference presets by name in the `presets:` array
  - Presets provide sensible defaults that can be selectively overridden

### 10. Configuration Merging and Override

- **Override Mechanism**: Allow action inputs to override model-driven config
  - Merge action inputs with model-driven config (from file or inference)
  - Action inputs take precedence over model-driven config
  - Support partial overrides (e.g., override just `create_branch` while keeping rest from model)
  - Preserve model-driven defaults for unspecified inputs
  - Example: Model says `create_branch: true`, input says `create_branch: false` → use `false`

### 11. Branch Role Detection

- **Role Inference**: Determine branch role from:
  - Explicit role in model definition (local config or preset)
  - Branch name pattern matching
  - Preset definitions (if using presets)
  - Default role assignment

### 12. Environment Promotion (GitLab Flow)

- **Environment Branches**: Support environment-based workflows
  - Track version through environments (main → pre-prod → prod)
  - Environment-specific versioning
  - Promotion workflows

## Implementation Phases

### Phase 1: Core Infrastructure

- Configuration file reading
- Pattern matching
- Basic pattern-to-behavior translation

### Phase 2: Strategy Extensions

- `finalize` strategy implementation
- `sync` strategy implementation
- Branch protection detection

### Phase 3: Advanced Features

- Version synchronization workflows
- PR creation support
- Environment promotion

### Phase 4: Preset System

- Implement preset composition and merging logic
- Define all preset configurations (gitflow, github-flow, etc.)
- Implement deep merge algorithm for branches/flows
- Documentation and examples
- Migration guides

## Migration Strategy

1. **Phase 1**: Implement model-driven configuration alongside existing behavior-driven model
2. **Phase 2**: Add `.versioning.yml` support and preset composition system
3. **Phase 3**: Document both approaches, provide examples
4. **Phase 4**: Users can migrate to model-driven at their own pace (optional)

## Links

- [Branching Patterns Documentation](./branching-patterns.md)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
