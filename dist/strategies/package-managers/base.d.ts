import type { PackageManagerStrategy, PackageManagerType, TestResult } from '../../types/index.js';
/**
 * Abstract base class for package manager strategies.
 * Implements the Strategy pattern for handling different package managers.
 */
export declare abstract class BasePackageManagerStrategy implements PackageManagerStrategy {
    readonly name: PackageManagerType;
    protected constructor(name: PackageManagerType);
    /**
     * Check if this package manager is available in the current environment.
     * @returns True if the package manager is available
     */
    abstract isAvailable(): boolean;
    /**
     * Run tests for a package to ensure compatibility.
     * @param packageDir - The directory containing the package
     * @returns Test result indicating success or failure
     */
    abstract test(packageDir: string): Promise<TestResult>;
    /**
     * Install dependencies for a package.
     * @param packageDir - The directory containing the package
     */
    abstract install(packageDir: string): Promise<void>;
}
//# sourceMappingURL=base.d.ts.map