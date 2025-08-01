import type { StrategyName, VersionBumpStrategy } from '../../types/index.js';
/**
 * Factory class for creating version bump strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
export declare class VersionBumpStrategyFactory {
    private static readonly strategies;
    /**
     * Get a version bump strategy by name.
     * @param strategyName - The name of the strategy to retrieve
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(strategyName: StrategyName): VersionBumpStrategy;
    /**
     * Get all available strategy names.
     * @returns Array of available strategy names
     */
    static getAvailableStrategies(): readonly StrategyName[];
    /**
     * Check if a strategy exists.
     * @param strategyName - The strategy name to check
     * @returns True if the strategy exists
     */
    static hasStrategy(strategyName: string): strategyName is StrategyName;
}
//# sourceMappingURL=factory.d.ts.map