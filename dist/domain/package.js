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
exports.Package = void 0;
const core = __importStar(require("@actions/core"));
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const version_js_1 = require("../utils/version.js");
const versioning_js_1 = require("../utils/versioning.js");
const git_js_1 = require("../utils/git.js");
const commits_js_1 = require("../utils/commits.js");
/**
 * Represents a package in the workspace with its metadata and operations.
 * Encapsulates package-specific version management logic.
 */
class Package {
    name;
    dir;
    _pkg;
    packageJsonPath;
    _bumpResult = null;
    constructor(name, dir, _pkg, packageJsonPath) {
        this.name = name;
        this.dir = dir;
        this._pkg = _pkg;
        this.packageJsonPath = packageJsonPath;
    }
    /**
     * Get the current version of the package.
     */
    get version() {
        return this._pkg.version;
    }
    /**
     * Set the version of the package.
     */
    set version(newVersion) {
        this._pkg.version = newVersion;
    }
    /**
     * Get the package.json data.
     */
    get pkg() {
        return this._pkg;
    }
    /**
     * Get the relative path of the package directory.
     */
    get relativePath() {
        return node_path_1.default.relative(process.cwd(), this.dir) || '/';
    }
    /**
     * Get the bump result if a version bump has occurred.
     */
    get bumpResult() {
        return this._bumpResult;
    }
    /**
     * Initialize the version if it's missing or invalid.
     */
    initializeVersion() {
        if (!this._pkg.version) {
            this._pkg.version = (0, version_js_1.initializeVersion)(this._pkg.version);
            core.info(`[${this.name}] Initialized missing version to ${this._pkg.version}`);
        }
    }
    /**
     * Save the package.json file to disk.
     */
    async save() {
        await this.writeJSON(this.packageJsonPath, this._pkg);
    }
    /**
     * Get commits affecting this package since a reference commit.
     */
    async getCommitsAffecting(sinceRef) {
        return await (0, git_js_1.getCommitsAffecting)(this.dir, sinceRef);
    }
    /**
     * Process version bump for this package based on conventional commits.
     */
    async processVersionBump(referenceCommit, referenceVersion, strategy, commitMsgTemplate, gitStrategy, shouldForceBump = false) {
        this.initializeVersion();
        core.info(`[${this.name}@${this.version}] Processing package`);
        // Find changes since reference point
        const commitsSinceReference = await this.getCommitsAffecting(referenceCommit);
        const commitBasedBump = commitsSinceReference.length > 0
            ? (0, commits_js_1.getMostSignificantBump)(commitsSinceReference)
            : null;
        // Calculate historical bump type from reference
        const historicalVersion = referenceVersion;
        const historicalBump = this.calculateBumpType(historicalVersion, this.version);
        core.info(`[${this.name}@${this.version}] Commit-based bump: ${commitBasedBump || 'none'}, Historical bump: ${historicalBump || 'none'}`);
        // Apply strategy for same bump type or force bump
        const nextVersion = (0, versioning_js_1.getNextVersion)(this.version, commitBasedBump, historicalBump, strategy);
        if (!nextVersion || nextVersion === this.version) {
            if (shouldForceBump && commitBasedBump) {
                return await this.performVersionBump(commitBasedBump, referenceCommit, commitMsgTemplate, gitStrategy);
            }
            core.info(`[${this.name}@${this.version}] Skipping - no changes needed`);
            return null;
        }
        this.version = nextVersion;
        await this.save();
        const bumpType = this.determineBumpType(nextVersion, commitBasedBump);
        await gitStrategy.commitVersionChange(this.dir, this.name, this.version, bumpType, commitMsgTemplate);
        const result = {
            version: this.version,
            bumpType,
            sha: referenceCommit,
        };
        core.info(`[${this.name}@${this.version}] Bumped to ${this.version} (${bumpType})`);
        this._bumpResult = result;
        return result;
    }
    /**
     * Finalize a prerelease version to a stable release.
     */
    async finalizePrerelease(commitMsgTemplate, gitStrategy) {
        if (!this.version || !this.isPrerelease()) {
            return null;
        }
        const finalVersion = this.finalizeVersion(this.version);
        core.info(`[${this.name}] Finalizing prerelease version: ${this.version} → ${finalVersion}`);
        this.version = finalVersion;
        await this.save();
        await gitStrategy.commitVersionChange(this.dir, this.name, finalVersion, 'release', commitMsgTemplate);
        const result = {
            version: finalVersion,
            bumpType: 'release',
            sha: null
        };
        this._bumpResult = result;
        return result;
    }
    /**
     * Update a dependency to a new version.
     */
    async updateDependency(depName, newVersion, depCommitMsgTemplate, gitStrategy) {
        let updated = false;
        for (const depKey of DEPENDENCY_KEYS) {
            const deps = this._pkg[depKey];
            if (deps && deps[depName]) {
                const currentDepSpec = deps[depName];
                if (this.satisfiesVersion(newVersion, currentDepSpec)) {
                    continue;
                }
                core.info(`[${this.name}] Updating ${depName} dependency from ${currentDepSpec} to ^${newVersion}`);
                deps[depName] = `^${newVersion}`;
                updated = true;
            }
        }
        if (updated) {
            await this.save();
            await gitStrategy.commitDependencyUpdate(this.dir, this.name, depName, newVersion, depCommitMsgTemplate);
            core.info(`[${this.name}] Updated dependencies for ${depName}`);
        }
        return updated;
    }
    /**
     * Test compatibility after dependency updates.
     */
    async testCompatibility(packageManager) {
        try {
            const testResult = await packageManager.test(this.dir);
            return testResult;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.warning(`[${this.name}] Test execution failed: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }
    async performVersionBump(bumpType, referenceCommit, commitMsgTemplate, gitStrategy) {
        const nextVersion = (0, versioning_js_1.getNextVersion)(this.version, bumpType, null, 'apply-bump');
        if (!nextVersion) {
            throw new Error(`Failed to calculate next version for ${this.name}`);
        }
        this.version = nextVersion;
        await this.save();
        const finalBumpType = this.determineBumpType(nextVersion, bumpType);
        await gitStrategy.commitVersionChange(this.dir, this.name, this.version, finalBumpType, commitMsgTemplate);
        const result = {
            version: this.version,
            bumpType: finalBumpType,
            sha: referenceCommit,
        };
        this._bumpResult = result;
        return result;
    }
    isPrerelease() {
        const parsed = this.parseVersion(this.version);
        return Boolean(parsed?.prerelease?.length);
    }
    finalizeVersion(version) {
        const parsed = this.parseVersion(version);
        if (parsed && parsed.prerelease.length > 0) {
            return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
        }
        return version;
    }
    calculateBumpType(fromVersion, toVersion) {
        // This would use semver.diff logic - simplified for now
        if (fromVersion === toVersion)
            return null;
        // Add proper semver diff logic here
        return 'patch';
    }
    determineBumpType(version, commitBasedBump) {
        return this.isPrerelease() ? 'prerelease' : commitBasedBump || 'patch';
    }
    satisfiesVersion(newVersion, currentSpec) {
        // Simplified semver satisfaction check
        return currentSpec.includes(newVersion);
    }
    parseVersion(version) {
        // Simplified version parsing - would use semver.parse in real implementation
        const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
        if (!match)
            return null;
        return {
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10),
            patch: parseInt(match[3], 10),
            prerelease: match[4] ? match[4].split('.') : [],
        };
    }
    async writeJSON(filePath, data) {
        await (0, promises_1.writeFile)(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    }
}
exports.Package = Package;
//# sourceMappingURL=package.js.map