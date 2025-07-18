"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePackageManagerStrategy = void 0;
/**
 * Abstract base class for package manager strategies.
 * Implements the Strategy pattern for handling different package managers.
 */
class BasePackageManagerStrategy {
    name;
    constructor(name) {
        this.name = name;
    }
}
exports.BasePackageManagerStrategy = BasePackageManagerStrategy;
//# sourceMappingURL=base.js.map