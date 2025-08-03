import type { Tactic, TacticResult } from '../../../types/tactics.js';
import type { ReferencePointResult } from '../../../types/index.js';
import type { ReferenceDiscoveryContext } from './types.js';
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
//# sourceMappingURL=merge-base.d.ts.map