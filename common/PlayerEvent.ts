import { Card } from './Card'
import { UserDetails } from './UserDetails'
import { BaseEvent } from './BaseEvent'

export enum PlayerEventType {
	StartedWithCard,
	StartedNightRole,
	LookedAtCards,
}

export interface BasePlayerEvent {
	type: PlayerEventType

	// What cards were involved? Card type.
	cards?: Card[]

	// What other player or cards were involved? Deck index.
	deckIndices?: number[]

	// What users were involved?
	users?: UserDetails[]
}

export type PlayerEvent = BasePlayerEvent & BaseEvent
