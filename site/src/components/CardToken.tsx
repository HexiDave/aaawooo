import React from 'react'
import clsx from 'clsx'
import { Card } from '../../../common'
import { CardNames } from '../cardNames'
import classes from './CardToken.module.scss'

interface CardTokenProps {
	card: Card
	count?: number
}

export default function CardToken({card, count = 1}: CardTokenProps) {
	return (
		<div className={clsx(classes.root, classes[`card-${card}`])}>
			<svg
				version="1.1"
				x="0px"
				y="0px"
				width="100%"
				height="100%"
				viewBox="0 0 300 300"
			>
				<defs>
					<path id="circlePath" d="M 150 150 m 0 120 a 120 120 0 0 1 0 -240 a 120 120 0 0 1 0 240"/>
				</defs>
				<g>
					<use xlinkHref="#circlePath" fill="none"/>
					<text fill="#000">
						<textPath xlinkHref="#circlePath" startOffset="50%" textAnchor="middle">
							{CardNames[card]}
						</textPath>
					</text>
				</g>
			</svg>
			{count > 1 && (
				<div className={classes.count}>
					x{count}
				</div>
			)}
		</div>
	)
}
