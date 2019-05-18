


module.exports = class GameResponse {


	constructor(gstate, game, extramessage) {
		this.gstate = gstate
		this.gameInstance = game
		this.extramessage = extramessage
	}


	toString() {
		console.log("--- to string called ---")
	}

	toJSON() {
		let resp = {
			gamestate: this.gstate
		}

		if(this.extramessage) {
			//if(Array.isArray(this.extramessage)) {
				//resp.message = this.extramessage.reduce( (m, total) => total += "\n" + m.message, '')
			//} else {
				resp.message = this.extramessage
			////}
		}

		console.log("Rendering game response: ", resp)

		return resp
	}

}