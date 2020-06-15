const functions = require('firebase-functions')
const config = functions.config().env

const SteamAPI = require('steamapi')
const steam = new SteamAPI(config.steam.apikey)

exports.inscribePlayer = functions.https.onCall((data, context) => {
	console.log('Context: ', context)
	console.log('Data: ', data)

	var player = {}

	return steam
		.resolve(data.steamURL)
		.then((steamid64) => steam.getUserBans(steamid64))
		.then((bans) => {
			player.bans = bans
			return steam.getUserOwnedGames(player.steamid)
		})
		.then((games) => {
			player.games = games
			console.log(player)
			return player
		})
})
