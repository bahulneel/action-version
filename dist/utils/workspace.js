"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJSON = readJSON;
exports.writeJSON = writeJSON;
exports.getPackageDirs = getPackageDirs;
exports.buildDepGraph = buildDepGraph;
exports.topoSort = topoSort;
exports.createWorkspacePackages = createWorkspacePackages;
exports.isPackageDirectory = isPackageDirectory;
exports.findRootPackage = findRootPackage;
exports.isMonorepo = isMonorepo;
exports.getWorkspacePackageCount = getWorkspacePackageCount;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const glob_1 = require("glob");
const package_js_1 = require("../domain/package.js");
/**
 * Read and parse a JSON file.
 */
async function readJSON(filePath) {
    const content = await (0, promises_1.readFile)(filePath, 'utf8');
    return JSON.parse(content);
}
/**
 * Write a JSON object to a file with proper formatting.
 */
async function writeJSON(filePath, data) {
    const content = `${JSON.stringify(data, null, 2)}\n`;
    await require('node:fs/promises').writeFile(filePath, content, 'utf8');
}
/**
 * Get package directories from workspace configuration.
 */
async function getPackageDirs(rootPkg) {
    if (rootPkg.workspaces) {
        // Support both array and object form
        const patterns = Array.isArray(rootPkg.workspaces)
            ? rootPkg.workspaces
            : rootPkg.workspaces.packages;
        const dirs = new Set();
        for (const pattern of patterns) {
            const matches = await (0, glob_1.glob)(pattern, {
                cwd: process.cwd(),
                absolute: true,
            });
            for (const match of matches) {
                // Only include dirs with package.json
                try {
                    await (0, promises_1.access)(node_path_1.default.join(match, 'package.json'));
                    dirs.add(node_path_1.default.resolve(match));
                }
                catch {
                    // Directory doesn't contain package.json, skip it
                }
            }
        }
        return Array.from(dirs);
    }
    else {
        // Single package repository
        return [process.cwd()];
    }
}
/**
 * Build a dependency graph for workspace packages.
 */
async function buildDepGraph(pkgDirs) {
    const graph = {};
    const nameToDir = {};
    // First pass: read all packages
    for (const dir of pkgDirs) {
        const pkg = await readJSON(node_path_1.default.join(dir, 'package.json'));
        graph[pkg.name] = { dir, deps: [], pkg };
        nameToDir[pkg.name] = dir;
    }
    // Second pass: build dependency relationships
    for (const name in graph) {
        const { pkg } = graph[name];
        const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
            ...pkg.peerDependencies,
        };
        const deps = [];
        for (const depName in allDeps) {
            if (graph[depName]) {
                deps.push(depName);
            }
        }
        graph[name] = { ...graph[name], deps };
    }
    return { graph, nameToDir };
}
/**
 * Topologically sort packages based on their dependencies.
 */
function topoSort(graph) {
    const visited = new Set();
    const order = [];
    function visit(name) {
        if (visited.has(name)) {
            return;
        }
        visited.add(name);
        const node = graph[name];
        if (node) {
            for (const dep of node.deps) {
                visit(dep);
            }
        }
        order.push(name);
    }
    for (const name in graph) {
        visit(name);
    }
    return order;
}
/**
 * Create Package instances from workspace discovery.
 */
async function createWorkspacePackages(rootPkg) {
    const pkgDirs = await getPackageDirs(rootPkg);
    const { graph } = await buildDepGraph(pkgDirs);
    const order = topoSort(graph);
    const packages = await Promise.all(order.map(async (name) => {
        const { dir, pkg } = graph[name];
        const packageJsonPath = node_path_1.default.join(dir, 'package.json');
        return new package_js_1.Package(name, dir, pkg, packageJsonPath);
    }));
    return packages;
}
/**
 * Check if a directory is a valid package directory.
 */
async function isPackageDirectory(dir) {
    try {
        const packageJsonPath = node_path_1.default.join(dir, 'package.json');
        await (0, promises_1.access)(packageJsonPath);
        // Try to read and parse the package.json
        const pkg = await readJSON(packageJsonPath);
        return typeof pkg.name === 'string' && pkg.name.length > 0;
    }
    catch {
        return false;
    }
}
/**
 * Find the root package.json file.
 */
async function findRootPackage() {
    const rootPath = node_path_1.default.join(process.cwd(), 'package.json');
    const pkg = await readJSON(rootPath);
    return { pkg, path: rootPath };
}
/**
 * Check if the workspace is a monorepo.
 */
function isMonorepo(rootPkg) {
    return Boolean(rootPkg.workspaces);
}
/**
 * Get workspace package count.
 */
async function getWorkspacePackageCount(rootPkg) {
    if (!isMonorepo(rootPkg)) {
        return 1; // Single package
    }
    const pkgDirs = await getPackageDirs(rootPkg);
    return pkgDirs.length;
}
//# sourceMappingURL=workspace.js.map