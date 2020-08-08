import React from 'react'
import { Card, UserDetails } from '../../../common'
import classes from './PlayerItem.module.scss'
import CardView, { ClickableState } from './CardView'

interface PlayerItemProps {
	userDetails: UserDetails | null
	seatIndex: number
	clickableState: ClickableState
	shownCard: Card | null
	onCardClick: () => void
}

export default function PlayerItem({userDetails, seatIndex, clickableState, shownCard, onCardClick}: PlayerItemProps) {
	const displayName = userDetails?.displayName ?? `Player ${seatIndex + 1}`
	const avatarUrl = userDetails?.avatarURL ?? `https://cdn.discordapp.com/embed/avatars/${seatIndex % 5}.png`

	return (
		<li className={classes.root}>
			<div className={classes.displayName}>{displayName}</div>
			<picture className={classes.avatar}>
				<img
					src={avatarUrl}
					alt='avatar'
				/>
			</picture>
			<CardView
				card={shownCard}
				clickableState={clickableState}
				onClick={onCardClick}
			/>
		</li>
	)
}
