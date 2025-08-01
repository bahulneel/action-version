// Core domain types
export type BumpType = 'major' | 'minor' | 'patch' | 'prerelease' | 'release'
export type StrategyName = 'do-nothing' | 'apply-bump' | 'pre-release'
export type BranchCleanupStrategyType = 'keep' | 'prune' | 'semantic'
export type GitOperationStrategyType = 'conventional' | 'simple'
export type PackageManagerType = 'npm' | 'yarn' | 'pnpm'
export type SummaryStrategyType = 'github-actions' | 'console'

// Configuration interfaces
export interface ActionConfiguration {
  readonly commitMsgTemplate: string
  readonly depCommitMsgTemplate: string
  readonly shouldCreateBranch: boolean
  readonly branchTemplate: string
  readonly templateRegex: RegExp
  readonly branchCleanup: BranchCleanupStrategyType
  readonly baseBranch: string | undefined
  readonly strategy: StrategyName
  readonly activeBranch: string
  readonly tagPrereleases: boolean
}

// Git operation interfaces
export interface GitBranches {
  readonly all: readonly string[]
  readonly current: string
}

export interface CommitInfo {
  readonly type: string | null
  readonly scope: string | null
  readonly subject: string | null
  readonly breaking: boolean
  readonly header: string | null
}

export interface BumpResult {
  readonly version: string
  readonly bumpType: BumpType
  readonly sha: string | null
}

export interface ReferencePointResult {
  readonly referenceCommit: string
  readonly referenceVersion: string
  readonly shouldFinalizeVersions: boolean
  readonly shouldForceBump: boolean
}

// Package interfaces
export interface PackageJson {
  name: string
  version: string
  workspaces?: string[] | { packages: string[] }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  [key: string]: unknown
}

export interface TestResult {
  readonly success: boolean
  readonly error?: string
  readonly prevVersion?: string
}

// Strategy interfaces
export interface VersionBumpStrategy {
  readonly name: string
  execute(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    historicalBump: BumpType | null
  ): string | null
}

export interface BranchCleanupStrategy {
  readonly name: string
  execute(
    branches: GitBranches,
    versionedBranch: string,
    templateRegex: RegExp,
    rootBump: BumpType
  ): Promise<void>
}

export interface GitOperationStrategy {
  readonly name: string
  commitVersionChange(
    packageDir: string,
    packageName: string,
    version: string,
    bumpType: BumpType,
    template: string
  ): Promise<void>
  commitDependencyUpdate(
    packageDir: string,
    packageName: string,
    depName: string,
    depVersion: string,
    template: string
  ): Promise<void>
  tagVersion(version: string, isPrerelease: boolean, shouldTag: boolean): Promise<void>
}

export interface PackageManagerStrategy {
  readonly name: PackageManagerType
  isAvailable(): boolean
  test(packageDir: string): Promise<TestResult>
  install(packageDir: string): Promise<void>
}

export interface DiscoveryStrategy {
  findReferencePoint(
    baseBranch: string | undefined,
    activeBranch: string
  ): Promise<ReferencePointResult>
  findLastVersionChangeCommit(packageJsonPath: string): Promise<string | null>
  getVersionAtCommit(commitRef: string): Promise<string | null>
}

export interface VersionBumpResults {
  bumped: Record<string, BumpResult>
  testFailures: string[]
  totalPackages: number
  releasePackages: number
  prereleasePackages: number
  finalizedPackages: number
  hasBumped: boolean
}

export interface SummaryStrategy {
  readonly name: string
  generateSummary(results: VersionBumpResults, config: ActionConfiguration): Promise<void>
}

// Factory interfaces
export interface StrategyFactory<T> {
  getStrategy(name: string): T
  getAvailableStrategies(): readonly string[]
}

// Summary interfaces
export interface SummaryStats {
  readonly totalPackages: number
  readonly releasePackages: number
  readonly prereleasePackages: number
  readonly finalizedPackages: number
}

// Utility types
export interface InterpolationVars {
  readonly [key: string]: string
}

export interface DependencyGraph {
  [packageName: string]: {
    readonly dir: string
    readonly deps: readonly string[]
    readonly pkg: PackageJson
  }
}

export interface BuildDepGraphResult {
  readonly graph: DependencyGraph
  readonly nameToDir: Record<string, string>
}

// Git operation types
export interface GitSetupResult {
  readonly currentBranch: string
  readonly newBranch: string | undefined
}

// Validation interfaces
export interface ValidationError extends Error {
  readonly field: string
  readonly value: unknown
}

// Constants
export const DEPENDENCY_KEYS = ['dependencies', 'devDependencies', 'peerDependencies'] as const
export type DependencyKey = (typeof DEPENDENCY_KEYS)[number]

// Type guards
export function isBumpType(value: string): value is BumpType {
  return ['major', 'minor', 'patch', 'prerelease', 'release'].includes(value)
}

export function isStrategyName(value: string): value is StrategyName {
  return ['do-nothing', 'apply-bump', 'pre-release'].includes(value)
}

export function isBranchCleanupStrategy(value: string): value is BranchCleanupStrategyType {
  return ['keep', 'prune', 'semantic'].includes(value)
}

export function isGitOperationStrategyType(value: string): value is GitOperationStrategyType {
  return ['conventional', 'simple'].includes(value)
}

export function isPackageManagerType(value: string): value is PackageManagerType {
  return ['npm', 'yarn', 'pnpm'].includes(value)
}
