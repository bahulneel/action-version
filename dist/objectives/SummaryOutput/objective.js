"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryOutput = void 0;
const GitHubActions_js_1 = require("./strategies/GitHubActions.js");
const Console_js_1 = require("./strategies/Console.js");
const index_js_1 = require("../../adapters/Logging/index.js");
exports.summaryOutput = {
    strategise(_config) {
        // Select based on environment
        const summaryConfig = {
            kind: process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'console',
        };
        if (summaryConfig.kind === 'github-actions') {
            const logger = new index_js_1.GitHubActionsLogger();
            return new GitHubActions_js_1.GitHubActions(summaryConfig, logger);
        }
        else {
            const logger = new index_js_1.ConsoleLogger();
            return new Console_js_1.Console(summaryConfig, logger);
        }
    },
};
//# sourceMappingURL=objective.js.map