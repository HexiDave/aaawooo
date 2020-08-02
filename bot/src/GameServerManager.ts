import { GameServer} from './werewolf/GameServer'
import { Server } from 'socket.io'
import { CommonMessage, GameState, getCommonMessageName, HandshakeQuery } from '../../common'
import { VoiceConnection, Client, VoiceChannel } from 'discord.js'
import { v4 } from 'uuid'
import { Redis } from 'ioredis'
import RedisWrapper, { ExpireMode } from './RedisWrapper'
import { GameServerState } from './werewolf/GameServerState'

const MAX_INVITE_NUMBER = 999_999
const DEFAULT_INVITE_CODE_LENGTH = MAX_INVITE_NUMBER.toString().length

export interface UserRoomDetails {
	userId: string
	roomId: string
}

export class GameServerManager {
	private readonly gameServers = new Map<string, GameServer>()

	private readonly inviteCodeMap = new Map<string, UserRoomDetails>()

	private readonly io: Server

	private readonly redis: Redis

	private readonly refreshCodeCache: RedisWrapper<UserRoomDetails>

	public constructor(io: Server, redis: Redis) {
		this.io = io
		this.redis = redis

		this.refreshCodeCache = new RedisWrapper<UserRoomDetails>(redis, 'refresh:')

		this.setupHandlers()
	}

	private createGameServerCache() {
		return new RedisWrapper<GameServerState>(this.redis, 'gameServer:')
	}

	public async loadGameServers(discordClient: Client) {
		const gameServerCache = this.createGameServerCache()

		const roomIds = await gameServerCache.getKeys()

		for (let roomId of roomIds) {
			try {
				const channel = await discordClient.channels.fetch(roomId) as VoiceChannel

				if (!channel) {
					console.error('No channel found!')
					continue
				}

				const voiceConnection = await channel.join()
				const gameServerState = await gameServerCache.get(roomId)

				const gameServer = this.createGameServer(roomId, voiceConnection)
				gameServer.initializeWithGameServerState(gameServerState)
				console.debug('Loaded room', roomId)
			} catch (e) {
				console.error('Unable to re-join channel', roomId, e)
			}
		}
	}

	private setupHandlers() {
		this.io.on('connection', async socket => {
			try {
				const {inviteCode, refreshCode, requestedSeat} = socket.handshake.query as HandshakeQuery

				console.debug('Got connection!', socket.id, inviteCode, refreshCode)

				let userRoomDetails: UserRoomDetails = null

				if (inviteCode) {
					userRoomDetails = this.inviteCodeMap.get(inviteCode)
				} else if (refreshCode) {
					userRoomDetails = await this.refreshCodeCache.get(refreshCode)
					console.log('Refresh code', refreshCode, userRoomDetails)
				}

				if (!userRoomDetails) {
					socket.error('Login details invalid.')
					socket.disconnect(true)
					return
				}

				const gameServer = this.getGameServer(userRoomDetails.roomId)
				const userDetails = gameServer.getUserDetailsById(userRoomDetails.userId)

				if (userDetails === null) {
					socket.error('User or room not found')
					socket.disconnect(true)
					return
				}

				// Join the player with the server
				gameServer.joinPlayer(socket, userDetails, requestedSeat)

				// Cleanup
				if (inviteCode) {
					this.inviteCodeMap.delete(inviteCode)
				} else if (refreshCode) {
					await this.refreshCodeCache.delete(refreshCode)
				}

				// Send the user a refresh code, in case they get disconnected
				const nextRefreshCode = v4()
				await this.refreshCodeCache.setWithExpiration(nextRefreshCode, userRoomDetails, 60 * 60 * 24)
				socket.emit(getCommonMessageName(CommonMessage.RefreshCode), nextRefreshCode)
			} catch (e) {
				console.error('Failed to handshake', e)
				socket.disconnect(true)
			}
		})
	}

	public getGameServer(roomId: string) {
		if (this.gameServers.has(roomId))
			return this.gameServers.get(roomId)

		return null
	}

	public createGameServer(roomId: string, voiceConnection: VoiceConnection) {
		const gameServer = new GameServer(roomId, this.io, voiceConnection, this.createGameServerCache())
		this.gameServers.set(gameServer.roomId, gameServer)

		return gameServer
	}

	public destroyGameServer(gameServer: GameServer) {
		this.gameServers.delete(gameServer.roomId)
		gameServer.tearDown()
	}

	public generateInviteCode(userRoomDetails: UserRoomDetails) {
		let inviteCode: string

		// Delete any old invite codes for this user
		for (let [key, details] of Array.from(this.inviteCodeMap.entries())) {
			if (details.userId === userRoomDetails.userId) {
				this.inviteCodeMap.delete(key)
				break
			}
		}

		// Ensure we have a unique key
		do {
			inviteCode = Math
				.floor(Math.random() * MAX_INVITE_NUMBER)
				.toString(10)
				.padStart(DEFAULT_INVITE_CODE_LENGTH, '0')
		} while (this.inviteCodeMap.has(inviteCode))

		this.inviteCodeMap.set(inviteCode, userRoomDetails)

		return inviteCode
	}
}
