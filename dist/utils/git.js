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
exports.setupGit = setupGit;
exports.getCommitsAffecting = getCommitsAffecting;
exports.pushChanges = pushChanges;
exports.getBranches = getBranches;
exports.deleteLocalBranch = deleteLocalBranch;
const core = __importStar(require("@actions/core"));
const simple_git_1 = __importDefault(require("simple-git"));
const node_path_1 = __importDefault(require("node:path"));
const commits_js_1 = require("./commits.js");
const git = (0, simple_git_1.default)();
/**
 * Setup git configuration and checkout appropriate branch.
 */
async function setupGit(shouldCreateBranch, branchTemplate) {
    // Configure git user
    await git.addConfig('user.name', 'github-actions[bot]');
    await git.addConfig('user.email', 'github-actions[bot]@users.noreply.github.com');
    // Fetch all branches with full history to ensure merge-base works properly
    try {
        core.debug(`[git] Fetching all branches with full history`);
        await git.fetch(['--all', '--unshallow', '--prune', '--prune-tags']);
        core.debug(`[git] Successfully fetched all branches with full history`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.warning(`[git] Failed to fetch all branches: ${errorMessage}`);
    }
    const currentBranch = process.env?.GITHUB_HEAD_REF || process.env?.GITHUB_REF_NAME || 'main';
    if (shouldCreateBranch) {
        // Create a unique ref instead of a branch to avoid cleanup issues
        const timestamp = Date.now();
        const refName = `refs/heads/temp-${timestamp}`;
        const displayName = interpolateBranchTemplate(branchTemplate, { version: currentBranch });
        core.info(`[git] Creating temporary ref ${refName} from ${currentBranch}`);
        try {
            // Create the ref directly without checking out
            await git.raw('update-ref', refName, currentBranch);
            core.debug(`[git] Successfully created ref ${refName}`);
            // Checkout the ref
            await git.checkout(refName);
            core.debug(`[git] Successfully checked out ${refName}`);
            return { currentBranch, newBranch: displayName, tempRef: refName };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.error(`[git] Failed to create ref: ${errorMessage}`);
            throw new Error(`Failed to create ref: ${errorMessage}`);
        }
    }
    else {
        core.info(`[git] Checking out ${currentBranch}`);
        await git.checkout(currentBranch);
        core.debug(`[git] Successfully checked out ${currentBranch}`);
        return { currentBranch, newBranch: undefined };
    }
}
/**
 * Get commits affecting a specific directory since a reference point.
 */
async function getCommitsAffecting(dir, sinceRef) {
    const range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
    const log = await git.log([range, '--', dir]);
    const commits = (0, commits_js_1.parseCommits)([...log.all], sinceRef);
    const relativePath = node_path_1.default.relative(process.cwd(), dir) || '/';
    core.info(`[${relativePath}] ${commits.length} commits affecting since ${sinceRef}`);
    return commits;
}
/**
 * Push changes to remote repository.
 */
async function pushChanges(branch) {
    try {
        if (branch) {
            core.info(`[git] Pushing ${branch} to origin`);
            await git.push('origin', branch, ['--set-upstream', '--force']);
            core.info(`[git] Successfully pushed ${branch}`);
        }
        else {
            core.info(`[git] Pushing current branch and tags`);
            await git.push();
            await git.pushTags();
            core.info(`[git] Successfully pushed changes and tags`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.error(`[git] Failed to push changes: ${errorMessage}`);
        throw new Error(`Failed to push changes: ${errorMessage}`);
    }
}
/**
 * Get git branch information.
 */
async function getBranches() {
    return await git.branch(['--list', '--remote']);
}
/**
 * Delete a local branch safely.
 */
async function deleteLocalBranch(branchName, force = false) {
    try {
        await git.deleteLocalBranch(branchName, force);
        core.debug(`[git] Successfully deleted local branch ${branchName}`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.warning(`[git] Failed to delete local branch ${branchName}: ${errorMessage}`);
    }
}
/**
 * Simple template interpolation for branch names.
 */
function interpolateBranchTemplate(template, vars) {
    return template.replace(/\$\{(\w+)\}/g, (match, variableName) => {
        const value = vars[variableName];
        return value !== undefined ? String(value) : match;
    });
}
//# sourceMappingURL=git.js.map