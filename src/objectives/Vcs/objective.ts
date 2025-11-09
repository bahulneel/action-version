import type { Objective, VcsGoals, ActionConfiguration, StrategyOf } from '@types'
import { Git } from './strategies/Git.js'

export const vcsObjective: Objective<ActionConfiguration, VcsGoals> = {
  strategise(config): StrategyOf<VcsGoals> {
    // Currently only Git is supported; future: could branch on config.vcsKind
    return new Git(config)
  },
}


