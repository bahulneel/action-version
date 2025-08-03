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
exports.MergeBaseTactic = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = require("simple-git");
const git = (0, simple_git_1.simpleGit)();
/**
 * MergeBaseTactic - Uses git merge-base to find the common ancestor between current branch and base branch.
 *
 * This tactic is context-aware:
 * - Only executes if baseBranch is provided
 * - Attempts to fetch remote branches if needed
 * - Provides detailed context about branch availability
 * - Gracefully handles cases where merge-base fails
 */
class MergeBaseTactic {
    get name() {
        return 'MergeBase';
    }
    assess(context) {
        return !!context.baseBranch;
    }
    async attempt(context) {
        if (!context.baseBranch) {
            return {
                applied: false,
                success: false,
                message: 'No base branch provided',
            };
        }
        try {
            // Ensure we have git info
            if (!context.gitInfo) {
                context.gitInfo = await this.gatherGitInfo(context);
            }
            const remoteBaseBranch = context.baseBranch.includes('/')
                ? context.baseBranch
                : `origin/${context.baseBranch}`;
            // Try to fetch the base branch if we haven't seen it
            if (!context.gitInfo.availableBranches?.includes(remoteBaseBranch)) {
                try {
                    await git.fetch('origin', context.baseBranch.replace('origin/', ''));
                    core.debug(`Fetched ${context.baseBranch} from origin`);
                    // Update git info after fetch
                    context.gitInfo = await this.gatherGitInfo(context);
                }
                catch (fetchError) {
                    core.warning(`Failed to fetch ${context.baseBranch}: ${fetchError}`);
                    return {
                        applied: true,
                        success: false,
                        message: `Failed to fetch base branch: ${fetchError}`,
                        context: { gitInfo: context.gitInfo || undefined },
                    };
                }
            }
            // Find merge base between remote base branch and HEAD
            const mergeBase = await this.commonCommit(remoteBaseBranch, 'HEAD');
            if (!mergeBase) {
                return {
                    applied: true,
                    success: false,
                    message: `No common ancestor found between ${context.currentBranch} and ${remoteBaseBranch}`,
                    ...(context.gitInfo && { context: { gitInfo: context.gitInfo } }),
                };
            }
            // Get version at the merge base commit
            const referenceVersion = (await this.getVersionAtCommit(mergeBase)) || '0.0.0';
            const shouldFinalizeVersions = context.currentBranch === context.baseBranch;
            const shouldForceBump = !shouldFinalizeVersions && context.activeBranch !== context.baseBranch;
            return {
                applied: true,
                success: true,
                result: {
                    referenceCommit: mergeBase,
                    referenceVersion,
                    shouldFinalizeVersions,
                    shouldForceBump,
                },
                message: `Found merge base: ${mergeBase.substring(0, 8)} (version: ${referenceVersion})`,
                ...(context.gitInfo && { context: { gitInfo: context.gitInfo } }),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Merge base command failed: ${errorMessage}`,
                ...(context.gitInfo && { context: { gitInfo: context.gitInfo } }),
            };
        }
    }
    async gatherGitInfo(_context) {
        try {
            const branches = await git.branch(['-a']);
            return {
                availableBranches: branches.all,
                remoteExists: branches.all.some((b) => b.includes('origin/')),
            };
        }
        catch (error) {
            core.debug(`Failed to gather git info: ${error}`);
            return {
                availableBranches: [],
                remoteExists: false,
            };
        }
    }
    async commonCommit(base, target) {
        try {
            core.debug(`Running: git merge-base ${base} ${target}`);
            const mergeBaseOutput = await git.raw(['merge-base', base, target]);
            const mergeBase = mergeBaseOutput.trim();
            core.debug(`Merge base output: "${mergeBase}"`);
            return mergeBase || null;
        }
        catch (error) {
            core.debug(`Failed to find common commit between ${base} and ${target}: ${error}`);
            return null;
        }
    }
    async getVersionAtCommit(commit) {
        try {
            const packageJsonPath = 'package.json';
            const fileContent = await git.show([`${commit}:${packageJsonPath}`]);
            const packageJson = JSON.parse(fileContent);
            return packageJson.version || null;
        }
        catch (error) {
            core.debug(`Failed to get version at commit ${commit}: ${error}`);
            return null;
        }
    }
}
exports.MergeBaseTactic = MergeBaseTactic;
//# sourceMappingURL=merge-base.js.map