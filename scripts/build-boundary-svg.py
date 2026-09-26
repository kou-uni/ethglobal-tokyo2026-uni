# Generates docs/assets/boundary.svg — where Yohaku stops and a treasury layer starts.
# Same discipline as the other diagrams: 30-character budget per string, width-checked.
W, BUDGET = 1020, 34
problems = []

def fits(s, size, limit, where):
    import re
    g = re.sub(r'&#\d+;|&[a-z]+;', 'X', s)
    if len(g) > BUDGET: problems.append(f'{where}: {len(g)} chars > {BUDGET} — "{s}"')
    if len(g) * size * (.585 if size >= 15 else .60) > limit: problems.append(f'{where}: too wide — "{s}"')
    return s

o = []; a = o.append
a('<?xml version="1.0" encoding="UTF-8"?>')
a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 540" role="img" aria-label="Yohaku decides whether a person should see a money movement; a treasury layer executes and records it. Four things cross the boundary in each direction, and four questions about that boundary are still open.">' % W)
a('<rect width="100%" height="100%" fill="#F8F7F3"/>')
a('<defs>')
a('<marker id="bd-r" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#6B5BD6"/></marker>')
a('<marker id="bd-l" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#7FA326"/></marker>')
a('</defs>')
a('''<style>
.bd-lnm{font:900 13px "M PLUS Rounded 1c",sans-serif;fill:#8C8998;letter-spacing:.11em}
.bd-h{font:900 26px "M PLUS Rounded 1c",sans-serif;fill:#241f3d}
.bd-s{font:800 15px "M PLUS Rounded 1c",sans-serif;fill:#8C8998}
.bd-t{font:900 16px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.bd-m{font:900 13.5px ui-monospace,Menlo,monospace;fill:#6B5BD6}
.bd-g{font:900 13.5px ui-monospace,Menlo,monospace;fill:#6F9022}
.bd-q{font:900 14px "M PLUS Rounded 1c",sans-serif;fill:#8A6A12}
.bd-pill{font:900 12px "M PLUS Rounded 1c",sans-serif;fill:#fff;letter-spacing:.06em}
</style>''')

a('<text class="bd-lnm" x="20" y="36">%s</text>' % fits('WHERE ONE LAYER STOPS', 13, 500, 'hdr'))

# the two sides
a('<rect x="20" y="62" width="330" height="128" rx="24" fill="#EDE9FF" stroke="#6B5BD6" stroke-width="3"/>')
a('<text class="bd-h" x="46" y="106">%s</text>' % fits('Yohaku', 26, 280, 'l1'))
a('<text class="bd-t" x="46" y="136">%s</text>' % fits('Should a person see this?', 16, 280, 'l2'))
a('<text class="bd-s" x="46" y="164">%s</text>' % fits('Running today', 15, 280, 'l3'))

a('<rect x="670" y="62" width="330" height="128" rx="24" fill="#fff" stroke="#E8E5DC" stroke-width="3" stroke-dasharray="9 6"/>')
a('<text class="bd-h" x="696" y="106">%s</text>' % fits('A treasury layer', 26, 280, 'r1'))
a('<text class="bd-t" x="696" y="136">%s</text>' % fits('Move it, and record it.', 16, 280, 'r2'))
a('<text class="bd-s" x="696" y="164">%s</text>' % fits('Not ours. Not built here', 15, 280, 'r3'))

# what crosses, each way
a('<path d="M360 104 L660 104" stroke="#6B5BD6" stroke-width="3" fill="none" marker-end="url(#bd-r)"/>')
a('<path d="M660 150 L360 150" stroke="#7FA326" stroke-width="3" fill="none" marker-end="url(#bd-l)"/>')
a('<text class="bd-m" x="382" y="94">%s</text>' % fits('per decision →', 13.5, 280, 'a1'))
a('<text class="bd-g" x="382" y="176">%s</text>' % fits('← per movement', 13.5, 280, 'a2'))

y = 216
a('<rect x="20" y="%d" width="480" height="184" rx="22" fill="#fff" stroke="#E8E5DC" stroke-width="2"/>' % y)
a('<rect x="46" y="%d" width="190" height="24" rx="12" fill="#6B5BD6"/>' % (y + 22))
a('<text class="bd-pill" x="60" y="%d">%s</text>' % (y + 39, fits('WHAT WE WOULD SEND', 12, 176, 'pill1')))
for i, ln in enumerate(['the verdict, and which rule', 'whether a person was verified',
                        'the authorization and its expiry', 'the screening result, verbatim']):
    a('<text class="bd-m" x="46" y="%d">&#183; %s</text>' % (y + 76 + i * 26, fits(ln, 13.5, 430, 'send')))

a('<rect x="540" y="%d" width="460" height="184" rx="22" fill="#fff" stroke="#E8E5DC" stroke-width="2"/>' % y)
a('<rect x="566" y="%d" width="190" height="24" rx="12" fill="#7FA326"/>' % (y + 22))
a('<text class="bd-pill" x="580" y="%d">%s</text>' % (y + 39, fits('WHAT WE WOULD NEED', 12, 176, 'pill2')))
for i, ln in enumerate(['limits, before we decide', 'the settlement outcome',
                        'what actually moved', 'a record a person can read']):
    a('<text class="bd-g" x="566" y="%d">&#183; %s</text>' % (y + 76 + i * 26, fits(ln, 13.5, 410, 'need')))

y += 204
a('<rect x="20" y="%d" width="%d" height="106" rx="22" fill="#FFF6DC" stroke="#F0DFA8" stroke-width="2"/>' % (y, W - 40))
a('<rect x="46" y="%d" width="122" height="24" rx="12" fill="#B08900"/>' % (y + 22))
a('<text class="bd-pill" x="60" y="%d">%s</text>' % (y + 39, fits('STILL OPEN', 12, 108, 'pill3')))
a('<text class="bd-q" x="186" y="%d">%s</text>' % (y + 39, fits('What the conversation is for', 14, 420, 'q0')))
for i, ln in enumerate(['What should cross the line?', 'A layer, or a feature?', 'Is the thesis right?']):
    x = 46 + (i % 3) * 326
    a('<text class="bd-q" x="%d" y="%d">%d. %s</text>' % (x, y + 80, i + 1, fits(ln, 14, 300, 'q%d' % i)))
a('</svg>')

svg = '\n'.join(o)
if problems:
    print('OVER BUDGET OR TOO WIDE:')
    [print('  ', p) for p in problems]
    raise SystemExit(1)
open('docs/assets/boundary.svg', 'w', encoding='utf-8').write(svg)
print('written docs/assets/boundary.svg')
