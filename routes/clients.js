 const express = require('express');
 const router = express.Router();
 const models = require("../models")


function updateModelKey(model, res, next) {
	console.log(model)
	model	
		.updateAPIKey((err) => {
			if(err) return next(err)
			return res.json(model)	
		})
}

function createNewClient(clientModel, info, res, next) {
	const ClientApp = new clientModel(info)

	ClientApp.save( (err, model) => {
		if(err) return next(err)
		model.registerAPIKey((err) => {
			if(err) return next(err)
			res.json(model)
		})

	})
}

router.post('/', function(req, res, next) {
	let clientInfo = req.body

	let clientModel = models.get('clientApp')

	let keyName = clientModel.normalizeName(clientInfo.name)

	clientModel.findOne({unique_name: keyName})
				.exec((error, foundModel ) => {
					if(foundModel) {
						updateModelKey(foundModel, res, next)
					} else {
						createNewClient(clientModel, clientInfo, res, next)	
					}
				})
});

module.exports = router;
