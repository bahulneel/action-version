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
exports.Pnpm = void 0;
const core = __importStar(require("@actions/core"));
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
/**
 * PNPM package manager strategy.
 * Handles PNPM-specific operations and commands.
 */
class Pnpm {
    name = 'pnpm';
    description = 'PNPM package manager strategy';
    constructor(_config) { }
    isAvailable() {
        try {
            // Check if pnpm-lock.yaml exists
            const pnpmLockPath = node_path_1.default.join(process.cwd(), 'pnpm-lock.yaml');
            (0, promises_1.access)(pnpmLockPath)
                .then(() => true)
                .catch(() => false);
            // Check if pnpm command is available
            (0, node_child_process_1.execSync)('pnpm --version', { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
    async test(packageDir) {
        try {
            core.debug(`[pnpm] Running tests in ${packageDir}`);
            const result = (0, node_child_process_1.execSync)('pnpm test', {
                cwd: packageDir,
                stdio: 'pipe',
                encoding: 'utf-8',
                timeout: 60000, // 1 minute timeout
            });
            core.debug(`[pnpm] Test output: ${result}`);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.debug(`[pnpm] Test failed: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    async install(packageDir) {
        try {
            core.info(`[pnpm] Installing dependencies in ${packageDir}`);
            (0, node_child_process_1.execSync)('pnpm install --frozen-lockfile', {
                cwd: packageDir,
                stdio: 'inherit',
                timeout: 300000, // 5 minute timeout
            });
            core.info(`[pnpm] Dependencies installed successfully`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.error(`[pnpm] Failed to install dependencies: ${errorMessage}`);
            throw new Error(`PNPM install failed: ${errorMessage}`);
        }
    }
}
exports.Pnpm = Pnpm;
//# sourceMappingURL=Pnpm.js.map