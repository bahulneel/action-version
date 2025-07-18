import type { PackageManagerStrategy, PackageManagerType, TestResult } from '../../types/index.js';

/**
 * Abstract base class for package manager strategies.
 * Implements the Strategy pattern for handling different package managers.
 */
export abstract class BasePackageManagerStrategy implements PackageManagerStrategy {
  public readonly name: PackageManagerType;

  protected constructor(name: PackageManagerType) {
    this.name = name;
  }

  /**
   * Check if this package manager is available in the current environment.
   * @returns True if the package manager is available
   */
  public abstract isAvailable(): boolean;

  /**
   * Run tests for a package to ensure compatibility.
   * @param packageDir - The directory containing the package
   * @returns Test result indicating success or failure
   */
  public abstract test(packageDir: string): Promise<TestResult>;

  /**
   * Install dependencies for a package.
   * @param packageDir - The directory containing the package
   */
  public abstract install(packageDir: string): Promise<void>;
}