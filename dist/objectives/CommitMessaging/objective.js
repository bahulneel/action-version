"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitMessaging = void 0;
const Conventional_js_1 = require("./strategies/Conventional.js");
const Simple_js_1 = require("./strategies/Simple.js");
exports.commitMessaging = {
    strategise(_config) {
        // Map ActionConfiguration to CommitMessagingConfig
        // Default to conventional for now; could extend config to specify
        const commitConfig = {
            kind: 'conventional',
        };
        if (commitConfig.kind === 'conventional') {
            return new Conventional_js_1.Conventional(commitConfig);
        }
        else {
            return new Simple_js_1.Simple(commitConfig);
        }
    },
};
//# sourceMappingURL=objective.js.map