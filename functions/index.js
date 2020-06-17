const functions = require('firebase-functions')
const SteamAPI = require('steamapi')
const passport = require('passport')
const SteamStrategy = require('passport-steam')
const express = require('express')
const session = require('express-session')
const fs = require('fs')
const initcors = require('cors')

// Environment variables
var config = {}

if (process.env.NODE_ENV === 'production') {
	config = functions.config().env
	config.baseURL = `https://${process.env.FIREBASE_CONFIG.projectId}.web.app`
} else {
	if (fs.existsSync('./.env.json')) {
		config = require('./.env.json')
		config.baseURL = `https://localhost:5000`
	}
}

console.log(process.env)

// Constants
const CSGO_APPID = '730'
const MIN_HOURS_PLAYTIME = 2000

// Init objects
const steam = new SteamAPI(config.steam.apikey)
const app = express()
const cors = initcors({ origin: true })

// Configure passport to use Steam
passport.use(new SteamStrategy({
	returnURL: `${config.baseURL}/api/auth/steam/return`,
	realm: config.baseURL,
	apiKey: config.steam.apikey
	},
	function(identifier, profile, done) {
		// asynchronous verification, for effect...
		process.nextTick(function () {
			profile.identifier = identifier;
			return done(null, profile);
		});		
	}
));

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// Initialize session
app.use(session({
	secret: config.session_key,
	name: 'user-session',
	resave: true,
	saveUninitialized: true
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Authentication endpoints
app.get('/api/auth/steam', (req, res, next) => {
	req.session.discord_id = req.query.discord_id;
	req.session.save(next);
	console.log("Redirecting to Steam!")
}, passport.authenticate('steam'));

app.get('/api/auth/steam/return',
	passport.authenticate('steam', {
		failureRedirect: config.discord_url
	}),
	function(req, res) {
		console.log(req.session)
		res.redirect(config.discord_url);
	}
);

// Core endpoints
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