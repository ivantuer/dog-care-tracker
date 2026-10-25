import { effect, signal } from '@preact/signals';
import { get, set } from 'idb-keyval';
import type { AppState, Dog, Lang, Log, Species, SyncData, Task } from './types';
import { PRESETS } from './presets';
import { mergeData, prune } from './sync-core';
import { localDate, stampFor } from './dates';

export const STATE_KEY = 'dog-care-state';

const guessLang = (): Lang => (typeof navigator !== 'undefined' && /^uk|^ru/i.test(navigator.language) ? 'uk' : 'en');

export const defaults = (): AppState => ({
  version: 1,
  dogs: [],
  tasks: [],
  logs: [],
  tombstones: {},
  settings: { me: '', lang: guessLang(), theme: 'auto', accent: '#ff7a45', hour: 9, server: '', googleEmail: '', push: false, notify: false, dogFilter: 'all' },
});

export const state = signal<AppState>(defaults());
export const ready = signal(false);

export const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

/** Called after every change to shared data; the sync engine plugs in here. */
export const hooks = { dataChanged: () => {}, resumed: () => {} };

export async function init() {
  const saved = await get<AppState>(STATE_KEY);
  if (saved) state.value = { ...defaults(), ...saved, settings: { ...defaults().settings, ...saved.settings } };
  // Weigh-in routines made before weight entry existed get the weight field.
  const weighNames = ['Weigh-in', 'Зважування'];
  if (state.value.tasks.some((x) => !x.measure && weighNames.includes(x.name))) {
    state.value = { ...state.value, tasks: state.value.tasks.map((x) => (!x.measure && weighNames.includes(x.name) ? { ...x, measure: 'kg' as const, updatedAt: now() } : x)) };
  }
  ready.value = true;
  effect(() => {
    if (ready.value) void set(STATE_KEY, JSON.parse(JSON.stringify(state.value)));
  });
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && hooks.resumed());
}

const shared = (): SyncData => {
  const { dogs, tasks, logs, tombstones } = state.value;
  return { dogs, tasks, logs, tombstones };
};
export const sharedData = shared;

/** Writes shared data and tells the sync engine. */
function commit(fn: (d: SyncData) => SyncData) {
  state.value = { ...state.value, ...prune(fn(shared())) };
  hooks.dataChanged();
}

/** Applies data that arrived from the other phone; does not trigger another upload by itself. */
export function applySynced(d: SyncData) {
  state.value = { ...state.value, ...d };
}

export function patchSettings(p: Partial<AppState['settings']>) {
  state.value = { ...state.value, settings: { ...state.value.settings, ...p } };
}

// ---- dogs ------------------------------------------------------------------------------------------------

export function saveDog(d: Omit<Dog, 'updatedAt'>) {
  commit((s) => ({ ...s, dogs: [...s.dogs.filter((x) => x.id !== d.id), { ...d, updatedAt: now() }] }));
}

export function removeDog(id: string) {
  commit((s) => ({ ...s, dogs: s.dogs.filter((x) => x.id !== id), tombstones: { ...s.tombstones, [id]: now() } }));
  if (state.value.settings.dogFilter === id) patchSettings({ dogFilter: 'all' });
}

// ---- tasks -----------------------------------------------------------------------------------------------

export function saveTask(t: Omit<Task, 'updatedAt'>) {
  commit((s) => ({ ...s, tasks: [...s.tasks.filter((x) => x.id !== t.id), { ...t, updatedAt: now() }] }));
}

export function removeTask(id: string) {
  commit((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id), tombstones: { ...s.tombstones, [id]: now() } }));
}

export const nextOrder = () => Math.max(-1, ...state.value.tasks.map((t) => t.order)) + 1;

export function taskFromPreset(key: string, name: string, species: Species, dogIds: string[] = []): Omit<Task, 'updatedAt'> {
  const p = PRESETS.find((x) => x.key === key)!;
  return { id: uid(), name, emoji: p.emoji, color: p.color, every: p.every, unit: p.unit, lead: p.lead, species: p.any ? 'any' : species, dogIds, months: p.months ?? [], ...(p.measure ? { measure: p.measure } : {}), order: nextOrder() };
}

// ---- logs ------------------------------------------------------------------------------------------------

export interface LogInput { taskId: string; dogId: string; day?: string; note?: string; weight?: number; nextDue?: string; skipped?: boolean }

/** Records a procedure as done (or skipped) and returns its id, so it can be undone. */
export function logCare(i: LogInput): string {
  const id = uid();
  const log: Log = {
    id, taskId: i.taskId, dogId: i.dogId, at: stampFor(i.day ?? localDate()), by: state.value.settings.me || '?',
    ...(i.note ? { note: i.note } : {}), ...(i.weight ? { weight: i.weight } : {}), ...(i.nextDue ? { nextDue: i.nextDue } : {}), ...(i.skipped ? { skipped: true } : {}),
    updatedAt: now(),
  };
  commit((s) => ({ ...s, logs: [...s.logs, log] }));
  return id;
}

export function saveLog(l: Omit<Log, 'updatedAt'>) {
  commit((s) => ({ ...s, logs: [...s.logs.filter((x) => x.id !== l.id), { ...l, updatedAt: now() }] }));
}

export function removeLog(id: string) {
  commit((s) => ({ ...s, logs: s.logs.filter((x) => x.id !== id), tombstones: { ...s.tombstones, [id]: now() } }));
}

// ---- backup ----------------------------------------------------------------------------------------------

export const exportJson = () => JSON.stringify({ app: 'dog-care-tracker', ...shared() }, null, 2);

/** Merges a backup into the current data (nothing is deleted). */
export function importJson(text: string) {
  const j = JSON.parse(text) as Partial<SyncData> & { app?: string };
  if (j.app !== 'dog-care-tracker') throw new Error('not a backup');
  const incoming: SyncData = { dogs: j.dogs ?? [], tasks: j.tasks ?? [], logs: j.logs ?? [], tombstones: j.tombstones ?? {} };
  commit((s) => mergeData(s, incoming));
}
