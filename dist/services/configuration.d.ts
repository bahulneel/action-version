import type { ActionConfiguration } from '../types/index.js';
/**
 * Service responsible for parsing and validating action configuration.
 * Handles GitHub Actions inputs and provides validated configuration objects.
 */
export declare class ConfigurationService {
    /**
     * Parse configuration from GitHub Actions inputs.
     */
    parseConfiguration(): Promise<ActionConfiguration>;
    /**
     * Parse raw inputs from GitHub Actions.
     */
    private parseRawInputs;
    /**
     * Safely parse boolean input with fallback to default.
     */
    private safeGetBooleanInput;
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