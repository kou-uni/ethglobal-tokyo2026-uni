import { IDKit, orbLegacy } from '@worldcoin/idkit-core';
import QRCode from 'qrcode';
const $ = (id: string) => document.getElementById(id)!;
const form = $('form') as HTMLFormElement;
const start = $('start') as HTMLButtonElement;
const cancel = $('cancel') as HTMLButtonElement;
const fields = $('fields') as HTMLFieldSetElement;
let attempt: string | undefined, generation = 0;
const status = (s: string) => { $('status').textContent = s; };
async function post(path: string, data: unknown) {
  const r = await fetch('/koe-registration/' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error ?? 'Registration unavailable. Nothing published.');
  return body;
}
function showProfile(profile: unknown) {
  $('published').hidden = !profile;
  $('profile').textContent = profile ? JSON.stringify(profile, null, 2) : '';
  form.hidden = Boolean(profile);
}
cancel.onclick = async () => {
  const id = attempt;
  ++generation;
  cancel.disabled = true;
  try {
    if (id) await post('cancel', { id });
    status('Verification cancelled. No new profile was published.');
  } catch { status('Could not confirm cancellation. Reload this page to check your listing.'); }
  finally { attempt = undefined; fields.disabled = false; start.disabled = false; cancel.hidden = true; $('connection').hidden = true; }
};
($('remove') as HTMLButtonElement).onclick = async () => {
  try { await post('remove', {}); ++generation; showProfile(null); fields.disabled = false; start.disabled = false; status('Your listing was removed. It is no longer in the live directory.'); }
  catch { status('Removal could not be confirmed. Please try again.'); }
};
form.onsubmit = async e => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const run = ++generation;
  const input = (id: string) => ($ (id) as HTMLInputElement).value.trim();
  const draft = { name: input('name'), headline: input('headline'), about: input('about').replace(/[\r\n]+/g, ' '), topic: input('topic'), consent: ($('consent') as HTMLInputElement).checked };
  fields.disabled = true; start.disabled = true;
  try {
    status('Preparing World verification for these exact public profile fields…');
    const c = await post('challenge', draft);
    if (run !== generation) { await post('cancel', { id: c.id }); return; }
    attempt = c.id; cancel.hidden = false; cancel.disabled = false;
    const request = await IDKit.request({ app_id: c.appId, action: c.action, rp_context: c.rp_context, allow_legacy_proofs: true, environment: 'production' }).preset(orbLegacy({ signal: c.signal }));
    if (run !== generation) return;
    const uri = new URL(request.connectorURI);
    if (uri.protocol !== 'https:' || !['world.org', 'worldcoin.org'].some(d => uri.hostname === d || uri.hostname.endsWith('.' + d))) throw new Error('Unexpected World verification link.');
    ($('connect') as HTMLAnchorElement).href = uri.toString();
    await QRCode.toCanvas($('qr') as HTMLCanvasElement, uri.toString(), { width: 320, margin: 2 });
    if (run !== generation) return;
    $('connection').hidden = false; status('Scan with World App. A compatible Orb credential is required. Nothing is published yet.');
    const completed = await request.pollUntilCompletion({ pollInterval: 1500, timeout: 110000 });
    if (run !== generation) return;
    if (!completed.success) throw new Error('World verification did not complete. No new profile was published.');
    $('connection').hidden = true; cancel.disabled = true;
    status('Checking the proof on the server before publishing…');
    const result = await post('verify', { id: c.id, proof: completed.result });
    if (run !== generation) return;
    if (result.registered !== true || !result.profile) throw new Error('Publication could not be confirmed. Reload to check your listing.');
    showProfile(result.profile); attempt = undefined;
    status('World ID verified your personhood. Your demo profile is now publicly listed for up to one hour. No payment was sent.');
  } catch (error) {
    if (run === generation) { status(error instanceof Error ? error.message : 'Registration failed. Reload to check your listing.'); fields.disabled = false; start.disabled = false; }
  } finally { if (run === generation) { $('connection').hidden = true; cancel.hidden = true; } }
};
try {
  const r = await fetch('/koe-registration/me');
  if (!r.ok) throw new Error('Registration is unavailable on this server.');
  const data = await r.json();
  const topics = $('topic') as HTMLSelectElement;
  topics.replaceChildren();
  for (const topic of data.topics) { const o = document.createElement('option'); o.value = topic.value; o.textContent = topic.label; topics.append(o); }
  start.disabled = data.topics.length === 0;
  showProfile(data.profile);
  status(data.profile ? 'Your current demo listing is below. You can remove it from this browser.' : 'Not verified yet. Review the fields and consent before publishing.');
} catch (error) { status(error instanceof Error ? error.message : 'Registration unavailable.'); }
