/**
 * Yohaku — seven nights in a row.
 *
 * The claim "her judgement moves into the router" is only worth making if it can be run.
 * This replays several nights, feeding each day's answers back in, so the fall in
 * escalations is an outcome rather than a drawing.
 */

import { applyLearned, learn, type DecisionRecord } from './decisions.js';
import { surface } from './queue.js';
import { route } from './rules.js';
import { DEMO_POLICY, MORNING, NIGHT, demoContext, generateNight } from './night.js';
import type { AgentRequest, Decision, HeldRequest, Policy } from './types.js';

/** How the owner answers when asked. Deterministic, so a week is reproducible. */
export type Answerer = (req: AgentRequest) => 'approved' | 'refused' | 'ignored';

/**
 * A plausible owner: happy to license her writing and her work history, never willing
 * to sell anything about her health. The point is not which way she leans — it is that
 * whichever way she leans, she stops being asked about it.
 */
export const defaultAnswerer: Answerer = (req) => {
  if (req.what.startsWith('health/')) return 'refused';
  if (req.what.startsWith('finance/')) return 'refused';
  return 'approved';
};

export interface DayResult {
  day: number;
  seed: number;
  arrived: number;
  auto: number;
  deny: number;
  /** How many actually reached her that morning — the number that should fall. */
  surfaced: number;
  settled: number;
  /** Requests that stopped being escalated because of what she decided earlier. */
  learnedAway: number;
}

export function runWeek(opts: {
  seeds: number[];
  policy?: Policy;
  answerer?: Answerer;
}): { days: DayResult[]; records: DecisionRecord[] } {
  const policy = opts.policy ?? DEMO_POLICY;
  const answer = opts.answerer ?? defaultAnswerer;
  const records: DecisionRecord[] = [];
  const days: DayResult[] = [];

  opts.seeds.forEach((seed, i) => {
    const ctx = demoContext(NIGHT);
    const learned = learn(records);

    let learnedAway = 0;
    const decided = generateNight(seed).map((request) => {
      const raw = route(request, policy, ctx);
      const final: Decision = applyLearned(request, raw, learned);
      if (raw.verdict === 'human' && final.verdict !== 'human') learnedAway++;
      return { request, decision: final };
    });

    const auto = decided.filter((d) => d.decision.verdict === 'auto');
    const held: HeldRequest[] = decided
      .filter((d) => d.decision.verdict === 'human')
      .map((d) => ({ ...d, heldAt: NIGHT.toISOString() }));
    const morning = surface(held, policy, MORNING);

    // She answers what actually reached her. Everything else she never saw.
    for (const b of morning.surfaced) {
      for (const h of b.requests) {
        records.push({
          who: h.request.who,
          what: h.request.what,
          outcome: answer(h.request),
          decidedAt: `day-${i + 1}`,
          escalatedBy: h.decision.rule,
        });
      }
    }

    days.push({
      day: i + 1,
      seed,
      arrived: decided.length,
      auto: auto.length,
      deny: decided.filter((d) => d.decision.verdict === 'deny').length,
      surfaced: morning.surfaced.length,
      settled: Math.round(auto.reduce((t, d) => t + d.request.price.amount, 0)),
      learnedAway,
    });
  });

  return { days, records };
}
