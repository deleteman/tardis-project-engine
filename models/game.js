const requireDir = require("require-dir")
const mongoose = require("mongoose")
const uuidv1 = require("uuid/v1")
const config = require("config")
const cartridges = requireDir("../cartridges")

const gameSchema = new mongoose.Schema({
	cartridgeid: String,
	creationdate: Date,
	scenes: mongoose.Schema.Types.Mixed,
	status: mongoose.Schema.Types.Mixed
})

gameSchema.virtual('gameid').get(function() {
	return this._id
})

gameSchema.pre('save', function (next){
	if(this.creationdate) return next() //avoid overwriting changes to game instance	

	this.creationdate = new Date()
	let cartridge = cartridges[this.cartridgeid]
	if(!cartridge) {
		return next("Invalid Cartridge ID: '" + this.cartridgeid + "'")
	}
	this.scenes = cartridge.rooms
	this.status = {}
	next()
})

module.exports =  mongoose.model('GameInstance', gameSchema)

