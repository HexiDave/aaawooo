import { AlphaWolfCards, Card } from '../../common'

export const CardNames: Record<Card, string> = {
	alphaWolf: 'Alpha Wolf',
	appSeer: 'Apprentice Seer',
	dreamWolf: 'Dream Wolf',
	drunk: 'Drunk',
	insomniac: 'Insomniac',
	mason: 'Mason',
	minion: 'Minion',
	mysticWolf: 'Mystic Wolf',
	// pi: 'Paranormal Investigator',
	// revealer: 'Revealer',
	robber: 'Robber',
	seer: 'Seer',
	troublemaker: 'Troublemaker',
	vIdiot: 'Village Idiot',
	villager: 'Villager',
	werewolf: 'Werewolf',
	witch: 'Witch'

}

export const AlphaWolfCardNames: Record<AlphaWolfCards, string> = {
	werewolf: CardNames[Card.Werewolf],
	dreamWolf: CardNames[Card.DreamWolf],
	mysticWolf: CardNames[Card.MysticWolf],
	none: 'None',
}
