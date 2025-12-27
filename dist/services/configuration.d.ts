import type { ActionConfiguration } from '../types/index.js';
import type { ConfigAdapter } from '../types/config.js';
/**
 * Service responsible for parsing and validating action configuration.
 * Handles GitHub Actions inputs and provides validated configuration objects.
 */
export declare class ConfigurationService {
    private readonly adapter;
    constructor(adapter: ConfigAdapter);
    /**
     * Parse configuration from GitHub Actions inputs or .versioning.yml file.
     * Follows fail-fast design: checks for .versioning.yml first, fails if missing.
     */
    parseConfiguration(): Promise<ActionConfiguration>;
    /**
     * Handle missing .versioning.yml: infer model, create PR, then fail.
     */
    private handleMissingConfig;
    /**
     * Get GitHub context from environment variables.
     */
    private getGitHubContext;
    /**
     * Merge action inputs over model-driven config (inputs override).
     */
    private mergeInputsOverConfig;
    /**
     * Parse raw inputs from GitHub Actions.
     */
    private parseRawInputs;
    /**
     * Log the final configuration for debugging.
     */
    private logConfiguration;
    /**
     * Validate strategy compatibility and log warnings.
     */
    private validateStrategyCompatibility;
}
//# sourceMappingURL=configuration.d.ts.map