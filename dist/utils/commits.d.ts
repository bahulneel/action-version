import type { CommitInfo, BumpType } from '../types/index.js';
/**
 * Parse conventional commits from git log entries.
 */
export declare function parseCommits(logEntries: any[], sinceRef?: string): CommitInfo[];
/**
 * Get the most significant bump type from a list of commits.
 */
export declare function getMostSignificantBump(commits: readonly CommitInfo[]): BumpType | null;
/**
 * Categorize commits by their type.
 */
export declare function categorizeCommits(commits: readonly CommitInfo[]): {
    breaking: CommitInfo[];
    features: CommitInfo[];
    fixes: CommitInfo[];
    other: CommitInfo[];
};
/**
 * Generate a summary of commit changes for logging.
 */
export declare function summarizeCommits(commits: readonly CommitInfo[]): string;
//# sourceMappingURL=commits.d.ts.map