/**
 * x402 — settlement over HTTP 402, against a real facilitator.
 *
 * **Nothing about the network, the asset or the facilitator is written here.** They are read
 * from configuration, because every one of them is a thing we would otherwise have guessed —
 * and `npm run verify` fails the build if an address or an endpoint appears in source.
 *
 * What the protocol actually is, confirmed against the live facilitator rather than an
 * article: see `docs/knowledge/X402-ONCHAIN.md`. The short version is that the published
 * `x402` npm package still speaks v1 (`X-PAYMENT`), while the deployed facilitator answers
 * `x402Version: 2` — so we build on `@x402/core`, which is v2, and whose only dependency is
 * zod.
 */

import { HTTPFacilitatorClient } from '@x402/core/http';
import type {
  PaymentRequirement,
  SettlementPort,
  SettlementResult,
} from '../ports/settlement.js';

export interface X402Config {
  /** The facilitator that verifies and broadcasts. */
  facilitatorUrl: string;
  /** CAIP-2. Must be one the facilitator lists as supported. */
  network: string;
  /** Token contract. */
  asset: string;
  /** Where the seller is paid. */
  payTo: string;
  /** EIP-712 domain of the token, needed to reconstruct the signed message. */
  assetName: string;
  assetVersion: string;
  /** Atomic token units per one unit of the price quoted in a request. */
  atomicPerUnit: number;
  maxTimeoutSeconds: number;
}

/** The scheme we accept. `upto` and `batch-settlement` exist; we do not use them. */
const SCHEME = 'exact';

export class X402Settlement implements SettlementPort {
  readonly live = true;
  private readonly facilitator: HTTPFacilitatorClient;

  constructor(private readonly config: X402Config) {
    this.facilitator = new HTTPFacilitatorClient({ url: config.facilitatorUrl });
  }

  /**
   * Confirms the facilitator actually supports the scheme and network we are configured for.
   *
   * Called at startup rather than at the first payment, because "the demo failed in front of
   * a judge because the network string was wrong" is a failure we can move to boot time.
   */
  async assertSupported(): Promise<void> {
    const supported = (await this.facilitator.getSupported()) as {
      kinds?: { x402Version?: number; scheme?: string; network?: string }[];
    };
    const ok = (supported.kinds ?? []).some(
      (k) => k.scheme === SCHEME && k.network === this.config.network,
    );
    if (!ok) {
      const seen = (supported.kinds ?? [])
        .map((k) => `${k.scheme}@${k.network}`)
        .join(', ');
      throw new Error(
        `facilitator does not support ${SCHEME}@${this.config.network}. It offers: ${seen}`,
      );
    }
  }

  quote(amount: number, _currency: string, payTo?: string): PaymentRequirement {
    return {
      scheme: SCHEME,
      network: this.config.network,
      // Atomic units, as a string. Rounded up so we never quote less than we charge.
      amount: String(Math.max(1, Math.ceil(amount * this.config.atomicPerUnit))),
      asset: this.config.asset,
      payTo: payTo ?? this.config.payTo,
      maxTimeoutSeconds: this.config.maxTimeoutSeconds,
      extra: {
        name: this.config.assetName,
        version: this.config.assetVersion,
        assetTransferMethod: 'eip3009',
      },
    };
  }

  check(payload: unknown, requirement: PaymentRequirement): Promise<SettlementResult> {
    return this.call('verify', payload, requirement);
  }

  settle(payload: unknown, requirement: PaymentRequirement): Promise<SettlementResult> {
    return this.call('settle', payload, requirement);
  }

  /**
   * One path for both calls, and **every failure lands on `refused`**.
   *
   * A facilitator that times out looks exactly like one that is refusing, and we are not
   * able to tell them apart — so we do the only safe thing and treat the unknown as a no.
   * The alternative is handing over data against a payment that may never have happened.
   */
  private async call(
    op: 'verify' | 'settle',
    payload: unknown,
    requirement: PaymentRequirement,
  ): Promise<SettlementResult> {
    try {
      const res = (await this.facilitator[op](payload as never, requirement as never)) as {
        isValid?: boolean;
        success?: boolean;
        transaction?: string;
        network?: string;
        payer?: string;
        /** `settle` names its refusal this way… */
        errorReason?: string;
        /** …and `verify` names it this way. Both are read, so the real cause survives. */
        invalidReason?: string;
        error?: string;
      };
      const ok = op === 'verify' ? res.isValid === true : res.success === true;
      if (!ok) {
        return {
          status: 'refused',
          reason:
            res.invalidReason ??
            res.errorReason ??
            res.error ??
            `facilitator ${op} returned no success`,
        };
      }
      return {
        status: 'settled',
        transaction: res.transaction ?? '',
        network: res.network ?? requirement.network,
        ...(res.payer ? { payer: res.payer } : {}),
      };
    } catch (e) {
      return {
        status: 'refused',
        reason: `facilitator ${op} unreachable: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
}

/** Reads the whole configuration from the environment, or reports exactly what is missing. */
export function x402FromEnv(env: NodeJS.ProcessEnv): X402Config | { missing: string[] } {
  const need = {
    facilitatorUrl: 'X402_FACILITATOR_URL',
    network: 'X402_NETWORK',
    asset: 'X402_ASSET',
    payTo: 'X402_PAYOUT_ADDRESS',
    assetName: 'X402_ASSET_NAME',
    assetVersion: 'X402_ASSET_VERSION',
  } as const;

  const missing = Object.values(need).filter((k) => !env[k]);
  if (missing.length) return { missing };

  return {
    facilitatorUrl: env[need.facilitatorUrl]!,
    network: env[need.network]!,
    asset: env[need.asset]!,
    payTo: env[need.payTo]!,
    assetName: env[need.assetName]!,
    assetVersion: env[need.assetVersion]!,
    atomicPerUnit: Number(env['X402_ATOMIC_PER_UNIT'] ?? 1),
    maxTimeoutSeconds: Number(env['X402_MAX_TIMEOUT_SECONDS'] ?? 60),
  };
}
