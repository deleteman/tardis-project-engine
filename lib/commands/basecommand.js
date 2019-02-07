

const EffectFactory = require("../effectsFactory")
const async = require("async")
const requireDir = require("require-dir")
const cartridges = requireDir('../../cartridges')


module.exports = class BaseCommand {

	processTriggers(gstate, item, done) {
		if(!item.triggers) return done(null, gstate)
		let triggers = item.triggers.filter( t => { //filters out triggers for other actions
			console.log("Comparing ", t.action, " with ", this.action)
			return t.action == this.action
		})
		console.log("triggers found: ", triggers.length)

		async.map(triggers, ( t, cb ) => {
			let effect = EffectFactory.getEffect(t.effect)	
			effect.setGameState(gstate)
			effect.setGame(gstate.game)
			effect.execute(cb)
		}, done)
	}

	checkWinCondition(gstate, game, c) {
		if(!c) return false
		if(c.source == 'gamestate') {
			if(c.condition.type == 'comparison') {
				if(c.condition.symbol == '=') {
					console.log("CURRENT SCENE: ")
					console.log(gstate.currentscene)
					return gstate[c.condition.left] == c.condition.right
				}
			}
		}

		if(c.source == 'npc' ){
			if(c.condition.type == 'isDead') {
				return game.scenes[c.condition.room].npcs.findIndex( npc => {
					return npc.id == c.condition.id
				}) == -1
			}
		}
		return false
	}


	checkFinalConditions(gstate, game, done) {
		let gCart = cartridges[game.cartridgeid]		
		if(!gCart) return done({
			status: 500,
			message: "Error while loading game cartridge, no cartridge found for id: " + game.cartridgeid
		})
		let conditions = gCart.game
		if(this.checkWinCondition(gstate, game, conditions['win-condition'])) {
			return done(null, {
				success: true, 
				message: "Congratulations, you've won the game!"
			})
		}
		done()
	}


}