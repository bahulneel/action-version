// Git Operation Strategies
const { GitOperationStrategy } = require('./base.cjs');
const { ConventionalCommitStrategy } = require('./conventional.cjs');
const { SimpleCommitStrategy } = require('./simple.cjs');
const { GitOperationStrategyFactory } = require('./factory.cjs');

module.exports = {
  GitOperationStrategy,
  ConventionalCommitStrategy,
  SimpleCommitStrategy,
  GitOperationStrategyFactory
};