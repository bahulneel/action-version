import type { Tactic, TacticResult, ReferencePointResult, ReferenceDiscoveryContext } from '../../../types/index.js';
export declare class HighestVersionTagTactic implements Tactic<ReferencePointResult, ReferenceDiscoveryContext> {
    readonly name = "HighestVersionTag";
    assess(_context: ReferenceDiscoveryContext): boolean;
    attempt(_context: ReferenceDiscoveryContext): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>>;
}
//# sourceMappingURL=HighestVersionTag.d.ts.map