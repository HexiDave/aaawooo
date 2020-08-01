import { GameServer } from './werewolf/GameServer'
import { Server } from 'socket.io'
import { CommonMessage, getCommonMessageName, HandshakeQuery } from '../../common'
import { VoiceConnection } from 'discord.js'
import { v4 } from 'uuid'

const MAX_INVITE_NUMBER = 999_999
const DEFAULT_INVITE_CODE_LENGTH = MAX_INVITE_NUMBER.toString().length

export interface UserRoomDetails {
	userId: string
	roomId: string
}

export class GameServerManager {
	private readonly gameServers = new Map<string, GameServer>()

	private readonly inviteCodeMap = new Map<string, UserRoomDetails>()

	private readonly refreshCodeMap = new Map<string, UserRoomDetails>()

	private readonly io: Server

	public constructor(io: Server) {
		this.io = io

		this.setupHandlers()
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
					userRoomDetails = this.refreshCodeMap.get(refreshCode)
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
					this.refreshCodeMap.delete(refreshCode)
				}

				// Send the user a refresh code, in case they get disconnected
				const nextRefreshCode = v4()
				this.refreshCodeMap.set(nextRefreshCode, userRoomDetails)
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
		const gameServer = new GameServer(roomId, this.io, voiceConnection)
		this.gameServers.set(gameServer.roomId, gameServer)

		return gameServer
	}

	public destroyGameServer(gameServer: GameServer) {
		this.gameServers.delete(gameServer.roomId)
		gameServer.removeAllListeners()
		gameServer.removeAllPlayers()
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
