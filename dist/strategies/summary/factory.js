"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryStrategyFactory = void 0;
const github_actions_js_1 = require("./github-actions.js");
const console_js_1 = require("./console.js");
/**
 * Factory class for creating summary strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
class SummaryStrategyFactory {
    static strategies = new Map([
        ['github-actions', new github_actions_js_1.GitHubActionsSummaryStrategy()],
        ['console', new console_js_1.ConsoleSummaryStrategy()],
    ]);
    /**
     * Get a summary strategy by name.
     * @param strategyName - The name of the strategy to retrieve
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Unknown summary strategy: ${strategyName}. Available strategies: ${this.getAvailableStrategies().join(', ')}`);
        }
        return strategy;
    }
    /**
     * Get the appropriate summary strategy based on environment.
     * @returns The strategy instance
     */
    static getAppropriateStrategy() {
        // Check if we're in a GitHub Actions environment
        if (process.env.GITHUB_STEP_SUMMARY) {
            return this.getStrategy('github-actions');
        }
        else {
            return this.getStrategy('console');
        }
    }
    /**
     * Get all available strategy names.
     * @returns Array of available strategy names
     */
    static getAvailableStrategies() {
        return Array.from(this.strategies.keys());
    }
    /**
     * Check if a strategy exists.
     * @param strategyName - The strategy name to check
     * @returns True if the strategy exists
     */
    static hasStrategy(strategyName) {
        return this.strategies.has(strategyName);
    }
}
exports.SummaryStrategyFactory = SummaryStrategyFactory;
//# sourceMappingURL=factory.js.map