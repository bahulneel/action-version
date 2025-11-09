"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Git = void 0;
const node_path_1 = __importDefault(require("node:path"));
const SimpleGit_js_1 = require("@adapters/Git/SimpleGit.js");
const SetupGit_js_1 = require("../tactics/SetupGit.js");
const template_js_1 = require("@utils/template.js");
/**
 * Git VCS strategy.
 * Implements version control operations using Git.
 */
class Git {
    name = 'git';
    description = 'Git-backed VCS strategy';
    git = new SimpleGit_js_1.SimpleGit();
    constructor(_config) { }
    async setup(context) {
        // Use SetupGit tactic directly (it handles all setup steps)
        const tactic = new SetupGit_js_1.SetupGitTactic();
        const tacticResult = await tactic.attempt(context);
        if (tacticResult.success && tacticResult.result) {
            return tacticResult.result;
        }
        throw new Error(`Git setup failed: ${tacticResult.message}`);
    }
    async commitVersionChange(packageDir, packageName, version, bumpType, template) {
        const message = template
            ? (0, template_js_1.interpolateTemplate)(template, { packageName, version, bumpType })
            : `chore${packageName === 'root' ? '' : `(${packageName})`}: bump to ${version}`;
        await this.git.add(node_path_1.default.join(packageDir, 'package.json'));
        await this.git.commit(message);
    }
    async commitDependencyUpdate(packageDir, packageName, depName, depVersion, template) {
        const message = template
            ? (0, template_js_1.interpolateTemplate)(template, {
                packageName,
                dependencyName: depName,
                dependencyVersion: depVersion,
            })
            : `chore${packageName === 'root' ? '' : `(${packageName})`}: update ${depName} to ${depVersion}`;
        await this.git.add(node_path_1.default.join(packageDir, 'package.json'));
        await this.git.commit(message);
    }
    async tagVersion(version, _isPrerelease, shouldTag) {
        if (!shouldTag)
            return;
        const tag = `v${version}`;
        await this.git.addTag(tag);
    }
    async prepareVersionBranch(versionedBranch, tempRef) {
        if (!tempRef)
            return;
        await this.git.raw('update-ref', `refs/heads/${versionedBranch}`, tempRef);
    }
}
exports.Git = Git;
//# sourceMappingURL=Git.js.map