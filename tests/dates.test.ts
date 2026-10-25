import { describe, expect, it } from 'vitest';
import { addInterval, daysBetween, localDate, nextActiveDay } from '../src/dates';

describe('dates', () => {
  it('adds days and weeks across month ends', () => {
    expect(addInterval('2026-01-30', 3, 'day')).toBe('2026-02-02');
    expect(addInterval('2026-03-01', 3, 'week')).toBe('2026-03-22');
  });
  it('clamps months to the end of a shorter month', () => {
    expect(addInterval('2026-01-31', 1, 'month')).toBe('2026-02-28');
    expect(addInterval('2024-02-29', 1, 'year')).toBe('2025-02-28');
    expect(addInterval('2026-11-15', 3, 'month')).toBe('2027-02-15');
  });
  it('counts calendar days across a DST change', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2026-05-02', '2026-05-01')).toBe(-1);
  });
  it('formats local dates', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('moves a date out of an inactive season to the first active day', () => {
    const season = [3, 4, 5, 6, 7, 8, 9, 10, 11];
    expect(nextActiveDay('2026-07-10', season)).toBe('2026-07-10');
    expect(nextActiveDay('2026-12-20', season)).toBe('2027-03-01');
    expect(nextActiveDay('2026-01-20', season)).toBe('2026-03-01');
    expect(nextActiveDay('2026-12-20', [])).toBe('2026-12-20');
  });
});
