import type { Objective, ActionConfiguration, StrategyOf } from '@types'
import type { ConfigTranslationGoals } from '../../types/goals/config-translation.js'
import { ModelToActionTranslator } from './strategies/ModelToActionTranslator.js'

/**
 * Configuration for ConfigTranslation objective.
 */
export interface ConfigTranslationConfig {
  readonly modelConfig: import('../../types/versioning-config.js').VersioningConfig | null
  readonly gitHubContext: import('../../utils/flow-matcher.js').GitHubContext
  readonly rawInputs: Partial<ActionConfiguration>
}

/**
 * ConfigTranslation objective - translates model config to action config.
 * Removes semantic branching from services by delegating to this objective.
 */
export const configTranslation: Objective<ConfigTranslationConfig, ConfigTranslationGoals> = {
  strategise(config): StrategyOf<ConfigTranslationGoals> {
    // Currently only one strategy, but structure allows for future expansion
    return new ModelToActionTranslator(config)
  },
}
