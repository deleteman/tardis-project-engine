const Game = require("../../models/game")


module.exports = class StatusUpdate {

	constructor(data) {
		this.target = data.target
		this.newStatus = data.statusUpdate
	}

	setGameState(g) {
		this.gameState = g
	}

	setGame(g) {
		this.game = g
	}


	execute(done) {
		console.log("Executing add status effect")
		console.log("target: ", this.target)
		console.log("status to update: ", this.newStatus)

		if(typeof this.target == 'object') {
			if(this.target.exit) {
				let exit = null
				let exits = this.gameState.game.scenes[this.target.room].exits
				let foundDir = null

				Object.keys(exits).forEach( dir => {
					if(exits[dir].name.toLowerCase().trim() == this.target.exit.toLowerCase().trim()) {
						exit = exits[dir]
						foundDir = dir
					}
				})

				if(foundDir) {
					exit.status = this.newStatus
					this.gameState.game.scenes[this.target.room].exits[foundDir] = exit
				}
			}
			
			//Updating and then reloading, because game.save doesn't appear to work
			return this.gameState.game.updateOne({scenes: this.gameState.game.scenes}, (err) => {
				if(err) return cb(err)
				Game.findOne({_id: this.gameState.game._id}, done)
			})
		}
		done()
	}
}