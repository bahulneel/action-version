import * as core from '@actions/core';
import type { GitOperationStrategyType, GitOperationStrategy } from '../../types/index.js';
import { ConventionalGitStrategy } from './conventional.js';
import { SimpleGitStrategy } from './simple.js';

/**
 * Factory class for creating git operation strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export class GitOperationStrategyFactory {
  private static readonly strategies: ReadonlyMap<GitOperationStrategyType, GitOperationStrategy> = new Map([
    ['conventional', new ConventionalGitStrategy()],
    ['simple', new SimpleGitStrategy()],
  ]);

  /**
   * Get a git operation strategy by name.
   * @param strategyName - The name of the strategy to retrieve (defaults to 'conventional')
   * @returns The strategy instance
   */
  public static getStrategy(strategyName: GitOperationStrategyType = 'conventional'): GitOperationStrategy {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      core.warning(`Unknown git strategy: ${strategyName}, falling back to conventional`);
      return this.strategies.get('conventional')!;
    }
    return strategy;
  }

  /**
   * Get all available strategy names.
   * @returns Array of available strategy names
   */
  public static getAvailableStrategies(): readonly GitOperationStrategyType[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if a strategy exists.
   * @param strategyName - The strategy name to check
   * @returns True if the strategy exists
   */
  public static hasStrategy(strategyName: string): strategyName is GitOperationStrategyType {
    return this.strategies.has(strategyName as GitOperationStrategyType);
  }
}