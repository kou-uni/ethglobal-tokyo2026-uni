import { readFileSync } from 'node:fs';
const html = readFileSync('docs/ask.html', 'utf8');
const DB = JSON.parse(readFileSync('docs/ask/answers.json', 'utf8')).answers;
// use the page's own scorer, so the test cannot drift from what ships
const src = html.slice(html.indexOf('const norm ='), html.indexOf('function chip('));
const score = new Function('DB', src + '; return score;')(DB);

const ASK = [
  ['did money actually move?', 'x402'],
  ['show me a real transaction', 'x402'],
  ['how do you make money', 'fees'],
  ['what is your business model', 'fees'],
  ['how much revenue so far', 'fees-collected'],
  ['why ens v2', 'ens'],
  ['can the agent change its own permissions', 'ens'],
  ['what if the api goes down', 'fail-closed'],
  ['can I prompt inject the classifier', 'prompt-injection'],
  ['what is not finished', 'not-built'],
  ['what would embarrass you', 'embarrass'],
  ['how do I verify your claims', 'verify'],
  ['what do you store about me', 'privacy'],
  ['how many requests reach the person', 'cap'],
  ['what protocol do agents use', 'a2a'],
  ['is it open source', 'oss'],
  ['what is koe', 'koe'],
  ['tell me about world id', 'world'],
  ['the amr pop thing', 'amr'],
  ['where does curvegrid fit', 'curvegrid'],
  ['what is rule 4', 'screening'],
  ['can i try it', 'try'],
  ['what is yohaku', 'what'],
  ['why a layer and not a feature', 'why-layer'],
  // deliberately out of scope — these MUST fall through
  ['what is the weather in tokyo', null],
  ['who won the world cup', null],
  ['write me a poem', null],
];
let pass = 0, fail = [];
for (const [q, want] of ASK) {
  const ranked = DB.map(e => [score(q, e), e]).sort((a, b) => b[0] - a[0]);
  const got = ranked[0][0] >= 1.6 ? ranked[0][1].id : null;
  if (got === want) pass++;
  else fail.push(`  "${q}"  want ${want ?? 'NO MATCH'}, got ${got ?? 'NO MATCH'} (top ${ranked[0][0].toFixed(2)} ${ranked[0][1].id})`);
}
console.log(`${pass}/${ASK.length} routed as intended`);
if (fail.length) { console.log('misses:'); fail.forEach(f => console.log(f)); process.exit(1); }
