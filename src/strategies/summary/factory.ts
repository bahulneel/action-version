import type { SummaryStrategyType, SummaryStrategy } from '../../types/index.js'
import { GitHubActionsSummaryStrategy } from './github-actions.js'
import { ConsoleSummaryStrategy } from './console.js'

/**
 * Factory class for creating summary strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export class SummaryStrategyFactory {
  private static readonly strategies: ReadonlyMap<SummaryStrategyType, SummaryStrategy> = new Map<
    SummaryStrategyType,
    SummaryStrategy
  >([
    ['github-actions', new GitHubActionsSummaryStrategy()],
    ['console', new ConsoleSummaryStrategy()],
  ])

  /**
   * Get a summary strategy by name.
   * @param strategyName - The name of the strategy to retrieve
   * @returns The strategy instance
   * @throws Error if the strategy is not found
   */
  public static getStrategy(strategyName: SummaryStrategyType): SummaryStrategy {
    const strategy = this.strategies.get(strategyName)
    if (!strategy) {
      throw new Error(
        `Unknown summary strategy: ${strategyName}. Available strategies: ${this.getAvailableStrategies().join(
          ', '
        )}`
      )
    }
    return strategy
  }

  /**
   * Get the appropriate summary strategy based on environment.
   * @returns The strategy instance
   */
  public static getAppropriateStrategy(): SummaryStrategy {
    // Check if we're in a GitHub Actions environment
    if (process.env.GITHUB_STEP_SUMMARY) {
      return this.getStrategy('github-actions')
    } else {
      return this.getStrategy('console')
    }
  }

  /**
   * Get all available strategy names.
   * @returns Array of available strategy names
   */
  public static getAvailableStrategies(): readonly SummaryStrategyType[] {
    return Array.from(this.strategies.keys())
  }

  /**
   * Check if a strategy exists.
   * @param strategyName - The strategy name to check
   * @returns True if the strategy exists
   */
  public static hasStrategy(strategyName: string): strategyName is SummaryStrategyType {
    return this.strategies.has(strategyName as SummaryStrategyType)
  }
}
