import type { BranchCleanupStrategy as IBranchCleanupStrategy, GitBranches, BumpType } from '../../types/index.js';
/**
 * Abstract base class for branch cleanup strategies.
 * Implements the Strategy pattern for handling different branch cleanup approaches.
 */
export declare abstract class BaseBranchCleanupStrategy implements IBranchCleanupStrategy {
    readonly name: string;
    protected constructor(name: string);
    /**
     * Execute the branch cleanup strategy.
     * @param branches - Information about git branches
     * @param versionedBranch - The current versioned branch name
     * @param templateRegex - Regex pattern for matching version branches
     * @param rootBump - The bump type for the root package
     */
    abstract execute(branches: GitBranches, versionedBranch: string, templateRegex: RegExp, rootBump: BumpType): Promise<void>;
}
//# sourceMappingURL=base.d.ts.map