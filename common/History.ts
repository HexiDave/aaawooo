import { UserDetails } from './UserDetails'
import { Card } from './Card'

export enum HistoryEventType {
	PhaseChange,
	NightRoleChange,

	LAST_GAME_EVENT_TYPE,

	StartedWithCard,
	StartedNightRole,
	LookedAtCards,
}

export interface BaseHistoryEvent {
	type: HistoryEventType
	timestamp: number
}

export function isPlayerHistoryEvent(event: BaseHistoryEvent) {
	return event.type > HistoryEventType.LAST_GAME_EVENT_TYPE
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface GameHistoryEvent extends BaseHistoryEvent {
	meta?: any
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface StartedWithCardMeta {
	card: Card
}

export interface StartedNightRoleMeta {
	role: Card
}

export interface LookedAtCardsMeta {
	cards: Card[]
	deckIndices: number[]
}

export type PlayerHistoryEventMeta = StartedWithCardMeta | StartedNightRoleMeta | LookedAtCardsMeta

export interface PlayerHistoryEvent extends BaseHistoryEvent {
	playerIndex: number
	userDetails: UserDetails | null
	meta: PlayerHistoryEventMeta
}
