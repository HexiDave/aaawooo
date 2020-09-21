import { DEFAULT_ROLE_DURATION, DEFAULT_ROLE_END_PAUSE, GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'
import {
	Card,
	GameEventType,
	getGameEventName,
	HistoryEventType,
	LookedAtCardsMeta,
	NightRoleOrderType,
	PlayersWokeUpTogetherMeta,
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

	// TODO: Adjust this to show some players as Dream wolves
	const meta: PlayersWokeUpTogetherMeta = {
		role: Card.Werewolf,
		playerIndices: werewolfPlayers.map(w => w.index)
	}

	const timestamp = (new Date()).getTime()

	console.debug('Ident packet', werewolfIdentityPacket)

	for (let werewolfPlayer of werewolfPlayers) {
		const {index, player} = werewolfPlayer

		// Only show the awake werewolves
		if (player.startingCard !== Card.DreamWolf) {
			console.debug('Sending packet to', index, player.userDetails?.displayName)
			player.socket?.emit(getGameEventName(GameEventType.ShowPlayersOtherRoles), werewolfIdentityPacket)

			gameServer.addPlayerHistoryEvent<PlayersWokeUpTogetherMeta>(HistoryEventType.PlayersWokeUpTogether, player, meta, timestamp)
		}
	}

	const {loneWolfEnabled} = gameServer.gameState

	if (loneWolfEnabled && werewolfPlayers.length === 1 && werewolfPlayers[0].player.startingCard !== Card.DreamWolf) {
		const {player} = werewolfPlayers[0]
		player.roleState = 1

		gameServer.sendStartNightRoleAction(player, Card.Werewolf)
	}

	return loneWolfEnabled ? DEFAULT_ROLE_DURATION : 5000
}

export function* werewolfRole(role: NightRoleOrderType, gameServer: GameServer): RoleEventGenerator {
	const {loneWolfEnabled, cardCountState} = gameServer.gameState

	const hasDreamWolf = cardCountState.dreamWolf !== 0

	if (hasDreamWolf) {
		yield gameServer.playRoleWakeUp('werewolf_dreamwolf')
	} else {
		yield gameServer.playRoleWakeUp(role)
	}

	if (loneWolfEnabled) {
		// Take a breath...
		yield 250

		yield gameServer.playTrack(GameServer.buildRoleTrackName(Card.Werewolf, 'lonewolf_option'))
	}

	yield showPlayerWerewolves(gameServer)
	yield gameServer.sendEndRoleActionToAll(role)

	if (hasDreamWolf) {
		yield gameServer.playTrack(GameServer.buildRoleTrackName('werewolf_dreamwolf', 'thumb'))
	}
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

	gameServer.addPlayerHistoryEvent<LookedAtCardsMeta>(HistoryEventType.LookedAtCards, player, {
		cards: [deck[deckIndex]],
		deckIndices: [deckIndex]
	})
}
