import type { ReferenceGoals, ReferenceDiscoveryConfig, ReferencePointResult } from '../../../types/index.js';
import type { StrategyOf } from '../../../types/strategy.js';
/**
 * Tag-based discovery strategy.
 * Finds the highest semantic version tag as the reference point.
 */
export declare class TagDiscovery implements StrategyOf<ReferenceGoals> {
    readonly name = "tag-discovery";
    readonly description = "Find reference point based on highest semantic version tag";
    constructor(_config: ReferenceDiscoveryConfig);
    findReferencePoint(baseBranch: string | undefined, activeBranch: string): Promise<ReferencePointResult>;
    private getCurrentBranch;
    private findInitialCommit;
}
//# sourceMappingURL=TagDiscovery.d.ts.map