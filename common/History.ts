import { UserDetails } from './UserDetails'
import { Card } from './Card'
import { NightRoleOrderType } from './Roles'

export enum HistoryEventType {
	PhaseChange,
	NightRoleChange,

	LAST_GAME_EVENT_TYPE,

	StartedWithCard,
	StartedNightRole,
	LookedAtCards,
	SwappedCards,
	PlayersWokeUpTogether,
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
	role: NightRoleOrderType
}

export interface LookedAtCardsMeta {
	cards: Card[]
	deckIndices: number[]
}

export interface SwappedCardsMeta {
	deckIndices: number[]
}

export interface PlayersWokeUpTogetherMeta {
	playerIndices: number[]
	role: NightRoleOrderType
}

export type PlayerHistoryEventMeta =
	StartedWithCardMeta |
	StartedNightRoleMeta |
	LookedAtCardsMeta |
	SwappedCardsMeta |
	PlayersWokeUpTogetherMeta

export interface PlayerHistoryEvent extends BaseHistoryEvent {
	playerIndex: number
	userDetails: UserDetails | null
	meta: PlayerHistoryEventMeta
}
