import type { BumpType, GitSetupResult } from '../index.js'

/**
 * Goals for VCS objective.
 */
export interface VcsGoals {
  setup(context: { shouldCreateBranch: boolean; branchTemplate: string }): Promise<GitSetupResult>
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
  prepareVersionBranch(versionedBranch: string, tempRef?: string): Promise<void>
}

/**
 * Configuration for VCS strategy selection.
 */
export interface VcsConfig {
  // Future: could add vcsKind: 'git' | 'mercurial' | 'svn'
}

// Legacy alias for backwards compatibility with existing code
export type VcsInterface = VcsGoals




