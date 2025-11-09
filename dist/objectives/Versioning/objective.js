"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versioning = void 0;
const Semver_js_1 = require("./strategies/Semver.js");
exports.versioning = {
    strategise(config) {
        // Map config.strategy to VersioningConfig and create Semver strategy
        const versioningConfig = {
            approach: config.strategy === 'do-nothing'
                ? 'do-nothing'
                : config.strategy === 'apply-bump'
                    ? 'apply-bump'
                    : 'pre-release',
        };
        return new Semver_js_1.Semver(versioningConfig);
    },
};
//# sourceMappingURL=objective.js.map