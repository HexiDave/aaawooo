import { createWebServer } from './webServer'
import { GameServerManager } from './GameServerManager'
import DiscordBot from './DiscordBot'
import Redis from 'ioredis'

const SERVER_PORT = parseInt(process.env.PORT || process.env.WEB_PORT, 10) || 5000

// In production, we'll feed the environment variables with Docker
if (process.env.NODE_ENV !== 'production') {
	// noinspection TypeScriptValidateJSTypes
	require('dotenv-flow').config({
		path: '../'
	})
}

async function boot() {

	const redis = new Redis(process.env.REDIS_ADDRESS)

	const {app, io, server} = createWebServer()

	const gameServerManager = new GameServerManager(io, redis)

	const discordBot = new DiscordBot(gameServerManager)

	await discordBot.initializeClient()

	await gameServerManager.loadGameServers(discordBot.client)

	server.listen(SERVER_PORT, () => {
		console.log('Listening on port', SERVER_PORT)
	})
}

boot().then().catch(console.error)
