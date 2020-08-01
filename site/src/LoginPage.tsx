import React, { useCallback, useEffect, useState } from 'react'
import { ConnectionStage, useSocket } from './SocketContextProvider'
import { useHistory } from 'react-router'

export default function LoginPage() {
	const [inviteCode, setInviteCode] = useState<string>('')
	const {connectionStage, loginWithInviteCode} = useSocket()
	const history = useHistory()

	const onInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInviteCode(e.target.value)
	}

	const onConnectClick = useCallback(() => {
		loginWithInviteCode(inviteCode)
	}, [inviteCode, loginWithInviteCode])

	useEffect(() => {
		if (connectionStage === ConnectionStage.Success) {
			history.push('/')
		}
	}, [connectionStage, history])


	return (
		<div>
			<input value={inviteCode} onChange={onInviteCodeChange}/>
			<hr/>
			<button
				disabled={inviteCode.length !== 6 || connectionStage !== ConnectionStage.None}
				onClick={onConnectClick}
			>
				Connect
			</button>
		</div>
	)
}
