import type { ActionConfiguration } from '../types/index.js'
import type { VersioningConfig as ModelVersioningConfig } from '../types/versioning-config.js'
import type { GitHubContext } from '../utils/flow-matcher.js'
import { configTranslation } from '../objectives/ConfigTranslation/objective.js'

/**
 * Translate model-driven configuration to behavior-driven ActionConfiguration.
 * Delegates to ConfigTranslation objective to remove semantic branching.
 */
export class ConfigTranslator {
  /**
   * Convert model config to ActionConfiguration based on current GitHub context.
   * Delegates to ConfigTranslation objective (no semantic branching).
   */
  async translateToActionConfig(
    modelConfig: ModelVersioningConfig,
    gitHubContext: GitHubContext,
    rawInputs?: Partial<ActionConfiguration>
  ): Promise<ActionConfiguration> {
    // Delegate to ConfigTranslation objective (no semantic branching in service)
    const translationConfig = {
      modelConfig,
      gitHubContext,
      rawInputs: rawInputs || {},
    }
    const translationStrategy = configTranslation.strategise(translationConfig)
    return await translationStrategy.translateModelToAction(
      modelConfig,
      gitHubContext,
      rawInputs || {}
    )
  }
}
