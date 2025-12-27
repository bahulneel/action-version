"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readVersioningConfig = readVersioningConfig;
exports.validateVersioningConfig = validateVersioningConfig;
exports.mergeConfigWithPresets = mergeConfigWithPresets;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const preset_loader_js_1 = require("./preset-loader.js");
/**
 * Read and parse .versioning.yml from repository root.
 * Returns null if file doesn't exist.
 */
async function readVersioningConfig() {
    try {
        const configPath = path.join(process.cwd(), '.versioning.yml');
        core.debug(`Reading versioning config: ${configPath}`);
        const content = await fs_1.promises.readFile(configPath, 'utf-8');
        const config = js_yaml_1.default.load(content);
        if (!config) {
            core.warning('.versioning.yml is empty');
            return null;
        }
        core.debug('Successfully loaded .versioning.yml');
        return config;
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            // File doesn't exist - this is expected, return null
            core.debug('.versioning.yml not found');
            return null;
        }
        // Other errors should be logged
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.warning(`Failed to read .versioning.yml: ${errorMessage}`);
        return null;
    }
}
/**
 * Validate versioning configuration schema.
 */
function validateVersioningConfig(config) {
    // Validate presets if present
    if (config.presets) {
        const validPresets = ['gitflow', 'github-flow', 'trunk-based', 'release-branches', 'gitlab-flow'];
        for (const preset of config.presets) {
            if (!validPresets.includes(preset)) {
                throw new Error(`Invalid preset name: ${preset}. Valid presets: ${validPresets.join(', ')}`);
            }
        }
    }
    // Validate flows if present
    if (config.flows) {
        for (const flow of config.flows) {
            if (!flow.name || !flow.from || !flow.to) {
                throw new Error(`Flow is missing required fields (name, from, to): ${JSON.stringify(flow)}`);
            }
            if (flow.versioning && !['pre-release', 'finalize'].includes(flow.versioning)) {
                throw new Error(`Invalid versioning strategy: ${flow.versioning}. Valid: pre-release, finalize`);
            }
        }
    }
    // Validate branches if present (structure validation)
    if (config.branches) {
        for (const [pattern, metadata] of Object.entries(config.branches)) {
            if (metadata && typeof metadata === 'object') {
                // Metadata can have protected (boolean) and tags (boolean)
                if ('protected' in metadata && typeof metadata.protected !== 'boolean') {
                    throw new Error(`Branch ${pattern}: protected must be boolean`);
                }
                if ('tags' in metadata && typeof metadata.tags !== 'boolean') {
                    throw new Error(`Branch ${pattern}: tags must be boolean`);
                }
            }
        }
    }
}
/**
 * Merge config with presets: compose presets first, then apply local config overrides.
 */
async function mergeConfigWithPresets(config) {
    let merged = {
        branches: {},
        flows: [],
    };
    // Step 1: Compose presets if specified
    if (config.presets && config.presets.length > 0) {
        core.debug(`Composing presets: ${config.presets.join(', ')}`);
        merged = await (0, preset_loader_js_1.loadAndComposePresets)(config.presets);
    }
    // Step 2: Apply local config overrides (deep merge for branches, array merge for flows)
    if (config.branches) {
        merged.branches = { ...merged.branches, ...config.branches };
    }
    if (config.flows) {
        // Flows from local config are added to preset flows
        merged.flows = [...(merged.flows || []), ...config.flows];
    }
    // Preserve presets array if present (for reference)
    if (config.presets) {
        merged.presets = config.presets;
    }
    return merged;
}
//# sourceMappingURL=config-loader.js.map