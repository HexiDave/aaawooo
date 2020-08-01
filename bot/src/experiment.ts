import SocketIOClient from 'socket.io-client'
import {
	Card,
	CardCountState,
	DefaultCardCountState,
	GameEvent,
	GamePhase,
	getGameEventName,
	HandshakeQuery,
	UserDetails
} from '../../common'
import { GameServerManager } from './GameServerManager'
import { sign } from './jwt'
import { werewolfRole } from './werewolf/roles/werewolf'
import { GameServer } from './werewolf/GameServer'

const cardCounts: CardCountState = {
	...DefaultCardCountState,
	werewolf: 2,
	villager: 1,
	seer: 1,
	robber: 1,
	insomniac: 1,
}

const delay = (delay: number) => new Promise<void>(res => setTimeout(res, delay))
/*
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
	gameServer
		.on(GameServer.PlayTrackSymbol, (trackName: string) => {
			console.log(`Playing track on server: ${trackName}`)
		})
		.on(GameServer.StopTrackSymbol, (trackName: string) => {
			console.log(`Stopping track on server: ${trackName}`)
		})

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

	await delay(1000)
	gameServer.tempInitCardCountState(cardCounts)

	await delay(1000)
	gameServer.tempStartSequence(werewolfRole(gameServer))

	// await delay(3000)
	// gameServer.startGame()
}
*/
