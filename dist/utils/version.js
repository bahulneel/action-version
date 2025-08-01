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
exports.guessBumpType = guessBumpType;
exports.initializeVersion = initializeVersion;
exports.calculateBumpType = calculateBumpType;
exports.finalizeVersion = finalizeVersion;
exports.bumpPriority = bumpPriority;
exports.getMostSignificantBumpType = getMostSignificantBumpType;
const semver = __importStar(require("semver"));
/**
 * Guess the bump type based on version string patterns.
 * @param version - The version string to analyze
 * @returns The guessed bump type
 */
function guessBumpType(version) {
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
function initializeVersion(version) {
    return semver.coerce(version)?.toString() ?? '0.0.0';
}
/**
 * Calculate the bump type between two versions.
 * @param fromVersion - The starting version
 * @param toVersion - The target version
 * @returns The bump type or null if no change
 */
function calculateBumpType(fromVersion, toVersion) {
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
function finalizeVersion(version) {
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
function bumpPriority(bumpType) {
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
function getMostSignificantBumpType(bumpTypes) {
    return bumpTypes.reduce((most, current) => {
        return bumpPriority(current) > bumpPriority(most) ? current : most;
    }, null);
}
//# sourceMappingURL=version.js.map