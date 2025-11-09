import type { CommitMessagingGoals, CommitMessagingConfig, CommitInfo, FormatVersionContext, FormatDependencyContext, StrategyOf } from '@types';
/**
 * Conventional commit messaging strategy.
 * Uses conventional commit format for parsing and formatting.
 */
export declare class Conventional implements StrategyOf<CommitMessagingGoals> {
    readonly name = "conventional";
    readonly description = "Conventional commit format";
    constructor(_config: CommitMessagingConfig);
    parseCommits(logEntries: unknown[], sinceRef?: string): Promise<CommitInfo[]>;
    formatVersion(context: FormatVersionContext): Promise<string>;
    formatDependency(context: FormatDependencyContext): Promise<string>;
}
//# sourceMappingURL=Conventional.d.ts.map