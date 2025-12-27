import type { PresetName, VersioningConfig as ModelVersioningConfig } from '../versioning-config.js';
/**
 * Goals for ModelInference objective.
 */
export interface ModelInferenceGoals {
    /**
     * Infer the most likely preset based on repository structure.
     */
    inferPreset(): Promise<PresetName>;
    /**
     * Generate a VersioningConfig based on the inferred preset.
     */
    generateInferredConfig(preset: PresetName): Promise<ModelVersioningConfig>;
}
//# sourceMappingURL=model-inference.d.ts.map