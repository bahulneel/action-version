import type { Objective, CommitMessagingGoals, ActionConfiguration, StrategyOf } from '@types'
import { Conventional } from './strategies/Conventional.js'
import { Simple } from './strategies/Simple.js'

export const commitMessaging: Objective<ActionConfiguration, CommitMessagingGoals> = {
  strategise(_config): StrategyOf<CommitMessagingGoals> {
    // Map ActionConfiguration to CommitMessagingConfig
    // Default to conventional for now; could extend config to specify
    const commitConfig = {
      kind: 'conventional' as const,
    }

    if (commitConfig.kind === 'conventional') {
      return new Conventional(commitConfig)
    } else {
      return new Simple(commitConfig)
    }
  },
}
