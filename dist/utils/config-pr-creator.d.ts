import type { VersioningConfig as ModelVersioningConfig } from '../types/versioning-config.js';
/**
 * Create a PR with the inferred .versioning.yml configuration.
 * Returns the PR URL if successful, null if PR creation failed.
 */
export declare function createConfigPR(config: ModelVersioningConfig): Promise<string | null>;
/**
 * Output inferred config to GitHub Actions summary.
 */
export declare function outputConfigToSummary(config: ModelVersioningConfig): Promise<void>;
//# sourceMappingURL=config-pr-creator.d.ts.map