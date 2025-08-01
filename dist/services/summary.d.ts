import type { ActionConfiguration } from '../types/index.js';
import type { VersionBumpResults } from './version-bump.js';
/**
 * Service responsible for generating comprehensive summaries and reports.
 * Handles GitHub Actions summary creation and output generation.
 */
export declare class SummaryService {
    /**
     * Generate comprehensive summary for the version bump process.
     */
    generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
    /**
     * Generate GitHub Actions summary with detailed tables.
     */
    private generateActionsSummary;
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
//# sourceMappingURL=summary.d.ts.map