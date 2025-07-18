const core = require('@actions/core')
const { TagDiscoveryStrategy } = require('./tag-strategy.cjs')
const { BranchDiscoveryStrategy } = require('./branch-strategy.cjs')

class DiscoveryStrategyFactory {
  static strategies = {
    'tag-based': new TagDiscoveryStrategy(),
    'branch-based': new BranchDiscoveryStrategy(),
  }

  static getStrategy(baseBranch) {
    if (baseBranch) {
      return this.strategies['branch-based']
    }
    else {
      return this.strategies['tag-based']
    }
  }

  static getAvailableStrategies() {
    return Object.keys(this.strategies)
  }
}

module.exports = { DiscoveryStrategyFactory } 