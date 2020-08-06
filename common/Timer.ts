type TimerCallback = () => void

export class Timer {
	private startTime: number
	private remainingTime: number
	private timerId: number
	private readonly callback: TimerCallback

	constructor(callback: TimerCallback) {
		this.callback = callback
	}

	public start(delay: number) {
		this.remainingTime = delay
		this.resume()
	}

	public resume() {
		clearTimeout(this.timerId)
		this.startTime = Date.now()
		this.timerId = setTimeout(this.callback, this.remainingTime)
	}

	public pause() {
		clearTimeout(this.timerId)
		this.remainingTime -= Date.now() - this.startTime
	}
}
