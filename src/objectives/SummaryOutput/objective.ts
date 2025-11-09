import type { Objective, SummaryOutputGoals, ActionConfiguration, StrategyOf } from '@types'
import { GitHubActions } from './strategies/GitHubActions.js'
import { Console } from './strategies/Console.js'

export const summaryOutput: Objective<ActionConfiguration, SummaryOutputGoals> = {
  strategise(_config): StrategyOf<SummaryOutputGoals> {
    // Select based on environment
    const summaryConfig = {
      kind:
        process.env.GITHUB_ACTIONS === 'true' ? ('github-actions' as const) : ('console' as const),
    }

    if (summaryConfig.kind === 'github-actions') {
      return new GitHubActions(summaryConfig)
    } else {
      return new Console(summaryConfig)
    }
  },
}
