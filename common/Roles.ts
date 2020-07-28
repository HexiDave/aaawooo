import { Card } from './Card'
import { ElementType } from './utils'

export const NightRoleOrder = [
	Card.Werewolf,
	Card.AlphaWolf,
	Card.MysticWolf,
	Card.Minion,
	Card.Mason,
	Card.Seer,
	Card.ApprenticeSeer,
	Card.ParanormalInvestigator,
	Card.Robber,
	Card.Witch,
	Card.Troublemaker,
	Card.VillageIdiot,
	Card.Drunk,
	Card.Insomniac
] as const

export type NightRoleOrderType = ElementType<typeof NightRoleOrder>

/**
 * Returns the next night role in order, or null if the last one
 * @param role	Current night role
 * @returns	Next role or null
 */
export function getNextNightRole(role: NightRoleOrderType): NightRoleOrderType | null {
	const nextRoleIndex = NightRoleOrder.indexOf(role) + 1

	// Out of bounds
	if (nextRoleIndex >= NightRoleOrder.length)
		return null

	return NightRoleOrder[nextRoleIndex]
}
