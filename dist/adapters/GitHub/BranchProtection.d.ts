/**
 * GitHub branch protection adapter.
 * Checks if a branch is protected via GitHub API using gh CLI.
 */
export declare class BranchProtection {
    /**
     * Check if a branch is protected.
     * Caches results to avoid excessive API calls.
     */
    isBranchProtected(branchName: string): Promise<boolean>;
    /**
     * Clear the protection cache (useful for testing).
     */
    clearCache(): void;
}
//# sourceMappingURL=BranchProtection.d.ts.map