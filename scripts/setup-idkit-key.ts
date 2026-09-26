/** Dedicated proof-request signer. Print only its public address; never the key. */
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const envPath = '.env';
const name = 'WORLD_IDKIT_SIGNING_KEY';
let text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const existing = text.split('\n').find((line) => line.startsWith(`${name}=`))?.slice(name.length + 1).trim();
if (existing && !/^0x[0-9a-fA-F]{64}$/.test(existing)) throw new Error('Existing IDKit key has an invalid format; left unchanged');
const key = existing as `0x${string}` | undefined ?? generatePrivateKey();
if (!existing) {
  text = `${text.trimEnd()}\n${name}=${key}\n`;
  writeFileSync(envPath, text, { mode: 0o600 });
}
chmodSync(envPath, 0o600);
console.log(JSON.stringify({
  signerAddress: privateKeyToAccount(key).address,
  keyStored: '.env (gitignored, 0600)',
  purpose: 'World ID proof requests only; do not fund this signer',
}, null, 2));
