import React, { useEffect, useRef, useState } from 'react'
import GameStage from './components/GameStage'
import PlayerList from './components/PlayerList'
import { Card, OptionalCard, Timer } from '../../common'
import CardView, { ClickableState } from './components/CardView'

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

export default function ExperimentPage() {
	const timerRef = useRef<Timer>()

	const [shownCards, setShownCards] = useState<OptionalCard[]>(fakeUsers.map(_ => null))
	const [isNight, setIsNight] = useState(false)
	const [canChangeCycle, setCanChangeCycle] = useState(true)

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

	useEffect(() => {
		timerRef.current = new Timer(() => setCanChangeCycle(true))
	}, [])

	return (
		<GameStage isNight={isNight}>
			<button onClick={handleClearClick}>
				Clear
			</button>
			<button onClick={handleToggleDayNight} disabled={!canChangeCycle}>
				{isNight ? 'Day' : 'Night'}
			</button>

			<CardView
				clickableState={ClickableState.None}
				card={Card.Seer}
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
