"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceDiscovery = void 0;
const TagDiscovery_js_1 = require("./strategies/TagDiscovery.js");
const BaseBranchDiscovery_js_1 = require("./strategies/BaseBranchDiscovery.js");
exports.referenceDiscovery = {
    strategise(config) {
        // Map ActionConfiguration to ReferenceDiscoveryConfig and select strategy
        const discoveryConfig = {
            kind: config.baseBranch ? 'base-branch' : 'tag',
            ...(config.baseBranch !== undefined && { baseBranch: config.baseBranch }),
        };
        if (discoveryConfig.kind === 'base-branch') {
            return new BaseBranchDiscovery_js_1.BaseBranchDiscovery(discoveryConfig);
        }
        else {
            return new TagDiscovery_js_1.TagDiscovery(discoveryConfig);
        }
    },
};
//# sourceMappingURL=objective.js.map