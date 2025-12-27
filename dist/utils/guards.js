"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBumpType = isBumpType;
exports.isStrategyName = isStrategyName;
exports.isBranchCleanupStrategy = isBranchCleanupStrategy;
exports.isGitOperationStrategyType = isGitOperationStrategyType;
exports.isPackageManagerType = isPackageManagerType;
function isBumpType(value) {
    return ['major', 'minor', 'patch', 'prerelease', 'release'].includes(value);
}
function isStrategyName(value) {
    return ['do-nothing', 'apply-bump', 'pre-release', 'finalize', 'sync'].includes(value);
}
function isBranchCleanupStrategy(value) {
    return ['keep', 'prune', 'semantic'].includes(value);
}
function isGitOperationStrategyType(value) {
    return ['conventional', 'simple'].includes(value);
}
function isPackageManagerType(value) {
    return ['npm', 'yarn', 'pnpm'].includes(value);
}
//# sourceMappingURL=guards.js.map