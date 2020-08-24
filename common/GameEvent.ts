import { Card } from './Card'

export enum GameEvent {
	UpdateGameState,
	PhaseChange,
	UpdateCardCount,
	UpdateAlphaWolfCard,
	UpdatePlayers,
	ShowOwnCard,
	UpdatePlayerHistory,
	AnnounceNightRole,
	ShowRoleTimer,
	PlayerReady,
	RequestStart,
	ValidationError,
	ShowPlayersOtherRoles,
	StartNightRoleAction,
	NightRoleAction,
	SetDeliberationTimer
}

export const getGameEventName = (gameEvent: GameEvent) => GameEvent[gameEvent]

export interface ShowPlayersOtherRolesPacketItem {
	index: number
	card: Card
}

export type ShowPlayersOtherRolesPacket = ShowPlayersOtherRolesPacketItem[]

export const END_ROLE_ACTION = -1
