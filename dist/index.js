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
exports.VersionBumpApplication = void 0;
exports.main = main;
require("source-map-support/register");
const core = __importStar(require("@actions/core"));
const git_js_1 = require("./utils/git.js");
const workspace_js_1 = require("./utils/workspace.js");
const factory_js_1 = require("./strategies/git-operations/factory.js");
const factory_js_2 = require("./strategies/package-managers/factory.js");
const configuration_js_1 = require("./services/configuration.js");
const version_bump_js_1 = require("./services/version-bump.js");
const summary_js_1 = require("./services/summary.js");
/**
 * Main application class that orchestrates the version bump process.
 * Follows clean architecture principles with proper separation of concerns.
 */
class VersionBumpApplication {
    exitCode = 0;
    outputBranch;
    hasBumped = false;
    /**
     * Run the complete version bump process.
     */
    async run() {
        try {
            core.info('🚀 Starting version bump action...');
            // Step 1: Parse and validate configuration
            const config = await this.parseConfiguration();
            core.info(`📋 Configuration loaded: strategy=${config.strategy}, base=${config.baseBranch || 'none'}`);
            // Step 2: Setup git and determine branches
            const gitSetup = await (0, git_js_1.setupGit)(config.shouldCreateBranch, config.branchTemplate);
            this.outputBranch = gitSetup.newBranch;
            // Step 3: Load root package and initialize services
            const { pkg: rootPkg, path: rootPath } = await (0, workspace_js_1.findRootPackage)();
            const packageManager = factory_js_2.PackageManagerFactory.getPackageManager();
            const gitStrategy = factory_js_1.GitOperationStrategyFactory.getStrategy('conventional');
            core.info(`📦 Package manager: ${packageManager.name}`);
            core.info(`🔧 Git strategy: ${gitStrategy.name}`);
            // Step 4: Initialize services
            const versionBumpService = new version_bump_js_1.VersionBumpService(gitStrategy, packageManager);
            const summaryService = new summary_js_1.SummaryService();
            // Step 5: Discover and process packages
            const packages = await (0, workspace_js_1.createWorkspacePackages)(rootPkg);
            core.info(`📁 Discovered ${packages.length} packages`);
            // Step 6: Execute version bump process
            const results = await versionBumpService.processWorkspace(packages, rootPkg, config);
            this.hasBumped = results.hasBumped;
            // Step 7: Generate comprehensive summary
            await summaryService.generateSummary(results, config);
            // Step 8: Handle success
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
        const configService = new configuration_js_1.ConfigurationService();
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
                await (0, git_js_1.pushChanges)(this.outputBranch);
                if (this.outputBranch) {
                    core.setOutput('branch', this.outputBranch);
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
        }
        // Write summary to GitHub Actions
        await core.summary.write({ overwrite: true });
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