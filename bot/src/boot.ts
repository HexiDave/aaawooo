import { createWebServer } from './webServer'
import { createDiscordClient } from './discord'
import { GameServerManager } from './GameServerManager'
import { runBasicExperiment } from './experiment'

const COMMAND_PREFIX = '!'
const SERVER_PORT = parseInt(process.env.PORT || process.env.WEB_PORT, 10) || 5000

const TEMP_SECRET = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

// In production, we'll feed the environment variables with Docker
if (process.env.NODE_ENV !== 'production') {
	// noinspection TypeScriptValidateJSTypes
	require('dotenv-flow').config({
		path: '../'
	})
}

async function boot() {
	const {app, io, server} = createWebServer(SERVER_PORT)

	const gameServerManager = new GameServerManager(io, TEMP_SECRET)

	runBasicExperiment()

	const client = await createDiscordClient(COMMAND_PREFIX, gameServerManager)
}

boot().then().catch(console.error)
