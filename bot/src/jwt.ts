import {
	GetPublicKeyOrSecret,
	Secret,
	sign as jwtSign,
	SignOptions,
	verify as jwtVerify,
	VerifyOptions
} from 'jsonwebtoken'

export async function sign(
	payload: string | Buffer | object,
	secretOrPrivateKey: Secret,
	options?: SignOptions) {
	return new Promise<string>((resolve, reject) => {
		jwtSign(payload, secretOrPrivateKey, options, (err, encoded) => {
			if (err) {
				reject(err)
			} else {
				resolve(encoded)
			}
		})
	})
}

export async function verify(
	token: string,
	secretOrPublicKey: Secret | GetPublicKeyOrSecret,
	options?: VerifyOptions) {
	return new Promise<object>((resolve, reject) => {
		jwtVerify(token, secretOrPublicKey, options, (err, decoded) => {
			if (err) {
				reject(err)
			} else {
				resolve(decoded)
			}
		})
	})
}
