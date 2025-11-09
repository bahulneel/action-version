import type { ActionConfiguration } from '../index.js';
import type { VersionBumpResults } from '../core.js';
/**
 * Goals for summary output objective.
 */
export interface SummaryOutputGoals {
    generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>;
}
/**
 * Configuration for summary output strategy selection.
 */
export interface SummaryOutputConfig {
    readonly kind: 'github-actions' | 'console';
}
//# sourceMappingURL=summary.d.ts.map