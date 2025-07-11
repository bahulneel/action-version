// index.js
const core = require('@actions/core');
const fs = require('fs/promises');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const simpleGit = require('simple-git');
const { globSync } = require('glob');
const conventionalCommitsParser = require('conventional-commits-parser');

const git = simpleGit();

function interpolate(template, vars) {
  return template.replace(/\$\{(\w+)\}/g, (_, v) => vars[v] ?? '');
}

function getPackageManager() {
  // Prefer yarn if yarn.lock exists, else npm
  if (fs.stat(path.join(process.cwd(), 'yarn.lock')).catch(() => false)) return 'yarn';
  return 'npm';
}

async function readJSON(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function bumpVersion(version, type) {
  let [major, minor, patch] = version.split('.').map(Number);
  if (type === 'major') {
    major++;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor++;
    patch = 0;
  } else {
    patch++;
  }
  return `${major}.${minor}.${patch}`;
}

function getMostSignificantBump(commits) {
  let bump = 'patch';
  for (const c of commits) {
    if (c.breaking) return 'major';
    if (c.type === 'feat' && bump !== 'major') bump = 'minor';
  }
  return bump;
}

function parseCommits(log) {
  const commits = [];
  for (const entry of log.split(/^commit /gm).slice(1)) {
    const lines = entry.split('\n');
    const message = lines.slice(4).join('\n').trim();
    const parsed = conventionalCommitsParser.sync(message);
    const breaking = Boolean(parsed.notes && parsed.notes.find(n => n.title === 'BREAKING CHANGE')) || /!:/g.test(parsed.header);
    commits.push({
      type: parsed.type,
      scope: parsed.scope,
      subject: parsed.subject,
      breaking,
      header: parsed.header,
    });
  }
  return commits;
}

async function getPackageDirs(rootPkg) {
  if (rootPkg.workspaces) {
    // Support both array and object form
    const patterns = Array.isArray(rootPkg.workspaces)
      ? rootPkg.workspaces
      : rootPkg.workspaces.packages;
    const dirs = new Set();
    for (const pattern of patterns) {
      for (const match of globSync(pattern, { cwd: process.cwd(), absolute: true })) {
        // Only include dirs with package.json
        try {
          await fs.access(path.join(match, 'package.json'));
          dirs.add(path.resolve(match));
        } catch { }
      }
    }
    return Array.from(dirs);
  } else {
    return [process.cwd()];
  }
}

async function buildDepGraph(pkgDirs) {
  const graph = {};
  const nameToDir = {};
  for (const dir of pkgDirs) {
    const pkg = await readJSON(path.join(dir, 'package.json'));
    graph[pkg.name] = { dir, deps: [], pkg };
    nameToDir[pkg.name] = dir;
  }
  for (const name in graph) {
    const { pkg } = graph[name];
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    for (const dep in allDeps) {
      if (graph[dep]) graph[name].deps.push(dep);
    }
  }
  return { graph, nameToDir };
}

function topoSort(graph) {
  const visited = new Set();
  const order = [];
  function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);
    for (const dep of graph[name].deps) visit(dep);
    order.push(name);
  }
  for (const name in graph) visit(name);
  return order;
}

async function getCommitsAffecting(dir, sinceTag) {
  // Get all commits affecting this dir since the last tag
  let range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD';
  const log = execSync(`git log ${range} --pretty=medium -- ${dir}`, { encoding: 'utf8' });
  return parseCommits(log);
}

async function getLastTag(pkgName) {
  // Try to find the last tag for this package
  try {
    const tags = execSync('git tag', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .filter(t => t.startsWith(`${pkgName}@`));
    return tags.sort().pop();
  } catch {
    return null;
  }
}

async function commitAndPush(dir, msg, version) {
  await git.add([path.join(dir, 'package.json')]);
  await git.commit(msg);
  await git.push();
  if (version) {
    core.info(`Tagging ${version}`);
    await git.tag(`v${version}`);
    await git.pushTags('origin');
  }
}

async function runTest(dir, packageManager) {
  try {
    const result = spawnSync(packageManager, ['test'], { cwd: dir, stdio: 'inherit' });
    return result.status === 0;
  } catch {
    return false;
  }
}

async function main() {
  try {
    const commitMsgTemplate = core.getInput('commit-message-template') || 'chore(release): bump ${package} to ${version} (${bumpType})';
    const depCommitMsgTemplate = core.getInput('dep-commit-message-template') || 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)';
    const tagVersion = core.getInput('tag-version') === 'true';
    const rootDir = process.cwd();
    const rootPkg = await readJSON(path.join(rootDir, 'package.json'));
    const packageManager = (await fs.stat(path.join(rootDir, 'yarn.lock')).catch(() => false)) ? 'yarn' : 'npm';

    // 1. Discover all packages
    const pkgDirs = await getPackageDirs(rootPkg);
    // 2. Build dependency graph
    const { graph, nameToDir } = await buildDepGraph(pkgDirs);
    // 3. Topological sort
    const order = topoSort(graph);
    // 4. Track which packages were bumped and their new versions
    const bumped = {};
    let testFailures = [];

    // 5. For each package, determine bump, update, commit, push
    for (const name of order) {
      const { dir, pkg } = graph[name];
      const lastTag = await getLastTag(pkg.name);
      const commits = await getCommitsAffecting(dir, lastTag);
      const bumpType = getMostSignificantBump(commits);
      if (bumpType === 'patch' && commits.length === 0) continue; // No changes
      const newVersion = bumpVersion(pkg.version, bumpType);
      pkg.version = newVersion;
      await writeJSON(path.join(dir, 'package.json'), pkg);
      const msg = interpolate(commitMsgTemplate, { package: pkg.name, version: newVersion, bumpType });
      const version = tagVersion && !rootPkg.workspaces ? newVersion : undefined;
      await commitAndPush(dir, msg, version);
      bumped[name] = { version: newVersion, bumpType };
    }

    // 6. For each dependent, update dependency, patch bump, commit, push, run tests if breaking
    for (const name of order) {
      const { dir, pkg } = graph[name];
      for (const dep in { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }) {
        if (bumped[dep] && pkg.dependencies && pkg.dependencies[dep] && pkg.dependencies[dep] !== '*') {
          // Update dependency version
          pkg.dependencies[dep] = `^${bumped[dep].version}`;
          // Patch bump
          const oldVersion = pkg.version;
          pkg.version = bumpVersion(pkg.version, 'patch');
          await writeJSON(path.join(dir, 'package.json'), pkg);
          const msg = interpolate(depCommitMsgTemplate, {
            package: pkg.name,
            depPackage: dep,
            depVersion: bumped[dep].version,
            version: pkg.version,
            bumpType: 'patch',
          });
          await commitAndPush(dir, msg);
          // If breaking, run tests
          if (bumped[dep].bumpType === 'major') {
            const ok = await runTest(dir, packageManager);
            if (!ok) testFailures.push(pkg.name);
          }
        }
      }
    }

    // 7. Aggregate and bump meta-package if needed
    if (rootPkg.workspaces) {
      // Aggregate most significant bump
      let rootBump = 'patch';
      for (const name in bumped) {
        if (bumped[name].bumpType === 'major') rootBump = 'major';
        else if (bumped[name].bumpType === 'minor' && rootBump !== 'major') rootBump = 'minor';
      }
      if (rootBump !== 'patch') {
        rootPkg.version = bumpVersion(rootPkg.version, rootBump);
        await writeJSON(path.join(rootDir, 'package.json'), rootPkg);
        const msg = interpolate(commitMsgTemplate, { package: rootPkg.name || 'root', version: rootPkg.version, bumpType: rootBump });
        const version = tagVersion ? rootPkg.version : undefined;
        await commitAndPush(rootDir, msg, version);
      }
    }

    // 8. Handle test failures
    if (testFailures.length > 0) {
      core.setFailed(`Test failures in: ${testFailures.join(', ')}`);
      process.exit(1);
    }
    core.info('Version bump action completed successfully.');
  } catch (err) {
    core.setFailed(err.message);
    process.exit(1);
  }
}

main(); 