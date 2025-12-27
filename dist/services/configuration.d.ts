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
     * Parse configuration from GitHub Actions inputs.
     */
    parseConfiguration(): Promise<ActionConfiguration>;
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