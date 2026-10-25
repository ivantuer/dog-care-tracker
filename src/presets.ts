import type { Unit } from './types';

export interface Preset {
  key: string;
  emoji: string;
  color: string;
  every: number;
  unit: Unit;
  lead: number;
  months?: number[];
  /** Ticked by default when setting up the first dog. */
  common: boolean;
}

/** Names come from the language files under `preset.<key>`. */
export const PRESETS: Preset[] = [
  { key: 'rabies', emoji: '💉', color: '#e5484d', every: 1, unit: 'year', lead: 21, common: true },
  { key: 'vaccine', emoji: '💉', color: '#f76b15', every: 1, unit: 'year', lead: 21, common: true },
  { key: 'deworm', emoji: '💊', color: '#ffb224', every: 3, unit: 'month', lead: 7, common: true },
  { key: 'tick', emoji: '🛡️', color: '#30a46c', every: 1, unit: 'month', lead: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11], common: true },
  { key: 'brush', emoji: '🖌️', color: '#3e63dd', every: 3, unit: 'day', lead: 0, common: true },
  { key: 'teeth', emoji: '🪥', color: '#12a594', every: 2, unit: 'day', lead: 0, common: true },
  { key: 'nails', emoji: '✂️', color: '#8e4ec6', every: 3, unit: 'week', lead: 2, common: true },
  { key: 'bath', emoji: '🛁', color: '#0091ff', every: 1, unit: 'month', lead: 3, common: false },
  { key: 'ears', emoji: '👂', color: '#d6409f', every: 2, unit: 'week', lead: 1, common: false },
  { key: 'vet', emoji: '🩺', color: '#697177', every: 1, unit: 'year', lead: 14, common: false },
  { key: 'weigh', emoji: '⚖️', color: '#978365', every: 1, unit: 'month', lead: 2, common: false },
];

export const COLORS = ['#e5484d', '#f76b15', '#ffb224', '#30a46c', '#12a594', '#0091ff', '#3e63dd', '#8e4ec6', '#d6409f', '#697177'];
export const TASK_EMOJI = ['💉', '💊', '🛡️', '🖌️', '🪥', '✂️', '🛁', '👂', '👀', '🩺', '⚖️', '🦴', '🧴', '🐾', '🧽', '🌡️'];
export const DOG_EMOJI = ['🐶', '🐕', '🐩', '🦮', '🐕‍🦺', '🐺', '🐾'];
export const ACCENTS = ['#ff7a45', '#2bb3a0', '#6b8cff', '#b07cff', '#ff5fa2', '#e0a800'];
