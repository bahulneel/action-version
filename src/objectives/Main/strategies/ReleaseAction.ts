import type { ActionConfiguration, StrategyOf } from '@types'
import type { MainGoals } from '../../../types/goals/main.js'
import { VersionBumpAction } from './VersionBumpAction.js'

/**
 * Release action strategy.
 * Performs release branch creation and version finalization.
 * Delegates to VersionBumpAction - config should already have strategy='finalize' for release mode.
 */
export class ReleaseAction extends VersionBumpAction implements StrategyOf<MainGoals> {
  override readonly name = 'release-action'
  override readonly description = 'Release action (creates release branch, finalizes versions)'

  constructor(config: ActionConfiguration) {
    super(config)
    // Config should already have strategy='finalize' when release=true
    // This is determined by ConfigTranslator based on the release flag
  }
}
