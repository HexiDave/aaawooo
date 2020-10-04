import { CardCountState, DefaultCardCountState } from './CardCountState'
import { Card, OptionalCard } from './Card'
import { NightRoleOrderTypeOrNull } from './Roles'

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
	deck: OptionalCard[]
	phase: GamePhase
	loneWolfEnabled: boolean
	nightRole: NightRoleOrderTypeOrNull
	deliberationMinutes: number
}

export const DefaultGameState: GameState = {
	cardCountState: DefaultCardCountState,
	deck: [] as OptionalCard[],
	phase: GamePhase.None,
	loneWolfEnabled: true,
	nightRole: null,
	deliberationMinutes: 5
} as const
