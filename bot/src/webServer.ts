import express from 'express'
import http from 'http'
import SocketIO from 'socket.io'

interface WebServerResults {
	app: express.Express,
	server: http.Server,
	io: SocketIO.Server
}

export function createWebServer(port: number): WebServerResults {
	const app = express()
	const server = http.createServer(app)

	const io = SocketIO(server, {
		origins: '*:*'
	})

	server.listen(port, () => {
		console.log('Listening on port', port)
	})

	server.on('error', console.error)

	return {
		app,
		server,
		io
	}
}
