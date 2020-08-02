import { Redis } from 'ioredis'

export enum ExpireMode {
	Seconds = 'EX',
	Milliseconds = 'PX'
}

export enum SetMode {
	SetIfNotExist = 'NX',
	SetOnlyIfExist = 'XX'
}

export default class RedisWrapper<T> {
	private readonly redis: Redis
	private readonly prefix: string

	public constructor(redis: Redis, prefix: string = '') {
		this.redis = redis
		this.prefix = prefix
	}

	public async get(key: string): Promise<T | null> {
		const data = await this.redis.get(this.prefix + key)

		if (data === null)
			return null

		return JSON.parse(data) as T
	}

	public async set(key: string, data: T): Promise<boolean> {
		const raw = JSON.stringify(data)

		const result = await this.redis.set(this.prefix + key, raw)

		return result === 'OK'
	}

	public async setWithExpiration(key: string, data: T, ttl: number): Promise<boolean> {
		const raw = JSON.stringify(data)

		const result = await this.redis.set(this.prefix + key, raw, 'EX', ttl)

		return result === 'OK'
	}

	public async delete(key: string) {
		return this.redis.del(this.prefix + key)
	}

	public async has(key: string) {
		return this.redis.exists(this.prefix + key)
	}

	public async getKeys() {
		return new Promise<string[]>(async resolve => {
			const scannedKeys: string[] = []
			const prefixLength = this.prefix.length

			const stream = this.redis.scanStream({
				match: this.prefix + '*'
			})

			stream.on('data', (keys: string[]) => {
				const cleanKeys = keys.map(k => k.slice(prefixLength))
				scannedKeys.push(...cleanKeys)
			})

			stream.on('end', () => {
				resolve(scannedKeys)
			})
		})
	}
}
