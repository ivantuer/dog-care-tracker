// Google sign-in against a running server that trusts a stand-in signing key:
//   cd worker && npx wrangler dev --local --var GOOGLE_CLIENT_ID:test-client --var GOOGLE_JWKS_URL:http://localhost:8788/jwks
//   SYNC_URL=http://localhost:8787 GOOGLE_TEST=1 npm test
import { createServer } from 'node:http';
import { generateKeyPairSync, sign } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { linkGoogle, newVault, openLink, syncOnce, unlinkGoogle } from '../src/sync-core';
import { data, dog } from './helpers';

const URL_ = process.env.SYNC_URL;
const d = URL_ && process.env.GOOGLE_TEST ? describe : describe.skip;

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const b64u = (x: Buffer | string) => Buffer.from(x).toString('base64url');
const idToken = (over: Record<string, unknown> = {}, kid = 'k1') => {
  const head = b64u(JSON.stringify({ alg: 'RS256', kid }));
  const body = b64u(JSON.stringify({ iss: 'https://accounts.google.com', aud: 'test-client', exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1', email: 'Me@Example.com', email_verified: true, ...over }));
  return `${head}.${body}.${b64u(sign('sha256', Buffer.from(`${head}.${body}`), privateKey))}`;
};

let server: ReturnType<typeof createServer>;
beforeAll(async () => {
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
  server = createServer((_, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise<void>((r) => server.listen(8788, r));
});
afterAll(() => server?.close());

d('google sign-in', () => {
  it('links a household to an account, reopens it elsewhere, and rejects bad tokens', async () => {
    const vault = newVault(URL_!);
    await syncOnce(vault, data({ dogs: [dog('rex')] }));

    expect(await linkGoogle(vault, idToken())).toBe('me@example.com');

    // A second device with the same Google account gets the same household.
    const opened = await openLink(URL_!, idToken());
    expect(opened).toMatchObject({ path: vault.path, bearer: vault.bearer, key: vault.key });

    // Another account sees nothing.
    expect(await openLink(URL_!, idToken({ sub: 'user-2' }))).toBeNull();

    // Forged or invalid tokens are refused.
    await expect(openLink(URL_!, idToken({ aud: 'someone-else' }))).rejects.toThrow();
    await expect(openLink(URL_!, idToken({ exp: 1 }))).rejects.toThrow();
    await expect(openLink(URL_!, idToken({ email_verified: false }))).rejects.toThrow();
    await expect(openLink(URL_!, idToken({}, 'unknown-kid'))).rejects.toThrow();
    await expect(openLink(URL_!, idToken().slice(0, -4) + 'AAAA')).rejects.toThrow();

    // Cannot link someone else's household without its token.
    const stranger = { ...newVault(URL_!), path: vault.path };
    await expect(linkGoogle(stranger, idToken({ sub: 'user-3' }))).rejects.toThrow(/not authorized/);

    await unlinkGoogle(URL_!, idToken());
    expect(await openLink(URL_!, idToken())).toBeNull();
  });
});
