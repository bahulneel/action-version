import type { ActionConfiguration, PackageJson, ReferencePointResult, StrategyOf } from '@types';
import type { VersionBumpingGoals } from '../../../types/goals/version-bumping.js';
import { Package } from '../../../domain/package.js';
import type { VersionBumpResults } from '../../../services/version-bump.js';
/**
 * Workspace version bump strategy.
 * Handles version bumping for entire workspace including packages and root.
 */
export declare class WorkspaceVersionBump implements StrategyOf<VersionBumpingGoals> {
    private readonly config;
    private readonly gitStrategy;
    private readonly packageManager;
    readonly name = "workspace-version-bump";
    readonly description = "Workspace-wide version bumping strategy";
    constructor(config: ActionConfiguration, gitStrategy: StrategyOf<import('@types').VcsGoals>, packageManager: StrategyOf<import('@types').PackageManagementGoals>);
    processWorkspace(packages: Package[], rootPkg: PackageJson, referencePoint: ReferencePointResult, config: ActionConfiguration): Promise<VersionBumpResults>;
    /**
     * Finalize prerelease versions when base branch is updated.
     */
    private finalizePackageVersions;
    /**
     * Sync package versions from source branch to target branch.
     * Copies exact versions without any calculations.
     */
    private syncPackageVersions;
    /**
     * Read package versions from a specific branch.
     */
    private readVersionsFromBranch;
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
     * Get workspace directories from the root package.json workspaces configuration.
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
//# sourceMappingURL=WorkspaceVersionBump.d.ts.map