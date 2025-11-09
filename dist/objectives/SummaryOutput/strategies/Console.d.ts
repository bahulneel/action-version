import type { SummaryOutputGoals, SummaryOutputConfig, ActionConfiguration, VersionBumpResults, StrategyOf } from '@types';
/**
 * Console summary strategy.
 * Generates console-based summaries for non-GitHub Actions environments.
 */
export declare class Console implements StrategyOf<SummaryOutputGoals> {
    readonly name = "console";
    readonly description = "Console-based summary output";
    constructor(_config: SummaryOutputConfig);
    /**
     * Generate console-based summary for non-GitHub Actions environments.
     */
    generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
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