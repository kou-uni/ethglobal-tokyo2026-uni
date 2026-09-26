import { randomUUID, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { encodePaymentSignatureHeader } from '@x402/core/http';
import type { Store } from './state.js';

const config = JSON.parse(readFileSync(new URL('../../config/a2a.json', import.meta.url), 'utf8'));
interface IntakeResult { status: number; body: Record<string, any>; required?: unknown }
interface Conversation { id: string; context: string; request: Record<string, unknown>; result?: IntakeResult }
interface Options {
  store: Store;
  owner: string;
  origin(): string;
  paid: boolean;
  now(): Date;
  intake(body: unknown, headers: Record<string, string>): Promise<IntakeResult>;
}

/** A narrow A2A 0.3 transport over the same intake and Store as POST /requests. */
export function createA2A(options: Options) {
  const tasks = new Map<string, Conversation>();
  const messages = new Map<string, string>();
  const taskId = (messageId: string) => 'a2a-' + createHash('sha256').update(JSON.stringify([options.owner, messageId])).digest('hex');
  function recover(id: string | undefined): Conversation | undefined {
    if (!id) return undefined;
    const cached = tasks.get(id);
    if (cached) return cached;
    const entry = /^a2a-[a-f0-9]{64}$/.test(id) ? options.store.get(id) : undefined;
    if (!entry) return undefined;
    return { id, context: 'context-' + id, request: { ...entry.request },
      ...(entry.completed ? { result: { status: entry.completed.status, body: entry.completed.body } } : {}) };
  }
  function task(c: Conversation) {
    const entry = options.store.get(c.id), result = c.result;
    let state = 'working';
    const metadata: Record<string, unknown> = { 'yohaku.scope': 'routing and consent receipt; no content delivery' };
    if (entry?.resolution === 'ignored' || entry?.resolution === 'expired' || entry?.decision.verdict === 'deny'
      || (entry && !(Date.parse(entry.request.deadline) > options.now().getTime()) && !entry.resolution && !entry.settlement)) {
      state = 'rejected';
    } else if (entry?.settlement && entry.settlement !== 'not-wired') {
      state = 'completed';
      metadata['x402.payment.status'] = 'payment-completed';
      metadata['x402.payment.receipts'] = [{
        success: true, transaction: entry.settlement,
        network: entry.auth?.requirement.network ?? result?.body.settlement?.network,
        ...(entry.paymentSource ? { payer: entry.paymentSource } : {}),
      }];
    } else if ((entry?.resolution === 'approved' && entry.auth) || entry?.completed?.status === 503
      || result?.body.settlement === 'refused' || (result && result.status >= 400 && result.status !== 402 && result.status !== 409)) {
      state = 'failed';
      metadata['x402.payment.status'] = 'payment-failed';
    } else if (entry?.resolution === 'approved' || entry?.settlement === 'not-wired') {
      state = 'completed';
      metadata['yohaku.payment'] = 'nothing transferred';
    } else if (entry?.auth) {
      state = 'input-required';
      metadata['x402.payment.status'] = 'payment-verified';
      metadata['yohaku.waitingFor'] = 'owner approval';
    } else if (result?.required) {
      state = 'input-required';
      metadata['x402.payment.status'] = 'payment-required';
      metadata['x402.payment.required'] = result.required;
    } else if (entry?.decision.verdict === 'human') {
      state = 'input-required';
      metadata['yohaku.waitingFor'] = 'owner approval';
    }
    const receipt = {
      id: c.id, verdict: entry?.resolution ?? entry?.decision.verdict ?? 'deny',
      reason: entry?.decision.reason ?? result?.body.error ?? 'processing',
      ...(entry?.settlement && entry.settlement !== 'not-wired' ? { transaction: entry.settlement } : {}),
    };
    return { kind: 'task', id: c.id, contextId: c.context, status: {
      state, message: { kind: 'message', messageId: randomUUID(), taskId: c.id, contextId: c.context,
        role: 'agent', parts: [{ kind: 'data', data: receipt }], metadata },
    } };
  }
  return async (req: IncomingMessage, res: ServerResponse) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const json = (body: unknown, status = 200) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && path === '/.well-known/agent-card.json') {
      const origin = options.origin();
      json({
        protocolVersion: config.protocolVersion, name: `${options.owner} — Yohaku`,
        description: 'Routes structured requests into auto, human or deny. Returns routing and consent receipts; does not deliver personal content.',
        url: origin + '/a2a', preferredTransport: 'JSONRPC', version: '0.0.1',
        capabilities: { streaming: false, pushNotifications: false,
          ...(options.paid ? { extensions: [{ uri: config.paymentExtension, required: true, description: 'x402 payment for accepted requests' }] } : {}) },
        defaultInputModes: ['application/json'], defaultOutputModes: ['application/json'],
        skills: [{ id: 'route-request', name: 'Route a request', description: 'Supply a Yohaku request object in one data part. Poll tasks/get while the owner decides.', tags: ['routing', 'consent'] }],
      });
      return true;
    }
    if (path !== '/a2a') return false;
    let rpcId: string | number | null = null;
    const fail = (code: number, message: string) => json({ jsonrpc: '2.0', id: rpcId, error: { code, message } });
    if (req.method !== 'POST') { fail(-32600, 'Use JSON-RPC POST'); return true; }
    try {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 65536) { fail(-32600, 'Request too large'); return true; } }
      let rpc: any;
      try { rpc = JSON.parse(raw); } catch { fail(-32700, 'Parse error'); return true; }
      if (!rpc || rpc.jsonrpc !== '2.0' || (typeof rpc.id !== 'string' && typeof rpc.id !== 'number')
        || typeof rpc.method !== 'string') { fail(-32600, 'Invalid request'); return true; }
      rpcId = rpc.id;
      if (rpc.method === 'tasks/get') {
        const c = typeof rpc.params?.id === 'string' ? recover(rpc.params.id) : undefined;
        if (!c) { fail(-32001, 'Task not found'); return true; }
        json({ jsonrpc: '2.0', id: rpcId, result: task(c) }); return true;
      }
      if (rpc.method !== 'message/send') { fail(-32601, 'Method not supported'); return true; }
      if (options.paid && !String(req.headers['x-a2a-extensions'] ?? '').split(',').map(s => s.trim()).includes(config.paymentExtension)) {
        fail(-32003, 'Activate the payment extension declared in the Agent Card'); return true;
      }
      const m = rpc.params?.message;
      if (!m || m.kind !== 'message' || m.role !== 'user' || typeof m.messageId !== 'string'
        || !m.messageId || m.messageId.length > 256 || !Array.isArray(m.parts) || !m.parts.length
        || (m.contextId !== undefined && typeof m.contextId !== 'string')
        || (m.taskId !== undefined && typeof m.taskId !== 'string')) {
        fail(-32602, 'Expected a user Message with messageId and parts'); return true;
      }
      let c = recover(m.taskId ?? messages.get(m.messageId) ?? taskId(m.messageId));
      if (m.taskId && !c) { fail(-32001, 'Task not found'); return true; }
      if (c && m.contextId && m.contextId !== c.context) { fail(-32602, 'Context does not match task'); return true; }
      const parts = m.parts.filter((p: any) => p?.kind === 'data');
      const data = parts[0]?.data;
      if (parts.length > 1 || (data !== undefined && (!data || typeof data !== 'object' || Array.isArray(data)))) {
        fail(-32602, 'Supply one structured request data part'); return true;
      }
      if (!c) {
        if (m.contextId) { fail(-32602, 'New tasks require a server-generated context'); return true; }
        if (!data) { fail(-32602, 'A new task requires a structured request data part'); return true; }
        if (tasks.size >= 1000) { fail(-32000, 'Task capacity reached'); return true; }
        // Stable server namespace preserves message retries across a process restart.
        const id = taskId(m.messageId);
        c = { id, context: 'context-' + id, request: { ...data, id } };
        tasks.set(id, c); messages.set(m.messageId, id);
      }
      const payload = m.metadata?.['x402.payment.payload'];
      const headers: Record<string, string> = payload === undefined ? {} : { 'PAYMENT-SIGNATURE': encodePaymentSignatureHeader(payload) };
      const result = await options.intake(data ? { ...data, id: c.id } : c.request, headers);
      // A changed offer or concurrent retry cannot overwrite the current task outcome.
      if (result.status === 409) { fail(-32602, 'Task is processing or request content changed'); return true; }
      c.result = result;
      json({ jsonrpc: '2.0', id: rpcId, result: task(c) }); return true;
    } catch { fail(-32603, 'Request could not be completed'); return true; }
  };
}
