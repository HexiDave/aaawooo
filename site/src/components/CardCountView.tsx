import React, { useState } from 'react'
import clsx from 'clsx'
import { Card } from '../../../common'
import CardView, { ActivationMode, CardSize, ClickableState, ClickMode } from './CardView'
import classes from './CardCountView.module.scss'

interface CardCountProps {
	card: Card
	count: number
	isMaxed: boolean
	isAlphaWolfClicked: boolean
	onClick?: () => void
	onIncrement: () => void
	onDecrement: () => void
}

export default function CardCountView({card, count, isMaxed, isAlphaWolfClicked, onClick, onIncrement, onDecrement}: CardCountProps) {
	const [isMouseOverCard, setIsMouseOverCard] = useState<boolean>(false)

	const isAlphaWolfCard = onClick !== undefined

	const handleMouseEnter = () => setIsMouseOverCard(true)

	const handleMouseLeave = () => setIsMouseOverCard(false)

	return (
		<div className={classes.root}>
			<div className={classes.controlsContainer}>
				<button
					onClick={onDecrement}
				>
					-
				</button>

				<div
					className={clsx(classes.count, {
						[classes.isMaxed]: isMaxed
					})}
				>
					{count}
				</div>

				<button
					onClick={onIncrement}
				>
					+
				</button>
			</div>
			<div
				className={clsx(classes.cardContainer, {
					[classes.isAlphaWolfCard]: isAlphaWolfCard,
					[classes.isAlphaWolfCardClicked]: isAlphaWolfClicked
				})}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<CardView
					card={card}
					clickableState={
						isAlphaWolfCard
							? isAlphaWolfClicked ? ClickableState.Clicked : ClickableState.Clickable
							: ClickableState.None
					}
					cardSize={CardSize.Mini}
					clickMode={ClickMode.Tagged}
					selectionMode={count > 0 ? ActivationMode.Activate : ActivationMode.Inactive}
					onClick={onClick}
				/>

				<div
					className={clsx(classes.tag, {
						[classes.tagIsShown]: isAlphaWolfCard
					})}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					onClick={onClick}
				>
					{
						isMouseOverCard
							? isAlphaWolfClicked ? 'Unselect' : 'Select'
							: isAlphaWolfClicked ? 'Selected' : 'Select'
					}
				</div>
			</div>
		</div>
	)
}
