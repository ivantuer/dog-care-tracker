import type { Species, Unit } from './types';

export const SPECIES: Species[] = ['dog', 'cat', 'fish', 'bird', 'rabbit', 'hamster', 'reptile', 'other'];

export const SPECIES_EMOJI: Record<Species, string[]> = {
  dog: ['🐶', '🐕', '🐩', '🦮', '🐕‍🦺', '🐺'],
  cat: ['🐱', '🐈', '🐈‍⬛'],
  fish: ['🐟', '🐠', '🐡'],
  bird: ['🐦', '🦜', '🦆'],
  rabbit: ['🐰', '🐇'],
  hamster: ['🐹', '🐭'],
  reptile: ['🐢', '🦎', '🐍'],
  other: ['🐾', '🦔', '🐴'],
};

export interface Preset {
  key: string;
  emoji: string;
  color: string;
  every: number;
  unit: Unit;
  lead: number;
  months?: number[];
  /** Animals it makes sense for. */
  species: Species[];
  /** Becomes a routine for every animal instead of one kind. */
  any?: boolean;
  measure?: 'kg';
  /** Ticked by default when setting up a pet of that kind. */
  common: Species[];
}

const SEASON = [3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Names come from the language files under `preset.<key>`. */
export const PRESETS: Preset[] = [
  { key: 'rabies', emoji: '💉', color: '#e5484d', every: 1, unit: 'year', lead: 21, species: ['dog', 'cat'], common: ['dog', 'cat'] },
  { key: 'vaccine', emoji: '💉', color: '#f76b15', every: 1, unit: 'year', lead: 21, species: ['dog', 'cat', 'rabbit'], common: ['dog', 'cat', 'rabbit'] },
  { key: 'deworm', emoji: '💊', color: '#ffb224', every: 3, unit: 'month', lead: 7, species: ['dog', 'cat'], common: ['dog', 'cat'] },
  { key: 'tick', emoji: '🛡️', color: '#30a46c', every: 1, unit: 'month', lead: 3, months: SEASON, species: ['dog', 'cat'], common: ['dog', 'cat'] },
  { key: 'brush', emoji: '🖌️', color: '#3e63dd', every: 3, unit: 'day', lead: 0, species: ['dog', 'cat', 'rabbit'], common: ['dog', 'cat', 'rabbit'] },
  { key: 'teeth', emoji: '🪥', color: '#12a594', every: 2, unit: 'day', lead: 0, species: ['dog', 'cat'], common: ['dog', 'cat'] },
  { key: 'nails', emoji: '✂️', color: '#8e4ec6', every: 3, unit: 'week', lead: 2, species: ['dog', 'cat', 'rabbit', 'bird'], common: ['dog', 'cat', 'rabbit'] },
  { key: 'litter', emoji: '🧺', color: '#978365', every: 1, unit: 'week', lead: 1, species: ['cat'], common: ['cat'] },
  { key: 'waterchange', emoji: '💧', color: '#0091ff', every: 1, unit: 'week', lead: 1, species: ['fish'], common: ['fish'] },
  { key: 'watertest', emoji: '🧪', color: '#12a594', every: 1, unit: 'week', lead: 1, species: ['fish'], common: ['fish'] },
  { key: 'filter', emoji: '🫧', color: '#3e63dd', every: 1, unit: 'month', lead: 3, species: ['fish'], common: ['fish'] },
  { key: 'cage', emoji: '🧽', color: '#30a46c', every: 1, unit: 'week', lead: 1, species: ['bird', 'rabbit', 'hamster', 'reptile', 'other'], common: ['bird', 'rabbit', 'hamster', 'reptile'] },
  { key: 'uvb', emoji: '💡', color: '#ffb224', every: 6, unit: 'month', lead: 14, species: ['reptile'], common: ['reptile'] },
  { key: 'bath', emoji: '🛁', color: '#0091ff', every: 1, unit: 'month', lead: 3, species: ['dog', 'cat'], common: [] },
  { key: 'ears', emoji: '👂', color: '#d6409f', every: 2, unit: 'week', lead: 1, species: ['dog', 'cat', 'rabbit'], common: [] },
  { key: 'vet', emoji: '🩺', color: '#697177', every: 1, unit: 'year', lead: 14, species: SPECIES, any: true, common: [] },
  { key: 'weigh', emoji: '⚖️', color: '#978365', measure: 'kg', every: 1, unit: 'month', lead: 2, species: ['dog', 'cat', 'rabbit', 'bird', 'hamster', 'reptile', 'other'], common: [] },
];

export const presetsFor = (species: Species) => PRESETS.filter((p) => p.species.includes(species));

export const COLORS = ['#e5484d', '#f76b15', '#ffb224', '#30a46c', '#12a594', '#0091ff', '#3e63dd', '#8e4ec6', '#d6409f', '#697177'];
export const TASK_EMOJI = ['💉', '💊', '🛡️', '🖌️', '🪥', '✂️', '🛁', '👂', '👀', '🩺', '⚖️', '🦴', '🧴', '🐾', '🧽', '🌡️', '💧', '🧺', '💡'];
export const ACCENTS = ['#ff7a45', '#2bb3a0', '#6b8cff', '#b07cff', '#ff5fa2', '#e0a800'];
