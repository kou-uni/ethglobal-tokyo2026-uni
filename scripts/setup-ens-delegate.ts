/** Local wallet demo. The delegate key exists only in the browser session. */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { createPublicClient, http, isAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { prepareDelegation, verifyDelegationProof, type DelegationDeployment } from '../src/adapters/ens-delegation-proof.js';

const origin = 'http://127.0.0.1:4177';
const source = JSON.parse(readFileSync(new URL('../config/ens-suggestions.json', import.meta.url), 'utf8'));
const deployed = JSON.parse(readFileSync(new URL('../config/ens-deployment.json', import.meta.url), 'utf8'));
const deployment: DelegationDeployment = { ...deployed, registry: source.registry.value, rpc: source.rpc.value };
const client = createPublicClient({ chain: sepolia, transport: http(deployment.rpc, { timeout: 15000, retryCount: 0 }) });
const bundle = await build({
  entryPoints: [new URL('../setup/ens-delegate.ts', import.meta.url).pathname],
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', write: false, minify: true,
});
const js = bundle.outputFiles[0]!.contents;
const page = readFileSync(new URL('../setup/ens-delegate.html', import.meta.url));

createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${new URL(deployment.rpc).origin}; frame-ancestors 'none'`);
  if (req.headers.host !== new URL(origin).host) { res.writeHead(403); res.end(); return; }
  if (req.method === 'GET' && req.url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(page); return;
  }
  if (req.method === 'GET' && req.url === '/app.js') {
    res.setHeader('Content-Type', 'text/javascript'); res.end(js); return;
  }
  if (req.method === 'GET' && req.url === '/config') {
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(deployment)); return;
  }
  if (req.method !== 'POST' || req.headers.origin !== origin || !['/plan', '/verify'].includes(req.url ?? '')) {
    res.writeHead(403); res.end(); return;
  }
  try {
    let raw = '';
    for await (const chunk of req) {
      raw += String(chunk); if (raw.length > 4096) throw new Error('Body too large');
    }
    const body = JSON.parse(raw);
    if (typeof body.delegate !== 'string' || !isAddress(body.delegate)) throw new Error('Invalid delegate');
    let result;
    if (req.url === '/plan') {
      result = await prepareDelegation(client, deployment, body.delegate);
    } else {
      if (typeof body.value !== 'string' || !Array.isArray(body.hashes)
        || body.hashes.some((h: unknown) => typeof h !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(h))) {
        throw new Error('Invalid proof');
      }
      result = await verifyDelegationProof(client, deployment, {
        delegate: body.delegate, value: body.value, hashes: body.hashes,
      });
      const dir = new URL('../docs/build/evidence/', import.meta.url);
      mkdirSync(dir, { recursive: true });
      writeFileSync(new URL('ens-delegation.json', dir), JSON.stringify(result, null, 2) + '\n');
    }
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result));
  } catch (error) {
    const phase = req.url === '/plan' ? '準備' : '署名済み取引の照合';
    // Inputs contain only public addresses/transactions. Never log the request body.
    const reason = error instanceof Error ? error.message.slice(0, 600) : 'Unknown verification error';
    console.error(`[ENS delegation: ${phase}] ${reason}`);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `${phase}で確認が止まりました。取引を追加送信せず、この画面のままお知らせください。原因: ${reason}`,
    }));
  }
}).listen(4177, '127.0.0.1', () => console.log(`ENS delegation demo: ${origin}`));
