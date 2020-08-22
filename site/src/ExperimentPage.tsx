import React, { useCallback, useEffect, useRef, useState } from 'react'
import GameStage from './components/GameStage'
import PlayerList from './components/PlayerList'
import {
	AlphaWolfCards,
	BasePlayer,
	buildDeckFromCardCountState,
	Card,
	CardCountState,
	DefaultCardCountState,
	DefaultGameState,
	GameState,
	OptionalCard,
	prepareDeckForGame,
	Timer
} from '../../common'
import cloneDeep from 'lodash/cloneDeep'
import CardCountList from './components/CardCountList'
import InviteCodeDialog from './components/InviteCodeDialog'
import { ConnectionStage } from './SocketContextProvider'
import Loader from './components/Loader'
import ActivityView from './components/ActivityView'
import classes from './ExperimentPage.module.scss'

const fakeUsers = Array.from({length: 8}).map(() => null)
const playerCards: OptionalCard[] = [
	Card.VillageIdiot,
	Card.DreamWolf,
	Card.Werewolf,
	Card.Villager,
	Card.Villager,
	Card.Insomniac,
	Card.Troublemaker,
	Card.Seer
]
const clickableUsers: number[] = [0, 3, 7]
const isShowingClickable = clickableUsers.length > 0
const validInviteCode = '111111'
const fakePlayer: BasePlayer = {
	userDetails: null,
	startingCard: Card.MysticWolf,
	history: []
}
const demoCardCounts: Partial<CardCountState> = {
	alphaWolfCard: Card.MysticWolf,
	villager: 3,
	insomniac: 1,
	werewolf: 2,
	mason: 2,
	robber: 1,
	seer: 1,
	alphaWolf: 1
}

const demoCardCountState = {
	...cloneDeep(DefaultCardCountState),
	...demoCardCounts
}

const demoDeck = (() => {
	const baseDeck = buildDeckFromCardCountState(demoCardCountState)

	return prepareDeckForGame(demoCardCountState, baseDeck)
})()

const demoGameState: GameState = {
	...cloneDeep(DefaultGameState),
	cardCountState: demoCardCountState,
	deck: demoDeck
}

const SHOW_LOADER_INVITE = false
const SHOW_PLAYER_LIST = true
const SHOW_CARD_COUNTS = true
const SHOW_TEST_CONTROLS = true
const SHOW_ACTIVITY_VIEW = true

export default function ExperimentPage() {
	const timerRef = useRef<Timer>()
	const clockElemRef = useRef<HTMLDivElement>(null)

	const [shownCards, setShownCards] = useState<OptionalCard[]>(fakeUsers.map(_ => null))
	const [isNight, setIsNight] = useState(false)
	const [canChangeCycle, setCanChangeCycle] = useState(true)
	const [gameState, setGameState] = useState(cloneDeep(demoGameState))
	const [connectionStage, setConnectionStage] = useState<ConnectionStage>(ConnectionStage.None)
	const [isLoading, setIsLoading] = useState(true)
	const [areCardsVisible, setAreCardsVisible] = useState(false)
	const [isCardCountVisible, setIsCardCountVisible] = useState(false)
	const [isActivityVisible, setIsActivityVisible] = useState(true)

	const handleCardClick = (index: number) => {
		setShownCards(s => ([
			...shownCards.slice(0, index),
			(s[index] === null ? playerCards[index] : null),
			...shownCards.slice(index + 1)
		]))
	}

	const handleClearClick = () => {
		setShownCards(fakeUsers.map(_ => null))
		setGameState(cloneDeep(demoGameState))
	}

	const handleToggleDayNight = () => {
		setIsNight(s => !s)
		setCanChangeCycle(false)
		timerRef.current?.start(10_000)
	}

	const handleCardCountUpdate = useCallback((card: Card, count: number) => {
		setGameState(s => {
			const newState: CardCountState = {
				...s.cardCountState,
				[card]: count
			}

			if (card === Card.AlphaWolf && count === 0) {
				newState.alphaWolfCard = 'none'
			}

			return {
				...s,
				cardCountState: newState
			}
		})
	}, [])

	const handleAlphaWolfCardChange = useCallback((card: Card) => {
		setGameState(s => {
			const {cardCountState} = s

			const alphaWolfCard = cardCountState.alphaWolfCard === card ? 'none' : card

			return ({
				...s,
				cardCountState: {
					...cardCountState,
					alphaWolfCard: alphaWolfCard as AlphaWolfCards
				}
			})
		})
	}, [])

	const handleInviteCode = (inviteCode: string) => {
		if (connectionStage === ConnectionStage.Connecting)
			return

		setConnectionStage(ConnectionStage.Connecting)

		setTimeout(() => {
			if (inviteCode === validInviteCode) {
				setConnectionStage(ConnectionStage.Success)
			} else {
				setConnectionStage(ConnectionStage.Error)
			}
		}, 1000)
	}

	const handleCreateDeck = () => {
		setGameState(s => {
			const {cardCountState} = s

			const baseDeck = buildDeckFromCardCountState(cardCountState)

			const deck = prepareDeckForGame(cardCountState, baseDeck)

			return {
				...s,
				deck
			}
		})
	}

	useEffect(() => {
		timerRef.current = new Timer(() => setCanChangeCycle(true))

		const loaderTimeout = setTimeout(() => {
			setIsLoading(false)
		}, 5000)

		const clockInterval = setInterval(() => {
			const clockElem = clockElemRef.current

			if (clockElem === null)
				return

			const now = new Date()

			clockElem.innerHTML = now.toLocaleTimeString()
		}, 500)

		return () => {
			clearTimeout(loaderTimeout)
			clearInterval(clockInterval)
		}
	}, [])

	const loaderAndInviteDialog = (
		<React.Fragment>
			{connectionStage !== ConnectionStage.Success && (
				<Loader
					isLoading={isLoading}
				/>
			)}

			<InviteCodeDialog
				isOpen={!isLoading && connectionStage !== ConnectionStage.Success}
				connectionStage={connectionStage}
				onSendInviteCode={handleInviteCode}
			/>
		</React.Fragment>
	)

	return null

	/*return (
		<div className={classes.root}>
			{SHOW_TEST_CONTROLS && (
				<div className={classes.controls}>
					<div>
						<button onClick={handleClearClick}>
							Clear
						</button>
						<button onClick={handleToggleDayNight} disabled={!canChangeCycle}>
							{isNight ? 'Day' : 'Night'}
						</button>
						<button onClick={() => setAreCardsVisible(s => !s)}>
							{areCardsVisible ? 'Hide cards' : 'Show cards'}
						</button>
						<button onClick={() => setIsCardCountVisible(s => !s)}>
							{isCardCountVisible ? 'Hide counts' : 'Show counts'}
						</button>
						<button onClick={() => setIsActivityVisible(s => !s)}>
							{isActivityVisible ? 'Hide activity' : 'Show activity'}
						</button>
						<button onClick={handleCreateDeck}>
							Create deck
						</button>
					</div>

					<div className={classes.clock} ref={clockElemRef}>
						4:00am
					</div>
				</div>
			)}
			<GameStage isNight={isNight}>
				{SHOW_LOADER_INVITE && loaderAndInviteDialog}

				{SHOW_CARD_COUNTS && (
					<CardCountList
						playerCount={fakeUsers.length}
						cardCountState={gameState.cardCountState}
						isShown={isCardCountVisible}
						onUpdateCardCount={handleCardCountUpdate}
						onUpdateAlphaWolfCardChange={handleAlphaWolfCardChange}
					/>
				)}

				{SHOW_ACTIVITY_VIEW && (
					<ActivityView
						isShown={!isCardCountVisible}
						/!*player={fakePlayer}*!/
						gameState={gameState}
					/>
				)}

				{SHOW_PLAYER_LIST && (
					<PlayerList
						userDetailsList={fakeUsers}
						clickableUsers={clickableUsers}
						isShowingClickable={isShowingClickable}
						areCardsVisible={areCardsVisible}
						shownCards={shownCards}
						onCardClick={handleCardClick}
					/>
				)}
			</GameStage>
		</div>
	)*/
}
