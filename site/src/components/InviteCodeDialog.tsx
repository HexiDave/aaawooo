import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Key } from 'ts-keycode-enum'
import Dialog, { BaseDialogProps } from './Dialog'
import { ConnectionStage } from '../SocketContextProvider'
import classes from './InviteCodeDialog.module.scss'

interface InviteCodeDialogProps extends BaseDialogProps {
	connectionStage: ConnectionStage
	onSendInviteCode: (inviteCode: string) => void
}

export default function InviteCodeDialog({connectionStage, onSendInviteCode, ...dialogProps}: InviteCodeDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null)

	const [inviteCode, setInviteCode] = useState('')

	const cannotSendInviteCode = useMemo(
		() => inviteCode.length !== 6 || connectionStage === ConnectionStage.Connecting,
		[inviteCode, connectionStage]
	)

	const disabledInput = cannotSendInviteCode || !dialogProps.isOpen

	const handleSendInviteCode = useCallback(() => {
		if (cannotSendInviteCode)
			return

		onSendInviteCode(inviteCode)
	}, [inviteCode, cannotSendInviteCode, onSendInviteCode])

	const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInviteCode(e.target.value)
	}

	const handleInviteCodeInputKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.keyCode === Key.Enter) {
			handleSendInviteCode()
		}
	}, [handleSendInviteCode])

	useEffect(() => {
		if (dialogProps.isOpen) {
			inputRef.current?.focus()
		}
	}, [dialogProps.isOpen])

	useEffect(() => {
		if (connectionStage === ConnectionStage.Error) {
			const inputElem = inputRef.current
			if (inputElem) {
				inputElem.focus()
				inputElem.select()
			}
		}
	}, [connectionStage])

	return (
		<Dialog
			{...dialogProps}
			containerClassName={classes.root}
		>
			<h2>Invite Code</h2>

			<input
				value={inviteCode}
				ref={inputRef}
				maxLength={6}
				disabled={connectionStage === ConnectionStage.Connecting || connectionStage === ConnectionStage.Success}
				onChange={handleInviteCodeChange}
				onKeyUp={handleInviteCodeInputKeyUp}
			/>

			{connectionStage === ConnectionStage.Error && (
				<div
					className={classes.error}
				>
					Failed to connect. Try again.
				</div>
			)}

			<button
				disabled={disabledInput}
				onClick={handleSendInviteCode}
			>
				Send
			</button>
		</Dialog>
	)
}
