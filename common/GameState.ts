import { CardCountState, DefaultCardCountState } from './CardCountState'
import { Card } from './Card'
import { NightRoleOrder, NightRoleOrderType } from './Roles'

export enum GamePhase {
	None,
	Setup,
	Night,
	Day,
	Deliberation,
	Vote,
	End
}

export interface GameState {
	cardCountState: CardCountState
	deck: Card[]
	phase: GamePhase
	loneWolfEnabled: boolean
	nightRole: NightRoleOrderType
}

export const DefaultGameState: GameState = {
	cardCountState: DefaultCardCountState,
	deck: [] as Card[],
	phase: GamePhase.None,
	loneWolfEnabled: true,
	nightRole: NightRoleOrder[0]
} as const
