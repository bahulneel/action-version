import type { GitBranches, BumpType } from '../../types/index.js';
import { BaseBranchCleanupStrategy } from './base.js';
/**
 * Prune-old strategy that removes all old version branches except the current one.
 * This keeps the workspace clean by removing outdated version branches.
 */
export declare class PruneOldBranchesStrategy extends BaseBranchCleanupStrategy {
    constructor();
    execute(branches: GitBranches, versionedBranch: string, templateRegex: RegExp, rootBump: BumpType): Promise<void>;
    private isVersionBranch;
    private deleteBranchSafely;
}
//# sourceMappingURL=prune-old.d.ts.map