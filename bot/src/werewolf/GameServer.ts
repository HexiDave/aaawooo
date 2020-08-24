import fs from 'fs'
import path from 'path'
import cloneDeep from 'lodash/cloneDeep'
import {
	AlphaWolfCards,
	BasePlayer,
	buildDeckFromCardCountState,
	Card,
	DefaultGameState,
	END_ROLE_ACTION,
	GameEvent,
	GamePhase,
	GameState,
	getGameEventName,
	getNextNightRole,
	isDeckValid,
	NightRoleOrderType,
	OptionalCard,
	PlayerEvent,
	PlayerEventType,
	prepareDeckForGame,
	Timer,
	updateAlphaWolfCard,
	updateCardCount,
	UserDetails
} from '../../../common'
import Player, { PlayerWithIndex } from './Player'
import { Namespace, Server, Socket } from 'socket.io'
import { RoleEventGenerator, RoleEventGeneratorFunc } from './RoleEventFuncType'
import { VoiceConnection } from 'discord.js'
import RedisWrapper from '../RedisWrapper'
import { GameServerState } from './GameServerState'
import { werewolfRole } from './roles/werewolf'
import { alphaWolfRole, alphaWolfRoleAction } from './roles/alphaWolf'
import { mysticWolfRole, mysticWolfRoleAction } from './roles/mysticWolf'
import { minionRole } from './roles/minion'
import { masonRole } from './roles/mason'
import { seerRole, seerRoleAction } from './roles/seer'
import { appSeerRole, appSeerRoleAction } from './roles/appSeer'
import { drunkRole, drunkRoleAction } from './roles/drunk'
import { insomniacRole } from './roles/insomniac'
import { robberRole, robberRoleAction } from './roles/robber'
import { troublemakerRole, troublemakerRoleAction } from './roles/troublemaker'

export const DEFAULT_FALLBACK_DELAY = 30_000
export const DEFAULT_ROLE_DURATION = 5_000
export const DEFAULT_ROLE_RESET_PAUSE = 500
export const DEFAULT_ROLE_END_PAUSE = 2_000
export const DELIBERATION_TIMER = 60 * 5 * 1_000

type RoleActionFunction = (player: Player, gameServer: GameServer, ...args: any) => void

function* nightStartGenerator(gameServer: GameServer): RoleEventGenerator {
	yield 5_000

	gameServer.sendGameStateToAll()

	yield gameServer.playRoleCloseEyes('everyone')

	return yield DEFAULT_ROLE_END_PAUSE
}

function* dayGenerator(gameServer: GameServer): RoleEventGenerator {
	yield DEFAULT_ROLE_RESET_PAUSE

	yield gameServer.playRoleWakeUp('everyone')

	yield DEFAULT_ROLE_END_PAUSE

	gameServer.updateGamePhase(GamePhase.Deliberation)

	yield DEFAULT_ROLE_END_PAUSE
}

function* deliberationGenerator(gameServer: GameServer): RoleEventGenerator {
	gameServer.sendGameEvent(GameEvent.SetDeliberationTimer, DELIBERATION_TIMER)

	yield DELIBERATION_TIMER

	gameServer.playTrack(GameServer.buildRoleTrackName('everyone', 'timeisup_321vote'))

	yield 5_000

	gameServer.updateGamePhase(GamePhase.Vote)

	yield DEFAULT_ROLE_RESET_PAUSE
}

export class GameServer {
	public __DEBUG_START_CARD: OptionalCard = null

	public readonly gameState: GameState

	public readonly roomId: string

	private readonly roleGenerators = new Map<NightRoleOrderType, RoleEventGeneratorFunc>()

	private readonly roleActions = new Map<NightRoleOrderType, RoleActionFunction>()

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

	public get playerCount() {
		return this.players.length
	}

	public constructor(roomId: string, server: Server, voiceConnection: VoiceConnection, redis: RedisWrapper<GameServerState>) {
		this.gameState = cloneDeep(DefaultGameState)
		this.roomId = roomId
		this.players = []
		this.server = server.in(this.roomId)
		this.voiceConnection = voiceConnection
		this.redis = redis

		this.setupVoiceConnection()

		this.timer = new Timer(this.onTimer)

		// Role generators
		this.addRole(Card.AlphaWolf, alphaWolfRole, alphaWolfRoleAction)
		this.addRole(Card.ApprenticeSeer, appSeerRole, appSeerRoleAction)
		this.addRole(Card.Drunk, drunkRole, drunkRoleAction)
		this.addRole(Card.Insomniac, insomniacRole)
		this.addRole(Card.Mason, masonRole)
		this.addRole(Card.Minion, minionRole)
		this.addRole(Card.MysticWolf, mysticWolfRole, mysticWolfRoleAction)
		this.addRole(Card.Robber, robberRole, robberRoleAction)
		this.addRole(Card.Seer, seerRole, seerRoleAction)
		this.addRole(Card.Troublemaker, troublemakerRole, troublemakerRoleAction)
		this.addRole(Card.Werewolf, werewolfRole)
	}

	public addRole(role: NightRoleOrderType, roleEventGen: RoleEventGeneratorFunc, roleAction?: RoleActionFunction) {
		this.roleGenerators.set(role, roleEventGen)

		if (roleAction !== undefined) {
			this.roleActions.set(role, roleAction)
		}
	}

	public getGameServerState(): GameServerState {
		const players: BasePlayer[] = this.players.map(({socket, roleCardsState, roleState, ...basePlayer}) => basePlayer)

		return {
			players,
			gameState: this.gameState
		}
	}

	public tearDown() {
		// Ignore promise
		this.timer.pause()
		this.removeAllPlayers()
		this.voiceConnection.disconnect()
		this.redis.delete(this.roomId).then()
	}

	private setupVoiceConnection() {
		const {voiceConnection} = this

		voiceConnection
			.on('error', console.error)
			.on('closing', () => console.log('Closing voice connection'))
			.on('disconnect', () => console.log('Disconnect called on voice connection'))
			.on('reconnecting', () => console.log('Attempting to re-connect voice'))
	}

	public sendGameEvent(gameEvent: GameEvent, ...args: any[]) {
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
		player.roleCardsState = []
		player.roleState = 0
	}

	public removeAllPlayers() {
		for (let player of this.players) {
			GameServer.clearPlayer(player)
		}

		this.players = []
	}

	public getPlayerByIndex(index: number) {
		if (index < 0 || index >= this.players.length)
			return null

		return this.players[index]
	}

	public getIndexByPlayer(player: Player) {
		return this.players.findIndex(p => p === player)
	}

	private setupPlayerSocket(player: Player) {
		const {socket} = player

		if (socket === null)
			return

		socket.join(this.roomId)

		socket.on(getGameEventName(GameEvent.PlayerReady), () => {
			GameServer.socketEmit(socket, GameEvent.UpdatePlayers, this.getUserDetails(), player.userDetails.id)
			this.sendGameStateToSocket(socket)
		})

		socket.on(getGameEventName(GameEvent.UpdateCardCount), (card: Card, count: number) => {
			this.updateCardCount(card, count)
		})

		socket.on(getGameEventName(GameEvent.RequestStart), () => {
			this.startGame()
		})

		socket.on(getGameEventName(GameEvent.NightRoleAction), (role: NightRoleOrderType, ...args: any) => {
			if (player.roleState === 0)
				return

			const roleAction = this.roleActions.get(role)
			if (roleAction === undefined)
				return

			console.debug('Running action for role', role)
			roleAction(player, this, ...args)
			console.debug('Action complete for role', role)
		})
	}

	public updateGamePhase(phase: GamePhase) {
		this.gameState.phase = phase
		this.sendGameEvent(GameEvent.PhaseChange, phase)
		this.storeGameServerState()
	}

	private updateNightRole(role: NightRoleOrderType) {
		this.gameState.nightRole = role
		this.sendGameEvent(GameEvent.AnnounceNightRole, role)

		// TODO: Find role and play it
		const genFunc = this.roleGenerators.get(role)
		if (!genFunc) {
			console.warn(`Generator function for role [${role}] not found.`)
			return
		}

		this.generator = genFunc(role, this)
		const current = this.generator.next()
		if (current.done === false) {
			this.timer.start(current.value)
		}
	}

	private buildPublicGameState(deck?: Card[]): GameState {
		return {
			...this.gameState,
			deck: deck ? deck : this.gameState.deck.map(_ => null)
		}
	}

	private activateGenerator() {
		if (!this.generator)
			return

		const current = this.generator.next()

		if (current.done === false) {
			this.timer.start(current.value)
		}
	}

	public sendGameStateToAll(deck?: Card[]) {
		this.sendGameEvent(GameEvent.UpdateGameState, this.buildPublicGameState(deck))
	}

	public sendGameStateToSocket(socket: Socket, deck?: Card[]) {
		// Hide the deck state by default
		const gameState = this.buildPublicGameState(deck)
		GameServer.socketEmit(socket, GameEvent.UpdateGameState, gameState)
	}

	public initializePlayers(userDetailsList: UserDetails[]) {
		// Clear the old players, if any
		this.removeAllPlayers()

		// Generate a basic room for players to join
		this.players = userDetailsList.map(userDetails => ({
			socket: null,
			startingCard: null,
			history: [],
			userDetails: userDetails,
			roleCardsState: [],
			roleState: 0
		}))

		this.startSetup()
	}

	public initializeWithGameServerState(gameServerState: GameServerState) {
		this.removeAllPlayers()

		const {gameState: {cardCountState, deck, loneWolfEnabled, nightRole, phase}, players} = gameServerState

		this.players = players.map(basePlayer => ({
			socket: null,
			roleState: 0,
			roleCardsState: [],
			...basePlayer
		}))

		const localGameState = this.gameState

		localGameState.loneWolfEnabled = loneWolfEnabled
		localGameState.phase = phase
		localGameState.nightRole = nightRole
		localGameState.deck = deck
		localGameState.cardCountState = cardCountState

		if (nightRole !== null) {
			this.updateNightRole(nightRole)
		} else {
			switch (this.gameState.phase) {
				case GamePhase.Night:
					this.generator = nightStartGenerator(this)
					break
				case GamePhase.Day:
					this.generator = dayGenerator(this)
					break
				case GamePhase.Deliberation:
					this.generator = deliberationGenerator(this)
					break
			}
			this.activateGenerator()
		}
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
				userDetails: userDetails,
				roleState: 0,
				roleCardsState: []
			}

			this.players = [
				...this.players,
				player
			]
		}

		this.setupPlayerSocket(player)

		this.sendGameStateToSocket(socket)

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

	public startGame() {
		if (this.gameState.phase !== GamePhase.Setup)
			return

		const baseDeck = buildDeckFromCardCountState(this.gameState.cardCountState)
		this.gameState.deck = baseDeck

		const validationResult = isDeckValid(this.gameState, this.players.length)

		if (validationResult !== null) {
			this.sendGameEvent(GameEvent.ValidationError, validationResult)
			return
		}

		const deck = prepareDeckForGame(this.gameState.cardCountState, baseDeck)

		if (this.__DEBUG_START_CARD) {
			// Assume player 0 is me

			if (deck[0] !== this.__DEBUG_START_CARD) {
				const otherCardIndex = deck.indexOf(this.__DEBUG_START_CARD)

				const playerCard = deck[0]
				deck[0] = deck[otherCardIndex]
				deck[otherCardIndex] = playerCard
			}
		}

		this.gameState.deck = deck

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
		}

		this.sendGameStateToAll()

		this.updateGamePhase(GamePhase.Night)

		// Show player their card
		for (let player of this.players) {
			GameServer.playerEmit(player, GameEvent.ShowOwnCard, player.startingCard)
		}

		this.storeGameServerState()

		this.generator = nightStartGenerator(this)
		this.activateGenerator()
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

	public updateAlphaWolfCard(alphaWolfCard: AlphaWolfCards) {
		const {cardCountState} = this.gameState

		const originalAlphaWolfCard = cardCountState.alphaWolfCard

		this.gameState.cardCountState = updateAlphaWolfCard(cardCountState, alphaWolfCard)

		// Send if different
		if (originalAlphaWolfCard !== alphaWolfCard) {
			this.sendGameEvent(GameEvent.UpdateAlphaWolfCard, alphaWolfCard)
			this.storeGameServerState()
		}
	}

	public getNextNightRoleInDeck() {
		let nextNightRole = getNextNightRole(this.gameState.nightRole)

		while (nextNightRole !== null) {
			const isInDeck = this.gameState.deck.indexOf(nextNightRole) !== -1

			if (isInDeck)
				return nextNightRole

			nextNightRole = getNextNightRole(nextNightRole)
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

	public getMiddleCardIndex(deckIndex: number) {
		return deckIndex - this.players.length
	}

	public getPlayersWithStartingCards(cardOrCards: Card | Card[]): PlayerWithIndex[] {
		const cards = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards]

		return this.players.map((player, index) => {
			if (cards.includes(player.startingCard)) {
				return {
					player,
					index
				}
			}

			return null
		}).filter(p => p !== null)
	}

	public resetPlayerRoleStates() {
		this.players.forEach(player => {
			player.roleState = 0
			player.roleCardsState = []
		})
	}

	public sendEndRoleActionToAll(role: NightRoleOrderType) {
		this.sendGameEvent(GameEvent.NightRoleAction, role, END_ROLE_ACTION)

		return DEFAULT_ROLE_RESET_PAUSE
	}

	public sendNightRoleAction(player: Player, role: NightRoleOrderType, stageIndex: number = END_ROLE_ACTION, ...args: any) {
		player.socket?.emit(getGameEventName(GameEvent.NightRoleAction), role, stageIndex, ...args)
	}

	public sendStartNightRoleAction(player: Player, role: NightRoleOrderType, duration: number = DEFAULT_ROLE_DURATION) {
		player.socket?.emit(getGameEventName(GameEvent.StartNightRoleAction), role, duration)
	}

	public pause() {
		this.timer.pause()
		// TODO: Pause timer
	}

	public resume() {
		this.timer.resume()
		// TODO: Resume timer
	}

	public static buildRoleTrackName(role: NightRoleOrderType | string, stage: string) {
		return `en_male_${role.toLowerCase()}_${stage.toLowerCase()}.ogg`
	}

	public playRoleWakeUp(role: NightRoleOrderType | string) {
		return this.playTrack(GameServer.buildRoleTrackName(role, 'wake'))
	}

	public playRoleCloseEyes(role: NightRoleOrderType | string) {
		return this.playTrack(GameServer.buildRoleTrackName(role, 'close'))
	}

	public playTrack(trackName: string, fallbackDelay: number = DEFAULT_FALLBACK_DELAY) {
		try {
			this.currentTrackName = trackName
			const fullPath = path.join(__dirname, '../../audio/', trackName)
			this.voiceConnection.play(fs.createReadStream(fullPath), {highWaterMark: 50, type: 'ogg/opus'})
			this.voiceConnection.dispatcher.once('finish', () => this.onTrackFinished(trackName))
		} catch (e) {
			console.error('Failed to play track', e)
		}

		return fallbackDelay
	}

	public stopTrack() {
		try {
			if (this.currentTrackName !== null) {
				if (this.voiceConnection.dispatcher !== null) {
					this.voiceConnection.dispatcher.destroy()
				}
				this.currentTrackName = null
			}
		} catch (e) {
			console.error('Failed to stop track', e)
		}
	}

	public activateNextSequence() {
		if (this.gameState.phase === GamePhase.Deliberation) {
			this.generator = deliberationGenerator(this)
			this.gameState.nightRole = null
			this.storeGameServerState()
			return
		} else if (this.gameState.phase === GamePhase.Vote) {
			this.generator = null
			this.storeGameServerState()
			return
		}

		try {
			this.resetPlayerRoleStates()
			// Store the game state in case of server crash
			this.storeGameServerState()

			console.debug('Moving to next sequence')
			this.updateNextNightRole()

			if (this.gameState.phase === GamePhase.Day) {
				this.generator = dayGenerator(this)
				this.activateGenerator()
			}
		} catch (e) {
			console.error('Error in activation sequence', e)
		}
	}

	public onTrackFinished = (trackName: string) => {
		if (trackName !== this.currentTrackName)
			return

		if (this.currentTrackName !== null) {
			console.log(`Track finished: ${this.currentTrackName}`)
			this.currentTrackName = null
		}

		this.timer.pause()

		try {
			this.onTimer()
		} catch (e) {
			console.error('Track failed to finish', e)
		}
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
