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
exports.SummaryService = void 0;
const core = __importStar(require("@actions/core"));
const index_js_1 = require("../objectives/index.js");
/**
 * Service responsible for generating comprehensive summaries and reports.
 * Handles GitHub Actions summary creation and output generation.
 */
class SummaryService {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate comprehensive summary for the version bump process.
     */
    async generateSummary(results, config) {
        // Get the appropriate summary strategy from objective
        const strategy = index_js_1.summaryOutput.strategise(this.config);
        // Generate summary using the strategy
        await strategy.generateSummary(results, config);
        // Generate additional outputs
        this.logResultsSummary(results, config);
        this.generateNotices(results, config);
    }
    /**
     * Log summary to console for debugging.
     */
    logResultsSummary(results, config) {
        core.startGroup('📊 Results Summary');
        if (results.totalPackages > 0) {
            core.info(`✅ Processed ${results.totalPackages} packages:`);
            core.info(`   • ${results.releasePackages} release versions`);
            core.info(`   • ${results.prereleasePackages} prerelease versions`);
            core.info(`   • ${results.finalizedPackages} finalized versions`);
            if (results.testFailures.length > 0) {
                core.warning(`⚠️  ${results.testFailures.length} packages failed tests: ${results.testFailures.join(', ')}`);
            }
        }
        else {
            core.info(`ℹ️  No packages required version changes with strategy '${config.strategy}'`);
        }
        core.endGroup();
    }
    /**
     * Generate GitHub Actions notices based on results.
     */
    generateNotices(results, config) {
        if (results.totalPackages > 0) {
            const releaseCount = results.releasePackages;
            const prereleaseCount = results.prereleasePackages;
            if (releaseCount > 0 && prereleaseCount > 0) {
                core.notice(`🚀 Version bump completed: ${releaseCount} releases and ${prereleaseCount} prereleases created`);
            }
            else if (releaseCount > 0) {
                core.notice(`🚀 Version bump completed: ${releaseCount} release${releaseCount === 1 ? '' : 's'} created`);
            }
            else if (prereleaseCount > 0) {
                core.notice(`🧪 Version bump completed: ${prereleaseCount} prerelease${prereleaseCount === 1 ? '' : 's'} created`);
            }
            if (results.testFailures.length > 0) {
                core.warning(`⚠️ ${results.testFailures.length} package${results.testFailures.length === 1 ? '' : 's'} failed compatibility tests`);
            }
        }
        else {
            core.notice(`ℹ️ No version changes needed with strategy '${config.strategy}'`);
        }
    }
}
exports.SummaryService = SummaryService;
//# sourceMappingURL=summary.js.map