import type { BumpType, CommitInfo } from '../index.js';
/**
 * Goals for commit messaging objective.
 */
export interface CommitMessagingGoals {
    parseCommits(logEntries: unknown[], sinceRef?: string): Promise<CommitInfo[]>;
    formatVersion(context: FormatVersionContext): Promise<string>;
    formatDependency(context: FormatDependencyContext): Promise<string>;
}
/**
 * Context for parsing commit messages.
 */
export interface CommitParsingContext {
    logEntries: unknown[];
    sinceRef?: string;
}
/**
 * Context for formatting version commit messages.
 */
export interface FormatVersionContext {
    packageName: string;
    version: string;
    bumpType: BumpType;
}
/**
 * Context for formatting dependency commit messages.
 */
export interface FormatDependencyContext {
    packageName: string;
    depName: string;
    depVersion: string;
}
/**
 * Configuration for commit messaging strategy selection.
 */
export interface CommitMessagingConfig {
    readonly kind: 'conventional' | 'simple';
}
//# sourceMappingURL=commit.d.ts.map