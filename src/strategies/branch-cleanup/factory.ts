import type { BranchCleanupStrategyType, BranchCleanupStrategy } from '../../types/index.js';
import { KeepAllBranchesStrategy } from './keep-all.js';
import { PruneOldBranchesStrategy } from './prune-old.js';
import { SemanticBranchesStrategy } from './semantic.js';

/**
 * Factory class for creating branch cleanup strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export class BranchCleanupStrategyFactory {
  private static readonly strategies: ReadonlyMap<BranchCleanupStrategyType, BranchCleanupStrategy> = new Map([
    ['keep', new KeepAllBranchesStrategy()],
    ['prune', new PruneOldBranchesStrategy()],
    ['semantic', new SemanticBranchesStrategy()],
  ]);

  /**
   * Get a branch cleanup strategy by name.
   * @param strategyName - The name of the strategy to retrieve
   * @returns The strategy instance
   * @throws Error if the strategy is not found
   */
  public static getStrategy(strategyName: BranchCleanupStrategyType): BranchCleanupStrategy {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown branch cleanup strategy: ${strategyName}. Available strategies: ${this.getAvailableStrategies().join(', ')}`);
    }
    return strategy;
  }

  /**
   * Get all available strategy names.
   * @returns Array of available strategy names
   */
  public static getAvailableStrategies(): readonly BranchCleanupStrategyType[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if a strategy exists.
   * @param strategyName - The strategy name to check
   * @returns True if the strategy exists
   */
  public static hasStrategy(strategyName: string): strategyName is BranchCleanupStrategyType {
    return this.strategies.has(strategyName as BranchCleanupStrategyType);
  }
}