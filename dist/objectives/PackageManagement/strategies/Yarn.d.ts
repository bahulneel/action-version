import type { PackageManagementGoals, PackageManagementConfig, TestResult, StrategyOf } from '@types';
/**
 * Yarn package manager strategy.
 * Handles Yarn-specific operations and commands.
 */
export declare class Yarn implements StrategyOf<PackageManagementGoals> {
    readonly name: "yarn";
    readonly description = "Yarn package manager strategy";
    constructor(_config: PackageManagementConfig);
    isAvailable(): boolean;
    test(packageDir: string): Promise<TestResult>;
    install(packageDir: string): Promise<void>;
}
//# sourceMappingURL=Yarn.d.ts.map