/**
 * What the decision model is allowed to do to us.
 *
 * The model itself is not under test — the shape of the question is. These pin the property
 * the whole design rests on: **no answer, however it was arrived at, can widen access.**
 */
import { describe, expect, it, vi } from 'vitest';
import { JevClassifier, jevFromEnv } from './jev.js';
import type { AgentRequest } from '../core/types.js';

const CONFIG = { apiKey: 'k', baseUrl: 'https://example.invalid/x', model: 'm' };
const REQ: AgentRequest = {
  id: 'r', who: 'a.eth', what: 'experience/why-you-put-it-back',
  purpose: 'market-research', price: { amount: 100, currency: 'JPYC' },
  deadline: '2026-09-27T00:00:00Z',
};

const reply = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body } as never);

describe('the question we ask', () => {
  it('offers exactly two options, and neither of them is an approval', async () => {
    const fetchMock = reply({ answers: { verdict: { choice: 'ask' } } });
    vi.stubGlobal('fetch', fetchMock);
    await new JevClassifier(CONFIG).classify(REQ);
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body);
    expect(Object.keys(body.questions.verdict.criteria).sort()).toEqual(['ask', 'drop']);
    expect(JSON.stringify(body)).not.toMatch(/\bpass\b/);
    vi.unstubAllGlobals();
  });

  /** LangChain's own mitigation, enforced by the request schema rather than remembered. */
  it('sends the five fields and nothing the agent wrote freely', async () => {
    const fetchMock = reply({ answers: { verdict: { choice: 'ask' } } });
    vi.stubGlobal('fetch', fetchMock);
    await new JevClassifier(CONFIG).classify(REQ);
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body);
    expect(Object.keys(body.state).sort()).toEqual(['deadline', 'price', 'purpose', 'what', 'who']);
    vi.unstubAllGlobals();
  });
});

describe('every unexpected answer is a refusal', () => {
  const cases: [string, unknown][] = [
    ['a third option it was never offered', { answers: { verdict: { choice: 'pass' } } }],
    ['an approving word', { answers: { verdict: { choice: 'allow' } } }],
    ['nothing at all', {}],
    ['an empty answer', { answers: { verdict: {} } }],
  ];
  for (const [label, body] of cases) {
    it(`drops on ${label}`, async () => {
      vi.stubGlobal('fetch', reply(body));
      const out = await new JevClassifier(CONFIG).classify(REQ);
      expect(out.suggestion).toBe('drop');
      vi.unstubAllGlobals();
    });
  }

  it('drops when the provider errors', async () => {
    vi.stubGlobal('fetch', reply({}, false));
    expect((await new JevClassifier(CONFIG).classify(REQ)).suggestion).toBe('drop');
    vi.unstubAllGlobals();
  });

  it('drops when the provider is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect((await new JevClassifier(CONFIG).classify(REQ)).suggestion).toBe('drop');
    vi.unstubAllGlobals();
  });
});

describe('a well-formed answer passes through', () => {
  it('keeps the choice and reports the probabilities it was given', async () => {
    vi.stubGlobal('fetch', reply({
      answers: {
        verdict: { choice: 'ask', confidence: 0.69, probabilities: { ask: 0.85, drop: 0.15 } },
        sensitivity: { choice: 'sensitive' },
      },
    }));
    const out = await new JevClassifier(CONFIG).classify(REQ);
    expect(out.suggestion).toBe('ask');
    expect(out.sensitivity).toBe('sensitive');
    expect(out.reasoning).toContain('ask 0.85');
    // The category is the agent's own declaration, not something a model invented.
    expect(out.category).toBe(REQ.what);
    vi.unstubAllGlobals();
  });
});

describe('jevFromEnv', () => {
  it('needs all three, and refuses to half-configure', () => {
    expect(jevFromEnv({ JEV_API_KEY: 'k' } as NodeJS.ProcessEnv)).toBeUndefined();
    expect(jevFromEnv({ JEV_API_KEY: 'k', JEV_BASE_URL: 'u', JEV_MODEL: 'm' } as NodeJS.ProcessEnv))
      .toMatchObject({ model: 'm' });
  });
});
