"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleGit = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
/**
 * SimpleGit adapter implementation.
 * Wraps the simple-git library to implement the Git interface.
 */
class SimpleGit {
    git = (0, simple_git_1.default)();
    // Branch operations
    async branch(options) {
        const result = await this.git.branch(options);
        return {
            all: result.all,
            current: result.current,
        };
    }
    async checkout(ref) {
        if (Array.isArray(ref)) {
            await this.git.checkout(ref);
        }
        else {
            await this.git.checkout(ref);
        }
    }
    async deleteLocalBranch(branchName, force = false) {
        await this.git.deleteLocalBranch(branchName, force);
    }
    // Commit operations
    async add(file) {
        await this.git.add(file);
    }
    async commit(message) {
        await this.git.commit(message);
    }
    // Tag operations
    async tag(options) {
        await this.git.tag(options);
    }
    async addTag(tagName) {
        await this.git.addTag(tagName);
    }
    async pushTags() {
        await this.git.pushTags();
    }
    async tags(options = []) {
        const result = await this.git.tags(options);
        return { latest: result.latest ?? null };
    }
    // Reference operations
    async revparse(refs) {
        return await this.git.revparse(refs);
    }
    async raw(command, ...args) {
        await this.git.raw(command, ...args);
    }
    // Remote operations
    async push(remote, branch, options) {
        if (remote && branch && options) {
            await this.git.push(remote, branch, options);
        }
        else if (remote && branch) {
            await this.git.push(remote, branch);
        }
        else {
            await this.git.push();
        }
    }
    async fetch(options) {
        await this.git.fetch(options);
    }
    // Log operations
    async log(options) {
        const result = await this.git.log(options);
        return { all: [...result.all] };
    }
    async diff(options) {
        return await this.git.diff(options);
    }
    // Configuration
    async addConfig(key, value) {
        await this.git.addConfig(key, value);
    }
}
exports.SimpleGit = SimpleGit;
//# sourceMappingURL=SimpleGit.js.map