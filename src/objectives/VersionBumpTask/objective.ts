import type { Objective, ActionConfiguration, StrategyOf } from '@types'
import type { VersionBumpTaskGoals } from '../../types/goals/version-bump-task.js'
import { WorkspaceVersionBumpTask } from './strategies/WorkspaceVersionBumpTask.js'

/**
 * Objective for the main version bump task.
 * NOTE: This is deprecated in favor of Main objective. Strategies resolve their own dependencies.
 */
export const versionBumpTask: Objective<ActionConfiguration, VersionBumpTaskGoals> = {
  strategise(config): StrategyOf<VersionBumpTaskGoals> {
    // Currently only one strategy, but structure allows for future expansion
    return new WorkspaceVersionBumpTask(config)
  },
}
