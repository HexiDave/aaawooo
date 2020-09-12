import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import {
	Card,
	GameEventType,
	getGameEventName,
	NightRoleOrderType,
	ShowPlayersOtherRolesPacket,
	WerewolfCardArray
} from '../../../../common'
import Player from '../Player'

function showPlayerWerewolves(gameServer: GameServer) {
	const werewolfPlayers = gameServer.getPlayersWithStartingCards(WerewolfCardArray)

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
			player.socket?.emit(getGameEventName(GameEventType.ShowPlayersOtherRoles), werewolfIdentityPacket)
		}
	}

	const {loneWolfEnabled} = gameServer.gameState

	if (loneWolfEnabled && werewolfPlayers.length === 1) {
		const {player} = werewolfPlayers[0]
		player.roleState = 1

		gameServer.sendStartNightRoleAction(player, Card.Werewolf)
	}

	return loneWolfEnabled ? DEFAULT_ROLE_DURATION : 5000
}

export function* werewolfRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	yield gameServer.playRoleWakeUp(role)

	const {loneWolfEnabled} = gameServer.gameState

	if (loneWolfEnabled) {
		// Take a breath...
		yield 250

		yield gameServer.playTrack(GameServer.buildRoleTrackName(Card.Werewolf, 'lonewolf_option'))
	}

	yield showPlayerWerewolves(gameServer)
	yield gameServer.sendEndRoleActionToAll(role)

	yield gameServer.playRoleCloseEyes(role)

	return yield DEFAULT_ROLE_END_PAUSE
}

export function loneWolfRoleAction(player: Player, gameServer: GameServer, deckIndex: number) {
	const {deck} = gameServer.gameState

	if (deckIndex >= deck.length || deckIndex < gameServer.playerCount)
		return

	player.roleState = 0

	const sendDeck = deck.map((card, index) => index === deckIndex ? card : null)
	console.debug('Lone Wolf sending deck [player, deck]', player.userDetails?.displayName, sendDeck)
	gameServer.sendGameStateToSocket(player.socket, sendDeck)
}
