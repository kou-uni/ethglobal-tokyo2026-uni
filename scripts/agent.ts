/**
 * A demo agent that actually pays.
 *
 * This is the customer. It posts a request the way the five-field schema says to, and then
 * does what the x402 spec says to do with the answer:
 *
 *   - **402** → sign an EIP-3009 authorization for exactly what was quoted, retry, get the data
 *   - **202** → the request was held for a person. Sign an authorization that outlives the
 *     deadline and hand it over anyway. **It moves nothing while she sleeps.** If she says
 *     yes it settles; if she never answers it expires and nobody can settle it, us included
 *
 * Run it:
 *
 *   npm run agent -- routine        one ordinary request
 *   npm run agent -- sensitive      one that will be held for her
 *
 * The private key is the *agent's*, not the seller's — it is the buyer's wallet, and the
 * only thing it can do with this signature is pay the exact amount to the exact address the
 * server quoted. A facilitator cannot alter either.
 */

import { loadEnv } from '../src/core/env.js';
loadEnv();

import { privateKeyToAccount } from 'viem/accounts';
import { encodePaymentSignatureHeader, decodePaymentRequiredHeader } from '@x402/core/http';

const SERVER = process.env['AGENT_TARGET'] ?? process.env['WORLD_REDIRECT_URI']?.replace(/\/auth\/world\/callback$/, '');
const KEY = process.env['AGENT_PRIVATE_KEY'];

if (!SERVER) {
  console.error('set AGENT_TARGET (or WORLD_REDIRECT_URI) so the agent knows where to buy from');
  process.exit(1);
}

const kind = process.argv[2] === 'sensitive' ? 'sensitive' : 'routine';

const request =
  kind === 'sensitive'
    ? {
        id: `agent-${Date.now()}`,
        who: 'nozomi-labs.eth',
        what: 'health/sleep-quality',
        purpose: 'market-research',
        price: { amount: 4200, currency: 'JPYC' },
      }
    : {
        id: `agent-${Date.now()}`,
        who: 'market-research.acme.eth',
        what: 'purchase-intent/groceries',
        purpose: 'demand-estimation',
        price: { amount: 120, currency: 'JPYC' },
      };

/** Hours from now, as the deadline the authorization must outlive. */
const HOURS = Number(process.env['AGENT_DEADLINE_HOURS'] ?? 6);
const deadline = new Date(Date.now() + HOURS * 3_600_000).toISOString();

/** CAIP-2 → chain id. `eip155:84532` → 84532. */
function chainIdOf(network: string): number {
  const [ns, ref] = network.split(':');
  if (ns !== 'eip155') throw new Error(`this agent only signs for eip155, not ${network}`);
  return Number(ref);
}

interface Requirement {
  scheme: string;
  network: string;
  amount: string;
  asset: `0x${string}`;
  payTo: `0x${string}`;
  maxTimeoutSeconds: number;
  extra?: { name?: string; version?: string };
}

/**
 * Sign the transfer, without broadcasting it.
 *
 * Nothing here touches a chain. The signature authorizes exactly `value` to exactly `to`,
 * and it is only good between `validAfter` and `validBefore` — which is how the deadline
 * stops being a promise anyone has to keep.
 */
async function authorize(req: Requirement, validBeforeMs: number) {
  const account = privateKeyToAccount(KEY as `0x${string}`);
  const validAfter = BigInt(Math.floor(Date.now() / 1000) - 60);
  // Rounded up, and with a minute of slack: an authorization that expires on the exact
  // second the deadline lands is a coin flip, and losing it costs a whole demo.
  const validBefore = BigInt(Math.ceil(validBeforeMs / 1000) + 60);
  const nonce = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')}` as `0x${string}`;

  const authorization = {
    from: account.address,
    to: req.payTo,
    value: BigInt(req.amount),
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await account.signTypedData({
    domain: {
      name: req.extra?.name ?? 'USDC',
      version: req.extra?.version ?? '2',
      chainId: chainIdOf(req.network),
      verifyingContract: req.asset,
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
      url: `${SERVER}/requests`,
      description: 'Human-origin data, sold by the person it came from',
      mimeType: 'application/json',
    },
    accepted: req,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value.toString(),
        validAfter: authorization.validAfter.toString(),
        validBefore: authorization.validBefore.toString(),
        nonce,
      },
    },
  };
}

const post = (headers: Record<string, string> = {}) =>
  fetch(`${SERVER}/requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ ...request, deadline }),
  });

async function main() {
  console.log(`\n  agent → ${SERVER}`);
  console.log(`  asking for  ${request.what}  at ${request.price.amount} ${request.price.currency}`);
  console.log(`  deadline    ${deadline}\n`);

  const first = await post();
  const body = (await first.json()) as Record<string, unknown>;

  /* ── held for a person ─────────────────────────────────────────────────── */
  if (first.status === 202) {
    const accepts = (body['payment'] as { accepts?: Requirement[] })?.accepts;
    console.log(`  202 held — ${String(body['reason'] ?? '')}`);
    if (!accepts?.[0] || !KEY) {
      console.log('  no authorization sent (no key, or settlement is not wired)\n');
      return;
    }
    const payload = await authorize(accepts[0], new Date(deadline).getTime());
    const again = await post({ 'PAYMENT-SIGNATURE': encodePaymentSignatureHeader(payload as never) });
    const out = (await again.json()) as Record<string, unknown>;
    console.log(`  re-sent with an authorization → ${again.status}`);
    console.log(`  ${JSON.stringify(out['payment'] ?? out, null, 2)}\n`);
    console.log('  Nothing has moved. It settles only if she approves, and expires if she does not.\n');
    return;
  }

  /* ── payment required ──────────────────────────────────────────────────── */
  if (first.status === 402) {
    const header = first.headers.get('payment-required');
    const required = header ? (decodePaymentRequiredHeader(header) as unknown as { accepts: Requirement[] }) : { accepts: (body['accepts'] as Requirement[]) ?? [] };
    const req = required.accepts[0];
    if (!req) throw new Error('402 without anything to pay');
    if (!KEY) {
      console.log('  402 — but AGENT_PRIVATE_KEY is not set, so this agent cannot pay.\n');
      console.log(`  ${JSON.stringify(req, null, 2)}\n`);
      return;
    }
    console.log(`  402 — ${req.amount} atomic units of ${req.asset} on ${req.network}`);
    const payload = await authorize(req, Date.now() + req.maxTimeoutSeconds * 1000);
    const paid = await post({ 'PAYMENT-SIGNATURE': encodePaymentSignatureHeader(payload as never) });
    const out = (await paid.json()) as Record<string, unknown>;
    console.log(`  paid → ${paid.status}`);
    // The reason matters more than the status: "no funds" means the whole path worked and
    // only the balance did not, while a schema complaint means we built the payload wrong.
    console.log(`  ${JSON.stringify(out, null, 2)}\n`);
    return;
  }

  console.log(`  ${first.status}\n  ${JSON.stringify(body, null, 2)}\n`);
}

main().catch((e) => {
  console.error(`\n  the agent stopped: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
