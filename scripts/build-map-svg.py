# docs/assets/map.svg — the concept diagram with the words taken out.
# Hard budget: 16 characters per string. If a label needs a sentence, it does not belong here.
W, BUDGET = 1020, 16
problems = []

def fits(s, size, limit, where):
    import re
    g = re.sub(r'&#\d+;|&[a-z]+;', 'X', s)
    if len(g) > BUDGET: problems.append(f'{where}: {len(g)} chars > {BUDGET} — "{s}"')
    if len(g) * size * .6 > limit: problems.append(f'{where}: too wide — "{s}"')
    return s

o = []; a = o.append
a('<?xml version="1.0" encoding="UTF-8"?>')
a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 600" role="img" aria-label="Agents send about fifty requests; Yohaku passes two to the person. ENSv2, World ID, intercepta and x402 attach to Yohaku, and the money it releases lands in a treasury layer.">' % W)
a('<rect width="100%" height="100%" fill="#F8F7F3"/>')
a('<defs><marker id="mp-a" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#242329"/></marker>')
a('<marker id="mp-g" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#7FA326"/></marker></defs>')
a('''<style>
.mp-n{font:900 30px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.mp-c{font:900 40px "M PLUS Rounded 1c",sans-serif;fill:#241f3d}
.mp-num{font:900 34px "M PLUS Rounded 1c",sans-serif;fill:#4A3BAE}
.mp-num.g{fill:#4D6416}
.mp-p{font:900 21px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.mp-s{font:800 17px "M PLUS Rounded 1c",sans-serif;fill:#8C8998}
</style>''')

# the spine: agents, the router, the person
a('<rect x="20" y="150" width="250" height="120" rx="26" fill="#fff" stroke="#E8E5DC" stroke-width="3"/>')
a('<text class="mp-n" x="48" y="222">%s</text>' % fits('&#129302; Agents', 30, 210, 'agents'))

a('<rect x="385" y="120" width="250" height="180" rx="30" fill="#EDE9FF" stroke="#6B5BD6" stroke-width="4"/>')
a('<text class="mp-c" x="418" y="228">%s</text>' % fits('Yohaku', 40, 210, 'yohaku'))

a('<rect x="750" y="150" width="250" height="120" rx="26" fill="#fff" stroke="#E8E5DC" stroke-width="3"/>')
a('<text class="mp-n" x="778" y="222">%s</text>' % fits('&#128100; A person', 30, 210, 'person'))

a('<path d="M272 210 L378 210" stroke="#242329" stroke-width="4" fill="none" marker-end="url(#mp-a)"/>')
a('<path d="M637 210 L743 210" stroke="#7FA326" stroke-width="7" fill="none" marker-end="url(#mp-g)"/>')
a('<text class="mp-num" x="288" y="186">%s</text>' % fits('52', 34, 90, 'n1'))
a('<text class="mp-num g" x="660" y="186">%s</text>' % fits('2', 34, 90, 'n2'))

# what attaches, as four chips and nothing else
a('<text class="mp-s" x="385" y="352">%s</text>' % fits('it plugs into', 17, 200, 'plug'))
for i, (name, x) in enumerate([('&#9939; ENSv2', 20), ('&#127757; World ID', 275), ('&#128737; intercepta', 530), ('&#128176; x402', 785)]):
    a('<rect x="%d" y="372" width="215" height="66" rx="20" fill="#fff" stroke="#E8E5DC" stroke-width="3"/>' % x)
    a('<text class="mp-p" x="%d" y="413">%s</text>' % (x + 22, fits(name, 21, 180, 'chip%d' % i)))
    a('<path d="M%d 372 L510 306" stroke="#C7C3D6" stroke-width="2.5" fill="none" stroke-dasharray="6 5"/>' % (x + 107))

# and where the money goes afterwards
a('<path d="M510 438 L510 490" stroke="#7FA326" stroke-width="7" fill="none" marker-end="url(#mp-g)"/>')
a('<rect x="330" y="506" width="360" height="72" rx="22" fill="#F2FBD9" stroke="#C7E479" stroke-width="3"/>')
a('<text class="mp-p" x="358" y="550">%s</text>' % fits('&#128202; a treasury', 21, 320, 'treasury'))
a('</svg>')

svg = '\n'.join(o)
if problems:
    print('OVER BUDGET OR TOO WIDE:'); [print('  ', p) for p in problems]; raise SystemExit(1)
open('docs/assets/map.svg', 'w', encoding='utf-8').write(svg)
import re
print('written docs/assets/map.svg —', len(re.findall(r'</text>', svg)), 'strings,',
      sum(len(re.sub(r'&#\d+;|&[a-z]+;', 'X', t)) for t in re.findall(r'>([^<>]+)</text>', svg)), 'characters total')
