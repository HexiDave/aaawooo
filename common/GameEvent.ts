import { Card } from './Card'

export enum GameEvent {
	UpdateGameState,
	PhaseChange,
	UpdateCardCount,
	UpdateAlphaWolfCard,
	UpdateLoneWolf,
	UpdatePlayers,
	ShowOwnCard,
	UpdatePlayerHistory,
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

export const getGameEventName = (gameEvent: GameEvent) => GameEvent[gameEvent]

export interface ShowPlayersOtherRolesPacketItem {
	index: number
	card: Card
}

export type ShowPlayersOtherRolesPacket = ShowPlayersOtherRolesPacketItem[]

export const END_ROLE_ACTION = -1
