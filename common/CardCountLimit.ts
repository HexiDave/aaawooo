import { Card } from './Card'

export const CardCountLimit: Partial<Record<Card, number>> = {
	[Card.Villager]: 10,
	[Card.Werewolf]: 2,
	[Card.Mason]: 2,
}
