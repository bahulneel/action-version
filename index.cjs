require('source-map-support').install()
// index.js
const core = require('@actions/core');
const fs = require('fs/promises');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const simpleGit = require('simple-git');
const { globSync } = require('glob');
const conventionalCommitsParser = require('conventional-commits-parser');
const semver = require('semver');

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

function initializeVersion(version) {
  return semver.coerce(version) || '0.0.0';
}

function calculateBumpType(fromVersion, toVersion) {
  const from = semver.coerce(fromVersion) || '0.0.0';
  const to = semver.coerce(toVersion) || '0.0.0';
  return semver.diff(from, to); // 'major', 'minor', 'patch', 'prerelease', null
}

function getNextVersion(currentVersion, commitBasedBump, historicalBump, strategy = 'do-nothing') {
  const current = semver.coerce(currentVersion) || '0.0.0';
  
  // Validate inputs
  if (commitBasedBump && !['major', 'minor', 'patch'].includes(commitBasedBump)) {
    throw new Error(`Invalid commitBasedBump: ${commitBasedBump}`);
  }
  
  if (commitBasedBump === historicalBump) {
    // Same bump type - use configured strategy
    core.debug(`Same bump type detected (${commitBasedBump}), using strategy: ${strategy}`);
    
    switch (strategy) {
      case 'do-nothing':
        core.debug(`Strategy 'do-nothing': Skipping bump`);
        return null; // Skip bump
      
      case 'apply-bump':
        core.debug(`Strategy 'apply-bump': Normal semver bump ${current} → ${semver.inc(current, commitBasedBump)}`);
        return semver.inc(current, commitBasedBump); // 1.1.0 → 1.2.0
      
      case 'pre-release':
        if (semver.prerelease(current)) {
          const nextVersion = semver.inc(current, 'prerelease');
          core.debug(`Strategy 'pre-release': Increment prerelease ${current} → ${nextVersion}`);
          return nextVersion; // 1.2.0-1 → 1.2.0-2
        } else {
          // First time: apply bump then make prerelease
          const bumped = semver.inc(current, commitBasedBump); // 1.1.0 → 1.2.0
          const nextVersion = semver.inc(bumped, 'prerelease', '0'); // 1.2.0 → 1.2.0-0
          core.debug(`Strategy 'pre-release': First prerelease ${current} → ${bumped} → ${nextVersion}`);
          return nextVersion;
        }
      
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  } else {
    // Different bump type - normal semver bump
    const nextVersion = semver.inc(current, commitBasedBump);
    core.debug(`Different bump type: ${current} → ${nextVersion} (${commitBasedBump})`);
    return nextVersion;
  }
}

// Finalize prerelease versions when target is updated
function finalizeVersion(version) {
  const current = semver.coerce(version) || '0.0.0';
  if (semver.prerelease(current)) {
    // Remove prerelease suffix: 1.2.0-1 → 1.2.0
    const parsed = semver.parse(current);
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  }
  return current;
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

// Get commits affecting root directory but excluding workspace directories
async function getRootOnlyCommits(rootDir, workspaceDirs, sinceRef) {
  let range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
  
  // Build pathspec to exclude workspace directories
  const pathspecs = ['.'];
  for (const wsDir of workspaceDirs) {
    const relativePath = path.relative(rootDir, wsDir);
    if (relativePath && !relativePath.startsWith('..')) {
      pathspecs.push(`:!${relativePath}`);
      pathspecs.push(`:!${relativePath}/**`);
    }
  }
  
  core.debug(`[root] Git pathspecs for root-only commits: ${pathspecs.join(' ')}`);
  
  try {
    const log = await git.log([range, '--', ...pathspecs]);
    const commits = parseCommits(log.all, sinceRef);
    core.info(`[root] ${commits.length} root-only commits since ${sinceRef} (excluding ${workspaceDirs.length} workspaces)`);
    return commits;
  } catch (error) {
    core.warning(`Failed to get root-only commits, falling back to all commits: ${error.message}`);
    // Fallback to regular commit detection
    return await getCommitsAffecting(rootDir, sinceRef);
  }
}

async function commit(dir, msg) {
  const relativePath = path.relative(process.cwd(), dir) || '.';
  const packageJsonPath = path.join(dir, 'package.json');
  
  try {
    core.debug(`[${relativePath}] Adding package.json to git`);
    await git.add([packageJsonPath]);
    
    core.debug(`[${relativePath}] Committing: ${msg}`);
    await git.commit(msg);
    
    core.debug(`[${relativePath}] Successfully committed changes`);
  } catch (error) {
    core.error(`[${relativePath}] Failed to commit changes: ${error.message}`);
    throw new Error(`Failed to commit changes in ${relativePath}: ${error.message}`);
  }
}

async function tagVersion(lastTag, version, tagPrereleases = false) {
  const tagName = `v${version}`;
  if (!version) {
    core.warning('No version found, skipping tag');
    return;
  }
  
  // Skip prerelease versions unless enabled
  if (semver.prerelease(version) && !tagPrereleases) {
    core.info(`Skipping prerelease tag ${tagName} (use tag-prereleases: true to enable)`);
    return;
  }
  
  if (lastTag && lastTag === tagName) {
    core.info(`Skipping tag ${tagName} because it already exists`);
    return;
  }
  
  if (semver.prerelease(version)) {
    core.info(`Creating prerelease tag ${tagName}`);
  } else {
    core.info(`Creating release tag ${tagName}`);
  }
  
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
  const relativePath = path.relative(process.cwd(), packageJsonPath);
  
  try {
    // Use git log to find the last commit that changed the version field
    core.debug(`[${relativePath}] Searching for version field changes using git log -L`);
    const commits = await git.log(['-L', '/version/:' + packageJsonPath, '-n1', '--no-patch']);
    if (commits.latest) {
      core.info(`[${relativePath}] Last version change: ${commits.latest.hash} (strategy: version field)`);
      return commits.latest.hash;
    }
  } catch (error) {
    core.debug(`[${relativePath}] Version field search failed: ${error.message}`);
  }
  
  // Fallback: use file creation
  try {
    core.debug(`[${relativePath}] Falling back to file creation commit`);
    const commits = await git.log(['-n1', '--no-patch', '--', packageJsonPath]);
    if (commits.latest) {
      core.info(`[${relativePath}] Using file creation: ${commits.latest.hash} (strategy: file creation fallback)`);
      return commits.latest.hash;
    }
  } catch (error) {
    core.error(`[${relativePath}] File creation search failed: ${error.message}`);
    throw new Error(`Could not establish base commit for ${packageJsonPath}: ${error.message}`);
  }
  
  throw new Error(`[${relativePath}] No commits found for package.json file`);
}

// Get version at a specific commit
async function getVersionAtCommit(packageJsonPath, commitRef) {
  const relativePath = path.relative(process.cwd(), packageJsonPath);
  
  try {
    core.debug(`[${relativePath}] Getting version at commit ${commitRef}`);
    const content = await git.show([`${commitRef}:${relativePath}`]);
    const pkg = JSON.parse(content);
    const version = semver.coerce(pkg.version) || '0.0.0';
    core.debug(`[${relativePath}] Version at ${commitRef}: ${version}`);
    return version;
  } catch (error) {
    if (error.message.includes('does not exist')) {
      core.warning(`[${relativePath}] File did not exist at commit ${commitRef}, using default version 0.0.0`);
    } else if (error.message.includes('bad revision')) {
      core.warning(`[${relativePath}] Invalid commit reference ${commitRef}, using default version 0.0.0`);
    } else {
      core.warning(`[${relativePath}] Could not get version at commit ${commitRef}: ${error.message}, using default version 0.0.0`);
    }
    return '0.0.0';
  }
}

// Note: calculateBumpType() already replaced above in the version functions section

// Check if dependency spec is compatible with new version
function isDepCompatible(depSpec, newVersion) {
  if (!depSpec || depSpec === '*') return true;
  
  try {
    return semver.satisfies(newVersion, depSpec);
  } catch (error) {
    core.debug(`Invalid semver spec '${depSpec}' for version '${newVersion}': ${error.message}`);
    return false;
  }
}

function deleteRemoteBranch(branch) {
  try {
    execSync(`git push origin --delete ${branch}`);
  } catch { }
}

async function lastNonMergeCommit(git, branch) {
  try {
    core.debug(`Getting last non-merge commit from branch: ${branch}`);
    const commits = await git.log(['--no-merges', '-n1', branch]);
    if (!commits.latest) {
      throw new Error(`No commits found in branch ${branch}`);
    }
    core.debug(`Last non-merge commit in ${branch}: ${commits.latest.hash}`);
    return commits.latest.hash;
  } catch (error) {
    core.error(`Failed to get last non-merge commit from ${branch}: ${error.message}`);
    throw new Error(`Failed to get last non-merge commit from ${branch}: ${error.message}`);
  }
}

async function main() {
  let exitCode = 0;
  let targetBranch = undefined;
  let hasBumped = false;

  try {
    const commitMsgTemplate = core.getInput('commit-template') || 'chore(release): bump ${package} to ${version} (${bumpType})';
    const depCommitMsgTemplate = core.getInput('dependency-commit-template') || 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)';
    const rootDir = process.cwd();
    const rootPkg = await readJSON(path.join(rootDir, 'package.json'));
    const packageManager = getPackageManager();

    await git.addConfig('user.name', 'github-actions[bot]');
    await git.addConfig('user.email', 'github-actions[bot]@users.noreply.github.com');
    const shouldCreateBranch = core.getInput('create-branch') === 'true';
    const branchTemplate = core.getInput('branch-template') || 'release/${version}';
    const templateRegex = new RegExp(branchTemplate.replace(/\$\{(\w+)\}/g, '(?<$1>\\w+)'));
    const branchCleanup = core.getInput('branch-cleanup') || 'keep';
    const baseBranch = core.getInput('base') || shouldCreateBranch ? 'main' : undefined;
    
    // Strategy and workflow inputs
    const strategy = core.getInput('strategy') || 'do-nothing';
    const activeBranch = core.getInput('branch') || 'develop';
    const tagPrereleases = core.getInput('tag-prereleases') === 'true';
    
    // Validate configuration inputs
    const validStrategies = ['do-nothing', 'apply-bump', 'pre-release'];
    if (!validStrategies.includes(strategy)) {
      throw new Error(`Invalid strategy: ${strategy}. Must be one of: ${validStrategies.join(', ')}`);
    }
    
    if (activeBranch && activeBranch.trim() === '') {
      throw new Error('branch cannot be empty if provided');
    }
    
    if (baseBranch && baseBranch.trim() === '') {
      throw new Error('base cannot be empty if provided');
    }
    
    // Validate branch compatibility
    if (strategy === 'pre-release' && !baseBranch) {
      core.warning('Using pre-release strategy without base - prerelease finalization will not be available');
    }
    
    core.info(`[config] Strategy: ${strategy}`);
    core.info(`[config] Active branch: ${activeBranch}`);
    core.info(`[config] Tag prereleases: ${tagPrereleases}`);

    try {
      core.debug(`[git] Fetching latest changes from origin`);
      await git.fetch(['--prune', 'origin']);
      core.debug(`[git] Successfully fetched from origin`);
    } catch (error) {
      core.warning(`[git] Failed to fetch from origin: ${error.message}`);
      // Continue execution - this is not always fatal
    }

    // Step 1: Find starting version number and commit ref
    let referenceCommit;
    let referenceVersion;
    let shouldFinalizeVersions = false;
    
    // Check if we should finalize prerelease versions (base branch update scenario)
    if (baseBranch && activeBranch) {
      try {
        const activeCommit = await lastNonMergeCommit(git, `origin/${activeBranch}`);
        const baseCommit = await lastNonMergeCommit(git, `origin/${baseBranch}`);
        
        if (activeCommit === baseCommit) {
          core.info(`[root] Active and base branches are at same commit - checking for prerelease finalization`);
          shouldFinalizeVersions = true;
        }
      } catch (error) {
        core.debug(`Could not compare active/base branches: ${error.message}`);
      }
    }
    
    if (baseBranch) {
      core.info(`[root] Using branch base: ${baseBranch}`);
      const branch = baseBranch.startsWith('origin/') ? baseBranch : `origin/${baseBranch}`;
      referenceCommit = await lastNonMergeCommit(git, branch);
      referenceCommit = referenceCommit.trim();
      
      // Get root package version at that commit
      const rootPackageJsonPath = path.join(rootDir, 'package.json');
      referenceVersion = await getVersionAtCommit(rootPackageJsonPath, referenceCommit);
      referenceVersion = semver.coerce(referenceVersion) || '0.0.0';
    } else {
      core.info(`[root] Using latest tag as reference`);
      const tags = await git.tags(['--sort=-v:refname']);
      const latestTag = tags.latest;
      if (latestTag) {
        referenceCommit = await git.revparse([latestTag]);
        referenceVersion = semver.coerce(latestTag.replace(/^v/, '')) || '0.0.0';
      } else {
        // No tags, use first commit
        const firstCommit = await git.log(['--reverse', '--max-count=1']);
        referenceCommit = firstCommit.latest.hash;
        referenceVersion = '0.0.0';
      }
    }
    
    core.info(`[root] Reference: ${referenceCommit} (version: ${referenceVersion})`);

    const currentBranch =
      process.env.GITHUB_HEAD_REF ||
      process.env.GITHUB_REF_NAME ||
      'main'; // fallback

    const newBranch = shouldCreateBranch ? interpolate(branchTemplate, {
      version: currentBranch
    }) : undefined;

    try {
      if (newBranch) {
        core.info(`[git] Checking out ${newBranch} from ${currentBranch}`);
        await git.checkoutBranch(newBranch, currentBranch);
        core.debug(`[git] Successfully checked out ${newBranch}`);
      } else {
        core.info(`[git] Checking out ${currentBranch}`);
        await git.checkout(currentBranch);
        core.debug(`[git] Successfully checked out ${currentBranch}`);
      }
    } catch (error) {
      core.error(`[git] Failed to checkout branch: ${error.message}`);
      throw new Error(`Failed to checkout branch: ${error.message}`);
    }

    // Discover all packages and build dependency graph
    const pkgDirs = await getPackageDirs(rootPkg);
    const { graph, nameToDir } = await buildDepGraph(pkgDirs);
    const order = topoSort(graph);
    
    const bumped = {};
    let testFailures = [];

    // Handle prerelease version finalization if needed
    if (shouldFinalizeVersions) {
      core.info(`[root] Finalizing prerelease versions for target branch update`);
      
      for (const name of order) {
        const { dir, pkg } = graph[name];
        const packageJsonPath = path.join(dir, 'package.json');
        
        if (pkg.version && semver.prerelease(pkg.version)) {
          const finalVersion = finalizeVersion(pkg.version);
          core.info(`[${name}] Finalizing prerelease version: ${pkg.version} → ${finalVersion}`);
          
          pkg.version = finalVersion;
          await writeJSON(packageJsonPath, pkg);
          
          const msg = interpolate(commitMsgTemplate, {
            package: pkg.name,
            version: finalVersion,
            bumpType: 'release'
          });
          await commit(dir, msg);
          
          bumped[name] = { version: finalVersion, bumpType: 'release', sha: null };
          hasBumped = true;
        }
      }
      
      // Finalize root package if it's a prerelease
      if (rootPkg.version && semver.prerelease(rootPkg.version)) {
        const finalVersion = finalizeVersion(rootPkg.version);
        core.info(`[root] Finalizing prerelease version: ${rootPkg.version} → ${finalVersion}`);
        
        rootPkg.version = finalVersion;
        const rootPackageJsonPath = path.join(rootDir, 'package.json');
        await writeJSON(rootPackageJsonPath, rootPkg);
        
        const msg = interpolate(commitMsgTemplate, {
          package: rootPkg.name || 'root',
          version: finalVersion,
          bumpType: 'release'
        });
        await commit(rootDir, msg);
        
        bumped[rootPkg.name] = { version: finalVersion, bumpType: 'release', sha: null };
        hasBumped = true;
      }
      
      if (hasBumped) {
        core.info(`[root] Prerelease finalization complete`);
        
        // Create release tags for finalized versions
        if (rootPkg.version) {
          const lastTag = await git.tags(['--sort=-v:refname']).latest;
          await tagVersion(lastTag, rootPkg.version, true); // Force tagging for finalized releases
        }
        
        // Skip normal processing and go to final steps
      } else {
        core.info(`[root] No prerelease versions found to finalize`);
      }
    }

    // Step 2: For each package, determine if it needs bumping (skip if finalizing)
    if (!shouldFinalizeVersions) {
      for (const name of order) {
      const { dir, pkg } = graph[name];
      const packageJsonPath = path.join(dir, 'package.json');
      
      // Initialize version if missing
      if (!pkg.version) {
        pkg.version = initializeVersion(pkg.version);
        core.info(`[${name}] Initialized missing version to ${pkg.version}`);
      }
      
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
      
      // Step 2d: Determine next version using strategy
      if (commitBasedBump === historicalBump && commitBasedBump) {
        core.info(`[${name}@${pkg.version}] Same bump type detected, applying strategy: ${strategy}`);
      }
      
      const nextVersion = getNextVersion(pkg.version, commitBasedBump, historicalBump, strategy);
      
      if (!nextVersion) {
        core.info(`[${name}@${pkg.version}] Skipping - strategy '${strategy}' with no changes needed`);
        bumped[name] = { version: pkg.version, bumpType: historicalBump || 'none', sha: lastVersionCommit };
        continue;
      }
      
      // Step 2e: Bump the version
      pkg.version = nextVersion;
      await writeJSON(packageJsonPath, pkg);
      
      // Determine actual bump type for logging and commits
      const actualBumpType = semver.prerelease(nextVersion) ? 'prerelease' : commitBasedBump;
      
      const msg = interpolate(commitMsgTemplate, { 
        package: pkg.name, 
        version: pkg.version, 
        bumpType: actualBumpType 
      });
      await commit(dir, msg);
      
      bumped[name] = { version: pkg.version, bumpType: actualBumpType, sha: lastVersionCommit };
      hasBumped = true;
      
      if (semver.prerelease(nextVersion)) {
        core.info(`[${name}@${pkg.version}] Bumped to ${pkg.version} (prerelease)`);
      } else {
        core.info(`[${name}@${pkg.version}] Bumped to ${pkg.version} (${commitBasedBump})`);
      }
      
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
          if (!isDepCompatible(currentDepSpec, pkg.version)) {
            core.info(`[${siblingName}] Updating ${name} dependency from ${currentDepSpec} to ^${pkg.version}`);
            
            // Step 2f-iii: Handle major version bumps with testing
            if (commitBasedBump === 'major') {
              const testPassed = await runTest(siblingDir, packageManager);
              if (!testPassed) {
                core.warning(`[${siblingName}] Tests failed after major bump of ${name}, locking to previous version`);
                siblingPkg[depKey][name] = pkg.version; // Lock to current version
                testFailures.push(siblingName);
                siblingChanged = true;
                continue;
              }
            }
            
            siblingPkg[depKey][name] = `^${pkg.version}`;
            siblingChanged = true;
          }
        }
        
        // Step 2f-iv: Commit dependency changes
        if (siblingChanged) {
          await writeJSON(path.join(siblingDir, 'package.json'), siblingPkg);
          const msg = interpolate(depCommitMsgTemplate, {
            package: siblingPkg.name,
            depPackage: name,
            depVersion: pkg.version,
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
      
      // Step 2: Check for other bump-producing commits in root (excluding workspaces)
      const rootPackageJsonPath = path.join(rootDir, 'package.json');
      const rootLastVersionCommit = await getLastVersionChangeCommit(rootPackageJsonPath);
      const rootCommits = await getRootOnlyCommits(rootDir, pkgDirs, rootLastVersionCommit);
      const rootCommitBump = rootCommits.length > 0 ? getMostSignificantBump(rootCommits) : null;
      
      // Step 3: Take most significant bump type
      const requiredRootBump = bumpPriority(workspaceBump) >= bumpPriority(rootCommitBump) ? workspaceBump : rootCommitBump;
      
      if (requiredRootBump) {
        // Initialize root version if missing
        if (!rootPkg.version) {
          rootPkg.version = initializeVersion(rootPkg.version);
          core.info(`[root] Initialized missing version to ${rootPkg.version}`);
        }
        
        // Step 4: Compare with historical version
        const rootHistoricalVersion = await getVersionAtCommit(rootPackageJsonPath, referenceCommit) || referenceVersion;
        const rootHistoricalBump = calculateBumpType(rootHistoricalVersion, rootPkg.version);
        
        core.info(`[root@${rootPkg.version}] Required bump: ${requiredRootBump}, Historical bump: ${rootHistoricalBump || 'none'}`);
        
        // Step 5: Determine next version using strategy
        if (requiredRootBump === rootHistoricalBump && requiredRootBump) {
          core.info(`[root@${rootPkg.version}] Same bump type detected, applying strategy: ${strategy}`);
        }
        
        const nextRootVersion = getNextVersion(rootPkg.version, requiredRootBump, rootHistoricalBump, strategy);
        
        if (nextRootVersion) {
          rootPkg.version = nextRootVersion;
          await writeJSON(rootPackageJsonPath, rootPkg);
          
          // Determine actual bump type for logging and commits
          const actualBumpType = semver.prerelease(nextRootVersion) ? 'prerelease' : requiredRootBump;
          
          const msg = interpolate(commitMsgTemplate, { 
            package: rootPkg.name || 'root', 
            version: rootPkg.version, 
            bumpType: actualBumpType 
          });
          await commit(rootDir, msg);
          
          bumped[rootPkg.name] = { version: rootPkg.version, bumpType: actualBumpType, sha: rootLastVersionCommit };
          hasBumped = true;
          
          if (semver.prerelease(nextRootVersion)) {
            core.info(`[root@${rootPkg.version}] Bumped to ${rootPkg.version} (prerelease)`);
          } else {
            core.info(`[root@${rootPkg.version}] Bumped to ${rootPkg.version} (${requiredRootBump})`);
          }
        } else {
          core.info(`[root@${rootPkg.version}] Skipping - strategy '${strategy}' with no changes needed`);
        }
      } else {
        core.info(`[root@${rootPkg.version}] No changes requiring version bump`);
      }
    } else if (rootPkg.name && rootPkg.name in bumped) {
      core.info(`[root] Root was bumped in workspace processing`);
      rootPkg.version = bumped[rootPkg.name].version;
      hasBumped = true;
    }
    } // End of normal processing (if (!shouldFinalizeVersions))

    // Handle test failures
    if (testFailures.length > 0) {
      throw new Error(`Test failures in: ${testFailures.join(', ')}`);
    }

    // Generate comprehensive summary
    const totalPackages = Object.keys(bumped).length;
    const prereleasePackages = Object.values(bumped).filter(b => semver.prerelease(b.version)).length;
    const releasePackages = totalPackages - prereleasePackages;
    const finalizedPackages = Object.values(bumped).filter(b => b.bumpType === 'release').length;
    
    core.summary.addHeading('Version Bump Summary', 2);
    core.summary.addTable([
      [
        { data: 'Package', header: true },
        { data: 'Version', header: true },
        { data: 'Bump Type', header: true },
        { data: 'Previous Commit', header: true },
        { data: 'Status', header: true }
      ],
      ...Object.entries(bumped).map(([name, { version, bumpType, sha }]) => [
        { data: name },
        { data: version },
        { data: bumpType },
        { data: sha?.slice(0, 7) || 'N/A' },
        { data: testFailures.includes(name) ? ':x: Failed' : ':white_check_mark: Success' }
      ]),
    ]);
    
    // Add configuration summary
    core.summary.addHeading('Configuration Used', 3);
    core.summary.addList([
      `Strategy: ${strategy}`,
      `Source branch: ${sourceBranch}`,
      `Target branch: ${targetBranch || 'N/A'}`,
      `Tag prereleases: ${tagPrereleases}`,
      `Should finalize versions: ${shouldFinalizeVersions}`
    ]);
    
    // Add statistics
    core.summary.addHeading('Statistics', 3);
    core.summary.addList([
      `Total packages processed: ${totalPackages}`,
      `Release versions: ${releasePackages}`,
      `Prerelease versions: ${prereleasePackages}`,
      `Finalized versions: ${finalizedPackages}`,
      `Test failures: ${testFailures.length}`
    ]);
    
    if (totalPackages > 0) {
      core.info(`[summary] Processed ${totalPackages} packages: ${releasePackages} releases, ${prereleasePackages} prereleases, ${finalizedPackages} finalized`);
    } else {
      core.info(`[summary] No packages required version changes with strategy '${strategy}'`);
    }

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
      core.info(`[root] Branch cleanup strategy: ${branchCleanup} using ${templateRegex.source}`);
      if (branchCleanup === 'prune' || branchCleanup === 'semantic') {
        for (const branch of branches.all) {
          if (branch.replace('origin/', '') === versionedBranch) {
            continue
          }
          const match = branch.match(templateRegex);
          const { version } = match?.groups || {};
          if (version) {
            core.info(`[root] Considering deleting ${branch}`);
            const bumpType = guessBumpType(version);
            if (branchCleanup === 'semantic' && bumpType !== rootBump) {
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
      await tagVersion(lastTag, rootPkg.version, tagPrereleases);
    }
    
    // Final validation and completion
    if (hasBumped) {
      core.info('✅ Version bump action completed successfully with changes');
    } else {
      core.info('✅ Version bump action completed successfully with no changes needed');
    }
    
    // Validate final state
    try {
      const finalRootPkg = await readJSON(path.join(rootDir, 'package.json'));
      if (finalRootPkg.version && !semver.valid(finalRootPkg.version)) {
        throw new Error(`Final root package version is invalid: ${finalRootPkg.version}`);
      }
      core.debug(`[validation] Final root package version: ${finalRootPkg.version}`);
    } catch (error) {
      core.error(`[validation] Failed to validate final package state: ${error.message}`);
      throw error;
    }
  } catch (err) {
    console.error(err);
    core.setFailed(err.message);
    exitCode = 1;
  } finally {
    if (hasBumped) {
      try {
        if (targetBranch) {
          core.info(`[git] Pushing ${targetBranch} to origin`);
          await git.push('origin', targetBranch, ['--set-upstream', '--force']);
          core.setOutput('branch', targetBranch);
          core.info(`[git] Successfully pushed ${targetBranch}`);
        } else {
          core.info(`[git] Pushing current branch and tags`);
          await git.push();
          await git.pushTags();
          core.info(`[git] Successfully pushed changes and tags`);
        }
      } catch (error) {
        core.error(`[git] Failed to push changes: ${error.message}`);
        core.setFailed(`Failed to push changes: ${error.message}`);
        exitCode = 1;
      }
    } else {
      core.info(`[git] No changes to push`);
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