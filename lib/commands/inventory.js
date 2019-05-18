const GameState = require("../../models/gameState")
const requireDir = require("require-dir")
const cartridges = requireDir('../../cartridges')
const redis = require("redis")
const config = require("config")
const BaseCommand = require("./basecommand")
const async = require("async")
const GameResponse = require("../gameResponse")


module.exports = class Command extends BaseCommand{


	constructor(cmdData) {
		super()
		this.data = cmdData
		this.action = "inventory"

	}

	parse() {
	}	



	getInventory(gstate, game, done) {
		done(null, gstate.inventory)
	}
	 

	run(cb) {
		this.parse()

		GameState.findOne({
			game: this.data.context.gameId,
			playername: this.data.context.playername
		})
		.populate('game')
		.exec((err, gstate) => {
			if(err) return cb(err)
			if(!gstate) return cb({
				status: 404,
				message: "Game state not found"
			})

			console.log(gstate)
			let gCart = cartridges[gstate.game.cartridgeid]
			if(!gCart) return cb({
				status: 500,
				message: "The game cartridge '" + gstate.game.cartridgeid + "' can't be found"
			})
			
			this.getInventory( gstate, gstate.game, (err, inventory) => {
				if(err) return cb(err)
				let response = new GameResponse(gstate, gstate.game)
				let jsonResp = response.toJSON()
				jsonResp.inventory = inventory.toJSON()
				cb(null, jsonResp)
			})		
			
		})

	}

}