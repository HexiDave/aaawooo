import { Message } from "discord.js"

export default async function joinVoiceChannel(message: Message) {
	const channel = message?.member?.voice?.channel

	if (!channel)
		return

	const connection = await channel.join()
	connection.dispatcher?.destroy()

	console.log('Joined voice channel: ', channel.name)
}
