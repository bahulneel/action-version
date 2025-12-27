import type { ActionConfiguration } from '../types/index.js';
import type { VersioningConfig as ModelVersioningConfig } from '../types/versioning-config.js';
import { type GitHubContext } from '../utils/flow-matcher.js';
/**
 * Translate model-driven configuration to behavior-driven ActionConfiguration.
 */
export declare class ConfigTranslator {
    private readonly branchProtection;
    /**
     * Convert model config to ActionConfiguration based on current GitHub context.
     */
    translateToActionConfig(modelConfig: ModelVersioningConfig, gitHubContext: GitHubContext): Promise<ActionConfiguration>;
    /**
     * Extract versioning strategy from flow.
     */
    private extractStrategy;
    /**
     * Get default ActionConfiguration when no flow matches.
     */
    private getDefaultConfig;
}
//# sourceMappingURL=config-translator.d.ts.map