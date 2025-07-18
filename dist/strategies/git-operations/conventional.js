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
exports.ConventionalGitStrategy = void 0;
const core = __importStar(require("@actions/core"));
const simple_git_1 = __importDefault(require("simple-git"));
const node_path_1 = __importDefault(require("node:path"));
const base_js_1 = require("./base.js");
const template_js_1 = require("../../utils/template.js");
const git = (0, simple_git_1.default)();
/**
 * Conventional git strategy that uses conventional commit messages
 * and follows standard git practices for version management.
 */
class ConventionalGitStrategy extends base_js_1.BaseGitOperationStrategy {
    constructor() {
        super('conventional');
    }
    async commitVersionChange(packageDir, packageName, version, bumpType, template) {
        const relativePath = node_path_1.default.relative(process.cwd(), packageDir) || '.';
        const commitMessage = (0, template_js_1.interpolateTemplate)(template, {
            package: packageName,
            version,
            bumpType,
        });
        try {
            await git.add(node_path_1.default.join(packageDir, 'package.json'));
            await git.commit(commitMessage, undefined, {
                '--allow-empty': null,
            });
            core.info(`[${packageName}] Committed version change: ${commitMessage}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.error(`[${packageName}] Failed to commit version change: ${errorMessage}`);
            throw new Error(`Failed to commit version change for ${packageName}: ${errorMessage}`);
        }
    }
    async commitDependencyUpdate(packageDir, packageName, depName, depVersion, template) {
        const relativePath = node_path_1.default.relative(process.cwd(), packageDir) || '.';
        const commitMessage = (0, template_js_1.interpolateTemplate)(template, {
            package: packageName,
            depPackage: depName,
            depVersion,
        });
        try {
            await git.add(node_path_1.default.join(packageDir, 'package.json'));
            await git.commit(commitMessage, undefined, {
                '--allow-empty': null,
            });
            core.info(`[${packageName}] Committed dependency update: ${commitMessage}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.error(`[${packageName}] Failed to commit dependency update: ${errorMessage}`);
            throw new Error(`Failed to commit dependency update for ${packageName}: ${errorMessage}`);
        }
    }
    async tagVersion(version, isPrerelease, shouldTag) {
        if (!shouldTag) {
            core.debug(`[git] Skipping tag creation for ${version} (shouldTag=${shouldTag})`);
            return;
        }
        if (isPrerelease && !shouldTag) {
            core.debug(`[git] Skipping prerelease tag for ${version}`);
            return;
        }
        const tagName = `v${version}`;
        const tagMessage = isPrerelease
            ? `Pre-release version ${version}`
            : `Release version ${version}`;
        try {
            await git.addTag(tagName, undefined, {
                '-a': null,
                '-m': tagMessage,
            });
            core.info(`[git] Created tag ${tagName}: ${tagMessage}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.warning(`[git] Failed to create tag ${tagName}: ${errorMessage}`);
            // Don't throw here - tag creation failure shouldn't fail the entire process
        }
    }
}
exports.ConventionalGitStrategy = ConventionalGitStrategy;
//# sourceMappingURL=conventional.js.map