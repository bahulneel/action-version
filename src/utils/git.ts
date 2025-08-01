import * as core from '@actions/core';
import simpleGit from 'simple-git';
import path from 'node:path';
import type { CommitInfo, GitSetupResult } from '../types/index.js';
import { parseCommits } from './commits.js';

const git = simpleGit();

/**
 * Setup git configuration and checkout appropriate branch.
 */
export async function setupGit(shouldCreateBranch: boolean, branchTemplate: string): Promise<GitSetupResult> {
  // Configure git user
  await git.addConfig('user.name', 'github-actions[bot]');
  await git.addConfig('user.email', 'github-actions[bot]@users.noreply.github.com');

  // Fetch latest changes
  try {
    core.debug(`[git] Fetching latest changes from origin`);
    await git.fetch(['--prune', 'origin']);
    core.debug(`[git] Successfully fetched from origin`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(`[git] Failed to fetch from origin: ${errorMessage}`);
  }

  const currentBranch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'main';
  const newBranch = shouldCreateBranch ? interpolateBranchTemplate(branchTemplate, { version: currentBranch }) : undefined;

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`[git] Failed to checkout branch: ${errorMessage}`);
    throw new Error(`Failed to checkout branch: ${errorMessage}`);
  }

  return { currentBranch, newBranch };
}

/**
 * Get commits affecting a specific directory since a reference point.
 */
export async function getCommitsAffecting(dir: string, sinceRef: string): Promise<CommitInfo[]> {
  const range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
  const log = await git.log([range, '--', dir]);
  const commits = parseCommits([...log.all], sinceRef);
  
  const relativePath = path.relative(process.cwd(), dir) || '/';
  core.info(`[${relativePath}] ${commits.length} commits affecting since ${sinceRef}`);
  
  return commits;
}

/**
 * Push changes to remote repository.
 */
export async function pushChanges(branch?: string): Promise<void> {
  try {
    if (branch) {
      core.info(`[git] Pushing ${branch} to origin`);
      await git.push('origin', branch, ['--set-upstream', '--force']);
      core.info(`[git] Successfully pushed ${branch}`);
    } else {
      core.info(`[git] Pushing current branch and tags`);
      await git.push();
      await git.pushTags();
      core.info(`[git] Successfully pushed changes and tags`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`[git] Failed to push changes: ${errorMessage}`);
    throw new Error(`Failed to push changes: ${errorMessage}`);
  }
}

/**
 * Get git branch information.
 */
export async function getBranches() {
  return await git.branch(['--list', '--remote']);
}

/**
 * Delete a local branch safely.
 */
export async function deleteLocalBranch(branchName: string, force = false): Promise<void> {
  try {
    await git.deleteLocalBranch(branchName, force);
    core.debug(`[git] Successfully deleted local branch ${branchName}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(`[git] Failed to delete local branch ${branchName}: ${errorMessage}`);
  }
}

/**
 * Simple template interpolation for branch names.
 */
function interpolateBranchTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{(\w+)\}/g, (match, variableName: string) => {
    const value = vars[variableName];
    return value !== undefined ? String(value) : match;
  });
}