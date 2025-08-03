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
exports.DiffBasedVersionCommitTactic = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = require("simple-git");
const git = (0, simple_git_1.simpleGit)();
/**
 * DiffBasedVersionCommitTactic - Traditional approach to finding version changes.
 *
 * This tactic uses git log to find commits that touched package.json,
 * then checks each commit's diff to see if it changed the version field.
 * It's more thorough but slower than the -L approach.
 */
class DiffBasedVersionCommitTactic {
    get name() {
        return 'DiffBasedVersionCommit';
    }
    assess(_context) {
        // This tactic is always applicable as a fallback
        return true;
    }
    async attempt(context) {
        const packageJsonPath = context.packageJsonPath || 'package.json';
        try {
            core.debug(`Using fallback method to find version changes in ${packageJsonPath}`);
            const log = await git.log({
                file: packageJsonPath,
                maxCount: 50,
            });
            core.debug(`Found ${log.all.length} commits that touched ${packageJsonPath}`);
            // Look for commits that actually changed the version
            for (const commit of log.all) {
                try {
                    core.debug(`Checking commit ${commit.hash.substring(0, 8)} for version changes`);
                    const diff = await git.diff([`${commit.hash}~1..${commit.hash}`, '--', packageJsonPath]);
                    if (diff.includes('"version":')) {
                        core.debug(`Found version change in commit: ${commit.hash} - ${commit.message}`);
                        const referenceVersion = (await this.getVersionAtCommit(commit.hash)) || '0.0.0';
                        const shouldFinalizeVersions = context.currentBranch === context.baseBranch;
                        return {
                            applied: true,
                            success: true,
                            result: {
                                referenceCommit: commit.hash,
                                referenceVersion,
                                shouldFinalizeVersions,
                                shouldForceBump: false, // Don't force bump when using version commit
                            },
                            message: `Found last version commit: ${commit.hash.substring(0, 8)} (version: ${referenceVersion})`,
                        };
                    }
                }
                catch (error) {
                    core.debug(`Error checking commit ${commit.hash.substring(0, 8)}: ${error}`);
                    // Ignore errors for individual commits (might be initial commit)
                }
            }
            core.debug(`No version changes found in any commits`);
            return {
                applied: true,
                success: false,
                message: `No version change commits found in ${packageJsonPath}`,
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
exports.DiffBasedVersionCommitTactic = DiffBasedVersionCommitTactic;
//# sourceMappingURL=fallback-version-commit.js.map