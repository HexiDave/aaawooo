import React, { useCallback, useEffect, useRef, useState } from 'react'
import { OptionalCard } from '../../../common'
import clsx from 'clsx'
import classes from './CardView.module.scss'
import { CardNames } from '../cardNames'

export enum ClickableState {
	None = 0,
	Clickable = (1 << 0),
	Clicked = (1 << 1),
	NotClickable = (1 << 2),
	CanClickFlag = (ClickableState.Clickable | ClickableState.Clicked)
}

export enum ClickMode {
	Normal,
	Tagged
}

export enum CardSize {
	Mini,
	Normal
}

export enum ActiveMode {
	None,
	Activate,
	Inactive
}

enum FlipState {
	None,
	FlipIn,
	FlipOut
}

const FLIP_TIMEOUT = 200

interface CardViewProps {
	card: OptionalCard
	clickableState: ClickableState
	rootClassName?: string
	onClick?: () => void
	cardSize?: CardSize
	clickMode?: ClickMode
	activeMode?: ActiveMode
}

export default function CardView({
	card,
	clickableState,
	rootClassName,
	onClick,
	cardSize = CardSize.Normal,
	clickMode = ClickMode.Normal,
	activeMode = ActiveMode.None
}: CardViewProps) {
	const cachedCardRef = useRef<OptionalCard>(card)
	const [flipState, setFlipState] = useState<FlipState>(FlipState.None)
	const [faceCard, setFaceCard] = useState<OptionalCard>(card)

	useEffect(() => {
		const cachedCard = cachedCardRef.current

		if (card !== cachedCard) {
			cachedCardRef.current = card
			setFlipState(FlipState.FlipIn)
		}
	}, [card])

	useEffect(() => {
		let timer: NodeJS.Timeout

		if (flipState === FlipState.FlipIn) {
			timer = setTimeout(() => {
				setFlipState(FlipState.FlipOut)
				setFaceCard(s => s === null ? cachedCardRef.current : null)
			}, FLIP_TIMEOUT)
		} else if (flipState === FlipState.FlipOut) {
			timer = setTimeout(() => {
				setFlipState(FlipState.None)
			}, FLIP_TIMEOUT)
		}

		return () => {
			clearTimeout(timer)
		}
	}, [flipState])

	const onCardClick = useCallback(() => {
		if ((clickableState & ClickableState.CanClickFlag) === 0 || flipState !== FlipState.None)
			return

		if (onClick) {
			onClick()
		}
	}, [clickableState, flipState, onClick])

	const cardClass = faceCard !== null ? classes[faceCard] : undefined

	return (
		<div
			className={clsx(classes.root, cardClass, rootClassName, {
				[classes.mini]: cardSize === CardSize.Mini,
				[classes.flipping]: flipState !== FlipState.None,
				[classes.flipIn]: flipState === FlipState.FlipIn,
				[classes.flipOut]: flipState === FlipState.FlipOut,
				[classes.active]: activeMode === ActiveMode.Activate,
				[classes.inactive]: activeMode === ActiveMode.Inactive,
			})}
		>
			<div
				className={clsx(classes.cardFace, {
					[classes.faceCard]: faceCard !== null,
					[classes.canClick]: clickMode === ClickMode.Normal && clickableState === ClickableState.Clickable,
					[classes.cannotClick]: clickMode === ClickMode.Normal && clickableState === ClickableState.NotClickable,
				})}
				onClick={onCardClick}
			/>

			<div
				className={clsx({
					[classes.cardText]: faceCard !== null
				})}
			>
				{faceCard && CardNames[faceCard]}
			</div>
		</div>
	)
}
