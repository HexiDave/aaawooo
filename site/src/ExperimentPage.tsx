import React, { useState } from 'react'
import GameStage from './components/GameStage'
import PlayerList from './components/PlayerList'
import { Card, OptionalCard } from '../../common'
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
	const [shownCards, setShownCards] = useState<OptionalCard[]>(fakeUsers.map(_ => null))

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

	return (
		<GameStage isNight={false}>
			<button onClick={handleClearClick}>
				Clear
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
