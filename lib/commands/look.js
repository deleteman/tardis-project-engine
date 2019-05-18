const GameState = require("../../models/gameState")
const requireDir = require("require-dir")
const cartridges = requireDir('../../cartridges')
const redis = require("redis")
const config = require("config")
const BaseCommand = require("./basecommand")
const async = require("async")
const GameResponse = require("../gameResponse")


module.exports = class LookCommand extends BaseCommand{


	constructor(cmdData) {
		super()
		this.data = cmdData
		this.action = "look"

	}

	parse() {
		let commandPattern = /look at ([a-z _]+)/i
		let matches = this.data.action.toLowerCase().match(commandPattern)
		if(!matches) {
			commandPattern = /look around/i
			matches = this.data.action.toLowerCase().match(commandPattern)
			if(matches) {
				this.target = 'room'
			}
		} else {
			this.target = matches[1]
		}
	}	



	lookAt(gstate, game, done) {

		let scene = game.scenes[gstate.currentscene]
		let descriptionStr = null
		if(this.target == 'room' || this.target == 'scene') { //describe the room
			let description = scene.description
			if(description.conditionals) {
				let cond = Object.keys(description.conditionals).find( c => {
					if(!game.status) return false
					return game.status[c] == 1
				})
				if(cond) {
					descriptionStr = description.conditionals[cond]
				} else {
					descriptionStr = description.default
				}
			} else {
				descriptionStr = description.default
			}
			return done(null, {
				message: descriptionStr
			})
		}

		let items = scene.items
		let targetObj = items.find( i => { //describe an item in the room
			return i.name.toLowerCase() == this.target.toLowerCase()
		})
		if(targetObj) {
			descriptionStr = targetObj.description
		} else {
			let npcs = scene.npcs //describe an NPC
			if(npcs) {
				targetObj = npcs.find( n => {
					return n.name.toLowerCase() == this.target.toLowerCase()
				})
				if(targetObj) descriptionStr = targetObj.description
			}
		}

		if(!descriptionStr) { //describe inventory items
			if(gstate.inventory.hands) {
				if(gstate.inventory.hands.name.toLowerCase() == this.target) descriptionStr = gstate.inventory.hands.description
			} else {
				if(gstate.inventory.bag) {
					targetObj = gstate.inventory.bag.find( i => {
						return i.name.toLowerCase() == this.target
					})
					descriptionStr = targetObj.description
				}
			}
		}

		if(!descriptionStr) {
			descriptionStr = "I can't find what you're looking for"
		}
		done(null, {
			message: descriptionStr
		})

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
			
			this.lookAt( gstate, gstate.game, (err, responseMsg) => {
				if(err) return cb(err)
				let response = new GameResponse(gstate, gstate.game, responseMsg)
				cb(null, response)
			})		
			
		})

	}

}