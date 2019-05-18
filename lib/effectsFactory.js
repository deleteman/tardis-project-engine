const requireDir = require("require-dir")

const effects = requireDir("./effects")


module.exports =  {

	getEffect: function(data) {

		if(data.addStatus && data.target) return new (effects['addStatus'])(data)
		if(data.removeStatus && data.target) return new (effects['removeStatus'])(data)
		if(data.statusUpdate && data.target) return new (effects['statusUpdate'])(data)

		return false
	}
}


