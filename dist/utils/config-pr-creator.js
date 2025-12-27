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
exports.createConfigPR = createConfigPR;
exports.outputConfigToSummary = outputConfigToSummary;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const child_process_1 = require("child_process");
const simple_git_1 = __importDefault(require("simple-git"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const git = (0, simple_git_1.default)();
/**
 * Create a PR with the inferred .versioning.yml configuration.
 * Returns the PR URL if successful, null if PR creation failed.
 */
async function createConfigPR(config) {
    try {
        const branchName = 'add-versioning-config';
        const configPath = path.join(process.cwd(), '.versioning.yml');
        // Step 1: Create a new branch
        const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
        core.info(`Current branch: ${currentBranch}`);
        // Check if branch already exists
        const branches = await git.branchLocal();
        if (branches.all.includes(branchName)) {
            core.info(`Branch ${branchName} already exists, checking it out`);
            await git.checkout(branchName);
        }
        else {
            await git.checkoutBranch(branchName, currentBranch);
            core.info(`Created branch: ${branchName}`);
        }
        // Step 2: Write .versioning.yml to repository root
        const yamlContent = js_yaml_1.default.dump(config, {
            indent: 2,
            lineWidth: 120,
        });
        await fs_1.promises.writeFile(configPath, yamlContent, 'utf-8');
        core.info(`Written .versioning.yml to ${configPath}`);
        // Step 3: Commit the file
        await git.add(configPath);
        await git.commit('chore(config): add inferred .versioning.yml configuration');
        core.info('Committed .versioning.yml');
        // Step 4: Push the branch
        await git.push('origin', branchName, ['--set-upstream']);
        core.info(`Pushed branch ${branchName} to origin`);
        // Step 5: Create PR using gh CLI
        try {
            const repo = process.env.GITHUB_REPOSITORY;
            if (!repo) {
                throw new Error('GITHUB_REPOSITORY environment variable is not set');
            }
            const prTitle = 'chore(config): add .versioning.yml configuration';
            const prBody = `This PR adds a \`.versioning.yml\` configuration file with an inferred preset based on your repository structure.

Please review and merge this PR to enable model-driven versioning configuration.

The configuration was inferred from your repository's branch structure. You can customize it after merging if needed.

See the [documentation](https://github.com/bahulneel/action-version) for more details on customizing the configuration.`;
            const prOutput = (0, child_process_1.execSync)(`gh pr create --base "${currentBranch}" --head "${branchName}" --title "${prTitle}" --body "${prBody}"`, {
                encoding: 'utf-8',
                stdio: 'pipe',
            });
            // Extract PR URL from output (gh CLI outputs the PR URL)
            const prUrlMatch = prOutput.match(/https:\/\/github\.com\/[^\s]+/)?.[0];
            if (prUrlMatch) {
                core.info(`Created PR: ${prUrlMatch}`);
                return prUrlMatch;
            }
            core.warning('PR created but could not extract URL from output');
            return 'PR created (URL unknown)';
        }
        catch (prError) {
            const errorMessage = prError instanceof Error ? prError.message : String(prError);
            core.warning(`Failed to create PR using gh CLI: ${errorMessage}`);
            core.warning('PR creation failed - will output config to action summary instead');
            return null;
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.warning(`Failed to create PR with inferred config: ${errorMessage}`);
        return null;
    }
}
/**
 * Output inferred config to GitHub Actions summary.
 */
async function outputConfigToSummary(config) {
    try {
        const yamlContent = js_yaml_1.default.dump(config, {
            indent: 2,
            lineWidth: 120,
        });
        await core.summary
            .addHeading('Inferred .versioning.yml Configuration', 2)
            .addRaw(`<p>Please add a <code>.versioning.yml</code> file to your repository root with the following content:</p>
<pre><code>${yamlContent}</code></pre>
<p>You can customize this configuration as needed. See the <a href="https://github.com/bahulneel/action-version">documentation</a> for more details.</p>`)
            .write();
    }
    catch (error) {
        core.warning(`Failed to write config to summary: ${error}`);
    }
}
//# sourceMappingURL=config-pr-creator.js.map