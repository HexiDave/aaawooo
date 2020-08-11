import React, { useCallback, useEffect, useRef, useState } from 'react'
import GameStage from './components/GameStage'
import PlayerList from './components/PlayerList'
import { AlphaWolfCards, Card, DefaultCardCountState, OptionalCard, Timer } from '../../common'
import cloneDeep from 'lodash/cloneDeep'
import CardCountList from './components/CardCountList'
import InviteCodeDialog from './components/InviteCodeDialog'
import { ConnectionStage } from './SocketContextProvider'
import Loader from './components/Loader'

const fakeUsers = Array.from({length: 8}).map(() => null)
const playerCards: OptionalCard[] = [
	Card.VillageIdiot,
	Card.DreamWolf,
	Card.Werewolf,
	Card.Villager,
	Card.Villager,
	Card.Insomniac,
	Card.ParanormalInvestigator,
	Card.Seer
]
const clickableUsers: number[] = [0, 3, 7]
const isShowingClickable = clickableUsers.length > 0
const validInviteCode = '111111'

export default function ExperimentPage() {
	const timerRef = useRef<Timer>()

	const [shownCards, setShownCards] = useState<OptionalCard[]>(fakeUsers.map(_ => null))
	const [isNight, setIsNight] = useState(false)
	const [canChangeCycle, setCanChangeCycle] = useState(true)
	const [cardCountState, setCardCountState] = useState(cloneDeep(DefaultCardCountState))
	const [connectionStage, setConnectionStage] = useState<ConnectionStage>(ConnectionStage.None)
	const [isLoading, setIsLoading] = useState(true)

	const handleCardClick = (index: number) => {
		setShownCards(s => ([
			...shownCards.slice(0, index),
			(s[index] === null ? playerCards[index] : null),
			...shownCards.slice(index + 1)
		]))
	}

	const handleClearClick = () => {
		setShownCards(fakeUsers.map(_ => null))
	}

	const handleToggleDayNight = () => {
		setIsNight(s => !s)
		setCanChangeCycle(false)
		timerRef.current?.start(10_000)
	}

	const handleCardCountUpdate = useCallback((card: Card, count: number) => {
		setCardCountState(s => {
			const newState = {
				...s,
				[card]: count
			}

			if (card === Card.AlphaWolf && count === 0) {
				newState.alphaWolfCard = 'none'
			}

			return newState
		})
	}, [])

	const handleAlphaWolfCardChange = useCallback((card: Card) => {
		setCardCountState(s => {
			const alphaWolfCard = s.alphaWolfCard === card ? 'none' : card

			return ({
				...s,
				alphaWolfCard: alphaWolfCard as AlphaWolfCards
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

	useEffect(() => {
		timerRef.current = new Timer(() => setCanChangeCycle(true))

		const loaderTimout = setTimeout(() => {
			setIsLoading(false)
		}, 5000)

		return () => {
			clearTimeout(loaderTimout)
		}
	}, [])

	const showStuff = false

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

	return (
		<GameStage isNight={isNight}>
			{showStuff && loaderAndInviteDialog}

			<div>
				<button onClick={handleClearClick}>
					Clear
				</button>
				<button onClick={handleToggleDayNight} disabled={!canChangeCycle}>
					{isNight ? 'Day' : 'Night'}
				</button>
			</div>

			<CardCountList
				playerCount={fakeUsers.length}
				cardCountState={cardCountState}
				onUpdateCardCount={handleCardCountUpdate}
				onUpdateAlphaWolfCardChange={handleAlphaWolfCardChange}
			/>

			<PlayerList
				userDetailsList={fakeUsers}
				clickableUsers={clickableUsers}
				isShowingClickable={isShowingClickable}
				shownCards={shownCards}
				onCardClick={handleCardClick}
			/>
		</GameStage>
	)
}
