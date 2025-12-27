import type { Objective, StrategyOf } from '../../types/index.js'
import type { ModelInferenceGoals } from '../../types/goals/model-inference.js'
import { GitBasedInference } from './strategies/GitBasedInference.js'

/**
 * Configuration for ModelInference objective.
 * Currently no configuration needed, but structure allows for future expansion.
 */
export interface ModelInferenceConfig {
  // Future: could add inference strategy selection, etc.
}

export const modelInference: Objective<ModelInferenceConfig, ModelInferenceGoals> = {
  strategise(_config): StrategyOf<ModelInferenceGoals> {
    // Currently only one strategy, but structure allows for future expansion
    return new GitBasedInference()
  },
}
