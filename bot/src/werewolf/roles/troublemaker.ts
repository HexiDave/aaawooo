import { Card, NightRoleOrderType } from '../../../../common'
import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import Player from '../Player'

function setupTroublemaker(gameServer: GameServer) {
	gameServer.getPlayersWithStartingCards(Card.Troublemaker).forEach(({player}) => {
		player.roleState = 1

		gameServer.sendStartNightRoleAction(player, Card.Troublemaker)
	})

	return DEFAULT_ROLE_DURATION
}

export function* troublemakerRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	yield setupTroublemaker(gameServer)

	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function troublemakerRoleAction(player: Player, gameServer: GameServer, otherPlayer1Index: number, otherPlayer2Index: number) {
	const otherPlayer1 = gameServer.getPlayerByIndex(otherPlayer1Index)
	const otherPlayer2 = gameServer.getPlayerByIndex(otherPlayer2Index)

	if (otherPlayer1 === null || otherPlayer2 === null)
		return

	player.roleState = 0

	const {deck} = gameServer.gameState

	const otherPlayer1Card = deck[otherPlayer1Index]
	deck[otherPlayer1Index] = deck[otherPlayer2Index]
	deck[otherPlayer2Index] = otherPlayer1Card
}
