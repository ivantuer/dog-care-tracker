import { describe, expect, it } from 'vitest';
import { allItems, itemFor, reminderTimes } from '../src/care';
import { atHour } from '../src/dates';
import { data, dog, log, task } from './helpers';

const rex = dog('rex');
const luna = dog('luna');
const at = (day: string) => new Date(`${day}T10:00:00`).toISOString();

describe('due dates', () => {
  it('counts the interval from the last time it was done', () => {
    const t = task('nails', { every: 3, unit: 'week', lead: 2 });
    const i = itemFor(t, rex, [log('1', 'nails', 'rex', at('2026-10-01'))], '2026-10-10');
    expect(i.due).toBe('2026-10-22');
    expect(i.days).toBe(12);
    expect(i.status).toBe('ok');
    expect(itemFor(t, rex, [log('1', 'nails', 'rex', at('2026-10-01'))], '2026-10-20').status).toBe('soon');
    expect(itemFor(t, rex, [log('1', 'nails', 'rex', at('2026-10-01'))], '2026-10-22').status).toBe('today');
    expect(itemFor(t, rex, [log('1', 'nails', 'rex', at('2026-10-01'))], '2026-10-25').status).toBe('overdue');
  });

  it('uses the most recent entry, and only for that dog', () => {
    const t = task('teeth', { every: 2, unit: 'day' });
    const logs = [log('1', 'teeth', 'rex', at('2026-10-01')), log('2', 'teeth', 'rex', at('2026-10-20')), log('3', 'teeth', 'luna', at('2026-10-24'))];
    expect(itemFor(t, rex, logs, '2026-10-21').due).toBe('2026-10-22');
    expect(itemFor(t, luna, logs, '2026-10-21').due).toBe('2026-10-26');
  });

  it('is due today when never done, or on the start date if one is set', () => {
    expect(itemFor(task('a'), rex, [], '2026-10-25')).toMatchObject({ due: '2026-10-25', status: 'today' });
    expect(itemFor(task('a', { startDate: '2026-11-01' }), rex, [], '2026-10-25')).toMatchObject({ due: '2026-11-01', days: 7 });
  });

  it('honours a hand-set next date over the interval', () => {
    const t = task('vac', { every: 1, unit: 'year' });
    expect(itemFor(t, rex, [log('1', 'vac', 'rex', at('2026-10-01'), { nextDue: '2026-10-22' })], '2026-10-10').due).toBe('2026-10-22');
  });

  it('waits for the active season', () => {
    const t = task('tick', { every: 1, unit: 'month', months: [3, 4, 5, 6, 7, 8, 9, 10, 11] });
    expect(itemFor(t, rex, [log('1', 'tick', 'rex', at('2026-11-20'))], '2026-11-25').due).toBe('2027-03-01');
  });

  it('applies tasks to the chosen dogs only and hides paused ones', () => {
    const d = data({
      dogs: [rex, luna],
      tasks: [task('all'), task('onlyRex', { dogIds: ['rex'] }), task('paused', { archived: true })],
    });
    const names = allItems(d, '2026-10-25').map((i) => `${i.task.id}:${i.dog.id}`).sort();
    expect(names).toEqual(['all:luna', 'all:rex', 'onlyRex:rex']);
  });

  it('keeps routines to their kind of animal, and lets "any" cover every animal', () => {
    const nemo = dog('nemo', { species: 'fish' });
    const d = data({
      dogs: [rex, nemo],
      tasks: [task('brush'), task('water', { species: 'fish' }), task('vet', { species: 'any' }), task('mine', { species: 'cat', dogIds: ['rex'] })],
    });
    const names = allItems(d, '2026-10-25').map((i) => `${i.task.id}:${i.dog.id}`).sort();
    expect(names).toEqual(['brush:rex', 'mine:rex', 'vet:nemo', 'vet:rex', 'water:nemo']);
  });

  it('sorts the most urgent first', () => {
    const d = data({ dogs: [rex], tasks: [task('later', { every: 1, unit: 'year' }), task('now')], logs: [log('1', 'later', 'rex', at('2026-10-01'))] });
    expect(allItems(d, '2026-10-25').map((i) => i.task.id)).toEqual(['now', 'later']);
  });
});

describe('reminder schedule', () => {
  const now = new Date('2026-10-25T08:00:00').getTime();
  it('wakes at the chosen hour on the lead day and nudges while overdue', () => {
    const t = task('vac', { every: 1, unit: 'year', lead: 7 });
    const i = itemFor(t, rex, [log('1', 'vac', 'rex', at('2026-01-01'), { nextDue: '2026-11-10' })], '2026-10-25');
    const times = reminderTimes([i], 9, now);
    expect(times[0]).toBe(atHour('2026-11-03', 9));
    expect(times).toContain(atHour('2026-11-10', 9));
    expect(times).toContain(atHour('2026-11-13', 9));
    expect(times).not.toContain(atHour('2026-11-14', 9));
  });
  it('does not schedule moments that already passed', () => {
    const i = itemFor(task('t'), rex, [], '2026-10-25');
    expect(reminderTimes([i], 9, now)[0]).toBe(atHour('2026-10-25', 9));
    expect(reminderTimes([i], 7, now)[0]).toBe(atHour('2026-10-26', 7));
  });
  it('is sorted, unique and capped', () => {
    const items = Array.from({ length: 40 }, (_, n) => itemFor(task(`t${n}`, { every: 1, unit: 'day' }), rex, [], '2026-10-25'));
    const times = reminderTimes(items, 9, now);
    expect(times.length).toBeLessThanOrEqual(64);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });
});
