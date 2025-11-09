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
exports.OneManeuver = void 0;
const core = __importStar(require("@actions/core"));
const Abstract_js_1 = require("./Abstract.js");
/**
 * One maneuver: runs tactics in sequence, returns on first success.
 * If a tactic fails, tries the next one (fallback behavior).
 */
class OneManeuver extends Abstract_js_1.AbstractManeuver {
    /**
     * Execute tactics in sequence until one succeeds.
     */
    async execute(context) {
        if (this.tactics.length === 0) {
            return {
                success: false,
                message: `Maneuver '${this.name}': No tactics provided`,
            };
        }
        core.info(`🎯 Executing maneuver '${this.name}' (one) with ${this.tactics.length} tactics`);
        if (this.description) {
            core.debug(`📋 ${this.description}`);
        }
        const tacticResults = [];
        for (const tactic of this.tactics) {
            core.debug(`🎯 Trying tactic: ${tactic.name}`);
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
                return {
                    success: true,
                    result: result.result,
                    ...(result.context !== undefined && { context: result.context }),
                    ...(result.message !== undefined && { message: result.message }),
                    tacticResults,
                };
            }
            else if (result.applied && !result.success) {
                core.debug(`❌ ${tactic.name}: ${result.message || 'Failed'} - trying next`);
            }
            else {
                core.debug(`⏭️ ${tactic.name}: ${result.message || 'Not applied'}`);
            }
        }
        return {
            success: false,
            message: `Maneuver '${this.name}': All ${this.tactics.length} tactics exhausted`,
            tacticResults,
        };
    }
}
exports.OneManeuver = OneManeuver;
//# sourceMappingURL=One.js.map