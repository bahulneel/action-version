import type { VersioningConfig as ModelVersioningConfig, PresetName } from '../types/versioning-config.js';
/**
 * Load a preset configuration from a YAML file.
 */
export declare function loadPreset(name: PresetName): Promise<ModelVersioningConfig | null>;
/**
 * Compose multiple presets by merging them in order.
 * Later presets override earlier ones, and local config overrides all presets.
 */
export declare function composePresets(presets: ModelVersioningConfig[]): ModelVersioningConfig;
/**
 * Get list of available preset names by scanning the presets directory.
 */
export declare function getAvailablePresets(): Promise<PresetName[]>;
/**
 * Load and compose multiple presets by name.
 */
export declare function loadAndComposePresets(presetNames: PresetName[]): Promise<ModelVersioningConfig>;
//# sourceMappingURL=preset-loader.d.ts.map