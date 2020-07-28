import { setupCommands } from './setupCommands'
import Discord from 'discord.js'
import { GameServerManager } from './GameServerManager'

export async function createDiscordClient(commandPrefix: string, gameServerManager: GameServerManager) {
	const commands = await setupCommands()

	const client = new Discord.Client()

	client.once('ready', () => {
		console.log(`Alive! Logged in as ${client.user.tag}`)
	})

	client.on('message', async message => {
		if (!message.content.startsWith(commandPrefix))
			return

		const commandName = message.content.slice(commandPrefix.length).toLowerCase()

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

	await client.login(process.env.TOKEN)

	return client
}
