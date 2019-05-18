const GameState = require("../../models/gameState")
const requireDir = require("require-dir")
const cartridges = requireDir('../../cartridges')
const redis = require("redis")
const config = require("config")
const BaseCommand = require("./basecommand")
const async = require("async")
const GameResponse = require("../gameResponse")

const PLAYERSPEED = config.get('playerstats.speed')

module.exports = class MoveCommand extends BaseCommand{


	constructor(cmdData) {
		super()
		this.data = cmdData
		this.action = "move"

	}

	parseMovement() {
		this.direction = this.data.action.toLowerCase().split(" ")[1]
	}

	getSceneNode(scene, cartridge) {
		console.log("getting scene node: ")
		console.log("graph: ")
		console.log(cartridge.graph)
		console.log("looking for scene: " + scene)
		let node = cartridge.graph.find( node  => {
			return node.id == scene
		})
		return node
	}

	
	/**
	Should move ALL party players into the same direction
	*/
	movePlayers(gState, cart, cb) {
		GameState.find({
			game: this.data.context.gameId
		})	
		.exec( (err, gstates) => {
			if(err) return cb(err)

			let directionsKeyName = gState.game._id + '-party-moves-directions'
			let rClient = redis.createClient(config.get('redis.connectionInfo'))

			console.log("hitting key: " + directionsKeyName)
			rClient.hgetall(directionsKeyName, (err, directions) => {
				if(err) return cb(err)
				let topDirection = null
				let topVotes = 0
				console.log("-----" + directionsKeyName +"-------")
				console.log(directions)
				console.log("------------")
				Object.keys(directions).forEach( dir => {
					if(+directions[dir] > +topVotes) {
						topVotes = +directions[dir]
						topDirection = dir
					}
				})
				console.log("Most voted direction: " + topDirection)

				let nextNode = cart.graph.find( node => {
					return node.id == gState.currentscene
				})[topDirection]
				console.log("Next node: ")
				console.log(nextNode)

				async.map(gstates, (state, done) => {
					state['walked' + topDirection] += PLAYERSPEED
					console.log("Updating player game state:")
					console.log(state)
					console.log("Distance to next node: " +nextNode.distance)
					console.log("distance walked: " + state['walked' + topDirection])

					if(nextNode.distance <= +state['walked' + topDirection]) {
						console.log("door traversed!, new scene: ")
						state.currentscene = nextNode.node
						console.log(state.currentscene)
						return state.resetWalkedDistances((err) => {
							if(err) return done(err)
							state.save(done)
						})
					}
					state.save(done)
				}, cb)
			})


		})
	}

	canMove(gstate, currentSceneNode, direction) {
		let exits = gstate.game.scenes[currentSceneNode.id].exits
		if(exits){ 
			if(exits[direction]) {
				if(exits[direction].status === 'locked') {
					return {
						message: "The door is locked, you can't go through it right now"
					}		
				}
			}
		}
		return true
	}

	run(cb) {
		this.parseMovement()

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
			let currentSceneNode = this.getSceneNode(gstate.currentscene, gCart)
			//TODO: Verify ability to move if door is closed (interact with inventory for this)
			if(!currentSceneNode[this.direction]) return cb({
				status: 400,
				message: "You can't move that way"
			})

			let canMoveResp = this.canMove(gstate, currentSceneNode, this.direction)
			if(canMoveResp !== true) {
				return cb({
					status: 400,
					message: canMoveResp.message
				})
			}

			let response = null
			gstate.addMoveRequest(this.direction, (err, persistMovement) => {
				if(err) return cb(err)
				if(persistMovement) {
					return this.movePlayers(gstate, gCart, (err, newstate) => {
						if(err) return cb(err)
						//TODO; Missing processing of possible triggers
						this.checkFinalConditions(newstate[0], gstate.game, (err, message) => {
							if(!message) message = {message: "You moved"}
							response = new GameResponse(newstate[0], gstate.game, message)
							cb(null, response)
						})	
					})
				}
				response = new GameResponse(gstate, gstate.game)
				cb(null, response)
			})
		})

	}

}