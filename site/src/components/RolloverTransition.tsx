import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import classes from './RolloverTransition.module.scss'

interface RolloverTransitionProps extends React.PropsWithChildren<{}> {

}

export default function RolloverTransition({children}: RolloverTransitionProps) {
	const [firstRun, setFirstRun] = useState(true)
	const [childrenQueue, setChildrenQueue] = useState<React.ReactNode[]>([])
	const [childKey, setChildKey] = useState(0)

	useEffect(() => {
		setChildrenQueue(childrenQueue => {
			if (childrenQueue.length === 0) {
				return [children]
			}

			const prevChildren = childrenQueue[childrenQueue.length - 1]
			if (prevChildren === children)
				return childrenQueue

			if (typeof prevChildren === 'object' &&
				typeof children === 'object' &&
				(prevChildren as ReactElement)?.key === (children as ReactElement)?.key) {
				return childrenQueue
			}

			return [
				...childrenQueue,
				children
			]
		})
	}, [children])

	const handleTransitionEnd = useCallback(() => {
		setChildrenQueue(childrenQueue => {
			if (childrenQueue.length <= 1)
				return childrenQueue

			setChildKey(s => s + 1)

			return childrenQueue.slice(1)
		})
	}, [])

	const handleInitTransitionEnd = useCallback(() => {
		setFirstRun(false)

		handleTransitionEnd()
	}, [handleTransitionEnd])

	return (
		<div className={classes.root}>
			{(childrenQueue.length === 1 || firstRun) && (
				<span
					className={clsx(classes.item, {[classes.fadeIn]: firstRun})}
					onAnimationEnd={handleInitTransitionEnd}
				>
					{childrenQueue[0]}
				</span>
			)}

			{(childrenQueue.length > 1 && !firstRun) && (
				<React.Fragment>
					<span
						key={childKey}
						className={`${classes.item} ${classes.slideOut}`}
						onAnimationEnd={handleTransitionEnd}
					>
						{childrenQueue[0]}
					</span>

					<span
						className={`${classes.item} ${classes.slideIn}`}
					>
						{childrenQueue[1]}
					</span>
				</React.Fragment>
			)}
		</div>
	)
}
