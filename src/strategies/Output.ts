import type { Objective, Config, Summary } from '../types/index.js'

/**
 * Output objective - resolves Output strategies based on configuration.
 */
export class Output {
  static strategise(config: Config): Summary {
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

Output satisfies Objective<Config, Summary>
