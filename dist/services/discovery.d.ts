import type { ReferencePointResult, ActionConfiguration } from '@types';
/**
 * Service responsible for discovering git reference points and version information.
 * Uses the ReferenceDiscovery objective to select appropriate strategy.
 */
export declare class DiscoveryService {
    private readonly config;
    constructor(config: ActionConfiguration);
    /**
     * Determine the reference point for version comparison.
     */
    determineReferencePoint(baseBranch: string | undefined, activeBranch: string): Promise<ReferencePointResult>;
    /**
     * Get package version at a specific commit.
     */
    getVersionAtCommit(commitRef: string): Promise<string | null>;
    /**
     * Find the last version change commit for a specific package.
     */
    findLastVersionChangeCommit(packageJsonPath: string): Promise<string | null>;
}
//# sourceMappingURL=discovery.d.ts.map