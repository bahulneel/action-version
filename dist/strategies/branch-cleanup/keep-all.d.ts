import type { GitBranches, BumpType } from '../../types/index.js';
import { BaseBranchCleanupStrategy } from './base.js';
/**
 * Keep-all strategy that preserves all version branches.
 * This is the safest option as it doesn't delete any branches.
 */
export declare class KeepAllBranchesStrategy extends BaseBranchCleanupStrategy {
    constructor();
    execute(branches: GitBranches, versionedBranch: string, templateRegex: RegExp, rootBump: BumpType): Promise<void>;
}
//# sourceMappingURL=keep-all.d.ts.map