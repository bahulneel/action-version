"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageManagement = void 0;
const node_path_1 = __importDefault(require("node:path"));
const Npm_js_1 = require("./strategies/Npm.js");
const Yarn_js_1 = require("./strategies/Yarn.js");
const Pnpm_js_1 = require("./strategies/Pnpm.js");
exports.packageManagement = {
    strategise(_config) {
        // Detect package manager from lockfiles synchronously
        const cwd = process.cwd();
        const fs = require('node:fs');
        const exists = (p) => {
            try {
                fs.accessSync(p);
                return true;
            }
            catch {
                return false;
            }
        };
        let kind = 'npm';
        if (exists(node_path_1.default.join(cwd, 'pnpm-lock.yaml'))) {
            kind = 'pnpm';
        }
        else if (exists(node_path_1.default.join(cwd, 'yarn.lock'))) {
            kind = 'yarn';
        }
        else if (exists(node_path_1.default.join(cwd, 'package-lock.json'))) {
            kind = 'npm';
        }
        const pmConfig = { kind };
        switch (kind) {
            case 'pnpm':
                return new Pnpm_js_1.Pnpm(pmConfig);
            case 'yarn':
                return new Yarn_js_1.Yarn(pmConfig);
            case 'npm':
            default:
                return new Npm_js_1.Npm(pmConfig);
        }
    },
};
//# sourceMappingURL=objective.js.map