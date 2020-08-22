import { Card, NightRoleOrderType } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupDrunk(gameServer: GameServer) {
	gameServer.getPlayersWithStartingCards(Card.Drunk).forEach(({player}) => {
		player.roleState = 1

		gameServer.sendStartNightRoleAction(player, Card.Drunk)
	})

	return DEFAULT_ROLE_DURATION
}

export function* drunkRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupDrunk(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function drunkRoleAction(player: Player, gameServer: GameServer, deckIndex: number) {
	const {deck} = gameServer.gameState

	const playerIndex = gameServer.getIndexByPlayer(player)

	if (deckIndex >= deck.length || deckIndex <= gameServer.playerCount || playerIndex === -1)
		return

	player.roleState = 0

	const playerCard = deck[playerIndex]
	deck[playerIndex] = deck[deckIndex]
	deck[deckIndex] = playerCard
}
