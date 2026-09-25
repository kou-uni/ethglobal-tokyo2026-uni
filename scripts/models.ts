/**
 * Ask each configured key what it can actually run.
 *
 *   npm run models
 *
 * Prints ids only — never the key. Which model to use is chosen from this, rather than from
 * a name written into the code months earlier.
 */

import { loadEnv } from '../src/core/env.js';
loadEnv();

const anthropicKey = process.env['ANTHROPIC_API_KEY'] ?? process.env['ANTHROPIC_AUTH_TOKEN'];
const openaiKey = process.env['OPENAI_API_KEY'];

if (anthropicKey) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  try {
    const page = await new Anthropic({ apiKey: anthropicKey }).models.list({ limit: 100 });
    console.log(`\n  ANTHROPIC — ${page.data.length} models\n`);
    for (const m of page.data) console.log(`    ${m.id.padEnd(30)} ${m.display_name ?? ''}`);
  } catch (e) {
    console.log(`\n  ANTHROPIC — failed: ${e instanceof Error ? e.message : String(e)}`);
  }
} else {
  console.log('\n  ANTHROPIC — no key');
}

if (openaiKey) {
  const { default: OpenAI } = await import('openai');
  try {
    const page = await new OpenAI({ apiKey: openaiKey }).models.list();
    const ids = page.data.map((m) => m.id).sort();
    console.log(`\n  OPENAI — ${ids.length} models\n`);
    for (const id of ids) console.log(`    ${id}`);
  } catch (e) {
    console.log(`\n  OPENAI — failed: ${e instanceof Error ? e.message : String(e)}`);
  }
} else {
  console.log('\n  OPENAI — no key');
}
console.log('');
