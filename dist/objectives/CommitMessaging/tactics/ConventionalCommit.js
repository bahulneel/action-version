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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConventionalCommitTactic = void 0;
const core = __importStar(require("@actions/core"));
const conventional_commits_parser_1 = __importDefault(require("conventional-commits-parser"));
/**
 * ConventionalCommitTactic - Parse commits using conventional commit format.
 */
class ConventionalCommitTactic {
    name = 'ConventionalCommit';
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
                core.debug(`Parsing commit ${entryAny.hash}: ${messageHeader}`);
                const parsed = conventional_commits_parser_1.default.sync(entryAny.message);
                // Only process if it's a valid conventional commit
                if (parsed.type) {
                    const breaking = Boolean((parsed.notes && parsed.notes.find((n) => n.title === 'BREAKING CHANGE')) ||
                        (typeof parsed.header === 'string' && /!:/.test(parsed.header)));
                    commits.push({
                        type: parsed.type,
                        scope: parsed.scope || null,
                        subject: parsed.subject || null,
                        breaking,
                        header: parsed.header,
                    });
                }
            }
            if (commits.length > 0) {
                return {
                    applied: true,
                    success: true,
                    result: commits,
                    message: `Parsed ${commits.length} conventional commits`,
                };
            }
            else {
                return {
                    applied: true,
                    success: false,
                    message: 'No valid conventional commits found',
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Conventional commit parsing failed: ${errorMessage}`,
            };
        }
    }
}
exports.ConventionalCommitTactic = ConventionalCommitTactic;
//# sourceMappingURL=ConventionalCommit.js.map