import React, { useCallback, useEffect, useRef, useState } from 'react'
import { OptionalCard } from '../../../common'
import clsx from 'clsx'
import classes from './CardView.module.scss'

export enum ClickableState {
	None,
	Clickable,
	NotClickable
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
	onClick?: () => void
}

export default function CardView({card, clickableState, onClick}: CardViewProps) {
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
		if (clickableState !== ClickableState.Clickable || flipState !== FlipState.None)
			return

		if (onClick) {
			onClick()
		}
	}, [clickableState, flipState, onClick])

	const cardClass = faceCard !== null ? classes[faceCard] : undefined

	return (
		<div
			className={clsx(classes.root, cardClass, {
				[classes.canClick]: clickableState === ClickableState.Clickable,
				[classes.cannotClick]: clickableState === ClickableState.NotClickable,
				[classes.faceCard]: faceCard !== null,
				[classes.flipping]: flipState !== FlipState.None,
				[classes.flipIn]: flipState === FlipState.FlipIn,
				[classes.flipOut]: flipState === FlipState.FlipOut
			})}
			onClick={onCardClick}
		/>
	)
}
