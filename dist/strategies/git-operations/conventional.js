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
const base_js_1 = require("./base.js");
const template_js_1 = require("../../utils/template.js");
/**
 * Conventional git strategy that uses conventional commit messages
 * and follows standard git practices for version management.
 */
class ConventionalGitStrategy extends base_js_1.BaseGitOperationStrategy {
    constructor() {
        super('conventional');
    }
    async commitVersionChange(packageDir, packageName, version, bumpType, template) {
        const git = (0, simple_git_1.default)(packageDir);
        // Template the commit message
        const message = (0, template_js_1.interpolateTemplate)(template, {
            packageName,
            version,
            bumpType
        });
        await git.add('package.json');
        await git.commit(message);
        core.info(`[${packageName}] Committed version change: ${version}`);
    }
    async commitDependencyUpdate(packageDir, packageName, depName, depVersion, template) {
        const git = (0, simple_git_1.default)(packageDir);
        // Template the commit message  
        const message = (0, template_js_1.interpolateTemplate)(template, {
            packageName,
            dependencyName: depName,
            dependencyVersion: depVersion
        });
        await git.add('package.json');
        await git.commit(message);
        core.info(`[${packageName}] Committed dependency update: ${depName}@${depVersion}`);
    }
    async tagVersion(version, isPrerelease, shouldTag) {
        if (!shouldTag) {
            core.info(`[root] Skipping tag creation for ${version}`);
            return;
        }
        const git = (0, simple_git_1.default)(process.cwd());
        const tagName = `v${version}`;
        const tagMessage = `chore(release): ${version}`;
        try {
            // Create annotated tag with message
            await git.tag([tagName, '-a', '-m', tagMessage]);
            core.info(`[root] Created ${isPrerelease ? 'prerelease ' : ''}tag: ${tagName}`);
        }
        catch (error) {
            core.error(`Failed to create tag ${tagName}: ${error}`);
            throw error;
        }
    }
}
exports.ConventionalGitStrategy = ConventionalGitStrategy;
//# sourceMappingURL=conventional.js.map