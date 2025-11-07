import type { Strategy } from '../../types/strategies/index.js'
import type { BumpType } from '../../types/index.js'

/**
 * Branch cleanup configuration.
 */
export interface BranchCleanupConfig {
  strategy: 'keep-all' | 'prune-old' | 'semantic'
  keepCount?: number
  dryRun?: boolean
}

/**
 * Git branches information.
 */
export interface GitBranches {
  local: string[]
  remote: string[]
  current: string
}

/**
 * Branch cleanup domain interface.
 */
export interface BranchCleanupInterface extends Strategy {
  perform(
    branches: GitBranches,
    versionedBranch: string,
    templateRegex: RegExp,
    rootBump: BumpType
  ): Promise<void>
}

/**
 * BranchCleanup objective - resolves BranchCleanup strategies based on configuration.
 */
export class BranchCleanup {
  static strategise(config: BranchCleanupConfig): BranchCleanupInterface {
    switch (config.strategy) {
      case 'keep-all':
        // TODO: Import and return KeepAllStrategy
        throw new Error('KeepAllStrategy not yet implemented')
      case 'prune-old':
        // TODO: Import and return PruneOldStrategy
        throw new Error('PruneOldStrategy not yet implemented')
      case 'semantic':
        // TODO: Import and return SemanticStrategy
        throw new Error('SemanticStrategy not yet implemented')
      default:
        throw new Error(`Unknown branch cleanup strategy: ${config.strategy}`)
    }
  }
}
