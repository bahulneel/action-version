import { ExecutePlanTactic } from './ExecutePlan.js'
import { LastVersionCommitTactic } from './LastVersionCommit.js'
import { DiffBasedVersionCommitTactic } from './DiffBasedVersionCommit.js'
import { TacticalPlan } from '../../../tactics/TacticalPlan.js'
import type { ReferencePointResult } from '../../../../types/index.js'
import type { ReferenceDiscoveryContext } from './types.js'

/**
 * Version commit tactic that extends ExecutePlan.
 * Composes LastVersionCommit and DiffBasedVersionCommit tactics.
 */
export class VersionCommitTactic extends ExecutePlanTactic {
  constructor() {
    const plan = new TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext>(
      [new LastVersionCommitTactic(), new DiffBasedVersionCommitTactic()],
      'Composed version commit discovery: LastVersionCommit -> DiffBasedVersionCommit'
    )

    super(plan, 'VersionCommit')
  }
}
