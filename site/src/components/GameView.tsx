import React from 'react'
import {
	AlphaWolfCards,
	BaseHistoryEvent,
	Card,
	DefaultGameState,
	END_ROLE_ACTION,
	GameEventType,
	GamePhase,
	GameState,
	getDeckSizeFromCardCountState,
	getGameEventName,
	NightRoleOrderType,
	NightRoleOrderTypeOrNull,
	ShowPlayersOtherRolesPacket,
	UserDetails,
	ValidationResult
} from '../../../common'
import CardCountList from './CardCountList'
import ActivityView from './ActivityView'
import PlayerList from './PlayerList'
import GameStage from './GameStage'
import { ConnectionStage } from '../SocketContextProvider'
import cloneDeep from 'lodash/cloneDeep'
import { setGameEventHandler } from '../setGameEventHandler'
import classes from './GameView.module.scss'
import Dialog from './Dialog'
import { GamePhaseNames } from '../gamePhaseNames'
import { CardNames } from '../cardNames'
import RolloverTransition from './RolloverTransition'
import { BasePlayerDisplayDetails, buildBasePlayerDisplayDetails } from './PlayerItem'

interface GameViewProps {
	socket: SocketIOClient.Socket | null
	connectionStage: ConnectionStage
}

interface GameViewState {
	userDetailsList: UserDetails[]
	playerDisplayDetailsList: BasePlayerDisplayDetails[]
	playerId: string
	gameState: GameState
	clickablePlayers: number[]
	clickableMiddleCards: number[]
	playerRole: NightRoleOrderTypeOrNull
	cardClickBuffer: number[],
	votes: number[],
	isGameDestroyDialogShown: boolean
	playersSpeaking: number[]
	history: BaseHistoryEvent[]
	isVillageIdiotActionDialogShown: boolean
}

const DEFAULT_GAME_VIEW_STATE: GameViewState = {
	gameState: cloneDeep(DefaultGameState),
	playerId: '',
	userDetailsList: [],
	playerDisplayDetailsList: [],
	clickablePlayers: [],
	clickableMiddleCards: [],
	playerRole: null,
	cardClickBuffer: [],
	votes: [],
	isGameDestroyDialogShown: false,
	playersSpeaking: [],
	history: [],
	isVillageIdiotActionDialogShown: false
}

export default class GameView extends React.Component<GameViewProps, GameViewState> {
	public readonly state: GameViewState = cloneDeep(DEFAULT_GAME_VIEW_STATE)

	private clockElemRef = React.createRef<HTMLDivElement>()

	private clockTimer: NodeJS.Timeout | null = null

	private countdownElemRef = React.createRef<HTMLDivElement>()

	private countdownAnimation: number | null = null

	private emitGameEvent(gameEvent: GameEventType, ...args: any) {
		this.props.socket?.emit(getGameEventName(gameEvent), ...args)
	}

	private getClockString = () => {
		const now = new Date()

		return now.toLocaleTimeString()
	}

	private clearCountdownAnimation = () => {
		if (this.countdownAnimation !== null) {
			cancelAnimationFrame(this.countdownAnimation)
			this.countdownAnimation = null
		}

		if (this.countdownElemRef.current !== null) {
			this.countdownElemRef.current.className = classes.countdownBar
		}
	}

	private requestCountdownAnimation = (startDateTime: Date, endDateTime: Date) => () => {
		const now = new Date()

		if (now > endDateTime) {
			this.clearCountdownAnimation()
			return
		}

		const countdownElem = this.countdownElemRef.current

		if (countdownElem === null)
			return

		// Scale the current time between [0,1]
		const startTime = startDateTime.getTime()
		const endTime = endDateTime.getTime()
		const nowTime = now.getTime()

		const nowPercent = Math.min(Math.max(1.0 - ((nowTime - startTime) / (endTime - startTime)), 0), 1)

		countdownElem.style.transform = `scaleX(${nowPercent})`

		this.countdownAnimation = requestAnimationFrame(this.requestCountdownAnimation(startDateTime, endDateTime))
	}

	private setCountdownTimer(endTime: number) {
		const startDateTime = new Date()
		const endDateTime = new Date(endTime)

		this.clearCountdownAnimation()
		if (this.countdownElemRef.current !== null) {
			this.countdownElemRef.current.className = `${classes.countdownBar} ${classes.showCountdownBar}`
			this.countdownAnimation = requestAnimationFrame(this.requestCountdownAnimation(startDateTime, endDateTime))
		}
	}

	private clearDeck = () => {
		const {gameState} = this.state
		this.setState({
			gameState: {
				...gameState,
				deck: Array.from({length: getDeckSizeFromCardCountState(gameState.cardCountState)}).map(_ => null)
			}
		})
	}

	private setCardCount = (card: Card, count: number) => {
		const {gameState} = this.state
		this.setState({
			gameState: {
				...gameState,
				cardCountState: {
					...gameState.cardCountState,
					[card]: count
				}
			}
		})
	}

	private setAlphaWolfCard = (alphaWolfCard: AlphaWolfCards) => {
		const {gameState} = this.state
		const {cardCountState} = gameState

		this.setState({
			gameState: {
				...gameState,
				cardCountState: {
					...cardCountState,
					alphaWolfCard
				}
			}
		})
	}

	private setAllPlayersClickable = () => {
		const {userDetailsList} = this.state

		this.setState({
			clickablePlayers: userDetailsList.map((_, index) => index)
		})
	}

	private setOtherPlayersClickable = () => {
		const {userDetailsList, playerId} = this.state
		const clickablePlayers = userDetailsList.reduce((prev, userDetails, index) => (userDetails?.id === playerId ? prev : [
			...prev,
			index
		]), [] as number[])

		this.setState({clickablePlayers})
	}

	private setMiddleCardsClickable = () => {
		const {gameState: {cardCountState}} = this.state

		const length = cardCountState.alphaWolfCard === 'none' ? 3 : 4

		const clickableMiddleCards = Array.from({length}).map((_, index) => index)

		this.setState({
			clickableMiddleCards
		})
	}

	private handleCardCountUpdate = (card: Card, count: number) => {
		this.emitGameEvent(GameEventType.UpdateCardCount, card, count)
	}

	private sendCardClickAction(index: number) {
		const {playerRole} = this.state
		this.emitGameEvent(GameEventType.NightRoleAction, playerRole, index)
	}

	private handleCardClick = (index: number) => {
		const {playerRole, cardClickBuffer, clickablePlayers, gameState: {phase}} = this.state

		if (phase === GamePhase.Vote) {
			this.emitGameEvent(GameEventType.CastVote, index)
			return
		}

		switch (playerRole) {
			case Card.AlphaWolf:
				this.setState({
					clickablePlayers: []
				})
				break
			case Card.Troublemaker:
				if (cardClickBuffer.length === 0) {
					this.setState({
						cardClickBuffer: [index],
						clickablePlayers: clickablePlayers.filter(playerIndex => playerIndex !== index)
					})

					// Don't send the action yet
					return
				} else {
					this.emitGameEvent(GameEventType.NightRoleAction, playerRole, cardClickBuffer[0], index)

					// Reset it
					this.setState({
						cardClickBuffer: [],
						clickablePlayers: []
					})

					return
				}
			case Card.Seer:
				if (index < this.state.userDetailsList.length) {
					// Reset it
					this.setState({
						cardClickBuffer: [],
						clickablePlayers: [],
						clickableMiddleCards: []
					})
				} else {
					this.setState({
						clickablePlayers: []
					})
				}
				break
			case Card.Werewolf:
			case Card.ApprenticeSeer:
				// Reset it
				this.setState({
					cardClickBuffer: [],
					clickablePlayers: [],
					clickableMiddleCards: []
				})
				break
		}

		this.sendCardClickAction(index)
	}

	private handleMiddleCardClick = (index: number) => {
		this.handleCardClick(index + this.state.userDetailsList.length)
	}

	private handleAlphaWolfCardChange = (alphaWolfCard: AlphaWolfCards) => {
		this.emitGameEvent(GameEventType.UpdateAlphaWolfCard, alphaWolfCard)
	}

	private handleLoneWolfChange = (loneWolfEnabled: boolean) => {
		this.updateLoneWolfEnabled(loneWolfEnabled)
		this.emitGameEvent(GameEventType.UpdateLoneWolf, loneWolfEnabled)
	}

	private updateDeliberationMinutes = (minutes: number) => {
		this.setState({
			gameState: {
				...this.state.gameState,
				deliberationMinutes: minutes
			}
		})
	}

	private handleUpdateDeliberationMinutesChange = (minutes: number) => {
		this.updateDeliberationMinutes(minutes)
		this.emitGameEvent(GameEventType.UpdateDeliberationTimer, minutes)
	}

	private handleStartGameClick = () => {
		this.emitGameEvent(GameEventType.RequestStart)
	}

	private handleDestroyGameClick = () => {
		this.setState({
			isGameDestroyDialogShown: true
		})
	}

	private handleDestroyGameDialogClose = () => this.setState({isGameDestroyDialogShown: false})

	private handleDestroyGame = () => {
		this.handleDestroyGameDialogClose()

		this.emitGameEvent(GameEventType.RequestDestroy)
	}

	private handleVillageIdiotDialogClose = () => this.setState({isVillageIdiotActionDialogShown: false})

	private handleVillageIdiotAction = (shiftLeft?: boolean) => () => {
		this.handleVillageIdiotDialogClose()

		if (shiftLeft !== undefined) {
			this.emitGameEvent(GameEventType.NightRoleAction, Card.VillageIdiot, shiftLeft)
		}
	}

	private setupSocket(socket: SocketIOClient.Socket) {
		setGameEventHandler(socket, GameEventType.AddHistoryEvent, (event: BaseHistoryEvent) => {
			console.debug('Added history event', event)
			this.setState({
				history: [
					event,
					...this.state.history,
				]
			})
		})

		setGameEventHandler(socket, GameEventType.SendHistory, (history: BaseHistoryEvent[]) => {
			console.debug('Sent full history')
			this.setState({history})
		})

		setGameEventHandler(socket, GameEventType.UpdatePlayerSpeakingState, (playerIndex: number, isSpeaking: boolean) => {
			const {playersSpeaking} = this.state

			const index = playersSpeaking.indexOf(playerIndex)

			// In the list and shouldn't be
			if (index !== -1 && !isSpeaking) {
				this.setState({
					playersSpeaking: [
						...playersSpeaking.slice(0, index),
						...playersSpeaking.slice(index + 1)
					]
				})
			} else if (index === -1 && isSpeaking) {
				// Not in the list and should be
				this.setState({
					playersSpeaking: [
						...playersSpeaking,
						playerIndex
					]
				})
			}
		})

		setGameEventHandler(socket, GameEventType.SetDeliberationTimer, (endTime: number) => {
			this.setCountdownTimer(endTime)
		})

		setGameEventHandler(socket, GameEventType.SetVoteTimer, (endTime: number) => {
			this.setCountdownTimer(endTime)
		})

		setGameEventHandler(socket, GameEventType.ShowVotes, (votes: number[]) => {
			this.setState({votes})
		})

		setGameEventHandler(socket, GameEventType.ShowOwnCard, (card: Card) => {
			const {gameState, userDetailsList, playerId} = this.state
			const playerIndex = userDetailsList.findIndex(u => u?.id === playerId)

			const deck = gameState.deck.map((deckCard, index) => index === playerIndex ? card : deckCard)

			console.debug('Got shown own card', playerIndex, deck)

			this.setState({
				gameState: {
					...gameState,
					deck
				}
			})
		})

		setGameEventHandler(socket, GameEventType.UpdatePlayers, (userDetailsList: UserDetails[], playerId?: string) => {
			console.debug('UpdatePlayers', userDetailsList, playerId)
			this.setState({
				userDetailsList
			})

			if (playerId !== undefined) {
				this.setState({
					playerId
				})
			}

			const {gameState} = this.state

			if (gameState.deck.length < userDetailsList.length) {
				this.setState({
					gameState: {
						...gameState,
						deck: Array.from({length: userDetailsList.length}).map(_ => null)
					}
				})
			}
		})

		setGameEventHandler(socket, GameEventType.UpdateGameState, (gameState: GameState) => {
			console.debug('UpdateGameState', gameState)
			this.setState({
				gameState
			})
		})

		setGameEventHandler(socket, GameEventType.UpdateCardCount, (card: Card, count: number) => {
			console.debug('Card update', card, count)

			this.setCardCount(card, count)
		})

		setGameEventHandler(socket, GameEventType.UpdateAlphaWolfCard, (alphaWolfCard: AlphaWolfCards) => {
			this.setAlphaWolfCard(alphaWolfCard)
		})

		setGameEventHandler(socket, GameEventType.UpdateLoneWolf, (loneWolfEnabled: boolean) => {
			this.updateLoneWolfEnabled(loneWolfEnabled)
		})

		setGameEventHandler(socket, GameEventType.UpdateDeliberationTimer, (minutes: number) => {
			this.updateDeliberationMinutes(minutes)
		})

		setGameEventHandler(socket, GameEventType.ValidationError, (validationResult: ValidationResult) => {
			console.warn('Validation error:', validationResult.description)
		})

		setGameEventHandler(socket, GameEventType.PhaseChange, (phase: GamePhase) => {
			this.setState({
				gameState: {
					...this.state.gameState,
					phase
				}
			})

			if (phase === GamePhase.Vote) {
				this.setOtherPlayersClickable()
			} else if (phase === GamePhase.End) {
				this.setState({clickablePlayers: []})
			}
		})

		setGameEventHandler(socket, GameEventType.ShowPlayersOtherRoles, (packet: ShowPlayersOtherRolesPacket) => {
			console.debug('Received ShowPlayersOtherRolesPacket', packet)

			const {gameState} = this.state

			const deck = [...gameState.deck]
			for (let {card, index} of packet) {
				deck[index] = card
			}

			this.setState({
				gameState: {
					...gameState,
					deck
				}
			})
		})

		setGameEventHandler(socket, GameEventType.AnnounceNightRole, (nightRole: NightRoleOrderType) => {
			this.setState({
				clickablePlayers: [],
				clickableMiddleCards: [],
				playerRole: null,
				cardClickBuffer: [],
				gameState: {
					...this.state.gameState,
					nightRole
				}
			})
		})

		// Handle extra steps for a night role
		setGameEventHandler(socket, GameEventType.NightRoleAction, (playerRole: NightRoleOrderType, stageIndex: number) => {
			// End-stage reset - optional
			if (stageIndex === END_ROLE_ACTION) {
				this.resetActions()
				return
			}

			switch (playerRole) {
				case Card.Witch:
					this.setState({
						clickableMiddleCards: []
					})
					this.setAllPlayersClickable()
					break
			}
		})

		setGameEventHandler(socket, GameEventType.StartNightRoleAction, (playerRole: NightRoleOrderType, endTime: number) => {
			this.setCountdownTimer(endTime)

			this.setState({
				playerRole
			})

			switch (playerRole) {
				case Card.Troublemaker:
				case Card.Robber:
				case Card.AlphaWolf:
				case Card.MysticWolf:
					this.setOtherPlayersClickable()
					break
				case Card.Seer:
					this.setOtherPlayersClickable()
					this.setMiddleCardsClickable()
					break
				case Card.Drunk:
				case Card.Witch:
				case Card.ApprenticeSeer:
					this.setMiddleCardsClickable()
					break
				case Card.Werewolf:
					if (this.state.gameState.loneWolfEnabled) {
						this.setMiddleCardsClickable()
					}
					break
				case Card.VillageIdiot:
					this.setState({
						isVillageIdiotActionDialogShown: true
					})
					break
			}
		})

		socket.emit(getGameEventName(GameEventType.PlayerReady))
	}

	private updateLoneWolfEnabled(loneWolfEnabled: boolean) {
		const {gameState} = this.state
		this.setState({
			gameState: {
				...gameState,
				loneWolfEnabled
			}
		})
	}

	private resetActions() {
		this.setState({
			clickablePlayers: [],
			clickableMiddleCards: [],
			cardClickBuffer: [],
			isVillageIdiotActionDialogShown: false
		})
		this.clearDeck()
	}

	componentDidMount() {
		this.clockTimer = setInterval(() => {
			const clockElem = this.clockElemRef.current

			if (clockElem === null)
				return

			clockElem.innerHTML = this.getClockString()
		}, 500)
	}

	componentDidUpdate(prevProps: Readonly<GameViewProps>, prevState: Readonly<GameViewState>, snapshot?: any) {

		// On Socket change
		if (this.props.socket !== prevProps.socket) {
			if (this.props.socket === null) {
				prevProps.socket?.removeAllListeners()
			} else {
				this.setupSocket(this.props.socket)
			}
		}

		if (this.props.connectionStage !== prevProps.connectionStage) {
			if (this.props.connectionStage !== ConnectionStage.Success) {
				this.setState(DEFAULT_GAME_VIEW_STATE)
				this.clearCountdownAnimation()
			}
		}

		if (this.state.userDetailsList !== prevState.userDetailsList) {
			const playerDisplayDetailsList = this.state.userDetailsList.map<BasePlayerDisplayDetails>(buildBasePlayerDisplayDetails)

			this.setState({playerDisplayDetailsList})
		}
	}

	componentWillUnmount() {
		if (this.clockTimer) {
			clearInterval(this.clockTimer)
		}

		this.clearCountdownAnimation()
	}

	render() {
		const {
			playerDisplayDetailsList,
			userDetailsList,
			gameState,
			clickablePlayers,
			clickableMiddleCards,
			votes,
			playersSpeaking,
			isGameDestroyDialogShown,
			history,
			isVillageIdiotActionDialogShown
		} = this.state

		return (
			<React.Fragment>
				<Dialog
					isOpen={isGameDestroyDialogShown}
					containerClassName={classes.actionDialog}
				>
					<h2>Destroy game?</h2>

					<p>
						Are you sure you want to destroy this game?
					</p>

					<div className={classes.actionDialogControls}>
						<button onClick={this.handleDestroyGame}>
							Yes
						</button>

						<button onClick={this.handleDestroyGameDialogClose}>
							No
						</button>
					</div>
				</Dialog>

				<Dialog
					isOpen={isVillageIdiotActionDialogShown}
					containerClassName={classes.actionDialog}
				>
					<h2>Village Idiot</h2>

					<p>
						Which direction do you want to shift the cards?
					</p>

					<div className={classes.actionDialogControls}>
						<button onClick={this.handleVillageIdiotAction(true)}>
							Left
						</button>

						<button onClick={this.handleVillageIdiotAction(false)}>
							Right
						</button>

						<button onClick={this.handleVillageIdiotAction()}>
							Skip
						</button>
					</div>
				</Dialog>

				<div className={classes.controls}>
					<div>
						<button
							onClick={this.handleStartGameClick}
							disabled={gameState.phase > GamePhase.Setup || gameState.phase === GamePhase.None}
						>
							Start game
						</button>

						<button
							onClick={this.handleDestroyGameClick}
							disabled={gameState.phase === GamePhase.None}
						>
							Destroy game
						</button>
					</div>

					{gameState.phase !== GamePhase.None && (
						<div className={classes.phase}>
							<RolloverTransition>
								{(gameState.phase === GamePhase.Night && gameState.nightRole !== null) ? (
									<span key={gameState.nightRole}>
										{GamePhaseNames[gameState.phase]}:
										{' '}
										<span className={classes.role}>
											{CardNames[gameState.nightRole]}
										</span>
									</span>
								) : (
									<span key={gameState.phase}>{GamePhaseNames[gameState.phase]}</span>
								)}
							</RolloverTransition>
						</div>
					)}

					<div className={classes.clock} ref={this.clockElemRef}>
						{this.getClockString()}
					</div>

					<div className={classes.countdownBar} ref={this.countdownElemRef}/>
				</div>

				<GameStage isNight={gameState.phase === GamePhase.Night}>
					<CardCountList
						playerCount={userDetailsList.length}
						cardCountState={gameState.cardCountState}
						isLoneWolfEnabled={gameState.loneWolfEnabled}
						isShown={gameState.phase === GamePhase.Setup}
						deliberationMinutes={gameState.deliberationMinutes}
						onUpdateCardCount={this.handleCardCountUpdate}
						onUpdateAlphaWolfCardChange={this.handleAlphaWolfCardChange}
						onUpdateLoneWolfEnabled={this.handleLoneWolfChange}
						onUpdateDeliberationMinutes={this.handleUpdateDeliberationMinutesChange}
					/>

					<ActivityView
						isShown={gameState.phase > GamePhase.Setup}
						gameState={gameState}
						clickableCards={clickableMiddleCards}
						history={history}
						playerDisplayDetailsList={playerDisplayDetailsList}
						onCardClick={this.handleMiddleCardClick}
					/>

					<PlayerList
						playerDisplayDetails={playerDisplayDetailsList}
						clickableUsers={clickablePlayers}
						isShowingClickable={clickablePlayers.length > 0}
						areCardsVisible={gameState.phase > GamePhase.Setup}
						shownCards={gameState.deck}
						votes={votes}
						playersSpeaking={playersSpeaking}
						onCardClick={this.handleCardClick}
					/>
				</GameStage>
			</React.Fragment>
		)
	}
}
