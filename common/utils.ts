import { Card } from './Card'

/**
 * Return a shuffled copy of the cards array given.
 * @param cards	Array of cards to be used
 * @returns	A new array containing the shuffled cards
 */
export function shuffleCards(cards: Card[]) {
	// Clone the array
	const _cards = cards.slice(0)

	// Pulled from StackOverflow: https://stackoverflow.com/a/12646864
	for (let i = _cards.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[_cards[i], _cards[j]] = [_cards[j], _cards[i]];
	}

	return _cards
}

export type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType>
	? ElementType
	: never

export const nameOf = <T>(name: Extract<keyof T, string>): string => name

export const nameOfFactory = <T>() => (name: Extract<keyof T, string>): string => name
