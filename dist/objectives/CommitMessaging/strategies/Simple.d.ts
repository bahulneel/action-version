import type { CommitMessagingGoals, CommitMessagingConfig, CommitInfo, FormatVersionContext, FormatDependencyContext, StrategyOf } from '@types';
/**
 * Simple commit messaging strategy.
 * Uses basic formatting without conventional commit requirements.
 */
export declare class Simple implements StrategyOf<CommitMessagingGoals> {
    readonly name = "simple";
    readonly description = "Simple commit format";
    constructor(_config: CommitMessagingConfig);
    parseCommits(logEntries: unknown[], sinceRef?: string): Promise<CommitInfo[]>;
    formatVersion(context: FormatVersionContext): Promise<string>;
    formatDependency(context: FormatDependencyContext): Promise<string>;
}
//# sourceMappingURL=Simple.d.ts.map