export enum Card {
	Werewolf = 'werewolf',
	AlphaWolf = 'alphaWolf',
	DreamWolf = 'dreamWolf',
	MysticWolf = 'mysticWolf',
	Villager = 'villager',
	Seer = 'seer',
	Robber = 'robber',
	Minion = 'minion',
	Mason = 'mason',
	ApprenticeSeer = 'appSeer',
	Witch = 'witch',
	Troublemaker = 'troublemaker',
	VillageIdiot = 'vIdiot',
	ParanormalInvestigator = 'pi',
	Insomniac = 'insomniac',
	Revealer = 'revealer',
	Drunk = 'drunk'
}

export type OptionalCard = Card | null

export type AlphaWolfCards = 'none' | Card.Werewolf | Card.DreamWolf | Card.MysticWolf

export const AlphaWolfCardArray: AlphaWolfCards[] = [
	'none',
	Card.Werewolf,
	Card.DreamWolf,
	Card.MysticWolf
]

export const CardArray = Object.values(Card)
