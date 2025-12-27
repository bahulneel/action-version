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
exports.ConfigTranslator = void 0;
const core = __importStar(require("@actions/core"));
const flow_matcher_js_1 = require("../utils/flow-matcher.js");
const BranchProtection_js_1 = require("../adapters/GitHub/BranchProtection.js");
/**
 * Translate model-driven configuration to behavior-driven ActionConfiguration.
 */
class ConfigTranslator {
    branchProtection = new BranchProtection_js_1.BranchProtection();
    /**
     * Convert model config to ActionConfiguration based on current GitHub context.
     */
    async translateToActionConfig(modelConfig, gitHubContext) {
        // Step 1: Match flow to current context
        const matchedFlow = modelConfig.flows
            ? (0, flow_matcher_js_1.matchFlow)(modelConfig.flows, gitHubContext)
            : null;
        if (!matchedFlow) {
            core.warning(`No matching flow found for branch ${gitHubContext.currentBranch}, using defaults`);
            return this.getDefaultConfig(gitHubContext);
        }
        core.info(`Matched flow: ${matchedFlow.name} (from: ${matchedFlow.from}, to: ${matchedFlow.to})`);
        // Step 2: Extract versioning strategy from flow
        const strategy = this.extractStrategy(matchedFlow);
        // Step 3: Extract base branch
        const baseBranch = matchedFlow.base || 'main';
        // Step 4: Determine create_branch from branch protection
        // Use target branch from flow if available, otherwise use current branch
        const targetBranch = matchedFlow.to || gitHubContext.currentBranch;
        const isProtected = await this.branchProtection.isBranchProtected(targetBranch);
        // Also check branch metadata for override
        const branchMetadata = modelConfig.branches?.[targetBranch] || modelConfig.branches?.['*'];
        const shouldCreateBranch = branchMetadata?.protected ?? isProtected;
        // Step 5: Determine tag prereleases from branch metadata
        const tagPrereleases = branchMetadata?.tags ?? false;
        // Step 6: Build ActionConfiguration
        const config = {
            commitMsgTemplate: 'chore(release): bump ${package} to ${version} (${bumpType})',
            depCommitMsgTemplate: 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
            shouldCreateBranch,
            branchTemplate: 'release/${version}',
            templateRegex: new RegExp('release/(?<version>\\S+)'),
            branchCleanup: 'keep',
            baseBranch,
            strategy,
            activeBranch: gitHubContext.currentBranch,
            tagPrereleases,
        };
        core.info(`Translated config: strategy=${strategy}, base=${baseBranch}, create_branch=${shouldCreateBranch}`);
        return config;
    }
    /**
     * Extract versioning strategy from flow.
     */
    extractStrategy(flow) {
        if (!flow.versioning) {
            // No versioning specified means do-nothing (for sync operations)
            return 'do-nothing';
        }
        switch (flow.versioning) {
            case 'pre-release':
                return 'pre-release';
            case 'finalize':
                return 'finalize';
            default:
                core.warning(`Unknown versioning strategy: ${flow.versioning}, defaulting to do-nothing`);
                return 'do-nothing';
        }
    }
    /**
     * Get default ActionConfiguration when no flow matches.
     */
    getDefaultConfig(gitHubContext) {
        return {
            commitMsgTemplate: 'chore(release): bump ${package} to ${version} (${bumpType})',
            depCommitMsgTemplate: 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
            shouldCreateBranch: false,
            branchTemplate: 'release/${version}',
            templateRegex: new RegExp('release/(?<version>\\S+)'),
            branchCleanup: 'keep',
            baseBranch: undefined,
            strategy: 'do-nothing',
            activeBranch: gitHubContext.currentBranch,
            tagPrereleases: false,
        };
    }
}
exports.ConfigTranslator = ConfigTranslator;
//# sourceMappingURL=config-translator.js.map