import type { TestResult } from '../../types/index.js';
import { BasePackageManagerStrategy } from './base.js';
/**
 * PNPM package manager strategy.
 * Handles PNPM-specific operations and commands.
 */
export declare class PnpmPackageManagerStrategy extends BasePackageManagerStrategy {
    constructor();
    isAvailable(): boolean;
    test(packageDir: string): Promise<TestResult>;
    install(packageDir: string): Promise<void>;
}
//# sourceMappingURL=pnpm.d.ts.map