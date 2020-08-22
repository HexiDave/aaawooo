import { DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import {
	Card,
	GameEvent,
	getGameEventName,
	NightRoleOrderType,
	ShowPlayersOtherRolesPacket,
	WerewolfCardArray
} from '../../../../common'

function showPlayerWerewolves(gameServer: GameServer) {
	const werewolfPlayers = gameServer.getPlayersWithStartingCards(WerewolfCardArray)

	console.debug('Werewolf players', werewolfPlayers)

	// Mask the werewolf types, except DreamWolf which has its thumb up
	const werewolfIdentityPacket: ShowPlayersOtherRolesPacket = werewolfPlayers.map(p => ({
		card: p.player.startingCard === Card.DreamWolf ? Card.DreamWolf : Card.Werewolf,
		index: p.index
	}))

	console.debug('Ident packet', werewolfIdentityPacket)

	for (let werewolfPlayer of werewolfPlayers) {
		const {index, player} = werewolfPlayer

		// Only show the awake werewolves
		if (player.startingCard !== Card.DreamWolf) {
			console.debug('Sending packet to', index, player.userDetails?.displayName)
			player.socket?.emit(getGameEventName(GameEvent.ShowPlayersOtherRoles), werewolfIdentityPacket)
		}
	}

	// TODO: Lone wolf option role action

	return 5000
}

export function* werewolfRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)
	yield showPlayerWerewolves(gameServer)
	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}
