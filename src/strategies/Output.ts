import type { Objective } from '../types/objectives.js'
import type { Config } from '../types/config.js'
import type { OutputStrategy } from '../types/strategies/output.js'

/**
 * Output objective - resolves Output strategies based on configuration.
 */
export class Output {
  static strategise(config: Config): OutputStrategy {
    // Detect output format from environment (GITHUB_ACTIONS, GITHUB_STEP_SUMMARY)
    if (process.env.GITHUB_ACTIONS === 'true') {
      // TODO: Import and return GitHubActionsStrategy
      throw new Error('GitHubActionsStrategy not yet implemented')
    } else {
      // TODO: Import and return ConsoleStrategy
      throw new Error('ConsoleStrategy not yet implemented')
    }
  }
}

Output satisfies Objective<Config, OutputStrategy>
