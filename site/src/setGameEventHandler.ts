import { GameEvent, getGameEventName } from '../../common'

export function setGameEventHandler(socket: SocketIOClient.Socket, gameEvent: GameEvent, handler: (...args: any[]) => void) {
	socket.on(getGameEventName(gameEvent), handler)
}
