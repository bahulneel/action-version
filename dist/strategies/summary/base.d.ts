import type { SummaryStrategy, ActionConfiguration, VersionBumpResults } from '../../types/index.js';
/**
 * Abstract base class for summary strategies.
 * Implements the Strategy pattern for handling different summary generation approaches.
 */
export declare abstract class BaseSummaryStrategy implements SummaryStrategy {
    readonly name: string;
    protected constructor(name: string);
    /**
     * Generate summary for the version bump process.
     * @param results - The version bump results
     * @param config - The action configuration
     */
    abstract generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
}
//# sourceMappingURL=base.d.ts.map