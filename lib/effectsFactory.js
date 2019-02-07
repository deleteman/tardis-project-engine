const requireDir = require("require-dir")

const effects = requireDir("./effects")


module.exports =  {

	getEffect: function(data) {

		if(data.addStatus && data.target) return new (effects['addStatus'])(data)
		if(data.removeStatus && data.target) return new (effects['removeStatus'])(data)

		return false
	}
}


