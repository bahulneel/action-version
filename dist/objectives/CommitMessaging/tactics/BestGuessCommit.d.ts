import type { Tactic, TacticResult, CommitInfo, CommitParsingContext } from '@types';
/**
 * BestGuessCommitTactic - Parse commits using heuristics when conventional format fails.
 */
export declare class BestGuessCommitTactic implements Tactic<CommitInfo[], CommitParsingContext> {
    readonly name = "BestGuessCommit";
    assess(context: CommitParsingContext): boolean;
    attempt(context: CommitParsingContext): Promise<TacticResult<CommitInfo[], CommitParsingContext>>;
}
//# sourceMappingURL=BestGuessCommit.d.ts.map