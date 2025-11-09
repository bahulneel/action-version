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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighestVersionTagTactic = void 0;
const core = __importStar(require("@actions/core"));
const semver = __importStar(require("semver"));
const simple_git_1 = __importDefault(require("simple-git"));
const git = (0, simple_git_1.default)();
class HighestVersionTagTactic {
    name = 'HighestVersionTag';
    assess(_context) {
        return true;
    }
    async attempt(_context) {
        try {
            core.debug(`[${this.name}] Finding highest version tag`);
            const tags = await git.tags();
            const allTags = tags.all;
            if (!allTags || allTags.length === 0) {
                return {
                    applied: true,
                    success: false,
                    message: 'No tags found in repository',
                };
            }
            const versionTags = allTags
                .map((tag) => ({
                tag,
                version: tag.replace(/^v/, ''),
                semver: semver.coerce(tag.replace(/^v/, '')),
            }))
                .filter(({ semver: sv }) => sv !== null)
                .sort((a, b) => semver.rcompare(a.semver, b.semver));
            if (versionTags.length === 0) {
                return {
                    applied: true,
                    success: false,
                    message: 'No valid semantic version tags found',
                };
            }
            const highestVersionTag = versionTags[0];
            const commitHash = await git.revparse([highestVersionTag.tag]);
            core.debug(`[${this.name}] Found highest version tag: ${highestVersionTag.tag} (${highestVersionTag.version})`);
            return {
                applied: true,
                success: true,
                result: {
                    referenceCommit: commitHash,
                    referenceVersion: highestVersionTag.version,
                    shouldFinalizeVersions: false,
                    shouldForceBump: false,
                },
                message: `Highest version tag: ${highestVersionTag.tag}`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Failed to find highest version tag: ${errorMessage}`,
            };
        }
    }
}
exports.HighestVersionTagTactic = HighestVersionTagTactic;
//# sourceMappingURL=HighestVersionTag.js.map