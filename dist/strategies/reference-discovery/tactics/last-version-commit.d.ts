import type { Tactic, TacticResult } from '../../../types/tactics.js';
import type { ReferencePointResult } from '../../../types/index.js';
import type { ReferenceDiscoveryContext } from './types.js';
/**
 * LastVersionCommitTactic - Finds the last commit that changed the version field in package.json.
 *
 * This tactic is highly reliable because:
 * - It directly finds the last release point
 * - Works regardless of branch structure
 * - Independent of merge-base issues
 * - Can work across force-pushes and branch recreations
 */
export declare class LastVersionCommitTactic implements Tactic<ReferencePointResult, ReferenceDiscoveryContext> {
    get name(): string;
    assess(_context: ReferenceDiscoveryContext): boolean;
    attempt(context: ReferenceDiscoveryContext): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>>;
    private findLastVersionChangeCommit;
    private getVersionAtCommit;
}
//# sourceMappingURL=last-version-commit.d.ts.map