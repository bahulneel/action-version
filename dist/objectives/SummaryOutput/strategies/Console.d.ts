import type { SummaryOutputGoals, SummaryOutputConfig, ActionConfiguration, VersionBumpResults, StrategyOf } from '@types';
import type { LoggingAdapter } from '../../../adapters/Logging/LoggingAdapter.js';
/**
 * Console summary strategy.
 * Generates console-based summaries for non-GitHub Actions environments.
 */
export declare class Console implements StrategyOf<SummaryOutputGoals> {
    private readonly logger;
    readonly name = "console";
    readonly description = "Console-based summary output";
    constructor(_config: SummaryOutputConfig, logger: LoggingAdapter);
    /**
     * Generate console-based summary for non-GitHub Actions environments.
     */
    generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
    /**
     * Log summary to console for debugging.
     */
    private logResultsSummary;
    /**
     * Generate notices based on results.
     */
    private generateNotices;
    /**
     * Add console-based recommendations for non-GitHub Actions environments.
     */
    private addConsoleRecommendations;
    /**
     * Format bump type with emoji for better readability.
     */
    private formatBumpType;
}
//# sourceMappingURL=Console.d.ts.map