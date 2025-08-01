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
exports.VersionBumpService = void 0;
const core = __importStar(require("@actions/core"));
const discovery_js_1 = require("./discovery.js");
const version_js_1 = require("../utils/version.js");
const version_js_2 = require("../utils/version.js");
/**
 * Service responsible for orchestrating the complete version bump process.
 * Handles package discovery, version calculation, and dependency updates.
 */
class VersionBumpService {
    gitStrategy;
    packageManager;
    discoveryService;
    constructor(gitStrategy, packageManager) {
        this.gitStrategy = gitStrategy;
        this.packageManager = packageManager;
        this.discoveryService = new discovery_js_1.DiscoveryService();
    }
    /**
     * Process the entire workspace for version bumps.
     */
    async processWorkspace(packages, rootPkg, config) {
        // Step 1: Determine reference point for version comparison
        const referencePoint = await this.discoveryService.determineReferencePoint(config.baseBranch, config.activeBranch);
        core.info(`🎯 Reference: ${referencePoint.referenceCommit} (version: ${referencePoint.referenceVersion})`);
        let results;
        // Step 2: Handle prerelease finalization or normal processing
        if (referencePoint.shouldFinalizeVersions) {
            results = await this.finalizePackageVersions(packages, rootPkg, config);
        }
        else {
            results = await this.processNormalVersionBumps(packages, rootPkg, referencePoint, config);
        }
        return results;
    }
    /**
     * Finalize prerelease versions when base branch is updated.
     */
    async finalizePackageVersions(packages, rootPkg, config) {
        const bumped = {};
        let hasBumped = false;
        core.info('🔄 Finalizing prerelease versions for base branch update');
        // Finalize workspace packages
        for (const pkg of packages) {
            const result = await pkg.finalizePrerelease(config.commitMsgTemplate, this.gitStrategy);
            if (result) {
                bumped[pkg.name] = result;
                hasBumped = true;
            }
        }
        // Finalize root package if it's a prerelease
        if (this.isPrerelease(rootPkg.version)) {
            const finalVersion = (0, version_js_1.finalizeVersion)(rootPkg.version);
            core.info(`🔧 Finalizing root prerelease: ${rootPkg.version} → ${finalVersion}`);
            rootPkg.version = finalVersion;
            await this.saveRootPackage(rootPkg);
            await this.gitStrategy.commitVersionChange(process.cwd(), rootPkg.name || 'root', finalVersion, 'release', config.commitMsgTemplate);
            bumped[rootPkg.name || 'root'] = {
                version: finalVersion,
                bumpType: 'release',
                sha: null,
            };
            hasBumped = true;
            // Create release tags for finalized versions
            await this.gitStrategy.tagVersion(finalVersion, false, true);
        }
        const stats = this.calculateStats(bumped);
        return {
            bumped,
            testFailures: [],
            ...stats,
            hasBumped,
        };
    }
    /**
     * Process normal version bumps based on conventional commits.
     */
    async processNormalVersionBumps(packages, rootPkg, referencePoint, config) {
        // Step 1: Process workspace packages
        const workspaceResults = await this.processWorkspacePackages(packages, referencePoint, config);
        // Step 2: Process root package
        const rootResults = await this.processRootPackage(rootPkg, workspaceResults.bumped, referencePoint, config);
        // Merge results
        const finalBumped = { ...workspaceResults.bumped, ...rootResults.bumped };
        const hasBumped = workspaceResults.hasBumped || rootResults.hasBumped;
        const stats = this.calculateStats(finalBumped);
        return {
            bumped: finalBumped,
            testFailures: workspaceResults.testFailures,
            ...stats,
            hasBumped,
        };
    }
    /**
     * Process version bumps for all workspace packages.
     */
    async processWorkspacePackages(packages, referencePoint, config) {
        const bumped = {};
        const testFailures = [];
        // Process each package for version bumps
        for (const pkg of packages) {
            const result = await pkg.processVersionBump(referencePoint.referenceCommit, referencePoint.referenceVersion, config.strategy, config.commitMsgTemplate, this.gitStrategy, referencePoint.shouldForceBump);
            if (result) {
                bumped[pkg.name] = result;
            }
        }
        // Update dependencies for bumped packages
        await this.updateDependencies(packages, bumped, config, testFailures);
        return {
            bumped,
            testFailures,
            hasBumped: Object.keys(bumped).length > 0,
        };
    }
    /**
     * Update dependencies between packages when versions change.
     */
    async updateDependencies(packages, bumped, config, testFailures) {
        for (const pkg of packages) {
            if (!bumped[pkg.name])
                continue;
            for (const siblingPkg of packages) {
                if (siblingPkg.name === pkg.name)
                    continue;
                const updated = await siblingPkg.updateDependency(pkg.name, pkg.version, config.depCommitMsgTemplate, this.gitStrategy);
                // Test compatibility for major version bumps
                if (updated && bumped[pkg.name].bumpType === 'major') {
                    const testResult = await siblingPkg.testCompatibility(this.packageManager);
                    if (!testResult.success) {
                        core.warning(`🧪 Tests failed for ${siblingPkg.name} after major bump of ${pkg.name}`);
                        testFailures.push(siblingPkg.name);
                        // Could implement version rollback logic here
                    }
                }
            }
        }
    }
    /**
     * Process root package version bump based on workspace changes.
     */
    async processRootPackage(rootPkg, workspaceBumped, referencePoint, _config) {
        if (!rootPkg.workspaces) {
            return { bumped: {}, hasBumped: false };
        }
        core.info(`🏠 Processing root package: ${rootPkg.name || 'root'}@${rootPkg.version}`);
        // Calculate most significant bump from workspace changes
        const workspaceBumpTypes = Object.values(workspaceBumped).map(b => b.bumpType);
        const workspaceBump = (0, version_js_2.getMostSignificantBumpType)(workspaceBumpTypes);
        if (!workspaceBump) {
            core.info('🏠 No workspace changes requiring root package bump');
            return { bumped: {}, hasBumped: false };
        }
        // Calculate historical bump type
        const historicalBump = (0, version_js_1.calculateBumpType)(referencePoint.referenceVersion, rootPkg.version);
        core.info(`🏠 Required bump: ${workspaceBump}, Historical bump: ${historicalBump || 'none'}`);
        // Apply version bump logic similar to workspace packages
        // This would use the same strategy pattern logic
        // Implementation simplified for brevity
        return { bumped: {}, hasBumped: false };
    }
    /**
     * Calculate statistics from bump results.
     */
    calculateStats(bumped) {
        const totalPackages = Object.keys(bumped).length;
        const prereleasePackages = Object.values(bumped).filter(b => this.isPrerelease(b.version)).length;
        const releasePackages = totalPackages - prereleasePackages;
        const finalizedPackages = Object.values(bumped).filter(b => b.bumpType === 'release').length;
        return {
            totalPackages,
            releasePackages,
            prereleasePackages,
            finalizedPackages,
        };
    }
    /**
     * Check if a version is a prerelease.
     */
    isPrerelease(version) {
        return version.includes('-');
    }
    /**
     * Save the root package.json file.
     */
    async saveRootPackage(rootPkg) {
        const path = require('node:path');
        const fs = require('node:fs/promises');
        const rootPath = path.join(process.cwd(), 'package.json');
        const content = `${JSON.stringify(rootPkg, null, 2)}\n`;
        await fs.writeFile(rootPath, content, 'utf8');
    }
}
exports.VersionBumpService = VersionBumpService;
//# sourceMappingURL=version-bump.js.map