import type { Objective } from '../types/objectives.js'
import type { Config } from '../types/config.js'
import type { ReferenceStrategy } from '../types/strategies/reference.js'

/**
 * Reference objective - resolves Reference strategies based on configuration.
 */
export class Reference {
  static strategise(config: Config): ReferenceStrategy {
    // Determine strategy based on configuration
    if (config.baseBranch) {
      // TODO: Import and return BaseBranchStrategy
      throw new Error('BaseBranchStrategy not yet implemented')
    } else {
      // TODO: Import and return TagStrategy (fallback)
      throw new Error('TagStrategy not yet implemented')
    }
  }
}

Reference satisfies Objective<Config, ReferenceStrategy>

/**
 * Reference point result type.
 */
export interface ReferencePoint {
  referenceCommit: string
  referenceVersion: string
  shouldFinalizeVersions: boolean
}
