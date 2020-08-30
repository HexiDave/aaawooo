import React from 'react'
import classes from './GamePage.module.scss'
import { ConnectionStage, useSocket } from './SocketContextProvider'
import InviteCodeDialog from './components/InviteCodeDialog'
import GameView from './components/GameView'
import Dialog from './components/Dialog'

export default function GamePage() {

	const {connectionStage, socket, loginWithInviteCode} = useSocket()

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

			<GameView
				connectionStage={connectionStage}
				socket={socket}
			/>
		</div>
	)
}
