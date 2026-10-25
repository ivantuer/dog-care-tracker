// Text of a reminder. Pure, so the page and the service worker (which wakes up for a push) produce the same wording.
import { allItems, type Item } from './care';
import { pluralize, taskName, translate } from './i18n';
import type { Lang, SyncData } from './types';

export const dueWords = (lang: Lang, days: number) =>
  days < 0 ? translate(lang, 'due.overdue', { d: pluralize(lang, 'n.day', -days) })
  : days === 0 ? translate(lang, 'due.today')
  : days === 1 ? translate(lang, 'due.tomorrow')
  : translate(lang, 'due.in', { d: pluralize(lang, 'n.day', days) });

export function digest(d: Pick<SyncData, 'dogs' | 'tasks' | 'logs'>, lang: Lang, today?: string): { title: string; body: string; items: Item[] } | null {
  const items = allItems(d, today).filter((i) => i.status !== 'ok');
  if (!items.length) return null;
  const many = d.dogs.length > 1;
  const line = (i: Item) => `${i.task.emoji} ${many ? `${i.dog.name}: ` : ''}${taskName(lang, i.task.name)} (${dueWords(lang, i.days)})`;
  const shown = items.slice(0, 4).map(line);
  if (items.length > 4) shown.push(translate(lang, 'digest.more', { n: String(items.length - 4) }));
  return { title: translate(lang, 'digest.title', { n: String(items.length) }), body: shown.join('\n'), items };
}
