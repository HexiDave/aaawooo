import React, { useMemo } from 'react'
import classes from './ActivityView.module.scss'
import SimpleTransition, { BaseTransitionProps } from './SimpleTransition'
import { CardArray, GameState } from '../../../common'
import CardToken from './CardToken'
import CardView, { ClickableState } from './CardView'

interface ActivityViewProps extends BaseTransitionProps {
	// player: BasePlayer
	gameState: GameState
	clickableCards: number[]
	onCardClick: (index: number) => void
}

export default function ActivityView({isShown, gameState, clickableCards, onCardClick}: ActivityViewProps) {
	const middleCards = useMemo(() => {
		const hasAlphaWolfCard = gameState.cardCountState.alphaWolfCard !== 'none'
		const start = -3 + (hasAlphaWolfCard ? -1 : 0)

		return gameState.deck.slice(start)
	}, [gameState])

	return (
		<SimpleTransition
			isShown={isShown}
			className={classes.root}
		>
			<div className={classes.playerDetailsContainer}>

			</div>

			<div className={classes.tokenContainer}>
				{CardArray.map(card => {
					const count = gameState.cardCountState[card] + (gameState.cardCountState.alphaWolfCard === card ? 1 : 0)

					if (count === 0)
						return null

					return <CardToken card={card} count={count} key={card}/>
				}).filter(e => e)}
			</div>

			<div className={classes.middleCardsContainer}>
				{middleCards.map((card, index) => {
					const clickableState = clickableCards.length === 0 ? ClickableState.None : clickableCards.includes(index) ? ClickableState.Clickable : ClickableState.NotClickable

					return (
						<CardView
							key={index}
							card={card}
							clickableState={clickableState}
							rootClassName={classes.cardRoot}
							onClick={() => onCardClick(index)}
						/>
					)
				})}
			</div>

			<div className={classes.buffer}>

			</div>
		</SimpleTransition>
	)
}
