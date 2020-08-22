import { Card, GameEvent, getGameEventName, NightRoleOrderType, ShowPlayersOtherRolesPacket } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'

function setupMasons(gameServer: GameServer) {
	const masons = gameServer.getPlayersWithStartingCards(Card.Mason)

	const identPacket: ShowPlayersOtherRolesPacket = masons.map(p => ({
		index: p.index,
		card: Card.Mason
	}))

	console.debug('Mason sending other player roles', identPacket)
	masons.forEach(player => player.player.socket?.emit(getGameEventName(GameEvent.ShowPlayersOtherRoles), identPacket))

	return DEFAULT_ROLE_DURATION
}

export function* masonRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupMasons(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}
