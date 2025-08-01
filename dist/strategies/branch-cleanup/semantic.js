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
exports.SemanticBranchesStrategy = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = __importDefault(require("simple-git"));
const base_js_1 = require("./base.js");
const version_js_1 = require("../../utils/version.js");
const git = (0, simple_git_1.default)();
/**
 * Semantic strategy that keeps only branches with different bump types.
 * This allows multiple major/minor/patch branches to coexist while cleaning up duplicates.
 */
class SemanticBranchesStrategy extends base_js_1.BaseBranchCleanupStrategy {
    constructor() {
        super('semantic');
    }
    async execute(branches, versionedBranch, templateRegex, rootBump) {
        core.info(`[root] Branch cleanup strategy: ${this.name} - keeping same bump type only`);
        const cleanupPromises = branches.all
            .filter(branch => branch.replace('origin/', '') !== versionedBranch)
            .filter(branch => this.shouldDeleteBranch(branch, templateRegex, rootBump))
            .map(branch => this.deleteBranchSafely(branch));
        await Promise.allSettled(cleanupPromises);
    }
    shouldDeleteBranch(branch, templateRegex, rootBump) {
        const match = branch.match(templateRegex);
        const version = match?.groups?.version;
        if (!version) {
            return false; // Not a version branch
        }
        const bumpType = (0, version_js_1.guessBumpType)(version);
        if (bumpType !== rootBump) {
            return false; // Keep different bump types
        }
        return true; // Delete same bump type
    }
    async deleteBranchSafely(branch) {
        try {
            const match = branch.match(/(?<version>\d+\.\d+\.\d+)/);
            const version = match?.groups?.version;
            const bumpType = version ? (0, version_js_1.guessBumpType)(version) : 'unknown';
            core.info(`[root] Deleting same-type branch ${branch} (${bumpType})`);
            await git.deleteLocalBranch(branch, true);
            core.debug(`[root] Successfully deleted branch ${branch}`);
        }
        catch (error) {
            core.warning(`[root] Failed to delete branch ${branch}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.SemanticBranchesStrategy = SemanticBranchesStrategy;
//# sourceMappingURL=semantic.js.map