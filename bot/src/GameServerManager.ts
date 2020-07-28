import { GameServer } from './werewolf/GameServer'
import { Server } from 'socket.io'
import { verify } from './jwt'
import { HandshakeQuery, UserDetails } from '../../common'

export interface HandshakeQueryDetails {
	userDetails: UserDetails
	roomId: string
	requestedPlayerSeat?: number
}

export class GameServerManager {
	private readonly gameServers = new Map<string, GameServer>()

	private readonly io: Server

	private readonly signingSecret: string

	public constructor(io: Server, signingSecret: string) {
		this.io = io
		this.signingSecret = signingSecret

		this.setupHandlers()
	}

	private setupHandlers() {
		this.io.on('connection', async socket => {
			const query = socket.handshake.query as HandshakeQuery

			try {
				console.debug('Got connection!', socket.id, query.inviteToken)
				const handshakeQuery = await verify(query.inviteToken, this.signingSecret) as HandshakeQueryDetails

				const gameServer = this.getGameServer(handshakeQuery.roomId)

				gameServer.joinPlayer(socket, handshakeQuery.userDetails, handshakeQuery.requestedPlayerSeat)
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

	public createGameServer() {
		const gameServer = new GameServer(this.io)
		this.gameServers.set(gameServer.roomId, gameServer)

		return gameServer
	}

	public destroyGameServer(gameServer: GameServer) {
		this.gameServers.delete(gameServer.roomId)
		gameServer.removeAllPlayers()
	}
}
