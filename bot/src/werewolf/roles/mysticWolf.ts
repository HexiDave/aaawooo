import { Card, NightRoleOrderType } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupMysticWolf(gameServer: GameServer) {
	const mysticWolfPlayers = gameServer.getPlayersWithStartingCards(Card.MysticWolf)

	console.debug('Mystic Wolf sending player role action', mysticWolfPlayers)

	mysticWolfPlayers.forEach(wolf => {
		wolf.player.roleState = 1

		gameServer.sendStartNightRoleAction(wolf.player, Card.MysticWolf)
	})

	return DEFAULT_ROLE_DURATION
}

export function* mysticWolfRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupMysticWolf(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function mysticWolfRoleAction(player: Player, gameServer: GameServer, otherPlayerIndex: number) {
	// No more actions, regardless
	player.roleState = 0

	const otherPlayer = gameServer.getPlayerByIndex(otherPlayerIndex)

	const {deck} = gameServer.gameState

	console.debug('Mystic Wolf action', player?.userDetails.displayName, otherPlayerIndex)

	if (otherPlayer === null || otherPlayer.userDetails?.id === player.userDetails.id)
		return

	const showDeck = deck.map((card, index) => index === otherPlayerIndex ? card : null)

	console.debug('Mystic Wolf sending game state', showDeck)
	gameServer.sendGameStateToSocket(player.socket, showDeck)
}
