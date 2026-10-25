import { describe, expect, it } from 'vitest';
import { itemFor } from '../src/care';
import { digest } from '../src/digest';
import { buildIcs } from '../src/ics';
import { pluralize, translate } from '../src/i18n';
import { dog, task, data } from './helpers';

describe('wording', () => {
  it('pluralises Ukrainian correctly', () => {
    expect(pluralize('uk', 'n.day', 1)).toBe('1 день');
    expect(pluralize('uk', 'n.day', 3)).toBe('3 дні');
    expect(pluralize('uk', 'n.day', 5)).toBe('5 днів');
    expect(pluralize('uk', 'n.day', 21)).toBe('21 день');
    expect(pluralize('uk', 'n.day', 11)).toBe('11 днів');
    expect(pluralize('en', 'n.week', 2)).toBe('2 weeks');
  });
  it('falls back to English for a missing key and fills placeholders', () => {
    expect(translate('uk', 'due.in', { d: '2 дні' })).toBe('Через 2 дні');
    expect(translate('en', 'nope')).toBe('nope');
  });
  it('writes the reminder text, or nothing when all is done', () => {
    const d = data({ dogs: [dog('rex', { name: 'Rex' })], tasks: [task('teeth', { name: 'Teeth', emoji: '🪥' })] });
    const x = digest(d, 'en', '2026-10-25')!;
    expect(x.body).toContain('Teeth (Today)');
    expect(x.title).toContain('1');
    expect(digest({ ...d, tasks: [] }, 'en')).toBeNull();
  });
});

describe('weight input', () => {
  it('accepts commas and rejects nonsense', async () => {
    const { parseKg } = await import('../src/format');
    expect(parseKg('12,5')).toBe(12.5);
    expect(parseKg(' 0.456 ')).toBe(0.46);
    expect(parseKg('abc')).toBeUndefined();
    expect(parseKg('0')).toBeUndefined();
    expect(parseKg('-3')).toBeUndefined();
    expect(parseKg('')).toBeUndefined();
  });
});

describe('calendar export', () => {
  it('builds repeating all-day events with alerts', () => {
    const i = itemFor(task('nails', { name: 'Nails; trim', every: 3, unit: 'week', lead: 2, emoji: '✂️' }), dog('rex', { name: 'Rex' }), [], '2026-10-25');
    const ics = buildIcs([i], 9, new Date('2026-10-25T08:00:00'));
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261025');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=3');
    expect(ics).toContain('TRIGGER:PT9H');
    expect(ics).toContain('TRIGGER:-PT39H');
    expect(ics).toContain(String.raw`Nails\; trim`);
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
