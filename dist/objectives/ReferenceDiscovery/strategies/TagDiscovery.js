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
exports.TagDiscovery = void 0;
const core = __importStar(require("@actions/core"));
const HighestVersionTag_js_1 = require("../tactics/HighestVersionTag.js");
const simple_git_1 = __importDefault(require("simple-git"));
const git = (0, simple_git_1.default)();
/**
 * Tag-based discovery strategy.
 * Finds the highest semantic version tag as the reference point.
 */
class TagDiscovery {
    name = 'tag-discovery';
    description = 'Find reference point based on highest semantic version tag';
    constructor(_config) { }
    async findReferencePoint(baseBranch, activeBranch) {
        const currentBranch = await this.getCurrentBranch();
        const context = {
            ...(baseBranch !== undefined && { baseBranch }),
            activeBranch,
            currentBranch,
            packageJsonPath: 'package.json',
        };
        // Use HighestVersionTagTactic to find the reference point
        const tactic = new HighestVersionTag_js_1.HighestVersionTagTactic();
        const result = await tactic.attempt(context);
        if (result.success && result.result) {
            core.info(`🎯 Tag reference: commit=${result.result.referenceCommit.substring(0, 8)}, version=${result.result.referenceVersion}`);
            return result.result;
        }
        // No tags found, fallback to initial commit
        core.info('📦 No tags found, using initial commit as reference');
        const referenceCommit = await this.findInitialCommit();
        return {
            referenceCommit,
            referenceVersion: '0.0.0',
            shouldFinalizeVersions: false,
            shouldForceBump: true, // Force bump from initial state
        };
    }
    async getCurrentBranch() {
        try {
            const branch = await git.branch();
            return branch.current;
        }
        catch (error) {
            // Fallback to environment variables
            return process.env?.GITHUB_HEAD_REF || process.env?.GITHUB_REF_NAME || 'main';
        }
    }
    async findInitialCommit() {
        try {
            const log = await git.log({ maxCount: 1000 });
            const commits = log.all;
            if (commits.length > 0) {
                return commits[commits.length - 1].hash;
            }
            return 'HEAD';
        }
        catch (error) {
            core.warning('Failed to find initial commit, using HEAD');
            return 'HEAD';
        }
    }
}
exports.TagDiscovery = TagDiscovery;
//# sourceMappingURL=TagDiscovery.js.map