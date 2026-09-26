# Generates docs/assets/cashflow.svg. Every string is width-checked against the box it sits in,
# because the last two diagrams shipped with text running out of its card.
W = 1020
LANE_W, LANE_X_L, LANE_X_R = 462, 20, 538
PAD = 26
USABLE = LANE_W - PAD * 2          # 410
PER_CHAR = {30: .60, 20: .60, 17: .60, 15.5: .585, 14: .585, 13: .60, 12.5: .58}
problems = []

def fits(s, size, limit=USABLE, where=''):
    # crude but conservative: latin advance for M PLUS Rounded 1c at weight 800+
    w = len(s) * size * PER_CHAR.get(size, .60)
    if w > limit:
        problems.append(f'{where}: {int(w)}px > {limit}px — "{s}"')
    return s

out = []
def add(s): out.append(s)

add('<?xml version="1.0" encoding="UTF-8"?>')
add('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 1216" role="img" aria-label="Two separate money paths: the seller is paid directly by the buyer, and Yohaku\'s per-decision fee is a separate optional authorization that is only redeemed above a threshold">' % W)
add('<rect width="100%" height="100%" fill="#F8F7F3"/>')
add('<defs>')
add('<marker id="cf-d" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="13" markerHeight="13" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#7FA326"/></marker>')
add('<marker id="cf-f" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#6B5BD6"/></marker>')
add('<marker id="cf-k" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#242329"/></marker>')
add('</defs>')
add('''<style>
.cf-lnm{font:900 13px "M PLUS Rounded 1c",sans-serif;fill:#8C8998;letter-spacing:.11em}
.cf-h0{font:900 30px "M PLUS Rounded 1c",sans-serif;fill:#241f3d}
.cf-h1{font:900 20px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.cf-b{font:800 15.5px "M PLUS Rounded 1c",sans-serif;fill:#5F5D6B}
.cf-n{font:900 17px "M PLUS Rounded 1c",sans-serif;fill:#242329}
.cf-mono{font:900 12.5px ui-monospace,Menlo,monospace;fill:#6F9022}
.cf-monoF{font:900 12.5px ui-monospace,Menlo,monospace;fill:#6B5BD6}
.cf-pill{font:900 12.5px "M PLUS Rounded 1c",sans-serif;fill:#fff;letter-spacing:.05em}
.cf-seller{stroke:#7FA326;stroke-width:6;fill:none;marker-end:url(#cf-d)}
.cf-fee{stroke:#6B5BD6;stroke-width:3;fill:none;stroke-dasharray:8 5;marker-end:url(#cf-f)}
.cf-k{stroke:#242329;stroke-width:3;fill:none;marker-end:url(#cf-k)}
</style>''')

# ── the buyer, at the top, because both paths start from one signature session
add('<text class="cf-lnm" x="20" y="44">ONE BUYER, TWO AUTHORIZATIONS, TWO SEPARATE PATHS</text>')
add('<rect x="270" y="70" width="480" height="120" rx="20" fill="#fff" stroke="#E8E5DC" stroke-width="2"/>')
add('<text class="cf-h1" x="296" y="108">&#129302; Buyer agent</text>')
add('<text class="cf-b" x="296" y="136">%s</text>' % fits('It signs the price. It may also sign a', 15.5, 430, 'buyer1'))
add('<text class="cf-b" x="296" y="158">%s</text>' % fits('second, tiny authorization for routing.', 15.5, 430, 'buyer2'))
add('<text class="cf-mono" x="296" y="180">%s</text>' % fits('buyer ETH balance: 0 — it never pays gas', 12.5, 430, 'buyer3'))

# split
add('<path class="cf-k" d="M420 190 L420 214 L251 214 L251 250"/>')
add('<path class="cf-k" d="M600 190 L600 214 L769 214 L769 250"/>')

def lane(x, title, pill, pill_fill, rows, y0=250, tag=''):
    y = y0
    add('<rect x="%d" y="%d" width="%d" height="28" rx="14" fill="%s"/>' % (x, y, 300, pill_fill))
    add('<text class="cf-pill" x="%d" y="%d">%s</text>' % (x + 16, y + 19, pill))
    y += 54
    add('<text class="cf-h0" x="%d" y="%d">%s</text>' % (x, y, fits(title, 30, LANE_W, tag + 'title')))
    y += 26
    for kind, lines, note in rows:
        h = 34 + 22 * len(lines) + (24 if note else 0)
        add('<rect x="%d" y="%d" width="%d" height="%d" rx="18" fill="%s" stroke="%s" stroke-width="2"/>'
            % (x, y, LANE_W, h, '#fff' if kind != 'end' else ('#F2FBD9' if 'seller' in tag else '#EDE9FF'),
               '#E8E5DC' if kind != 'end' else ('#C7E479' if 'seller' in tag else '#C9BFFF')))
        ty = y + 30
        for i, ln in enumerate(lines):
            cls = 'cf-n' if i == 0 else 'cf-b'
            add('<text class="%s" x="%d" y="%d">%s</text>' % (cls, x + PAD, ty, fits(ln, 17 if i == 0 else 15.5, USABLE, tag)))
            ty += 22 if i else 24
        if note:
            add('<text class="%s" x="%d" y="%d">%s</text>'
                % ('cf-mono' if 'seller' in tag else 'cf-monoF', x + PAD, ty + 2, fits(note, 12.5, USABLE, tag + 'note')))
        y += h
        if kind != 'end':
            cls = 'cf-seller' if 'seller' in tag else 'cf-fee'
            add('<path class="%s" d="M%d %d L%d %d"/>' % (cls, x + LANE_W // 2, y + 4, x + LANE_W // 2, y + 30))
            y += 34
    return y

y_l = lane(LANE_X_L, "The seller's money", 'THE PRICE &#183; RUNNING', '#7FA326', [
    ('step', ["402, then one EIP-3009 signature",
              "validBefore is the request deadline, so",
              "an unanswered request cannot settle."], None),
    ('step', ["The facilitator submits it",
              "It pays the gas, not the buyer."], 'gas 85,756 — paid by the relayer'),
    ('end',  ["→ Straight to the seller's wallet",
              "The whole price. Yohaku is not a hop",
              "on this path and holds nothing."], '120 atomic USDC, on Base Sepolia'),
], tag='seller')

y_r = lane(LANE_X_R, 'Our fee', 'THE ROUTING FEE &#183; RUNNING', '#6B5BD6', [
    ('step', ["An extension on that same 402",
              "extensions[yohaku-routing-fee],",
              "optional. Decline it and the request",
              "is still routed."], 'per-request nonce, 15-minute expiry'),
    ('step', ["1 atomic unit per decision",
              "Charged for the routing, not as a share",
              "of the sale. auto, human and deny all",
              "cost the same, because all three are work."], None),
    ('step', ["A voucher ledger, off the money path",
              "Authorizations accumulate here. The",
              "seller's proceeds never enter it."], 'redeemed: 0 · broadcast: false'),
    ('end',  ["→ One redemption, above 10,000",
              "Below that, gas costs more than the fee,",
              "so nothing is broadcast at all. Today:",
              "nothing has been."], 'x402 batch-settlement'),
], tag='fee')

y = max(y_l, y_r) + 30

# ── the two things this shape buys, and the one thing that does not exist yet
add('<rect x="20" y="%d" width="%d" height="120" rx="20" fill="#EDE9FF" stroke="#C9BFFF" stroke-width="2"/>' % (y, W - 40))
add('<text class="cf-h1" x="46" y="%d">Why two paths and not one cut</text>' % (y + 36))
for i, ln in enumerate([
    "A router that took a share of the sale would have to sit inside the seller\u2019s payment.",
    "This one cannot. The fee is a separate authorization to a different address, and the",
    "ledger\u2019s own summary type is broadcast: false \u2014 it cannot report holding anything.",
]):
    add('<text class="cf-b" x="46" y="%d">%s</text>' % (y + 62 + i * 22, fits(ln, 15.5, W - 92, 'why')))
y += 120 + 18

add('<rect x="20" y="%d" width="%d" height="120" rx="20" fill="#FFF6DC" stroke="#F0DFA8" stroke-width="2"/>' % (y, W - 40))
add('<text class="cf-h1" x="46" y="%d">Not built: the part that compounds</text>' % (y + 36))
for i, ln in enumerate([
    "The intended next step: a filter rule that becomes a default earns its contributor a",
    "share of the fees it saves, so the fee falls as the router learns.",
    "None of it exists. It is a direction, drawn so it is not mistaken for revenue.",
]):
    add('<text class="cf-b" x="46" y="%d">%s</text>' % (y + 62 + i * 22, fits(ln, 15.5, W - 92, 'nb')))
y += 120

add('</svg>')
svg = '\n'.join(out)

# retarget the viewBox height to what we actually drew
svg = svg.replace('viewBox="0 0 %d 1216"' % W, 'viewBox="0 0 %d %d"' % (W, y + 24))

if problems:
    print('TEXT DOES NOT FIT:')
    for p in problems: print('  ', p)
    raise SystemExit(1)

open('docs/assets/cashflow.svg', 'w', encoding='utf-8').write(svg)
print('written, height', y + 24)
