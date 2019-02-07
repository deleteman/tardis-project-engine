


module.exports = class AddStatus {

	constructor(data) {
		this.target = data.target
		this.newStatus = data.addStatus
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
		console.log("status to add: ", this.newStatus)
		console.log(this.game.status)

		if(this.target == 'game') {
			if(!this.game.status) {
				this.game.status = {}
			}
			this.game.status[this.newStatus] = 1
			return this.game.save(done)
		}
		done()
	}
}