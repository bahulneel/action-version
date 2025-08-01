import type { TestResult } from '../../types/index.js';
import { BasePackageManagerStrategy } from './base.js';
/**
 * Yarn package manager strategy.
 * Handles Yarn-specific operations and commands.
 */
export declare class YarnPackageManagerStrategy extends BasePackageManagerStrategy {
    constructor();
    isAvailable(): boolean;
    test(packageDir: string): Promise<TestResult>;
    install(packageDir: string): Promise<void>;
}
//# sourceMappingURL=yarn.d.ts.map