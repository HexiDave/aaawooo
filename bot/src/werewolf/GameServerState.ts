import { BasePlayer, GameState } from '../../../common'

export interface GameServerState {
	gameState: GameState
	players: BasePlayer[]
}
