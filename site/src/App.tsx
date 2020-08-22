import React from 'react'
import SocketContextProvider from './SocketContextProvider'
import GamePage from './GamePage'

export default function App() {
	return (
		<SocketContextProvider>
			<GamePage/>
		</SocketContextProvider>
	)
}
