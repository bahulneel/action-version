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
exports.LastVersionCommitTactic = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = require("simple-git");
const tactic_config_js_1 = require("../../../utils/tactic-config.js");
const git = (0, simple_git_1.simpleGit)();
/**
 * LastVersionCommitTactic - Finds the last commit that changed the version field in package.json.
 *
 * This tactic is highly reliable because:
 * - It directly finds the last release point
 * - Works regardless of branch structure
 * - Independent of merge-base issues
 * - Can work across force-pushes and branch recreations
 */
class LastVersionCommitTactic {
    get name() {
        return 'LastVersionCommit';
    }
    assess(_context) {
        // This tactic is always applicable
        return true;
    }
    async attempt(context) {
        const packageJsonPath = context.packageJsonPath || 'package.json';
        try {
            const versionCommit = await this.findLastVersionChangeCommit(packageJsonPath);
            if (!versionCommit) {
                return {
                    applied: true,
                    success: false,
                    message: `No version change commits found in ${packageJsonPath}`,
                };
            }
            const referenceVersion = (await this.getVersionAtCommit(versionCommit)) || '0.0.0';
            const shouldFinalizeVersions = context.currentBranch === context.baseBranch;
            return {
                applied: true,
                success: true,
                result: {
                    referenceCommit: versionCommit,
                    referenceVersion,
                    shouldFinalizeVersions,
                    shouldForceBump: false, // Don't force bump when using version commit
                },
                message: `Found last version commit: ${versionCommit.substring(0, 8)} (version: ${referenceVersion})`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Failed to find version commit: ${errorMessage}`,
            };
        }
    }
    async findLastVersionChangeCommit(packageJsonPath) {
        try {
            // Use git log -L to directly track version field changes
            // This is much more efficient than scanning all commits
            const tacticOptions = tactic_config_js_1.TacticConfig.getTacticOptions(this.name, {
                maxCount: 'number',
            });
            const maxCount = tacticOptions.maxCount || 1;
            const gitCommand = ['log', '-L', `/version/,+1:${packageJsonPath}`, `--max-count=${maxCount}`];
            core.debug(`Executing git command: ${gitCommand.join(' ')}`);
            const logOutput = await git.raw(gitCommand);
            if (logOutput.trim()) {
                core.debug(`Git log output (first 200 chars): ${logOutput.substring(0, 200)}`);
                // Parse the commit hash from the diff output
                // Format: <commit-hash>\ndiff --git a/package.json b/package.json
                const lines = logOutput.trim().split('\n');
                const firstLine = lines[0];
                core.debug(`First line: "${firstLine}"`);
                // Extract commit hash from first line (should be 40 chars)
                if (firstLine && firstLine.match(/^[a-f0-9]{40}$/)) {
                    const commitHash = firstLine;
                    core.debug(`Found version change in commit: ${commitHash.substring(0, 8)}`);
                    return commitHash;
                }
                core.debug(`First line does not match commit hash pattern`);
            }
            else {
                core.debug(`No version changes found in ${packageJsonPath} using -L`);
            }
            return null;
        }
        catch (error) {
            core.debug(`-L approach failed: ${error}`);
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
exports.LastVersionCommitTactic = LastVersionCommitTactic;
//# sourceMappingURL=last-version-commit.js.map