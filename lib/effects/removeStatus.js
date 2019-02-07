


module.exports = class RemoveStatus {

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
		if(this.target == 'game') {
			this.game.status[this.newStatus] = 0
			return this.game.save(done)
		}
		done()
	}
}