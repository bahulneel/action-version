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
exports.VersionBumpApplication = void 0;
exports.main = main;
require("source-map-support/register");
const core = __importStar(require("@actions/core"));
const fs_1 = require("fs");
const semver_1 = __importDefault(require("semver"));
const workspace_js_1 = require("./utils/workspace.js");
const configuration_js_1 = require("./services/configuration.js");
const version_bump_js_1 = require("./services/version-bump.js");
const summary_js_1 = require("./services/summary.js");
const SimpleGit_js_1 = require("./adapters/Git/SimpleGit.js");
const GitHubActions_js_1 = require("./adapters/Config/GitHubActions.js");
const template_js_1 = require("./utils/template.js");
const index_js_1 = require("./objectives/index.js");
/**
 * Main application class that orchestrates the version bump process.
 * Follows clean architecture principles with proper separation of concerns.
 */
class VersionBumpApplication {
    exitCode = 0;
    outputBranch;
    tempRef;
    branchTemplate;
    hasBumped = false;
    git = new SimpleGit_js_1.SimpleGit();
    /**
     * Run the complete version bump process.
     */
    async run() {
        try {
            core.info('🚀 Starting version bump action...');
            // Step 1: Parse and validate configuration
            const config = await this.parseConfiguration();
            core.info(`📋 Configuration loaded: strategy=${config.strategy}, base=${config.baseBranch || 'none'}`);
            // Step 2: Setup VCS via objective (delegates to legacy strategy)
            const vcs = index_js_1.vcsObjective.strategise(config);
            const gitSetup = await vcs.setup({
                shouldCreateBranch: config.shouldCreateBranch,
                branchTemplate: config.branchTemplate,
            });
            this.tempRef = gitSetup.tempRef;
            this.branchTemplate = gitSetup.branchTemplate;
            // Step 3: Load root package and initialize services
            const { pkg: rootPkg } = await (0, workspace_js_1.findRootPackage)();
            const packageManager = index_js_1.packageManagement.strategise(config);
            const gitStrategy = vcs;
            core.info(`📦 Package manager: ${packageManager.name}`);
            core.info(`🔧 Git strategy: ${gitStrategy.name}`);
            // Step 4: Initialize services
            const versionBumpService = new version_bump_js_1.VersionBumpService(gitStrategy, packageManager, config);
            const summaryService = new summary_js_1.SummaryService(config);
            // Step 5: Discover and process packages
            const packages = await (0, workspace_js_1.createWorkspacePackages)(rootPkg);
            core.info(`📁 Discovered ${packages.length} packages`);
            // Step 6: Execute version bump process
            const results = await versionBumpService.processWorkspace(packages, rootPkg, config);
            this.hasBumped = results.hasBumped;
            // Step 7: Create tag for root package if version is greater than latest tag and we're not branching
            if (!config.shouldCreateBranch) {
                const rootPackageName = rootPkg.name || 'root';
                const currentVersion = results.bumped[rootPackageName]?.version || rootPkg.version;
                const isPrerelease = currentVersion.includes('-');
                // Only tag if this is a new version (greater than latest tag)
                const shouldTag = await this.shouldCreateTag(currentVersion, isPrerelease, config.tagPrereleases);
                if (shouldTag) {
                    await gitStrategy.tagVersion(currentVersion, isPrerelease, true);
                }
            }
            // Step 8: Generate comprehensive summary
            await summaryService.generateSummary(results, config);
            // Step 9: Handle success
            if (this.hasBumped) {
                core.info('✅ Version bump action completed successfully with changes');
                core.notice(`Version bump completed: ${results.totalPackages} packages updated`);
            }
            else {
                core.info('✅ Version bump action completed successfully with no changes needed');
                core.notice(`No version changes needed with strategy '${config.strategy}'`);
            }
            // Set outputs for GitHub Actions
            this.setActionOutputs(results, config);
        }
        catch (error) {
            this.handleError(error);
        }
        finally {
            await this.finalize();
        }
    }
    /**
     * Parse and validate action configuration from inputs.
     */
    async parseConfiguration() {
        const configAdapter = new GitHubActions_js_1.GitHubActions();
        const configService = new configuration_js_1.ConfigurationService(configAdapter);
        return await configService.parseConfiguration();
    }
    /**
     * Handle errors that occur during execution.
     */
    handleError(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.error(`❌ Version bump failed: ${errorMessage}`);
        core.setFailed(errorMessage);
        this.exitCode = 1;
    }
    /**
     * Finalize the process by pushing changes if any were made.
     */
    async finalize() {
        if (this.hasBumped) {
            try {
                // If we have a temp ref, create the proper versioned branch name
                if (this.tempRef && this.branchTemplate) {
                    // Get the final root package version to create the branch name
                    const rootPkgContent = await fs_1.promises.readFile('package.json', 'utf-8');
                    const rootPkg = JSON.parse(rootPkgContent);
                    const versionedBranch = (0, template_js_1.interpolateTemplate)(this.branchTemplate, {
                        version: rootPkg.version,
                    });
                    core.info(`[git] Creating versioned branch: ${versionedBranch}`);
                    // Create branch ref from temp ref and push
                    try {
                        await this.git.raw('update-ref', `refs/heads/${versionedBranch}`, this.tempRef);
                    }
                    catch (e) {
                        const msg = e instanceof Error ? e.message : String(e);
                        core.warning(`[git] Failed to create branch ref from temp ref: ${msg}`);
                    }
                    await this.git.push('origin', versionedBranch, ['--set-upstream', '--force']);
                    core.setOutput('branch', versionedBranch);
                }
                else {
                    // Fallback for when no temp ref was created
                    if (this.outputBranch) {
                        await this.git.push('origin', this.outputBranch, ['--set-upstream']);
                    }
                    else {
                        await this.git.push();
                    }
                    if (this.outputBranch) {
                        core.setOutput('branch', this.outputBranch);
                    }
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                core.error(`Failed to push changes: ${errorMessage}`);
                core.setFailed(`Failed to push changes: ${errorMessage}`);
                this.exitCode = 1;
            }
        }
        else {
            core.info('📝 No changes to push');
            // Push tags even when no commits were made (when not creating branches)
            if (!this.outputBranch) {
                try {
                    core.info(`[git] Pushing tags only`);
                    await this.git.pushTags();
                    core.info(`[git] Successfully pushed tags`);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    core.warning(`Failed to push tags: ${errorMessage}`);
                }
            }
        }
        // Clean up the temporary ref if it was created
        if (this.tempRef) {
            try {
                core.info(`[git] Cleaning up temporary ref ${this.tempRef}`);
                await this.git.raw('update-ref', '-d', this.tempRef);
                core.debug(`[git] Successfully deleted temporary ref ${this.tempRef}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                // Ref not existing during cleanup is expected
                if (!errorMessage.includes('not found') && !errorMessage.includes('does not exist')) {
                    core.warning(`Failed to delete temporary ref ${this.tempRef}: ${errorMessage}`);
                }
                else {
                    core.debug(`[git] Temporary ref ${this.tempRef} already cleaned up`);
                }
            }
        }
        // Write summary to GitHub Actions (only if in GitHub Actions environment)
        if (process.env.GITHUB_STEP_SUMMARY) {
            await core.summary.write({ overwrite: true });
        }
        // Exit with appropriate code
        process.exit(this.exitCode);
    }
    /**
     * Set GitHub Actions outputs based on results.
     */
    setActionOutputs(results, config) {
        core.setOutput('packages-updated', results.totalPackages);
        core.setOutput('releases-created', results.releasePackages);
        core.setOutput('prereleases-created', results.prereleasePackages);
        core.setOutput('versions-finalized', results.finalizedPackages);
        core.setOutput('test-failures', results.testFailures?.length || 0);
        core.setOutput('strategy-used', config.strategy);
        core.setOutput('changes-made', this.hasBumped);
        // Export useful environment variables
        core.exportVariable('VERSION_BUMP_PACKAGES_UPDATED', results.totalPackages);
        core.exportVariable('VERSION_BUMP_CHANGES_MADE', this.hasBumped);
        core.exportVariable('VERSION_BUMP_STRATEGY', config.strategy);
    }
    /**
     * Determine if we should create a tag for the current version.
     */
    async shouldCreateTag(currentVersion, isPrerelease, tagPrereleases) {
        try {
            // Get latest tag
            const tags = await this.git.tags(['--sort=-v:refname']);
            const latestTag = tags.latest;
            if (!latestTag) {
                // No tags exist, so this is the first version
                return !isPrerelease || tagPrereleases;
            }
            // Compare current version with latest tag
            const latestVersion = latestTag.replace(/^v/, '');
            if (semver_1.default.gt(currentVersion, latestVersion)) {
                // Current version is greater than latest tag
                return !isPrerelease || tagPrereleases;
            }
            return false;
        }
        catch (error) {
            core.warning(`Failed to check if should create tag: ${error}`);
            return false;
        }
    }
}
exports.VersionBumpApplication = VersionBumpApplication;
/**
 * Application entry point.
 * Creates and runs the version bump application.
 */
async function main() {
    const app = new VersionBumpApplication();
    await app.run();
}
// Run the application if this file is executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
exports.default = main;
//# sourceMappingURL=index.js.map