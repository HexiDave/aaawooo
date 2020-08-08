import React from 'react'
import { OptionalCard, UserDetails } from '../../../common'
import classes from './PlayerList.module.scss'
import PlayerItem from './PlayerItem'
import { ClickableState } from './CardView'

interface PlayerListProps {
	userDetailsList: (UserDetails | null)[]
	clickableUsers: number[]
	isShowingClickable: boolean
	shownCards: OptionalCard[]
	onCardClick: (index: number) => void
}

export default function PlayerList({userDetailsList, clickableUsers, isShowingClickable, shownCards, onCardClick}: PlayerListProps) {
	return (
		<div className={classes.root}>
			<ul className={classes.list}>
				{userDetailsList.map((userDetails, index) => {
					const clickableState = isShowingClickable
						? clickableUsers.includes(index)
							? ClickableState.Clickable
							: ClickableState.NotClickable
						: ClickableState.None

					return (
						<PlayerItem
							key={index}
							userDetails={userDetails}
							seatIndex={index}
							shownCard={shownCards[index]}
							clickableState={clickableState}
							onCardClick={() => onCardClick(index)}
						/>
					)
				})}
			</ul>
		</div>
	)
}
