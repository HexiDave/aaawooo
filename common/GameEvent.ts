export enum GameEvent {
	UpdateGameState,
	PhaseChange,
	UpdateCardCount,
	UpdatePlayers,
	ShowOwnCard,
	UpdatePlayerHistory,
	AnnounceNightRole,
	ShowRoleTimer,
	PlayerReady
}

export const getGameEventName = (gameEvent: GameEvent) => GameEvent[gameEvent]
