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
exports.Console = void 0;
const core = __importStar(require("@actions/core"));
/**
 * Console summary strategy.
 * Generates console-based summaries for non-GitHub Actions environments.
 */
class Console {
    name = 'console';
    description = 'Console-based summary output';
    constructor(_config) { }
    /**
     * Generate console-based summary for non-GitHub Actions environments.
     */
    async generateSummary(results, config) {
        core.info('📦 Version Bump Summary');
        core.info('='.repeat(50));
        if (results.totalPackages > 0) {
            core.info('Package Changes:');
            Object.entries(results.bumped).forEach(([name, result]) => {
                const status = results.testFailures.includes(name) ? '❌ Failed' : '✅ Success';
                core.info(`  ${name}: ${result.version} (${this.formatBumpType(result.bumpType)}) - ${status}`);
            });
        }
        else {
            core.info('✨ No packages required version changes.');
        }
        core.info('\n⚙️ Configuration Used:');
        core.info(`  Strategy: ${config.strategy}`);
        core.info(`  Active Branch: ${config.activeBranch}`);
        core.info(`  Base Branch: ${config.baseBranch || 'none (tag-based)'}`);
        core.info(`  Tag Prereleases: ${config.tagPrereleases ? 'enabled' : 'disabled'}`);
        core.info(`  Create Branch: ${config.shouldCreateBranch ? 'enabled' : 'disabled'}`);
        core.info(`  Branch Cleanup: ${config.branchCleanup}`);
        core.info('\n📊 Statistics:');
        core.info(`  Total Packages Processed: ${results.totalPackages}`);
        core.info(`  Release Versions: ${results.releasePackages}`);
        core.info(`  Prerelease Versions: ${results.prereleasePackages}`);
        core.info(`  Finalized Versions: ${results.finalizedPackages}`);
        core.info(`  Test Failures: ${results.testFailures.length}`);
        // Add recommendations
        this.addConsoleRecommendations(results, config);
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
            core.info('\n💡 Recommendations:');
            recommendations.forEach((rec) => core.info(`  • ${rec}`));
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