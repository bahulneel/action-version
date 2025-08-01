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
exports.TacticalPlan = void 0;
const core = __importStar(require("@actions/core"));
/**
 * A tactical plan - coordinates the execution of an ordered sequence of tactics.
 */
class TacticalPlan {
    tactics;
    description;
    constructor(tactics, description) {
        this.tactics = tactics;
        this.description = description;
    }
    /**
     * Execute this tactical plan.
     */
    async execute(context) {
        if (this.tactics.length === 0) {
            throw new Error('No tactics in this plan');
        }
        core.info(`🎯 Executing tactical plan with ${this.tactics.length} tactics`);
        if (this.description) {
            core.debug(`📋 Plan: ${this.description}`);
        }
        for (const tactic of this.tactics) {
            core.debug(`🎯 Executing tactic: ${tactic.name}`);
            // Assess if this tactic is applicable
            if (!tactic.assess(context)) {
                core.debug(`⏭️ ${tactic.name}: Not applicable to this context`);
                continue;
            }
            try {
                const result = await tactic.attempt(context);
                // Update context with any new information
                if (result.context && typeof context === 'object' && context !== null) {
                    Object.assign(context, result.context);
                }
                if (result.applied && result.success && result.result) {
                    core.info(`✅ ${tactic.name}: ${result.message || 'Success'}`);
                    return result.result;
                }
                else if (result.applied && !result.success) {
                    core.debug(`❌ ${tactic.name}: ${result.message || 'Failed'}`);
                }
                else {
                    core.debug(`⏭️ ${tactic.name}: ${result.message || 'Not applied'}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                core.debug(`❌ ${tactic.name}: Error - ${errorMessage}`);
                // Continue to next tactic on error
            }
        }
        throw new Error(`All ${this.tactics.length} tactics in plan exhausted`);
    }
}
exports.TacticalPlan = TacticalPlan;
//# sourceMappingURL=TacticalPlan.js.map