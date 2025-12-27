import type { Objective, SummaryOutputGoals, ActionConfiguration, StrategyOf } from '@types'
import { GitHubActions } from './strategies/GitHubActions.js'
import { Console } from './strategies/Console.js'
import { GitHubActionsLogger, ConsoleLogger } from '../../adapters/Logging/index.js'

export const summaryOutput: Objective<ActionConfiguration, SummaryOutputGoals> = {
  strategise(_config): StrategyOf<SummaryOutputGoals> {
    // Select based on environment
    const summaryConfig = {
      kind:
        process.env.GITHUB_ACTIONS === 'true' ? ('github-actions' as const) : ('console' as const),
    }

    if (summaryConfig.kind === 'github-actions') {
      const logger = new GitHubActionsLogger()
      return new GitHubActions(summaryConfig, logger)
    } else {
      const logger = new ConsoleLogger()
      return new Console(summaryConfig, logger)
    }
  },
}
