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

# Flat: no strokes anywhere, no shadows. Shapes are told apart by fill and space alone.
a('''<defs>
<linearGradient id="mp-bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#E4EDFF"/><stop offset="55%" stop-color="#F2EBFF"/><stop offset="1" stop-color="#FFE7F4"/>
</linearGradient>
<radialGradient id="mp-glow" cx="50%" cy="34%" r="52%">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
</radialGradient>
</defs>''')
a('''<style>
.mp-n{font:900 30px "M PLUS Rounded 1c",sans-serif;fill:#2B2740}
.mp-c{font:900 42px "M PLUS Rounded 1c",sans-serif;fill:#fff}
.mp-num{font:900 36px "M PLUS Rounded 1c",sans-serif;fill:#3B6FE0}
.mp-num.p{fill:#DE3F97}
.mp-p{font:900 21px "M PLUS Rounded 1c",sans-serif;fill:#2B2740}
.mp-s{font:800 16px "M PLUS Rounded 1c",sans-serif;fill:#9A93B8}
</style>''')
a('<rect width="100%" height="100%" fill="url(#mp-bg)"/>')
a('<rect width="100%" height="100%" fill="url(#mp-glow)"/>')

# the spine
a('<rect x="20" y="150" width="250" height="120" rx="30" fill="#FFFFFF" fill-opacity=".72"/>')
a('<text class="mp-n" x="48" y="222">%s</text>' % fits('&#129302; Agents', 30, 210, 'agents'))

a('<rect x="385" y="118" width="250" height="184" rx="34" fill="#5B4BE0"/>')
a('<text class="mp-c" x="418" y="226">%s</text>' % fits('Yohaku', 42, 210, 'yohaku'))

a('<rect x="750" y="150" width="250" height="120" rx="30" fill="#FFFFFF" fill-opacity=".72"/>')
a('<text class="mp-n" x="778" y="222">%s</text>' % fits('&#128100; A person', 30, 210, 'person'))

# arrows drawn as shapes, so nothing carries an outline
a('<rect x="286" y="203" width="78" height="9" rx="4.5" fill="#3B6FE0"/>')
a('<path d="M364 195 L386 207.5 L364 220 z" fill="#3B6FE0"/>')
a('<rect x="651" y="201" width="66" height="13" rx="6.5" fill="#DE3F97"/>')
a('<path d="M717 192 L741 207.5 L717 223 z" fill="#DE3F97"/>')
a('<text class="mp-num" x="292" y="180">%s</text>' % fits('52', 36, 90, 'n1'))
a('<text class="mp-num p" x="672" y="180">%s</text>' % fits('2', 36, 90, 'n2'))

# what attaches: soft rails instead of dashed borders
a('<text class="mp-s" x="452" y="350">%s</text>' % fits('it plugs into', 16, 200, 'plug'))
for i, (name, x) in enumerate([('&#9939; ENSv2', 20), ('&#127757; World ID', 275), ('&#128737; intercepta', 530), ('&#128176; x402', 785)]):
    a('<rect x="%d" y="372" width="215" height="70" rx="24" fill="#FFFFFF" fill-opacity=".66"/>' % x)
    a('<text class="mp-p" x="%d" y="415">%s</text>' % (x + 24, fits(name, 21, 180, 'chip%d' % i)))
    a('<path d="M%d 372 C %d 344, 510 336, 510 306" stroke="#C9C2E8" stroke-width="2" fill="none" stroke-opacity=".8"/>' % (x + 107, x + 107))

# and where the money goes afterwards
a('<rect x="504" y="442" width="13" height="50" rx="6.5" fill="#DE3F97"/>')
a('<path d="M495 490 L510.5 514 L526 490 z" fill="#DE3F97"/>')
a('<rect x="330" y="522" width="360" height="72" rx="26" fill="#FFFFFF" fill-opacity=".58"/>')
a('<text class="mp-p" x="358" y="566">%s</text>' % fits('&#128202; a treasury', 21, 320, 'treasury'))
a('</svg>')

svg = '\n'.join(o)
if problems:
    print('OVER BUDGET OR TOO WIDE:'); [print('  ', p) for p in problems]; raise SystemExit(1)
open('docs/assets/map.svg', 'w', encoding='utf-8').write(svg)
import re
print('written docs/assets/map.svg —', len(re.findall(r'</text>', svg)), 'strings,',
      sum(len(re.sub(r'&#\d+;|&[a-z]+;', 'X', t)) for t in re.findall(r'>([^<>]+)</text>', svg)), 'characters total')
