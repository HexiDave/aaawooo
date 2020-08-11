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

const CARD_UPDATE_DEBOUNCE = 200

interface CardCount {
	card: Card
	count: number
}

interface CardCountListProps {
	playerCount: number
	cardCountState: CardCountState
	onUpdateCardCount: (card: Card, count: number) => void
	onUpdateAlphaWolfCardChange: (card: Card) => void
}

export default function CardCountList({playerCount, cardCountState, onUpdateCardCount, onUpdateAlphaWolfCardChange}: CardCountListProps) {
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
		<div className={classes.root}>
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
					Alpha wolf card:
					{' '}
					<span
						className={clsx({
							[classes.unused]: !hasAlphaWolf,
							[classes.high]: hasAlphaWolf && cardCounts.alphaWolfCard === 'none',
							[classes.correct]: hasAlphaWolf && cardCounts.alphaWolfCard !== 'none'
						})}
					>
						{cardCounts.alphaWolfCard}
					</span>
				</div>
			</div>
			{CardArray.map(card => {
				const count = cardCounts[card]
				const isMaxed = count === getCardLimit(card)
				const canClick = hasAlphaWolf && AlphaWolfCardArray.includes(card as AlphaWolfCards)
				const isAlphaWolfClicked = cardCounts.alphaWolfCard === card
				const handleClick = () => onUpdateAlphaWolfCardChange(card)

				return (
					<CardCountView
						key={card}
						card={card}
						count={count}
						isMaxed={isMaxed}
						isAlphaWolfClicked={isAlphaWolfClicked}
						onClick={canClick ? handleClick : undefined}
						onIncrement={handleIncrement(card)}
						onDecrement={handleDecrement(card)}
					/>
				)
			})}
		</div>
	)
}