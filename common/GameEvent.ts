export enum GameEvent {
	PhaseChange,
	UpdateCardCount,
	UpdatePlayers,
	ShowOwnCard,
	UpdatePlayerHistory,
	AnnounceNightRole,
	ShowRoleTimer
}

export const getGameEventName = (gameEvent: GameEvent) => GameEvent[gameEvent]
