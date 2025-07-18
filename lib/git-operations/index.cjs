// Git Operation Strategies
const { GitOperationStrategy } = require('./base.cjs')
const { ConventionalCommitStrategy } = require('./conventional.cjs')
const { GitOperationStrategyFactory } = require('./factory.cjs')
const { SimpleCommitStrategy } = require('./simple.cjs')
const { TagDiscoveryStrategy } = require('./tag-strategy.cjs')
const { BranchDiscoveryStrategy } = require('./branch-strategy.cjs')
const { DiscoveryStrategyFactory } = require('./discovery-factory.cjs')

module.exports = {
  GitOperationStrategy,
  ConventionalCommitStrategy,
  SimpleCommitStrategy,
  GitOperationStrategyFactory,
  TagDiscoveryStrategy,
  BranchDiscoveryStrategy,
  DiscoveryStrategyFactory,
}
