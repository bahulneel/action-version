import type { Objective, ActionConfiguration, StrategyOf, VcsGoals, PackageManagementGoals } from '@types'
import type { VersionBumpingGoals } from '../../types/goals/version-bumping.js'
import { WorkspaceVersionBump } from './strategies/WorkspaceVersionBump.js'

export interface VersionBumpingConfig extends ActionConfiguration {
  gitStrategy: StrategyOf<VcsGoals>
  packageManager: StrategyOf<PackageManagementGoals>
}

export const versionBumping: Objective<VersionBumpingConfig, VersionBumpingGoals> = {
  strategise(config): StrategyOf<VersionBumpingGoals> {
    // Currently only one strategy, but structure allows for future expansion
    return new WorkspaceVersionBump(config, config.gitStrategy, config.packageManager)
  },
}
