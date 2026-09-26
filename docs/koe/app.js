const $ = id => document.getElementById(id);
const labels = { answers: ['auto', 'Standing permission'], needsToBeAsked: ['human', 'Ask the person'], willNotAnswer: ['deny', 'Not available'] };
const title = value => value.split('/').at(-1).replaceAll('-', ' ');
let directory, selected;
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function safeRouter(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid router');
  return url.origin;
}
function quote(value) { return "'" + value.replaceAll("'", "'\\''") + "'"; }
function example() {
  const { person, topic } = selected;
  const body = { who: directory.howToAsk.exampleWho, what: topic, purpose: directory.howToAsk.purposeByTopic[topic], price: person.priceFrom, deadline: new Date(Date.now() + 15 * 60_000).toISOString() };
  const json = JSON.stringify(body, null, 2);
  const curl = `curl --include --request POST ${quote(safeRouter(person.router) + '/requests')} \\\n  --header 'Content-Type: application/json' \\\n  --data-raw ${quote(json)}`;
  $('payload').textContent = json;
  $('curl').textContent = curl;
  return curl;
}
function selectTopic(person, topic, group) {
  selected = { person, topic, group };
  $('selection').textContent = `${person.name} · ${title(topic)} · expected ${labels[group][0]} under demo conditions`;
  $('copy').disabled = false;
  $('copy-status').textContent = '';
  document.querySelectorAll('.topic-button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.handle === person.handle && b.dataset.topic === topic)));
  example();
}
function card(person) {
  const article = element('article', undefined, 'profile');
  const head = element('div', undefined, 'person');
  const avatar = element('span', person.name.slice(0, 1), 'avatar');
  avatar.setAttribute('aria-hidden', 'true');
  const identity = element('div');
  identity.append(element('h3', person.name), element('span', person.verified, 'identity'));
  head.append(avatar, identity);
  article.append(head, element('p', person.headline, 'headline'), element('p', person.about, 'about'));
  const topics = element('div', undefined, 'topics');
  for (const [group, [verdict, label]] of Object.entries(labels)) {
    if (!person[group].length) continue;
    const block = element('div', undefined, `topic-group ${verdict}`);
    block.append(element('h4', label));
    const buttons = element('div', undefined, 'topic-buttons');
    for (const topic of person[group]) {
      const b = element('button', title(topic), 'topic-button');
      b.type = 'button'; b.dataset.handle = person.handle; b.dataset.topic = topic;
      b.setAttribute('aria-label', `${person.name}: ${title(topic)} — build request, expected ${verdict}`);
      b.setAttribute('aria-pressed', String(selected?.person.handle === person.handle && selected?.topic === topic));
      b.addEventListener('click', () => { selectTopic(person, topic, group); $('protocol').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
      buttons.append(b);
    }
    block.append(buttons); topics.append(block);
  }
  const terms = element('div', undefined, 'terms');
  const price = element('span', 'From ');
  price.append(element('strong', `${person.priceFrom.amount.toLocaleString()} ${person.priceFrom.currency}`));
  terms.append(price, element('span', `${person.interruptionsPerDay} notification slots / day`));
  article.append(topics, terms);
  return article;
}
function render() {
  const search = $('search').value.trim().toLowerCase(), topic = $('topic').value;
  const people = directory.profiles.filter(p => {
    const topics = [...p.answers, ...p.needsToBeAsked, ...p.willNotAnswer];
    return (!topic || topics.includes(topic)) && [p.name, p.headline, p.about, ...topics].join(' ').toLowerCase().includes(search);
  });
  $('profiles').replaceChildren(...people.map(card));
  if (!people.length) $('profiles').append(element('p', 'No matching perspectives. Try another topic or search.', 'empty'));
  $('count').textContent = `${people.length} / ${directory.profiles.length} demo profiles`;
}
$('copy').addEventListener('click', async () => {
  if (!selected) return;
  const command = example();
  try { await navigator.clipboard.writeText(command); $('copy-status').textContent = 'Copied. Deadline refreshed to 15 minutes from now.'; }
  catch { $('copy-status').textContent = 'Clipboard unavailable. Open “Executable curl” and copy the command manually.'; document.querySelector('details').open = true; }
});
try {
  const response = await fetch(new URL('./directory.json', import.meta.url));
  if (!response.ok) throw new Error('Directory unavailable');
  directory = await response.json();
  if (directory.service !== 'koe' || directory.version !== 1 || !Array.isArray(directory.profiles) || !directory.profiles.length || typeof directory.howToAsk.exampleWho !== 'string') throw new Error('Unsupported directory');
  for (const p of directory.profiles) {
    safeRouter(p.router);
    for (const field of ['handle', 'name', 'verified', 'headline', 'about']) if (typeof p[field] !== 'string') throw new Error('Invalid profile');
    for (const group of Object.keys(labels)) if (!Array.isArray(p[group]) || p[group].some(t => typeof t !== 'string')) throw new Error('Invalid topics');
    for (const topic of [...p.answers, ...p.needsToBeAsked, ...p.willNotAnswer]) if (typeof directory.howToAsk.purposeByTopic[topic] !== 'string') throw new Error('Missing purpose');
    if (!Number.isFinite(p.priceFrom.amount) || typeof p.priceFrom.currency !== 'string') throw new Error('Invalid price');
  }
  const topics = [...new Set(directory.profiles.flatMap(p => [...p.answers, ...p.needsToBeAsked, ...p.willNotAnswer]))].sort();
  for (const t of topics) { const option = element('option', title(t)); option.value = t; $('topic').append(option); }
  $('search').addEventListener('input', render); $('topic').addEventListener('change', render);
  const first = directory.profiles.find(p => p.answers.length);
  if (first) selectTopic(first, first.answers[0], 'answers');
  render();
  const world = $('world-link'); world.href = safeRouter(directory.profiles[0].router) + '/try'; world.removeAttribute('aria-disabled');
} catch {
  $('profiles').replaceChildren(element('p', 'The directory could not be loaded. Reload to try again, or open directory.json directly.', 'empty'));
  $('count').textContent = 'Unavailable'; $('payload').textContent = 'No request available.';
  $('copy').disabled = true;
}
