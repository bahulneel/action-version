import type { Objective } from '../types/objectives.js'
import type { Config } from '../types/config.js'
import type { VersionStrategy } from '../types/strategies/version.js'

/**
 * Version objective - resolves Version strategies based on configuration.
 */
export class Version {
  static strategise(config: Config): VersionStrategy {
    switch (config.bumpStrategy) {
      case 'do-nothing':
        // TODO: Import and return DoNothingStrategy
        throw new Error('DoNothingStrategy not yet implemented')
      case 'apply-bump':
        // TODO: Import and return ApplyBumpStrategy
        throw new Error('ApplyBumpStrategy not yet implemented')
      case 'pre-release':
        // TODO: Import and return PreReleaseStrategy
        throw new Error('PreReleaseStrategy not yet implemented')
      default:
        throw new Error(`Unknown bump strategy: ${config.bumpStrategy}`)
    }
  }
}

Version satisfies Objective<Config, VersionStrategy>
