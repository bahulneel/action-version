import type { VcsGoals, VcsConfig, BumpType, GitSetupResult, GitSetupContext, StrategyOf } from '@types';
/**
 * Git VCS strategy.
 * Implements version control operations using Git.
 */
export declare class Git implements StrategyOf<VcsGoals> {
    readonly name = "git";
    readonly description = "Git-backed VCS strategy";
    private readonly git;
    constructor(_config: VcsConfig);
    setup(context: GitSetupContext): Promise<GitSetupResult>;
    commitVersionChange(packageDir: string, packageName: string, version: string, bumpType: BumpType, template: string): Promise<void>;
    commitDependencyUpdate(packageDir: string, packageName: string, depName: string, depVersion: string, template: string): Promise<void>;
    tagVersion(version: string, _isPrerelease: boolean, shouldTag: boolean): Promise<void>;
    prepareVersionBranch(versionedBranch: string, tempRef?: string): Promise<void>;
}
//# sourceMappingURL=Git.d.ts.map