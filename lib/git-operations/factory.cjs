const { ConventionalCommitStrategy } = require('./conventional.cjs');
const { SimpleCommitStrategy } = require('./simple.cjs');
const core = require('@actions/core');

class GitOperationStrategyFactory {
  static strategies = {
    'conventional': new ConventionalCommitStrategy(),
    'simple': new SimpleCommitStrategy()
  };
  
  static getStrategy(strategyName = 'conventional') {
    const strategy = this.strategies[strategyName];
    if (!strategy) {
      core.warning(`Unknown git strategy: ${strategyName}, falling back to conventional`);
      return this.strategies['conventional'];
    }
    return strategy;
  }
  
  static getAvailableStrategies() {
    return Object.keys(this.strategies);
  }
}

module.exports = { GitOperationStrategyFactory };