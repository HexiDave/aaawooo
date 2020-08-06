import React, { useState } from 'react'
import classes from './PlayerStage.module.scss'
import clsx from 'clsx'

enum StageAnimation {
	None,
	ToNight,
	ToDay
}

export default function PlayerStage() {
	const [stageAnimation, setStageAnimation] = useState(StageAnimation.None)

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
				<button onClick={() => setStageAnimation(StageAnimation.ToNight)}>
					Night
				</button>
				<button onClick={() => setStageAnimation(StageAnimation.ToDay)}>
					Day
				</button>
			</div>
		</div>
	)
}
