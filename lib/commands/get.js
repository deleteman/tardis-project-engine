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
		this.action = "get"

	}

	parse() {
		let commandPattern = /get ([a-z _]+)/i
		let matches = this.data.action.toLowerCase().match(commandPattern)
		if(!matches[1]) {
			return "Unable to understand what to get "
		}
		this.target = matches[1].toLowerCase().trim()
		return true
	}	

	get(gstate, game, done) {
		let currentRoom = game.scenes[gstate.currentscene]
		let value = null
		if(this.target == 'gameid') {
			value = game._id
		}

		if(this.target == 'user' || this.target == 'username') {
			value = gstate.playername
		}

		if(value) return done(null, value)
		
		return done({
			status: 400,
			message: "Can't find the value ('" + this.target + "') you're looking for"
		})

	} 

	run(cb) {
		let parsingResult = this.parse()
		if(parsingResult !== true) {
			return cb({
				status: 400,
				message: parsingResult
			})
		}

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
			
			this.get( gstate, gstate.game, (err, value) => {
				if(err) return cb(err)
				let response = new GameResponse(gstate, gstate.game, value)
				cb(null, response)
			})		
			
		})

	}

}