"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageManagerFactory = void 0;
const npm_js_1 = require("./npm.js");
const pnpm_js_1 = require("./pnpm.js");
const yarn_js_1 = require("./yarn.js");
/**
 * Factory class for creating package manager strategies.
 * Automatically detects the appropriate package manager based on lock files.
 */
class PackageManagerFactory {
    static strategies = [
        new yarn_js_1.YarnPackageManagerStrategy(), // Check Yarn first (preferred)
        new pnpm_js_1.PnpmPackageManagerStrategy(), // Then PNPM
        new npm_js_1.NpmPackageManagerStrategy(), // NPM as fallback
    ];
    /**
     * Get the appropriate package manager strategy based on environment detection.
     * @returns The detected package manager strategy
     */
    static getPackageManager() {
        for (const strategy of this.strategies) {
            if (strategy.isAvailable()) {
                return strategy;
            }
        }
        // Fallback to NPM if no package manager is detected
        return new npm_js_1.NpmPackageManagerStrategy();
    }
    /**
     * Get a specific package manager strategy by name.
     * @param name - The name of the package manager
     * @returns The strategy instance
     * @throws Error if the strategy is not found
     */
    static getStrategy(name) {
        const strategy = this.strategies.find(s => s.name === name);
        if (!strategy) {
            throw new Error(`Unknown package manager: ${name}. Available: ${this.getAvailableStrategies().join(', ')}`);
        }
        return strategy;
    }
    /**
     * Get all available strategy names.
     * @returns Array of available strategy names
     */
    static getAvailableStrategies() {
        return this.strategies.map(s => s.name);
    }
    /**
     * Get all strategy instances.
     * @returns Array of all strategy instances
     */
    static getAllStrategies() {
        return this.strategies;
    }
}
exports.PackageManagerFactory = PackageManagerFactory;
//# sourceMappingURL=factory.js.map