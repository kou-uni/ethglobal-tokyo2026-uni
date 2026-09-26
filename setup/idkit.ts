import { IDKit, orbLegacy, type RpContext } from '@worldcoin/idkit-core';
import QRCode from 'qrcode';
const $ = (id: string) => document.getElementById(id)!;
const start = $('start') as HTMLButtonElement;
const status = (text: string) => { $('status').textContent = text; };
let generation = 0;
let challengeId: string | undefined;
async function post(path: string, body: unknown) {
  const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? '確認に失敗しました');
  return data;
}
const config = await (await fetch('/config')).json();
start.disabled = !config.ready;
status(config.ready ? '署名設定を確認済みです。ボタンを押すとQRコードを作ります。' : 'RPの署名設定を登録・確認してから開始します。今はまだ開始できません。');
$('cancel').onclick = async () => {
  generation++;
  const id = challengeId; challengeId = undefined;
  $('connection').hidden = true;
  try { if (id) await post('/cancel', { id }); }
  finally { start.disabled = false; status('キャンセルしました。認証成功にはしていません。'); }
};
start.onclick = async () => {
  start.disabled = true; const run = ++generation;
  $('result').textContent = ''; $('connection').hidden = true;
  try {
    status('今回だけの認証依頼を作っています…');
    const c: { id: string; signal: string; action: string; rp_context: RpContext } = await post('/challenge', {});
    challengeId = c.id;
    const request = await IDKit.request({
      app_id: config.appId, action: c.action, rp_context: c.rp_context,
      allow_legacy_proofs: true, environment: 'production',
    }).preset(orbLegacy({ signal: c.signal }));
    if (run !== generation) return;
    const uri = new URL(request.connectorURI);
    if (uri.protocol !== 'https:' || !(uri.hostname === 'world.org' || uri.hostname.endsWith('.world.org')
      || uri.hostname === 'worldcoin.org' || uri.hostname.endsWith('.worldcoin.org'))) throw new Error('認証リンクを確認できませんでした');
    ($('connect') as HTMLAnchorElement).href = uri.toString();
    await QRCode.toCanvas($('qr') as HTMLCanvasElement, uri.toString(), { width: 320, margin: 2 });
    $('connection').hidden = false;
    status('スマホのWorld AppでQRコードを読み取り、表示される認証依頼を確認してください。');
    const completion = await request.pollUntilCompletion({ pollInterval: 2000, timeout: 240000 });
    if (run !== generation) return;
    if (!completion.success) throw new Error(`認証は完了していません: ${completion.error}`);
    status('受け取った証明をWorldの本番APIで検証しています…');
    const result = await post('/verify', { id: c.id, proof: completion.result });
    if (run !== generation) return;
    $('result').textContent = JSON.stringify(result, null, 2);
    status('World本番APIで証明を検証できました。World Appが開いて操作できたかも教えてください。');
  } catch (e) {
    if (run === generation) status(e instanceof Error ? e.message : '確認できませんでした');
  } finally {
    if (run === generation) { start.disabled = false; $('connection').hidden = true; }
  }
};
