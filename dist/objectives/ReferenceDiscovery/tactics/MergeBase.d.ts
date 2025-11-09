import type { Tactic, TacticResult, ReferencePointResult, ReferenceDiscoveryContext } from '../../../types/index.js';
/**
 * MergeBaseTactic - Uses git merge-base to find the common ancestor between current branch and base branch.
 *
 * This tactic is context-aware:
 * - Only executes if baseBranch is provided
 * - Attempts to fetch remote branches if needed
 * - Provides detailed context about branch availability
 * - Gracefully handles cases where merge-base fails
 */
export declare class MergeBaseTactic implements Tactic<ReferencePointResult, ReferenceDiscoveryContext> {
    get name(): string;
    assess(context: ReferenceDiscoveryContext): boolean;
    attempt(context: ReferenceDiscoveryContext): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>>;
    private gatherGitInfo;
    private commonCommit;
    private getVersionAtCommit;
}
//# sourceMappingURL=MergeBase.d.ts.map