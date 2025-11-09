"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryOutput = void 0;
const GitHubActions_js_1 = require("./strategies/GitHubActions.js");
const Console_js_1 = require("./strategies/Console.js");
exports.summaryOutput = {
    strategise(_config) {
        // Select based on environment
        const summaryConfig = {
            kind: process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'console',
        };
        if (summaryConfig.kind === 'github-actions') {
            return new GitHubActions_js_1.GitHubActions(summaryConfig);
        }
        else {
            return new Console_js_1.Console(summaryConfig);
        }
    },
};
//# sourceMappingURL=objective.js.map