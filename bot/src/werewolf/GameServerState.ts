import { BasePlayer, GameEvent, GameState } from '../../../common'

export interface GameServerState {
	gameState: GameState
	players: BasePlayer[]
	gameHistory: GameEvent[]
}
