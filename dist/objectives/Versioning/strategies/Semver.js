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
exports.Semver = void 0;
const core = __importStar(require("@actions/core"));
const semver = __importStar(require("semver"));
/**
 * Semver versioning strategy.
 * Implements semantic versioning with support for regular releases, prereleases, and finalization.
 */
class Semver {
    config;
    name = 'semver';
    description = 'Semantic versioning with prerelease support';
    constructor(config) {
        this.config = config;
    }
    /**
     * Bump version based on commit signals and strategy policy.
     */
    bumpVersion(currentVersion, commitBasedBump, historicalBump) {
        const approach = this.config.approach;
        // Delegate to appropriate sub-strategy
        switch (approach) {
            case 'do-nothing':
                return this.doNothingBump(currentVersion, commitBasedBump, historicalBump);
            case 'apply-bump':
                return this.applyBump(currentVersion, commitBasedBump, historicalBump);
            case 'pre-release':
                return this.preReleaseBump(currentVersion, commitBasedBump, historicalBump);
            default:
                core.warning(`Unknown versioning approach: ${approach}`);
                return null;
        }
    }
    /**
     * Compare two semantic versions.
     * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
     */
    compareVersion(v1, v2) {
        const coerced1 = semver.coerce(v1)?.toString() ?? '0.0.0';
        const coerced2 = semver.coerce(v2)?.toString() ?? '0.0.0';
        if (semver.lt(coerced1, coerced2))
            return -1;
        if (semver.gt(coerced1, coerced2))
            return 1;
        return 0;
    }
    /**
     * Do-nothing approach: always skip bumps.
     */
    doNothingBump(_currentVersion, _commitBasedBump, _historicalBump) {
        core.debug(`Strategy 'do-nothing': Skipping bump`);
        return null;
    }
    /**
     * Apply-bump approach: perform normal semantic version increments.
     */
    applyBump(currentVersion, commitBasedBump, _historicalBump) {
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
    /**
     * Pre-release approach: create or increment prerelease versions.
     */
    preReleaseBump(currentVersion, commitBasedBump, _historicalBump) {
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
        }
        else {
            // First time: apply bump then make prerelease starting at 1
            const bumped = semver.inc(current, commitBasedBump);
            if (!bumped) {
                core.warning(`Strategy 'pre-release': Failed to bump ${current} with ${commitBasedBump}`);
                return null;
            }
            // Create prerelease starting at 1
            const nextVersion = `${bumped}-1`;
            if (!semver.valid(nextVersion)) {
                core.warning(`Strategy 'pre-release': Failed to create valid prerelease ${nextVersion}`);
                return null;
            }
            core.debug(`Strategy 'pre-release': First prerelease ${current} → ${bumped} → ${nextVersion}`);
            return nextVersion; // 1.1.0 → 1.2.0 → 1.2.0-1
        }
    }
}
exports.Semver = Semver;
//# sourceMappingURL=Semver.js.map