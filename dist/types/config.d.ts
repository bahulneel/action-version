/**
 * Application configuration interface.
 * Represents the complete configuration state for the action.
 * Maps directly to action.yml inputs plus derived values.
 */
export interface Config {
    readonly commitMsgTemplate: string;
    readonly depCommitMsgTemplate: string;
    readonly commitFormat: 'template' | 'conventional';
    readonly shouldCreateBranch: boolean;
    readonly branchTemplate: string;
    readonly branchCleanup: 'keep' | 'prune' | 'semantic';
    readonly baseBranch: string | undefined;
    readonly bumpStrategy: 'do-nothing' | 'apply-bump' | 'pre-release';
    readonly activeBranch: string;
    readonly tagPrereleases: boolean;
    readonly mergebaseLookbackCommits?: number;
    readonly lastversioncommitMaxCount?: number;
    readonly templateRegex: RegExp;
}
/**
 * Configuration adapter interface.
 * Abstracts configuration reading from specific sources.
 */
export interface ConfigAdapter {
    readString(key: string): string | undefined;
    readBoolean(key: string): boolean;
    readNumber(key: string): number | undefined;
}
//# sourceMappingURL=config.d.ts.map