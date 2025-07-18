import type { GitBranches, BumpType } from '../../types/index.js';
import { BaseBranchCleanupStrategy } from './base.js';
/**
 * Semantic strategy that keeps only branches with different bump types.
 * This allows multiple major/minor/patch branches to coexist while cleaning up duplicates.
 */
export declare class SemanticBranchesStrategy extends BaseBranchCleanupStrategy {
    constructor();
    execute(branches: GitBranches, versionedBranch: string, templateRegex: RegExp, rootBump: BumpType): Promise<void>;
    private shouldDeleteBranch;
    private deleteBranchSafely;
}
//# sourceMappingURL=semantic.d.ts.map