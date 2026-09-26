/**
 * What the live screening client is allowed to do to us.
 *
 * The provider is not under test — the mapping is. Every one of these pins the same
 * property: **nothing that is not an explicit, recognised, low-enough score becomes a
 * pass.** The recorded bodies below are the real ones, copied from the probe on 2026-09-26
 * (`docs/build/evidence/intercepta-live.json`), so the parser is tested against what the API
 * actually sends rather than against what we imagine it sends.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CACHE_MS, InterceptaScreening, interceptaFromEnv } from './intercepta.js';

const CONFIG = {
  apiKey: 'k',
  baseUrl: 'https://example.invalid',
  scanPath: '/scan/{address}/quick',
  authHeader: 'x-api-key',
};

const CLEAN = '0x' + 'a'.repeat(40);
const DIRTY = '0x' + 'b'.repeat(40);

/** Recorded: an ordinary mainnet wallet on quick-scan. */
const ORDINARY = { toxicScore: 0, traits: [] };

/** Recorded: an OFAC-sanctioned exploiter on quick-scan, trimmed to two of its three traits. */
const SANCTIONED = {
  toxicScore: 100,
  traits: [
    {
      risk: 100,
      name: 'sanction_address',
      description:
        'The address is officially listed as sanctioned and poses significant legal and financial risks.',
    },
    { risk: 100, name: 'blacklist', description: 'The address appears on external or internal blacklist sources.' },
  ],
};

/** Recorded: a contract address. This endpoint is account-scoped, so it does not exist here. */
const NOT_AN_EOA = {
  status: 404,
  errors: [{ message: "An Externally Owned Account with this address doesn't exist." }],
};

const replies = (...responses: { ok?: boolean; status?: number; body: unknown }[]) => {
  const mock = vi.fn();
  for (const r of responses) {
    mock.mockResolvedValueOnce({
      ok: r.ok ?? true,
      status: r.status ?? 200,
      json: async () => r.body,
    } as never);
  }
  return mock;
};

afterEach(() => vi.unstubAllGlobals());

describe('the mapping onto clean / flagged / unavailable', () => {
  it('clears an ordinary wallet', async () => {
    vi.stubGlobal('fetch', replies({ body: ORDINARY }));
    await expect(new InterceptaScreening(CONFIG).scan(CLEAN)).resolves.toBe('clean');
  });

  it('flags a sanctioned address', async () => {
    vi.stubGlobal('fetch', replies({ body: SANCTIONED }));
    await expect(new InterceptaScreening(CONFIG).scan(DIRTY)).resolves.toBe('flagged');
  });

  /**
   * The trap worth a test of its own.
   *
   * A sanctioned *contract* 404s here, and a 404 is the answer that most looks like "nothing
   * wrong with it". An address this API cannot speak about is not an address it cleared.
   */
  it('does not clear an address the API has never heard of', async () => {
    vi.stubGlobal('fetch', replies({ ok: false, status: 404, body: NOT_AN_EOA }));
    await expect(new InterceptaScreening(CONFIG).scan(DIRTY)).resolves.toBe('unavailable');
  });

  it('keeps a low score from being a refusal — incidental exposure is not a reason to stop a payment', async () => {
    vi.stubGlobal('fetch', replies({
      body: {
        toxicScore: 0.04,
        traits: [{ risk: 0.04, name: 'non_kyc_transfers', description: 'Engaging with exchanges that lack KYC.' }],
      },
    }));
    await expect(new InterceptaScreening(CONFIG).scan(CLEAN)).resolves.toBe('clean');
  });

  it('flags on the worst trait even if the top-level score disagrees', async () => {
    vi.stubGlobal('fetch', replies({
      body: { toxicScore: 0, traits: [{ risk: 100, name: 'sanction_address', description: 'Sanctioned.' }] },
    }));
    await expect(new InterceptaScreening(CONFIG).scan(DIRTY)).resolves.toBe('flagged');
  });
});

describe('every failure is unavailable, and unavailable is never a pass', () => {
  const failures: [string, () => void][] = [
    ['an authentication failure', () => vi.stubGlobal('fetch', replies({ ok: false, status: 403, body: {} }))],
    ['the rate limit', () => vi.stubGlobal('fetch', replies({ ok: false, status: 429, body: {} }))],
    ['the provider being down', () => vi.stubGlobal('fetch', replies({ ok: false, status: 503, body: {} }))],
    ['a body that is not JSON', () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => { throw new Error('unexpected token'); },
    } as never))],
    ['a shape with no score in it', () => vi.stubGlobal('fetch', replies({ body: { verdict: 'clean' } }))],
    ['a score that is not a number', () => vi.stubGlobal('fetch', replies({ body: { toxicScore: 'low' } }))],
    ['the network refusing the connection', () => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED') as never))],
    ['the request timing out', () => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError') as never))],
  ];

  it.each(failures)('%s', async (_label, stub) => {
    stub();
    await expect(new InterceptaScreening(CONFIG).scan(CLEAN)).resolves.toBe('unavailable');
  });

  it('never throws, so rule 4 makes the fail-closed decision itself', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom') as never));
    await expect(new InterceptaScreening(CONFIG).scan(CLEAN)).resolves.toBeDefined();
  });

  it('will not call the API with something that is not an address', async () => {
    const fetchMock = replies({ body: ORDINARY });
    vi.stubGlobal('fetch', fetchMock);
    await expect(new InterceptaScreening(CONFIG).scan('')).resolves.toBe('unavailable');
    await expect(new InterceptaScreening(CONFIG).scan('0xSANCTIONED_FIXTURE')).resolves.toBe('unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('what it says, and where the words come from', () => {
  it('quotes the provider rather than explaining on its behalf', async () => {
    vi.stubGlobal('fetch', replies({ body: SANCTIONED }));
    const port = new InterceptaScreening(CONFIG);
    await port.scan(DIRTY);
    expect(port.reasonFor(DIRTY)).toBe(
      'sanction_address — The address is officially listed as sanctioned and poses significant legal and financial risks.',
    );
  });

  it('still refuses when there is nothing to quote', async () => {
    vi.stubGlobal('fetch', replies({ body: { toxicScore: 100, traits: [] } }));
    const port = new InterceptaScreening(CONFIG);
    expect(await port.scan(DIRTY)).toBe('flagged');
    expect(port.reasonFor(DIRTY)).toMatch(/100/);
  });

  it('says why it could not answer, so a deny is diagnosable', async () => {
    vi.stubGlobal('fetch', replies({ ok: false, status: 404, body: NOT_AN_EOA }));
    const port = new InterceptaScreening(CONFIG);
    await port.scan(DIRTY);
    expect(port.reasonFor(DIRTY)).toMatch(/404/);
  });
});

describe('the request it sends', () => {
  it('puts the key in the confirmed header and the address in the configured path', async () => {
    const fetchMock = replies({ body: ORDINARY });
    vi.stubGlobal('fetch', fetchMock);
    await new InterceptaScreening(CONFIG).scan(CLEAN);
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(url).toBe(`https://example.invalid/scan/${CLEAN}/quick`);
    expect(init.headers['x-api-key']).toBe('k');
  });
});

describe('the short memory', () => {
  it('does not spend the key twice on the same address in the same minute', async () => {
    const fetchMock = replies({ body: ORDINARY }, { body: ORDINARY });
    vi.stubGlobal('fetch', fetchMock);
    const port = new InterceptaScreening(CONFIG);
    await port.scan(CLEAN);
    await port.scan(CLEAN);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks again once the verdict is stale', async () => {
    const fetchMock = replies({ body: ORDINARY }, { body: SANCTIONED });
    vi.stubGlobal('fetch', fetchMock);
    let t = 0;
    const port = new InterceptaScreening(CONFIG, () => t);
    expect(await port.scan(CLEAN)).toBe('clean');
    t += CACHE_MS + 1;
    expect(await port.scan(CLEAN)).toBe('flagged');
  });

  /** An outage must not keep answering after the service comes back. */
  it('never reuses unavailable', async () => {
    const fetchMock = replies({ ok: false, status: 503, body: {} }, { body: ORDINARY });
    vi.stubGlobal('fetch', fetchMock);
    const port = new InterceptaScreening(CONFIG);
    expect(await port.scan(CLEAN)).toBe('unavailable');
    expect(await port.scan(CLEAN)).toBe('clean');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('configuration', () => {
  it('is wired only when every piece of it is there', () => {
    const full = {
      INTERCEPTA_API_KEY: 'k',
      INTERCEPTA_BASE_URL: 'https://example.invalid',
      INTERCEPTA_SCAN_PATH: '/scan/{address}',
      INTERCEPTA_AUTH_HEADER: 'x-api-key',
    };
    expect(interceptaFromEnv(full)).toBeDefined();
    for (const key of Object.keys(full)) {
      expect(interceptaFromEnv({ ...full, [key]: '' })).toBeUndefined();
    }
  });

  it('is not wired by a path that asks about no address at all', () => {
    expect(
      interceptaFromEnv({
        INTERCEPTA_API_KEY: 'k',
        INTERCEPTA_BASE_URL: 'https://example.invalid',
        INTERCEPTA_SCAN_PATH: '/scan/',
        INTERCEPTA_AUTH_HEADER: 'x-api-key',
      }),
    ).toBeUndefined();
  });
});
