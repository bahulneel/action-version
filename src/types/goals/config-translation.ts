import type { ActionConfiguration } from '../index.js'
import type { VersioningConfig as ModelVersioningConfig } from '../versioning-config.js'
import type { GitHubContext } from '../../utils/flow-matcher.js'

/**
 * Goals for ConfigTranslation objective.
 * Translates model-driven configuration to behavior-driven ActionConfiguration.
 */
export interface ConfigTranslationGoals {
  translateModelToAction(
    modelConfig: ModelVersioningConfig | null,
    gitHubContext: GitHubContext,
    rawInputs: Partial<ActionConfiguration>
  ): Promise<ActionConfiguration>
}
