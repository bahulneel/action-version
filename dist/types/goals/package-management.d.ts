import type { TestResult } from '../index.js';
/**
 * Goals for package management objective.
 */
export interface PackageManagementGoals {
    isAvailable(): boolean;
    test(packageDir: string): Promise<TestResult>;
    install(packageDir: string): Promise<void>;
}
/**
 * Configuration for package management strategy selection.
 */
export interface PackageManagementConfig {
    readonly kind: 'npm' | 'yarn' | 'pnpm';
}
export type PackageManager = PackageManagementGoals;
//# sourceMappingURL=package-management.d.ts.map