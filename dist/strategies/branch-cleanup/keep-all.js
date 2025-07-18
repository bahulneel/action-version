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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeepAllBranchesStrategy = void 0;
const core = __importStar(require("@actions/core"));
const base_js_1 = require("./base.js");
/**
 * Keep-all strategy that preserves all version branches.
 * This is the safest option as it doesn't delete any branches.
 */
class KeepAllBranchesStrategy extends base_js_1.BaseBranchCleanupStrategy {
    constructor() {
        super('keep');
    }
    async execute(_branches, _versionedBranch, _templateRegex, _rootBump) {
        core.info(`[root] Branch cleanup strategy: ${this.name} - keeping all branches`);
        // Intentionally empty - keep all branches
    }
}
exports.KeepAllBranchesStrategy = KeepAllBranchesStrategy;
//# sourceMappingURL=keep-all.js.map