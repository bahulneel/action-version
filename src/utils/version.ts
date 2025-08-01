import * as semver from 'semver';
import type { BumpType } from '../types/index.js';

/**
 * Guess the bump type based on version string patterns.
 * @param version - The version string to analyze
 * @returns The guessed bump type
 */
export function guessBumpType(version: string): BumpType {
  if (version.endsWith('.0.0')) {
    return 'major';
  }
  if (version.endsWith('.0')) {
    return 'minor';
  }
  return 'patch';
}

/**
 * Initialize a version if it's missing or invalid.
 * @param version - The version to initialize
 * @returns A valid version string
 */
export function initializeVersion(version: string | undefined): string {
  return semver.coerce(version)?.toString() ?? '0.0.0';
}

/**
 * Calculate the bump type between two versions.
 * @param fromVersion - The starting version
 * @param toVersion - The target version
 * @returns The bump type or null if no change
 */
export function calculateBumpType(fromVersion: string, toVersion: string): BumpType | null {
  const from = semver.coerce(fromVersion)?.toString() ?? '0.0.0';
  const to = semver.coerce(toVersion)?.toString() ?? '0.0.0';
  const diff = semver.diff(from, to);
  
  if (!diff) {
    return null;
  }
  
  // Map semver.diff results to our BumpType
  switch (diff) {
    case 'major':
    case 'minor':
    case 'patch':
      return diff;
    case 'prerelease':
    case 'prepatch':
    case 'preminor':
    case 'premajor':
      return 'prerelease';
    default:
      return null;
  }
}

/**
 * Finalize a prerelease version by removing the prerelease suffix.
 * @param version - The prerelease version to finalize
 * @returns The finalized version
 */
export function finalizeVersion(version: string): string {
  const current = semver.coerce(version)?.toString() ?? '0.0.0';
  
  if (semver.prerelease(current)) {
    const parsed = semver.parse(current);
    if (parsed) {
      return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    }
  }
  
  return current;
}

/**
 * Get the priority of a bump type for comparison.
 * @param bumpType - The bump type to get priority for
 * @returns Numeric priority (higher = more significant)
 */
export function bumpPriority(bumpType: BumpType | null): number {
  switch (bumpType) {
    case 'major':
      return 3;
    case 'minor':
      return 2;
    case 'patch':
      return 1;
    case 'prerelease':
    case 'release':
      return 0;
    case null:
      return -1;
    default:
      return -1;
  }
}

/**
 * Get the most significant bump type from an array of bump types.
 * @param bumpTypes - Array of bump types to compare
 * @returns The most significant bump type
 */
export function getMostSignificantBumpType(bumpTypes: readonly (BumpType | null)[]): BumpType | null {
  return bumpTypes.reduce((most, current) => {
    return bumpPriority(current) > bumpPriority(most) ? current : most;
  }, null);
}