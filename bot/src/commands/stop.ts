import { Message } from "discord.js"

export default async function stopVoice(message: Message) {
	const {connection} = message?.guild?.voice

	if (!connection)
		return

	connection?.dispatcher?.destroy()
	console.log('Stopped playing')
}
