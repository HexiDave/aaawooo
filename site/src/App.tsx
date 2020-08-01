import React from 'react'
import SocketContextProvider from './SocketContextProvider'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import LoginPage from './LoginPage'
import HomePage from './HomePage'

export default function App() {
	return (
		<SocketContextProvider>
			<BrowserRouter>
				<Switch>
					<Route path='/login'>
						<LoginPage/>
					</Route>
					<Route path='/'>
						<HomePage />
					</Route>
				</Switch>
			</BrowserRouter>
		</SocketContextProvider>
	)
}
