const requireDir = require("require-dir")
const validCommands = requireDir('./commands')

/**

Possible commands:

- move
- grab / pickup
- drop
- trow
- attack
- pull

*/

module.exports = class CommandParser {


	constructor(command) {
		this.command = command
	}


	normalizeAction(strAct) {
		strAct = strAct.toLowerCase().split(" ")[0]

		return strAct
	}


	verifyCommand() {
		if(!this.command) return false
		if(!this.command.action) return false
		if(!this.command.context) return false

		let action = this.normalizeAction(this.command.action)

		if(validCommands[action]) {
			return validCommands[action]
		}
		return false
	}

	parse() {
		let validCommand = this.verifyCommand()
		if(validCommand) {
			let cmdObj = new validCommand(this.command)
			return cmdObj
		} else {
			return false
		}
	}

}