"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionBumpService = void 0;
const discovery_js_1 = require("./discovery.js");
const index_js_1 = require("../objectives/index.js");
/**
 * Service responsible for orchestrating the complete version bump process.
 * Thin orchestrator that delegates to VersionBumping objective.
 */
class VersionBumpService {
    gitStrategy;
    packageManager;
    discoveryService;
    constructor(gitStrategy, packageManager, config) {
        this.gitStrategy = gitStrategy;
        this.packageManager = packageManager;
        this.discoveryService = new discovery_js_1.DiscoveryService(config);
    }
    /**
     * Process the entire workspace for version bumps.
     */
    async processWorkspace(packages, rootPkg, config) {
        // Step 1: Determine reference point for version comparison
        const referencePoint = await this.discoveryService.determineReferencePoint(config.baseBranch, config.activeBranch);
        // Step 2: Use VersionBumping objective to process workspace
        const versionBumpingConfig = {
            ...config,
            gitStrategy: this.gitStrategy,
            packageManager: this.packageManager,
        };
        const strategy = index_js_1.versionBumping.strategise(versionBumpingConfig);
        return await strategy.processWorkspace(packages, rootPkg, referencePoint, config);
    }
}
exports.VersionBumpService = VersionBumpService;
//# sourceMappingURL=version-bump.js.map