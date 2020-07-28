const {
	override,
	babelInclude,
	removeModuleScopePlugin
} = require("customize-cra")

const path = require("path")

module.exports = override(
	babelInclude(
		path.resolve('src'),
		path.resolve('../common')
	),
	removeModuleScopePlugin()
)
