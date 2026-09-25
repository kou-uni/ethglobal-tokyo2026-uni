/**
 * Read `.env` without a dependency.
 *
 * Values already present in the real environment win, so an exported key always beats a
 * stale line in the file.
 */

import { existsSync, readFileSync } from 'node:fs';

export function loadEnv(path = '.env'): void {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (value && process.env[key] === undefined) process.env[key] = value;
  }
}
