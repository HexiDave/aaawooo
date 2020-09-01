import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	AlphaWolfCardArray,
	AlphaWolfCards,
	Card,
	CardArray,
	CardCountState,
	getCardLimit,
	getCardSteps,
	Timer
} from '../../../common'
import CardCountView from './CardCountView'
import classes from './CardCountList.module.scss'
import clsx from 'clsx'
import { AlphaWolfCardNames } from '../cardNames'
import SimpleTransition, { BaseTransitionProps } from './SimpleTransition'

const CARD_UPDATE_DEBOUNCE = 200

interface CardCount {
	card: Card
	count: number
}

interface CardCountListProps extends BaseTransitionProps {
	playerCount: number
	cardCountState: CardCountState
	isLoneWolfEnabled: boolean
	onUpdateCardCount: (card: Card, count: number) => void
	onUpdateAlphaWolfCardChange: (card: AlphaWolfCards) => void
	onUpdateLoneWolfEnabled: (loneWolfEnabled: boolean) => void
}

export default function CardCountList({
	playerCount,
	cardCountState,
	isLoneWolfEnabled,
	isShown,
	onUpdateCardCount,
	onUpdateAlphaWolfCardChange,
	onUpdateLoneWolfEnabled
}: CardCountListProps) {
	const timerRef = useRef<Timer>()
	const cardCountRef = useRef<CardCount>()

	const [cardCounts, setCardCounts] = useState<CardCountState>(cardCountState)

	const mainDeckSize = useMemo(
		() => CardArray.reduce((total, card) => total + cardCounts[card], 0),
		[cardCounts])

	const requiredCardCount = playerCount + 3

	const hasAlphaWolf = cardCounts.alphaWolf === 1

	const sendCardUpdate = useCallback(() => {
		timerRef.current?.pause()

		const cardCount = cardCountRef.current
		if (!cardCount)
			return

		onUpdateCardCount(cardCount.card, cardCount.count)
		cardCountRef.current = undefined
	}, [onUpdateCardCount])

	const updateCardCount = (card: Card, count: number) => {
		if (card !== cardCountRef.current?.card) {
			// Send previous update
			sendCardUpdate()
		}

		// Update the values
		setCardCounts(s => ({
			...s,
			[card]: count
		}))

		cardCountRef.current = {card, count}
		timerRef.current?.start(CARD_UPDATE_DEBOUNCE)

		// Handle the alpha wolf card if zeroed out
		if (card === Card.AlphaWolf && count === 0) {
			updateAlphaWolfCard('none')
		}
	}

	const updateAlphaWolfCard = (alphaWolfCard: AlphaWolfCards) => {
		setCardCounts(s => ({
			...s,
			alphaWolfCard
		}))

		onUpdateAlphaWolfCardChange(alphaWolfCard)
	}

	const handleAlphaWolfCardClick = (card: Card) => () => {
		const alphaWolfCard = cardCountState.alphaWolfCard === card ? 'none' : card as AlphaWolfCards

		updateAlphaWolfCard(alphaWolfCard)
	}

	const handleIncrement = (card: Card) => () => {
		const nextCount = cardCounts[card] + getCardSteps(card)

		if (nextCount > getCardLimit(card))
			return

		updateCardCount(card, nextCount)
	}

	const handleDecrement = (card: Card) => () => {
		const nextCount = cardCounts[card] - getCardSteps(card)

		if (nextCount < 0)
			return

		updateCardCount(card, nextCount)
	}

	// Update the current counts if from a higher-order
	useEffect(() => {
		setCardCounts(cardCountState)
	}, [cardCountState])

	// Build the timer
	useEffect(() => {
		const timer = timerRef.current = new Timer(sendCardUpdate)

		return () => {
			timer.pause()
		}
	}, [sendCardUpdate])

	return (
		<SimpleTransition isShown={isShown} className={classes.root}>
			<div className={classes.details}>
				<div>Players: {playerCount}</div>
				<div>Required cards: {requiredCardCount}</div>
				<div>
					Deck size:
					{' '}
					<span
						className={clsx({
							[classes.low]: requiredCardCount > mainDeckSize,
							[classes.correct]: requiredCardCount === mainDeckSize,
							[classes.high]: mainDeckSize > requiredCardCount
						})}
					>
						{mainDeckSize}
					</span>
				</div>
				<div>
					Alpha wolf card
					<span
						className={clsx(classes.alphaWolf, {
							[classes.unused]: !hasAlphaWolf,
							[classes.high]: hasAlphaWolf && cardCounts.alphaWolfCard === 'none',
							[classes.correct]: hasAlphaWolf && cardCounts.alphaWolfCard !== 'none'
						})}
					>
						{AlphaWolfCardNames[cardCounts.alphaWolfCard]}
					</span>
				</div>
				<div>
					Lone Wolf:
					<button
						className={isLoneWolfEnabled ? undefined : classes.notEnabled}
						onClick={() => onUpdateLoneWolfEnabled(!isLoneWolfEnabled)}
					>
						{isLoneWolfEnabled ? 'Yes' : 'No'}
					</button>
				</div>
			</div>
			{CardArray.map(card => {
				const count = cardCounts[card]
				const isMaxed = count === getCardLimit(card)
				const canClick = hasAlphaWolf && AlphaWolfCardArray.includes(card as AlphaWolfCards)
				const isAlphaWolfClicked = cardCounts.alphaWolfCard === card

				return (
					<CardCountView
						key={card}
						card={card}
						count={count}
						isMaxed={isMaxed}
						isAlphaWolfClicked={isAlphaWolfClicked}
						onClick={canClick ? handleAlphaWolfCardClick(card) : undefined}
						onIncrement={handleIncrement(card)}
						onDecrement={handleDecrement(card)}
					/>
				)
			})}
		</SimpleTransition>
	)
}
