import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import type { PackageJson, DependencyGraph, BuildDepGraphResult } from '../types/index.js';
import { Package } from '../domain/package.js';

/**
 * Read and parse a JSON file.
 */
export async function readJSON<T = PackageJson>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
}

/**
 * Write a JSON object to a file with proper formatting.
 */
export async function writeJSON(filePath: string, data: any): Promise<void> {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await require('node:fs/promises').writeFile(filePath, content, 'utf8');
}

/**
 * Get package directories from workspace configuration.
 */
export async function getPackageDirs(rootPkg: PackageJson): Promise<string[]> {
  if (rootPkg.workspaces) {
    // Support both array and object form
    const patterns = Array.isArray(rootPkg.workspaces)
      ? rootPkg.workspaces
      : rootPkg.workspaces.packages;

    const dirs = new Set<string>();
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, { 
        cwd: process.cwd(), 
        absolute: true,
      });
      
      for (const match of matches) {
        // Only include dirs with package.json
        try {
          await access(path.join(match, 'package.json'));
          dirs.add(path.resolve(match));
        } catch {
          // Directory doesn't contain package.json, skip it
        }
      }
    }
    
    return Array.from(dirs);
  } else {
    // Single package repository
    return [process.cwd()];
  }
}

/**
 * Build a dependency graph for workspace packages.
 */
export async function buildDepGraph(pkgDirs: readonly string[]): Promise<BuildDepGraphResult> {
  const graph: DependencyGraph = {};
  const nameToDir: Record<string, string> = {};

  // First pass: read all packages
  for (const dir of pkgDirs) {
    const pkg = await readJSON<PackageJson>(path.join(dir, 'package.json'));
    graph[pkg.name] = { dir, deps: [], pkg };
    nameToDir[pkg.name] = dir;
  }

  // Second pass: build dependency relationships
  for (const name in graph) {
    const { pkg } = graph[name]!;
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    const deps: string[] = [];
    for (const depName in allDeps) {
      if (graph[depName]) {
        deps.push(depName);
      }
    }

    graph[name] = { ...graph[name]!, deps };
  }

  return { graph, nameToDir };
}

/**
 * Topologically sort packages based on their dependencies.
 */
export function topoSort(graph: DependencyGraph): string[] {
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(name: string): void {
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
export async function createWorkspacePackages(rootPkg: PackageJson): Promise<Package[]> {
  const pkgDirs = await getPackageDirs(rootPkg);
  const { graph } = await buildDepGraph(pkgDirs);
  const order = topoSort(graph);

  const packages = await Promise.all(
    order.map(async (name) => {
      const { dir, pkg } = graph[name]!;
      const packageJsonPath = path.join(dir, 'package.json');
      return new Package(name, dir, pkg, packageJsonPath);
    })
  );

  return packages;
}

/**
 * Check if a directory is a valid package directory.
 */
export async function isPackageDirectory(dir: string): Promise<boolean> {
  try {
    const packageJsonPath = path.join(dir, 'package.json');
    await access(packageJsonPath);
    
    // Try to read and parse the package.json
    const pkg = await readJSON<PackageJson>(packageJsonPath);
    return typeof pkg.name === 'string' && pkg.name.length > 0;
  } catch {
    return false;
  }
}

/**
 * Find the root package.json file.
 */
export async function findRootPackage(): Promise<{ pkg: PackageJson; path: string }> {
  const rootPath = path.join(process.cwd(), 'package.json');
  const pkg = await readJSON<PackageJson>(rootPath);
  return { pkg, path: rootPath };
}

/**
 * Check if the workspace is a monorepo.
 */
export function isMonorepo(rootPkg: PackageJson): boolean {
  return Boolean(rootPkg.workspaces);
}

/**
 * Get workspace package count.
 */
export async function getWorkspacePackageCount(rootPkg: PackageJson): Promise<number> {
  if (!isMonorepo(rootPkg)) {
    return 1; // Single package
  }
  
  const pkgDirs = await getPackageDirs(rootPkg);
  return pkgDirs.length;
}