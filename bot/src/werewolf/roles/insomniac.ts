import {
	Card,
	GameEventType,
	getGameEventName,
	HistoryEventType,
	LookedAtCardsMeta,
	NightRoleOrderType
} from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'

function setupInsomniac(gameServer: GameServer) {
	const insomniacs = gameServer.getPlayersWithStartingCards(Card.Insomniac)

	for (let insomniac of insomniacs) {
		const {player, index} = insomniac

		const card = gameServer.getPlayerCard(index)

		player.socket?.emit(getGameEventName(GameEventType.ShowOwnCard), card)
		gameServer.addPlayerHistoryEvent<LookedAtCardsMeta>(HistoryEventType.LookedAtCards, player, {
			cards: [card],
			deckIndices: [index]
		})
	}

	return DEFAULT_ROLE_DURATION
}

export function* insomniacRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupInsomniac(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}
