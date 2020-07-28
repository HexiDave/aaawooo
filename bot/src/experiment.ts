import { Timer, TimerEventSymbol } from './Timer'
import { Snowflake } from 'discord.js'
import SocketIOClient from 'socket.io-client'
import {
	Card,
	CardCountState,
	DefaultCardCountState,
	GameEvent,
	GamePhase,
	getGameEventName,
	HandshakeQuery, UserDetails
} from '../../common'
import { GameServerManager, HandshakeQueryDetails } from './GameServerManager'
import { sign } from './jwt'

const cardCounts: CardCountState = {
	...DefaultCardCountState,
	werewolf: 2,
	villager: 1,
	seer: 1,
	robber: 1,
	insomniac: 1,
}

function doRoleEvent(name: string, delay: number) {
	console.log(`Doing role event [${name}], then a delay of ${delay}ms`)
	return delay
}

function* roleEventGenerator(): Generator<number, void, void> {
	yield doRoleEvent('Start event', 2000)
	yield doRoleEvent('Event 1', 1000)
	yield doRoleEvent('Event 2', 500)
	yield doRoleEvent('Final event', 0)

	return
}

export function runBasicExperiment() {
	const timer = new Timer()

	const iter = roleEventGenerator()
	timer.on(TimerEventSymbol, () => {
		const current = iter.next()

		if (current.done === false) {
			timer.start(current.value)
		} else {
			console.log('Done')
		}
	})

	const current = iter.next()
	if (current.done === false) {
		timer.start(current.value)
	}
}

const delay = (delay: number) => new Promise<void>(res => setTimeout(res, delay))

export async function gameServerExperiment(gameServerManager: GameServerManager, secret: string, port: number) {
	const userDetailsList: UserDetails[] = [
		'Player 1',
		'Player 2',
		'Player 3'
	].map(snowflake => ({
		displayName: snowflake,
		id: snowflake
	}))

	console.log('Setting up users...')

	const gameServer = gameServerManager.createGameServer()

	await delay(2000)

	gameServer.initializePlayers(userDetailsList)

	for (let userDetails of userDetailsList) {
		const handshakeQuery: HandshakeQueryDetails = {
			userDetails: userDetails,
			roomId: gameServer.roomId
		}

		const inviteToken = await sign(handshakeQuery, secret)

		const socket = SocketIOClient(`ws://localhost:${port}`, {
			query: {
				inviteToken
			} as HandshakeQuery
		})

		socket.on(getGameEventName(GameEvent.UpdatePlayers), (playersState: (UserDetails | null)[]) => {
			console.log(`Player [${userDetails.displayName}] got players state`, playersState)
		})

		socket.on(getGameEventName(GameEvent.PhaseChange), (phase: GamePhase) => {
			console.log('Game phase changed: ', phase)
		})

		socket.on(getGameEventName(GameEvent.ShowOwnCard), (card: Card) => {
			console.log('Your card currently is: ', card)
		})

		await delay(1000)
	}

	gameServer.startSetup()
	gameServer.tempInitCardCountState(cardCounts)

	await delay(3000)
	gameServer.startGame()
}
