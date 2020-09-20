import { Card, HistoryEventType, LookedAtCardsMeta, NightRoleOrderType, SwappedCardsMeta } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupRobber(gameServer: GameServer) {
	gameServer.getPlayersWithStartingCards(Card.Robber).forEach(({player}) => {
		player.roleState = 1

		gameServer.sendStartNightRoleAction(player, Card.Robber)
	})

	return DEFAULT_ROLE_DURATION
}

export function* robberRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupRobber(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function robberRoleAction(player: Player, gameServer: GameServer, otherPlayerIndex: number) {
	// Swap then show

	const playerIndex = gameServer.getIndexByPlayer(player)
	const otherPlayer = gameServer.getPlayerByIndex(otherPlayerIndex)

	if (playerIndex === -1 || otherPlayer === null)
		return

	player.roleState = 0

	const {deck} = gameServer.gameState

	// Swap
	const playerCard = deck[playerIndex]
	deck[playerIndex] = deck[otherPlayerIndex]
	deck[otherPlayerIndex] = playerCard

	// Show player
	const sendDeck = deck.map((card, index) => index === playerIndex ? card : null)
	console.debug('Robber sending deck [player, deck]', player.userDetails?.displayName, sendDeck)
	gameServer.sendGameStateToSocket(player.socket, sendDeck)

	gameServer.addPlayerHistoryEvent<SwappedCardsMeta>(HistoryEventType.SwappedCards, player, {
		deckIndices: [playerIndex, otherPlayerIndex]
	})

	gameServer.addPlayerHistoryEvent<LookedAtCardsMeta>(HistoryEventType.LookedAtCards, player, {
		cards: [deck[playerIndex]],
		deckIndices: [playerIndex]
	})
}
