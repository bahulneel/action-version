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

const depKeys = ['dependencies', 'devDependencies', 'peerDependencies'];

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
  if (type === 'patch') return 1;
  return 0;
}

function parseCommits(log, sinceRef) {
  const commits = [];
  for (const entry of log) {
    const messageHeader = entry.message.split('\n')[0];
    if (sinceRef && entry.hash === sinceRef) {
      core.debug(`Skipping commit ${entry.hash} because it is the same as the sinceRef: ${messageHeader}`);
      continue;
    }
    core.debug(`Parsing commit ${entry.hash}: ${messageHeader}`);
    const parsed = conventionalCommitsParser.sync(entry.message);
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
  // Get all commits affecting this dir since the reference
  let range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
  const log = await git.log([range, '--', dir]);
  const commits = parseCommits(log.all, sinceRef);
  core.info(`[${path.relative(process.cwd(), dir) || '/'}] ${commits.length} commits affecting since ${sinceRef}`);
  return commits;
}

async function commit(dir, msg) {
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

// Simplified: Find when a package version was last changed
async function getLastVersionChangeCommit(packageJsonPath) {
  try {
    // Use git log to find the last commit that changed the version field
    const commits = await git.log(['-L', '/version/:' + packageJsonPath, '-n1', '--no-patch']);
    if (commits.latest) {
      core.info(`[${path.relative(process.cwd(), packageJsonPath)}] Last version change: ${commits.latest.hash}`);
      return commits.latest.hash;
    }
  } catch (error) {
    core.debug(`Could not find version change for ${packageJsonPath}: ${error.message}`);
  }
  
  // Fallback: use file creation
  try {
    const commits = await git.log(['-n1', '--no-patch', '--', packageJsonPath]);
    if (commits.latest) {
      core.info(`[${path.relative(process.cwd(), packageJsonPath)}] Using file creation: ${commits.latest.hash}`);
      return commits.latest.hash;
    }
  } catch (error) {
    throw new Error(`Could not establish base commit for ${packageJsonPath}: ${error.message}`);
  }
}

// Get version at a specific commit
async function getVersionAtCommit(packageJsonPath, commitRef) {
  try {
    const content = await git.show([`${commitRef}:${path.relative(process.cwd(), packageJsonPath)}`]);
    const pkg = JSON.parse(content);
    return pkg.version;
  } catch (error) {
    core.warning(`Could not get version at commit ${commitRef} for ${packageJsonPath}: ${error.message}`);
    return null;
  }
}

// Calculate bump type between two versions
function calculateBumpType(fromVersion, toVersion) {
  const [fromMajor, fromMinor, fromPatch] = fromVersion.split('.').map(Number);
  const [toMajor, toMinor, toPatch] = toVersion.split('.').map(Number);
  
  if (toMajor > fromMajor) return 'major';
  if (toMinor > fromMinor) return 'minor';
  if (toPatch > fromPatch) return 'patch';
  return null; // No bump
}

// Check if dependency spec is compatible with new version
function isDepCompatible(depSpec, newVersion) {
  if (!depSpec || depSpec === '*') return true;
  
  // Handle different semver ranges
  if (depSpec.startsWith('^')) {
    const [major] = depSpec.substring(1).split('.').map(Number);
    const [newMajor] = newVersion.split('.').map(Number);
    return major === newMajor;
  }
  
  if (depSpec.startsWith('~')) {
    const [major, minor] = depSpec.substring(1).split('.').map(Number);
    const [newMajor, newMinor] = newVersion.split('.').map(Number);
    return major === newMajor && minor === newMinor;
  }
  
  // Exact version or other formats - assume incompatible
  return depSpec === newVersion;
}

function deleteRemoteBranch(branch) {
  try {
    execSync(`git push origin --delete ${branch}`);
  } catch { }
}

async function lastNonMergeCommit(git, branch) {
  const commits = await git.log(['--no-merges', '-n1', branch]);
  return commits.latest.hash;
}

async function main() {
  let exitCode = 0;
  let targetBranch = undefined;
  let hasBumped = false;

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
    const branchTarget = core.getInput('branch_target') || shouldCreateBranch ? 'main' : undefined;

    await git.fetch(['--prune', 'origin']);

    // Step 1: Find starting version number and commit ref
    let referenceCommit;
    let referenceVersion;
    
    if (branchTarget) {
      core.info(`[root] Using branch target: ${branchTarget}`);
      const branch = branchTarget.startsWith('origin/') ? branchTarget : `origin/${branchTarget}`;
      referenceCommit = await lastNonMergeCommit(git, branch);
      referenceCommit = referenceCommit.trim();
      
      // Get root package version at that commit
      const rootPackageJsonPath = path.join(rootDir, 'package.json');
      referenceVersion = await getVersionAtCommit(rootPackageJsonPath, referenceCommit);
      if (!referenceVersion) {
        referenceVersion = rootPkg.version; // fallback
      }
    } else {
      core.info(`[root] Using latest tag as reference`);
      const tags = await git.tags(['--sort=-v:refname']);
      const latestTag = tags.latest;
      if (latestTag) {
        referenceCommit = await git.revparse([latestTag]);
        referenceVersion = latestTag.replace(/^v/, ''); // Remove 'v' prefix if present
      } else {
        // No tags, use first commit
        const firstCommit = await git.log(['--reverse', '--max-count=1']);
        referenceCommit = firstCommit.latest.hash;
        referenceVersion = '0.0.0';
      }
    }
    
    core.info(`[root] Reference: ${referenceCommit} (version: ${referenceVersion})`);

    const branch =
      process.env.GITHUB_HEAD_REF ||
      process.env.GITHUB_REF_NAME ||
      'main'; // fallback

    targetBranch = shouldCreateBranch ? interpolate(branchTemplate, {
      version: branch
    }) : undefined;

    if (targetBranch) {
      core.info(`[root] Checking out ${targetBranch} from ${branch}`);
      await git.checkoutBranch(targetBranch, branch);
    } else {
      await git.checkout(branch);
    }

    // Discover all packages and build dependency graph
    const pkgDirs = await getPackageDirs(rootPkg);
    const { graph, nameToDir } = await buildDepGraph(pkgDirs);
    const order = topoSort(graph);
    
    const bumped = {};
    let testFailures = [];

    // Step 2: For each package, determine if it needs bumping
    for (const name of order) {
      const { dir, pkg } = graph[name];
      const packageJsonPath = path.join(dir, 'package.json');
      
      core.info(`[${name}@${pkg.version}] Processing package`);
      
      // Step 2a: Detect when version was last changed
      const lastVersionCommit = await getLastVersionChangeCommit(packageJsonPath);
      
      // Step 2b: Find changes since last version change
      const commitsSinceVersion = await getCommitsAffecting(dir, lastVersionCommit);
      const commitBasedBump = commitsSinceVersion.length > 0 ? getMostSignificantBump(commitsSinceVersion) : null;
      
      // Step 2c: Calculate historical bump type from reference
      const historicalVersion = await getVersionAtCommit(packageJsonPath, referenceCommit) || referenceVersion;
      const historicalBump = calculateBumpType(historicalVersion, pkg.version);
      
      core.info(`[${name}@${pkg.version}] Commit-based bump: ${commitBasedBump || 'none'}, Historical bump: ${historicalBump || 'none'}`);
      
      // Step 2d: Skip if commit-based bump is less significant than historical
      if (!commitBasedBump || (historicalBump && bumpPriority(commitBasedBump) <= bumpPriority(historicalBump))) {
        core.info(`[${name}@${pkg.version}] Skipping - no significant changes needed`);
        bumped[name] = { version: pkg.version, bumpType: historicalBump || 'none', sha: lastVersionCommit };
        continue;
      }
      
      // Step 2e: Bump the version
      const newVersion = bumpVersion(pkg.version, commitBasedBump);
      pkg.version = newVersion;
      await writeJSON(packageJsonPath, pkg);
      
      const msg = interpolate(commitMsgTemplate, { 
        package: pkg.name, 
        version: newVersion, 
        bumpType: commitBasedBump 
      });
      await commit(dir, msg);
      
      bumped[name] = { version: newVersion, bumpType: commitBasedBump, sha: lastVersionCommit };
      hasBumped = true;
      core.info(`[${name}@${pkg.version}] Bumped to ${newVersion} (${commitBasedBump})`);
      
      // Step 2f: Update dependencies in other packages
      for (const siblingName of order) {
        if (siblingName === name) continue;
        
        const { dir: siblingDir, pkg: siblingPkg } = graph[siblingName];
        let siblingChanged = false;
        
        for (const depKey of depKeys) {
          if (!siblingPkg[depKey] || !siblingPkg[depKey][name]) continue;
          
          const currentDepSpec = siblingPkg[depKey][name];
          
          // Step 2f-i: Skip if not a dependency
          // Step 2f-ii: Check if dependency spec is compatible
          if (!isDepCompatible(currentDepSpec, newVersion)) {
            core.info(`[${siblingName}] Updating ${name} dependency from ${currentDepSpec} to ^${newVersion}`);
            
            // Step 2f-iii: Handle major version bumps with testing
            if (commitBasedBump === 'major') {
              const testPassed = await runTest(siblingDir, packageManager);
              if (!testPassed) {
                core.warning(`[${siblingName}] Tests failed after major bump of ${name}, locking to previous version`);
                siblingPkg[depKey][name] = pkg.version; // Lock to previous version
                testFailures.push(siblingName);
                siblingChanged = true;
                continue;
              }
            }
            
            siblingPkg[depKey][name] = `^${newVersion}`;
            siblingChanged = true;
          }
        }
        
        // Step 2f-iv: Commit dependency changes
        if (siblingChanged) {
          await writeJSON(path.join(siblingDir, 'package.json'), siblingPkg);
          const msg = interpolate(depCommitMsgTemplate, {
            package: siblingPkg.name,
            depPackage: name,
            depVersion: newVersion,
            version: siblingPkg.version,
            bumpType: 'patch',
          });
          await commit(siblingDir, msg);
          core.info(`[${siblingName}] Updated dependencies for ${name}`);
        }
      }
    }

    // Root package handling for workspaces
    if (rootPkg.workspaces) {
      core.info(`[root@${rootPkg.version}] Processing root package`);
      
      // Step 1: Compute most significant bump from workspaces
      let workspaceBump = null;
      for (const name in bumped) {
        if (bumpPriority(bumped[name].bumpType) > bumpPriority(workspaceBump)) {
          workspaceBump = bumped[name].bumpType;
        }
      }
      
      // Step 2: Check for other bump-producing commits in root
      const rootPackageJsonPath = path.join(rootDir, 'package.json');
      const rootLastVersionCommit = await getLastVersionChangeCommit(rootPackageJsonPath);
      const rootCommits = await getCommitsAffecting(rootDir, rootLastVersionCommit);
      const rootCommitBump = rootCommits.length > 0 ? getMostSignificantBump(rootCommits) : null;
      
      // Step 3: Take most significant bump type
      const requiredRootBump = bumpPriority(workspaceBump) >= bumpPriority(rootCommitBump) ? workspaceBump : rootCommitBump;
      
      if (requiredRootBump) {
        // Step 4: Compare with historical version
        const rootHistoricalVersion = await getVersionAtCommit(rootPackageJsonPath, referenceCommit) || referenceVersion;
        const rootHistoricalBump = calculateBumpType(rootHistoricalVersion, rootPkg.version);
        
        core.info(`[root@${rootPkg.version}] Required bump: ${requiredRootBump}, Historical bump: ${rootHistoricalBump || 'none'}`);
        
        // Step 5: Bump if needed
        if (!rootHistoricalBump || bumpPriority(requiredRootBump) > bumpPriority(rootHistoricalBump)) {
          rootPkg.version = bumpVersion(rootPkg.version, requiredRootBump);
          await writeJSON(rootPackageJsonPath, rootPkg);
          
          const msg = interpolate(commitMsgTemplate, { 
            package: rootPkg.name || 'root', 
            version: rootPkg.version, 
            bumpType: requiredRootBump 
          });
          await commit(rootDir, msg);
          
          bumped[rootPkg.name] = { version: rootPkg.version, bumpType: requiredRootBump, sha: rootLastVersionCommit };
          hasBumped = true;
          core.info(`[root@${rootPkg.version}] Bumped to ${rootPkg.version} (${requiredRootBump})`);
        } else {
          core.info(`[root@${rootPkg.version}] Skipping - historical bump already accounts for changes`);
        }
      } else {
        core.info(`[root@${rootPkg.version}] No changes requiring version bump`);
      }
    } else if (rootPkg.name && rootPkg.name in bumped) {
      core.info(`[root] Root was bumped in workspace processing`);
      rootPkg.version = bumped[rootPkg.name].version;
      hasBumped = true;
    }

    // Handle test failures
    if (testFailures.length > 0) {
      throw new Error(`Test failures in: ${testFailures.join(', ')}`);
    }

    // Generate summary
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

    // Branch and tag handling (unchanged)
    if (targetBranch && hasBumped) {
      const versionedBranch = interpolate(branchTemplate, {
        version: rootPkg.version
      })
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
    if (hasBumped) {
      if (targetBranch) {
        core.info(`[root] Pushing ${targetBranch}`);
        await git.push('origin', targetBranch, ['--set-upstream', '--force']);
        core.setOutput('branch', targetBranch);
      } else {
        core.info(`[root] Pushing current branch and tags`);
        await git.push();
        await git.pushTags();
      }
    }
  }
  console.log(core.summary.stringify());
  core.summary.write({ overwrite: true });
  process.exit(exitCode);
}

function guessBumpType(version) {
  if (version.endsWith('.0.0')) return 'major';
  if (version.endsWith('.0')) return 'minor';
  return 'patch';
}

main(); 