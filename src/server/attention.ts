import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { bundle, rank, type SurfaceResult } from '../core/queue.js';
import type { HeldRequest, Policy } from '../core/types.js';

interface Day { day: string; used: number; groups: string[][] }

/** Count invitations already shown, including ones since answered. */
export class AttentionBudget {
  private state: Record<string, Day> = {};
  constructor(private file?: string) {
    if (!file) return;
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
        || Object.values(parsed).some((d: any) => !d || typeof d.day !== 'string'
          || !Number.isSafeInteger(d.used) || d.used < 0 || !Array.isArray(d.groups)
          || d.groups.length !== d.used || d.groups.some((g: unknown) => !Array.isArray(g)
            || g.some((id: unknown) => typeof id !== 'string')))) {
        throw new Error('invalid attention budget');
      }
      this.state = parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  surface(held: HeldRequest[], policy: Policy, now: Date): SurfaceResult {
    const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const previous = this.state[policy.owner];
    const record: Day = previous?.day === day
      ? { ...previous, groups: previous.groups.map(g => [...g]) }
      : { day, used: 0, groups: [] };
    const expired = held.filter(h => !(Date.parse(h.request.deadline) > now.getTime()));
    const alive = held.filter(h => Date.parse(h.request.deadline) > now.getTime());
    const seen = new Set(record.groups.flat());
    const waiting = rank(bundle(alive.filter(h => !seen.has(h.request.id))), now);
    const selected = now.getHours() >= policy.notifyHour
      ? waiting.slice(0, Math.max(0, policy.dailyCap - record.used)) : [];
    for (const group of selected) {
      record.groups.push(group.requests.map(h => h.request.id));
      record.used++;
    }
    // Commit before exposing invitations. Failed persistence exposes none.
    const next = { ...this.state, [policy.owner]: record };
    if (this.file && JSON.stringify(next) !== JSON.stringify(this.state)) {
      mkdirSync(dirname(this.file), { recursive: true, mode: 0o700 });
      const temp = `${this.file}.tmp`;
      writeFileSync(temp, JSON.stringify(next), { mode: 0o600 });
      renameSync(temp, this.file);
    }
    this.state = next;
    const surfaced = record.groups.flatMap(ids => bundle(alive.filter(h => ids.includes(h.request.id))));
    const surfacedIds = new Set(surfaced.flatMap(b => b.requests.map(h => h.request.id)));
    return { surfaced, deferred: bundle(alive.filter(h => !surfacedIds.has(h.request.id))), expired };
  }
}
