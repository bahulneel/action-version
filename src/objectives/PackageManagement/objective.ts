import path from 'node:path'
import type { Objective, PackageManagementGoals, ActionConfiguration, StrategyOf } from '@types'
import { Npm } from './strategies/Npm.js'
import { Yarn } from './strategies/Yarn.js'
import { Pnpm } from './strategies/Pnpm.js'

export const packageManagement: Objective<ActionConfiguration, PackageManagementGoals> = {
  strategise(_config): StrategyOf<PackageManagementGoals> {
    // Detect package manager from lockfiles synchronously
    const cwd = process.cwd()
    const fs = require('node:fs')
    const exists = (p: string) => {
      try {
        fs.accessSync(p)
        return true
      } catch {
        return false
      }
    }

    let kind: 'npm' | 'yarn' | 'pnpm' = 'npm'

    if (exists(path.join(cwd, 'pnpm-lock.yaml'))) {
      kind = 'pnpm'
    } else if (exists(path.join(cwd, 'yarn.lock'))) {
      kind = 'yarn'
    } else if (exists(path.join(cwd, 'package-lock.json'))) {
      kind = 'npm'
    }

    const pmConfig = { kind }

    switch (kind) {
      case 'pnpm':
        return new Pnpm(pmConfig)
      case 'yarn':
        return new Yarn(pmConfig)
      case 'npm':
      default:
        return new Npm(pmConfig)
    }
  },
}
