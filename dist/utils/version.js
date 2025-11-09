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
exports.calculateBumpType = calculateBumpType;
exports.finalizeVersion = finalizeVersion;
exports.getMostSignificantBumpType = getMostSignificantBumpType;
exports.initializeVersion = initializeVersion;
const semver = __importStar(require("semver"));
/**
 * Calculate the bump type between two versions.
 */
function calculateBumpType(fromVersion, toVersion) {
    const from = semver.coerce(fromVersion)?.toString() ?? '0.0.0';
    const to = semver.coerce(toVersion)?.toString() ?? '0.0.0';
    if (semver.eq(from, to))
        return null;
    const diff = semver.diff(from, to);
    if (!diff)
        return null;
    if (diff.includes('major'))
        return 'major';
    if (diff.includes('minor'))
        return 'minor';
    if (diff.includes('patch'))
        return 'patch';
    if (diff.includes('prerelease'))
        return 'prerelease';
    return null;
}
/**
 * Finalize a prerelease version by removing the prerelease suffix.
 */
function finalizeVersion(version) {
    const parsed = semver.parse(version);
    if (!parsed)
        return version;
    if (parsed.prerelease.length > 0) {
        return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
    }
    return version;
}
/**
 * Get the most significant bump type from an array of bump types.
 */
function getMostSignificantBumpType(bumpTypes) {
    const priority = {
        major: 4,
        minor: 3,
        patch: 2,
        prerelease: 1,
        release: 0,
    };
    let mostSignificant = null;
    let highestPriority = -1;
    for (const bumpType of bumpTypes) {
        if (bumpType && priority[bumpType] > highestPriority) {
            mostSignificant = bumpType;
            highestPriority = priority[bumpType];
        }
    }
    return mostSignificant;
}
/**
 * Initialize a version if it's missing or invalid.
 */
function initializeVersion(version) {
    if (!version)
        return '0.0.0';
    const coerced = semver.coerce(version);
    return coerced?.toString() ?? '0.0.0';
}
//# sourceMappingURL=version.js.map