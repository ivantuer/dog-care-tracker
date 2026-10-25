// End-to-end encrypted household sync. Pure functions (no DOM, no UI state) so they can be tested in Node.
// The server holds one encrypted blob per household and never sees the key; the key travels only in the invite link's # part.
import type { SyncData } from './types';

/** What a device keeps after joining: where the household lives, how to authenticate, and the data key. */
export interface Vault { url: string; path: string; bearer: string; key: string }

/** The server no longer accepts this device's credentials for the household. */
export class SyncAuthError extends Error {}

const te = new TextEncoder();
const td = new TextDecoder();
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
/** Chunked: spreading a large array into fromCharCode overflows the call stack. */
export const b64 = (b: Uint8Array) => {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (s: string) => btoa(String.fromCharCode(...te.encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => td.decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
const base = (url: string) => url.replace(/\/+$/, '');

/** A brand-new household with random credentials. */
export function newVault(url: string): Vault {
  const r = (n: number) => crypto.getRandomValues(new Uint8Array(n));
  return { url: base(url), path: `/v/${hex(r(16))}`, bearer: hex(r(32)), key: b64(r(32)) };
}

/** The part after `#join=` in an invite link. It holds the secret, so it never leaves the fragment. */
export const encodeInvite = (v: Vault) => b64url(JSON.stringify({ u: v.url, p: v.path, b: v.bearer, k: v.key }));

export function decodeInvite(text: string): Vault {
  const code = text.includes('join=') ? text.slice(text.indexOf('join=') + 5).split(/[&\s]/)[0] : text.trim();
  try {
    const j = JSON.parse(unb64url(code)) as { u: string; p: string; b: string; k: string };
    if (!/^https?:\/\//.test(j.u) || !/^\/v\/[0-9a-f]{32}$/.test(j.p) || !/^[0-9a-f]{64}$/.test(j.b) || !j.k) throw new Error();
    return { url: base(j.u), path: j.p, bearer: j.b, key: j.k };
  } catch {
    throw new Error('invite');
  }
}

const aes = (raw: string) => crypto.subtle.importKey('raw', unb64(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);

export async function encrypt(v: Vault, data: SyncData): Promise<{ iv: string; blob: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(v.key), te.encode(JSON.stringify(data))));
  return { iv: b64(iv), blob: b64(ct) };
}

export async function decrypt(v: Vault, iv: string, blob: string): Promise<SyncData> {
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await aes(v.key), unb64(blob));
    const d = JSON.parse(td.decode(pt)) as Partial<SyncData>;
    return { dogs: d.dogs ?? [], tasks: d.tasks ?? [], logs: d.logs ?? [], tombstones: d.tombstones ?? {} };
  } catch {
    throw new Error('Could not decrypt the synced data');
  }
}

// ---- merge -----------------------------------------------------------------------------------------------

/** The newer record wins; on a tie the larger JSON wins, so every device picks the same one and they converge. */
function newer<T extends { updatedAt: string }>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

function byId<T extends { id: string; updatedAt: string }>(a: T[], b: T[]): T[] {
  const out = new Map<string, T>();
  for (const x of [...a, ...b]) {
    const cur = out.get(x.id);
    out.set(x.id, cur ? newer(cur, x) : x);
  }
  return [...out.values()];
}

/** Drops anything whose dog or task is gone. */
export function prune(d: SyncData): SyncData {
  const dogs = new Set(d.dogs.map((x) => x.id));
  const tasks = new Set(d.tasks.map((x) => x.id));
  return { ...d, logs: d.logs.filter((l) => dogs.has(l.dogId) && tasks.has(l.taskId)) };
}

/** Commutative and idempotent: merge(a, b) equals merge(b, a), so two phones always end up identical. */
export function mergeData(a: SyncData, b: SyncData): SyncData {
  const tombstones: Record<string, string> = { ...a.tombstones };
  for (const [id, at] of Object.entries(b.tombstones)) if (!tombstones[id] || at > tombstones[id]) tombstones[id] = at;
  // A deletion beats a record unless the record was edited after it was deleted.
  const alive = <T extends { id: string; updatedAt: string }>(x: T) => !tombstones[x.id] || x.updatedAt > tombstones[x.id];
  const dogs = byId(a.dogs, b.dogs).filter(alive);
  const tasks = byId(a.tasks, b.tasks).filter(alive);
  const logs = byId(a.logs, b.logs).filter(alive);
  return prune({ dogs, tasks, logs, tombstones });
}

/** Stable form for comparing two datasets regardless of ordering. */
export function canon(d: SyncData): string {
  const sortBy = <T extends { id: string }>(xs: T[]) => [...xs].sort((p, q) => p.id.localeCompare(q.id));
  return JSON.stringify({ d: sortBy(d.dogs), t: sortBy(d.tasks), l: sortBy(d.logs), x: Object.entries(d.tombstones).sort() });
}

// ---- network ---------------------------------------------------------------------------------------------

const headers = (v: Vault) => ({ Authorization: `Bearer ${v.bearer}`, 'Content-Type': 'application/json' });
const denied = () => new SyncAuthError('The server does not accept this device. Leave the household and join again.');

interface Remote { rev: number; iv: string; blob: string }

async function fetchRemote(v: Vault): Promise<Remote | null> {
  const res = await fetch(`${v.url}${v.path}`, { headers: headers(v) });
  if (res.status === 404) return null;
  if (res.status === 401) throw denied();
  if (!res.ok) throw new Error(`Sync server error ${res.status}`);
  return (await res.json()) as Remote;
}

export async function pull(v: Vault): Promise<{ rev: number; data: SyncData } | null> {
  const r = await fetchRemote(v);
  return r ? { rev: r.rev, data: await decrypt(v, r.iv, r.blob) } : null;
}

type PushResult = { ok: true; rev: number } | { ok: false };

export async function push(v: Vault, data: SyncData, ifRev: number): Promise<PushResult> {
  const body = await encrypt(v, data);
  const res = await fetch(`${v.url}${v.path}?ifRev=${ifRev}`, { method: 'PUT', headers: headers(v), body: JSON.stringify(body) });
  if (res.status === 409) return { ok: false };
  if (res.status === 401) throw denied();
  if (!res.ok) throw new Error(`Sync server error ${res.status}`);
  return { ok: true, rev: ((await res.json()) as { rev: number }).rev };
}

/**
 * One full sync: fetch the remote copy, merge it with `local`, and upload if the result differs from the remote.
 * If the other phone uploads in between, the server answers 409 and the whole thing is retried.
 */
export async function syncOnce(v: Vault, local: SyncData): Promise<{ data: SyncData; rev: number; pushed: boolean }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const remote = await pull(v);
    const data = remote ? mergeData(local, remote.data) : prune(local);
    if (remote && canon(data) === canon(remote.data)) return { data, rev: remote.rev, pushed: false };
    const res = await push(v, data, remote?.rev ?? 0);
    if (res.ok) return { data, rev: res.rev, pushed: true };
    local = data;
  }
  throw new Error('Sync kept conflicting, try again in a moment');
}

/** WebSocket address for live updates, with the token passed as a subprotocol so it stays out of the URL. */
export const liveUrl = (v: Vault) => `${v.url.replace(/^http/, 'ws')}${v.path}/ws`;
export const liveProtocols = (v: Vault) => [`bearer.${v.bearer}`];
