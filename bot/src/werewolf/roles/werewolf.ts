import { GameServer } from '../GameServer'
import { RoleEventGenerator } from '../RoleEventFuncType'

const delay = (delay: number) => new Promise<void>(res => setTimeout(res, delay))

const playTrack = (gameServer: GameServer, trackName: string, trackTime: number, fallbackDelay: number) => {
	gameServer.playTrack(trackName)

	delay(trackTime).then(() => gameServer.onTrackFinished(trackName))

	return fallbackDelay
}

const dummyMessage = (message: string, delay: number) => {
	console.log(message)

	return delay
}

export function* werewolfRole(gameServer: GameServer): RoleEventGenerator {
	yield playTrack(gameServer, 'werewolf_wake_up', 5000, 10000)
	yield dummyMessage('~Waiting for 2 seconds~', 2000)
	yield playTrack(gameServer, 'werewolf_close_eyes', 3000, 1000)
	yield dummyMessage('Done werewolf role', 1000)

	return
}
