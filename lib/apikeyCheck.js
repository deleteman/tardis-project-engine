const redis = require("redis")
const logger = require("./logger")
const config = require("config")



module.exports = function(req, res, next) {

	let URL = req.url
	let publicURLs = [
		"/clients"
	]
	console.log(URL)
	if(publicURLs.indexOf(URL) != -1) return next()

	const rClient = redis.createClient()

	let apikey = req.get('apikey') || req.query.apikey

	if(!apikey) {
		return next({message: "Missing API Key", status: 400})
	}
	let keyName = 'apikey-' + apikey

	rClient.ttl(keyName, (err, ttl) => {
		if(err) return next(err)
		if(ttl < 0) {
			logger.info("Key not found or timedout")
			return next({
				message: "API Key missing or too old, please request a new one",
				status: 400
			})
		} else { //if the key is still active, reset the TTL
			rClient.expire(keyName, config.get('clientKeys.ttl'), next)
		}
	})

}