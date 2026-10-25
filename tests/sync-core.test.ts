import { describe, expect, it } from 'vitest';
import { canon, decodeInvite, decrypt, encodeInvite, encrypt, mergeData, newVault } from '../src/sync-core';
import { data, dog, log, task } from './helpers';

const T = (n: number) => `2026-10-2${n}T10:00:00.000Z`;

describe('merge', () => {
  it('keeps what each phone added', () => {
    const a = data({ dogs: [dog('rex')], tasks: [task('t')], logs: [log('l1', 't', 'rex', T(1))] });
    const b = data({ dogs: [dog('rex')], tasks: [task('t')], logs: [log('l2', 't', 'rex', T(2), { by: 'Bob' })] });
    expect(mergeData(a, b).logs.map((l) => l.id).sort()).toEqual(['l1', 'l2']);
  });

  it('is the same whichever phone merges first, and merging twice changes nothing', () => {
    const a = data({ dogs: [dog('rex', { name: 'Rex', updatedAt: T(1) })], tasks: [task('t', { name: 'A', updatedAt: T(1) })], logs: [log('l1', 't', 'rex', T(1))] });
    const b = data({ dogs: [dog('rex', { name: 'Rexy', updatedAt: T(2) })], tasks: [task('t', { name: 'B', updatedAt: T(2) })], logs: [log('l2', 't', 'rex', T(2))], tombstones: { l1: T(3) } });
    const ab = mergeData(a, b), ba = mergeData(b, a);
    expect(canon(ab)).toBe(canon(ba));
    expect(canon(mergeData(ab, b))).toBe(canon(ab));
    expect(ab.dogs[0].name).toBe('Rexy');
    expect(ab.logs.map((l) => l.id)).toEqual(['l2']);
  });

  it('lets an edit made after a delete win, and a delete after an edit win', () => {
    const edited = data({ dogs: [dog('rex')], tasks: [task('t')], logs: [log('l', 't', 'rex', T(1), { note: 'edited', updatedAt: T(5) })] });
    expect(mergeData(edited, data({ tombstones: { l: T(3) } })).logs).toHaveLength(1);
    expect(mergeData(edited, data({ tombstones: { l: T(6) } })).logs).toHaveLength(0);
  });

  it('drops entries whose dog or routine was deleted', () => {
    const a = data({ dogs: [dog('rex')], tasks: [task('t')], logs: [log('l', 't', 'rex', T(1))] });
    expect(mergeData(a, data({ tombstones: { rex: T(2) } })).logs).toHaveLength(0);
    expect(mergeData(a, data({ tombstones: { t: T(2) } })).logs).toHaveLength(0);
  });
});

describe('encryption and invites', () => {
  it('round-trips and rejects the wrong key', async () => {
    const v = newVault('https://x.example');
    const d = data({ dogs: [dog('rex', { name: 'Рекс 🐶' })] });
    const { iv, blob } = await encrypt(v, d);
    expect(blob).not.toContain('Rex');
    expect((await decrypt(v, iv, blob)).dogs[0].name).toBe('Рекс 🐶');
    await expect(decrypt(newVault('https://x.example'), iv, blob)).rejects.toThrow();
  });

  it('turns a vault into an invite and back', () => {
    const v = newVault('https://dogcare-sync.me.workers.dev/');
    const code = encodeInvite(v);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeInvite(`https://me.github.io/dog/#join=${code}`)).toEqual({ ...v, url: 'https://dogcare-sync.me.workers.dev' });
    expect(decodeInvite(code).bearer).toBe(v.bearer);
    expect(() => decodeInvite('https://me.github.io/dog/#join=garbage')).toThrow('invite');
  });
});
