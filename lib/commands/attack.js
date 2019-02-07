const GameState = require("../../models/gameState")
const requireDir = require("require-dir")
const cartridges = requireDir('../../cartridges')
const redis = require("redis")
const config = require("config")
const BaseCommand = require("./basecommand")
const async = require("async")
const GameResponse = require("../gameResponse")


module.exports = class AttackCommand extends BaseCommand{


	constructor(cmdData) {
		super()
		this.data = cmdData
		this.action = "attack"

	}

	parse() {
		let commandPattern = /attack ([a-z _]+) with ([a-z _]+)/i
		let matches = this.data.action.toLowerCase().match(commandPattern)
		this.target = matches[1]
		this.weapon = matches[2]
	}	

	attackNPC(params, done) {

		if(params.target.stats.weaknesses.indexOf(params.weapon.type) != -1) {

			params.game.scenes[params.gstate.currentscene].npcs = params.game.scenes[params.gstate.currentscene].npcs.filter( n => {
				n.name.toLowerCase() != params.target.name.toLowerCase()
			})
			params.game.updateOne( {scenes: params.game.scenes}, (err) => {
				if(err) return done(err)
				done(null, params.target, {message: ["You've susccessfully killed the", params.target.name].join(" ")})
			})
		} else {
			let response = [["The", params.target.name, "appears be inmune to your weapon"].join(" ")]
			params.gstate.playerhp -= params.target.stats.damage

			params.gstate.save( (err, newState) => {
				if(err) return done(err)
				if(newState.playerhp < 0) {
					response.push(["The", params.target.name, "killed you in response to your attack"].join(" "))
				} else {
					response.push(["The", params.target.name, "has attacked and damaged you for", params.target.stats.damage, "points"].join(" "))
				}
				return done(null, params.target, {
					message: response.join("\n")
				})
			})
		}
	}


	attackItem(params, done) {
		done({
			status: 500,
			message: "Not implemented yet"
		})
	}

	attackTarget(gstate, game, done) {
		let currentRoom = game.scenes[gstate.currentscene]
		let npcs = currentRoom.npcs
		let items = currentRoom.items
		if(!npcs && !items) return done({
			error: 400,
			message: "There is nothing for me to kill / destroy"
		})

		let weaponObj = null

		if(gstate.inventory.hands) {
			if(gstate.inventory.hands.name.toLowerCase() == this.weapon.toLowerCase()) weaponObj = gstate.inventory.hands
		} else {
			weaponObj = gstate.inventory.bag.find( i => {
				return i.name.toLowerCase() == this.weapon.toLowerCase()
			})
		}
		if(!weaponObj) return done({
			status: 400,
			message: "I don't know what '" + this.weapon +"' is."
		})

		let params = {
			weapon: weaponObj,
			gstate: gstate,
			game: game
		}

		if(npcs) {
			let targetObj = npcs.find( i => {
				return i.name.toLowerCase() == this.target.toLowerCase()
			})
			if(targetObj) {
				params.target = targetObj
				return this.attackNPC(params, done)
			}
		}

		if(items) {
			targetObj = items.find( i => {
				return i.name.toLowerCase() == this.target.toLowerCase()
			})
			if(targetObj) {
				params.target = targetObj
				return this.attackItem(params, done)
			}
		}
		return done({
			status: 400,
			message: "Can't find the '" + this.target + "' you want to attack"
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
			
			this.attackTarget( gstate, gstate.game, (err, attackedTarget, responseMsg) => {
				if(err) return cb(err)
				this.processTriggers(gstate, attackedTarget, (err) => {
					if(err) return cb(err)
					this.checkFinalConditions(gstate, gstate.game, (err, finalMsg) => {
						if(err) return cb(err)
						let response = new GameResponse(gstate, gstate.game, [responseMsg, finalMsg])
						cb(null, response)
					})
				})
			})		
			
		})

	}

}