/**
 * The live payment screening behind rule 4.
 *
 * Rule 4 is the only `deny` in the router that is not about permission: the grant is valid,
 * the category is allowed, the amount is fine — and the payment still does not go, because of
 * **where the money would come from.** A licence and a payment are different layers, and one
 * can fail while the other holds. Everything below exists to make that sentence true against a
 * live API instead of a stand-in.
 *
 * ## What the API actually returns
 *
 * Confirmed by calling it on 2026-09-26, not read from documentation. Raw bodies are in
 * `docs/build/evidence/intercepta-live.json`.
 *
 *   ordinary wallet        200  {"toxicScore":0,"traits":[]}
 *   sanctioned exploiter   200  {"toxicScore":100,"traits":[{"risk":100,"name":"sanction_address",
 *                                "description":"The address is officially listed as sanctioned…"},…]}
 *   a contract address     404  {"errors":[{"message":"An Externally Owned Account with this
 *                                address doesn't exist."}]}
 *
 * **There is no field called `clean` or `flagged`.** What comes back is a score and a list of
 * traits, so the mapping onto `ScreeningResult` is a threshold *we* choose and have to defend —
 * see `DENY_AT`. The words shown to a person are the provider's own `description`, never ours.
 *
 * ## What it is not
 *
 * Not a sanctions oracle. A sanctioned Tornado Cash router came back `toxicScore: 0` on both
 * endpoints during the probe, and a sanctioned contract 404s because this endpoint is
 * account-scoped. A verdict here is **one input to a routing decision** — not a judgement
 * about a person, the accuracy of their data, or the legality of a transaction.
 */

import type { ScreeningResult } from '../core/types.js';
import type { ScreeningPort } from '../ports/screening.js';

export interface InterceptaConfig {
  apiKey: string;
  /** Host only. Comes from `config/intercepta-suggestions.json` by way of `.env`. */
  baseUrl: string;
  /** Contains `{address}`. Which scan endpoint we use is a configuration decision, not a literal. */
  scanPath: string;
  /** `x-api-key`. Confirmed: every other header name we tried answered 403. */
  authHeader: string;
  timeoutMs?: number;
  /** How long a verdict may be reused for the same address. See `CACHE_MS`. */
  cacheMs?: number;
}

/**
 * The line between "risky enough to stop a payment" and "not".
 *
 * This is ours, and it is a judgement, so here is the whole of it. The observed scale runs
 * 0–100 and the two ends are not close together:
 *
 *   100    `sanction_address`, `known_scammer`, `blacklist` — confirmed attribution
 *    85    `sanction_address_communication` — this wallet has transacted with a sanctioned one
 *     0.04 `non_kyc_transfers` on an ordinary wallet — incidental exposure, on the deep scan
 *
 * 50 sits in the empty middle of everything we have actually seen. It is high enough that
 * *"this wallet has touched an exchange without KYC"* does not stop anyone getting paid, and
 * low enough that *"this wallet is on a sanctions list"* always does. It deliberately also
 * stops **contact with a sanctioned address at 85**, which is the one genuinely arguable call
 * here: that is exposure rather than attribution, and we would rather refuse a payment we
 * could have made than settle one we could not explain.
 *
 * The honest caveat: this was set against a handful of addresses, so the line can be wrong in
 * either direction. It is a constant rather than an environment variable because a threshold
 * that moves per deployment is a threshold nobody can check.
 */
export const DENY_AT = 50;

/**
 * How long the same address may reuse a verdict. Short on purpose.
 *
 * The sandbox key is 1,000 requests for the whole judging period, and the seeded night throws
 * 52 requests at the server in a few seconds. Without this, one demo run would spend 5% of the
 * key on the same two addresses. A verdict is still a live verdict — it is just not re-fetched
 * twice in the same minute, and **only `clean` and `flagged` are remembered. `unavailable` is
 * never cached**, so an outage never keeps answering after the service comes back.
 */
export const CACHE_MS = 60_000;

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const MAX_REMEMBERED = 500;

interface Trait {
  risk?: unknown;
  name?: unknown;
  description?: unknown;
}

interface Remembered {
  at: number;
  result: ScreeningResult;
  reason?: string;
}

export class InterceptaScreening implements ScreeningPort {
  private readonly seen = new Map<string, Remembered>();

  constructor(
    private readonly config: InterceptaConfig,
    private readonly clock: () => number = Date.now,
  ) {}

  /**
   * Every failure path returns `unavailable` — timeout, non-200, a body we cannot parse, a
   * shape we do not recognise, an input that is not an address at all.
   *
   * It never throws. Rule 4 has to make the fail-closed decision explicitly rather than
   * inherit it from an exception, and `unavailable` is not a pass anywhere: no branch here,
   * and no configuration flag, can turn it into one.
   */
  async scan(address: string): Promise<ScreeningResult> {
    // Not an address. There is nothing to ask about, so there is nothing we can clear.
    if (!ADDRESS.test(address)) {
      this.remember(address, { at: this.clock(), result: 'unavailable', reason: 'not an address this API can be asked about' });
      return 'unavailable';
    }

    const key = address.toLowerCase();
    const fresh = this.seen.get(key);
    if (fresh && fresh.result !== 'unavailable' && this.clock() - fresh.at < (this.config.cacheMs ?? CACHE_MS)) {
      return fresh.result;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 10_000);
    try {
      const res = await fetch(this.url(address), {
        headers: { [this.config.authHeader]: this.config.apiKey },
        signal: controller.signal,
      });

      /*
       * 404 means "this API has never heard of that account" — which is what it answers for a
       * contract, including a sanctioned one. **An address it cannot speak about is not an
       * address it cleared**, so this lands with every other failure.
       */
      if (!res.ok) {
        return this.unavailable(key, `the screening API answered ${res.status}`);
      }

      const body = (await res.json()) as { toxicScore?: unknown; traits?: unknown };
      const score = typeof body.toxicScore === 'number' && Number.isFinite(body.toxicScore)
        ? body.toxicScore
        : undefined;
      if (score === undefined) {
        return this.unavailable(key, 'the screening API answered in a shape we do not recognise');
      }

      const traits: Trait[] = Array.isArray(body.traits) ? (body.traits as Trait[]) : [];
      const worst = traits
        .filter((t) => typeof t.risk === 'number' && Number.isFinite(t.risk))
        .sort((a, b) => (b.risk as number) - (a.risk as number))[0];
      const risk = Math.max(score, typeof worst?.risk === 'number' ? worst.risk : 0);

      if (risk >= DENY_AT) {
        // The provider's own sentence. We do not write our own account of why an address is flagged.
        const said = typeof worst?.description === 'string' ? worst.description : undefined;
        const named = typeof worst?.name === 'string' ? worst.name : undefined;
        const reason = said
          ? `${named ? `${named} — ` : ''}${said}`
          : `the screening API scored this address ${risk}`;
        this.remember(key, { at: this.clock(), result: 'flagged', reason });
        return 'flagged';
      }

      this.remember(key, { at: this.clock(), result: 'clean', reason: `screened, ${risk} out of 100` });
      return 'clean';
    } catch (e) {
      return this.unavailable(key, `the screening API could not be reached: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * What the provider said about the address we last asked about.
   *
   * Optional on the port, and rule 4's decision never depends on it: the verdict decides, and
   * this only supplies the words shown to whoever reads the refusal.
   */
  reasonFor(address: string): string | undefined {
    return this.seen.get(address.toLowerCase())?.reason ?? this.seen.get(address)?.reason;
  }

  private url(address: string): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}${this.config.scanPath.replace('{address}', address)}`;
  }

  private unavailable(key: string, reason: string): ScreeningResult {
    this.remember(key, { at: this.clock(), result: 'unavailable', reason });
    return 'unavailable';
  }

  private remember(key: string, entry: Remembered): void {
    // Bounded: a long-running server must not accumulate one entry per address ever asked about.
    if (this.seen.size >= MAX_REMEMBERED) {
      const oldest = this.seen.keys().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    this.seen.delete(key);
    this.seen.set(key, entry);
  }
}

/**
 * Wired only when every piece of it is present.
 *
 * A half-configured screening client would be worse than none: it would answer `unavailable`
 * to everything and deny every request, with nothing in `/health` to explain why. With
 * anything missing we keep the stand-in and keep reporting `screening: false` — a server that
 * cannot screen should say so.
 */
export function interceptaFromEnv(env: NodeJS.ProcessEnv): InterceptaConfig | undefined {
  const apiKey = env['INTERCEPTA_API_KEY'];
  const baseUrl = env['INTERCEPTA_BASE_URL'];
  const scanPath = env['INTERCEPTA_SCAN_PATH'];
  const authHeader = env['INTERCEPTA_AUTH_HEADER'];
  if (!apiKey || !baseUrl || !scanPath || !authHeader) return undefined;
  // Without the placeholder we would ask about no address at all, which must not look configured.
  if (!scanPath.includes('{address}')) return undefined;
  return { apiKey, baseUrl, scanPath, authHeader };
}
