"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryService = void 0;
const index_js_1 = require("../objectives/index.js");
/**
 * Service responsible for generating comprehensive summaries and reports.
 * Thin orchestrator that delegates to SummaryOutput objective.
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
        // Generate summary using the strategy (includes all logging and notices)
        await strategy.generateSummary(results, config);
    }
}
exports.SummaryService = SummaryService;
//# sourceMappingURL=summary.js.map