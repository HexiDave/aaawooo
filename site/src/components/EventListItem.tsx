import React, { Fragment } from 'react'
import {
	BaseHistoryEvent, Card,
	GameHistoryEvent,
	GamePhase,
	HistoryEventType,
	isPlayerHistoryEvent,
	LookedAtCardsMeta,
	NightRoleOrderType,
	PlayerHistoryEvent,
	PlayersWokeUpTogetherMeta,
	StartedNightRoleMeta,
	StartedWithCardMeta,
	SwappedCardsMeta, VillageIdiotHappenedMeta
} from '../../../common'
import classes from './EventListItem.module.scss'
import { CardNames } from '../cardNames'
import { GamePhaseNames } from '../gamePhaseNames'
import clsx from 'clsx'
import { BasePlayerDisplayDetails, buildBasePlayerDisplayDetails } from './PlayerItem'

interface EventListItemProps {
	event: BaseHistoryEvent
	playerDisplayDetailsList: BasePlayerDisplayDetails[]
}

interface ImportantItemProps extends React.PropsWithChildren<{}> {
	className?: string
	color?: string
}

function ImportantItem({children, className, color}: ImportantItemProps) {
	const style = color === undefined ? {} : {color}

	return (
		<span className={clsx(classes.importantItemRoot, className)} style={style}>
			{children}
		</span>
	)
}

interface GameHistoryEventItemProps {
	event: GameHistoryEvent
}

function GameHistoryEventItem({event}: GameHistoryEventItemProps) {
	switch (event.type) {
		case HistoryEventType.PhaseChange:
			const phase = event.meta as GamePhase

			return <Fragment>
				<span>Phase started: </span>
				<ImportantItem className={classes.phaseColor}>
					{GamePhaseNames[phase]}
				</ImportantItem>
			</Fragment>
		case HistoryEventType.NightRoleChange:
			const role = event.meta as NightRoleOrderType

			return <Fragment>
				<span>Night role started: </span>
				<ImportantItem className={classes.roleColor}>
					{CardNames[role]}
				</ImportantItem>
			</Fragment>
		default:
			return null
	}
}

interface PlayerHistoryEventItemProps {
	event: PlayerHistoryEvent
	playerDisplayDetailsList: BasePlayerDisplayDetails[]
}

interface DeckItemProps {
	deckIndex: number
	playerDisplayDetailsList: BasePlayerDisplayDetails[]
}

function DeckItem({deckIndex, playerDisplayDetailsList}: DeckItemProps) {
	const playerCount = playerDisplayDetailsList.length

	if (deckIndex < playerCount) {
		const player = playerDisplayDetailsList[deckIndex]

		return <ImportantItem color={player.displayHexColor}>
			{`${player.displayName}'s`}
		</ImportantItem>
	} else {
		return <span>{`Middle card ${deckIndex - playerCount + 1}`}</span>
	}
}

function PlayerHistoryEventItem({event, playerDisplayDetailsList}: PlayerHistoryEventItemProps) {
	const playerDisplayDetails = buildBasePlayerDisplayDetails(event.userDetails, event.playerIndex)
	const playerView = (
		<ImportantItem color={playerDisplayDetails.displayHexColor}>
			{playerDisplayDetails.displayName}
		</ImportantItem>
	)

	switch (event.type) {
		case HistoryEventType.StartedWithCard: {
			const meta = event.meta as StartedWithCardMeta
			return <Fragment>
				{playerView}
				<span> started with </span>
				<ImportantItem className={classes.roleColor}>
					{CardNames[meta.card]}
				</ImportantItem>
			</Fragment>
		}
		case HistoryEventType.StartedNightRole: {
			const meta = event.meta as StartedNightRoleMeta

			return <Fragment>
				{playerView}
				<span> woke up as a </span>
				<ImportantItem className={classes.roleColor}>
					{CardNames[meta.role]}
				</ImportantItem>
			</Fragment>
		}
		case HistoryEventType.LookedAtCards: {
			const meta = event.meta as LookedAtCardsMeta

			return <Fragment>
				{playerView}
				<span> looked at these cards:</span>
				<ul>
					{meta.cards.map((card, index) => (
						<li key={index}>
							<span>
								<DeckItem
									deckIndex={meta.deckIndices[index]}
									playerDisplayDetailsList={playerDisplayDetailsList}
								/>
								{': '}
							</span>
							<ImportantItem className={classes.roleColor}>
								{CardNames[card]}
							</ImportantItem>
						</li>
					))}
				</ul>
			</Fragment>
		}
		case HistoryEventType.SwappedCards: {
			const meta = event.meta as SwappedCardsMeta

			return <Fragment>
				{playerView}
				<span> swapped these cards: </span>
				<ul>
					{meta.deckIndices.map((deckIndex, index) => (
						<li key={index}>
							<DeckItem
								deckIndex={deckIndex}
								playerDisplayDetailsList={playerDisplayDetailsList}
							/>
						</li>
					))}
				</ul>
			</Fragment>
		}
		case HistoryEventType.PlayersWokeUpTogether: {
			const meta = event.meta as PlayersWokeUpTogetherMeta

			return <Fragment>
				<span>Woke up together for </span>
				<ImportantItem className={classes.roleColor}>
					{CardNames[meta.role]}
				</ImportantItem>
				{':'}
				<ul>
					{meta.playerIndices.map(playerIndex => {
						const player = playerDisplayDetailsList[playerIndex]

						return (
							<li key={playerIndex}>
								<ImportantItem color={player.displayHexColor}>
									{player.displayName}
								</ImportantItem>
							</li>
						)
					})}
				</ul>
			</Fragment>
		}
		case HistoryEventType.VillageIdiotHappened: {
			const meta = event.meta as VillageIdiotHappenedMeta

			return <Fragment>
				<ImportantItem className={classes.roleColor}>
					{CardNames[Card.VillageIdiot]}
				</ImportantItem>
				<span> shifted the cards to the </span>
				<ImportantItem className={classes.vIdiotShiftColor}>
					{meta.shiftedLeft ? 'Left' : 'Right'}
				</ImportantItem>
			</Fragment>
		}
		default:
			return null
	}
}

export default function EventListItem({event, playerDisplayDetailsList}: EventListItemProps) {
	const isPlayerEvent = isPlayerHistoryEvent(event)

	const dateTime = new Date(event.timestamp)

	return (
		<div className={classes.root}>
			<div>
				{isPlayerEvent
					? <PlayerHistoryEventItem event={event as PlayerHistoryEvent}
											  playerDisplayDetailsList={playerDisplayDetailsList}/>
					: <GameHistoryEventItem event={event as GameHistoryEvent}/>
				}
			</div>
			<div
				className={classes.timestamp}
				title={dateTime.toLocaleString()}
			>
				{dateTime.toLocaleTimeString()}
			</div>
		</div>
	)
}
