import { GamePhase } from '../../common'

export const GamePhaseNames: Record<GamePhase, string> = {
	[GamePhase.None]: '',
	[GamePhase.Setup]: 'Setup',
	[GamePhase.Night]: 'Night',
	[GamePhase.Day]: 'Day',
	[GamePhase.Deliberation]: 'Deliberation',
	[GamePhase.Vote]: 'Vote!',
	[GamePhase.End]: 'Game Over!'
}
