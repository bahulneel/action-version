import type { Objective, ActionConfiguration, StrategyOf } from '@types'
import type { MainGoals } from '../../types/goals/main.js'
import { ReleaseAction } from './strategies/ReleaseAction.js'
import { VersionBumpAction } from './strategies/VersionBumpAction.js'
import { SyncAction } from './strategies/SyncAction.js'
import { DoNothingAction } from './strategies/DoNothingAction.js'

/**
 * Main objective - entry point for the action once configuration is grounded.
 * Determines what maneuver to perform based on the configuration.
 */
export const main: Objective<ActionConfiguration, MainGoals> = {
  strategise(config): StrategyOf<MainGoals> {
    // Determine action based on configuration (no semantic branching - use objectives)
    // The strategy itself determines behavior from config data

    // Release mode: explicit release branch creation
    if (config.release === true) {
      return new ReleaseAction(config)
    }

    // Strategy-based actions
    switch (config.strategy) {
      case 'finalize':
        return new ReleaseAction(config) // Finalize is also a release action
      case 'sync':
        return new SyncAction(config)
      case 'do-nothing':
        return new DoNothingAction(config)
      case 'pre-release':
      case 'apply-bump':
      default:
        return new VersionBumpAction(config)
    }
  },
}
