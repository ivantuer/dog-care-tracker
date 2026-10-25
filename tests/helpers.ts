import type { Dog, Log, SyncData, Task } from '../src/types';

export const dog = (id: string, over: Partial<Dog> = {}): Dog => ({ id, name: id, emoji: '🐶', color: '#000', updatedAt: '2026-01-01T00:00:00.000Z', ...over });

export const task = (id: string, over: Partial<Task> = {}): Task => ({
  id, name: id, emoji: '💉', color: '#000', every: 1, unit: 'month', lead: 0, dogIds: [], months: [], order: 0, updatedAt: '2026-01-01T00:00:00.000Z', ...over,
});

export const log = (id: string, taskId: string, dogId: string, at: string, over: Partial<Log> = {}): Log => ({ id, taskId, dogId, at, by: 'Ann', updatedAt: at, ...over });

export const data = (over: Partial<SyncData> = {}): SyncData => ({ dogs: [], tasks: [], logs: [], tombstones: {}, ...over });
