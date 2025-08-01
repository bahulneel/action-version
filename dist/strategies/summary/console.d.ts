import type { ActionConfiguration, VersionBumpResults } from '../../types/index.js';
import { BaseSummaryStrategy } from './base.js';
/**
 * Console summary strategy.
 * Generates console-based summaries for non-GitHub Actions environments.
 */
export declare class ConsoleSummaryStrategy extends BaseSummaryStrategy {
    constructor();
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
//# sourceMappingURL=console.d.ts.map