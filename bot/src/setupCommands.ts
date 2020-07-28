import { Collection, Message } from 'discord.js'
import globby from 'globby'
import path from "path"

export type CommandFunc = (message: Message) => Promise<void>

export async function setupCommands() {
	const commands = new Collection<string, CommandFunc>()

	const files = await globby('*.ts', {
		cwd: path.join(__dirname, './commands/')
	})

	await Promise.all(files.map(async file => {
		const func = (await import('./commands/' + file)).default

		const funcName = file.slice(0, -3)
		commands.set(funcName, func)
	}))

	return commands
}
