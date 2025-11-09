import type { PackageManagementGoals, PackageManagementConfig, TestResult, StrategyOf } from '@types';
/**
 * NPM package manager strategy.
 * Handles NPM-specific operations and commands.
 */
export declare class Npm implements StrategyOf<PackageManagementGoals> {
    readonly name: "npm";
    readonly description = "NPM package manager strategy";
    constructor(_config: PackageManagementConfig);
    isAvailable(): boolean;
    test(packageDir: string): Promise<TestResult>;
    install(packageDir: string): Promise<void>;
}
//# sourceMappingURL=Npm.d.ts.map