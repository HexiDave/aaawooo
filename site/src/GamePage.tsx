import React, { useCallback, useEffect, useRef } from 'react'
import classes from './GamePage.module.scss'
import { ConnectionStage, useSocket } from './SocketContextProvider'
import { GameEvent, getGameEventName } from '../../common'
import InviteCodeDialog from './components/InviteCodeDialog'
import GameView from './components/GameView'
import Dialog from './components/Dialog'

export default function GamePage() {
	const clockElemRef = useRef<HTMLDivElement>(null)

	const {connectionStage, socket, loginWithInviteCode} = useSocket()

	const getClockString = () => {
		const now = new Date()

		return now.toLocaleTimeString()
	}

	const handleGameStartRequest = useCallback(() => {
		socket?.emit(getGameEventName(GameEvent.RequestStart))
	}, [socket])

	useEffect(() => {
		const clockInterval = setInterval(() => {
			const clockElem = clockElemRef.current

			if (clockElem === null)
				return

			clockElem.innerHTML = getClockString()
		}, 500)

		return () => {
			clearInterval(clockInterval)
		}
	}, [])

	return (
		<div className={classes.root}>
			<InviteCodeDialog
				isOpen={connectionStage === ConnectionStage.None || connectionStage === ConnectionStage.Connecting}
				connectionStage={connectionStage}
				onSendInviteCode={loginWithInviteCode}
			/>

			<Dialog isOpen={connectionStage === ConnectionStage.Reconnecting}>
				<h2>Reconnecting</h2>
			</Dialog>

			<div className={classes.controls}>
				<div>
					<button onClick={handleGameStartRequest}>
						Start game
					</button>
				</div>

				<div className={classes.clock} ref={clockElemRef}>
					{getClockString()}
				</div>
			</div>

			<GameView
				connectionStage={connectionStage}
				socket={socket}
			/>
		</div>
	)
}
