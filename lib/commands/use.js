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
		this.action = "use"

	}

	parse() {
		let commandPattern = /use ([a-z _]+) on ([a-z _]+)/i
		let matches = this.data.action.toLowerCase().match(commandPattern)
		if(!matches) {
			return "Malformed use command, please specify the target and the item"
		}
		if(!matches[1]) {
			return "Unable to understand what to use the item on "
		}
		if(!matches[2]) {
			return "Unable to understand what to use"
		}
		this.target = matches[2]
		this.item = matches[1]
		return true
	}	

	useOnExit(params, done) {

		/*
		1. get the triggers for the item
		2. find triggers for "use" and room = current room and exit = exit.id
		3. execute effect
		*/

		let triggers = params.item.triggers.filter( t => {
			return t.action == 'use' && t.target.room == params.gstate.currentscene && t.target.exit == params.target.name
		})

		if(!triggers) return false
		params.item.triggers = triggers //make sure any trigger processed is for the current room and target
		this.processTriggers(params.gstate, params.item, done)
	}

	useOnNPC(params, done) {

		done({
			status: 500,
			message: "Not implemented yet"
		})
		
	}


	useOnItem(params, done) {
		done({
			status: 500,
			message: "Not implemented yet"
		})
	}

	useItem(gstate, game, done) {
		let currentRoom = game.scenes[gstate.currentscene]
		let npcs = currentRoom.npcs
		let items = currentRoom.items
		let exits = currentRoom.exits

		let itemObj = null


		console.log("Trying to use ", this.item, " on ", this.target)
		if(gstate.inventory.hands) {
			if(gstate.inventory.hands.name.toLowerCase() == this.item.toLowerCase()) itemObj= gstate.inventory.hands
		} 

		if(!itemObj) {
			itemObj= gstate.inventory.bag.find( i => {
				return i.name.toLowerCase().trim() == this.item.toLowerCase().trim()
			})
		}
		if(!itemObj) return done({
			status: 400,
			message: "I don't know what '" + this.item + "' is."
		})

		let params = {
			item: itemObj,
			gstate: gstate,
			game: game
		}

		let targetObj = null

		if(npcs) {
			targetObj = npcs.find( i => {
				return i.name.toLowerCase() == this.target.toLowerCase()
			})
			if(targetObj) {
				params.target = targetObj
				return this.useOnNPC(params, done)
			}
		}

		if(items) {
			targetObj = items.find( i => {
				return i.name.toLowerCase() == this.target.toLowerCase()
			})
			if(targetObj) {
				params.target = targetObj
				return this.useOnItem(params, done)
			}
		}

		if(exits) {
			targetObj = null

			Object.keys(exits).forEach( direction => {
				if(exits[direction].name.toLowerCase().trim() == this.target.toLowerCase().trim()) {
					targetObj = exits[direction]
				}
			})

			if(targetObj) {
				params.target = targetObj
				return this.useOnExit(params, done)
			}
		}
		

		return done({
			status: 400,
			message: "Can't find the '" + this.target + "' you want to interact with"
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
			
			this.useItem( gstate, gstate.game, (err, newGameInstance, responseMsg) => {
				if(err) return cb(err)
				if(!responseMsg) responseMsg = "That was successful!"
				if(Array.isArray(newGameInstance)) newGameInstance = newGameInstance[0]
				this.checkFinalConditions(gstate, newGameInstance, (err, finalMsg) => {
					if(err) return cb(err)
					let response = new GameResponse(gstate, newGameInstance, responseMsg)
					cb(null, response)
				})
			})		
			
		})

	}

}