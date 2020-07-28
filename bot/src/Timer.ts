import { EventEmitter } from 'events'

export const TimerEventSymbol = Symbol()

export class Timer extends EventEmitter {
	private startTime: number
	private remainingTime: number
	private timerId: NodeJS.Timer

	private notify = () => {
		this.emit(TimerEventSymbol)
	}

	public start(delay: number) {
		this.remainingTime = delay
		this.resume()
	}

	public resume() {
		clearTimeout(this.timerId)
		this.startTime = Date.now()
		this.timerId = setTimeout(this.notify, this.remainingTime)
	}

	public pause() {
		clearTimeout(this.timerId)
		this.remainingTime -= Date.now() - this.startTime
	}
}
