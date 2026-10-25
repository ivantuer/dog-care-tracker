// Two phones against a running sync server: `cd worker && npx wrangler dev --local`, then
// SYNC_URL=http://localhost:8787 npm test
import { describe, expect, it } from 'vitest';
import { liveProtocols, liveUrl, mergeData, newVault, pull, push, syncOnce } from '../src/sync-core';
import { data, dog, log, task } from './helpers';

const URL_ = process.env.SYNC_URL;
const d = URL_ ? describe : describe.skip;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

d('sync server', () => {
  it('lets two phones converge, stops strangers, and announces changes live', async () => {
    const vault = newVault(URL_!);
    const stranger = { ...newVault(URL_!), path: vault.path };

    const rex = data({ dogs: [dog('rex')], tasks: [task('t')], logs: [log('l1', 't', 'rex', '2026-10-24T10:00:00.000Z')] });
    const first = await syncOnce(vault, rex);
    expect(first).toMatchObject({ rev: 1, pushed: true });

    await expect(pull(stranger)).rejects.toThrow(/does not accept/);
    expect(await push(vault, rex, 0)).toEqual({ ok: false }); // stale revision is refused

    // Phone B listens, phone A logs something, phone B hears about it.
    const got: number[] = [];
    const ws = new WebSocket(liveUrl(vault), liveProtocols(vault));
    await new Promise<void>((res, rej) => { ws.onopen = () => res(); ws.onerror = () => rej(new Error('ws failed')); });
    ws.onmessage = (e) => { if (e.data !== 'pong') got.push(JSON.parse(String(e.data)).rev); };
    ws.send('ping');
    await wait(200);

    const a = data({ ...rex, logs: [...rex.logs, log('l2', 't', 'rex', '2026-10-25T08:00:00.000Z', { by: 'Bob' })] });
    const second = await syncOnce(vault, a);
    expect(second.rev).toBe(2);
    await wait(300);
    expect(got).toContain(2);

    const b = await pull(vault);
    expect(b!.data.logs.map((l) => l.id).sort()).toEqual(['l1', 'l2']);
    expect(mergeData(b!.data, rex).logs).toHaveLength(2);
    ws.close();

    const bad = new WebSocket(liveUrl(vault), liveProtocols(stranger));
    const closed = await new Promise<boolean>((res) => { bad.onopen = () => res(false); bad.onerror = () => res(true); bad.onclose = () => res(true); });
    expect(closed).toBe(true);
  });
});
