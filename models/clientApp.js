const mongoose = require("mongoose")
const uuidv1 = require("uuid/v1")
const redis = require("redis")
const config = require("config")

const clientAppSchema = new mongoose.Schema({
	name: String,
	unique_name: {
		type: String,
		index: {
			unique: true
		}
	},
	apikey: String,
	registrationDate: Date,
})

function normalizeName(name) {
	return name.replace(/[ ]/g, '_').toLowerCase()
}

clientAppSchema.statics.normalizeName = normalizeName

clientAppSchema.pre('save', function (next){
	this.unique_name = normalizeName(this.name)
	this.apikey = uuidv1()
	this.registrationDate = new Date()
	next()
})

clientAppSchema.methods.removeAPIKey = function(cb) {

	let rClient = redis.createClient()
	let keyName = 'apikey-' + this.apikey

	rClient.del(keyName, cb)

}

clientAppSchema.methods.updateAPIKey = function(cb) {

	this.removeAPIKey( (err) => {
		if(err) return cb(err)
		this.apikey = uuidv1()
		let model = mongoose.model('ClientApp', clientAppSchema)
		model.findOneAndUpdate({unique_name: this.unique_name}, {apikey: this.apikey})
			.exec( (err) => {
				if(err) return cb(err)
				this.registerAPIKey(cb)
			})
	})

}

clientAppSchema.methods.registerAPIKey = function(cb) {
	let rClient = redis.createClient()
	let keyName = 'apikey-' + this.apikey

	

	rClient.set(keyName, 1, (err, key) => {
		if(err) return cb(err)
		rClient.expire(keyName, config.get('clientKeys.ttl'), cb)
	})	
}


module.exports =  mongoose.model('ClientApp', clientAppSchema)

