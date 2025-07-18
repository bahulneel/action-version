import type { GitOperationStrategyType, GitOperationStrategy } from '../../types/index.js';
/**
 * Factory class for creating git operation strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export declare class GitOperationStrategyFactory {
    private static readonly strategies;
    /**
     * Get a git operation strategy by name.
     * @param strategyName - The name of the strategy to retrieve (defaults to 'conventional')
     * @returns The strategy instance
     */
    static getStrategy(strategyName?: GitOperationStrategyType): GitOperationStrategy;
    /**
     * Get all available strategy names.
     * @returns Array of available strategy names
     */
    static getAvailableStrategies(): readonly GitOperationStrategyType[];
    /**
     * Check if a strategy exists.
     * @param strategyName - The strategy name to check
     * @returns True if the strategy exists
     */
    static hasStrategy(strategyName: string): strategyName is GitOperationStrategyType;
}
//# sourceMappingURL=factory.d.ts.map