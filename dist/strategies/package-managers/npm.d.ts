import type { TestResult } from '../../types/index.js';
import { BasePackageManagerStrategy } from './base.js';
/**
 * NPM package manager strategy.
 * Handles NPM-specific operations and commands.
 */
export declare class NpmPackageManagerStrategy extends BasePackageManagerStrategy {
    constructor();
    isAvailable(): boolean;
    test(packageDir: string): Promise<TestResult>;
    install(packageDir: string): Promise<void>;
}
//# sourceMappingURL=npm.d.ts.map