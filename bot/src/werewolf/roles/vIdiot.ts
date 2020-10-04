import { Card, HistoryEventType, NightRoleOrderType, VillageIdiotHappenedMeta } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupVillageIdiot(gameServer: GameServer) {
	gameServer.getPlayersWithStartingCards(Card.VillageIdiot).forEach(({player}) => {
		player.roleState = 1

		gameServer.sendStartNightRoleAction(player, Card.VillageIdiot)
	})

	return DEFAULT_ROLE_DURATION
}

export function* vIdiotRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupVillageIdiot(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function vIdiotRoleAction(player: Player, gameServer: GameServer, shiftLeft: boolean) {
	if (player.roleState !== 1)
		return

	const {deck} = gameServer.gameState

	const playerIndex = gameServer.getIndexByPlayer(player)

	const playerCount = gameServer.playerCount

	const playerCard = deck[playerIndex]

	const middleCards = deck.slice(playerCount)

	console.debug('Deck before shift', deck)

	// Remove the player's card before shifting
	const deckCopy = [...deck.slice(0, playerIndex), ...deck.slice(playerIndex + 1, playerCount)]

	// Shift the remaining player cards by one
	if (shiftLeft) {
		const removed = deckCopy.shift()
		deckCopy.push(removed)
	} else {
		const removed = deckCopy.pop()
		deckCopy.unshift(removed)
	}

	// Put the player's card back
	gameServer.gameState.deck = [
		...deckCopy.slice(0, playerIndex),
		playerCard,
		...deckCopy.slice(playerIndex),
		...middleCards
	]

	console.debug(`Deck after ${shiftLeft ? 'left' : 'right'} shift`, gameServer.gameState.deck)

	gameServer.addPlayerHistoryEvent<VillageIdiotHappenedMeta>(HistoryEventType.VillageIdiotHappened, player, {
		shiftedLeft: shiftLeft
	})
}
