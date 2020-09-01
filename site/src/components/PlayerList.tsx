import React, { useMemo } from 'react'
import { OptionalCard, UserDetails } from '../../../common'
import clsx from 'clsx'
import classes from './PlayerList.module.scss'
import PlayerItem, { PlayerDisplayDetails } from './PlayerItem'
import { ClickableState } from './CardView'

interface PlayerListProps {
	userDetailsList: (UserDetails | null)[]
	clickableUsers: number[]
	isShowingClickable: boolean
	areCardsVisible: boolean
	shownCards: OptionalCard[]
	onCardClick: (index: number) => void
	votes: number[]
	playersSpeaking: number[]
}

export default function PlayerList({
	userDetailsList,
	clickableUsers,
	isShowingClickable,
	areCardsVisible,
	shownCards,
	votes,
	playersSpeaking,
	onCardClick
}: PlayerListProps) {
	const players = useMemo(
		() => userDetailsList.map<PlayerDisplayDetails>((userDetails, index) => ({
			displayName: userDetails?.displayName ?? `Player ${index + 1}`,
			avatarUrl: userDetails?.avatarURL ?? `https://cdn.discordapp.com/embed/avatars/${index % 5}.png`,
			displayHexColor: userDetails?.displayHexColor ?? '#fff',
			isSpeaking: playersSpeaking.includes(index)
		})),
		[userDetailsList, playersSpeaking])

	return (
		<div
			className={clsx(classes.root, {
				[classes.hideCards]: !areCardsVisible
			})}
		>
			<ul className={classes.list}>
				{userDetailsList.map((userDetails, index) => {
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
