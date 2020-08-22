import React from 'react'
import {
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
	cardClickBuffer: number[]
}

const DEFAULT_GAME_VIEW_STATE: GameViewState = {
	gameState: cloneDeep(DefaultGameState),
	playerId: '',
	userDetailsList: [],
	clickablePlayers: [],
	clickableMiddleCards: [],
	playerRole: null,
	cardClickBuffer: []
}

export default class GameView extends React.Component<GameViewProps, GameViewState> {
	public readonly state: GameViewState = cloneDeep(DEFAULT_GAME_VIEW_STATE)

	private clearDeck = () => {
		const {gameState} = this.state
		this.setState({
			gameState: {
				...gameState,
				deck: Array.from({length: getDeckSizeFromCardCountState(gameState.cardCountState)}).map(_ => null)
			}
		})
	}

	private setCardCountState = (card: Card, count: number) => {
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

	private handlePlayerCardClick = (index: number) => {
		const {playerRole, cardClickBuffer, clickablePlayers} = this.state

		if (playerRole === Card.Troublemaker) {
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
		} else if (playerRole === Card.Seer) {
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
		}

		this.sendCardClickAction(index)
	}

	private handleMiddleCardClick = (index: number) => {
		this.sendCardClickAction(index + this.state.userDetailsList.length)
	}

	private handleAlphaWolfCardChange = (card: Card) => {

	}

	private setupSocket(socket: SocketIOClient.Socket) {
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

			this.setCardCountState(card, count)
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

		setGameEventHandler(socket, GameEvent.AnnounceNightRole, (role: NightRoleOrderType) => {
			this.setState({
				clickablePlayers: [],
				clickableMiddleCards: [],
				playerRole: null,
				cardClickBuffer: []
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
				case Card.AlphaWolf:
					this.setOtherPlayersClickable()
					break
				case Card.MysticWolf:
					this.setOtherPlayersClickable()
					break
				case Card.Seer:
					this.setOtherPlayersClickable()
					this.setMiddleCardsClickable()
					break
				case Card.ApprenticeSeer:
					this.setMiddleCardsClickable()
					break
				case Card.Robber:
					this.setOtherPlayersClickable()
					break
				case Card.Witch:
					this.setMiddleCardsClickable()
					break
				case Card.Troublemaker:
					this.setOtherPlayersClickable()
					break
				case Card.VillageIdiot:
					break
				case Card.Drunk:
					this.setMiddleCardsClickable()
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

	}

	render() {
		const {userDetailsList, gameState, clickablePlayers, clickableMiddleCards} = this.state

		return (
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
					onCardClick={this.handlePlayerCardClick}
				/>
			</GameStage>
		)
	}
}
