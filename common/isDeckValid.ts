import { CardArray } from './Card'
import { CardBound, isCardCountValid } from './CardCountState'
import { GameState } from './GameState'

export enum ValidationReasonType {
	CardCountInvalid,
	AlphaWolfCardMissing,
	PlayerCountInvalid
}

export interface ValidationResult {
	reason: ValidationReasonType
	description: string
	meta?: any
}

export function isDeckValid(gameState: GameState, playerCount: number): ValidationResult | null {
	const {cardCountState, deck} = gameState

	// Validate card counts
	for (let card of CardArray) {
		const cardBounds = isCardCountValid(cardCountState, card)

		switch (cardBounds) {
			case CardBound.Low:
				return {
					reason: ValidationReasonType.CardCountInvalid,
					description: 'Too few selected',
					meta: card
				}
			case CardBound.High:
				return {
					reason: ValidationReasonType.CardCountInvalid,
					description: 'Too many selected',
					meta: card
				}
		}
	}

	// Validate alpha wolf selection
	if (cardCountState.alphaWolf > 0) {
		if (cardCountState.alphaWolfCard === 'none') {
			return {
				reason: ValidationReasonType.AlphaWolfCardMissing,
				description: 'The Alpha Wolf middle card is not selected'
			}
		}
	}

	// Validate player counts
	const validDeckCount = playerCount + 3
	if (deck.length !== validDeckCount) {
		return {
			reason: ValidationReasonType.PlayerCountInvalid,
			description: 'Wrong number of players for this deck'
		}
	}

	// All good, no validation details needed
	return null
}
