# Generates docs/assets/flow-simple.svg and docs/assets/value-loop.svg.
#
# Both are width-checked: every string is measured against the box it sits in, because two
# earlier diagrams shipped with text running out of its card. Classes are prefixed so the
# markup can be inlined into a page without an unscoped <style> leaking onto it.
W = 1020
problems = []

def fits(s, size, limit, where):
    w = len(s) * size * (.585 if size >= 15 else .60)
    if w > limit:
        problems.append(f'{where}: {int(w)}px > {limit}px — "{s}"')
    return s

HEAD = '''<style>
.%(p)s-lnm{font:900 13px "M PLUS Rounded 1c",sans-serif;fill:#8C8998;letter-spacing:.11em}
.%(p)s-h{font:900 26px "M PLUS Rounded 1c",sans-serif;fill:#241f3d}
.%(p)s-t{font:900 19px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.%(p)s-b{font:800 15px "M PLUS Rounded 1c",sans-serif;fill:#5F5D6B}
.%(p)s-m{font:900 13px ui-monospace,Menlo,monospace;fill:#6F9022}
.%(p)s-mf{font:900 13px ui-monospace,Menlo,monospace;fill:#6B5BD6}
.%(p)s-pill{font:900 12px "M PLUS Rounded 1c",sans-serif;fill:#fff;letter-spacing:.06em}
.%(p)s-big{font:900 34px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.%(p)s-cap{font:800 13.5px "M PLUS Rounded 1c",sans-serif;fill:#8C8998}
</style>'''


# ───────────────────────── A. the three-second version ─────────────────────────
def simple():
    P, o = 'fs', []
    a = o.append
    a('<?xml version="1.0" encoding="UTF-8"?>')
    a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 500" role="img" aria-label="Requests pass through Yohaku; the money does not. The buyer pays the seller directly, and Yohaku takes one atomic unit per decision, which it has never collected.">' % W)
    a('<rect width="100%" height="100%" fill="#F8F7F3"/>')
    a('<defs>')
    a('<marker id="fs-k" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#242329"/></marker>')
    a('<marker id="fs-g" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="15" markerHeight="15" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#7FA326"/></marker>')
    a('<marker id="fs-p" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#6B5BD6"/></marker>')
    a('</defs>')
    a(HEAD % {'p': P})

    a('<text class="fs-lnm" x="20" y="38">THE REQUESTS GO THROUGH US. THE MONEY GOES AROUND US.</text>')

    # three actors
    for x, emoji, name, sub in [
        (20,  '&#129302;', 'Agents', 'buying, all night'),
        (385, '',          'Yohaku', 'decides what she sees'),
        (750, '&#128100;', 'A person', 'answering, sometimes'),
    ]:
        hi = name == 'Yohaku'
        a('<rect x="%d" y="74" width="250" height="104" rx="20" fill="%s" stroke="%s" stroke-width="%d"/>'
          % (x, '#EDE9FF' if hi else '#fff', '#6B5BD6' if hi else '#E8E5DC', 3 if hi else 2))
        a('<text class="fs-t" x="%d" y="116">%s %s</text>' % (x + 22, emoji, fits(name, 19, 200, 'A-name')))
        a('<text class="fs-b" x="%d" y="146">%s</text>' % (x + 22, fits(sub, 15, 210, 'A-sub')))

    # the request path: through the middle
    a('<path d="M270 126 L378 126" stroke="#242329" stroke-width="3" fill="none" marker-end="url(#fs-k)"/>')
    a('<path d="M635 126 L743 126" stroke="#242329" stroke-width="3" fill="none" marker-end="url(#fs-k)"/>')
    a('<text class="fs-cap" x="278" y="112">%s</text>' % fits('52 a night', 13.5, 100, 'A-c1'))
    a('<text class="fs-cap" x="643" y="112">%s</text>' % fits('2 reach her', 13.5, 100, 'A-c2'))

    # the money path: under, bypassing the middle entirely
    a('<path d="M145 178 L145 262 L875 262 L875 182" stroke="#7FA326" stroke-width="11" fill="none" marker-end="url(#fs-g)" stroke-linejoin="round"/>')
    a('<text class="fs-t" x="190" y="250">%s</text>' % fits('the whole price', 19, 300, 'A-price'))
    a('<text class="fs-m" x="190" y="290">%s</text>' % fits('120 atomic USDC, straight to her wallet', 13, 360, 'A-price2'))

    # the fee: a hairline lifting off the money path into us, and nothing else does
    a('<path d="M600 262 L600 186" stroke="#6B5BD6" stroke-width="2" fill="none" stroke-dasharray="6 4" marker-end="url(#fs-p)"/>')
    a('<text class="fs-mf" x="616" y="222">%s</text>' % fits('1 per decision', 13, 200, 'A-fee1'))
    a('<text class="fs-mf" x="616" y="242">%s</text>' % fits('\u2014 and only that', 13, 200, 'A-fee2'))

    # to scale, because a proportion is easier to see than to read
    a('<rect x="20" y="336" width="%d" height="140" rx="20" fill="#fff" stroke="#E8E5DC" stroke-width="2"/>' % (W - 40))
    a('<text class="fs-t" x="46" y="372">%s</text>' % fits('To scale', 19, 300, 'A-s0'))
    a('<text class="fs-b" x="140" y="372">%s</text>' % fits('— in that demo, the price and our fee, drawn at the same scale.', 15, 700, 'A-s1'))
    a('<rect x="46" y="392" width="600" height="26" rx="8" fill="#7FA326"/>')
    a('<text class="fs-pill" x="60" y="410">%s</text>' % fits('120 — HERS', 12, 260, 'A-s2'))
    a('<rect x="46" y="428" width="5" height="26" rx="2" fill="#6B5BD6"/>')
    a('<text class="fs-mf" x="62" y="447">%s</text>' % fits('1 — ours, per decision. Under 10,000 it costs more gas than it is worth, so it stays uncollected.', 13, 900, 'A-s3'))
    a('</svg>')
    return '\n'.join(o)


# ───────────────────────── B. the loop, and what leaves it ─────────────────────
def loop():
    P, o = 'vl', []
    a = o.append
    a('<?xml version="1.0" encoding="UTF-8"?>')
    a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 620" role="img" aria-label="Her decisions teach the router, so more runs without her and she can pull any of it back. Across many sellers the platform accumulates shape rather than content, and that aggregate is what could one day be useful to partners such as Curvegrid. None of that last part is built.">' % W)
    a('<rect width="100%" height="100%" fill="#F8F7F3"/>')
    a('<defs>')
    a('<marker id="vl-k" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#242329"/></marker>')
    a('<marker id="vl-r" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#6B5BD6"/></marker>')
    a('<marker id="vl-a" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#B08900"/></marker>')
    a('</defs>')
    a(HEAD % {'p': P})

    a('<text class="vl-lnm" x="20" y="38">WHAT ACCUMULATES, AND WHAT COULD LEAVE</text>')

    # the loop itself — three beats, drawn as a cycle
    a('<rect x="20" y="66" width="560" height="330" rx="26" fill="#fff" stroke="#E8E5DC" stroke-width="2"/>')
    a('<text class="vl-h" x="46" y="108">%s</text>' % fits('The loop, per person', 26, 500, 'B-h1'))
    beats = [
        ('1', 'She answers', ['Yes, no, never again. Each one is a',
                              'judgement the rules could not make.']),
        ('2', 'The router learns the shape', ['Not her words — which categories, which',
                                              'askers, which prices she keeps refusing.']),
        ('3', 'More runs without her', ['And she can pull any of it back. The cap',
                                        'is hers; so is every rule it learned.']),
    ]
    y = 136
    for n, title, lines in beats:
        a('<circle cx="90" cy="%d" r="17" fill="#6B5BD6"/>' % (y + 12))
        a('<text class="vl-pill" x="%d" y="%d">%s</text>' % (85, y + 17, n))
        a('<text class="vl-t" x="122" y="%d">%s</text>' % (y + 18, fits(title, 19, 426, 'B-t')))
        for i, ln in enumerate(lines):
            a('<text class="vl-b" x="122" y="%d">%s</text>' % (y + 42 + i * 21, fits(ln, 15, 426, 'B-l')))
        y += 86
    a('<path d="M62 372 L62 134" stroke="#6B5BD6" stroke-width="2.5" fill="none" stroke-dasharray="7 5" marker-end="url(#vl-r)"/>')
    a('<text class="vl-b" transform="rotate(-90 42 253)" x="42" y="253" text-anchor="middle">%s</text>' % fits('and it comes back round', 15, 230, 'B-round'))

    # what the platform sees that one person cannot
    a('<rect x="612" y="66" width="388" height="330" rx="26" fill="#EDE9FF" stroke="#C9BFFF" stroke-width="2"/>')
    a('<text class="vl-h" x="638" y="108">%s</text>' % fits('What only a platform', 26, 340, 'B-h2'))
    a('<text class="vl-h" x="638" y="140">%s</text>' % fits('can see', 26, 340, 'B-h2b'))
    a('<text class="vl-b" x="638" y="174">%s</text>' % fits('One seller has a habit. Many sellers,', 15, 340, 'B-p1'))
    a('<text class="vl-b" x="638" y="195">%s</text>' % fits('across a market, have a distribution.', 15, 340, 'B-p2'))
    for i, ln in enumerate([
        'what agents are willing to pay for',
        'which requests get refused, and why',
        'which prices actually clear',
        'how often a human is really needed',
    ]):
        a('<text class="vl-mf" x="638" y="%d">&#183; %s</text>' % (228 + i * 24, fits(ln, 13, 330, 'B-i')))
    a('<text class="vl-b" x="638" y="342">%s</text>' % fits('Her answers are not in there. The', 15, 340, 'B-g1'))
    a('<text class="vl-b" x="638" y="363">%s</text>' % fits('shape of the demand is.', 15, 340, 'B-g2'))

    a('<path d="M584 230 L606 230" stroke="#242329" stroke-width="3" fill="none" marker-end="url(#vl-k)"/>')

    # and the part that is a direction, not a product
    a('<rect x="20" y="424" width="%d" height="172" rx="26" fill="#FFF6DC" stroke="#F0DFA8" stroke-width="2"/>' % (W - 40))
    a('<rect x="46" y="448" width="212" height="26" rx="13" fill="#B08900"/>')
    a('<text class="vl-pill" x="62" y="466">%s</text>' % fits('NOT BUILT &#183; A DIRECTION', 12, 300, 'B-pill'))
    a('<text class="vl-h" x="280" y="470">%s</text>' % fits('Where that bundle could go', 26, 480, 'B-h3'))
    for i, ln in enumerate([
        'An agent treasury has to answer a question we are collecting the evidence for: which of an',
        'agent’s money movements needed a person, and how often. That is what the distribution above is,',
        'and a partner working on agent finances — Curvegrid, for instance — would want it as a feed.',
        'It does not exist. No aggregate is computed, nothing is shared, and there is no agreement to.',
    ]):
        a('<text class="vl-b" x="46" y="%d">%s</text>' % (504 + i * 22, fits(ln, 15, W - 92, 'B-f')))
    a('</svg>')
    return '\n'.join(o)


for name, fn in [('flow-simple', simple), ('value-loop', loop)]:
    svg = fn()
    if problems:
        print('TEXT DOES NOT FIT:')
        for p in problems:
            print('  ', p)
        raise SystemExit(1)
    open('docs/assets/%s.svg' % name, 'w', encoding='utf-8').write(svg)
    print('written docs/assets/%s.svg' % name)
