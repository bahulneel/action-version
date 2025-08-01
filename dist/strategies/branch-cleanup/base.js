"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseBranchCleanupStrategy = void 0;
/**
 * Abstract base class for branch cleanup strategies.
 * Implements the Strategy pattern for handling different branch cleanup approaches.
 */
class BaseBranchCleanupStrategy {
    name;
    constructor(name) {
        this.name = name;
    }
}
exports.BaseBranchCleanupStrategy = BaseBranchCleanupStrategy;
//# sourceMappingURL=base.js.map