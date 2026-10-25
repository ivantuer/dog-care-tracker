import { daysBetween, localDate, parseDay } from './dates';
import { dueWords } from './digest';
import { lang, pluralize, t, taskName } from './i18n';
import type { Task, Unit } from './types';

const locale = () => (lang.value === 'uk' ? 'uk-UA' : 'en-GB');

export const fmtDay = (day: string, year = false) =>
  parseDay(day).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });

export const fmtLongDay = (day: string) => parseDay(day).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });

export const monthName = (m: number) => new Date(2024, m - 1, 1).toLocaleDateString(locale(), { month: 'short' });

export const unitName = (u: Unit) => t(`u.${u}`);

export const everyLabel = (n: number, unit: Unit) => (n === 1 ? t('every1', { u: unitName(unit) }) : t('every', { x: pluralize(lang.value, `n.${unit}`, n) }));

export const dueText = (days: number) => dueWords(lang.value, days);

/** "today", "yesterday" or "3 days ago" for an ISO timestamp. */
export function agoText(iso: string, today = localDate()) {
  const d = daysBetween(localDate(new Date(iso)), today);
  return d <= 0 ? t('today') : d === 1 ? t('yesterday') : t('ago', { d: pluralize(lang.value, 'n.day', d) });
}

export const taskSummary = (task: Pick<Task, 'every' | 'unit' | 'lead'>) => everyLabel(task.every, task.unit);

export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

export const nameOf = (task: Pick<Task, 'name'>) => taskName(lang.value, task.name);

/** Parses a typed weight; accepts a comma as the decimal mark. Returns undefined for anything that is not a positive number. */
export const parseKg = (s: string) => {
  const n = Number(s.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n < 1000 ? Math.round(n * 100) / 100 : undefined;
};
export const fmtKg = (n: number) => `${n.toLocaleString(locale(), { maximumFractionDigits: 2 })} ${t('kg')}`;
