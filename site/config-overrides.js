const {
	override,
	babelInclude,
	removeModuleScopePlugin,
	adjustStyleLoaders
} = require("customize-cra")

const path = require("path")

module.exports = override(
	removeModuleScopePlugin(),
	babelInclude([
		path.resolve('src'),
		path.resolve('../common')
	]),
	adjustStyleLoaders(loaders => {
		const resolveUrlLoader = loaders.use.find(l => l && l.loader && l.loader.includes('resolve-url-loader'))
		if (resolveUrlLoader) {
			resolveUrlLoader.options.removeCR = true
		}
	})
)
