/**
 * Yohaku — which model answers, and why it does not matter.
 *
 * Two adapters implement the same `ClassifierPort`, against the same schema. Whichever key
 * is present is the one that runs. The safety property — that there is no value meaning
 * "let this through" — lives in the schema and in `applyClassification`, **not in either
 * adapter**, so swapping providers cannot weaken it.
 *
 * That is the argument for putting a port here at all: the thing we promise a judge is
 * enforced in one place, and the model is a replaceable part behind it.
 */

import { MockClassifier, type ClassifierPort } from './classifier.js';
import { ClaudeClassifier } from '../adapters/claude-classifier.js';
import { OpenAIClassifier } from '../adapters/openai-classifier.js';

export type ProviderName = 'claude' | 'openai' | 'mock';

export interface ProviderChoice {
  provider: ProviderName;
  model: string;
  /** True only when a real model will be called. */
  live: boolean;
  /**
   * Built on demand.
   *
   * Choosing and constructing are separate because an SDK client reads the key from the
   * real environment at construction time — so eagerly building one would make the choice
   * itself fail wherever a key is absent, including in tests.
   */
  create(): ClassifierPort;
}

/**
 * Pick a provider from the environment.
 *
 * Preference order is deliberate but not load-bearing: `YOHAKU_PROVIDER` wins if set, then
 * whichever key exists. With no key it falls back to the mock **and says so** — a demo that
 * quietly used a stub would be the one dishonest thing in this repository.
 */
export function chooseProvider(env: NodeJS.ProcessEnv = process.env): ProviderChoice {
  const forced = env['YOHAKU_PROVIDER'] as ProviderName | undefined;
  const hasClaude = Boolean(env['ANTHROPIC_API_KEY'] || env['ANTHROPIC_AUTH_TOKEN']);
  const hasOpenAI = Boolean(env['OPENAI_API_KEY']);

  const pick: ProviderName =
    forced === 'claude' && hasClaude ? 'claude'
    : forced === 'openai' && hasOpenAI ? 'openai'
    : forced === 'mock' ? 'mock'
    : hasClaude ? 'claude'
    : hasOpenAI ? 'openai'
    : 'mock';

  if (pick === 'claude') {
    const model = env['ANTHROPIC_MODEL'] ?? 'claude-opus-5';
    return { provider: 'claude', model, live: true, create: () => new ClaudeClassifier(model) };
  }
  if (pick === 'openai') {
    const model = env['OPENAI_MODEL'] ?? 'gpt-4o-mini';
    return { provider: 'openai', model, live: true, create: () => new OpenAIClassifier(model) };
  }
  return { provider: 'mock', model: 'mock', live: false, create: () => new MockClassifier() };
}
