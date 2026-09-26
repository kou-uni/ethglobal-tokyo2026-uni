/** Local browser-wallet workflow. No private-key input and no server-side signing. */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createPublicClient, http, isAddress, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { loadEnv } from '../src/core/env.js';
import { createEnsSetupPlan, type SetupContracts } from '../src/adapters/ens-setup-plan.js';

loadEnv();
const origin = 'http://127.0.0.1:4176';
const host = new URL(origin).host;
const config = JSON.parse(readFileSync(new URL('../config/ens-suggestions.json', import.meta.url), 'utf8'));
const contracts: SetupContracts = {
  registrar: config.registrar.value, factory: config.factory.value,
  implementation: config.resolverImplementation.value, token: config.paymentTokens[0].value,
};
const client = createPublicClient({
  chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL ?? config.rpc.value, { timeout: 15000, retryCount: 0 }),
});
const html = readFileSync(new URL('../setup/ens.html', import.meta.url));
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.headers.host !== host) { res.writeHead(403); res.end(); return; }
  if (req.method === 'GET' && req.url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); return;
  }
  if (req.method !== 'POST' || req.url !== '/plan' || req.headers.origin !== origin) {
    res.writeHead(403); res.end(); return;
  }
  try {
    let body = '';
    for await (const chunk of req) {
      body += String(chunk);
      if (body.length > 4096) throw new Error('Body too large');
    }
    const input = JSON.parse(body) as { owner?: string; label?: string };
    if (!input.owner || !isAddress(input.owner) || typeof input.label !== 'string') throw new Error('Invalid input');
    const plan = await createEnsSetupPlan(client, contracts, {
      owner: input.owner as Address, label: input.label,
      secret: `0x${randomBytes(32).toString('hex')}`, salt: BigInt(`0x${randomBytes(32).toString('hex')}`),
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(plan));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '準備に失敗しました。名前の空き・RPC・残高を確認してください。送信は行っていません。' }));
  }
});
server.listen(4176, '127.0.0.1', () => console.log(`ENS wallet setup: ${origin}`));
