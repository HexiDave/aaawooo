import React, { useEffect, useRef, useState } from 'react'
import classes from './GameStage.module.scss'
import clsx from 'clsx'

enum StageAnimation {
	None,
	ToNight,
	ToDay
}

interface GameStageProps extends React.PropsWithChildren<{}>{
	isNight: boolean
}

export default function GameStage({isNight, children}: GameStageProps) {
	const currentIsNightRef = useRef(isNight)
	const [stageAnimation, setStageAnimation] = useState(StageAnimation.None)

	useEffect(() => {
		const currentIsNight = currentIsNightRef.current
		if (isNight !== currentIsNight) {
			setStageAnimation(isNight ? StageAnimation.ToNight : StageAnimation.ToDay)
			currentIsNightRef.current = isNight
		}
	}, [isNight])

	return (
		<div
			className={clsx(classes.root, {
				[classes.toDay]: stageAnimation === StageAnimation.ToDay,
				[classes.toNight]: stageAnimation === StageAnimation.ToNight
			})}
		>
			<div
				className={clsx(classes.sky, {
					[classes.skyToNight]: stageAnimation === StageAnimation.ToNight,
					[classes.skyToDay]: stageAnimation === StageAnimation.ToDay
				})}
			/>
			<div className={classes.landscape}/>
			<div className={classes.wall}/>
			<div
				className={clsx(classes.orbitContainer, {
					[classes.rotateToDay]: stageAnimation === StageAnimation.ToDay,
					[classes.rotateToNight]: stageAnimation === StageAnimation.ToNight
				})}
			>
				<div className={classes.sun}/>
				<div className={classes.moon}/>
			</div>
			<div className={classes.container}>
				{children}
			</div>
		</div>
	)
}
