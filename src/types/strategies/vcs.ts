import type { Strategy } from './index.js'
import type { ActionConfiguration, BumpType, GitSetupResult } from '../../index.js'

/**
 * VCS configuration currently aligns with ActionConfiguration.
 * Left as a distinct type to allow future divergence (e.g., Mercurial, SVN).
 */
export type VcsConfig = ActionConfiguration

/**
 * Version Control interface to abstract operations for different VCS kinds.
 * Implementations (e.g. Git) should be named `Strategy` under `strategies/Vcs/`.
 */
export interface VcsInterface extends Strategy {
  // Environment preparation (e.g., configure user, fetch/unshallow, create temp ref)
  setup(context: { shouldCreateBranch: boolean; branchTemplate: string }): Promise<GitSetupResult>

  // Operations used by the version-bump workflow
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


