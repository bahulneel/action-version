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
exports.ObjectiveTactic = void 0;
const core = __importStar(require("@actions/core"));
/**
 * A tactical objective - coordinates a strategy to fulfill an objective through tactical execution.
 *
 * Takes config and strategic command name to attempt strategic fulfillment.
 */
class ObjectiveTactic {
    objective;
    config;
    strategicCommandName;
    name;
    strategy;
    constructor(objective, config, strategicCommandName, name) {
        this.objective = objective;
        this.config = config;
        this.strategicCommandName = strategicCommandName;
        this.strategy = this.objective.strategise(this.config);
        this.name = name || `ObjectiveTactic(${this.strategy.name}.${this.strategicCommandName})`;
    }
    /**
     * Assess if this tactical objective is applicable.
     */
    assess(_context) {
        // A tactical objective is always applicable - the strategy will handle specifics
        return true;
    }
    /**
     * Attempt this tactical objective by attempting strategic fulfillment.
     */
    async attempt(context) {
        try {
            core.debug(`🎯 Attempting tactical objective: ${this.name}`);
            core.debug(`📋 Using strategy: ${this.strategy.name}`);
            core.debug(`🎯 Strategic command: ${this.strategicCommandName}`);
            // Call the strategic command directly on the strategy
            const strategicMethod = this.strategy[this.strategicCommandName];
            const result = await strategicMethod.call(this.strategy, context);
            core.info(`✅ ${this.name}: Strategic command executed`);
            return {
                applied: true,
                success: true,
                result,
                message: `Strategic command ${this.strategicCommandName} executed successfully`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.debug(`❌ ${this.name}: Error - ${errorMessage}`);
            return {
                applied: true,
                success: false,
                message: `Strategic command failed: ${errorMessage}`,
            };
        }
    }
}
exports.ObjectiveTactic = ObjectiveTactic;
//# sourceMappingURL=ObjectiveTactic.js.map