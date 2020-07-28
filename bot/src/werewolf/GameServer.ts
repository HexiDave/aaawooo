import cloneDeep from 'lodash/cloneDeep'
import { v4 } from 'uuid'
import {
	buildDeckFromCardCountState,
	Card,
	CardCountState,
	DefaultGameState,
	GameEvent,
	GamePhase,
	GameState,
	getGameEventName,
	getNextNightRole,
	isDeckValid,
	NightRoleOrderType,
	PlayerEvent,
	PlayerEventType,
	prepareDeckForGame,
	updateCardCount,
	UserDetails
} from '../../../common'
import Player from './Player'
import { Namespace, Server, Socket } from 'socket.io'

export class GameServer {
	public readonly gameState: GameState

	public readonly roomId = v4()

	private players: Player[]

	private server: Namespace

	public get deck() {
		return this.gameState.deck
	}

	public constructor(server: Server) {
		this.gameState = cloneDeep(DefaultGameState)
		this.players = []
		this.server = server.in(this.roomId)
	}

	private emit(gameEvent: GameEvent, ...args: any[]) {
		this.server.emit(getGameEventName(gameEvent), ...args)
	}

	private static playerEmit(player: Player, gameEvent: GameEvent, ...args: any[]) {
		player.socket?.emit(getGameEventName(gameEvent), ...args)
	}

	private static addEventToPlayerHistory(player: Player, event: PlayerEvent) {
		player.history.push(event)
		GameServer.playerEmit(player, GameEvent.UpdatePlayerHistory, player.history)
	}

	private static clearPlayer(player: Player) {
		player.socket?.removeAllListeners()
		player.socket?.disconnect(true)
		player.socket = null
		player.userDetails = null
	}

	public removeAllPlayers() {
		for (let player of this.players) {
			GameServer.clearPlayer(player)
		}

		this.players = []
	}

	private setupPlayerSocket(player: Player) {
		const {socket} = player

		if (socket === null)
			return

		socket.join(this.roomId)

		// TODO: Attach event listeners
	}

	private updateGamePhase(phase: GamePhase) {
		this.gameState.phase = phase
		this.emit(GameEvent.PhaseChange, phase)
	}

	private updateNightRole(role: NightRoleOrderType) {
		this.gameState.nightRole = role
		this.emit(GameEvent.AnnounceNightRole, role)
	}

	public initializePlayers(userDetailsList: UserDetails[]) {
		// Clear the old players, if any
		this.removeAllPlayers()

		// Generate a basic room for players to join
		this.players = userDetailsList.map(userDetails => ({
			socket: null,
			startingCard: null,
			history: [],
			userDetails: userDetails
		}))
	}

	public joinPlayer(socket: Socket, userDetails: UserDetails, requestedPosition?: number) {
		// TODO: Check for disallowing player replacements

		let seatIndex = this.players.findIndex(p => p.userDetails?.id === userDetails.id)

		// Allow replacement if a player leaves
		if (seatIndex === -1 &&
			requestedPosition !== undefined &&
			this.players.length > requestedPosition &&
			requestedPosition >= 0 &&
			this.players[requestedPosition].userDetails?.id === null) {
			seatIndex = requestedPosition
		}

		let player: Player

		if (seatIndex !== -1) {
			player = this.players[seatIndex]

			GameServer.clearPlayer(player)
			player.socket = socket
			player.userDetails = userDetails
		} else {
			player = {
				socket,
				history: [],
				startingCard: null,
				userDetails: userDetails
			}

			this.players = [
				...this.players,
				player
			]
		}

		this.setupPlayerSocket(player)

		const playersState = this.players.map(p => p.userDetails)

		this.emit(GameEvent.UpdatePlayers, playersState)
	}

	public startSetup() {
		if (this.gameState.phase !== GamePhase.None)
			return

		this.updateGamePhase(GamePhase.Setup)
	}

	public tempInitCardCountState(cardCountState: CardCountState) {
		this.gameState.cardCountState = cardCountState
	}

	public startGame() {
		if (this.gameState.phase !== GamePhase.Setup)
			return

		const baseDeck = buildDeckFromCardCountState(this.gameState.cardCountState)
		this.gameState.deck = baseDeck

		const validationResult = isDeckValid(this.gameState, this.players.length)

		if (validationResult !== null) {
			// TODO: Emit errors
			console.error('Validation failed for game', validationResult)
			return
		}

		this.gameState.deck = prepareDeckForGame(this.gameState.cardCountState, baseDeck)

		// Set the players' starting card
		for (let index = 0; index < this.players.length; index++) {
			const player = this.players[index]

			player.startingCard = this.gameState.deck[index]
			GameServer.addEventToPlayerHistory(player, {
				type: PlayerEventType.StartedWithCard,
				cardOrCards: player.startingCard,
				userOrUsers: player.userDetails,
				playerOrPlayers: index
			})

			GameServer.playerEmit(player, GameEvent.ShowOwnCard, player.startingCard)
		}

		this.updateGamePhase(GamePhase.Night)
	}

	public updateCardCount(card: Card, count: number) {
		const originalCount = this.gameState.cardCountState[card]

		this.gameState.cardCountState = updateCardCount(this.gameState.cardCountState, card, count)

		const updatedCount = this.gameState.cardCountState[card]

		// Send if different
		if (originalCount !== updatedCount) {
			this.emit(GameEvent.UpdateCardCount, card, count)
		}
	}

	public getNextNightRoleInDeck() {
		let nextNightRole = getNextNightRole(this.gameState.nightRole)

		while (nextNightRole !== null) {
			const isInDeck = this.gameState.deck.indexOf(nextNightRole) !== -1

			if (isInDeck)
				return nextNightRole
		}

		return null
	}

	public updateNextNightRole() {
		const nextNightRole = this.getNextNightRoleInDeck()

		if (nextNightRole === null) {
			this.updateGamePhase(GamePhase.Day)
		} else {
			this.updateNightRole(nextNightRole)
		}
	}
}
