import { VoiceConnection } from "discord.js"
import { GameServer } from './werewolf/GameServer'
import { UserRoomDetails } from './GameServerManager'

export interface IGameServerManager {
	getGameServer(roomId: string): GameServer | null

	createGameServer(roomId: string, voiceConnection: VoiceConnection): GameServer

	destroyGameServer(gameServer: GameServer): void

	generateInviteCode(userRoomDetails: UserRoomDetails): string
}
