import type { Objective, ActionConfiguration, StrategyOf, VcsGoals, PackageManagementGoals } from '@types';
import type { VersionBumpingGoals } from '../../types/goals/version-bumping.js';
export interface VersionBumpingConfig extends ActionConfiguration {
    gitStrategy: StrategyOf<VcsGoals>;
    packageManager: StrategyOf<PackageManagementGoals>;
}
export declare const versionBumping: Objective<VersionBumpingConfig, VersionBumpingGoals>;
//# sourceMappingURL=objective.d.ts.map