import type { Flow } from '../types/versioning-config.js';
/**
 * GitHub event context for flow matching.
 */
export interface GitHubContext {
    /** Current branch name (from GITHUB_REF) */
    currentBranch: string;
    /** GitHub event type (push, pull_request, etc.) */
    eventType?: string | undefined;
    /** Target branch (for PR events) */
    targetBranch?: string | undefined;
}
/**
 * Match a branch name against a pattern (supports globs and wildcards).
 */
export declare function matchPattern(pattern: string, branchName: string): boolean;
/**
 * Check if a branch matches a pattern, excluding any excluded patterns.
 */
export declare function matchesPatternWithExclusions(pattern: string, branchName: string, exclusions?: string[]): boolean;
/**
 * Match current GitHub context to the best flow.
 * Returns the most specific matching flow, or null if no flow matches.
 */
export declare function matchFlow(flows: Flow[], context: GitHubContext): Flow | null;
//# sourceMappingURL=flow-matcher.d.ts.map