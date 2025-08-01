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
exports.NpmPackageManagerStrategy = void 0;
const core = __importStar(require("@actions/core"));
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const base_js_1 = require("./base.js");
/**
 * NPM package manager strategy.
 * Handles NPM-specific operations and commands.
 */
class NpmPackageManagerStrategy extends base_js_1.BasePackageManagerStrategy {
    constructor() {
        super('npm');
    }
    isAvailable() {
        try {
            // Check if package-lock.json exists
            const packageLockPath = node_path_1.default.join(process.cwd(), 'package-lock.json');
            (0, promises_1.access)(packageLockPath).then(() => true).catch(() => false);
            // Check if npm command is available
            (0, node_child_process_1.execSync)('npm --version', { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
    async test(packageDir) {
        try {
            core.debug(`[npm] Running tests in ${packageDir}`);
            const result = (0, node_child_process_1.execSync)('npm test', {
                cwd: packageDir,
                stdio: 'pipe',
                encoding: 'utf-8',
                timeout: 60000, // 1 minute timeout
            });
            core.debug(`[npm] Test output: ${result}`);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.debug(`[npm] Test failed: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    async install(packageDir) {
        try {
            core.info(`[npm] Installing dependencies in ${packageDir}`);
            (0, node_child_process_1.execSync)('npm ci', {
                cwd: packageDir,
                stdio: 'inherit',
                timeout: 300000, // 5 minute timeout
            });
            core.info(`[npm] Dependencies installed successfully`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.error(`[npm] Failed to install dependencies: ${errorMessage}`);
            throw new Error(`NPM install failed: ${errorMessage}`);
        }
    }
}
exports.NpmPackageManagerStrategy = NpmPackageManagerStrategy;
//# sourceMappingURL=npm.js.map