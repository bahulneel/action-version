import * as core from '@actions/core';
import * as semver from 'semver';
import type { BumpType } from '../../types/index.js';
import { BaseVersionBumpStrategy } from './base.js';

/**
 * Apply-bump strategy that performs normal semantic version increments.
 * This strategy will always apply the commit-based bump type.
 */
export class ApplyBumpStrategy extends BaseVersionBumpStrategy {
  constructor() {
    super('apply-bump');
  }

  public execute(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    historicalBump: BumpType | null
  ): string | null {
    if (!commitBasedBump || !['major', 'minor', 'patch'].includes(commitBasedBump)) {
      core.debug(`Strategy 'apply-bump': No valid bump type provided: ${commitBasedBump}`);
      return null;
    }

    const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0';
    const nextVersion = semver.inc(current, commitBasedBump);
    
    if (!nextVersion) {
      core.warning(`Strategy 'apply-bump': Failed to increment version ${current} with ${commitBasedBump}`);
      return null;
    }

    core.debug(`Strategy 'apply-bump': Normal semver bump ${current} → ${nextVersion}`);
    return nextVersion;
  }
}