import { GameState } from '../../../common'
import { BasePlayer } from './Player'

export interface GameServerState {
	gameState: GameState
	players: BasePlayer[]
}
