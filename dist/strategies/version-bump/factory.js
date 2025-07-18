"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionBumpStrategyFactory = void 0;
const do_nothing_js_1 = require("./do-nothing.js");
const apply_bump_js_1 = require("./apply-bump.js");
const pre_release_js_1 = require("./pre-release.js");
/**
 * Factory class for creating version bump strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
class VersionBumpStrategyFactory {
    static strategies = new Map([
        ['do-nothing', new do_nothing_js_1.DoNothingStrategy()],
        ['apply-bump', new apply_bump_js_1.ApplyBumpStrategy()],
        ['pre-release', new pre_release_js_1.PreReleaseStrategy()],
    ]);
    /**
     * Get a version bump strategy by name.
     * @param strategyName - The name of the strategy to retrieve
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Unknown version bump strategy: ${strategyName}. Available strategies: ${this.getAvailableStrategies().join(', ')}`);
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
exports.VersionBumpStrategyFactory = VersionBumpStrategyFactory;
//# sourceMappingURL=factory.js.map