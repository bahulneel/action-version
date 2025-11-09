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
exports.DiscoveryService = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = __importDefault(require("simple-git"));
const index_js_1 = require("../objectives/index.js");
const git = (0, simple_git_1.default)();
/**
 * Service responsible for discovering git reference points and version information.
 * Uses the ReferenceDiscovery objective to select appropriate strategy.
 */
class DiscoveryService {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Determine the reference point for version comparison.
     */
    async determineReferencePoint(baseBranch, activeBranch) {
        // Use the ReferenceDiscovery objective
        const strategy = index_js_1.referenceDiscovery.strategise(this.config);
        return await strategy.findReferencePoint(baseBranch, activeBranch);
    }
    /**
     * Get package version at a specific commit.
     */
    async getVersionAtCommit(commitRef) {
        try {
            const packageJsonContent = await git.show([`${commitRef}:package.json`]);
            const packageJson = JSON.parse(packageJsonContent);
            return packageJson.version || null;
        }
        catch (error) {
            core.debug(`Failed to get version at commit ${commitRef}: ${error}`);
            return null;
        }
    }
    /**
     * Find the last version change commit for a specific package.
     */
    async findLastVersionChangeCommit(packageJsonPath) {
        try {
            const log = await git.log({
                file: packageJsonPath,
                maxCount: 50,
            });
            // Look for commits that actually changed the version
            for (const commit of log.all) {
                try {
                    const diff = await git.diff([`${commit.hash}~1..${commit.hash}`, '--', packageJsonPath]);
                    if (diff.includes('"version":')) {
                        return commit.hash;
                    }
                }
                catch {
                    // Ignore errors for individual commits
                }
            }
            return null;
        }
        catch (error) {
            core.debug(`Failed to find last version change for ${packageJsonPath}: ${error}`);
            return null;
        }
    }
}
exports.DiscoveryService = DiscoveryService;
//# sourceMappingURL=discovery.js.map