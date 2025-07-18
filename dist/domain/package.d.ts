import type { PackageJson, BumpResult, StrategyName, GitOperationStrategy, PackageManagerStrategy, TestResult } from '../types/index.js';
/**
 * Represents a package in the workspace with its metadata and operations.
 * Encapsulates package-specific version management logic.
 */
export declare class Package {
    readonly name: string;
    readonly dir: string;
    private _pkg;
    readonly packageJsonPath: string;
    private _bumpResult;
    constructor(name: string, dir: string, _pkg: PackageJson, packageJsonPath: string);
    /**
     * Get the current version of the package.
     */
    get version(): string;
    /**
     * Set the version of the package.
     */
    set version(newVersion: string);
    /**
     * Get the package.json data.
     */
    get pkg(): Readonly<PackageJson>;
    /**
     * Get the relative path of the package directory.
     */
    get relativePath(): string;
    /**
     * Get the bump result if a version bump has occurred.
     */
    get bumpResult(): BumpResult | null;
    /**
     * Initialize the version if it's missing or invalid.
     */
    initializeVersion(): void;
    /**
     * Save the package.json file to disk.
     */
    save(): Promise<void>;
    /**
     * Get commits affecting this package since a reference commit.
     */
    getCommitsAffecting(sinceRef: string): Promise<readonly any[]>;
    /**
     * Process version bump for this package based on conventional commits.
     */
    processVersionBump(referenceCommit: string, referenceVersion: string, strategy: StrategyName, commitMsgTemplate: string, gitStrategy: GitOperationStrategy, shouldForceBump?: boolean): Promise<BumpResult | null>;
    /**
     * Finalize a prerelease version to a stable release.
     */
    finalizePrerelease(commitMsgTemplate: string, gitStrategy: GitOperationStrategy): Promise<BumpResult | null>;
    /**
     * Update a dependency to a new version.
     */
    updateDependency(depName: string, newVersion: string, depCommitMsgTemplate: string, gitStrategy: GitOperationStrategy): Promise<boolean>;
    /**
     * Test compatibility after dependency updates.
     */
    testCompatibility(packageManager: PackageManagerStrategy): Promise<TestResult>;
    private performVersionBump;
    private isPrerelease;
    private finalizeVersion;
    private calculateBumpType;
    private determineBumpType;
    private satisfiesVersion;
    private parseVersion;
    private writeJSON;
}
//# sourceMappingURL=package.d.ts.map