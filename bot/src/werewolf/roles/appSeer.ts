import { Card, HistoryEventType, LookedAtCardsMeta, NightRoleOrderType, PlayerEventType } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupAppSeer(gameServer: GameServer) {
	const appSeers = gameServer.getPlayersWithStartingCards(Card.ApprenticeSeer)

	appSeers.forEach(appSeer => {
		appSeer.player.roleState = 1

		gameServer.sendStartNightRoleAction(appSeer.player, Card.ApprenticeSeer)
	})

	return DEFAULT_ROLE_DURATION
}

export function* appSeerRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupAppSeer(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function appSeerRoleAction(player: Player, gameServer: GameServer, deckIndex: number) {
	const {deck} = gameServer.gameState

	if (deckIndex >= deck.length || deckIndex < gameServer.playerCount)
		return

	player.roleState = 0

	const sendDeck = deck.map((card, index) => index === deckIndex ? card : null)
	console.debug('AppSeer sending deck [player, deck]', player.userDetails?.displayName, sendDeck)

	gameServer.addPlayerHistoryEvent<LookedAtCardsMeta>(HistoryEventType.LookedAtCards, player, {
		cards: [deck[deckIndex]],
		deckIndices: [deckIndex]
	})

	gameServer.sendGameStateToSocket(player.socket, sendDeck)
}
