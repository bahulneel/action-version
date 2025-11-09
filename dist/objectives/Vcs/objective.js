"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vcsObjective = void 0;
const Git_js_1 = require("./strategies/Git.js");
exports.vcsObjective = {
    strategise(config) {
        // Currently only Git is supported; future: could branch on config.vcsKind
        return new Git_js_1.Git(config);
    },
};
//# sourceMappingURL=objective.js.map