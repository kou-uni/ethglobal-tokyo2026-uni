/**
 * Inline the compiled core into a single HTML file.
 *
 * The console must run the same `route()` that the tests run — not a copy of it —
 * so the core is compiled, concatenated and embedded rather than reimplemented.
 * One file, no server, no CDN: it opens from a USB stick at a booth with bad wifi.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const ORDER = ['types', 'rules', 'queue', 'ledger', 'decisions', 'night', 'week'];

const core = ORDER.map((name) => {
  const src = readFileSync(`demo/lib/core/${name}.js`, 'utf8');
  return src
    .replace(/^export\s+/gm, '')
    .replace(/^import[^;]+;$/gm, '')
    .trim();
}).join('\n\n');

const html = readFileSync('demo/template.html', 'utf8').replace('/*__CORE__*/', core);
writeFileSync('demo/index.html', html);

const kb = (html.length / 1024).toFixed(0);
console.log(`  demo/index.html  ${kb} KB  (core: ${ORDER.join(', ')})`);
