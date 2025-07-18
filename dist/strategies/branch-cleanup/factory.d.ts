import type { BranchCleanupStrategyType, BranchCleanupStrategy } from '../../types/index.js';
/**
 * Factory class for creating branch cleanup strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export declare class BranchCleanupStrategyFactory {
    private static readonly strategies;
    /**
     * Get a branch cleanup strategy by name.
     * @param strategyName - The name of the strategy to retrieve
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(strategyName: BranchCleanupStrategyType): BranchCleanupStrategy;
    /**
     * Get all available strategy names.
     * @returns Array of available strategy names
     */
    static getAvailableStrategies(): readonly BranchCleanupStrategyType[];
    /**
     * Check if a strategy exists.
     * @param strategyName - The strategy name to check
     * @returns True if the strategy exists
     */
    static hasStrategy(strategyName: string): strategyName is BranchCleanupStrategyType;
}
//# sourceMappingURL=factory.d.ts.map