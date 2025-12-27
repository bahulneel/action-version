import type { ActionConfiguration } from '@types';
import type { VersionBumpResults } from './version-bump.js';
/**
 * Service responsible for generating comprehensive summaries and reports.
 * Thin orchestrator that delegates to SummaryOutput objective.
 */
export declare class SummaryService {
    private readonly config;
    constructor(config: ActionConfiguration);
    /**
     * Generate comprehensive summary for the version bump process.
     */
    generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
}
//# sourceMappingURL=summary.d.ts.map