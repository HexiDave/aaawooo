import { Socket } from 'socket.io'
import { Card, PlayerEvent, UserDetails } from '../../../common'

export default interface Player {
	socket: Socket | null
	userDetails: UserDetails | null
	startingCard: Card | null
	history: PlayerEvent[]
}
