import Discord, { Collection, Message, TextChannel } from 'discord.js'
import { GameServerManager } from './GameServerManager'
import { Card, CardArray, MAX_ROOM_SIZE, UserDetails } from '../../common'

export type CommandFunc = (message: Message, ...args: any[]) => Promise<void>

export default class DiscordBot {
	public readonly gameServerManager: GameServerManager

	public readonly client = new Discord.Client()

	public readonly defaultCommandPrefix: string = '!'

	private readonly commands = new Collection<string, CommandFunc>()

	public constructor(gameServerManager: GameServerManager) {
		this.gameServerManager = gameServerManager

		this.addCommand(['room', 'open'], this.openRoom)
		this.addCommand('join', this.joinRoom)
		this.addCommand(['destroy', 'delete'], this.destroyRoom)
	}

	private addCommand(nameOrNames: string | string[], command: CommandFunc) {
		const aliases = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames]

		aliases.forEach(name => this.commands.set(name, command))
	}

	public async initializeClient() {
		const {commands, client, defaultCommandPrefix} = this

		client.once('ready', () => {
			console.log(`Alive! Logged in as ${client.user.tag}`)
		})

		client.on('message', async message => {
			if (!message.content.startsWith(defaultCommandPrefix))
				return

			const trimmed = message.content.trimEnd()

			// Must be at least prefix-length + 1 character, else it couldn't possibly be at least e.g. !a
			if (trimmed.length < (defaultCommandPrefix.length + 1))
				return

			const commandItems = trimmed.slice(defaultCommandPrefix.length).split(' ', 10)

			const commandName = commandItems[0].toLowerCase()

			const args = commandItems.slice(1)

			const command = commands.get(commandName)

			if (command) {
				try {
					await command(message, ...args)
					if (message.channel.type === 'text' &&
						(
							(message.channel as TextChannel).permissionsFor(message.guild.me)?.has('MANAGE_MESSAGES') ||
							message.guild.me.hasPermission('MANAGE_MESSAGES')
						)) {

						await message.delete()
					}
				} catch (e) {
					console.error('Command resulted in an exception\n', e)
				}
			}
		})

		client.on('error', console.error)

		await client.login(process.env.TOKEN)
	}

	private static async getChannel(message: Message, failResponse: string) {
		const channel = message?.member?.voice?.channel

		if (!channel) {
			await message.channel.send(failResponse)

			return null
		}

		return channel
	}

	private openRoom = async (message: Message, roomSizeArg?: string, debugStartingCard?: string) => {
		const channel = await DiscordBot.getChannel(message, "Can't open the room without you being in a voice channel first!")

		if (!channel)
			return

		let gameServer = this.gameServerManager.getGameServer(channel.id)

		if (gameServer !== null) {
			await message.channel.send('Room already exists! Check your DMs for invite codes, or request a new one.')

			return
		}

		let roomSize: number = 0
		if (roomSizeArg) {
			roomSize = parseInt(roomSizeArg, 10)
			if (roomSize < 1 || roomSize > MAX_ROOM_SIZE) {
				await message.channel.send(`Room count (${roomSize}) is outside the range [1, ${MAX_ROOM_SIZE}]`)
				return
			}
		}

		const connection = await channel.join()
		connection.dispatcher?.destroy()

		console.debug('Joined voice channel:', channel.name)

		const userDetailsList = connection.channel.members
			.filter(member => member.id !== this.client.user?.id)
			.mapValues<UserDetails>(member => ({
				avatarURL: member.user.avatarURL(),
				displayName: member.displayName,
				id: member.id
			}))
			.array()

		// Pad the room count if specified
		if (roomSize > userDetailsList.length) {
			for (let i = userDetailsList.length; i < roomSize; i++) {
				userDetailsList.push(null)
			}
		}

		gameServer = this.gameServerManager.createGameServer(channel.id, connection)

		if (debugStartingCard) {
			gameServer.__DEBUG_START_CARD = CardArray.find(c => c.toLowerCase() === debugStartingCard.toLowerCase())
		}

		gameServer.initializePlayers(userDetailsList)

		await Promise.all(userDetailsList.filter(u => u !== null).map(async userDetails => {
			const user = this.client.users.cache.get(userDetails.id)

			const inviteCode = this.gameServerManager.generateInviteCode({
				userId: userDetails.id,
				roomId: gameServer.roomId
			})

			await user.send(`Your invite code is: ${inviteCode}`)
		}))

		await message.channel.send('Invite codes sent! Check your DMs!')
	}

	private joinRoom = async (message: Message) => {
		const channel = await DiscordBot.getChannel(message, "Make sure you're in the voice channel with others first!")

		if (!channel)
			return

		const gameServer = this.gameServerManager.getGameServer(channel.id)

		if (!gameServer) {
			await message.channel.send("I don't see a game server for this room. Make sure you're in the right room, or create a new one.")

			return
		}

		if (gameServer.isStarted) {
			await message.channel.send("Sorry, the game has already started!")

			return
		}

		// TODO: Check player counts and such

		const inviteCode = this.gameServerManager.generateInviteCode({
			userId: message.author.id,
			roomId: channel.id
		})

		await message.author.send(`Your invite code is: ${inviteCode}`)
	}

	private destroyRoom = async (message: Message) => {
		const channel = await DiscordBot.getChannel(message, "Make sure you're in the voice channel with others first!")

		if (!channel)
			return

		const gameServer = this.gameServerManager.getGameServer(channel.id)

		if (!gameServer) {
			await message.channel.send("I don't see a game server for this room. Make sure you're in the right room, or create a new one.")

			return
		}

		this.gameServerManager.destroyGameServer(gameServer)

		await message.channel.send("Game room destroyed. Feel free to create a new one!")
	}
}
