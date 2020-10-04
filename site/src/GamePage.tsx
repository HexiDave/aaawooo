import React, { useEffect, useState } from 'react'
import classes from './GamePage.module.scss'
import { ConnectionStage, useSocket } from './SocketContextProvider'
import InviteCodeDialog from './components/InviteCodeDialog'
import GameView from './components/GameView'
import Dialog from './components/Dialog'
import Loader from './components/Loader'

const SESSION_LOADER_KEY = 'hasLoaded'

export default function GamePage() {
	const shouldLoad = () => sessionStorage.getItem(SESSION_LOADER_KEY) === null

	const {connectionStage, socket, loginWithInviteCode} = useSocket()
	const [isLoading, setIsLoading] = useState(shouldLoad())

	useEffect(() => {
		if (shouldLoad()) {
			const loadingTimer = setTimeout(() => {
				setIsLoading(false)
				sessionStorage.setItem(SESSION_LOADER_KEY, '✔')
			}, 2000)

			return () => {
				clearTimeout(loadingTimer)
			}
		}
	}, [])

	return (
		<div className={classes.root}>
			<Loader isLoading={isLoading}/>

			<InviteCodeDialog
				isOpen={connectionStage === ConnectionStage.None || connectionStage === ConnectionStage.Connecting}
				connectionStage={connectionStage}
				onSendInviteCode={loginWithInviteCode}
			/>

			<Dialog isOpen={connectionStage === ConnectionStage.Reconnecting}>
				<h2>Reconnecting</h2>
			</Dialog>

			<GameView
				connectionStage={connectionStage}
				socket={socket}
			/>
		</div>
	)
}
