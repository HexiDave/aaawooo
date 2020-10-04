import { AlphaWolfCardArray, AlphaWolfCards, Card, CardArray, WerewolfCardArray } from './Card'
import { getCardLimit } from './CardCountLimit'
import { shuffleCards } from './utils'

export interface CardCountState extends Record<Card, number> {
	alphaWolfCard: AlphaWolfCards
}

export const DefaultCardCountState: CardCountState = {
	alphaWolf: 0,
	alphaWolfCard: 'none',
	appSeer: 0,
	dreamWolf: 0,
	drunk: 0,
	insomniac: 0,
	mason: 0,
	minion: 0,
	mysticWolf: 0,
	// pi: 0,
	// revealer: 0,
	robber: 0,
	seer: 0,
	troublemaker: 0,
	vIdiot: 0,
	villager: 0,
	werewolf: 0,
	witch: 0
} as const

export enum CardBound {
	Low = -1,
	Correct = 0,
	High = 1
}

const MAX_SHUFFLE_ATTEMPTS = 10

/**
 * Checks if the the number of cards for a specific role is valid.
 * @param state	Card counts
 * @param card	Card to investigate
 * @returns	Boundary result
 */
export function isCardCountValid(state: CardCountState, card: Card): CardBound {
	const count = state[card]

	if (count < 0)
		return CardBound.Low

	const upperLimit = getCardLimit(card)

	// noinspection RedundantIfStatementJS
	if (count > upperLimit)
		return CardBound.High

	return CardBound.Correct
}

/**
 * Normalize the card count when updating. Returns a new copy.
 * @param state	Current state
 * @param card	The card to update the count for
 * @param count	The new count
 * @returns A new copy of the state with the updated values
 */
export function updateCardCount(state: CardCountState, card: Card, count: number): CardCountState {
	const upperLimit = getCardLimit(card)
	const value = Math.max(Math.min(count, upperLimit), 0)

	return {
		...state,
		[card]: value
	}
}

/**
 * Updates the alpha wolf card; if valid returns a new copy.
 * @param state	Current state
 * @param alphaWolfCard	New alpha wolf card
 * @returns A new copy of the state, or the original state if invalid
 */
export function updateAlphaWolfCard(state: CardCountState, alphaWolfCard: AlphaWolfCards): CardCountState {
	if (AlphaWolfCardArray.indexOf(alphaWolfCard) === -1)
		return state

	return {
		...state,
		alphaWolfCard
	}
}

/**
 * Build a deck of cards from the number of each type of card, excluding the Alpha Wolf choice card.
 * @param state	Current count of each card picked
 * @returns	An unshuffled deck of cards
 */
export function buildDeckFromCardCountState(state: CardCountState): Card[] {
	const deck: Card[] = []

	CardArray.map(card => {
		const count = state[card]

		for (let i = 0; i < count; i++)
			deck.push(card)
	})

	return deck
}

export function getDeckSizeFromCardCountState(state: CardCountState): number {
	const baseDeck = buildDeckFromCardCountState(state)

	return baseDeck.length + (state.alphaWolfCard === 'none' ? 0 : 1)
}

function areAllPlayersWerewolves(deck: Card[]) {
	for (let i = 0; i < deck.length - 3; i++) {
		if (WerewolfCardArray.indexOf(deck[i]) === -1)
			return false
	}

	return true
}

export function prepareDeckForGame(state: CardCountState, deck: Card[]): Card[] {
	let shuffledDeck: Card[] = []

	for (let i = 0; i < MAX_SHUFFLE_ATTEMPTS; i++) {
		shuffledDeck = shuffleCards(deck)

		// We don't want a round where all players are werewolves - waste of a round
		if (!areAllPlayersWerewolves(shuffledDeck))
			break
	}

	if (state.alphaWolf > 0 && state.alphaWolfCard !== 'none') {
		return [
			...shuffledDeck,
			state.alphaWolfCard
		]
	}

	return shuffledDeck
}
