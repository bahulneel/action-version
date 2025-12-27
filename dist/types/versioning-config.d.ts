/**
 * Type definitions for model-driven versioning configuration.
 * These types represent the structure of .versioning.yml files.
 */
/**
 * Preset names that can be used in the presets array.
 */
export type PresetName = 'gitflow' | 'github-flow' | 'trunk-based' | 'release-branches' | 'gitlab-flow';
/**
 * Versioning strategy types that can be specified in flows.
 */
export type VersioningStrategy = 'pre-release' | 'finalize';
/**
 * Flow definition describing how versions move and change.
 */
export interface Flow {
    /** Name of the flow (for identification/debugging) */
    name: string;
    /** Source branch pattern (e.g., 'develop', 'release/*', '*') */
    from: string;
    /** Target branch pattern (e.g., 'main', 'develop') */
    to: string;
    /** Whether this flow is explicitly triggered (true) or implicit (false/undefined) */
    triggered?: boolean;
    /** Versioning strategy to use for this flow */
    versioning?: VersioningStrategy;
    /** Base branch for comparison (optional, can be inferred) */
    base?: string;
    /** Branches to exclude from the 'from' pattern (when using wildcards) */
    'from-exclude'?: string[];
}
/**
 * Branch metadata - properties that affect behavior.
 */
export interface BranchMetadata {
    /** Whether the branch is protected (requires PRs) */
    protected?: boolean;
    /** Whether to create git tags for releases on this branch */
    tags?: boolean;
}
/**
 * Versioning configuration model.
 * This is the structure of .versioning.yml files.
 */
export interface VersioningConfig {
    /** Array of preset names to compose (applied in order) */
    presets?: PresetName[];
    /** Branch metadata keyed by branch pattern */
    branches?: Record<string, BranchMetadata>;
    /** Flow definitions describing version operations */
    flows?: Flow[];
}
//# sourceMappingURL=versioning-config.d.ts.map