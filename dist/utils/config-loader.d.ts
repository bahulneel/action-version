import type { VersioningConfig as ModelVersioningConfig } from '../types/versioning-config.js';
/**
 * Read and parse .versioning.yml from repository root.
 * Returns null if file doesn't exist.
 */
export declare function readVersioningConfig(): Promise<ModelVersioningConfig | null>;
/**
 * Validate versioning configuration schema.
 */
export declare function validateVersioningConfig(config: ModelVersioningConfig): void;
/**
 * Merge config with presets: compose presets first, then apply local config overrides.
 */
export declare function mergeConfigWithPresets(config: ModelVersioningConfig): Promise<ModelVersioningConfig>;
//# sourceMappingURL=config-loader.d.ts.map