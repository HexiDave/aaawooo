import {
	Card,
	GameEventType,
	getGameEventName,
	HistoryEventType,
	NightRoleOrderType,
	PlayersWokeUpTogetherMeta,
	ShowPlayersOtherRolesPacket
} from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'

function setupMasons(gameServer: GameServer) {
	const masons = gameServer.getPlayersWithStartingCards(Card.Mason)

	const identPacket: ShowPlayersOtherRolesPacket = masons.map(p => ({
		index: p.index,
		card: Card.Mason
	}))

	const meta: PlayersWokeUpTogetherMeta = {
		role: Card.Mason,
		playerIndices: masons.map(m => m.index)
	}

	const timestamp = (new Date()).getTime()

	console.debug('Mason sending other player roles', identPacket)
	masons.forEach(mason => {
		mason.player.socket?.emit(getGameEventName(GameEventType.ShowPlayersOtherRoles), identPacket)

		gameServer.addPlayerHistoryEvent<PlayersWokeUpTogetherMeta>(HistoryEventType.PlayersWokeUpTogether, mason.player, meta, timestamp)
	})

	return DEFAULT_ROLE_DURATION
}

export function* masonRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupMasons(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}
