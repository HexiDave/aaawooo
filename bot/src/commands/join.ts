import { Message } from "discord.js"
import { GameServerManager } from '../GameServerManager'

export default async function joinVoiceChannel(message: Message, gameServerManager: GameServerManager) {
	const channel = message?.member?.voice?.channel

	if (!channel)
		return

	const connection = await channel.join()
	connection.dispatcher?.destroy()

	console.log('Joined voice channel: ', channel.name)
}
