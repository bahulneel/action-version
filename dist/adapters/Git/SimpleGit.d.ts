import type { Git, GitBranches } from '../../types/index.js';
/**
 * SimpleGit adapter implementation.
 * Wraps the simple-git library to implement the Git interface.
 */
export declare class SimpleGit implements Git {
    private readonly git;
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
//# sourceMappingURL=SimpleGit.d.ts.map