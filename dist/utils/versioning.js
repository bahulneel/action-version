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
const semver = __importStar(require("semver"));
/**
 * Get the next version based on current version, bump type, and strategy.
 */
function getNextVersion(currentVersion, commitBasedBump, _historicalBump, strategy) {
    const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0';
    // Handle do-nothing strategy
    if (strategy === 'do-nothing') {
        return null;
    }
    // Handle pre-release strategy
    if (strategy === 'pre-release' && commitBasedBump && ['major', 'minor', 'patch'].includes(commitBasedBump)) {
        if (semver.prerelease(current)) {
            return semver.inc(current, 'prerelease');
        }
        else {
            const bumped = semver.inc(current, commitBasedBump);
            return bumped ? `${bumped}-1` : null;
        }
    }
    // Handle apply-bump strategy
    if (commitBasedBump && ['major', 'minor', 'patch'].includes(commitBasedBump)) {
        return semver.inc(current, commitBasedBump);
    }
    return null;
}
//# sourceMappingURL=versioning.js.map