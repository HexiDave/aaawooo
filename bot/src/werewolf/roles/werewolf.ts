import { GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import { Card, GameEvent, getGameEventName, ShowPlayersOtherRolesPacket } from '../../../../common'

const ROLE = 'werewolf'

const delay = (delay: number) => new Promise<void>(res => setTimeout(res, delay))

const playTrack = (gameServer: GameServer, trackName: string, trackTime: number, fallbackDelay: number) => {
	gameServer.playTrack(trackName)

	delay(trackTime).then(() => gameServer.onTrackFinished(trackName))

	return fallbackDelay
}

const dummyMessage = (message: string, delay: number) => {
	console.log(message)

	return delay
}

function showPlayerWerewolves(gameServer: GameServer) {
	const werewolfPlayers = gameServer.getPlayersWithStartingCards([
		Card.Werewolf,
		Card.AlphaWolf,
		Card.MysticWolf,
		Card.DreamWolf
	])

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

	return 5000
}

export function* werewolfRole(gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(ROLE)
	yield showPlayerWerewolves(gameServer)
	yield gameServer.playRoleCloseEyes(ROLE)
	yield dummyMessage('Done werewolf role', 1000)

	return
}
