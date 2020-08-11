import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import { CommonMessage, getCommonMessageName, HandshakeQuery } from '../../common'
import io from "socket.io-client"

const WEREWOLF_REFRESH_CODE_KEY = 'werewolfRefreshCode'

export enum ConnectionStage {
	None,
	Connecting,
	Success,
	Error
}

export interface SocketContextState {
	socket: SocketIOClient.Socket | null
	connectionStage: ConnectionStage
	loginWithInviteCode: (inviteCode: string) => void
}

const SocketContext = createContext<SocketContextState>({
	connectionStage: ConnectionStage.None,
	socket: null,
	loginWithInviteCode: () => {
	}
})

export const useSocket = () => useContext(SocketContext)

export default function SocketContextProvider({children}: PropsWithChildren<{}>) {
	const [inviteCode, setInviteCode] = useState('')
	const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null)
	const [connectionStage, setConnectionStage] = useState(ConnectionStage.None)

	const loginWithInviteCode = useCallback((inviteCode: string) => {
		setInviteCode(inviteCode)
		setConnectionStage(ConnectionStage.Connecting)
	}, [])

	const setupSocket = (socket: SocketIOClient.Socket) => {
		socket.on('connect', () => {
			console.log('Connected')
		})

		socket.on('reconnect_attempt', () => {
			console.log('Reconnect attempted')
			const refreshCode = localStorage.getItem(WEREWOLF_REFRESH_CODE_KEY)
			socket.io.opts.query = {
				refreshCode
			} as HandshakeQuery
		})

		socket.on('reconnect', () => {
			console.log('Reconnected')
		})

		socket.on('message', (msg: string) => {
			console.log('Got message', msg)
		})

		socket.on('error', (msg: string) => {
			setConnectionStage(ConnectionStage.Error)
			console.error('Socket error', msg)
		})

		socket.on(getCommonMessageName(CommonMessage.RefreshCode), (refreshCode: string) => {
			console.log('Got refresh code', refreshCode)
			setConnectionStage(ConnectionStage.Success)
			localStorage.setItem(WEREWOLF_REFRESH_CODE_KEY, refreshCode)
		})

		socket.on('disconnect', () => {
			console.error('Disconnected')
			setConnectionStage(ConnectionStage.None)
		})

		setSocket(socket)
	}

	useEffect(() => {
		if (inviteCode.length !== 6 || connectionStage !== ConnectionStage.Connecting)
			return

		const socket = io(`${process.env.REACT_APP_WS_ADDRESS}`, {
			query: {
				inviteCode
			} as HandshakeQuery
		})

		setupSocket(socket)

		setInviteCode('')
	}, [inviteCode, connectionStage])

	useEffect(() => {
		if (socket !== null)
			return

		const refreshCode = localStorage.getItem(WEREWOLF_REFRESH_CODE_KEY)

		if (refreshCode !== null) {
			setConnectionStage(ConnectionStage.Connecting)
			const socket = io(`${process.env.REACT_APP_WS_ADDRESS}`, {
				query: {
					refreshCode
				} as HandshakeQuery
			})

			setupSocket(socket)
		}
	}, [socket])

	useEffect(() => {
		if (socket === null)
			return

		return () => {
			socket.removeAllListeners()
			socket.close()
		}
	}, [socket])

	return (
		<SocketContext.Provider
			value={{
				loginWithInviteCode,
				connectionStage,
				socket
			}}
		>
			{children}
		</SocketContext.Provider>
	)
}
