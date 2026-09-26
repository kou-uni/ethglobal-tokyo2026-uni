# docs/assets/status.svg — what exists today, as a picture. 26-character budget per string.
W, BUDGET = 1020, 26
problems = []
def fits(s, size, limit, where):
    import re
    g = re.sub(r'&#\d+;|&[a-z]+;', 'X', s)
    if len(g) > BUDGET: problems.append(f'{where}: {len(g)} chars — "{s}"')
    if len(g) * size * .6 > limit: problems.append(f'{where}: too wide — "{s}"')
    return s

o = []; a = o.append
a('<?xml version="1.0" encoding="UTF-8"?>')
a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 640" role="img" aria-label="What exists today: agents and the Koe directory feed Yohaku, whose ten rules send a request to automatic settlement, a capped human queue, or a silent refusal. ENSv2, Intercepta, a decision model and World ID attach at named rules.">' % W)
a('''<defs>
<linearGradient id="st-bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#E4EDFF"/><stop offset="55%" stop-color="#F2EBFF"/><stop offset="1" stop-color="#FFE7F4"/></linearGradient>
<radialGradient id="st-glow" cx="42%" cy="34%" r="55%">
<stop offset="0" stop-color="#FFF" stop-opacity=".85"/><stop offset="1" stop-color="#FFF" stop-opacity="0"/></radialGradient>
</defs>''')
a('''<style>
.st-l{font:900 12px "M PLUS Rounded 1c",sans-serif;fill:#9A93B8;letter-spacing:.12em}
.st-t{font:900 20px "M PLUS Rounded 1c",sans-serif;fill:#2B2740}
.st-c{font:900 30px "M PLUS Rounded 1c",sans-serif;fill:#fff}
.st-b{font:800 15px "M PLUS Rounded 1c",sans-serif;fill:#6B6484}
.st-w{font:800 15px "M PLUS Rounded 1c",sans-serif;fill:#E4DEFF}
.st-r{font:900 13px ui-monospace,Menlo,monospace;fill:#5B4BE0}
</style>''')
a('<rect width="1020" height="640" fill="url(#st-bg)"/><rect width="1020" height="640" fill="url(#st-glow)"/>')

def card(x, y, w, h, fill='#FFFFFF', op='.72'):
    a('<rect x="%d" y="%d" width="%d" height="%d" rx="24" fill="%s"%s/>'
      % (x, y, w, h, fill, ' fill-opacity="%s"' % op if op else ''))
def dot(x, y):
    a('<circle cx="%d" cy="%d" r="6" fill="#57A80A"/>' % (x, y))
def arrow(x1, y1, x2, colour='#5B4BE0', h=9):
    a('<rect x="%d" y="%d" width="%d" height="%d" rx="%g" fill="%s"/>' % (x1, y1 - h / 2, x2 - x1 - 12, h, h / 2, colour))
    a('<path d="M%d %d L%d %d L%d %d z" fill="%s"/>' % (x2 - 14, y1 - 10, x2, y1, x2 - 14, y1 + 10, colour))

# ── sources
a('<text class="st-l" x="20" y="40">%s</text>' % fits('WHERE REQUESTS COME FROM', 12, 300, 'l1'))
card(20, 58, 250, 92)
dot(46, 96); a('<text class="st-t" x="62" y="103">%s</text>' % fits('&#129302; Agent', 20, 200, 's1'))
a('<text class="st-b" x="46" y="130">%s</text>' % fits('15 buyers, seeded nights', 15, 220, 's1b'))
card(20, 166, 250, 92)
dot(46, 204); a('<text class="st-t" x="62" y="211">%s</text>' % fits('&#128196; Koe', 20, 200, 's2'))
a('<text class="st-b" x="46" y="238">%s</text>' % fits('real World ID, 1h listing', 15, 240, 's2b'))

# ── the router
arrow(276, 158, 336)
card(346, 58, 262, 200, '#5B4BE0', None)
a('<text class="st-c" x="376" y="112">%s</text>' % fits('Yohaku', 30, 210, 'y'))
a('<text class="st-w" x="376" y="146">%s</text>' % fits('ten ordered rules', 15, 210, 'y2'))
a('<text class="st-w" x="376" y="172">%s</text>' % fits('first match wins', 15, 210, 'y3'))
a('<text class="st-w" x="376" y="206">%s</text>' % fits('everything else', 15, 210, 'y4'))
a('<text class="st-w" x="376" y="230">%s</text>' % fits('falls to deny', 15, 210, 'y5'))

# ── three ways out
outs = [('&#9889; auto', 'settles on x402', 58, '#57A80A'),
        ('&#128100; human', '2 a day, her cap', 158, '#5B4BE0'),
        ('&#128683; deny', 'silent, in /dropped', 258, '#C4504A')]
for i, (name, sub, y, col) in enumerate(outs):
    arrow(614, y + 40, 664, col, 7)
    card(674, y, 326, 84)
    dot(702, y + 34); a('<text class="st-t" x="718" y="%d">%s</text>' % (y + 41, fits(name, 20, 270, 'o%d' % i)))
    a('<text class="st-b" x="702" y="%d">%s</text>' % (y + 68, fits(sub, 15, 290, 'o%db' % i)))

# ── what attaches, and at which rule
a('<text class="st-l" x="20" y="392">%s</text>' % fits('ATTACHED, AND WHERE', 12, 300, 'l2'))
for i, (name, rule) in enumerate([('&#9939; ENSv2', 'rule 0'), ('&#128737; Intercepta', 'rule 4'),
                                  ('&#129513; a model', 'rule 9'), ('&#127757; World ID', 'on yes')]):
    x = 20 + i * 250
    card(x, 410, 230, 84)
    dot(x + 26, 444); a('<text class="st-t" x="%d" y="451">%s</text>' % (x + 42, fits(name, 20, 180, 'a%d' % i)))
    a('<text class="st-r" x="%d" y="478">%s</text>' % (x + 26, fits(rule, 13, 180, 'r%d' % i)))

# ── the boundary of a World ID session
a('<text class="st-l" x="20" y="536">%s</text>' % fits('WHAT A PROOF AUTHORIZES', 12, 320, 'l3'))
card(20, 554, 980, 70, '#FFE0EF', None)
a('<text class="st-b" x="46" y="586">%s</text>' % fits('one request, one browser.', 15, 460, 'sc1'))
a('<text class="st-b" x="46" y="610">%s</text>' % fits('Never the owner.', 15, 460, 'sc2'))
a('<text class="st-r" x="540" y="586">%s</text>' % fits('signal = hash(request, id)', 13, 440, 'sc3'))
a('<text class="st-r" x="540" y="610">%s</text>' % fits('we keep verifiedAt and acr', 13, 440, 'sc4'))
a('</svg>')

svg = '\n'.join(o)
if problems:
    print('OVER BUDGET OR TOO WIDE:'); [print('  ', p) for p in problems]; raise SystemExit(1)
open('docs/assets/status.svg', 'w', encoding='utf-8').write(svg)
print('written docs/assets/status.svg')
