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
exports.AllManeuver = void 0;
const core = __importStar(require("@actions/core"));
/**
 * All maneuver: runs all applicable tactics and collects results.
 * Useful when you need to aggregate outputs from multiple tactics.
 * Returns a ManeuverResult with an array of individual results.
 */
class AllManeuver {
    tactics;
    name;
    description;
    constructor(tactics, name, description) {
        this.tactics = tactics;
        this.name = name;
        if (description) {
            this.description = description;
        }
    }
    /**
     * Execute all applicable tactics and collect results.
     */
    async execute(context) {
        if (this.tactics.length === 0) {
            return {
                success: false,
                message: `Maneuver '${this.name}': No tactics provided`,
            };
        }
        core.info(`🎯 Executing maneuver '${this.name}' (all) with ${this.tactics.length} tactics`);
        if (this.description) {
            core.debug(`📋 ${this.description}`);
        }
        const results = [];
        const tacticResults = [];
        for (const tactic of this.tactics) {
            core.debug(`🎯 Executing tactic: ${tactic.name}`);
            const result = await this.executeTactic(tactic, context);
            const tacticResultEntry = {
                tacticName: tactic.name,
                success: result.success,
                ...(result.result !== undefined && { result: result.result }),
                ...(result.message !== undefined && { message: result.message }),
            };
            tacticResults.push(tacticResultEntry);
            if (result.applied && result.success && result.result) {
                core.info(`✅ ${tactic.name}: ${result.message || 'Success'}`);
                results.push(result.result);
            }
            else if (result.applied && !result.success) {
                core.debug(`❌ ${tactic.name}: ${result.message || 'Failed'}`);
            }
            else {
                core.debug(`⏭️ ${tactic.name}: ${result.message || 'Not applied'}`);
            }
        }
        const allSucceeded = tacticResults.every((r) => r.success);
        const anySucceeded = tacticResults.some((r) => r.success);
        return {
            success: anySucceeded,
            result: results,
            message: allSucceeded
                ? `All tactics succeeded`
                : anySucceeded
                    ? `Some tactics succeeded (${results.length}/${this.tactics.length})`
                    : `All tactics failed`,
            tacticResults,
        };
    }
    async executeTactic(tactic, context) {
        // Assess if this tactic is applicable
        if (!tactic.assess(context)) {
            return {
                applied: false,
                success: false,
                message: 'Not applicable to this context',
            };
        }
        try {
            const result = await tactic.attempt(context);
            // Update context with any new information
            if (result.context && typeof context === 'object' && context !== null) {
                Object.assign(context, result.context);
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Error: ${errorMessage}`,
            };
        }
    }
}
exports.AllManeuver = AllManeuver;
//# sourceMappingURL=All.js.map