import { Card } from './Card'

export enum GameEvent {
	UpdateGameState,
	PhaseChange,
	UpdateCardCount,
	UpdatePlayers,
	ShowOwnCard,
	UpdatePlayerHistory,
	AnnounceNightRole,
	ShowRoleTimer,
	PlayerReady,
	RequestStart,
	ValidationError,
	ShowPlayersOtherRoles
}

export const getGameEventName = (gameEvent: GameEvent) => GameEvent[gameEvent]

export interface ShowPlayersOtherRolesPacketItem {
	index: number
	card: Card
}

export type ShowPlayersOtherRolesPacket = ShowPlayersOtherRolesPacketItem[]
