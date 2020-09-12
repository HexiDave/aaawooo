import { Card } from './Card'
import { UserDetails } from './UserDetails'
import { BaseEvent } from './BaseEvent'

export enum PlayerEventType {
	StartedWithCard,
	StartedNightRole
}

export interface BasePlayerEvent {
	type: PlayerEventType

	// What cards were involved? Card type.
	cardOrCards?: Card | Card[]

	// What other players were involved? Seat index.
	playerOrPlayers?: number | number[]

	// What users were involved?
	userOrUsers?: UserDetails | UserDetails[]
}

export type PlayerEvent = BasePlayerEvent & BaseEvent
