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
exports.BranchProtection = void 0;
const core = __importStar(require("@actions/core"));
const child_process_1 = require("child_process");
/**
 * Cache for branch protection status to avoid excessive API calls.
 */
const protectionCache = new Map();
/**
 * GitHub branch protection adapter.
 * Checks if a branch is protected via GitHub API using gh CLI.
 */
class BranchProtection {
    /**
     * Check if a branch is protected.
     * Caches results to avoid excessive API calls.
     */
    async isBranchProtected(branchName) {
        // Check cache first
        if (protectionCache.has(branchName)) {
            return protectionCache.get(branchName);
        }
        try {
            const repo = process.env.GITHUB_REPOSITORY;
            if (!repo) {
                core.debug('GITHUB_REPOSITORY not set, assuming branch is unprotected');
                return false;
            }
            // Use gh CLI to check branch protection
            // API endpoint: GET /repos/:owner/:repo/branches/:branch/protection
            const apiUrl = `repos/${repo}/branches/${branchName}/protection`;
            try {
                const output = (0, child_process_1.execSync)(`gh api ${apiUrl}`, {
                    encoding: 'utf-8',
                    stdio: 'pipe',
                });
                // If API call succeeds, branch is protected
                // The API returns 404 if branch is not protected
                const isProtected = output.trim().length > 0;
                // Cache the result
                protectionCache.set(branchName, isProtected);
                core.debug(`Branch ${branchName} protection status: ${isProtected}`);
                return isProtected;
            }
            catch (apiError) {
                // 404 means branch is not protected
                if (apiError.status === 404 || apiError.stdout?.includes('404') || apiError.stderr?.includes('404')) {
                    protectionCache.set(branchName, false);
                    core.debug(`Branch ${branchName} is not protected (404 response)`);
                    return false;
                }
                // Other errors - log and assume unprotected
                core.warning(`Failed to check branch protection for ${branchName}: ${apiError.message}`);
                protectionCache.set(branchName, false);
                return false;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.warning(`Failed to check branch protection for ${branchName}: ${errorMessage}`);
            // Assume unprotected on error
            protectionCache.set(branchName, false);
            return false;
        }
    }
    /**
     * Clear the protection cache (useful for testing).
     */
    clearCache() {
        protectionCache.clear();
    }
}
exports.BranchProtection = BranchProtection;
//# sourceMappingURL=BranchProtection.js.map