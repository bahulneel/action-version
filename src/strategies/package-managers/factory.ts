import type { PackageManagerStrategy } from '../../types/index.js';
import { NpmPackageManagerStrategy } from './npm.js';
import { PnpmPackageManagerStrategy } from './pnpm.js';
import { YarnPackageManagerStrategy } from './yarn.js';

/**
 * Factory class for creating package manager strategies.
 * Automatically detects the appropriate package manager based on lock files.
 */
export class PackageManagerFactory {
  private static readonly strategies: readonly PackageManagerStrategy[] = [
    new YarnPackageManagerStrategy(),   // Check Yarn first (preferred)
    new PnpmPackageManagerStrategy(),   // Then PNPM
    new NpmPackageManagerStrategy(),    // NPM as fallback
  ];

  /**
   * Get the appropriate package manager strategy based on environment detection.
   * @returns The detected package manager strategy
   */
  public static getPackageManager(): PackageManagerStrategy {
    for (const strategy of this.strategies) {
      if (strategy.isAvailable()) {
        return strategy;
      }
    }
    
    // Fallback to NPM if no package manager is detected
    return new NpmPackageManagerStrategy();
  }

  /**
   * Get a specific package manager strategy by name.
   * @param name - The name of the package manager
   * @returns The strategy instance
   * @throws Error if the strategy is not found
   */
  public static getStrategy(name: string): PackageManagerStrategy {
    const strategy = this.strategies.find(s => s.name === name);
    if (!strategy) {
      throw new Error(`Unknown package manager: ${name}. Available: ${this.getAvailableStrategies().join(', ')}`);
    }
    return strategy;
  }

  /**
   * Get all available strategy names.
   * @returns Array of available strategy names
   */
  public static getAvailableStrategies(): readonly string[] {
    return this.strategies.map(s => s.name);
  }

  /**
   * Get all strategy instances.
   * @returns Array of all strategy instances
   */
  public static getAllStrategies(): readonly PackageManagerStrategy[] {
    return this.strategies;
  }
}