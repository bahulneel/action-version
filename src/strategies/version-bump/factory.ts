import type { StrategyName, VersionBumpStrategy } from '../../types/index.js';
import { DoNothingStrategy } from './do-nothing.js';
import { ApplyBumpStrategy } from './apply-bump.js';
import { PreReleaseStrategy } from './pre-release.js';

/**
 * Factory class for creating version bump strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export class VersionBumpStrategyFactory {
  private static readonly strategies: ReadonlyMap<StrategyName, VersionBumpStrategy> = new Map([
    ['do-nothing', new DoNothingStrategy()],
    ['apply-bump', new ApplyBumpStrategy()],
    ['pre-release', new PreReleaseStrategy()],
  ]);

  /**
   * Get a version bump strategy by name.
   * @param strategyName - The name of the strategy to retrieve
   * @returns The strategy instance
   * @throws Error if the strategy is not found
   */
  public static getStrategy(strategyName: StrategyName): VersionBumpStrategy {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown version bump strategy: ${strategyName}. Available strategies: ${this.getAvailableStrategies().join(', ')}`);
    }
    return strategy;
  }

  /**
   * Get all available strategy names.
   * @returns Array of available strategy names
   */
  public static getAvailableStrategies(): readonly StrategyName[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if a strategy exists.
   * @param strategyName - The strategy name to check
   * @returns True if the strategy exists
   */
  public static hasStrategy(strategyName: string): strategyName is StrategyName {
    return this.strategies.has(strategyName as StrategyName);
  }
}