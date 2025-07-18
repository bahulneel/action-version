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
exports.GitOperationStrategyFactory = void 0;
const core = __importStar(require("@actions/core"));
const conventional_js_1 = require("./conventional.js");
const simple_js_1 = require("./simple.js");
/**
 * Factory class for creating git operation strategies.
 * Implements the Factory pattern to provide strategy instances.
 */
class GitOperationStrategyFactory {
    static strategies = new Map([
        ['conventional', new conventional_js_1.ConventionalGitStrategy()],
        ['simple', new simple_js_1.SimpleGitStrategy()],
    ]);
    /**
     * Get a git operation strategy by name.
     * @param strategyName - The name of the strategy to retrieve (defaults to 'conventional')
     * @returns The strategy instance
     */
    static getStrategy(strategyName = 'conventional') {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            core.warning(`Unknown git strategy: ${strategyName}, falling back to conventional`);
            return this.strategies.get('conventional');
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
exports.GitOperationStrategyFactory = GitOperationStrategyFactory;
//# sourceMappingURL=factory.js.map