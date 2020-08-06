import { Socket } from 'socket.io'
import { Card, PlayerEvent, UserDetails } from '../../../common'

export interface BasePlayer {
	userDetails: UserDetails | null
	startingCard: Card | null
	history: PlayerEvent[]
}

export default interface Player extends BasePlayer {
	socket: Socket | null
}

export interface PlayerWithIndex {
	index: number
	player: Player
}
