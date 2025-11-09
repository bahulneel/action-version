import type { SummaryOutputGoals, SummaryOutputConfig, ActionConfiguration, VersionBumpResults, StrategyOf } from '@types';
/**
 * GitHub Actions summary strategy.
 * Generates rich markdown summaries for GitHub Actions environments.
 */
export declare class GitHubActions implements StrategyOf<SummaryOutputGoals> {
    readonly name = "github-actions";
    readonly description = "GitHub Actions markdown summary";
    constructor(_config: SummaryOutputConfig);
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
//# sourceMappingURL=GitHubActions.d.ts.map