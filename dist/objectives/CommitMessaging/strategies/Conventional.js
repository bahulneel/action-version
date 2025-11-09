"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conventional = void 0;
const parse_commits_js_1 = require("../maneuvers/parse-commits.js");
/**
 * Conventional commit messaging strategy.
 * Uses conventional commit format for parsing and formatting.
 */
class Conventional {
    name = 'conventional';
    description = 'Conventional commit format';
    constructor(_config) { }
    async parseCommits(logEntries, sinceRef) {
        // Use parseCommits maneuver (tries conventional, falls back to best guess)
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
        const scope = context.packageName === 'root' ? '' : `(${context.packageName})`;
        return `chore${scope}: bump to ${context.version}`;
    }
    async formatDependency(context) {
        const scope = context.packageName === 'root' ? '' : `(${context.packageName})`;
        return `chore${scope}: update ${context.depName} to ${context.depVersion}`;
    }
}
exports.Conventional = Conventional;
//# sourceMappingURL=Conventional.js.map