import { Card } from './Card'

export const CardCountLimit: Partial<Record<Card, number>> = {
	[Card.Villager]: 10,
	[Card.Werewolf]: 2,
	[Card.Mason]: 2,
}

export const CardCountSteps: Partial<Record<Card, number>> = {
	[Card.Mason]: 2
}

export const getCardLimit = (card: Card) => CardCountLimit[card] || 1

export const getCardSteps = (card: Card) => CardCountSteps[card] || 1
