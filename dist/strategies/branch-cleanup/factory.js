"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchCleanupStrategyFactory = void 0;
const keep_all_js_1 = require("./keep-all.js");
const prune_old_js_1 = require("./prune-old.js");
const semantic_js_1 = require("./semantic.js");
/**
 * Factory class for creating branch cleanup strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
class BranchCleanupStrategyFactory {
    static strategies = new Map([
        ['keep', new keep_all_js_1.KeepAllBranchesStrategy()],
        ['prune', new prune_old_js_1.PruneOldBranchesStrategy()],
        ['semantic', new semantic_js_1.SemanticBranchesStrategy()],
    ]);
    /**
     * Get a branch cleanup strategy by name.
     * @param strategyName - The name of the strategy to retrieve
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Unknown branch cleanup strategy: ${strategyName}. Available strategies: ${this.getAvailableStrategies().join(', ')}`);
        }
        return strategy;
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
exports.BranchCleanupStrategyFactory = BranchCleanupStrategyFactory;
//# sourceMappingURL=factory.js.map