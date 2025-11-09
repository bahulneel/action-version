import type { PackageManagementGoals, PackageManagementConfig, TestResult, StrategyOf } from '@types';
/**
 * PNPM package manager strategy.
 * Handles PNPM-specific operations and commands.
 */
export declare class Pnpm implements StrategyOf<PackageManagementGoals> {
    readonly name: "pnpm";
    readonly description = "PNPM package manager strategy";
    constructor(_config: PackageManagementConfig);
    isAvailable(): boolean;
    test(packageDir: string): Promise<TestResult>;
    install(packageDir: string): Promise<void>;
}
//# sourceMappingURL=Pnpm.d.ts.map