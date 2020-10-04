import {
	Card, GameEventType,
	getGameEventName,
	HistoryEventType,
	LookedAtCardsMeta,
	NightRoleOrderType,
	SwappedCardsMeta
} from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupWitch(gameServer: GameServer) {
	gameServer.getPlayersWithStartingCards(Card.Witch).forEach(({player}) => {
		player.roleState = 2

		gameServer.sendStartNightRoleAction(player, Card.Witch)
	})

	return DEFAULT_ROLE_DURATION
}

export function* witchRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupWitch(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	// TODO: Handle case where player didn't choose any card to swap

	return yield DEFAULT_ROLE_END_PAUSE
}

export function witchRoleAction(player: Player, gameServer: GameServer, otherCardIndex: number) {
	const {deck} = gameServer.gameState

	if (player.roleState === 2) {
		const middleCardIndex = gameServer.getMiddleCardIndex(otherCardIndex)

		// Not a middle card?
		if (middleCardIndex < 0 || otherCardIndex >= deck.length)
			return

		player.roleState = 1
		player.roleCardsState = [otherCardIndex]

		const sendDeck = deck.map((card, index) => index === otherCardIndex ? card : null)
		console.debug("Sending Witch the player's card [index, deck]", otherCardIndex, sendDeck)
		gameServer.sendGameStateToSocket(player.socket, sendDeck)

		// Let the player know it's time to switch to selecting the player
		player.socket?.emit(getGameEventName(GameEventType.NightRoleAction), Card.Witch, player.roleState)

		gameServer.addPlayerHistoryEvent<LookedAtCardsMeta>(HistoryEventType.LookedAtCards, player, {
			cards: [deck[otherCardIndex]],
			deckIndices: [otherCardIndex]
		})
	} else if (player.roleState === 1 && player.roleCardsState.length === 1) {
		const lookedAtCardIndex = player.roleCardsState[0]

		player.roleState = 0
		player.roleCardsState = []

		// Reset the deck visibility
		gameServer.sendGameStateToSocket(player.socket)

		const otherPlayer1Card = deck[lookedAtCardIndex]
		deck[lookedAtCardIndex] = deck[otherCardIndex]
		deck[otherCardIndex] = otherPlayer1Card

		gameServer.addPlayerHistoryEvent<SwappedCardsMeta>(HistoryEventType.SwappedCards, player, {
			deckIndices: [otherCardIndex, lookedAtCardIndex]
		})
	}
}
