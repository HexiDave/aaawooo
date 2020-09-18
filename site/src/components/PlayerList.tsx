import React, { useMemo } from 'react'
import { OptionalCard } from '../../../common'
import clsx from 'clsx'
import classes from './PlayerList.module.scss'
import PlayerItem, { BasePlayerDisplayDetails, PlayerDisplayDetails } from './PlayerItem'
import { ClickableState } from './CardView'

interface PlayerListProps {
	playerDisplayDetails: BasePlayerDisplayDetails[]
	clickableUsers: number[]
	isShowingClickable: boolean
	areCardsVisible: boolean
	shownCards: OptionalCard[]
	onCardClick: (index: number) => void
	votes: number[]
	playersSpeaking: number[]
}

export default function PlayerList({
	playerDisplayDetails,
	clickableUsers,
	isShowingClickable,
	areCardsVisible,
	shownCards,
	votes,
	playersSpeaking,
	onCardClick
}: PlayerListProps) {
	const players = useMemo(
		() => playerDisplayDetails.map<PlayerDisplayDetails>((playerDetails, index) => ({
			...playerDetails,
			isSpeaking: playersSpeaking.includes(index)
		})),
		[playerDisplayDetails, playersSpeaking])

	return (
		<div
			className={clsx(classes.root, {
				[classes.hideCards]: !areCardsVisible
			})}
		>
			<ul className={classes.list}>
				{playerDisplayDetails.map((_, index) => {
					const clickableState = isShowingClickable
						? clickableUsers.includes(index)
							? ClickableState.Clickable
							: ClickableState.NotClickable
						: ClickableState.None

					const playerVotes = votes.reduce((prev, vote, seatIndex) => {
						// If the vote is for this player
						if (vote === index) {
							// Add the voting player's seat index
							return [
								...prev,
								seatIndex
							]
						}

						return prev
					}, [] as number[]).map(seatIndex => players[seatIndex])

					return (
						<PlayerItem
							key={index}
							player={players[index]}
							playerVotes={playerVotes}
							shownCard={shownCards[index]}
							isCardVisible={areCardsVisible}
							clickableState={clickableState}
							onCardClick={() => onCardClick(index)}
						/>
					)
				})}
			</ul>
		</div>
	)
}
