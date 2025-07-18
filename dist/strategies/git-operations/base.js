"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseGitOperationStrategy = void 0;
/**
 * Abstract base class for git operation strategies.
 * Implements the Strategy pattern for handling different git operation approaches.
 */
class BaseGitOperationStrategy {
    name;
    constructor(name) {
        this.name = name;
    }
}
exports.BaseGitOperationStrategy = BaseGitOperationStrategy;
//# sourceMappingURL=base.js.map