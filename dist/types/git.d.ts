/**
 * Git adapter interface and related types.
 * Provides abstraction over git operations.
 */
export interface GitBranches {
    readonly all: readonly string[];
    readonly current: string;
}
export interface GitSetupContext {
    shouldCreateBranch: boolean;
    branchTemplate: string;
}
export interface GitSetupResult {
    readonly tempRef?: string;
    readonly branchTemplate?: string;
}
/**
 * Git adapter interface.
 * Abstracts git operations from specific implementations.
 */
export interface Git {
    branch(options: string[]): Promise<GitBranches>;
    checkout(ref: string | string[]): Promise<void>;
    deleteLocalBranch(branchName: string, force?: boolean): Promise<void>;
    add(file: string): Promise<void>;
    commit(message: string): Promise<void>;
    tag(options: string[]): Promise<void>;
    addTag(tagName: string): Promise<void>;
    pushTags(): Promise<void>;
    tags(options?: string[]): Promise<{
        latest: string | null;
    }>;
    revparse(refs: string[]): Promise<string>;
    raw(command: string, ...args: string[]): Promise<void>;
    push(remote?: string, branch?: string, options?: string[]): Promise<void>;
    fetch(options: string[]): Promise<void>;
    log(options: string[]): Promise<{
        all: any[];
    }>;
    diff(options: string[]): Promise<string>;
    addConfig(key: string, value: string): Promise<void>;
}
//# sourceMappingURL=git.d.ts.map