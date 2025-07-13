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

// Strategy Pattern: Version Bump Strategies
class VersionBumpStrategy {
  constructor(name) {
    this.name = name;
  }

  execute(currentVersion, commitBasedBump, historicalBump) {
    throw new Error('Strategy must implement execute method');
  }
}

class DoNothingStrategy extends VersionBumpStrategy {
  constructor() {
    super('do-nothing');
  }

  execute(currentVersion, commitBasedBump, historicalBump) {
    core.debug(`Strategy 'do-nothing': Skipping bump`);
    return currentVersion; // No change
  }
}

class ApplyBumpStrategy extends VersionBumpStrategy {
  constructor() {
    super('apply-bump');
  }

  execute(currentVersion, commitBasedBump, historicalBump) {
    const current = semver.coerce(currentVersion) || '0.0.0';
    const nextVersion = semver.inc(current, commitBasedBump);
    core.debug(`Strategy 'apply-bump': Normal semver bump ${current} → ${nextVersion}`);
    return nextVersion; // 1.1.0 → 1.2.0
  }
}

class PreReleaseStrategy extends VersionBumpStrategy {
  constructor() {
    super('pre-release');
  }

  execute(currentVersion, commitBasedBump, historicalBump) {
    const current = semver.coerce(currentVersion) || '0.0.0';

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
  }
}

class VersionBumpStrategyFactory {
  static strategies = {
    'do-nothing': new DoNothingStrategy(),
    'apply-bump': new ApplyBumpStrategy(),
    'pre-release': new PreReleaseStrategy()
  };

  static getStrategy(strategyName) {
    const strategy = this.strategies[strategyName];
    if (!strategy) {
      throw new Error(`Unknown version bump strategy: ${strategyName}`);
    }
    return strategy;
  }

  static getAvailableStrategies() {
    return Object.keys(this.strategies);
  }
}

// Strategy Pattern: Branch Cleanup Strategies
class BranchCleanupStrategy {
  constructor(name) {
    this.name = name;
  }

  async execute(branches, versionedBranch, templateRegex, rootBump) {
    throw new Error('Strategy must implement execute method');
  }
}

class KeepAllBranchesStrategy extends BranchCleanupStrategy {
  constructor() {
    super('keep');
  }

  async execute(branches, versionedBranch, templateRegex, rootBump) {
    core.info(`[root] Branch cleanup strategy: ${this.name} - keeping all branches`);
    // Do nothing - keep all branches
  }
}

class PruneOldBranchesStrategy extends BranchCleanupStrategy {
  constructor() {
    super('prune');
  }

  async execute(branches, versionedBranch, templateRegex, rootBump) {
    core.info(`[root] Branch cleanup strategy: ${this.name} - removing old branches`);

    for (const branch of branches.all) {
      if (branch.replace('origin/', '') === versionedBranch) {
        continue; // Skip current branch
      }

      const match = branch.match(templateRegex);
      const { version } = match?.groups || {};
      if (version) {
        core.info(`[root] Deleting old branch ${branch}`);
        await this._deleteBranch(branch);
      }
    }
  }

  async _deleteBranch(branch) {
    try {
      await git.deleteLocalBranch(branch, true);
    } catch { }
    try {
      deleteRemoteBranch(branch.replace('origin/', ''));
    } catch { }
  }
}

class SemanticBranchesStrategy extends BranchCleanupStrategy {
  constructor() {
    super('semantic');
  }

  async execute(branches, versionedBranch, templateRegex, rootBump) {
    core.info(`[root] Branch cleanup strategy: ${this.name} - keeping same bump type only`);

    for (const branch of branches.all) {
      if (branch.replace('origin/', '') === versionedBranch) {
        continue; // Skip current branch
      }

      const match = branch.match(templateRegex);
      const { version } = match?.groups || {};
      if (version) {
        const bumpType = guessBumpType(version);
        if (bumpType !== rootBump) {
          continue; // Keep different bump types
        }

        core.info(`[root] Deleting same-type branch ${branch} (${bumpType})`);
        await this._deleteBranch(branch);
      }
    }
  }

  async _deleteBranch(branch) {
    try {
      await git.deleteLocalBranch(branch, true);
    } catch { }
    try {
      deleteRemoteBranch(branch.replace('origin/', ''));
    } catch { }
  }
}

class BranchCleanupStrategyFactory {
  static strategies = {
    'keep': new KeepAllBranchesStrategy(),
    'prune': new PruneOldBranchesStrategy(),
    'semantic': new SemanticBranchesStrategy()
  };

  static getStrategy(strategyName) {
    const strategy = this.strategies[strategyName];
    if (!strategy) {
      throw new Error(`Unknown branch cleanup strategy: ${strategyName}`);
    }
    return strategy;
  }

  static getAvailableStrategies() {
    return Object.keys(this.strategies);
  }
}

// Strategy Pattern: Reference Point Determination Strategies
class ReferencePointStrategy {
  constructor(name) {
    this.name = name;
  }

  async execute(baseBranch, activeBranch) {
    throw new Error('Strategy must implement execute method');
  }
}

class TagBasedReferenceStrategy extends ReferencePointStrategy {
  constructor() {
    super('tag-based');
  }

  async execute(baseBranch, activeBranch) {
    core.info(`[root] Using latest tag as reference`);
    const tags = await git.tags(['--sort=-v:refname']);
    const latestTag = tags.latest;

    if (latestTag) {
      const referenceCommit = await git.revparse([latestTag]);
      const referenceVersion = semver.coerce(latestTag.replace(/^v/, '')) || '0.0.0';
      return { referenceCommit, referenceVersion, shouldFinalizeVersions: false };
    } else {
      // No tags, use first commit
      const firstCommit = await git.log(['--reverse', '--max-count=1']);
      const referenceCommit = firstCommit.latest.hash;
      const referenceVersion = '0.0.0';
      return { referenceCommit, referenceVersion, shouldFinalizeVersions: false };
    }
  }
}

class BranchBasedReferenceStrategy extends ReferencePointStrategy {
  constructor() {
    super('branch-based');
  }

  async execute(baseBranch, activeBranch) {
    core.info(`[root] Using branch base: ${baseBranch}`);
    const branch = baseBranch.startsWith('origin/') ? baseBranch : `origin/${baseBranch}`;
    let referenceCommit = await lastNonMergeCommit(git, branch);
    referenceCommit = referenceCommit.trim();

    // Get root package version at that commit
    const rootPackageJsonPath = path.join(process.cwd(), 'package.json');
    let referenceVersion = await getVersionAtCommit(rootPackageJsonPath, referenceCommit);
    referenceVersion = semver.coerce(referenceVersion) || '0.0.0';

    // Check if we should finalize prerelease versions (base branch update scenario)
    let shouldFinalizeVersions = false;
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

    return { referenceCommit, referenceVersion, shouldFinalizeVersions };
  }
}

class ReferencePointStrategyFactory {
  static getStrategy(baseBranch) {
    if (baseBranch) {
      return new BranchBasedReferenceStrategy();
    } else {
      return new TagBasedReferenceStrategy();
    }
  }
}

// Strategy Pattern: Import from lib folder
const { PackageManagerFactory } = require('./lib/package-managers/factory.cjs');
const { GitOperationStrategyFactory } = require('./lib/git-operations/factory.cjs');

class Package {
  constructor(name, dir, pkg, packageJsonPath) {
    this.name = name;
    this.dir = dir;
    this.pkg = pkg;
    this.packageJsonPath = packageJsonPath;
    this.bumpResult = null;
  }

  get version() {
    return this.pkg.version;
  }

  set version(newVersion) {
    this.pkg.version = newVersion;
  }

  get relativePath() {
    return path.relative(process.cwd(), this.dir) || '/';
  }

  initializeVersion() {
    if (!this.pkg.version) {
      this.pkg.version = initializeVersion(this.pkg.version);
      core.info(`[${this.name}] Initialized missing version to ${this.pkg.version}`);
    }
  }

  async save() {
    await writeJSON(this.packageJsonPath, this.pkg);
  }

  async getLastVersionChangeCommit() {
    return await getLastVersionChangeCommit(this.packageJsonPath);
  }

  async getCommitsAffecting(sinceRef) {
    return await getCommitsAffecting(this.dir, sinceRef);
  }

  async getVersionAtCommit(commitRef) {
    return await getVersionAtCommit(this.packageJsonPath, commitRef);
  }

  async processVersionBump(referenceCommit, referenceVersion, strategy, commitMsgTemplate, gitStrategy) {
    this.initializeVersion();

    core.info(`[${this.name}@${this.version}] Processing package`);

    // Step 2a: Detect when version was last changed
    const lastVersionCommit = await this.getLastVersionChangeCommit();

    // Step 2b: Find changes since last version change
    const commitsSinceVersion = await this.getCommitsAffecting(lastVersionCommit);
    const commitBasedBump = commitsSinceVersion.length > 0 ? getMostSignificantBump(commitsSinceVersion) : null;

    // Step 2c: Calculate historical bump type from reference
    const historicalVersion = await this.getVersionAtCommit(referenceCommit) || referenceVersion;
    const historicalBump = calculateBumpType(historicalVersion, this.version);

    core.info(`[${this.name}@${this.version}] Commit-based bump: ${commitBasedBump || 'none'}, Historical bump: ${historicalBump || 'none'}`);

    // Step 2d: Apply strategy for same bump type
    if (commitBasedBump && commitBasedBump === historicalBump) {
      core.info(`[${this.name}@${this.version}] Same bump type detected, applying strategy: ${strategy}`);

      const nextVersion = getNextVersion(this.version, commitBasedBump, historicalBump, strategy);

      if (nextVersion === this.version) {
        core.info(`[${this.name}@${this.version}] Skipping - strategy '${strategy}' with no changes needed`);
        return null;
      }

      this.version = nextVersion;
      await this.save();

      const bumpType = semver.prerelease(nextVersion) ? 'prerelease' : commitBasedBump;

      // Use git strategy to commit the version change
      await gitStrategy.commitVersionChange(this.dir, this.name, this.version, bumpType, commitMsgTemplate);

      const result = {
        version: this.version,
        bumpType: bumpType,
        sha: lastVersionCommit
      };

      if (semver.prerelease(this.version)) {
        core.info(`[${this.name}@${this.version}] Bumped to ${this.version} (prerelease)`);
      } else {
        core.info(`[${this.name}@${this.version}] Bumped to ${this.version} (${commitBasedBump})`);
      }

      this.bumpResult = result;
      return result;
    }

    // Step 2e: Use commit-based bump if different from historical
    if (commitBasedBump && commitBasedBump !== historicalBump) {
      const nextVersion = getNextVersion(this.version, commitBasedBump, historicalBump, 'apply-bump');
      this.version = nextVersion;
      await this.save();

      // Use git strategy to commit the version change
      await gitStrategy.commitVersionChange(this.dir, this.name, this.version, commitBasedBump, commitMsgTemplate);

      const result = {
        version: this.version,
        bumpType: commitBasedBump,
        sha: lastVersionCommit
      };

      core.info(`[${this.name}@${this.version}] Bumped to ${this.version} (${commitBasedBump})`);
      this.bumpResult = result;
      return result;
    }

    // No changes needed
    return null;
  }

  async finalizePrerelease(commitMsgTemplate, gitStrategy) {
    if (this.version && semver.prerelease(this.version)) {
      const finalVersion = finalizeVersion(this.version);
      core.info(`[${this.name}] Finalizing prerelease version: ${this.version} → ${finalVersion}`);

      this.version = finalVersion;
      await this.save();

      // Use git strategy to commit the finalization
      await gitStrategy.commitVersionChange(this.dir, this.name, finalVersion, 'release', commitMsgTemplate);

      const result = { version: finalVersion, bumpType: 'release', sha: null };
      this.bumpResult = result;
      return result;
    }
    return null;
  }

  async updateDependency(depName, newVersion, depCommitMsgTemplate, gitStrategy) {
    let updated = false;

    for (const depKey of depKeys) {
      if (this.pkg[depKey] && this.pkg[depKey][depName]) {
        const currentDepSpec = this.pkg[depKey][depName];

        if (semver.satisfies(newVersion, currentDepSpec)) {
          continue;
        }

        core.info(`[${this.name}] Updating ${depName} dependency from ${currentDepSpec} to ^${newVersion}`);
        this.pkg[depKey][depName] = `^${newVersion}`;
        updated = true;
      }
    }

    if (updated) {
      await this.save();

      // Use git strategy to commit the dependency update
      await gitStrategy.commitDependencyUpdate(this.dir, this.name, depName, newVersion, depCommitMsgTemplate);
      core.info(`[${this.name}] Updated dependencies for ${depName}`);
    }

    return updated;
  }

  async testCompatibility(packageManager) {
    try {
      const testResult = await packageManager.test(this.dir);
      return testResult;
    } catch (error) {
      core.warning(`[${this.name}] Test execution failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function parseConfiguration() {
  const commitMsgTemplate = core.getInput('commit_template') || 'chore(release): bump ${package} to ${version} (${bumpType})';
  const depCommitMsgTemplate = core.getInput('dependency_commit_template') || 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)';
  const shouldCreateBranch = core.getBooleanInput('create_branch');
  const branchTemplate = core.getInput('branch_template') || 'release/${version}';
  const templateRegex = new RegExp(branchTemplate.replace(/\$\{(\w+)\}/g, '(?<$1>\\w+)'));
  const branchCleanup = core.getInput('branch_cleanup') || 'keep';
  const baseBranch = core.getInput('base') || shouldCreateBranch ? 'main' : undefined;
  const strategy = core.getInput('strategy') || 'do-nothing';
  const activeBranch = core.getInput('branch') || 'develop';
  const tagPrereleases = core.getBooleanInput('tag_prereleases');

  // Validate configuration inputs
  const validStrategies = VersionBumpStrategyFactory.getAvailableStrategies();
  if (!validStrategies.includes(strategy)) {
    throw new Error(`Invalid strategy: ${strategy}. Must be one of: ${validStrategies.join(', ')}`);
  }

  const validCleanupStrategies = BranchCleanupStrategyFactory.getAvailableStrategies();
  if (!validCleanupStrategies.includes(branchCleanup)) {
    throw new Error(`Invalid branch cleanup strategy: ${branchCleanup}. Must be one of: ${validCleanupStrategies.join(', ')}`);
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

  return {
    commitMsgTemplate,
    depCommitMsgTemplate,
    shouldCreateBranch,
    branchTemplate,
    templateRegex,
    branchCleanup,
    baseBranch,
    strategy,
    activeBranch,
    tagPrereleases
  };
}

async function setupGit(shouldCreateBranch, branchTemplate) {
  await git.addConfig('user.name', 'github-actions[bot]');
  await git.addConfig('user.email', 'github-actions[bot]@users.noreply.github.com');

  try {
    core.debug(`[git] Fetching latest changes from origin`);
    await git.fetch(['--prune', 'origin']);
    core.debug(`[git] Successfully fetched from origin`);
  } catch (error) {
    core.warning(`[git] Failed to fetch from origin: ${error.message}`);
  }

  const currentBranch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'main';
  const newBranch = shouldCreateBranch ? interpolate(branchTemplate, { version: currentBranch }) : undefined;

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

  return { currentBranch, newBranch };
}

async function determineReferencePoint(baseBranch, activeBranch) {
  const strategy = ReferencePointStrategyFactory.getStrategy(baseBranch);
  const result = await strategy.execute(baseBranch, activeBranch);

  core.info(`[root] Reference: ${result.referenceCommit} (version: ${result.referenceVersion})`);

  return result;
}

async function processWorkspacePackages(packages, referenceCommit, referenceVersion, strategy, commitMsgTemplate, depCommitMsgTemplate, gitStrategy, packageManager) {
  const bumped = {};
  const testFailures = [];

  for (const pkg of packages) {
    const result = await pkg.processVersionBump(referenceCommit, referenceVersion, strategy, commitMsgTemplate, gitStrategy);
    if (result) {
      bumped[pkg.name] = result;
    }
  }

  // Update dependencies for bumped packages
  for (const pkg of packages) {
    if (bumped[pkg.name]) {
      for (const siblingPkg of packages) {
        if (siblingPkg.name !== pkg.name) {
          const updated = await siblingPkg.updateDependency(pkg.name, pkg.version, depCommitMsgTemplate, gitStrategy);

          if (updated && bumped[pkg.name].bumpType === 'major') {
            // Test major version compatibility using package manager strategy
            const testResult = await siblingPkg.testCompatibility(packageManager);
            if (!testResult.success) {
              core.warning(`[${siblingPkg.name}] Tests failed after major bump of ${pkg.name}, locking to previous version`);
              testFailures.push(siblingPkg.name);

              // Revert to previous version with exact pinning
              const prevVersion = testResult.prevVersion || pkg.version;
              for (const depKey of depKeys) {
                if (siblingPkg.pkg[depKey] && siblingPkg.pkg[depKey][pkg.name]) {
                  siblingPkg.pkg[depKey][pkg.name] = prevVersion;
                }
              }
              await siblingPkg.save();
            }
          }
        }
      }
    }
  }

  return { bumped, testFailures };
}

async function finalizePackageVersions(packages, rootPkg, commitMsgTemplate, gitStrategy) {
  const bumped = {};
  let hasBumped = false;

  core.info(`[root] Finalizing prerelease versions for base branch update`);

  for (const pkg of packages) {
    const result = await pkg.finalizePrerelease(commitMsgTemplate, gitStrategy);
    if (result) {
      bumped[pkg.name] = result;
      hasBumped = true;
    }
  }

  // Finalize root package if it's a prerelease
  if (rootPkg.version && semver.prerelease(rootPkg.version)) {
    const finalVersion = finalizeVersion(rootPkg.version);
    core.info(`[root] Finalizing prerelease version: ${rootPkg.version} → ${finalVersion}`);

    rootPkg.version = finalVersion;
    const rootPackageJsonPath = path.join(process.cwd(), 'package.json');
    await writeJSON(rootPackageJsonPath, rootPkg);

    // Use git strategy to commit the root finalization
    await gitStrategy.commitVersionChange(process.cwd(), rootPkg.name || 'root', finalVersion, 'release', commitMsgTemplate);

    bumped[rootPkg.name] = { version: finalVersion, bumpType: 'release', sha: null };
    hasBumped = true;
  }

  if (hasBumped) {
    core.info(`[root] Prerelease finalization complete`);

    // Create release tags for finalized versions using git strategy
    if (rootPkg.version) {
      await gitStrategy.tagVersion(rootPkg.version, false, true); // Force tagging for finalized releases
    }
  } else {
    core.info(`[root] No prerelease versions found to finalize`);
  }

  return { bumped, hasBumped };
}

async function processRootPackage(rootPkg, bumped, referenceCommit, referenceVersion, strategy, commitMsgTemplate, gitStrategy) {
  if (!rootPkg.workspaces) {
    return { bumped, hasBumped: false };
  }

  core.info(`[root@${rootPkg.version}] Processing root package`);

  // Initialize root version if missing
  if (!rootPkg.version) {
    rootPkg.version = initializeVersion(rootPkg.version);
    core.info(`[root] Initialized missing version to ${rootPkg.version}`);
  }

  // Step 1: Compute most significant bump from workspaces
  let workspaceBump = null;
  for (const name in bumped) {
    if (bumpPriority(bumped[name].bumpType) > bumpPriority(workspaceBump)) {
      workspaceBump = bumped[name].bumpType;
    }
  }

  // Step 2: Calculate historical bump type from reference
  const rootPackageJsonPath = path.join(process.cwd(), 'package.json');
  const rootHistoricalVersion = await getVersionAtCommit(rootPackageJsonPath, referenceCommit) || referenceVersion;
  const rootHistoricalBump = calculateBumpType(rootHistoricalVersion, rootPkg.version);

  core.info(`[root@${rootPkg.version}] Required bump: ${workspaceBump}, Historical bump: ${rootHistoricalBump || 'none'}`);

  let hasBumped = false;

  // Step 3: Apply strategy if same bump type
  if (workspaceBump && workspaceBump === rootHistoricalBump) {
    core.info(`[root@${rootPkg.version}] Same bump type detected, applying strategy: ${strategy}`);

    const nextVersion = getNextVersion(rootPkg.version, workspaceBump, rootHistoricalBump, strategy);

    if (nextVersion !== rootPkg.version) {
      rootPkg.version = nextVersion;
      await writeJSON(rootPackageJsonPath, rootPkg);

      const bumpType = semver.prerelease(nextVersion) ? 'prerelease' : workspaceBump;

      // Use git strategy to commit the root version change
      await gitStrategy.commitVersionChange(process.cwd(), rootPkg.name || 'root', rootPkg.version, bumpType, commitMsgTemplate);

      bumped[rootPkg.name] = { version: rootPkg.version, bumpType: bumpType, sha: null };
      hasBumped = true;

      if (semver.prerelease(rootPkg.version)) {
        core.info(`[root@${rootPkg.version}] Bumped to ${rootPkg.version} (prerelease)`);
      } else {
        core.info(`[root@${rootPkg.version}] Bumped to ${rootPkg.version} (${workspaceBump})`);
      }
    } else {
      core.info(`[root@${rootPkg.version}] Skipping - strategy '${strategy}' with no changes needed`);
    }
  } else if (workspaceBump && workspaceBump !== rootHistoricalBump) {
    // Step 4: Use workspace bump if different from historical
    const nextVersion = getNextVersion(rootPkg.version, workspaceBump, rootHistoricalBump, 'apply-bump');
    rootPkg.version = nextVersion;
    await writeJSON(rootPackageJsonPath, rootPkg);

    // Use git strategy to commit the root version change
    await gitStrategy.commitVersionChange(process.cwd(), rootPkg.name || 'root', rootPkg.version, workspaceBump, commitMsgTemplate);

    bumped[rootPkg.name] = { version: rootPkg.version, bumpType: workspaceBump, sha: null };
    hasBumped = true;

    core.info(`[root@${rootPkg.version}] Bumped to ${rootPkg.version} (${workspaceBump})`);
  } else if (workspaceBump) {
    core.info(`[root@${rootPkg.version}] No changes requiring version bump`);
  } else {
    core.info(`[root] Root was bumped in workspace processing`);
  }

  return { bumped, hasBumped };
}

async function generateSummary(bumped, testFailures, strategy, activeBranch, baseBranch, tagPrereleases, shouldFinalizeVersions) {
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
    `Active branch: ${activeBranch}`,
    `Base branch: ${baseBranch || 'N/A'}`,
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
    core.notice(`Version bump completed: ${totalPackages} packages updated (${releasePackages} releases, ${prereleasePackages} prereleases)`);
  } else {
    core.info(`[summary] No packages required version changes with strategy '${strategy}'`);
    core.notice(`No version changes needed with strategy '${strategy}'`);
  }

  // Set comprehensive outputs
  core.setOutput('packages-updated', totalPackages);
  core.setOutput('releases-created', releasePackages);
  core.setOutput('prereleases-created', prereleasePackages);
  core.setOutput('versions-finalized', finalizedPackages);
  core.setOutput('test-failures', testFailures.length);
  core.setOutput('strategy-used', strategy);
  core.setOutput('changes-made', totalPackages > 0);

  // Export useful environment variables
  core.exportVariable('VERSION_BUMP_PACKAGES_UPDATED', totalPackages);
  core.exportVariable('VERSION_BUMP_CHANGES_MADE', totalPackages > 0);
  core.exportVariable('VERSION_BUMP_STRATEGY', strategy);

  return { totalPackages, releasePackages, prereleasePackages, finalizedPackages };
}

async function handleBranchOperations(newBranch, hasBumped, rootPkg, branchTemplate, branchCleanup, templateRegex, tagPrereleases, gitStrategy) {
  let outputBranch = newBranch;

  // Branch and tag handling
  if (newBranch && hasBumped) {
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
    core.info(`[root] Checking out ${versionedBranch} from ${newBranch}`);
    await git.checkoutBranch(versionedBranch, newBranch);
    core.info(`[root] Deleting ${newBranch}`);
    await git.deleteLocalBranch(newBranch, true);
    outputBranch = versionedBranch;

    const cleanupStrategy = BranchCleanupStrategyFactory.getStrategy(branchCleanup);
    const rootBump = guessBumpType(rootPkg.version);
    await cleanupStrategy.execute(branches, versionedBranch, templateRegex, rootBump);
  } else {
    // Use git strategy to create tags
    await gitStrategy.tagVersion(rootPkg.version, semver.prerelease(rootPkg.version), tagPrereleases);
  }

  return outputBranch;
}

function interpolate(template, vars) {
  return template.replace(/\$\{(\w+)\}/g, (_, v) => vars[v] ?? '');
}

function getPackageManager() {
  return PackageManagerFactory.getPackageManager();
}

async function testPackage(packageDir) {
  const packageManager = getPackageManager();
  try {
    const testResult = await packageManager.test(packageDir);
    return testResult;
  } catch (error) {
    core.warning(`Test execution failed for ${packageDir}: ${error.message}`);
    return { success: false, error: error.message };
  }
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

function getNextVersion(currentVersion, commitBasedBump, historicalBump, strategyName = 'do-nothing') {
  const current = semver.coerce(currentVersion) || '0.0.0';

  // Validate inputs
  if (commitBasedBump && !['major', 'minor', 'patch'].includes(commitBasedBump)) {
    throw new Error(`Invalid commitBasedBump: ${commitBasedBump}`);
  }

  if (commitBasedBump === historicalBump) {
    // Same bump type - use configured strategy
    core.debug(`Same bump type detected (${commitBasedBump}), using strategy: ${strategyName}`);

    const strategy = VersionBumpStrategyFactory.getStrategy(strategyName);
    const nextVersion = strategy.execute(currentVersion, commitBasedBump, historicalBump);

    // Handle do-nothing strategy return value
    if (nextVersion === currentVersion && strategyName === 'do-nothing') {
      return null; // Skip bump
    }

    return nextVersion;
  } else {
    // Different bump type - normal semver bump (always apply)
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
  let outputBranch = undefined;
  let hasBumped = false;

  try {
    // Step 1: Parse and validate configuration
    const config = await parseConfiguration();
    const { commitMsgTemplate, depCommitMsgTemplate, shouldCreateBranch, branchTemplate,
      templateRegex, branchCleanup, baseBranch, strategy, activeBranch, tagPrereleases } = config;

    // Step 2: Setup git and determine branches
    const { currentBranch, newBranch } = await setupGit(shouldCreateBranch, branchTemplate);

    // Step 3: Load root package and setup workspace
    const rootDir = process.cwd();
    const rootPkg = await readJSON(path.join(rootDir, "package.json"));
    const packageManager = getPackageManager();

    // Initialize strategies
    const gitStrategy = GitOperationStrategyFactory.getStrategy('conventional');
    core.info(`[config] Package manager: ${packageManager.name}`);
    core.info(`[config] Git strategy: ${gitStrategy.name}`);

    // Step 4: Determine reference point for version comparison
    const { referenceCommit, referenceVersion, shouldFinalizeVersions } =
      await determineReferencePoint(baseBranch, activeBranch);

    // Step 5: Discover packages and build dependency graph
    const pkgDirs = await getPackageDirs(rootPkg);
    const { graph, nameToDir } = await buildDepGraph(pkgDirs);
    const order = topoSort(graph);

    // Create Package instances for easier management
    const packages = order.map(name => {
      const { dir, pkg } = graph[name];
      const packageJsonPath = path.join(dir, "package.json");
      return new Package(name, dir, pkg, packageJsonPath);
    });

    let bumped = {};
    let testFailures = [];

    // Step 6: Handle prerelease finalization or normal processing
    if (shouldFinalizeVersions) {
      const result = await finalizePackageVersions(packages, rootPkg, commitMsgTemplate, gitStrategy);
      bumped = result.bumped;
      hasBumped = result.hasBumped;
    } else {
      // Step 6a: Process workspace packages
      const workspaceResult = await processWorkspacePackages(
        packages, referenceCommit, referenceVersion, strategy, commitMsgTemplate, depCommitMsgTemplate, gitStrategy, packageManager);
      bumped = workspaceResult.bumped;
      testFailures = workspaceResult.testFailures;
      hasBumped = Object.keys(bumped).length > 0;

      // Step 6b: Process root package
      const rootResult = await processRootPackage(rootPkg, bumped, referenceCommit, referenceVersion, strategy, commitMsgTemplate, gitStrategy);
      bumped = rootResult.bumped;
      if (rootResult.hasBumped) hasBumped = true;
    }

    // Step 7: Generate comprehensive summary and outputs
    await generateSummary(bumped, testFailures, strategy, activeBranch, baseBranch, tagPrereleases, shouldFinalizeVersions);

    // Step 8: Handle branch operations and cleanup
    outputBranch = await handleBranchOperations(newBranch, hasBumped, rootPkg, branchTemplate, branchCleanup, templateRegex, tagPrereleases, gitStrategy);

    // Step 9: Final validation and completion
    if (hasBumped) {
      core.info("✅ Version bump action completed successfully with changes");
    } else {
      core.info("✅ Version bump action completed successfully with no changes needed");
    }

    // Validate final state
    try {
      const finalRootPkg = await readJSON(path.join(rootDir, "package.json"));
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
    // Step 10: Push changes if any were made
    if (hasBumped) {
      try {
        if (outputBranch) {
          core.info(`[git] Pushing ${outputBranch} to origin`);
          await git.push("origin", outputBranch, ["--set-upstream", "--force"]);
          core.setOutput("branch", outputBranch);
          core.info(`[git] Successfully pushed ${outputBranch}`);
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
  core.summary.write({ overwrite: true });
  process.exit(exitCode);
}

function guessBumpType(version) {
  if (version.endsWith('.0.0')) return 'major';
  if (version.endsWith('.0')) return 'minor';
  return 'patch';
}

main(); 