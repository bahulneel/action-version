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
const path = __importStar(require("path"));
const fs_1 = require("fs");
const discovery_js_1 = require("./discovery.js");
const version_js_1 = require("../utils/version.js");
const version_js_2 = require("../utils/version.js");
const index_js_1 = require("../objectives/index.js");
/**
 * Service responsible for orchestrating the complete version bump process.
 * Handles package discovery, version calculation, and dependency updates.
 */
class VersionBumpService {
    gitStrategy;
    packageManager;
    config;
    discoveryService;
    constructor(gitStrategy, packageManager, config) {
        this.gitStrategy = gitStrategy;
        this.packageManager = packageManager;
        this.config = config;
        this.discoveryService = new discovery_js_1.DiscoveryService(config);
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
    async processRootPackage(rootPkg, workspaceBumped, referencePoint, config) {
        if (!rootPkg.workspaces) {
            return { bumped: {}, hasBumped: false };
        }
        core.info(`🏠 Processing root package: ${rootPkg.name || 'root'}@${rootPkg.version}`);
        // Get workspace bump from workspace package changes
        const workspaceBumpTypes = Object.values(workspaceBumped).map((b) => b.bumpType);
        const workspaceBump = (0, version_js_2.getMostSignificantBumpType)(workspaceBumpTypes);
        // Get non-workspace changes (files outside workspace packages)
        const nonWorkspaceCommits = await this.getNonWorkspaceCommits(referencePoint.referenceCommit);
        const nonWorkspaceBump = (0, version_js_2.getMostSignificantBumpType)(nonWorkspaceCommits);
        // Combine both workspace and non-workspace changes
        const allBumpTypes = [...workspaceBumpTypes, ...nonWorkspaceCommits];
        const mostSignificantBump = (0, version_js_2.getMostSignificantBumpType)(allBumpTypes);
        if (!mostSignificantBump) {
            core.info('🏠 No changes requiring root package bump');
            return { bumped: {}, hasBumped: false };
        }
        // Calculate historical bump type
        const historicalBump = (0, version_js_1.calculateBumpType)(referencePoint.referenceVersion, rootPkg.version);
        core.info(`🏠 Workspace bump: ${workspaceBump || 'none'}, Non-workspace bump: ${nonWorkspaceBump || 'none'}, Combined: ${mostSignificantBump}, Historical: ${historicalBump || 'none'}`);
        // Apply version bump using the most significant change
        const strategy = index_js_1.versioning.strategise(config);
        const nextVersion = strategy.bumpVersion(rootPkg.version, mostSignificantBump, historicalBump);
        if (!nextVersion || nextVersion === rootPkg.version) {
            core.info('🏠 No root package version change needed');
            return { bumped: {}, hasBumped: false };
        }
        // Update root package version
        rootPkg.version = nextVersion;
        await this.saveRootPackage(rootPkg);
        // Commit the version change
        await this.gitStrategy.commitVersionChange(process.cwd(), rootPkg.name || 'root', nextVersion, mostSignificantBump, config.commitMsgTemplate);
        const result = {
            version: nextVersion,
            bumpType: mostSignificantBump,
            sha: referencePoint.referenceCommit,
        };
        core.info(`🏠 Root package bumped to ${nextVersion} (${mostSignificantBump})`);
        return {
            bumped: { [rootPkg.name || 'root']: result },
            hasBumped: true,
        };
    }
    /**
     * Get commits affecting non-workspace files.
     */
    async getNonWorkspaceCommits(referenceCommit) {
        try {
            const simpleGit = (await Promise.resolve().then(() => __importStar(require('simple-git')))).default;
            const git = simpleGit();
            // If no reference commit, get all commits
            const logArgs = referenceCommit ? [`${referenceCommit}..HEAD`] : ['--all'];
            const log = await git.log(logArgs);
            // Parse commits to get bump types
            const { getMostSignificantBump } = await Promise.resolve().then(() => __importStar(require('../utils/commits.js')));
            const { commitMessaging } = await Promise.resolve().then(() => __importStar(require('../objectives/index.js')));
            const messaging = commitMessaging.strategise(this.config);
            const commits = await messaging.parseCommits([...log.all], referenceCommit);
            // Filter out commits that only affect workspace packages
            const workspaceDirs = await this.getWorkspaceDirectories();
            const nonWorkspaceBumpTypes = [];
            for (const commit of log.all) {
                // Check if this commit affects files outside workspace directories
                const files = await git.diff([`${commit.hash}~1..${commit.hash}`, '--name-only']);
                const hasNonWorkspaceChanges = files.split('\n').some((file) => {
                    if (!file.trim())
                        return false;
                    return !workspaceDirs.some((dir) => file.startsWith(dir));
                });
                if (hasNonWorkspaceChanges) {
                    // Get bump type for this commit
                    const commitInfo = commits.find((c) => c.header === commit.message.split('\n')[0]);
                    if (commitInfo) {
                        const bumpType = getMostSignificantBump([commitInfo]);
                        if (bumpType) {
                            nonWorkspaceBumpTypes.push(bumpType);
                        }
                    }
                }
            }
            return nonWorkspaceBumpTypes;
        }
        catch (error) {
            core.warning(`Failed to get non-workspace commits: ${error}`);
            return [];
        }
    }
    /**
     * Get workspace directories from the root package.json workspaces configuration.
     */
    async getWorkspaceDirectories() {
        try {
            const rootPkgPath = path.join(process.cwd(), 'package.json');
            const rootPkg = JSON.parse(await fs_1.promises.readFile(rootPkgPath, 'utf-8'));
            if (!rootPkg.workspaces) {
                return [];
            }
            // Handle both array and object format
            const workspaces = Array.isArray(rootPkg.workspaces)
                ? rootPkg.workspaces
                : rootPkg.workspaces.packages || [];
            // Convert glob patterns to directory prefixes
            const directories = [];
            for (const pattern of workspaces) {
                // Convert patterns like "packages/*" to "packages/"
                if (pattern.includes('*')) {
                    const dir = pattern.split('*')[0];
                    if (dir) {
                        directories.push(dir);
                    }
                }
                else {
                    // Direct directory reference
                    directories.push(pattern.endsWith('/') ? pattern : `${pattern}/`);
                }
            }
            return directories;
        }
        catch (error) {
            core.warning(`Failed to get workspace directories: ${error}`);
            // Fallback to common patterns
            return ['packages/', 'apps/', 'libs/', 'src/', 'implementations/'];
        }
    }
    /**
     * Calculate statistics from bump results.
     */
    calculateStats(bumped) {
        const totalPackages = Object.keys(bumped).length;
        const prereleasePackages = Object.values(bumped).filter((b) => this.isPrerelease(b.version)).length;
        const releasePackages = totalPackages - prereleasePackages;
        const finalizedPackages = Object.values(bumped).filter((b) => b.bumpType === 'release').length;
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