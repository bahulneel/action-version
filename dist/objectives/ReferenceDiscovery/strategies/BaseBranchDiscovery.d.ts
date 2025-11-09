import type { ReferenceGoals, ReferenceDiscoveryConfig, ReferencePointResult } from '../../../types/index.js';
import type { StrategyOf } from '../../../types/strategy.js';
/**
 * Branch-based discovery strategy.
 * Finds the merge base between the active branch and the base branch.
 */
export declare class BaseBranchDiscovery implements StrategyOf<ReferenceGoals> {
    readonly name = "base-branch-discovery";
    readonly description = "Find reference point based on merge base with base branch";
    constructor(_config: ReferenceDiscoveryConfig);
    findReferencePoint(baseBranch: string | undefined, activeBranch: string): Promise<ReferencePointResult>;
    private getCurrentBranch;
}
//# sourceMappingURL=BaseBranchDiscovery.d.ts.map