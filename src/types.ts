export type Unit = 'day' | 'week' | 'month' | 'year';
export type Lang = 'en' | 'uk';

export interface Dog {
  id: string;
  name: string;
  emoji: string;
  color: string;
  breed?: string;
  /** YYYY-MM-DD */
  birthday?: string;
  updatedAt: string;
}

/** A recurring procedure (vaccine, brushing, ...). The interval counts from the last time it was done. */
export interface Task {
  id: string;
  name: string;
  emoji: string;
  color: string;
  every: number;
  unit: Unit;
  /** Start reminding this many days before the due date. */
  lead: number;
  /** Dogs it applies to; empty means every dog. */
  dogIds: string[];
  /** Months (1-12) in which it is active, e.g. tick season; empty means all year. */
  months: number[];
  /** First due date for a dog that has never had it, YYYY-MM-DD. Defaults to today. */
  startDate?: string;
  notes?: string;
  archived?: boolean;
  order: number;
  updatedAt: string;
}

export interface Log {
  id: string;
  taskId: string;
  dogId: string;
  /** ISO timestamp of when it was done. */
  at: string;
  /** Name of the person who did it. */
  by: string;
  note?: string;
  /** Overrides the computed next due date, YYYY-MM-DD (e.g. a booster in 3 weeks). */
  nextDue?: string;
  /** Postponed on purpose: counts for scheduling but not as done. */
  skipped?: boolean;
  updatedAt: string;
}

export interface Settings {
  me: string;
  lang: Lang;
  theme: 'auto' | 'light' | 'dark';
  accent: string;
  /** Local hour of day for reminders. */
  hour: number;
  /** Sync server address; empty uses the built-in default. */
  server: string;
  push: boolean;
  notify: boolean;
  dogFilter: string;
}

export interface AppState {
  version: 1;
  dogs: Dog[];
  tasks: Task[];
  logs: Log[];
  tombstones: Record<string, string>;
  settings: Settings;
}

export interface SyncData {
  dogs: Dog[];
  tasks: Task[];
  logs: Log[];
  tombstones: Record<string, string>;
}
