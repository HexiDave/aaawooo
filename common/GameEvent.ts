import { Card } from './Card'
import { BaseEvent } from './BaseEvent'

export enum GameEventType {
	UpdateGameState,
	PhaseChange,
	UpdateCardCount,
	UpdateAlphaWolfCard,
	UpdateLoneWolf,
	UpdatePlayers,
	UpdatePlayerSpeakingState,
	ShowOwnCard,
	UpdatePlayerHistory,
	UpdateGameHistory,
	UpdateTotalHistory,
	AnnounceNightRole,
	ShowRoleTimer,
	PlayerReady,
	RequestStart,
	RequestDestroy,
	ValidationError,
	ShowPlayersOtherRoles,
	StartNightRoleAction,
	NightRoleAction,
	SetDeliberationTimer,
	SetVoteTimer,
	CastVote,
	ShowVotes,
}

export interface BaseGameEvent {
	type: GameEventType
	meta?: any
}

export type GameEvent = BaseGameEvent | BaseEvent

export const getGameEventName = (gameEvent: GameEventType) => GameEventType[gameEvent]

export interface ShowPlayersOtherRolesPacketItem {
	index: number
	card: Card
}

export type ShowPlayersOtherRolesPacket = ShowPlayersOtherRolesPacketItem[]

export const END_ROLE_ACTION = -1
