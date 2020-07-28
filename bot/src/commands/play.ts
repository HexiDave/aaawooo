import { Message } from "discord.js"
import fs from "fs"
import path from "path"

const INTRO_PATH = path.join(__dirname, '../../audio/Werewolves of London OPUS.ogg')

export default async function playIntro(message: Message) {
	const {connection} = message?.guild?.voice

	if (!connection)
		return

	const stream = fs.createReadStream(INTRO_PATH)

	connection.play(stream, {type: 'ogg/opus', highWaterMark: 50})
	console.log('Playing', stream.path)
}
