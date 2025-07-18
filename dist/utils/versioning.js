"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextVersion = getNextVersion;
exports.validateVersion = validateVersion;
exports.compareVersions = compareVersions;
exports.satisfiesRange = satisfiesRange;
exports.parseVersionComponents = parseVersionComponents;
exports.cleanVersion = cleanVersion;
exports.isPrerelease = isPrerelease;
exports.getReleaseVersion = getReleaseVersion;
const core = __importStar(require("@actions/core"));
const semver = __importStar(require("semver"));
const factory_js_1 = require("../strategies/version-bump/factory.js");
/**
 * Get the next version based on current version, bump types, and strategy.
 */
function getNextVersion(currentVersion, commitBasedBump, historicalBump, strategyName = 'do-nothing') {
    const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0';
    // Validate inputs
    if (commitBasedBump && !['major', 'minor', 'patch'].includes(commitBasedBump)) {
        throw new Error(`Invalid commitBasedBump: ${commitBasedBump}`);
    }
    if (commitBasedBump === historicalBump) {
        // Same bump type - use configured strategy
        core.debug(`Same bump type detected (${commitBasedBump}), using strategy: ${strategyName}`);
        const strategy = factory_js_1.VersionBumpStrategyFactory.getStrategy(strategyName);
        const nextVersion = strategy.execute(currentVersion, commitBasedBump, historicalBump);
        // Handle do-nothing strategy return value
        if (nextVersion === null && strategyName === 'do-nothing') {
            return null; // Skip bump
        }
        return nextVersion;
    }
    else if (commitBasedBump) {
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
function validateVersion(version) {
    return semver.valid(version) !== null;
}
/**
 * Compare two versions and return the relationship.
 */
function compareVersions(version1, version2) {
    return semver.compare(version1, version2);
}
/**
 * Check if a version satisfies a range specification.
 */
function satisfiesRange(version, range) {
    return semver.satisfies(version, range);
}
/**
 * Get the major, minor, and patch components of a version.
 */
function parseVersionComponents(version) {
    const parsed = semver.parse(version);
    if (!parsed)
        return null;
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
function cleanVersion(version) {
    return semver.clean(version) ?? '0.0.0';
}
/**
 * Check if a version is a prerelease.
 */
function isPrerelease(version) {
    const parsed = semver.parse(version);
    return Boolean(parsed?.prerelease.length);
}
/**
 * Get the release version from a prerelease version.
 */
function getReleaseVersion(version) {
    const parsed = semver.parse(version);
    if (!parsed)
        return version;
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}
//# sourceMappingURL=versioning.js.map