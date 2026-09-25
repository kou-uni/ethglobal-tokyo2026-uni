import { describe, expect, it } from 'vitest';
import { chooseProvider } from './provider.js';

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe('either provider, same guarantee', () => {
  it('uses Claude when its key is present', () => {
    const c = chooseProvider(env({ ANTHROPIC_API_KEY: 'x' }));
    expect(c).toMatchObject({ provider: 'claude', live: true });
  });

  it('does not invent a Claude model name either', () => {
    expect(chooseProvider(env({ ANTHROPIC_API_KEY: 'x' })).model).toMatch(/npm run models/);
  });

  it('uses OpenAI when only that key is present', () => {
    const c = chooseProvider(env({ OPENAI_API_KEY: 'x' }));
    expect(c).toMatchObject({ provider: 'openai', live: true });
  });

  it('does not invent an OpenAI model name when none is configured', () => {
    expect(chooseProvider(env({ OPENAI_API_KEY: 'x' })).model).toMatch(/npm run setup/);
  });

  it('accepts an OAuth token for Claude', () => {
    expect(chooseProvider(env({ ANTHROPIC_AUTH_TOKEN: 'x' })).provider).toBe('claude');
  });

  it('honours an explicit choice when that key exists', () => {
    const c = chooseProvider(env({ ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o', YOHAKU_PROVIDER: 'openai' }));
    expect(c.provider).toBe('openai');
  });

  it('ignores an explicit choice whose key is missing, rather than failing at call time', () => {
    const c = chooseProvider(env({ OPENAI_API_KEY: 'o', YOHAKU_PROVIDER: 'claude' }));
    expect(c.provider).toBe('openai');
  });

  it('takes the model id from the environment, for either provider', () => {
    expect(chooseProvider(env({ ANTHROPIC_API_KEY: 'x', ANTHROPIC_MODEL: 'some-model' })).model)
      .toBe('some-model');
    expect(chooseProvider(env({ OPENAI_API_KEY: 'x', OPENAI_MODEL: 'other-model' })).model)
      .toBe('other-model');
  });
});

describe('choosing does not construct a client', () => {
  it('can pick Claude without a key being present in the real environment', () => {
    // Would throw if the SDK client were built eagerly.
    expect(() => chooseProvider(env({ ANTHROPIC_API_KEY: 'x' }))).not.toThrow();
    expect(() => chooseProvider(env({ OPENAI_API_KEY: 'x' }))).not.toThrow();
  });
});

describe('no key', () => {
  it('falls back to the mock and marks itself not live', () => {
    expect(chooseProvider(env({}))).toMatchObject({ provider: 'mock', live: false });
  });

  it('never silently pretends a model ran', async () => {
    const out = await chooseProvider(env({})).create().classify({
      id: 'x', who: 'a.eth', what: 'odd', purpose: 'other',
      price: { amount: 1, currency: 'JPYC' }, deadline: '2026-09-27T00:00:00Z',
    });
    expect(out.reasoning).toMatch(/no model was called/);
  });
});
