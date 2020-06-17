const functions = require('firebase-functions')
const SteamAPI = require('steamapi')
const app = require('express')()
const fs = require('fs')
const cors = require('cors')({ origin: true })

const config = getConfig()
const steam = new SteamAPI(config.steam.apikey)
const CSGO_APPID = '730'
const MIN_HOURS_PLAYTIME = 2000

function getConfig() {
	if (process.env.NODE_ENV === 'production') {
		return functions.config().env
	} else {
		if (fs.existsSync('./.env.json')) {
			return require('./.env.json')
		}
	}
}

app.post('/api/inscribe', (req, res) => {
	var player = {}

	return steam
		.resolve(req.body.steamURL)
		.then((steamid64) => steam.getUserSummary(steamid64))
		.then((summary) => {
			player = summary
			return steam.getUserBans(player.steamID)
		})
		.then((info) => {
			player.baninfo = info
	
			// Validate if profile is banned
			if (player.baninfo.vacBanned || player.baninfo.communityBanned) {
				return res.status(400).send({
					code: "steam/account-banned",
					message: "user is vac banned" 
				})
			}

			return steam.getUserOwnedGames(player.steamID)
		})
		.then((games) => {
			// Get game playtime for validating
			var gamePlayTime = 0
			var minMinutesPlayTime = hoursToMinutes(MIN_HOURS_PLAYTIME)
			
			for (let game of games) {
				if (game.appID == CSGO_APPID) {
					gamePlayTime = game.playTime
				}
			}

			// Validate if steam account has the game added
			if (!gamePlayTime) {
				return res.status(400).send({
					code: "steam/game-not-owned",
					message: "user does not own the game" 
				})
			}

			// Validate if user plays game sufficient time
			if (gamePlayTime < minMinutesPlayTime) {
				return res.status(400).send({
					code: "steam/insufficient-playtime",
					message: "too little time in game" 
				})
			}

			return res.status(200).send(player)
		})
})

function hoursToMinutes(hours) {
	return hours * 60
}

exports.app = functions.https.onRequest(app)