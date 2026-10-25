// Pure scheduling logic: what is due, for which dog, and when to remind. No DOM, so it also runs in the service worker.
import type { Dog, Log, SyncData, Task } from './types';
import { addInterval, atHour, daysBetween, localDate, nextActiveDay } from './dates';

export type Status = 'overdue' | 'today' | 'soon' | 'ok';

export interface Item {
  task: Task;
  dog: Dog;
  last?: Log;
  /** YYYY-MM-DD */
  due: string;
  /** Days from today to the due date; negative when overdue. */
  days: number;
  status: Status;
}

export const appliesTo = (t: Task, dogId: string) => !t.archived && (t.dogIds.length === 0 || t.dogIds.includes(dogId));

export const lastLog = (logs: Log[], taskId: string, dogId: string): Log | undefined => {
  let best: Log | undefined;
  for (const l of logs) if (l.taskId === taskId && l.dogId === dogId && (!best || l.at > best.at)) best = l;
  return best;
};

export function itemFor(task: Task, dog: Dog, logs: Log[], today: string): Item {
  const last = lastLog(logs, task.id, dog.id);
  const raw = last ? last.nextDue ?? addInterval(localDate(new Date(last.at)), task.every, task.unit) : task.startDate ?? today;
  // An explicit date set by hand is respected; a computed one waits for the active season.
  const due = last?.nextDue ? raw : nextActiveDay(raw, task.months);
  const days = daysBetween(today, due);
  const status: Status = days < 0 ? 'overdue' : days === 0 ? 'today' : days <= task.lead ? 'soon' : 'ok';
  return { task, dog, last, due, days, status };
}

/** Every task/dog pair that applies, soonest first. */
export function allItems(d: Pick<SyncData, 'dogs' | 'tasks' | 'logs'>, today = localDate()): Item[] {
  const out: Item[] = [];
  for (const task of d.tasks) for (const dog of d.dogs) if (appliesTo(task, dog.id)) out.push(itemFor(task, dog, d.logs, today));
  return out.sort((a, b) => a.due.localeCompare(b.due) || a.task.order - b.task.order || a.dog.name.localeCompare(b.dog.name));
}

export const needsAttention = (i: Item) => i.status !== 'ok';

/**
 * When to wake the phone: the reminder hour on the day each item enters its lead window, then on each following day
 * while it is overdue (a few nudges, not forever). Timestamps in ms, future only, soonest first, capped.
 */
export function reminderTimes(items: Item[], hour: number, now = Date.now(), horizonDays = 60, cap = 64): number[] {
  const set = new Set<number>();
  const add = (day: string) => {
    const t = atHour(day, hour);
    if (t > now && t < now + horizonDays * 86_400_000) set.add(t);
  };
  for (const i of items) {
    add(addInterval(i.due, -i.task.lead, 'day'));
    for (let n = 0; n <= 3; n++) add(addInterval(i.due, n, 'day'));
  }
  return [...set].sort((a, b) => a - b).slice(0, cap);
}
