import type { ActionConfiguration, PackageJson, GitOperationStrategy, PackageManagerStrategy, BumpResult } from '../types/index.js';
import { Package } from '../domain/package.js';
export interface VersionBumpResults {
    bumped: Record<string, BumpResult>;
    testFailures: string[];
    totalPackages: number;
    releasePackages: number;
    prereleasePackages: number;
    finalizedPackages: number;
    hasBumped: boolean;
}
/**
 * Service responsible for orchestrating the complete version bump process.
 * Handles package discovery, version calculation, and dependency updates.
 */
export declare class VersionBumpService {
    private readonly gitStrategy;
    private readonly packageManager;
    private readonly discoveryService;
    constructor(gitStrategy: GitOperationStrategy, packageManager: PackageManagerStrategy);
    /**
     * Process the entire workspace for version bumps.
     */
    processWorkspace(packages: Package[], rootPkg: PackageJson, config: ActionConfiguration): Promise<VersionBumpResults>;
    /**
     * Finalize prerelease versions when base branch is updated.
     */
    private finalizePackageVersions;
    /**
     * Process normal version bumps based on conventional commits.
     */
    private processNormalVersionBumps;
    /**
     * Process version bumps for all workspace packages.
     */
    private processWorkspacePackages;
    /**
     * Update dependencies between packages when versions change.
     */
    private updateDependencies;
    /**
     * Process root package version bump based on workspace changes.
     */
    private processRootPackage;
    /**
     * Get commits affecting non-workspace files.
     */
    private getNonWorkspaceCommits;
    /**
     * Get workspace directories.
     */
    private getWorkspaceDirectories;
    /**
     * Calculate statistics from bump results.
     */
    private calculateStats;
    /**
     * Check if a version is a prerelease.
     */
    private isPrerelease;
    /**
     * Save the root package.json file.
     */
    private saveRootPackage;
}
//# sourceMappingURL=version-bump.d.ts.map