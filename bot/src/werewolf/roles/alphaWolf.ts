import { Card, NightRoleOrderType, WerewolfCardArray } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupAlphaWolf(gameServer: GameServer) {
	const alphaWolfPlayers = gameServer.getPlayersWithStartingCards(Card.AlphaWolf)

	alphaWolfPlayers.forEach(wolf => {
		wolf.player.roleState = 1

		gameServer.sendStartNightRoleAction(wolf.player, Card.AlphaWolf)
	})

	return DEFAULT_ROLE_DURATION
}

export function* alphaWolfRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupAlphaWolf(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

/**
 * Werewolf exchanges Werewolf card in center with other player that isn't also a werewolf
 * @param player
 * @param gameServer
 * @param otherPlayerIndex
 */
export function alphaWolfRoleAction(player: Player, gameServer: GameServer, otherPlayerIndex: number) {
	// No more actions, regardless
	player.roleState = 0

	const otherPlayer = gameServer.getPlayerByIndex(otherPlayerIndex)

	const {deck, cardCountState} = gameServer.gameState

	if (otherPlayer === null ||
		otherPlayer.userDetails.id === player.userDetails.id ||
		cardCountState.alphaWolfCard === 'none' ||
		WerewolfCardArray.includes(otherPlayer.startingCard)) {
		return
	}

	// Werewolf card from middle is the last card in the deck
	const alphaWolfCardIndex = deck.length - 1
	const alphaWolfCard = deck[alphaWolfCardIndex]
	const playerCard = deck[0]

	// Swap
	deck[0] = alphaWolfCard
	deck[alphaWolfCardIndex] = playerCard
}
