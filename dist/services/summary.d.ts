import type { ActionConfiguration } from '@types';
import type { VersionBumpResults } from './version-bump.js';
/**
 * Service responsible for generating comprehensive summaries and reports.
 * Handles GitHub Actions summary creation and output generation.
 */
export declare class SummaryService {
    private readonly config;
    constructor(config: ActionConfiguration);
    /**
     * Generate comprehensive summary for the version bump process.
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
}
//# sourceMappingURL=summary.d.ts.map