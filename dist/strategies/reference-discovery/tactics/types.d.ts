/**
 * Context information for reference discovery tactics.
 * Tactics can read from and write to context to share information.
 */
export interface ReferenceDiscoveryContext {
    baseBranch?: string;
    activeBranch: string;
    currentBranch: string;
    packageJsonPath?: string;
    attemptedStrategies?: string[];
    lastError?: string;
    gitInfo?: {
        availableBranches?: string[];
        availableTags?: string[];
        remoteExists?: boolean;
    };
}
//# sourceMappingURL=types.d.ts.map