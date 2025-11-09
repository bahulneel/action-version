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
exports.BestGuessCommitTactic = void 0;
const core = __importStar(require("@actions/core"));
/**
 * BestGuessCommitTactic - Parse commits using heuristics when conventional format fails.
 */
class BestGuessCommitTactic {
    name = 'BestGuessCommit';
    assess(context) {
        return context.logEntries && context.logEntries.length > 0;
    }
    async attempt(context) {
        try {
            const commits = [];
            for (const entry of context.logEntries) {
                const entryAny = entry;
                const messageHeader = entryAny.message.split('\n')[0];
                if (context.sinceRef && entryAny.hash === context.sinceRef) {
                    core.debug(`Skipping commit ${entryAny.hash} because it is the same as the sinceRef: ${messageHeader}`);
                    continue;
                }
                core.debug(`Best guess parsing commit ${entryAny.hash}: ${messageHeader}`);
                // Heuristic parsing
                const breaking = /breaking|break/i.test(entryAny.message) ||
                    /!:/.test(messageHeader) ||
                    /major/i.test(messageHeader);
                let type = null;
                let scope = null;
                let subject = messageHeader;
                // Try to extract type and scope from common patterns
                const typeMatch = messageHeader.match(/^(\w+)(\([^)]+\))?:\s*(.+)/);
                if (typeMatch) {
                    type = typeMatch[1] ?? null;
                    scope = typeMatch[2] ? typeMatch[2].slice(1, -1) : null;
                    subject = typeMatch[3] ?? messageHeader;
                }
                else {
                    // Guess type from keywords
                    if (/fix|bug|patch/i.test(messageHeader)) {
                        type = 'fix';
                    }
                    else if (/feat|feature|add/i.test(messageHeader)) {
                        type = 'feat';
                    }
                    else if (/chore|refactor|docs|style|test/i.test(messageHeader)) {
                        type = 'chore';
                    }
                }
                commits.push({
                    type,
                    scope,
                    subject,
                    breaking,
                    header: messageHeader,
                });
            }
            return {
                applied: true,
                success: true,
                result: commits,
                message: `Best guess parsed ${commits.length} commits`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Best guess commit parsing failed: ${errorMessage}`,
            };
        }
    }
}
exports.BestGuessCommitTactic = BestGuessCommitTactic;
//# sourceMappingURL=BestGuessCommit.js.map