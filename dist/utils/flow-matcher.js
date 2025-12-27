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
exports.matchPattern = matchPattern;
exports.matchesPatternWithExclusions = matchesPatternWithExclusions;
exports.matchFlow = matchFlow;
const core = __importStar(require("@actions/core"));
/**
 * Match a branch name against a pattern (supports globs and wildcards).
 */
function matchPattern(pattern, branchName) {
    // Exact match
    if (pattern === branchName) {
        return true;
    }
    // Wildcard match
    if (pattern === '*') {
        return true;
    }
    // Glob pattern matching (simple implementation)
    // Convert glob pattern to regex
    const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        .replace(/\*/g, '.*') // Convert * to .*
        .replace(/\?/g, '.'); // Convert ? to .
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(branchName);
}
/**
 * Check if a branch matches a pattern, excluding any excluded patterns.
 */
function matchesPatternWithExclusions(pattern, branchName, exclusions) {
    // First check if branch matches the pattern
    if (!matchPattern(pattern, branchName)) {
        return false;
    }
    // Then check if branch is excluded
    if (exclusions) {
        for (const exclusion of exclusions) {
            if (matchPattern(exclusion, branchName)) {
                return false; // Branch matches exclusion pattern
            }
        }
    }
    return true;
}
/**
 * Score a flow match (higher = more specific match).
 * Used to determine the best matching flow when multiple flows match.
 */
function scoreFlowMatch(flow, context) {
    let score = 0;
    // Exact branch name match is better than pattern match
    if (flow.from === context.currentBranch) {
        score += 100;
    }
    else if (flow.from.includes('*')) {
        score += 10; // Pattern match
    }
    else {
        score += 50; // Specific pattern (like 'release/*')
    }
    // Flows with versioning specified are more specific
    if (flow.versioning) {
        score += 20;
    }
    // Flows with base specified are more specific
    if (flow.base) {
        score += 10;
    }
    return score;
}
/**
 * Match current GitHub context to the best flow.
 * Returns the most specific matching flow, or null if no flow matches.
 */
function matchFlow(flows, context) {
    const matchingFlows = [];
    for (const flow of flows) {
        // Check if current branch matches the 'from' pattern (with exclusions)
        if (matchesPatternWithExclusions(flow.from, context.currentBranch, flow['from-exclude'])) {
            // Check triggered status if specified
            if (flow.triggered !== undefined) {
                // If triggered is true, only match on explicit triggers (for now, we match all)
                // In the future, this could check event type
                // For now, if triggered is specified, we still match (triggered check happens elsewhere)
            }
            const score = scoreFlowMatch(flow, context);
            matchingFlows.push({ flow, score });
        }
    }
    if (matchingFlows.length === 0) {
        core.debug(`No matching flows found for branch: ${context.currentBranch}`);
        return null;
    }
    // Sort by score (highest first) and return the best match
    matchingFlows.sort((a, b) => b.score - a.score);
    const bestMatch = matchingFlows[0]?.flow;
    if (!bestMatch) {
        return null;
    }
    core.debug(`Matched flow: ${bestMatch.name} (score: ${matchingFlows[0].score}, from: ${bestMatch.from}, to: ${bestMatch.to})`);
    return bestMatch;
}
//# sourceMappingURL=flow-matcher.js.map