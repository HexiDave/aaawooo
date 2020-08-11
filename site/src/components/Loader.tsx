import React from 'react'
import clsx from 'clsx'
import classes from './Loader.module.scss'

interface LoaderProps {
	isLoading: boolean
}

export default function Loader({isLoading}: LoaderProps) {
	return (
		<div
			className={clsx(classes.root, {
				[classes.fadeOut]: !isLoading
			})}
		>
			<h1>Loading...</h1>
			<div className={classes.spinner}/>
		</div>
	)
}
