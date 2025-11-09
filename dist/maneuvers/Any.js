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
exports.AnyManeuver = void 0;
const core = __importStar(require("@actions/core"));
const Abstract_js_1 = require("./Abstract.js");
/**
 * Any maneuver: runs first matching (assessed) tactic.
 * Does not retry on failure - uses assessment to choose the right tactic upfront.
 */
class AnyManeuver extends Abstract_js_1.AbstractManeuver {
    /**
     * Execute the first tactic that assesses as applicable.
     */
    async execute(context) {
        if (this.tactics.length === 0) {
            return {
                success: false,
                message: `Maneuver '${this.name}': No tactics provided`,
            };
        }
        core.info(`🎯 Executing maneuver '${this.name}' (any) with ${this.tactics.length} tactics`);
        if (this.description) {
            core.debug(`📋 ${this.description}`);
        }
        const tacticResults = [];
        for (const tactic of this.tactics) {
            core.debug(`🎯 Assessing tactic: ${tactic.name}`);
            const result = await this.executeTactic(tactic, context);
            const tacticResultEntry = {
                tacticName: tactic.name,
                success: result.success,
                ...(result.result !== undefined && { result: result.result }),
                ...(result.message !== undefined && { message: result.message }),
            };
            tacticResults.push(tacticResultEntry);
            if (result.applied) {
                if (result.success && result.result) {
                    core.info(`✅ ${tactic.name}: ${result.message || 'Success'}`);
                    return {
                        success: true,
                        result: result.result,
                        ...(result.context !== undefined && { context: result.context }),
                        ...(result.message !== undefined && { message: result.message }),
                        tacticResults,
                    };
                }
                else {
                    return {
                        success: false,
                        message: `Maneuver '${this.name}': Tactic '${tactic.name}' failed: ${result.message}`,
                        tacticResults,
                    };
                }
            }
        }
        return {
            success: false,
            message: `Maneuver '${this.name}': No applicable tactics found`,
            tacticResults,
        };
    }
}
exports.AnyManeuver = AnyManeuver;
//# sourceMappingURL=Any.js.map