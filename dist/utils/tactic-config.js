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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TacticConfig = void 0;
const core = __importStar(require("@actions/core"));
/**
 * Utility for parsing tactic-specific configuration from GitHub Actions inputs.
 * Uses the pattern {tactic_name}_{option_name} for input names.
 */
class TacticConfig {
    /**
     * Get tactic-specific configuration options.
     * @param tacticName The name of the tactic (e.g., 'MergeBase', 'LastVersionCommit')
     * @param options Object defining the expected options and their types
     * @returns Object with parsed configuration values
     */
    static getTacticOptions(tacticName, options) {
        const result = {};
        for (const [optionName, optionType] of Object.entries(options)) {
            const inputName = `tactic_${tacticName.toLowerCase()}_${optionName.toLowerCase()}`;
            const value = core.getInput(inputName);
            if (value !== '') {
                switch (optionType) {
                    case 'string':
                        result[optionName] = value;
                        break;
                    case 'number':
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue)) {
                            result[optionName] = numValue;
                        }
                        else {
                            core.warning(`Invalid number value for ${inputName}: ${value}`);
                        }
                        break;
                    case 'boolean':
                        result[optionName] = (value === 'true' || value === '1');
                        break;
                }
            }
        }
        return result;
    }
    /**
     * Get a single tactic option value.
     * @param tacticName The name of the tactic
     * @param optionName The name of the option
     * @param defaultValue Default value if not set
     * @returns The option value or default
     */
    static getTacticOption(tacticName, optionName, defaultValue) {
        const inputName = `tactic_${tacticName.toLowerCase()}_${optionName.toLowerCase()}`;
        const value = core.getInput(inputName);
        if (value === '') {
            return defaultValue;
        }
        if (typeof defaultValue === 'number') {
            const numValue = parseInt(value, 10);
            return (isNaN(numValue) ? defaultValue : numValue);
        }
        if (typeof defaultValue === 'boolean') {
            return (value === 'true' || value === '1' ? true : false);
        }
        return value;
    }
}
exports.TacticConfig = TacticConfig;
//# sourceMappingURL=tactic-config.js.map