# Generates docs/assets/flow-simple.svg and docs/assets/value-loop.svg.
#
# Deliberately short of words. Every string is width-checked against its box, and the budget
# below is a hard limit rather than a guideline: a diagram that has to be read is not a diagram.
W = 1020
problems = []
BUDGET = 30          # characters, for anything that is not the one footnote line

import re as _re

def fits(s, size, limit, where, budget=True):
    # an entity is one glyph, not six characters — measure what renders
    s_m = _re.sub(r'&#\d+;|&[a-z]+;', 'X', s)
    if budget and len(s_m) > BUDGET:
        problems.append(f'{where}: {len(s_m)} chars > {BUDGET} — "{s}"')
    if len(s_m) * size * (.585 if size >= 15 else .60) > limit:
        problems.append(f'{where}: too wide for {limit}px — "{s}"')
    return s

HEAD = '''<style>
.%(p)s-lnm{font:900 13px "M PLUS Rounded 1c",sans-serif;fill:#8C8998;letter-spacing:.11em}
.%(p)s-h{font:900 27px "M PLUS Rounded 1c",sans-serif;fill:#241f3d}
.%(p)s-t{font:900 21px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.%(p)s-b{font:800 16px "M PLUS Rounded 1c",sans-serif;fill:#5F5D6B}
.%(p)s-m{font:900 14px ui-monospace,Menlo,monospace;fill:#6F9022}
.%(p)s-mf{font:900 14px ui-monospace,Menlo,monospace;fill:#6B5BD6}
.%(p)s-pill{font:900 12px "M PLUS Rounded 1c",sans-serif;fill:#fff;letter-spacing:.06em}
.%(p)s-cap{font:800 14px "M PLUS Rounded 1c",sans-serif;fill:#8C8998}
</style>'''


def simple():
    o = []; a = o.append
    a('<?xml version="1.0" encoding="UTF-8"?>')
    a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 396" role="img" aria-label="Requests pass through Yohaku. The money goes around it, from the buyer straight to the seller. Yohaku takes one unit per decision against a price of a hundred and twenty, and collects nothing below ten thousand.">' % W)
    a('<rect width="100%" height="100%" fill="#F8F7F3"/>')
    a('<defs>')
    a('<marker id="fs-k" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#242329"/></marker>')
    a('<marker id="fs-g" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#7FA326"/></marker>')
    a('<marker id="fs-p" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#6B5BD6"/></marker>')
    a('</defs>')
    a(HEAD % {'p': 'fs'})

    a('<text class="fs-lnm" x="20" y="36">%s</text>' % fits('THROUGH US. AROUND US.', 13, 600, 'A-hdr'))

    for x, label in [(20, '&#129302; Agents'), (385, 'Yohaku'), (750, '&#128100; A person')]:
        hi = label == 'Yohaku'
        a('<rect x="%d" y="66" width="250" height="74" rx="20" fill="%s" stroke="%s" stroke-width="%d"/>'
          % (x, '#EDE9FF' if hi else '#fff', '#6B5BD6' if hi else '#E8E5DC', 3 if hi else 2))
        a('<text class="fs-t" x="%d" y="112">%s</text>' % (x + 24, fits(label, 21, 200, 'A-name')))

    a('<path d="M270 103 L378 103" stroke="#242329" stroke-width="3" fill="none" marker-end="url(#fs-k)"/>')
    a('<path d="M635 103 L743 103" stroke="#242329" stroke-width="3" fill="none" marker-end="url(#fs-k)"/>')
    a('<text class="fs-cap" x="284" y="90">%s</text>' % fits('52', 14, 90, 'A-c1'))
    a('<text class="fs-cap" x="655" y="90">%s</text>' % fits('2', 14, 90, 'A-c2'))

    # the whole point: the money leaves the middle out
    a('<path d="M145 140 L145 214 L875 214 L875 144" stroke="#7FA326" stroke-width="12" fill="none" marker-end="url(#fs-g)" stroke-linejoin="round"/>')
    a('<text class="fs-t" x="196" y="204">%s</text>' % fits('the price', 21, 260, 'A-price'))
    a('<path d="M600 214 L600 148" stroke="#6B5BD6" stroke-width="2" fill="none" stroke-dasharray="6 4" marker-end="url(#fs-p)"/>')
    a('<text class="fs-mf" x="616" y="190">%s</text>' % fits('1 per decision', 14, 200, 'A-fee'))

    # the proportion, as a proportion
    a('<rect x="20" y="256" width="%d" height="120" rx="20" fill="#fff" stroke="#E8E5DC" stroke-width="2"/>' % (W - 40))
    a('<rect x="46" y="286" width="600" height="28" rx="8" fill="#7FA326"/>')
    a('<text class="fs-pill" x="62" y="305">%s</text>' % fits('120 &#183; HERS', 12, 260, 'A-s1'))
    a('<rect x="46" y="324" width="5" height="28" rx="2" fill="#6B5BD6"/>')
    a('<text class="fs-mf" x="64" y="344">%s</text>' % fits('1 &#183; ours', 14, 200, 'A-s2'))
    a('<text class="fs-cap" x="160" y="344">%s</text>' % fits('nothing until 10,000', 14, 420, 'A-s3'))
    a('</svg>')
    return '\n'.join(o)


def loop():
    o = []; a = o.append
    a('<?xml version="1.0" encoding="UTF-8"?>')
    a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 452" role="img" aria-label="Her answers teach the router, so more runs without her and she can pull it back. Across a market the platform sees a distribution rather than anyone\'s content, which an agent treasury would want. That last part is not built.">' % W)
    a('<rect width="100%" height="100%" fill="#F8F7F3"/>')
    a('<defs>')
    a('<marker id="vl-k" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#242329"/></marker>')
    a('<marker id="vl-r" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#6B5BD6"/></marker>')
    a('</defs>')
    a(HEAD % {'p': 'vl'})

    a('<text class="vl-lnm" x="20" y="36">%s</text>' % fits('WHAT ACCUMULATES', 13, 400, 'B-hdr'))

    a('<rect x="20" y="62" width="560" height="224" rx="26" fill="#fff" stroke="#E8E5DC" stroke-width="2"/>')
    y = 106
    for n, title in [('1', 'She answers'), ('2', 'It learns the shape'), ('3', 'More runs without her')]:
        a('<circle cx="92" cy="%d" r="18" fill="#6B5BD6"/>' % (y - 6))
        a('<text class="vl-pill" x="87" y="%d">%s</text>' % (y - 1, n))
        a('<text class="vl-t" x="128" y="%d">%s</text>' % (y + 1, fits(title, 21, 420, 'B-t')))
        y += 62
    a('<path d="M62 262 L62 96" stroke="#6B5BD6" stroke-width="2.5" fill="none" stroke-dasharray="7 5" marker-end="url(#vl-r)"/>')
    a('<text class="vl-b" transform="rotate(-90 42 180)" x="42" y="180" text-anchor="middle">%s</text>' % fits('she can pull it back', 16, 230, 'B-round'))

    a('<rect x="612" y="62" width="388" height="224" rx="26" fill="#EDE9FF" stroke="#C9BFFF" stroke-width="2"/>')
    a('<text class="vl-h" x="640" y="104">%s</text>' % fits('A market has a shape', 27, 350, 'B-h2'))
    for i, ln in enumerate(['what agents pay for', 'what gets refused', 'which prices clear', 'how often a person is needed']):
        a('<text class="vl-mf" x="640" y="%d">&#183; %s</text>' % (140 + i * 26, fits(ln, 14, 330, 'B-i')))
    a('<text class="vl-b" x="640" y="264">%s</text>' % fits('Her answers are not in it.', 16, 350, 'B-g'))

    a('<path d="M584 174 L606 174" stroke="#242329" stroke-width="3" fill="none" marker-end="url(#vl-k)"/>')

    a('<rect x="20" y="312" width="%d" height="120" rx="26" fill="#FFF6DC" stroke="#F0DFA8" stroke-width="2"/>' % (W - 40))
    a('<rect x="46" y="338" width="106" height="26" rx="13" fill="#B08900"/>')
    a('<text class="vl-pill" x="62" y="356">%s</text>' % fits('NOT BUILT', 12, 200, 'B-pill'))
    a('<text class="vl-h" x="174" y="360">%s</text>' % fits('Where it could go', 27, 420, 'B-h3'))
    a('<text class="vl-b" x="46" y="396">%s</text>' % fits('An agent treasury needs this.', 16, W - 92, 'B-f'))
    a('<text class="vl-b" x="46" y="418">%s</text>' % fits('Curvegrid, for one. Nothing shared.', 16, W - 92, 'B-f2', budget=False))
    a('</svg>')
    return '\n'.join(o)


for name, fn in [('flow-simple', simple), ('value-loop', loop)]:
    svg = fn()
    if problems:
        print('OVER BUDGET OR TOO WIDE:')
        for p in problems:
            print('  ', p)
        raise SystemExit(1)
    open('docs/assets/%s.svg' % name, 'w', encoding='utf-8').write(svg)
    print('written docs/assets/%s.svg' % name)
