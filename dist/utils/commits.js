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
exports.parseCommits = parseCommits;
exports.getMostSignificantBump = getMostSignificantBump;
exports.categorizeCommits = categorizeCommits;
exports.summarizeCommits = summarizeCommits;
const core = __importStar(require("@actions/core"));
const conventional_commits_parser_1 = __importDefault(require("conventional-commits-parser"));
/**
 * Parse conventional commits from git log entries.
 */
function parseCommits(logEntries, sinceRef) {
    const commits = [];
    for (const entry of logEntries) {
        const messageHeader = entry.message.split('\n')[0];
        if (sinceRef && entry.hash === sinceRef) {
            core.debug(`Skipping commit ${entry.hash} because it is the same as the sinceRef: ${messageHeader}`);
            continue;
        }
        core.debug(`Parsing commit ${entry.hash}: ${messageHeader}`);
        const parsed = conventional_commits_parser_1.default.sync(entry.message);
        const breaking = Boolean((parsed.notes && parsed.notes.find(n => n.title === 'BREAKING CHANGE')) ||
            (typeof parsed.header === 'string' && /!:/.test(parsed.header)));
        commits.push({
            type: parsed.type,
            scope: parsed.scope,
            subject: parsed.subject,
            breaking,
            header: parsed.header,
        });
    }
    return commits;
}
/**
 * Get the most significant bump type from a list of commits.
 */
function getMostSignificantBump(commits) {
    let bump = 'patch';
    for (const commit of commits) {
        if (commit.breaking) {
            return 'major'; // Breaking changes always result in major
        }
        if (commit.type === 'feat' && bump !== 'major') {
            bump = 'minor';
        }
    }
    return commits.length > 0 ? bump : null;
}
/**
 * Categorize commits by their type.
 */
function categorizeCommits(commits) {
    return {
        breaking: commits.filter(c => c.breaking),
        features: commits.filter(c => c.type === 'feat' && !c.breaking),
        fixes: commits.filter(c => c.type === 'fix' && !c.breaking),
        other: commits.filter(c => !c.breaking && c.type !== 'feat' && c.type !== 'fix'),
    };
}
/**
 * Generate a summary of commit changes for logging.
 */
function summarizeCommits(commits) {
    const categories = categorizeCommits(commits);
    const parts = [];
    if (categories.breaking.length > 0) {
        parts.push(`${categories.breaking.length} breaking`);
    }
    if (categories.features.length > 0) {
        parts.push(`${categories.features.length} features`);
    }
    if (categories.fixes.length > 0) {
        parts.push(`${categories.fixes.length} fixes`);
    }
    if (categories.other.length > 0) {
        parts.push(`${categories.other.length} other`);
    }
    return parts.join(', ') || 'no changes';
}
//# sourceMappingURL=commits.js.map