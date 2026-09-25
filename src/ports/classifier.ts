/**
 * Yohaku — where the model is allowed to act, and where it is not.
 *
 * Rule 9 is "nothing matched". Something arrived that the owner's policy does not describe,
 * and a deterministic rule cannot say what it is. **That is the one place judgement is
 * actually needed, so that is the one place a model runs.**
 *
 * The important part is not that a model runs. It is what the model cannot do:
 *
 *   type Suggestion = 'ask' | 'drop'
 *
 * **There is no 'pass'.** The model cannot widen access, no matter what it decides, what it
 * is told, or what an agent writes into the request to persuade it. That is not enforced by
 * asking it nicely in a prompt — the schema it answers with has no value that means yes.
 *
 * This is the concrete form of "do not make the prompt your security policy": prompt
 * injection against this classifier can, at worst, get a request **dropped**.
 */

import type { AgentRequest, Decision } from '../core/types.js';

/** What the model is allowed to say. Note what is missing. */
export type Suggestion = 'ask' | 'drop';

export interface Classification {
  /** What the model thinks is really being asked for. */
  category: string;
  sensitivity: 'routine' | 'sensitive' | 'unclear';
  /** `ask` or `drop`. Never `pass` — there is no such value. */
  suggestion: Suggestion;
  /** In its own words, shown to the owner. */
  reasoning: string;
}

export interface ClassifierPort {
  classify(req: AgentRequest): Promise<Classification>;
}

/**
 * Apply a classification to a decision the rules already made.
 *
 * Only ever runs on rule 9, and only ever moves `human` → `deny`. Every other verdict is
 * returned untouched, so a model cannot reach rule 0–4 denies or turn anything into `auto`.
 */
export function applyClassification(decision: Decision, c: Classification): Decision {
  if (decision.verdict !== 'human' || decision.rule !== 9) return decision;
  if (c.suggestion === 'drop') {
    return { verdict: 'deny', rule: 9, reason: `unrecognised and not worth asking: ${c.reasoning}` };
  }
  return { ...decision, reason: `unrecognised — ${c.reasoning}` };
}

/** Deterministic stand-in, so tests and the console run without a key or a network. */
export class MockClassifier implements ClassifierPort {
  constructor(private readonly suggestion: Suggestion = 'ask') {}
  async classify(req: AgentRequest): Promise<Classification> {
    return {
      category: req.what,
      sensitivity: 'unclear',
      suggestion: this.suggestion,
      reasoning: 'mock classifier — no model was called',
    };
  }
}
