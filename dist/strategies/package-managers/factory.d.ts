import type { PackageManagerStrategy } from '../../types/index.js';
/**
 * Factory class for creating package manager strategies.
 * Automatically detects the appropriate package manager based on lock files.
 */
export declare class PackageManagerFactory {
    private static readonly strategies;
    /**
     * Get the appropriate package manager strategy based on environment detection.
     * @returns The detected package manager strategy
     */
    static getPackageManager(): PackageManagerStrategy;
    /**
     * Get a specific package manager strategy by name.
     * @param name - The name of the package manager
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(name: string): PackageManagerStrategy;
    /**
     * Get all available strategy names.
     * @returns Array of available strategy names
     */
    static getAvailableStrategies(): readonly string[];
    /**
     * Get all strategy instances.
     * @returns Array of all strategy instances
     */
    static getAllStrategies(): readonly PackageManagerStrategy[];
}
//# sourceMappingURL=factory.d.ts.map