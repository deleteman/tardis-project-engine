const requireDir = require("require-dir")

const models = requireDir("./")

module.exports = {
	get: (name) => {
		if(models[name]) {
			return models[name]
		}
		return null;
	}
}