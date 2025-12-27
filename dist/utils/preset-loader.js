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
exports.loadPreset = loadPreset;
exports.composePresets = composePresets;
exports.getAvailablePresets = getAvailablePresets;
exports.loadAndComposePresets = loadAndComposePresets;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Load a preset configuration from a YAML file.
 */
async function loadPreset(name) {
    try {
        // Presets are in presets/ directory at repository root
        const presetPath = path.join(process.cwd(), 'presets', `${name}.yml`);
        core.debug(`Loading preset: ${presetPath}`);
        const content = await fs_1.promises.readFile(presetPath, 'utf-8');
        const preset = js_yaml_1.default.load(content);
        if (!preset) {
            core.warning(`Preset ${name} loaded but is empty`);
            return null;
        }
        core.debug(`Successfully loaded preset: ${name}`);
        return preset;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.warning(`Failed to load preset ${name}: ${errorMessage}`);
        return null;
    }
}
/**
 * Compose multiple presets by merging them in order.
 * Later presets override earlier ones, and local config overrides all presets.
 */
function composePresets(presets) {
    const composed = {
        branches: {},
        flows: [],
    };
    for (const preset of presets) {
        // Merge branches (deep merge)
        if (preset.branches) {
            composed.branches = { ...composed.branches, ...preset.branches };
        }
        // Merge flows (array concatenation)
        if (preset.flows) {
            composed.flows = [...(composed.flows || []), ...preset.flows];
        }
    }
    return composed;
}
/**
 * Get list of available preset names by scanning the presets directory.
 */
async function getAvailablePresets() {
    try {
        const presetsDir = path.join(process.cwd(), 'presets');
        const files = await fs_1.promises.readdir(presetsDir);
        const presetNames = [];
        for (const file of files) {
            if (file.endsWith('.yml') || file.endsWith('.yaml')) {
                const name = file.replace(/\.(yml|yaml)$/, '');
                // Validate it's a known preset name
                if (['gitflow', 'github-flow', 'trunk-based', 'release-branches', 'gitlab-flow'].includes(name)) {
                    presetNames.push(name);
                }
            }
        }
        return presetNames;
    }
    catch (error) {
        core.debug(`Failed to scan presets directory: ${error}`);
        return [];
    }
}
/**
 * Load and compose multiple presets by name.
 */
async function loadAndComposePresets(presetNames) {
    const loadedPresets = [];
    for (const name of presetNames) {
        const preset = await loadPreset(name);
        if (preset) {
            loadedPresets.push(preset);
        }
        else {
            core.warning(`Preset ${name} could not be loaded, skipping`);
        }
    }
    return composePresets(loadedPresets);
}
//# sourceMappingURL=preset-loader.js.map