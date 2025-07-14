// Package Manager Strategies
const { PackageManagerStrategy } = require('./base.cjs')
const { PackageManagerFactory } = require('./factory.cjs')
const { NpmPackageManagerStrategy } = require('./npm.cjs')
const { PnpmPackageManagerStrategy } = require('./pnpm.cjs')
const { YarnPackageManagerStrategy } = require('./yarn.cjs')

module.exports = {
  PackageManagerStrategy,
  YarnPackageManagerStrategy,
  NpmPackageManagerStrategy,
  PnpmPackageManagerStrategy,
  PackageManagerFactory,
}
