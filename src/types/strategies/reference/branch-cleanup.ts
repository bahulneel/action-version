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

// Backwards-compatible alias for legacy naming used across branch-cleanup strategy
export type BranchCleanupStrategy = BranchCleanup

/**
 * Configuration for branch cleanup strategy selection.
 */
export interface BranchCleanupConfig {
  readonly strategy: BranchCleanupStrategyType
}
