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
exports.PlanTactic = void 0;
const core = __importStar(require("@actions/core"));
/**
 * A tactical wrapper around a maneuver.
 * Allows Maneuvers to participate as Tactics in larger tactical structures.
 */
class PlanTactic {
    maneuver;
    name;
    constructor(maneuver) {
        this.maneuver = maneuver;
        this.name = `${this.maneuver.name}Tactic`;
    }
    /**
     * Assess if this plan tactic is applicable.
     */
    assess(_context) {
        // A plan tactic is always applicable - the maneuver itself will handle tactic assessment
        return true;
    }
    /**
     * Attempt this plan tactic by executing the underlying maneuver.
     */
    async attempt(context) {
        try {
            core.debug(`🎯 Attempting plan tactic: ${this.name}`);
            const maneuverResult = await this.maneuver.execute(context);
            if (maneuverResult.success && maneuverResult.result) {
                return {
                    applied: true,
                    success: true,
                    result: maneuverResult.result,
                    ...(maneuverResult.context !== undefined && { context: maneuverResult.context }),
                    ...(maneuverResult.message !== undefined && {
                        message: maneuverResult.message || `Maneuver executed successfully`,
                    }),
                };
            }
            else {
                return {
                    applied: true,
                    success: false,
                    message: maneuverResult.message || `Maneuver execution failed`,
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.debug(`❌ ${this.name}: Error - ${errorMessage}`);
            return {
                applied: true,
                success: false,
                message: `Maneuver execution failed: ${errorMessage}`,
            };
        }
    }
}
exports.PlanTactic = PlanTactic;
//# sourceMappingURL=PlanTactic.js.map