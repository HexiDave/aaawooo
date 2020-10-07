import { Card } from './Card'

export enum GameEventType {
	UpdateGameState,
	PhaseChange,
	UpdateCardCount,
	UpdateAlphaWolfCard,
	UpdateLoneWolf,
	UpdateDeliberationTimer,
	UpdatePlayers,
	UpdatePlayerSpeakingState,
	ShowOwnCard,
	SendHistory,
	AddHistoryEvent,
	AnnounceNightRole,
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

export const getGameEventName = (gameEvent: GameEventType) => GameEventType[gameEvent]

export interface ShowPlayersOtherRolesPacketItem {
	index: number
	card: Card
}

export type ShowPlayersOtherRolesPacket = ShowPlayersOtherRolesPacketItem[]

export const END_ROLE_ACTION = -1
