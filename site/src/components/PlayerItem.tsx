import React from 'react'
import { Card } from '../../../common'
import clsx from 'clsx'
import classes from './PlayerItem.module.scss'
import CardView, { ClickableState } from './CardView'

export interface PlayerDisplayDetails {
	displayName: string
	displayHexColor: string
	avatarUrl: string
	isSpeaking: boolean
}

interface PlayerItemProps {
	player: PlayerDisplayDetails
	playerVotes: PlayerDisplayDetails[]
	clickableState: ClickableState
	isCardVisible: boolean
	shownCard: Card | null
	onCardClick: () => void
}

export default function PlayerItem({player, playerVotes, clickableState, isCardVisible, shownCard, onCardClick}: PlayerItemProps) {
	const {avatarUrl, displayName} = player

	return (
		<li className={classes.root}>
			<div
				className={clsx(classes.playerRoot, {
					[classes.hidePlayer]: !isCardVisible
				})}
			>
				<div
					className={clsx(classes.playerVotesRoot, {[classes.showVotes]: playerVotes.length > 0})}
				>
					{playerVotes.map(playerThatVoted => (
						<div
							key={playerThatVoted.displayName}
							className={classes.playerVote}
						>
							<div
								className={classes.playerContainer}
							>
								<img
									src={playerThatVoted.avatarUrl}
									className={classes.voteAvatar}
									alt='avatar'
								/>
								<span
									className={classes.voteDisplayName}
									style={{
										color: playerThatVoted.displayHexColor
									}}
								>
									{playerThatVoted.displayName}
								</span>
							</div>
						</div>
					))}
				</div>
				<div
					className={classes.displayName}
					style={{
						color: player.displayHexColor
					}}
				>
					{displayName}
				</div>
				<picture className={classes.avatar}>
					<img
						className={player.isSpeaking ? classes.isSpeaking : undefined}
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
