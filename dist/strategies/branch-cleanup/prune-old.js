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
exports.PruneOldBranchesStrategy = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = __importDefault(require("simple-git"));
const base_js_1 = require("./base.js");
const git = (0, simple_git_1.default)();
/**
 * Prune-old strategy that removes all old version branches except the current one.
 * This keeps the workspace clean by removing outdated version branches.
 */
class PruneOldBranchesStrategy extends base_js_1.BaseBranchCleanupStrategy {
    constructor() {
        super('prune');
    }
    async execute(branches, versionedBranch, templateRegex, _rootBump) {
        core.info(`[root] Branch cleanup strategy: ${this.name} - removing old branches`);
        const cleanupPromises = branches.all
            .filter(branch => branch.replace('origin/', '') !== versionedBranch)
            .filter(branch => this.isVersionBranch(branch, templateRegex))
            .map(branch => this.deleteBranchSafely(branch));
        await Promise.allSettled(cleanupPromises);
    }
    isVersionBranch(branch, templateRegex) {
        const match = branch.match(templateRegex);
        return Boolean(match?.groups?.version);
    }
    async deleteBranchSafely(branch) {
        try {
            core.info(`[root] Deleting old branch ${branch}`);
            await git.deleteLocalBranch(branch, true);
            core.debug(`[root] Successfully deleted branch ${branch}`);
        }
        catch (error) {
            core.warning(`[root] Failed to delete branch ${branch}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.PruneOldBranchesStrategy = PruneOldBranchesStrategy;
//# sourceMappingURL=prune-old.js.map