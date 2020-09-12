import {
	Card, GameEventType,
	getGameEventName,
	NightRoleOrderType,
	ShowPlayersOtherRolesPacket,
	WerewolfCardArray
} from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'

function minionSetup(gameServer: GameServer) {
	const werewolfPlayers = gameServer.getPlayersWithStartingCards(WerewolfCardArray)
	const minionPlayers = gameServer.getPlayersWithStartingCards(Card.Minion)

	// Minion doesn't get to know what kind of werewolf the players are
	const werewolfIdentityPacket: ShowPlayersOtherRolesPacket = werewolfPlayers.map(p => ({
		card: Card.Werewolf,
		index: p.index
	}))

	console.debug('Minion sending other player roles', werewolfIdentityPacket)

	for (let minionPlayer of minionPlayers) {
		const {player} = minionPlayer

		player.socket?.emit(getGameEventName(GameEventType.ShowPlayersOtherRoles), werewolfIdentityPacket)
	}

	return DEFAULT_ROLE_DURATION
}

export function* minionRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield minionSetup(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}
