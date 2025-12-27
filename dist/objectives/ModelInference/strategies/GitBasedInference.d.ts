import type { StrategyOf } from '../../../types/index.js';
import type { ModelInferenceGoals } from '../../../types/goals/model-inference.js';
import type { PresetName, VersioningConfig as ModelVersioningConfig } from '../../../types/versioning-config.js';
/**
 * Git-based inference strategy.
 * Analyzes repository structure (branches) to infer the most likely preset.
 */
export declare class GitBasedInference implements StrategyOf<ModelInferenceGoals> {
    readonly name = "git-based-inference";
    readonly description = "Infer preset from git branch structure";
    /**
     * Infer the most likely preset by analyzing branch structure.
     */
    inferPreset(): Promise<PresetName>;
    /**
     * Generate a VersioningConfig based on the inferred preset.
     * This creates a minimal config with just the preset.
     */
    generateInferredConfig(preset: PresetName): Promise<ModelVersioningConfig>;
}
//# sourceMappingURL=GitBasedInference.d.ts.map