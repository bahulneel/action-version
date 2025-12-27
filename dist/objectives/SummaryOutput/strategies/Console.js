"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Console = void 0;
/**
 * Console summary strategy.
 * Generates console-based summaries for non-GitHub Actions environments.
 */
class Console {
    logger;
    name = 'console';
    description = 'Console-based summary output';
    constructor(_config, logger) {
        this.logger = logger;
    }
    /**
     * Generate console-based summary for non-GitHub Actions environments.
     */
    async generateSummary(results, config) {
        this.logger.info('📦 Version Bump Summary');
        this.logger.info('='.repeat(50));
        if (results.totalPackages > 0) {
            this.logger.info('Package Changes:');
            Object.entries(results.bumped).forEach(([name, result]) => {
                const status = results.testFailures.includes(name) ? '❌ Failed' : '✅ Success';
                this.logger.info(`  ${name}: ${result.version} (${this.formatBumpType(result.bumpType)}) - ${status}`);
            });
        }
        else {
            this.logger.info('✨ No packages required version changes.');
        }
        this.logger.info('\n⚙️ Configuration Used:');
        this.logger.info(`  Strategy: ${config.strategy}`);
        this.logger.info(`  Active Branch: ${config.activeBranch}`);
        this.logger.info(`  Base Branch: ${config.baseBranch || 'none (tag-based)'}`);
        this.logger.info(`  Tag Prereleases: ${config.tagPrereleases ? 'enabled' : 'disabled'}`);
        this.logger.info(`  Create Branch: ${config.shouldCreateBranch ? 'enabled' : 'disabled'}`);
        this.logger.info(`  Branch Cleanup: ${config.branchCleanup}`);
        this.logger.info('\n📊 Statistics:');
        this.logger.info(`  Total Packages Processed: ${results.totalPackages}`);
        this.logger.info(`  Release Versions: ${results.releasePackages}`);
        this.logger.info(`  Prerelease Versions: ${results.prereleasePackages}`);
        this.logger.info(`  Finalized Versions: ${results.finalizedPackages}`);
        this.logger.info(`  Test Failures: ${results.testFailures.length}`);
        // Add recommendations
        this.addConsoleRecommendations(results, config);
        // Generate operational logging and notices
        this.logResultsSummary(results, config);
        this.generateNotices(results, config);
    }
    /**
     * Log summary to console for debugging.
     */
    logResultsSummary(results, config) {
        this.logger.startGroup('📊 Results Summary');
        if (results.totalPackages > 0) {
            this.logger.info(`✅ Processed ${results.totalPackages} packages:`);
            this.logger.info(`   • ${results.releasePackages} release versions`);
            this.logger.info(`   • ${results.prereleasePackages} prerelease versions`);
            this.logger.info(`   • ${results.finalizedPackages} finalized versions`);
            if (results.testFailures.length > 0) {
                this.logger.warning(`⚠️  ${results.testFailures.length} packages failed tests: ${results.testFailures.join(', ')}`);
            }
        }
        else {
            this.logger.info(`ℹ️  No packages required version changes with strategy '${config.strategy}'`);
        }
        this.logger.endGroup();
    }
    /**
     * Generate notices based on results.
     */
    generateNotices(results, config) {
        if (results.totalPackages > 0) {
            const releaseCount = results.releasePackages;
            const prereleaseCount = results.prereleasePackages;
            if (releaseCount > 0 && prereleaseCount > 0) {
                this.logger.notice(`🚀 Version bump completed: ${releaseCount} releases and ${prereleaseCount} prereleases created`);
            }
            else if (releaseCount > 0) {
                this.logger.notice(`🚀 Version bump completed: ${releaseCount} release${releaseCount === 1 ? '' : 's'} created`);
            }
            else if (prereleaseCount > 0) {
                this.logger.notice(`🧪 Version bump completed: ${prereleaseCount} prerelease${prereleaseCount === 1 ? '' : 's'} created`);
            }
            if (results.testFailures.length > 0) {
                this.logger.warning(`⚠️ ${results.testFailures.length} package${results.testFailures.length === 1 ? '' : 's'} failed compatibility tests`);
            }
        }
        else {
            this.logger.notice(`ℹ️ No version changes needed with strategy '${config.strategy}'`);
        }
    }
    /**
     * Add console-based recommendations for non-GitHub Actions environments.
     */
    addConsoleRecommendations(results, config) {
        const recommendations = [];
        // Strategy recommendations
        if (config.strategy === 'do-nothing' && results.totalPackages === 0) {
            recommendations.push('Consider using `apply-bump` strategy if you want to apply version bumps');
        }
        if (config.strategy === 'pre-release' && !config.baseBranch) {
            recommendations.push('Set a base branch to enable prerelease finalization');
        }
        // Test failure recommendations
        if (results.testFailures.length > 0) {
            recommendations.push('Review test failures and consider pinning dependency versions for compatibility');
        }
        // Branch management recommendations
        if (config.branchCleanup === 'keep' && results.totalPackages > 0 && config.shouldCreateBranch) {
            recommendations.push('Consider using `prune` or `semantic` branch cleanup to keep workspace clean');
        }
        if (recommendations.length > 0) {
            this.logger.info('\n💡 Recommendations:');
            recommendations.forEach((rec) => this.logger.info(`  • ${rec}`));
        }
    }
    /**
     * Format bump type with emoji for better readability.
     */
    formatBumpType(bumpType) {
        switch (bumpType) {
            case 'major':
                return '🔴 major';
            case 'minor':
                return '🟡 minor';
            case 'patch':
                return '🟢 patch';
            case 'prerelease':
                return '🧪 prerelease';
            case 'release':
                return '🚀 release';
            default:
                return bumpType;
        }
    }
}
exports.Console = Console;
//# sourceMappingURL=Console.js.map