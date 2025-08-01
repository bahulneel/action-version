import type { ActionConfiguration, VersionBumpResults } from '../../types/index.js';
import { BaseSummaryStrategy } from './base.js';
/**
 * GitHub Actions summary strategy.
 * Generates rich markdown summaries for GitHub Actions environments.
 */
export declare class GitHubActionsSummaryStrategy extends BaseSummaryStrategy {
    constructor();
    /**
     * Generate GitHub Actions summary with detailed tables.
     */
    generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
    /**
     * Add recommendations section to summary.
     */
    private addRecommendations;
    /**
     * Format bump type with emoji for better readability.
     */
    private formatBumpType;
}
//# sourceMappingURL=github-actions.d.ts.map