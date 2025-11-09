"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMostSignificantBump = getMostSignificantBump;
/**
 * Get the most significant bump type from a list of commits.
 */
function getMostSignificantBump(commits) {
    let hasMajor = false;
    let hasMinor = false;
    let hasPatch = false;
    for (const commit of commits) {
        if (commit.breaking) {
            hasMajor = true;
        }
        else if (commit.type === 'feat') {
            hasMinor = true;
        }
        else if (commit.type === 'fix') {
            hasPatch = true;
        }
    }
    if (hasMajor)
        return 'major';
    if (hasMinor)
        return 'minor';
    if (hasPatch)
        return 'patch';
    return null;
}
//# sourceMappingURL=commits.js.map