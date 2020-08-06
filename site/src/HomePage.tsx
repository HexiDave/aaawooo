import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ConnectionStage, useSocket } from './SocketContextProvider'
import { useHistory } from 'react-router'
import {
	Card,
	CardArray,
	CardCountLimit,
	DefaultGameState,
	GameEvent,
	GamePhase,
	GameState,
	getGameEventName, ShowPlayersOtherRolesPacket,
	Timer,
	UserDetails,
	ValidationResult
} from '../../common'
import { setGameEventHandler } from './setGameEventHandler'
import classes from './HomePage.module.scss'
import cloneDeep from 'lodash/cloneDeep'

const CARD_UPDATE_DEBOUNCE = 200

function UserItem({userDetails: {displayName, avatarURL}}: { userDetails: UserDetails }) {
	return (
		<li>
			<img src={avatarURL} alt='avatar' width={128}/>
			<div>{displayName}</div>
		</li>
	)
}

interface CardCount {
	card: Card
	count: number
}

export default function HomePage() {
	const {connectionStage, socket} = useSocket()

	const timerRef = useRef<Timer>()
	const cardCountRef = useRef<CardCount>()

	const [userDetails, setUserDetails] = useState<UserDetails[]>([])
	const [gameState, setGameState] = useState<GameState>(cloneDeep(DefaultGameState))
	const history = useHistory()

	const sendCardUpdate = useCallback(() => {
		timerRef.current?.pause()

		const cardCount = cardCountRef.current
		if (!cardCount || !socket)
			return

		socket.emit(getGameEventName(GameEvent.UpdateCardCount), cardCount.card, cardCount.count)
	}, [socket])

	const sendGameStartRequest = useCallback(() => {
		if (!socket)
			return

		socket.emit(getGameEventName(GameEvent.RequestStart))
	}, [socket])

	useEffect(() => {
		if (socket === null && connectionStage === ConnectionStage.None) {
			history.push('/login')
		}
	}, [history, connectionStage, socket])

	useEffect(() => {
		const timer = timerRef.current = new Timer(sendCardUpdate)

		return () => {
			timer.pause()
		}
	}, [sendCardUpdate])

	useEffect(() => {
		if (socket === null)
			return

		setGameEventHandler(socket, GameEvent.UpdatePlayers, (userDetails: UserDetails[]) => {
			console.log('UpdatePlayers', userDetails)
			setUserDetails(userDetails)
		})

		setGameEventHandler(socket, GameEvent.UpdateGameState, (gameState: GameState) => {
			console.log('UpdateGameState', gameState)
			setGameState(gameState)
		})

		setGameEventHandler(socket, GameEvent.UpdateCardCount, (card: Card, count: number) => {
			console.log('Card update', card, count)

			timerRef.current?.pause()

			setCardCountState(card, count)
		})

		setGameEventHandler(socket, GameEvent.ValidationError, (validationResult: ValidationResult) => {
			console.warn('Validation error:', validationResult.description)
		})

		setGameEventHandler(socket, GameEvent.PhaseChange, (phase: GamePhase) => {
			setGameState(s => ({
				...s,
				phase
			}))
		})

		setGameEventHandler(socket, GameEvent.ShowPlayersOtherRoles, (packet: ShowPlayersOtherRolesPacket) => {
			console.log('Received ShowPlayersOtherRolesPacket', packet)
		})

		socket.emit(getGameEventName(GameEvent.PlayerReady))

		return () => {
			socket.removeAllListeners()
		}
	}, [socket])

	const setCardCountState = (card: Card, count: number) => {
		setGameState(s => ({
			...s,
			cardCountState: {
				...s.cardCountState,
				[card]: count
			}
		}))
	}

	const updateCardCount = (card: Card, count: number) => {
		if (card !== cardCountRef.current?.card) {
			// Send previous update
			sendCardUpdate()
		}

		setCardCountState(card, count)
		cardCountRef.current = {card, count}
		timerRef.current?.start(CARD_UPDATE_DEBOUNCE)
	}

	const incrementCardCountClick = (card: Card) => () => {
		const cardCount = gameState.cardCountState[card] + 1

		const cardCountLimit = CardCountLimit[card] || 1
		if (cardCount > cardCountLimit)
			return

		updateCardCount(card, cardCount)
	}

	const decrementCardCountClick = (card: Card) => () => {
		const cardCount = gameState.cardCountState[card] - 1

		if (cardCount < 0)
			return

		updateCardCount(card, cardCount)
	}

	const emptySeats = userDetails.reduce((t, u) => t + (u === null ? 1 : 0), 0)

	return (
		<main className={classes.root}>
			Logged in
			<hr/>

			<div className={classes.container}>
				<div className={classes.column}>
					{emptySeats > 0 && <div>With {emptySeats} empty seats.</div>}
					<ul>
						{userDetails.map((u, index) => (
							<UserItem
								key={index}
								userDetails={u ?? {
									avatarURL: `https://cdn.discordapp.com/embed/avatars/${index % 5}.png`,
									displayName: `User Seat ${index + 1}`
								}}
							/>
						))}
					</ul>
				</div>

				{gameState.phase === GamePhase.Setup && (
					<div className={classes.column}>
						Card counts
						<ul>
							{CardArray
								.filter(card => typeof gameState.cardCountState[card] === 'number')
								.map(card => (
									<li key={card}>
										<div>{card}</div>
										<div>
											<button onClick={decrementCardCountClick(card)}>
												-
											</button>
											{gameState.cardCountState[card]}
											<button onClick={incrementCardCountClick(card)}>
												+
											</button>
										</div>
									</li>
								))
							}
						</ul>

						<button onClick={sendGameStartRequest}>
							Start game
						</button>
					</div>
				)}
			</div>
		</main>
	)
}
