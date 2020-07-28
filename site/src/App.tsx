import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'

export default function App() {
	const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null)

	useEffect(() => {
		const socket = io(`${process.env.REACT_APP_WS_ADDRESS}`)

		socket.on('connect', () => {
			console.log('Connected')
		})

		socket.on('message', (msg: string) => {
			console.log('Got message', msg)
		})

		setSocket(socket)

		return () => {
			socket.close()
		}
	}, [])

	return (
		<div>
			Testing
		</div>
	)
}
