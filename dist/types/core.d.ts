export type BumpType = 'major' | 'minor' | 'patch' | 'prerelease' | 'release';
export type StrategyName = 'do-nothing' | 'apply-bump' | 'pre-release';
export type BranchCleanupStrategyType = 'keep' | 'prune' | 'semantic';
export type GitOperationStrategyType = 'conventional' | 'simple';
export type PackageManagerType = 'npm' | 'yarn' | 'pnpm';
export type SummaryStrategyType = 'github-actions' | 'console';
export interface CommitInfo {
    readonly type: string | null;
    readonly scope: string | null;
    readonly subject: string | null;
    readonly breaking: boolean;
    readonly header: string | null;
}
export interface BumpResult {
    readonly version: string;
    readonly bumpType: BumpType;
    readonly sha: string | null;
}
export interface ReferencePointResult {
    readonly referenceCommit: string;
    readonly referenceVersion: string;
    readonly shouldFinalizeVersions: boolean;
    readonly shouldForceBump: boolean;
}
export interface PackageJson {
    name: string;
    version: string;
    workspaces?: string[] | {
        packages: string[];
    };
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    [key: string]: unknown;
}
export interface TestResult {
    readonly success: boolean;
    readonly error?: string;
    readonly prevVersion?: string;
}
export interface VersionBumpResults {
    bumped: Record<string, BumpResult>;
    testFailures: string[];
    totalPackages: number;
    releasePackages: number;
    prereleasePackages: number;
    finalizedPackages: number;
    hasBumped: boolean;
}
export interface SummaryStats {
    readonly totalPackages: number;
    readonly releasePackages: number;
    readonly prereleasePackages: number;
    readonly finalizedPackages: number;
}
export interface InterpolationVars {
    readonly [key: string]: string;
}
export interface DependencyGraph {
    [packageName: string]: {
        readonly dir: string;
        readonly deps: readonly string[];
        readonly pkg: PackageJson;
    };
}
export interface BuildDepGraphResult {
    readonly graph: DependencyGraph;
    readonly nameToDir: Record<string, string>;
}
export declare const DEPENDENCY_KEYS: readonly ["dependencies", "devDependencies", "peerDependencies"];
export type DependencyKey = (typeof DEPENDENCY_KEYS)[number];
export interface ValidationError extends Error {
    readonly field: string;
    readonly value: unknown;
}
//# sourceMappingURL=core.d.ts.map