import type { Tactic, TacticResult } from '../../../types/tactics.js';
import type { ReferencePointResult } from '../../../types/index.js';
import type { ReferenceDiscoveryContext } from './types.js';
/**
 * DiffBasedVersionCommitTactic - Traditional approach to finding version changes.
 *
 * This tactic uses git log to find commits that touched package.json,
 * then checks each commit's diff to see if it changed the version field.
 * It's more thorough but slower than the -L approach.
 */
export declare class DiffBasedVersionCommitTactic implements Tactic<ReferencePointResult, ReferenceDiscoveryContext> {
    get name(): string;
    assess(_context: ReferenceDiscoveryContext): boolean;
    attempt(context: ReferenceDiscoveryContext): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>>;
    private getVersionAtCommit;
}
//# sourceMappingURL=diff-based-version-commit.d.ts.map