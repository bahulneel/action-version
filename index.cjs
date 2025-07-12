require('source-map-support').install()
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

function bumpPriority(type) {
  if (type === 'major') return 3;
  if (type === 'minor') return 2;
  return 1;
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

async function getCommitsAffecting(dir, sinceRef) {
  // Get all commits affecting this dir since the last tag
  let range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
  const log = execSync(`git log ${range} --pretty=medium -- ${dir}`, { encoding: 'utf8' });
  const commits = parseCommits(log);
  core.info(`[${path.relative(process.cwd(), dir) || '/'}] ${commits.length} commits affecting since ${sinceRef}`);
  return commits;
}

async function commitAndPush(dir, msg) {
  await git.add([path.join(dir, 'package.json')]);
  await git.commit(msg);
}

async function tagVersion(lastTag, version) {
  const tagName = `v${version}`;
  if (!version) {
    core.warning('No version found, skipping tag');
    return;
  }
  if (lastTag && lastTag === tagName) {
    core.info(`Skipping tag ${tagName} because it already exists`);
    return;
  }
  core.info(`Tagging ${version}`);
  await git.addTag(tagName);
}

async function install(dir, packageManager) {
  const result = spawnSync(packageManager, ['install'], { cwd: dir, stdio: 'inherit' });
  return result.status === 0;
}

async function runTest(dir, packageManager) {
  try {
    if (!await install(dir, packageManager)) return false;
    const result = spawnSync(packageManager, ['test'], { cwd: dir, stdio: 'inherit' });
    return result.status === 0;
  } catch {
    return false;
  }
}

async function lastVersionChange(git, file) {
  // Return the git tag or sha of the last commit as a reference to the version
  const commits = await git.log(['-L', `/version/:${file}`, '-n1', '--no-patch']);
  core.info(`[${path.relative(process.cwd(), file) || '/'}] Last version change: ${commits.latest.hash}`);
  return commits.latest.hash;
}

async function lastBumpType(commits) {
  const lastBumpType = commits.find(c => /chore\(release\): bump/.test(c.header))?.header.match(/\((major|minor|patch)\)/)?.[1];
  if (!lastBumpType) return null;
  return lastBumpType;
}

async function hasAlreadyBumped(commits, requiredBump) {
  const bumpType = await lastBumpType(commits);
  if (!bumpType) return false;
  return bumpPriority(requiredBump) <= bumpPriority(bumpType);
}

function guessBumpType(version) {
  if (version.endsWith('.0.0')) return 'major';
  if (version.endsWith('.0')) return 'minor';
  return 'patch';
}

function deleteRemoteBranch(branch) {
  try {
    execSync(`git push origin --delete ${branch}`);
  } catch { }
}

async function main() {
  let exitCode = 0;
  let targetBranch = undefined;
  try {
    const commitMsgTemplate = core.getInput('commit_message_template') || 'chore(release): bump ${package} to ${version} (${bumpType})';
    const depCommitMsgTemplate = core.getInput('dep_commit_message_template') || 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)';
    const rootDir = process.cwd();
    const rootPkg = await readJSON(path.join(rootDir, 'package.json'));
    const packageManager = getPackageManager();

    await git.addConfig('user.name', 'github-actions[bot]');
    await git.addConfig('user.email', 'github-actions[bot]@users.noreply.github.com');
    const shouldCreateBranch = core.getInput('branch') || false;
    const branchTemplate = core.getInput('branch_template') || 'release/${version}';
    const templateRegex = new RegExp(branchTemplate.replace(/\$\{(\w+)\}/g, '(?<$1>\\w+)'));
    const branchDeletion = core.getInput('branch_deletion') || 'keep';

    const branch =
      process.env.GITHUB_HEAD_REF ||
      process.env.GITHUB_REF_NAME ||
      'main'; // fallback

    targetBranch = shouldCreateBranch ? interpolate(branchTemplate, {
      version: branch
    }) : undefined;

    await git.fetch(['--prune', 'origin']);
    if (targetBranch) {
      core.info(`[root] Checking out ${targetBranch} from ${branch}`);
      await git.checkoutBranch(targetBranch, branch);
    } else {
      await git.checkout(branch);
    }
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
      const packageJsonPath = path.join(dir, 'package.json');
      const sha = await lastVersionChange(git, packageJsonPath);

      const commits = await getCommitsAffecting(dir, sha);
      const requiredBump = getMostSignificantBump(commits);
      // Detect if a version bump has already been made
      const alreadyBumped = await hasAlreadyBumped(commits, requiredBump);
      // If the required bump is less than or equal to the last bump, skip
      if (alreadyBumped) {
        core.info(`[${name}] Skipping ${pkg.name} because it has already been bumped to ${requiredBump}`);
        bumped[name] = { version: pkg.version, bumpType: await lastBumpType(commits), sha };
        continue; // Skip bumping this package
      }
      if (requiredBump === 'patch' && commits.length === 0) continue; // No changes
      const newVersion = bumpVersion(pkg.version, requiredBump);
      pkg.version = newVersion;
      await writeJSON(packageJsonPath, pkg);
      const msg = interpolate(commitMsgTemplate, { package: pkg.name, version: newVersion, bumpType: requiredBump });
      await commitAndPush(dir, msg);
      bumped[name] = { version: newVersion, bumpType: requiredBump, sha };
      core.info(`[${name}] Bumped ${pkg.name} to ${newVersion}`);
    }

    // 6. For each dependent, update dependency, patch bump, commit, push, run tests if breaking
    for (const name of order) {
      core.info(`[${name}] Bumping dependencies`);
      let isMajor = false;
      const { dir, pkg } = graph[name];
      const deps = new Map()
      const msgs = []
      Object.entries(pkg.dependencies || {}).forEach(([dep, currentVersion]) => {
        if (typeof bumped[dep] !== 'object') return;
        if (currentVersion === '*' || currentVersion === bumped[dep].version) return;
        deps.set(['dependencies', dep], { currentVersion, bumpedVersion: bumped[dep].version });
      })
      Object.entries(pkg.devDependencies || {}).forEach(([dep, currentVersion]) => {
        if (typeof bumped[dep] !== 'object') return;
        if (currentVersion === '*' || currentVersion === bumped[dep].version) return;
        deps.set(['devDependencies', dep], { currentVersion, bumpedVersion: bumped[dep].version });
      })
      Object.entries(pkg.peerDependencies || {}).forEach(([dep, currentVersion]) => {
        if (typeof bumped[dep] !== 'object') return;
        if (currentVersion === '*' || currentVersion === bumped[dep].version) return;
        deps.set(['peerDependencies', dep], { currentVersion, bumpedVersion: bumped[dep].version });
      })
      for (const [key, { currentVersion, bumpedVersion }] of deps) {
        core.info(`[${pkg.name}] Bumping ${name} from ${currentVersion} to ${bumpedVersion}`);
        pkg[key][dep] = `^${bumpedVersion}`;
        msgs.push(interpolate(depCommitMsgTemplate, {
          package: pkg.name,
          depPackage: dep,
          depVersion: bumped[dep].version,
          version: pkg.version,
          bumpType: 'patch',
        }));
        if (bumped[dep].bumpType === 'major') isMajor = true;
      }
      if (!msgs.length) continue;
      pkg.version = bumpVersion(pkg.version, 'patch');

      if (!bumped[pkg.name]) {
        const sha = await lastVersionChange(git, path.join(dir, 'package.json'));
        bumped[pkg.name] = { version: pkg.version, bumpType: 'patch', sha };
      }
      await writeJSON(path.join(dir, 'package.json'), pkg);
      const msg = msgs.join('\n');
      if (isMajor) {
        core.info(`[${pkg.name}] Some deps have major bump, running tests`);
        const ok = await runTest(dir, packageManager);
        if (!ok) testFailures.push(pkg.name);
      }
      core.info(`[${pkg.name}] Committing and pushing`);
      await commitAndPush(dir, msg);
    }

    // 7. Aggregate and bump meta-package if needed
    if (rootPkg.workspaces) {
      async function bumpRoot() {
        core.info(`[root] Bumping root package`);
        // Aggregate most significant bump
        let rootBump = 'patch';
        const rootPackageJsonPath = path.join(rootDir, 'package.json');
        for (const name in bumped) {
          if (bumpPriority(rootBump) < bumpPriority(bumped[name].bumpType)) {
            rootBump = bumped[name].bumpType;
          }
        }
        const rootSha = await lastVersionChange(git, rootPackageJsonPath);
        const commits = await getCommitsAffecting(rootDir, rootSha);
        const alreadyBumped = await hasAlreadyBumped(commits, rootBump);
        if (alreadyBumped) {
          core.info(`[root] Skipping root package because it has already been bumped to ${rootBump}`);
          return;
        }
        rootPkg.version = bumpVersion(rootPkg.version, rootBump);
        await writeJSON(rootPackageJsonPath, rootPkg);
        const msg = interpolate(commitMsgTemplate, { package: rootPkg.name || 'root', version: rootPkg.version, bumpType: rootBump });
        await commitAndPush(rootDir, msg);
        core.info(`[root@${rootPkg.version}] Bumped to ${rootPkg.version}`);
        bumped[rootPkg.name] = { ...bumped[rootPkg.name], version: rootPkg.version, bumpType: rootBump };
      }
      await bumpRoot()
    } else if (rootPkg.name && rootPkg.name in bumped) {
      core.info(`[root] Root was bumped in a previous step`);
      rootPkg.version = bumped[rootPkg.name].version;
    }
    // 8. Handle test failures
    if (testFailures.length > 0) {
      throw new Error(`Test failures in: ${testFailures.join(', ')}`);
    }

    core.summary.addTable([
      [
        { data: 'Package', header: true },
        { data: 'Version', header: true },
        { data: 'Bump Type', header: true },
        { data: 'Previous Commit', header: true },
        { data: 'OK', header: true }
      ],
      ...Object.entries(bumped).map(([name, { version, bumpType, sha }]) => [
        { data: name },
        { data: version },
        { data: bumpType },
        { data: sha?.slice(0, 7) || 'N/A' },
        { data: testFailures.includes(name) ? ':x:' : ':white_check_mark:' }
      ]),
    ]);
    if (targetBranch) {
      const versionedBranch = interpolate(branchTemplate, {
        version: rootPkg.version
      })
      core.info(`[root] Checking out ${versionedBranch} from ${targetBranch}`);
      const remoteVersionedBranch = `origin/${versionedBranch}`;
      const branches = await git.branch(['--list', '--remote']);
      if (branches.all.includes(remoteVersionedBranch)) {
        core.info(`[root] Deleting ${remoteVersionedBranch}`);
        try {
          await git.deleteLocalBranch(remoteVersionedBranch, true);
        } catch { }
        try {
          await git.deleteRemoteBranch(remoteVersionedBranch);
        } catch { }
      }
      core.info(`[root] Checking out ${versionedBranch} from ${targetBranch}`);
      await git.checkoutBranch(versionedBranch, targetBranch);
      core.info(`[root] Deleting ${targetBranch}`);
      await git.deleteLocalBranch(targetBranch, true);
      targetBranch = versionedBranch;
      core.info(`[root] Branch deletion strategy: ${branchDeletion} using ${templateRegex.source}`);
      if (branchDeletion === 'prune' || branchDeletion === 'semantic') {
        for (const branch of branches.all) {
          if (branch.replace('origin/', '') === versionedBranch) {
            continue
          }
          const match = branch.match(templateRegex);
          const { version } = match?.groups || {};
          if (version) {
            core.info(`[root] Considering deleting ${branch}`);
            const bumpType = guessBumpType(version);
            if (branchDeletion === 'semantic' && bumpType !== rootBump) {
              continue;
            }
            core.info(`[root] Deleting ${branch}`);
            try {
              await git.deleteLocalBranch(branch, true);
            } catch { }
            try {
              deleteRemoteBranch(branch.replace('origin/', ''));
            } catch { }
          }
        }
      }
    } else {
      const lastTag = await git.tags(['--sort=-v:refname']).latest;
      await tagVersion(lastTag, rootPkg.version);
    }
    core.info('Version bump action completed successfully.');
  } catch (err) {
    console.error(err);
    core.setFailed(err.message);
    exitCode = 1;
  } finally {
    if (targetBranch) {
      core.info(`[root] Pushing ${targetBranch}`);
      await git.push('origin', targetBranch, ['--set-upstream', '--force']);
    } else {
      core.info(`[root] Pushing current branch and tags`);
      await git.push();
      await git.pushTags();
    }
  }
  console.log(core.summary.stringify());
  core.summary.write({ overwrite: true });
  process.exit(exitCode);
}

main(); 