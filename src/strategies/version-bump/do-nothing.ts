import * as core from '@actions/core';
import type { BumpType } from '../../types/index.js';
import { BaseVersionBumpStrategy } from './base.js';

/**
 * Do-nothing strategy that skips version bumps when the same bump type is detected.
 * This is useful when you want to prevent duplicate version bumps.
 */
export class DoNothingStrategy extends BaseVersionBumpStrategy {
  constructor() {
    super('do-nothing');
  }

  public execute(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    historicalBump: BumpType | null
  ): string | null {
    core.debug(`Strategy 'do-nothing': Skipping bump for ${currentVersion}`);
    return null; // Explicitly return null to indicate no change
  }
}