import { GameEventType, getGameEventName } from '../../common'

export function setGameEventHandler(socket: SocketIOClient.Socket, gameEvent: GameEventType, handler: (...args: any[]) => void) {
	socket.on(getGameEventName(gameEvent), handler)
}
