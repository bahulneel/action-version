import type { Objective, ActionConfiguration, StrategyOf } from '@types'
import type { VersionBumpingGoals } from '../../types/goals/version-bumping.js'
import { WorkspaceVersionBump } from './strategies/WorkspaceVersionBump.js'

export const versionBumping: Objective<ActionConfiguration, VersionBumpingGoals> = {
  strategise(config): StrategyOf<VersionBumpingGoals> {
    // Currently only one strategy, but structure allows for future expansion
    return new WorkspaceVersionBump(config)
  },
}
