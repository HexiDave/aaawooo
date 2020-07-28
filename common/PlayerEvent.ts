import { Card } from './Card'
import { UserDetails } from './UserDetails'

export enum PlayerEventType {
	StartedWithCard,
}

export interface PlayerEvent {
	type: PlayerEventType

	// What cards were involved? Card type.
	cardOrCards?: Card | Card[]

	// What other players were involved? Seat index.
	playerOrPlayers?: number | number[]

	// What users were involved?
	userOrUsers?: UserDetails | UserDetails[]
}
