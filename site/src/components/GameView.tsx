import React from 'react'
import {
	AlphaWolfCards,
	Card,
	DefaultGameState,
	END_ROLE_ACTION,
	GameEvent,
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

interface GameViewProps {
	socket: SocketIOClient.Socket | null
	connectionStage: ConnectionStage
}

interface GameViewState {
	userDetailsList: UserDetails[]
	playerId: string
	gameState: GameState
	clickablePlayers: number[]
	clickableMiddleCards: number[]
	playerRole: NightRoleOrderTypeOrNull
	cardClickBuffer: number[],
	votes: number[],
	isGameDestroyDialogShown: boolean
}

const DEFAULT_GAME_VIEW_STATE: GameViewState = {
	gameState: cloneDeep(DefaultGameState),
	playerId: '',
	userDetailsList: [],
	clickablePlayers: [],
	clickableMiddleCards: [],
	playerRole: null,
	cardClickBuffer: [],
	votes: [],
	isGameDestroyDialogShown: false
}

export default class GameView extends React.Component<GameViewProps, GameViewState> {
	public readonly state: GameViewState = cloneDeep(DEFAULT_GAME_VIEW_STATE)

	private clockElemRef = React.createRef<HTMLDivElement>()

	private clockTimer: NodeJS.Timeout | null = null

	private getClockString = () => {
		const now = new Date()

		return now.toLocaleTimeString()
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
		this.props.socket?.emit(getGameEventName(GameEvent.UpdateCardCount), card, count)
	}

	private sendCardClickAction(index: number) {
		const {playerRole} = this.state
		this.props.socket?.emit(getGameEventName(GameEvent.NightRoleAction), playerRole, index)
	}

	private handleCardClick = (index: number) => {
		const {playerRole, cardClickBuffer, clickablePlayers, gameState: {phase}} = this.state

		if (phase === GamePhase.Vote) {
			this.props.socket?.emit(getGameEventName(GameEvent.CastVote), index)
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
					this.props.socket?.emit(getGameEventName(GameEvent.NightRoleAction), playerRole, cardClickBuffer[0], index)

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
		this.props.socket?.emit(getGameEventName(GameEvent.UpdateAlphaWolfCard), alphaWolfCard)
	}

	private handleStartGameClick = () => {
		this.props.socket?.emit(getGameEventName(GameEvent.RequestStart))
	}

	private handleDestroyGameClick = () => {
		this.setState({
			isGameDestroyDialogShown: true
		})
	}

	private handleDestroyGameDialogClose = () => this.setState({isGameDestroyDialogShown: false})

	private handleDestroyGame = () => {
		this.handleDestroyGameDialogClose()

		this.props.socket?.emit(getGameEventName(GameEvent.RequestDestroy))
	}

	private setupSocket(socket: SocketIOClient.Socket) {
		setGameEventHandler(socket, GameEvent.SetDeliberationTimer, (timer: number) => {

		})

		setGameEventHandler(socket, GameEvent.SetVoteTimer, (timer: number) => {

		})

		setGameEventHandler(socket, GameEvent.ShowVotes, (votes: number[]) => {
			this.setState({votes})
		})

		setGameEventHandler(socket, GameEvent.ShowOwnCard, (card: Card) => {
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

		setGameEventHandler(socket, GameEvent.UpdatePlayers, (userDetailsList: UserDetails[], playerId?: string) => {
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

		setGameEventHandler(socket, GameEvent.UpdateGameState, (gameState: GameState) => {
			console.debug('UpdateGameState', gameState)
			this.setState({
				gameState
			})
		})

		setGameEventHandler(socket, GameEvent.UpdateCardCount, (card: Card, count: number) => {
			console.debug('Card update', card, count)

			this.setCardCount(card, count)
		})

		setGameEventHandler(socket, GameEvent.UpdateAlphaWolfCard, (alphaWolfCard: AlphaWolfCards) => {
			this.setAlphaWolfCard(alphaWolfCard)
		})

		setGameEventHandler(socket, GameEvent.ValidationError, (validationResult: ValidationResult) => {
			console.warn('Validation error:', validationResult.description)
		})

		setGameEventHandler(socket, GameEvent.PhaseChange, (phase: GamePhase) => {
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

		setGameEventHandler(socket, GameEvent.ShowPlayersOtherRoles, (packet: ShowPlayersOtherRolesPacket) => {
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

		setGameEventHandler(socket, GameEvent.AnnounceNightRole, (nightRole: NightRoleOrderType) => {
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
		setGameEventHandler(socket, GameEvent.NightRoleAction, (playerRole: NightRoleOrderType, stageIndex: number, ...args: any) => {
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

		setGameEventHandler(socket, GameEvent.StartNightRoleAction, (playerRole: NightRoleOrderType, duration: number) => {
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
				case Card.VillageIdiot:
					break
			}
		})

		socket.emit(getGameEventName(GameEvent.PlayerReady))
	}

	private resetActions() {
		this.setState({
			clickablePlayers: [],
			clickableMiddleCards: [],
			cardClickBuffer: []
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
			}
		}
	}

	componentWillUnmount() {
		if (this.clockTimer) {
			clearInterval(this.clockTimer)
		}
	}

	render() {
		const {userDetailsList, gameState, clickablePlayers, clickableMiddleCards, votes, isGameDestroyDialogShown} = this.state

		return (
			<React.Fragment>
				<Dialog
					isOpen={isGameDestroyDialogShown}
					containerClassName={classes.destroyDialog}
				>
					<h2>Destroy game?</h2>

					<p>
						Are you sure you want to destroy this game?
					</p>

					<div className={classes.destroyDialogControls}>
						<button onClick={this.handleDestroyGame}>
							Yes
						</button>

						<button onClick={this.handleDestroyGameDialogClose}>
							No
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
									<span key={gameState.nightRole}>{GamePhaseNames[gameState.phase]}: {CardNames[gameState.nightRole]}</span>
								) : (
									<span key={gameState.phase}>{GamePhaseNames[gameState.phase]}</span>
								)}
							</RolloverTransition>
						</div>
					)}

					<div className={classes.clock} ref={this.clockElemRef}>
						{this.getClockString()}
					</div>
				</div>

				<GameStage isNight={gameState.phase === GamePhase.Night}>
					<CardCountList
						playerCount={userDetailsList.length}
						cardCountState={gameState.cardCountState}
						isShown={gameState.phase === GamePhase.Setup}
						onUpdateCardCount={this.handleCardCountUpdate}
						onUpdateAlphaWolfCardChange={this.handleAlphaWolfCardChange}
					/>

					<ActivityView
						isShown={gameState.phase > GamePhase.Setup}
						gameState={gameState}
						clickableCards={clickableMiddleCards}
						onCardClick={this.handleMiddleCardClick}
					/>

					<PlayerList
						userDetailsList={userDetailsList}
						clickableUsers={clickablePlayers}
						isShowingClickable={clickablePlayers.length > 0}
						areCardsVisible={gameState.phase > GamePhase.Setup}
						shownCards={gameState.deck}
						votes={votes}
						onCardClick={this.handleCardClick}
					/>
				</GameStage>
			</React.Fragment>
		)
	}
}
