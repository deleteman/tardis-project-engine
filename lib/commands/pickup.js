const GameState = require("../../models/gameState")
const Game = require("../../models/game")
const requireDir = require("require-dir")
const cartridges = requireDir('../../cartridges')
const redis = require("redis")
const config = require("config")
const async = require("async")
const EffectFactory = require("../effectsFactory")
const BaseCommand = require("./basecommand")
const GameResponse = require("../gameResponse")


module.exports = class PickUpCommand extends BaseCommand{


	constructor(cmdData) {
		super()
		this.data = cmdData
		this.action = "pickup"
	}

	parseCommand() {
		this.target = this.data.action.toLowerCase().split(" ").slice(1).join(" ")
	}

	pikcupItem(gstate, item, cb) {
		if(item.destination == 'hand') {
			if(!gstate.inventory.hands) {
				gstate.inventory.hands = item
			} else {
				return cb( {
					status: 400,
					message: "I can't pick that up, my hand is already holding something"
				})
			}
		} else {
			gstate.inventory.bag.push(item)
		}
		gstate.save(cb)
	}


	getItemFromScene(game, gstate, sceneId, cb) {
		console.log(game)

		if(!game.scenes[sceneId]) return cb({
			status: 500,
			message: "Scene id '" + sceneId + "' not found within current game"
		})

		let sceneItems = game.scenes[sceneId].items
		let foundIndex = -1

		console.log("Looking for: " +this.target)
		let item = sceneItems.find( (item, idx) => {
			if(item.name.toLowerCase() == this.target) {
				console.log("Item found: ")
				console.log(item)
				foundIndex = idx
				return true
			}
			return false
		})
		if(!item) return cb({
			status: 400,
			message: "There is no '" + this.target + "' in sight"
		})

		if(foundIndex != -1) { //The item is there, we need to check if we can pick it up
			
			return this.pikcupItem(gstate, item, (err, gstate) => {
				if(err) return cb(err)
				sceneItems.splice(foundIndex, 1) //remove the item from the scene
				game.scenes[sceneId].items = sceneItems
				this.processTriggers(gstate, item, (err) => { //needs to check for end conditions
					if(err) return cb(err)
					
					//Updating and then reloading, because game.save doesn't appear to work
					game.updateOne({scenes: game.scenes}, (err) => {
						if(err) return cb(err)
						Game.findOne({_id: game._id}, cb)
					})
				})
			})
		}
		game.save(cb)
	}



	run(cb) {
		this.parseCommand()

		GameState.findOne({
			game: this.data.context.gameId,
			playername: this.data.context.playername
		})
		.populate('game')
		.exec((err, gstate) => {

		async.parallel({
			gstate: (done) => {
				GameState.findOne({
					game: this.data.context.gameId,
					playername: this.data.context.playername
				})
				.exec(done)	
			},
			game: (done) => {
				Game.findOne({
					_id: this.data.context.gameId
				}).exec(done)
			}
		}, (err, results) => {
			if(err) return cb(err)

			if(!results.gstate) return cb({
				status: 404,
				message: "Game state not found"
			})

			if(!results.game) return cb({
				status: 404,
				message: "Game instance not found"
			})

			let game = results.game

			//gstate.game = results.game
			console.log(game)
			console.log("-------------------")
			console.log(game.scenes[gstate.currentscene].items)
			console.log("-------------------")
			console.log("-------------------")

			this.getItemFromScene(game, gstate, gstate.currentscene, (err, newGInstance) => {
				if(err) return cb({
					status:400,
					message: "I can't pick that up",
					trace: err
				})
				this.checkFinalConditions(gstate, newGInstance, (err, message) => {
					if(err) return cb(err)
					let response = new GameResponse(gstate, newGInstance, message)
					console.log(newGInstance.scenes[gstate.currentscene].items)
					cb(null, response)
				})	
			})
		})
		/*
			if(err) return cb(err)
			if(!gstate) return cb({
				status: 404,
				message: "Game state not found"
			})

			console.log(gstate.game)
			console.log("-------------------")
			console.log(gstate.game.scenes[gstate.currentscene].items)
			console.log("-------------------")
			console.log("-------------------")

			this.getItemFromScene(gstate, gstate.currentscene, (err, newGInstance) => {
				if(err) return cb({
					status:400,
					message: "I can't pick that up",
					trace: err
				})
				this.checkFinalConditions(gstate, newGInstance, (err, message) => {
					if(err) return cb(err)
					let response = new GameResponse(gstate, newGInstance, message)
					console.log(newGInstance.scenes[gstate.currentscene].items)
					cb(null, response)
				})	
			})
		*/	
		})

	}

}