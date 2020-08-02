import cloneDeep from 'lodash/cloneDeep'
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
import Player, { BasePlayer } from './Player'
import { Namespace, Server, Socket } from 'socket.io'
import { RoleEventGenerator } from './RoleEventFuncType'
import { EventEmitter } from 'events'
import { VoiceConnection } from 'discord.js'
import Timer from '../../../common/Timer'
import RedisWrapper from '../RedisWrapper'
import { GameServerState } from './GameServerState'

export class GameServer extends EventEmitter {
	public static readonly PauseEventSymbol = Symbol()

	public static readonly ResumeEventSymbol = Symbol()

	public static readonly PlayTrackSymbol = Symbol()

	public static readonly StopTrackSymbol = Symbol()

	public readonly gameState: GameState

	public readonly roomId: string

	private timer: Timer

	private players: Player[]

	private server: Namespace

	private generator: RoleEventGenerator | null

	private currentTrackName: string

	private voiceConnection: VoiceConnection

	private redis: RedisWrapper<GameServerState>

	public get isStarted() {
		return this.gameState.phase > GamePhase.Setup
	}

	public constructor(roomId: string, server: Server, voiceConnection: VoiceConnection, redis: RedisWrapper<GameServerState>) {
		super()
		this.gameState = cloneDeep(DefaultGameState)
		this.roomId = roomId
		this.players = []
		this.server = server.in(this.roomId)
		this.voiceConnection = voiceConnection
		this.redis = redis

		this.setupVoiceConnection()

		this.timer = new Timer(this.onTimer)
	}

	public getGameServerState(): GameServerState {
		const players: BasePlayer[] = this.players.map(({history, startingCard, userDetails}) => ({
			userDetails,
			startingCard,
			history
		}))

		return {
			players,
			gameState: this.gameState
		}
	}

	public tearDown() {
		// Ignore promise
		this.redis.delete(this.roomId).then()
		this.removeAllListeners()
		this.removeAllPlayers()
		this.voiceConnection.disconnect()
	}

	private setupVoiceConnection() {
		const {voiceConnection} = this

		voiceConnection
			.on('error', console.error)
			.on('closing', () => console.log('Closing voice connection'))
			.on('disconnect', () => console.log('Disconnect called on voice connection'))
			.on('reconnecting', () => console.log('Attempting to re-connect voice'))
	}

	private sendGameEvent(gameEvent: GameEvent, ...args: any[]) {
		this.server.emit(getGameEventName(gameEvent), ...args)
	}

	private static socketEmit(socket: Socket | null, gameEvent: GameEvent, ...args: any[]) {
		socket?.emit(getGameEventName(gameEvent), ...args)
	}

	private static playerEmit(player: Player, gameEvent: GameEvent, ...args: any[]) {
		GameServer.socketEmit(player.socket, gameEvent, ...args)
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

		socket.on(getGameEventName(GameEvent.PlayerReady), () => {
			GameServer.socketEmit(socket, GameEvent.UpdatePlayers, this.getUserDetails())
			this.sendGameStateToSocket(socket)
		})

		socket.on(getGameEventName(GameEvent.UpdateCardCount), (card: Card, count: number) => {
			this.updateCardCount(card, count)
		})
	}

	private updateGamePhase(phase: GamePhase) {
		this.gameState.phase = phase
		this.sendGameEvent(GameEvent.PhaseChange, phase)
	}

	private updateNightRole(role: NightRoleOrderType) {
		this.gameState.nightRole = role
		this.sendGameEvent(GameEvent.AnnounceNightRole, role)
	}

	private sendGameStateToSocket(socket: Socket) {
		GameServer.socketEmit(socket, GameEvent.UpdateGameState, this.gameState)
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

		this.startSetup()
	}

	public initializeWithGameServerState(gameServerState: GameServerState) {
		this.removeAllPlayers()

		const {gameState: {cardCountState, deck, loneWolfEnabled, nightRole, phase}, players} = gameServerState

		this.players = players.map(player => ({
			socket: null,
			...player
		}))

		const localGameState = this.gameState

		localGameState.loneWolfEnabled = loneWolfEnabled
		localGameState.phase = phase
		localGameState.nightRole = nightRole
		localGameState.deck = deck
		localGameState.cardCountState = cardCountState
	}

	public getUserDetailsById(userId: string) {
		return this.players.find(p => p.userDetails?.id === userId)?.userDetails
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

		this.sendPlayerStateToAll()
	}

	private getUserDetails() {
		return this.players.map(p => p.userDetails)
	}

	private sendPlayerStateToAll() {
		this.sendGameEvent(GameEvent.UpdatePlayers, this.getUserDetails())
	}

	private storeGameServerState() {
		this.redis.set(this.roomId, this.getGameServerState())
			.then(() => console.log('Stored state'))
			.catch(console.error)
	}

	public startSetup() {
		if (this.gameState.phase !== GamePhase.None)
			return

		this.updateGamePhase(GamePhase.Setup)

		// Ignore promise
		this.storeGameServerState()
	}

	public tempInitCardCountState(cardCountState: CardCountState) {
		this.gameState.cardCountState = cardCountState
	}

	public tempStartSequence(gen: RoleEventGenerator) {
		this.generator = gen
		this.generator.next()
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

		this.storeGameServerState()
	}

	public updateCardCount(card: Card, count: number) {
		const originalCount = this.gameState.cardCountState[card]

		this.gameState.cardCountState = updateCardCount(this.gameState.cardCountState, card, count)

		const updatedCount = this.gameState.cardCountState[card]

		// Send if different
		if (originalCount !== updatedCount) {
			this.sendGameEvent(GameEvent.UpdateCardCount, card, count)
			this.storeGameServerState()
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

	public getPlayerCard(playerIndex: number) {
		if (playerIndex >= this.players.length || playerIndex < 0)
			throw new Error(`Invalid player index: ${playerIndex}`)

		return this.gameState.deck[playerIndex]
	}

	public getMiddleCardRealIndex(middleCardIndex: number) {
		if (middleCardIndex >= 3 || middleCardIndex < 0)
			throw new Error(`Invalid middle card index: ${middleCardIndex}`)

		return this.players.length + middleCardIndex
	}

	public getMiddleCard(middleCardIndex: number) {
		return this.gameState.deck[this.getMiddleCardRealIndex(middleCardIndex)]
	}

	public pause() {
		this.timer.pause()
		this.emit(GameServer.PauseEventSymbol)
	}

	public resume() {
		this.timer.resume()
		this.emit(GameServer.ResumeEventSymbol)
	}

	public playTrack(trackName: string) {
		this.currentTrackName = trackName
		this.emit(GameServer.PlayTrackSymbol, trackName)
	}

	public stopTrack() {
		if (this.currentTrackName !== null) {
			this.emit(GameServer.StopTrackSymbol, this.currentTrackName)
			this.currentTrackName = null
		}
	}

	public activateNextSequence() {
		console.log('Moving to next sequence')
	}

	public onTrackFinished = (trackName: string) => {
		if (trackName !== this.currentTrackName)
			return

		if (this.currentTrackName !== null) {
			console.log(`Track finished: ${this.currentTrackName}`)
			this.currentTrackName = null
		}

		this.timer.pause()

		this.onTimer()
	}

	public onTimer = () => {
		this.stopTrack()

		if (this.generator === null) {
			this.activateNextSequence()
			return
		}

		const current = this.generator.next()

		if (current.done === false) {
			this.timer.start(current.value)
		} else {
			this.activateNextSequence()
		}
	}
}
