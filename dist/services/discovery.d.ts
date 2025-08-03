import type { ReferencePointResult } from '../types/index.js';
/**
 * Service responsible for discovering git reference points and version information.
 * Handles tag-based and branch-based reference point strategies.
 */
export declare class DiscoveryService {
    /**
     * Determine the reference point for version comparison.
     */
    determineReferencePoint(baseBranch: string | undefined, activeBranch: string): Promise<ReferencePointResult>;
    /**
     * Find reference point based on branch comparison using tactical system.
     */
    private findBranchBasedReference;
    /**
     * Find reference point based on latest git tag.
     */
    private findTagBasedReference;
    /**
     * Get the current branch name.
     */
    private getCurrentBranch;
    /**
     * Get package version at a specific commit.
     */
    getVersionAtCommit(commitRef: string): Promise<string | null>;
    /**
     * Find the initial commit of the repository.
     */
    private findInitialCommit;
    /**
     * Find the last version change commit for a specific package.
     */
    findLastVersionChangeCommit(packageJsonPath: string): Promise<string | null>;
}
//# sourceMappingURL=discovery.d.ts.map