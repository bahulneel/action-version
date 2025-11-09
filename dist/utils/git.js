"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitsAffecting = getCommitsAffecting;
const simple_git_1 = __importDefault(require("simple-git"));
const git = (0, simple_git_1.default)();
/**
 * Get commits affecting a specific directory.
 */
async function getCommitsAffecting(dir, sinceRef) {
    const logArgs = sinceRef ? [`${sinceRef}..HEAD`, '--', dir] : ['--all', '--', dir];
    const log = await git.log(logArgs);
    return log.all;
}
//# sourceMappingURL=git.js.map