// Package Manager Strategies
const { PackageManagerStrategy } = require('./base.cjs');
const { YarnPackageManagerStrategy } = require('./yarn.cjs');
const { NpmPackageManagerStrategy } = require('./npm.cjs');
const { PnpmPackageManagerStrategy } = require('./pnpm.cjs');
const { PackageManagerFactory } = require('./factory.cjs');

module.exports = {
  PackageManagerStrategy,
  YarnPackageManagerStrategy,
  NpmPackageManagerStrategy,
  PnpmPackageManagerStrategy,
  PackageManagerFactory
};
