import simpleGit from 'simple-git'
import type { Git, GitBranches } from '../../types/index.js'

/**
 * SimpleGit adapter implementation.
 * Wraps the simple-git library to implement the Git interface.
 */
export class SimpleGit implements Git {
  private readonly git = simpleGit()

  // Branch operations
  async branch(options: string[]): Promise<GitBranches> {
    const result = await this.git.branch(options)
    return {
      all: result.all,
      current: result.current,
    }
  }

  async checkout(ref: string | string[]): Promise<void> {
    if (Array.isArray(ref)) {
      await this.git.checkout(ref)
    } else {
      await this.git.checkout(ref)
    }
  }

  async deleteLocalBranch(branchName: string, force = false): Promise<void> {
    await this.git.deleteLocalBranch(branchName, force)
  }

  // Commit operations
  async add(file: string): Promise<void> {
    await this.git.add(file)
  }

  async commit(message: string): Promise<void> {
    await this.git.commit(message)
  }

  // Tag operations
  async tag(options: string[]): Promise<void> {
    await this.git.tag(options)
  }

  async addTag(tagName: string): Promise<void> {
    await this.git.addTag(tagName)
  }

  async pushTags(): Promise<void> {
    await this.git.pushTags()
  }

  async tags(options: string[] = []): Promise<{ latest: string | null }> {
    const result = await this.git.tags(options)
    return { latest: result.latest ?? null }
  }

  // Reference operations
  async revparse(refs: string[]): Promise<string> {
    return await this.git.revparse(refs)
  }

  async raw(command: string, ...args: string[]): Promise<void> {
    await this.git.raw(command, ...args)
  }

  // Remote operations
  async push(remote?: string, branch?: string, options?: string[]): Promise<void> {
    if (remote && branch && options) {
      await this.git.push(remote, branch, options)
    } else if (remote && branch) {
      await this.git.push(remote, branch)
    } else {
      await this.git.push()
    }
  }

  async fetch(options: string[]): Promise<void> {
    await this.git.fetch(options)
  }

  // Log operations
  async log(options: string[]): Promise<{ all: any[] }> {
    const result = await this.git.log(options)
    return { all: [...result.all] }
  }

  async diff(options: string[]): Promise<string> {
    return await this.git.diff(options)
  }

  // Configuration
  async addConfig(key: string, value: string): Promise<void> {
    await this.git.addConfig(key, value)
  }
}
