import * as core from '@actions/core';
import * as semver from 'semver';
import type { BumpType } from '../../types/index.js';
import { BaseVersionBumpStrategy } from './base.js';

/**
 * Pre-release strategy that creates or increments prerelease versions.
 * Handles the complex logic of transitioning between regular and prerelease versions.
 */
export class PreReleaseStrategy extends BaseVersionBumpStrategy {
  constructor() {
    super('pre-release');
  }

  public execute(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    _historicalBump: BumpType | null
  ): string | null {
    if (!commitBasedBump || !['major', 'minor', 'patch'].includes(commitBasedBump)) {
      core.debug(`Strategy 'pre-release': No valid bump type provided: ${commitBasedBump}`);
      return null;
    }

    const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0';
    
    if (semver.prerelease(current)) {
      // Already a prerelease version, increment the prerelease number
      const nextVersion = semver.inc(current, 'prerelease');
      if (!nextVersion) {
        core.warning(`Strategy 'pre-release': Failed to increment prerelease ${current}`);
        return null;
      }
      
      core.debug(`Strategy 'pre-release': Increment prerelease ${current} → ${nextVersion}`);
      return nextVersion; // 1.2.0-1 → 1.2.0-2
    } else {
      // First time: apply bump then make prerelease
      const bumped = semver.inc(current, commitBasedBump);
      if (!bumped) {
        core.warning(`Strategy 'pre-release': Failed to bump ${current} with ${commitBasedBump}`);
        return null;
      }
      
      const nextVersion = semver.inc(bumped, 'prerelease', '0');
      if (!nextVersion) {
        core.warning(`Strategy 'pre-release': Failed to create prerelease from ${bumped}`);
        return null;
      }
      
      core.debug(`Strategy 'pre-release': First prerelease ${current} → ${bumped} → ${nextVersion}`);
      return nextVersion; // 1.1.0 → 1.2.0 → 1.2.0-0
    }
  }
}