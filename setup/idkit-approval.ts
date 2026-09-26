import { IDKit, orbLegacy } from '@worldcoin/idkit-core';
import QRCode from 'qrcode';
const $ = (id: string) => document.getElementById(id)!;
const start = $('start') as HTMLButtonElement;
let attempt: string | undefined, generation = 0;
const status = (text: string) => { $('status').textContent = text; };
async function post(path: string, data: unknown) {
  const r = await fetch('/world-approval/' + path, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error ?? '確認できませんでした');
  return result;
}
$('cancel').onclick = async () => {
  generation++; $('connection').hidden = true;
  try { if (attempt) await post('cancel', { id: attempt }); }
  finally { attempt = undefined; start.disabled = false; status('Verification cancelled.'); }
};
start.onclick = async () => {
  const run = ++generation; start.disabled = true; $('result').textContent = '';
  try {
    status('Preparing verification for this request…');
    const c = await post('challenge', {
      requestId: new URL(location.href).searchParams.get('id'),
      snapshot: ($('snapshot') as HTMLInputElement).value,
    });
    attempt = c.id;
    const request = await IDKit.request({
      app_id: c.appId, action: c.action, rp_context: c.rp_context,
      allow_legacy_proofs: true, environment: 'production',
    }).preset(orbLegacy({ signal: c.signal }));
    if (run !== generation) return;
    const uri = new URL(request.connectorURI);
    if (uri.protocol !== 'https:' || !['world.org', 'worldcoin.org'].some(d => uri.hostname === d || uri.hostname.endsWith('.' + d))) throw new Error('認証リンクを確認できませんでした');
    ($('connect') as HTMLAnchorElement).href = uri.toString();
    await QRCode.toCanvas($('qr') as HTMLCanvasElement, uri.toString(), { width: 320, margin: 2 });
    $('connection').hidden = false; status('Scan with World App, or open World ID on your phone. A compatible Orb credential is required.');
    const completed = await request.pollUntilCompletion({ pollInterval: 1500, timeout: 110000 });
    if (run !== generation) return;
    if (!completed.success) throw new Error('Verification did not complete. This request is not approved. Please try again.');
    $('connection').hidden = true;
    status('Checking your proof and processing this request…');
    const result = await post('verify', { id: c.id, proof: completed.result });
    status(result.settlement?.settled
      ? 'Approved. World ID verified your personhood, and the payment was sent.'
      : 'Approved. World ID verified your personhood. No payment was sent.');
    $('details').hidden = false; $('result').textContent = JSON.stringify(result, null, 2);
    attempt = undefined;
  } catch (e) {
    if (run === generation) { status(e instanceof Error ? e.message : '確認できませんでした'); start.disabled = false; }
  } finally { if (run === generation) $('connection').hidden = true; }
};
