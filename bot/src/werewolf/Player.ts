import { Socket } from 'socket.io'
import { BasePlayer } from '../../../common'

export default interface Player extends BasePlayer {
	socket: Socket | null
	roleState: number
	roleCardsState: number[]
}

export interface PlayerWithIndex {
	index: number
	player: Player
}
