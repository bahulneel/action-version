import type { BranchCleanupStrategyType, BumpType, GitBranches } from '../..'
import type { Strategy } from '../../strategy.js'
/**
 * Branch cleanup strategy interface.
 * Handles different approaches to cleaning up version branches.
 */
export interface BranchCleanup extends Strategy {
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
