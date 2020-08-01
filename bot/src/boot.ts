import { createWebServer } from './webServer'
import { GameServerManager } from './GameServerManager'
import DiscordBot from './DiscordBot'

const SERVER_PORT = parseInt(process.env.PORT || process.env.WEB_PORT, 10) || 5000

// In production, we'll feed the environment variables with Docker
if (process.env.NODE_ENV !== 'production') {
	// noinspection TypeScriptValidateJSTypes
	require('dotenv-flow').config({
		path: '../'
	})
}

async function boot() {
	const {app, io, server} = createWebServer(SERVER_PORT)

	const gameServerManager = new GameServerManager(io)

	const discordBot = new DiscordBot(gameServerManager)

	// await gameServerExperiment(gameServerManager, TEMP_SECRET, SERVER_PORT)

	await discordBot.initializeClient()
}

boot().then().catch(console.error)
