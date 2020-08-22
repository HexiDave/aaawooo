import { Card, NightRoleOrderType } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

const SEER_ACTION_COUNT = 2

function setupSeer(gameServer: GameServer) {
	const seers = gameServer.getPlayersWithStartingCards(Card.Seer)
	console.debug('Seers discovered', seers)

	seers.forEach(s => {
		s.player.roleState = SEER_ACTION_COUNT
		s.player.roleCardsState = []

		gameServer.sendStartNightRoleAction(s.player, Card.Seer)
	})

	return DEFAULT_ROLE_DURATION
}

export function* seerRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupSeer(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function seerRoleAction(player: Player, gameServer: GameServer, deckIndex: number) {
	const {deck, cardCountState} = gameServer.gameState

	if (deckIndex >= deck.length || deckIndex < 0 || player.roleState <= 0)
		return

	const otherPlayer = gameServer.getPlayerByIndex(deckIndex)

	if (otherPlayer !== null) {
		console.debug('Seer Player selected')
		// Player selected, but we can't select that anymore
		if (player.roleCardsState.length !== 0)
			return

		player.roleState = 0

		const sendDeck = deck.map((card, index) => index === deckIndex ? card : null)
		console.debug("Sending seer the player's card [index, deck]", deckIndex, sendDeck)
		gameServer.sendGameStateToSocket(player.socket, sendDeck)
	} else {
		const middleCardIndex = gameServer.getMiddleCardIndex(deckIndex)
		console.debug('Seer middle card selected', middleCardIndex)

		// '4th' card is the werewolf card - can't look at a card if it's not there
		if (middleCardIndex === 3 && cardCountState.alphaWolfCard === 'none')
			return

		player.roleCardsState = [
			...player.roleCardsState,
			deckIndex
		]

		player.roleState = player.roleState - 1

		const sendDeck = deck.map((card, index) => player.roleCardsState.includes(index) ? card : null)
		console.debug('Seer sending deck [player, deck]', player.userDetails?.displayName, sendDeck)
		gameServer.sendGameStateToSocket(player.socket, sendDeck)
	}
}
