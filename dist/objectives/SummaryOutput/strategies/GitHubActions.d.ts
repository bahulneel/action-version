import type { SummaryOutputGoals, SummaryOutputConfig, ActionConfiguration, VersionBumpResults, StrategyOf } from '@types';
import type { LoggingAdapter } from '../../../adapters/Logging/LoggingAdapter.js';
/**
 * GitHub Actions summary strategy.
 * Generates rich markdown summaries for GitHub Actions environments.
 */
export declare class GitHubActions implements StrategyOf<SummaryOutputGoals> {
    private readonly logger;
    readonly name = "github-actions";
    readonly description = "GitHub Actions markdown summary";
    constructor(_config: SummaryOutputConfig, logger: LoggingAdapter);
    /**
     * Generate GitHub Actions summary with detailed tables.
     */
    generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
    /**
     * Log summary to console for debugging.
     */
    private logResultsSummary;
    /**
     * Generate GitHub Actions notices based on results.
     */
    private generateNotices;
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