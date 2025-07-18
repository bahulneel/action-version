import * as core from '@actions/core';
import conventionalCommitsParser from 'conventional-commits-parser';
import type { CommitInfo, BumpType } from '../types/index.js';

/**
 * Parse conventional commits from git log entries.
 */
export function parseCommits(logEntries: any[], sinceRef?: string): CommitInfo[] {
  const commits: CommitInfo[] = [];
  
  for (const entry of logEntries) {
    const messageHeader = entry.message.split('\n')[0];
    
    if (sinceRef && entry.hash === sinceRef) {
      core.debug(`Skipping commit ${entry.hash} because it is the same as the sinceRef: ${messageHeader}`);
      continue;
    }
    
    core.debug(`Parsing commit ${entry.hash}: ${messageHeader}`);
    
    const parsed = conventionalCommitsParser.sync(entry.message);
    const breaking = Boolean(
      (parsed.notes && parsed.notes.find(n => n.title === 'BREAKING CHANGE')) ||
      (typeof parsed.header === 'string' && /!:/.test(parsed.header))
    );
    
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

/**
 * Get the most significant bump type from a list of commits.
 */
export function getMostSignificantBump(commits: readonly CommitInfo[]): BumpType | null {
  let bump: BumpType = 'patch';
  
  for (const commit of commits) {
    if (commit.breaking) {
      return 'major'; // Breaking changes always result in major
    }
    if (commit.type === 'feat' && bump !== 'major') {
      bump = 'minor';
    }
  }
  
  return commits.length > 0 ? bump : null;
}

/**
 * Categorize commits by their type.
 */
export function categorizeCommits(commits: readonly CommitInfo[]): {
  breaking: CommitInfo[];
  features: CommitInfo[];
  fixes: CommitInfo[];
  other: CommitInfo[];
} {
  return {
    breaking: commits.filter(c => c.breaking),
    features: commits.filter(c => c.type === 'feat' && !c.breaking),
    fixes: commits.filter(c => c.type === 'fix' && !c.breaking),
    other: commits.filter(c => !c.breaking && c.type !== 'feat' && c.type !== 'fix'),
  };
}

/**
 * Generate a summary of commit changes for logging.
 */
export function summarizeCommits(commits: readonly CommitInfo[]): string {
  const categories = categorizeCommits(commits);
  const parts: string[] = [];
  
  if (categories.breaking.length > 0) {
    parts.push(`${categories.breaking.length} breaking`);
  }
  if (categories.features.length > 0) {
    parts.push(`${categories.features.length} features`);
  }
  if (categories.fixes.length > 0) {
    parts.push(`${categories.fixes.length} fixes`);
  }
  if (categories.other.length > 0) {
    parts.push(`${categories.other.length} other`);
  }
  
  return parts.join(', ') || 'no changes';
}