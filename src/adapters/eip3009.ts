/**
 * Signing an x402 payment as the demo buyer.
 *
 * This exists so a visitor can finish the loop **with their own wallet on the receiving end**
 * without having to be an agent themselves: they hand over an address, our funded buyer signs
 * an authorization payable to it, and the transfer happens the moment they approve.
 *
 * Two things this deliberately does not do:
 *
 * - **It never broadcasts.** A signature moves nothing. Settlement goes through the
 *   facilitator, and only from the one place that runs after a verified yes.
 * - **It signs for exactly one destination and amount**, both taken from the requirement the
 *   server itself quoted. Nothing downstream can raise either — not the facilitator, and not
 *   this code.
 */

import { privateKeyToAccount } from 'viem/accounts';
import type { PaymentRequirement } from '../ports/settlement.js';

/** `eip155:84532` → 84532. Anything else is refused rather than guessed at. */
export function chainIdOf(network: string): number {
  const [ns, ref] = network.split(':');
  if (ns !== 'eip155') throw new Error(`can only sign for eip155, not ${network}`);
  const id = Number(ref);
  if (!Number.isInteger(id)) throw new Error(`not a chain id: ${network}`);
  return id;
}

export interface SignedPayment {
  x402Version: 2;
  resource: { url: string; description: string; mimeType: string };
  accepted: PaymentRequirement;
  payload: { signature: string; authorization: Record<string, string> };
}

export async function signAuthorization(opts: {
  privateKey: string;
  requirement: PaymentRequirement;
  /** The authorization must still be valid at the last second the request can be answered. */
  validBeforeMs: number;
  resourceUrl: string;
  now?: () => Date;
  /** Optional server-issued nonce for a separately bound fee authorization. */
  nonce?: `0x${string}`;
}): Promise<SignedPayment> {
  if (opts.nonce && !/^0x[0-9a-fA-F]{64}$/.test(opts.nonce)) throw new Error('invalid authorization nonce');
  const account = privateKeyToAccount(opts.privateKey as `0x${string}`);
  const nowMs = (opts.now ?? (() => new Date()))().getTime();

  const authorization = {
    from: account.address,
    to: opts.requirement.payTo as `0x${string}`,
    value: BigInt(opts.requirement.amount),
    // A minute back, so a small clock difference between us and the chain cannot invalidate it.
    validAfter: BigInt(Math.floor(nowMs / 1000) - 60),
    // Rounded up, plus slack: expiring on the exact second of the deadline is a coin flip.
    validBefore: BigInt(Math.ceil(opts.validBeforeMs / 1000) + 60),
    nonce: opts.nonce ?? `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')}` as `0x${string}`,
  };

  const signature = await account.signTypedData({
    domain: {
      name: String(opts.requirement.extra?.['name'] ?? 'USDC'),
      version: String(opts.requirement.extra?.['version'] ?? '2'),
      chainId: chainIdOf(opts.requirement.network),
      verifyingContract: opts.requirement.asset as `0x${string}`,
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: authorization,
  });

  return {
    x402Version: 2,
    resource: {
      url: opts.resourceUrl,
      description: 'Human-origin data, sold by the person it came from',
      mimeType: 'application/json',
    },
    accepted: opts.requirement,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value.toString(),
        validAfter: authorization.validAfter.toString(),
        validBefore: authorization.validBefore.toString(),
        nonce: authorization.nonce,
      },
    },
  };
}

/** Wallet addresses only, and only in the form we will actually sign to. */
export function isAddress(s: string): s is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(s.trim());
}
