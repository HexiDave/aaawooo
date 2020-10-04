import { UserDetails } from './UserDetails'
import { Card } from './Card'
import { PlayerEvent } from './PlayerEvent'

export interface BasePlayer {
	userDetails: UserDetails | null
	startingCard: Card | null
}
