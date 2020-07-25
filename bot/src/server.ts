// In production, we'll feed the environment variables with Docker
if (process.env.NODE_ENV !== 'production') {
	// noinspection TypeScriptValidateJSTypes
	require('dotenv-flow').config()
}

import fs from 'fs'
import path from 'path'
import express from 'express'
import http from 'http'
import SocketIO from 'socket.io'
import { Client, Collection, Message } from 'discord.js'

const app = express()
const server = http.createServer(app)

app.get('/', (req, res) => res.send('Hello!'))

const io = SocketIO(server, {
	origins: '*:*'
})

io.on('connection', socket => {
	console.log('Got connection!')
	socket.send('Hello!')
})

const port = process.env.PORT || 3000

server.listen(port, () => {
	console.log('Listening on port', port)
})

server.on('error', console.error)

const INTRO_PATH = path.join(__dirname, '../audio/Werewolves of London OPUS.ogg')

const COMMAND_PREFIX = '!'

async function joinVoiceChannel(message: Message) {
	const channel = message?.member?.voice?.channel

	if (!channel)
		return

	const connection = await channel.join()
	connection.dispatcher?.destroy()

	console.log('Joined voice channel: ', channel.name)
}

async function playIntro(message: Message) {
	const {connection} = message?.guild?.voice

	if (!connection)
		return

	const stream = fs.createReadStream(INTRO_PATH)

	connection.play(stream, {type: 'ogg/opus', highWaterMark: 50})
	console.log('Playing', stream.path)
}

async function stopVoice(message: Message) {
	const {connection} = message?.guild?.voice

	if (!connection)
		return

	connection?.dispatcher?.destroy()
	console.log('Stopped playing')
}

type CommandFunc = (message: Message) => Promise<void>

const commands = new Collection<string, CommandFunc>()

commands.set('join', joinVoiceChannel)
commands.set('play', playIntro)
commands.set('stop', stopVoice)

const client = new Client()

client.once('ready', () => {
	console.log(`Alive! Logged in as ${client.user.tag}`)
})

client.on('message', async message => {
	if (!message.content.startsWith(COMMAND_PREFIX))
		return

	const commandName = message.content.slice(COMMAND_PREFIX.length).toLowerCase()

	const command = commands.get(commandName)

	if (command) {
		try {
			await command(message)

			await message.delete()
		} catch (e) {
			console.error('Command resulted in an exception\n', e)
		}
	}
})

client.on('error', console.error)

client.login(process.env.TOKEN)
