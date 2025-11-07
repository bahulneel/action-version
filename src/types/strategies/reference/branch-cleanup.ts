import type { BranchCleanupStrategyType, BumpType, GitBranches } from '../..'

/**
 * Branch cleanup strategy interface.
 * Handles different approaches to cleaning up version branches.
 */
export interface BranchCleanup {
  readonly name: string
  execute(
    branches: GitBranches,
    versionedBranch: string,
    templateRegex: RegExp,
    rootBump: BumpType
  ): Promise<void>
}

/**
 * Configuration for branch cleanup strategy selection.
 */
export interface BranchCleanupConfig {
  readonly strategy: BranchCleanupStrategyType
}
