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
exports.GitBasedInference = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = __importDefault(require("simple-git"));
const git = (0, simple_git_1.default)();
/**
 * Git-based inference strategy.
 * Analyzes repository structure (branches) to infer the most likely preset.
 */
class GitBasedInference {
    name = 'git-based-inference';
    description = 'Infer preset from git branch structure';
    /**
     * Infer the most likely preset by analyzing branch structure.
     */
    async inferPreset() {
        try {
            const branches = await git.branchLocal();
            // Check for Git Flow indicators
            const hasDevelop = branches.all.includes('develop');
            const hasReleaseBranches = branches.all.some((branch) => branch.startsWith('release/'));
            // Check for GitLab Flow indicators (environment branches)
            const hasPreProd = branches.all.includes('pre-prod');
            const hasProd = branches.all.includes('prod');
            if (hasDevelop && hasReleaseBranches) {
                core.info('Inferred preset: gitflow (found develop and release/* branches)');
                return 'gitflow';
            }
            if (hasReleaseBranches && !hasDevelop) {
                core.info('Inferred preset: release-branches (found release/* branches, no develop)');
                return 'release-branches';
            }
            if (hasPreProd || hasProd) {
                core.info('Inferred preset: gitlab-flow (found environment branches)');
                return 'gitlab-flow';
            }
            if (hasDevelop) {
                core.info('Inferred preset: gitflow (found develop branch)');
                return 'gitflow';
            }
            // Default to github-flow for simple repositories
            core.info('Inferred preset: github-flow (default for simple repositories)');
            return 'github-flow';
        }
        catch (error) {
            core.warning(`Failed to infer preset from git structure: ${error}`);
            // Default fallback
            return 'github-flow';
        }
    }
    /**
     * Generate a VersioningConfig based on the inferred preset.
     * This creates a minimal config with just the preset.
     */
    async generateInferredConfig(preset) {
        return {
            presets: [preset],
        };
    }
}
exports.GitBasedInference = GitBasedInference;
//# sourceMappingURL=GitBasedInference.js.map