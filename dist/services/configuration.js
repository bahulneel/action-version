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
exports.ConfigurationService = void 0;
const core = __importStar(require("@actions/core"));
const validation_js_1 = require("../utils/validation.js");
const factory_js_1 = require("../strategies/version-bump/factory.js");
const factory_js_2 = require("../strategies/branch-cleanup/factory.js");
/**
 * Service responsible for parsing and validating action configuration.
 * Handles GitHub Actions inputs and provides validated configuration objects.
 */
class ConfigurationService {
    /**
     * Parse configuration from GitHub Actions inputs.
     */
    async parseConfiguration() {
        const rawConfig = this.parseRawInputs();
        const validatedConfig = (0, validation_js_1.validateConfiguration)(rawConfig);
        this.logConfiguration(validatedConfig);
        this.validateStrategyCompatibility(validatedConfig);
        return validatedConfig;
    }
    /**
     * Parse raw inputs from GitHub Actions.
     */
    parseRawInputs() {
        return {
            commitMsgTemplate: core.getInput('commit_template') || undefined,
            depCommitMsgTemplate: core.getInput('dependency_commit_template') || undefined,
            shouldCreateBranch: this.safeGetBooleanInput('create_branch', false),
            branchTemplate: core.getInput('branch_template') || undefined,
            branchCleanup: core.getInput('branch_cleanup') || undefined,
            baseBranch: core.getInput('base') || undefined,
            strategy: core.getInput('strategy') || undefined,
            activeBranch: core.getInput('branch') || undefined,
            tagPrereleases: this.safeGetBooleanInput('tag_prereleases', false),
        };
    }
    /**
     * Safely parse boolean input with fallback to default.
     */
    safeGetBooleanInput(input, defaultValue) {
        try {
            const value = core.getInput(input);
            if (!value)
                return defaultValue;
            return core.getBooleanInput(input);
        }
        catch {
            return defaultValue;
        }
    }
    /**
     * Log the final configuration for debugging.
     */
    logConfiguration(config) {
        core.startGroup('📋 Configuration');
        core.info(`Strategy: ${config.strategy}`);
        core.info(`Active branch: ${config.activeBranch}`);
        core.info(`Base branch: ${config.baseBranch || 'none'}`);
        core.info(`Tag prereleases: ${config.tagPrereleases}`);
        core.info(`Create branch: ${config.shouldCreateBranch}`);
        core.info(`Branch template: ${config.branchTemplate}`);
        core.info(`Branch cleanup: ${config.branchCleanup}`);
        core.info(`Commit template: ${config.commitMsgTemplate}`);
        core.info(`Dependency commit template: ${config.depCommitMsgTemplate}`);
        core.endGroup();
    }
    /**
     * Validate strategy compatibility and log warnings.
     */
    validateStrategyCompatibility(config) {
        // Check version bump strategy availability
        const availableStrategies = factory_js_1.VersionBumpStrategyFactory.getAvailableStrategies();
        if (!availableStrategies.includes(config.strategy)) {
            throw new Error(`Invalid strategy: ${config.strategy}. Available: ${availableStrategies.join(', ')}`);
        }
        // Check branch cleanup strategy availability
        const availableCleanupStrategies = factory_js_2.BranchCleanupStrategyFactory.getAvailableStrategies();
        if (!availableCleanupStrategies.includes(config.branchCleanup)) {
            throw new Error(`Invalid branch cleanup strategy: ${config.branchCleanup}. Available: ${availableCleanupStrategies.join(', ')}`);
        }
        // Warn about potential issues
        if (config.strategy === 'pre-release' && !config.baseBranch) {
            core.warning('Using pre-release strategy without base branch - prerelease finalization will not be available');
        }
        if (config.shouldCreateBranch && !config.baseBranch) {
            core.warning('Creating branch without base branch specified - using "main" as default');
        }
    }
}
exports.ConfigurationService = ConfigurationService;
//# sourceMappingURL=configuration.js.map