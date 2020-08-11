import React from 'react'
import clsx from 'clsx'
import { Card } from '../../../common'
import CardView, { CardSize, ClickableState, ClickMode, SelectionMode } from './CardView'
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
	return (
		<div className={classes.root}>
			<div className={classes.controlsCounter}>
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
			<CardView
				card={card}
				clickableState={
					onClick
						? isAlphaWolfClicked ? ClickableState.Clicked : ClickableState.Clickable
						: ClickableState.None
				}
				cardSize={CardSize.Medium}
				clickMode={ClickMode.Glow}
				selectionMode={count > 0 ? SelectionMode.Selected : SelectionMode.NotSelected}
				onClick={onClick}
			/>
		</div>
	)
}
