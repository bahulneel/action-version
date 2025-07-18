import type { PackageJson, DependencyGraph, BuildDepGraphResult } from '../types/index.js';
import { Package } from '../domain/package.js';
/**
 * Read and parse a JSON file.
 */
export declare function readJSON<T = PackageJson>(filePath: string): Promise<T>;
/**
 * Write a JSON object to a file with proper formatting.
 */
export declare function writeJSON(filePath: string, data: any): Promise<void>;
/**
 * Get package directories from workspace configuration.
 */
export declare function getPackageDirs(rootPkg: PackageJson): Promise<string[]>;
/**
 * Build a dependency graph for workspace packages.
 */
export declare function buildDepGraph(pkgDirs: readonly string[]): Promise<BuildDepGraphResult>;
/**
 * Topologically sort packages based on their dependencies.
 */
export declare function topoSort(graph: DependencyGraph): string[];
/**
 * Create Package instances from workspace discovery.
 */
export declare function createWorkspacePackages(rootPkg: PackageJson): Promise<Package[]>;
/**
 * Check if a directory is a valid package directory.
 */
export declare function isPackageDirectory(dir: string): Promise<boolean>;
/**
 * Find the root package.json file.
 */
export declare function findRootPackage(): Promise<{
    pkg: PackageJson;
    path: string;
}>;
/**
 * Check if the workspace is a monorepo.
 */
export declare function isMonorepo(rootPkg: PackageJson): boolean;
/**
 * Get workspace package count.
 */
export declare function getWorkspacePackageCount(rootPkg: PackageJson): Promise<number>;
//# sourceMappingURL=workspace.d.ts.map