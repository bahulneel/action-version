import type { Objective, ReferenceGoals, ActionConfiguration, StrategyOf } from '@types'
import { TagDiscovery } from './strategies/TagDiscovery.js'
import { BaseBranchDiscovery } from './strategies/BaseBranchDiscovery.js'

export const referenceDiscovery: Objective<ActionConfiguration, ReferenceGoals> = {
  strategise(config): StrategyOf<ReferenceGoals> {
    // Map ActionConfiguration to ReferenceDiscoveryConfig and select strategy
    const discoveryConfig = {
      kind: config.baseBranch ? ('base-branch' as const) : ('tag' as const),
      ...(config.baseBranch !== undefined && { baseBranch: config.baseBranch }),
    }

    if (discoveryConfig.kind === 'base-branch') {
      return new BaseBranchDiscovery(discoveryConfig)
    } else {
      return new TagDiscovery(discoveryConfig)
    }
  },
}
