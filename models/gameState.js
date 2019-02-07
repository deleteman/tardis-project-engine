const requireDir = require("require-dir")
const mongoose = require("mongoose")
const uuidv1 = require("uuid/v1")
const config = require("config")
const cartridges = requireDir("../cartridges")
const game = require("./game.js")
const Schema = mongoose.Schema


const redis = require("redis")

const InventorySchema = new Schema( {
	hands: Schema.Types.Mixed,
	bag: [Schema.Types.Mixed]
})

/*
Game State for a specfic player

*/
const gameStateSchema = new Schema({
	game:  {
		type: Schema.Types.ObjectId,
		ref: 'GameInstance'
	},
	playername: String,
	playerkey: String,
	currentscene: String,
	creationdate: Date,
	walkednorth: Number,
	walkedsouth: Number,
	walkedeast: Number,
	walkedwest: Number,
	playerhp: Number,
	inventory: InventorySchema 
})

gameStateSchema.index({
	playername: 1,
	game: 1
}, {unique: true})


/*
Records de movement request of a party player
Once most of the party decides on a movement action, 
the game will move all of them on the most requested direction
*/
gameStateSchema.methods.addMoveRequest = function(direction, done) {
	console.log("Adding move request in direction: " +direction)
	let rClient = redis.createClient(config.get('redis.connectionInfo'))
	let moveKeyName = this.game._id + '-party-moves-requests'
	let directionsKeyName = this.game._id + '-party-moves-directions'
	let partyMembersKeyName = this.game._id + '-party'

	/**/
	rClient.sadd(moveKeyName, this.playername, (err) => {
		if(err) return done(err)
		rClient.hincrby(directionsKeyName, direction, 1, (err) => {
			if(err) return done(err)

			//calcular cnantidad de party members
			rClient.scard(partyMembersKeyName, (err, partySize) => {
				if(err) return done(err)
				rClient.scard(moveKeyName, (err, moveRequests) => {
					console.log("Move requests: " + moveRequests)
					console.log("Party size: " + partySize)
					done(err, +moveRequests >= (Math.floor(+partySize/2)+1))
				})
			})
		})
	})
		// */
}

gameStateSchema.methods.loadCurrentSceneData = function(cb) {
	game.findOne({})
		.populate('game')
		.exec((err, model) => {
			if(err) return cb(err)
			if(!cartridges[model.cartridgeid]) return cb({
				status: 500,
				message: "The Cartridge  '" + model.cartridgeid + "' can't be found"
			})

			let jsonModel = model.toJSON()
			jsonModel.scene = cartridges[model.cartridgeid].rooms[this.currentscene]
			return cb(null, jsonModel)
		})
}

gameStateSchema.methods.resetWalkedDistances = function(cb) {
	this.walkedwest = 0
	this.walkedeast	= 0
	this.walkedsouth = 0
	this.walkednorth = 0
	let rClient = redis.createClient(config.get('redis.connectionInfo'))

	let directionsKeyName = this.game._id + '-party-moves-directions'
	rClient.del(directionsKeyName, cb)
}

gameStateSchema.post('save', function (state, next) {

	let rClient = redis.createClient(config.get('redis.connectionInfo'))
	let keyName = ((this.game._id) ? this.game._id : this.game ) + '-party'

	rClient.sadd(keyName, this.playername, next)
})

gameStateSchema.pre('save', function (next){
	if(this.playerkey) return next() //avoid setting defaults if we're updating the model
	this.playerkey = uuidv1() 
	this.creationdate = new Date()

	this.walkedwest = 0
	this.walkedeast = 0
	this.walkedsouth = 0
	this.walkednorth = 0

	this.playerhp = config.get('playerstats.defaulthp')

	this.inventory = {
		hands: null,
		bag: []
	}

	game
		.findOne({game: this.gameid})
		.exec( (err, game) => {
			if(err) return next(err)
			if(!game) return next({
				status: 404,
				message: "Invalid game ID, game not found"
			})
			let cId = game.cartridgeid
			if(!cartridges[cId]) return next( {
				status: 500,
				message: "Cartridge ID '" + cId + "' appears to be invalid"
			})
			//Get the first scene of the game
			let firstRoom = Object.keys(cartridges[cId].rooms)[0]
			this.currentscene = firstRoom
			next()
		})
})

module.exports =  mongoose.model('GameState', gameStateSchema)

