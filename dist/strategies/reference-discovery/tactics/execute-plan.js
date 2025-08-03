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
exports.ExecutePlanTactic = void 0;
const core = __importStar(require("@actions/core"));
/**
 * ExecutePlanTactic - Executes a tactical plan as a single tactic.
 *
 * This enables composition where a plan (sequence of tactics) can be treated
 * as a tactic itself, allowing for nested and composable tactical strategies.
 */
class ExecutePlanTactic {
    plan;
    tacticName;
    constructor(plan, name) {
        this.plan = plan;
        this.tacticName = name || `ExecutePlan(${plan.description})`;
    }
    get name() {
        return this.tacticName;
    }
    assess(_context) {
        // A plan is always applicable - it will handle its own tactic assessment
        return true;
    }
    async attempt(context) {
        try {
            core.debug(`🎯 Executing plan as tactic: ${this.plan.description}`);
            const result = await this.plan.execute(context);
            return {
                applied: true,
                success: true,
                result: result,
                message: `Plan executed successfully`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Plan execution error: ${errorMessage}`,
            };
        }
    }
}
exports.ExecutePlanTactic = ExecutePlanTactic;
//# sourceMappingURL=execute-plan.js.map