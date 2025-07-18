"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseVersionBumpStrategy = void 0;
/**
 * Abstract base class for version bump strategies.
 * Implements the Strategy pattern for handling different version bumping approaches.
 */
class BaseVersionBumpStrategy {
    name;
    constructor(name) {
        this.name = name;
    }
}
exports.BaseVersionBumpStrategy = BaseVersionBumpStrategy;
//# sourceMappingURL=base.js.map