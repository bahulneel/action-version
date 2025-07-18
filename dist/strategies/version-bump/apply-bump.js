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
exports.ApplyBumpStrategy = void 0;
const core = __importStar(require("@actions/core"));
const semver = __importStar(require("semver"));
const base_js_1 = require("./base.js");
/**
 * Apply-bump strategy that performs normal semantic version increments.
 * This strategy will always apply the commit-based bump type.
 */
class ApplyBumpStrategy extends base_js_1.BaseVersionBumpStrategy {
    constructor() {
        super('apply-bump');
    }
    execute(currentVersion, commitBasedBump, historicalBump) {
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
exports.ApplyBumpStrategy = ApplyBumpStrategy;
//# sourceMappingURL=apply-bump.js.map