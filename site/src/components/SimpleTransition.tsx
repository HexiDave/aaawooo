import React, { PropsWithChildren, useEffect, useState } from 'react'
import clsx from 'clsx'
import classes from './SimpleTransition.module.scss'

export interface BaseTransitionProps {
	isShown: boolean
}

interface SimpleTransitionProps extends BaseTransitionProps, PropsWithChildren<{}> {
	className?: string
}

export default function SimpleTransition({children, className, isShown}: SimpleTransitionProps) {
	const [isRendered, setIsRendered] = useState(isShown)

	useEffect(() => {
		if (isShown)
			setIsRendered(true)
	}, [isShown])

	const handleAnimationEnd = () => {
		if (!isShown)
			setIsRendered(false)
	}

	return isRendered ? (
		<div
			className={clsx(classes.root, className, {
				[classes.slideAndFadeIn]: isShown,
				[classes.slideAndFadeOut]: !isShown
			})}
			onAnimationEnd={handleAnimationEnd}
		>
			{children}
		</div>
	) : null
}
