import type { Tactic, TacticResult, GitSetupResult, GitSetupContext } from '../../../types/index.js';
export declare class SetupGitTactic implements Tactic<GitSetupResult, GitSetupContext> {
    readonly name = "SetupGit";
    assess(context: GitSetupContext): boolean;
    attempt(context: GitSetupContext): Promise<TacticResult<GitSetupResult, GitSetupContext>>;
}
//# sourceMappingURL=SetupGit.d.ts.map