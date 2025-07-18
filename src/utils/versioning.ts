import * as core from '@actions/core';
import * as semver from 'semver';
import type { BumpType, StrategyName } from '../types/index.js';
import { VersionBumpStrategyFactory } from '../strategies/version-bump/factory.js';
import { calculateBumpType } from './version.js';

/**
 * Get the next version based on current version, bump types, and strategy.
 */
export function getNextVersion(
  currentVersion: string,
  commitBasedBump: BumpType | null,
  historicalBump: BumpType | null,
  strategyName: StrategyName = 'do-nothing'
): string | null {
  const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0';

  // Validate inputs
  if (commitBasedBump && !['major', 'minor', 'patch'].includes(commitBasedBump)) {
    throw new Error(`Invalid commitBasedBump: ${commitBasedBump}`);
  }

  if (commitBasedBump === historicalBump) {
    // Same bump type - use configured strategy
    core.debug(`Same bump type detected (${commitBasedBump}), using strategy: ${strategyName}`);

    const strategy = VersionBumpStrategyFactory.getStrategy(strategyName);
    const nextVersion = strategy.execute(currentVersion, commitBasedBump, historicalBump);

    // Handle do-nothing strategy return value
    if (nextVersion === null && strategyName === 'do-nothing') {
      return null; // Skip bump
    }

    return nextVersion;
  } else if (commitBasedBump) {
    // Different bump type - normal semver bump (always apply)
    const nextVersion = semver.inc(current, commitBasedBump);
    core.debug(`Different bump type: ${current} → ${nextVersion} (${commitBasedBump})`);
    return nextVersion;
  }

  return null; // No bump needed
}

/**
 * Validate version string using semver.
 */
export function validateVersion(version: string): boolean {
  return semver.valid(version) !== null;
}

/**
 * Compare two versions and return the relationship.
 */
export function compareVersions(version1: string, version2: string): -1 | 0 | 1 {
  return semver.compare(version1, version2) as -1 | 0 | 1;
}

/**
 * Check if a version satisfies a range specification.
 */
export function satisfiesRange(version: string, range: string): boolean {
  return semver.satisfies(version, range);
}

/**
 * Get the major, minor, and patch components of a version.
 */
export function parseVersionComponents(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease: readonly string[];
} | null {
  const parsed = semver.parse(version);
  if (!parsed) return null;

  return {
    major: parsed.major,
    minor: parsed.minor,
    patch: parsed.patch,
    prerelease: parsed.prerelease,
  };
}

/**
 * Create a clean version string from any input.
 */
export function cleanVersion(version: string): string {
  return semver.clean(version) ?? '0.0.0';
}

/**
 * Check if a version is a prerelease.
 */
export function isPrerelease(version: string): boolean {
  const parsed = semver.parse(version);
  return Boolean(parsed?.prerelease.length);
}

/**
 * Get the release version from a prerelease version.
 */
export function getReleaseVersion(version: string): string {
  const parsed = semver.parse(version);
  if (!parsed) return version;
  
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}