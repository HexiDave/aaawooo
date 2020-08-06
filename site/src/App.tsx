import React from 'react'
import SocketContextProvider from './SocketContextProvider'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import LoginPage from './LoginPage'
import HomePage from './HomePage'
import ExperimentPage from './ExperimentPage'

const IS_EXPERIMENT_TIME = true

export default function App() {
	if (IS_EXPERIMENT_TIME)
		return <ExperimentPage/>

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
