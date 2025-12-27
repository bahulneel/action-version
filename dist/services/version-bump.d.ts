import type { ActionConfiguration, PackageJson, StrategyOf } from '@types';
import { Package } from '../domain/package.js';
export interface VersionBumpResults {
    bumped: Record<string, import('@types').BumpResult>;
    testFailures: string[];
    totalPackages: number;
    releasePackages: number;
    prereleasePackages: number;
    finalizedPackages: number;
    hasBumped: boolean;
}
/**
 * Service responsible for orchestrating the complete version bump process.
 * Thin orchestrator that delegates to VersionBumping objective.
 */
export declare class VersionBumpService {
    private readonly gitStrategy;
    private readonly packageManager;
    private readonly discoveryService;
    constructor(gitStrategy: StrategyOf<import('@types').VcsGoals>, packageManager: StrategyOf<import('@types').PackageManagementGoals>, config: ActionConfiguration);
    /**
     * Process the entire workspace for version bumps.
     */
    processWorkspace(packages: Package[], rootPkg: PackageJson, config: ActionConfiguration): Promise<VersionBumpResults>;
}
//# sourceMappingURL=version-bump.d.ts.map