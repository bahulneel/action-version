"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelInference = void 0;
const GitBasedInference_js_1 = require("./strategies/GitBasedInference.js");
exports.modelInference = {
    strategise(_config) {
        // Currently only one strategy, but structure allows for future expansion
        return new GitBasedInference_js_1.GitBasedInference();
    },
};
//# sourceMappingURL=objective.js.map