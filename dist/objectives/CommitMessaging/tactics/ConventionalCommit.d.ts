import type { Tactic, TacticResult, CommitInfo, CommitParsingContext } from '@types';
/**
 * ConventionalCommitTactic - Parse commits using conventional commit format.
 */
export declare class ConventionalCommitTactic implements Tactic<CommitInfo[], CommitParsingContext> {
    readonly name = "ConventionalCommit";
    assess(context: CommitParsingContext): boolean;
    attempt(context: CommitParsingContext): Promise<TacticResult<CommitInfo[], CommitParsingContext>>;
}
//# sourceMappingURL=ConventionalCommit.d.ts.map