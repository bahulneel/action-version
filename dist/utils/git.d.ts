import type { CommitInfo, GitSetupResult } from '../types/index.js';
/**
 * Setup git configuration and checkout appropriate branch.
 */
export declare function setupGit(shouldCreateBranch: boolean, branchTemplate: string): Promise<GitSetupResult>;
/**
 * Get commits affecting a specific directory since a reference point.
 */
export declare function getCommitsAffecting(dir: string, sinceRef: string): Promise<CommitInfo[]>;
/**
 * Push changes to remote repository.
 */
export declare function pushChanges(branch?: string): Promise<void>;
/**
 * Get git branch information.
 */
export declare function getBranches(): Promise<import("simple-git").BranchSummary>;
/**
 * Delete a local branch safely.
 */
export declare function deleteLocalBranch(branchName: string, force?: boolean): Promise<void>;
//# sourceMappingURL=git.d.ts.map