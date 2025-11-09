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
exports.SetupGitTactic = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = __importDefault(require("simple-git"));
const git = (0, simple_git_1.default)();
class SetupGitTactic {
    name = 'SetupGit';
    assess(context) {
        return Boolean(context.branchTemplate);
    }
    async attempt(context) {
        try {
            await git.addConfig('user.name', 'github-actions[bot]');
            await git.addConfig('user.email', 'github-actions[bot]@users.noreply.github.com');
            try {
                core.debug(`[git] Fetching all branches with full history`);
                await git.fetch(['--all', '--prune', '--prune-tags']);
                core.debug(`[git] Successfully fetched all branches`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                core.warning(`[git] Failed to fetch all branches: ${errorMessage}`);
            }
            try {
                core.debug(`[git] Attempting to unshallow repository`);
                await git.fetch(['--unshallow']);
                core.info(`[git] Successfully unshallowed repository`);
            }
            catch (error) {
                core.debug(`[git] Repository is not shallow or unshallow failed`);
            }
            const tempRef = `refs/heads/temp-${Date.now()}`;
            const currentBranch = (await git.branch()).current;
            core.debug(`[git] Creating temporary ref ${tempRef} from ${currentBranch}`);
            await git.raw(['update-ref', tempRef, 'HEAD']);
            const result = {
                tempRef,
                branchTemplate: context.branchTemplate,
            };
            return {
                applied: true,
                success: true,
                result,
                message: `Git setup complete with temp ref: ${tempRef}`,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Git setup failed: ${errorMessage}`,
            };
        }
    }
}
exports.SetupGitTactic = SetupGitTactic;
//# sourceMappingURL=SetupGit.js.map