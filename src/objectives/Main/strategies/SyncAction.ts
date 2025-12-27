import type { ActionConfiguration, StrategyOf } from '@types'
import type { MainGoals } from '../../../types/goals/main.js'
import { VersionBumpAction } from './VersionBumpAction.js'

/**
 * Sync action strategy.
 * Syncs versions from source branch to target branch (exact copy).
 */
export class SyncAction extends VersionBumpAction implements StrategyOf<MainGoals> {
  override readonly name = 'sync-action'
  override readonly description = 'Sync action (copies versions from source to target branch)'

  constructor(config: ActionConfiguration) {
    super(config)
  }
}
