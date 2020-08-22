import React from 'react'
import { Card, UserDetails } from '../../../common'
import clsx from 'clsx'
import classes from './PlayerItem.module.scss'
import CardView, { ClickableState } from './CardView'

interface PlayerItemProps {
	userDetails: UserDetails | null
	seatIndex: number
	clickableState: ClickableState
	isCardVisible: boolean
	shownCard: Card | null
	onCardClick: () => void
}

export default function PlayerItem({userDetails, seatIndex, clickableState, isCardVisible, shownCard, onCardClick}: PlayerItemProps) {
	const displayName = userDetails?.displayName ?? `Player ${seatIndex + 1}`
	const avatarUrl = userDetails?.avatarURL ?? `https://cdn.discordapp.com/embed/avatars/${seatIndex % 5}.png`

	return (
		<li className={classes.root}>
			<div
				className={clsx(classes.playerRoot, {
					[classes.hidePlayer]: !isCardVisible
				})}
			>
				<div className={classes.displayName}>{displayName}</div>
				<picture className={classes.avatar}>
					<img
						src={avatarUrl}
						alt='avatar'
					/>
				</picture>
			</div>
			<div
				className={clsx(classes.cardRoot, {
					[classes.hideCard]: !isCardVisible
				})}
			>
				<CardView
					card={shownCard}
					clickableState={clickableState}
					onClick={onCardClick}
				/>
			</div>
			<div className={classes.floorLight}/>
		</li>
	)
}
