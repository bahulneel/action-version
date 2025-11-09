"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simple = void 0;
const parse_commits_js_1 = require("../maneuvers/parse-commits.js");
/**
 * Simple commit messaging strategy.
 * Uses basic formatting without conventional commit requirements.
 */
class Simple {
    name = 'simple';
    description = 'Simple commit format';
    constructor(_config) { }
    async parseCommits(logEntries, sinceRef) {
        // Use parseCommits maneuver (same fallback chain as conventional)
        const result = await parse_commits_js_1.parseCommits.execute({
            logEntries,
            ...(sinceRef !== undefined && { sinceRef }),
        });
        if (result.success && result.result) {
            return result.result;
        }
        // Return empty array if all tactics fail
        return [];
    }
    async formatVersion(context) {
        const prefix = context.packageName === 'root' ? '' : `[${context.packageName}] `;
        return `${prefix}Bump version to ${context.version}`;
    }
    async formatDependency(context) {
        const prefix = context.packageName === 'root' ? '' : `[${context.packageName}] `;
        return `${prefix}Update ${context.depName} to ${context.depVersion}`;
    }
}
exports.Simple = Simple;
//# sourceMappingURL=Simple.js.map