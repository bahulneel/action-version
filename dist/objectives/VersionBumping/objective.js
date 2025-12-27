"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionBumping = void 0;
const WorkspaceVersionBump_js_1 = require("./strategies/WorkspaceVersionBump.js");
exports.versionBumping = {
    strategise(config) {
        // Currently only one strategy, but structure allows for future expansion
        return new WorkspaceVersionBump_js_1.WorkspaceVersionBump(config, config.gitStrategy, config.packageManager);
    },
};
//# sourceMappingURL=objective.js.map