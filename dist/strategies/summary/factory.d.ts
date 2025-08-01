import type { SummaryStrategyType, SummaryStrategy } from '../../types/index.js';
/**
 * Factory class for creating summary strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export declare class SummaryStrategyFactory {
    private static readonly strategies;
    /**
     * Get a summary strategy by name.
     * @param strategyName - The name of the strategy to retrieve
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(strategyName: SummaryStrategyType): SummaryStrategy;
    /**
     * Get the appropriate summary strategy based on environment.
     * @returns The strategy instance
     */
    static getAppropriateStrategy(): SummaryStrategy;
    /**
     * Get all available strategy names.
     * @returns Array of available strategy names
     */
    static getAvailableStrategies(): readonly SummaryStrategyType[];
    /**
     * Check if a strategy exists.
     * @param strategyName - The strategy name to check
     * @returns True if the strategy exists
     */
    static hasStrategy(strategyName: string): strategyName is SummaryStrategyType;
}
//# sourceMappingURL=factory.d.ts.map