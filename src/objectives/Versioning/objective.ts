import type { Objective, VersioningGoals, ActionConfiguration, StrategyOf } from '@types'
import { Semver } from './strategies/Semver.js'

export const versioning: Objective<ActionConfiguration, VersioningGoals> = {
  strategise(config): StrategyOf<VersioningGoals> {
    // Map config.strategy to VersioningConfig and create Semver strategy
    const versioningConfig: import('@types').VersioningConfig = {
      approach:
        config.strategy === 'do-nothing'
          ? ('do-nothing' as const)
          : config.strategy === 'apply-bump'
          ? ('apply-bump' as const)
          : ('pre-release' as const),
    }
    return new Semver(versioningConfig)
  },
}
