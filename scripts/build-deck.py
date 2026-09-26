# docs/deck.html — the 2:30 deck. Eight slides, one file, arrow keys.
# Slide text is deliberately tiny in volume: the speaking is the content.
import html, io, subprocess, json

LINES = {'era': ('Agents are not assistants any more. / They are becoming <b>customers.</b><br>And the person they buy from / is <b>you.</b><br>A model can write anything. / What it cannot do / is live a day / and tell you what happened.<br>So the scarce thing is no longer information. — It is <b>an answer only a person can give.</b>', 'エージェントはもう「アシスタント」ではありません。顧客になりつつあります。そして、その顧客が買う相手が、あなたです。モデルは何でも書けます。できないのは、一日を生きて、何が起きたかを語ること。だから希少なのはもう情報ではない。その人にしか出せない答えです。'), 'mkt': ('A large market is expected. — And <b>the supply it runs on is running out.</b>', '大きな市場が見込まれています。そして、それを支えている供給のほうが先に尽きます。'), 'night': ('Which means demand arrives at a person, / all night, / at machine speed.<br>Fifty-two requests reached one seller / in one night. — She was <b>asleep.</b><br>That is not a problem to block. — It is <b>a market with nobody at the counter.</b>', 'つまり需要は、一人の人間に、一晩中、機械の速さで届きます。ある売り手には、一晩で52件届きました。本人は寝ています。これは防ぐべき問題ではありません。カウンターに誰も立っていない市場です。'), 'yohaku': ('So the question is not how to answer more. — It is <b>what a person should never have to see.</b><br>What we are building is <b>room.</b> / Room to stay a person.<br>In Japanese we call that <b>yohaku</b> — / the space a painter decides <b>not to fill.</b>', '問いは「どうやってもっと答えるか」ではありません。その人が見なくていいものは何か、です。私たちが作っているのは、ゆとりです。人間のままでいるためのゆとり。日本語では、これを余白と言います。絵師が、描かないと決めた場所です。'), 'proto': ('Here is one night. / Agents arrive over an open agent-to-agent protocol.<br><b>Most never reach a judgement at all.</b> / They are refused / before anyone is asked.<br>A security check decides / whether the money may move.<br>A decision model sorts the rest — / and it can only <b>ask,</b> / or <b>refuse.</b> — <b>It cannot say yes.</b><br>What clears / settles itself / over x402.', 'これがある一晩です。エージェントは公開のエージェント間プロトコルでやってきます。その大半は、判断にすら届きません。誰かに聞く前に断られます。セキュリティの検査が「この金は動いていいのか」を決めます。判定モデルが残りを仕分けます。ただし返せるのは「聞く」か「断る」だけ。「通す」という答えは存在しません。通ったものは、x402 で自分で決済まで終わります。'), 'world': ('Two are left. — Only <b>two.</b><br>When she answers, / she proves she is a person / <b>at that moment</b> — with World ID.<br>That is what an agent is actually buying: / <b>an answer a human is proven to have given.</b>', '残るのは2件。2件だけです。答えるとき、彼女はその瞬間に人間であることを証明します。World ID で。エージェントが本当に買っているのはこれです — 人間が答えたと証明された答え。'), 'money': ('Money arrived / while she did nothing.<br>Money arrived again / because she <b>decided.</b><br><b>Check your own balance.</b> — Not our screen.', '何もしていない間に、お金が入りました。決めたから、もう一度入りました。ご自分の残高で確かめてください。私たちの画面ではなく。'), 'close': ("She spent <b>two taps</b> / and kept the rest of the night.<br>We take one unit / for the decision we handled — / never a share of what she earned.<br>And what agents spend / has to be governed somewhere. — <b>That is where a treasury layer begins — Curvegrid's — / and where we stop.</b>", '使ったのはタップ2回。残ったのはその夜の残り全部。私たちは捌いた判断1件につき1単位だけ受け取ります。彼女の売上の取り分ではありません。そして、エージェントが使う金は、どこかで統治されなければならない。そこから先が財務の層 — Curvegrid の層 — で、私たちはそこで止まります。'), 'end': ('<b>AI works.</b> — <b>You breathe.</b>', 'AIが働く。あなたは、息をする。')}
CUE = {'mkt': 'スライド2へ。読み上げない', 'night': 'スライド3', 'yohaku': 'スライド4。ここで一拍長く', 'proto': 'アニメーションを流し始めてから喋る', 'world': 'スライド6', 'money': '事前に用意したスマホへ。読み取り操作はしない', 'close': 'スライド8', 'end': 'ここで止める。ロゴを出したまま黙る'}

S = [
 dict(k='era', big=['Agents are not assistants.', 'They are <em>customers.</em>'],
      sub='And the person they buy from is you.'),
 dict(k='mkt', big=['It gets bigger.', 'The supply <em>runs out</em> first.'],
      notes=['<b>2026–2032</b> the stock of public human text is used up — Epoch AI',
             '<b>$60M / year</b> Google → Reddit, for what people wrote. None of it reaches them']),
 dict(k='night', huge='52', big=['requests. One night.', 'She was <em>asleep.</em>'],
      sub='A market with nobody at the counter.'),
 dict(k='yohaku', invert=True, big=['余白'], roman='yohaku',
      sub='the space a painter decides not to fill'),
 dict(k='proto', label='ONE NIGHT', big=['Refused', 'before anyone <em>is asked.</em>'],
      embed='launch.html#trafficPlayer',
      ),
 dict(k='world', big=['Two are left.'],
      sub='What an agent is buying:',
      punch='an answer a human is <em>proven</em> to have given',
      foot='World ID · at the moment of consent, not at signup'),
 dict(k='money', big=['Check your <em>own</em> balance.'], sub='Not our screen.'),
 dict(k='close', big=['Two taps.', 'She kept the rest of the night.'],
      notes=['<b>one unit per decision we handled</b> — never a share of what she earned',
             'what agents spend has to be governed somewhere → <b>Curvegrid</b>']),
 dict(k='end', mark=True, big=['AI works.', 'You breathe.']),
]

def slide(i, d):
    c = ['<section class="s%s"%s>' % ((' inv' if d.get('invert') else '') + (' lime' if d.get('mark') else ''),
         ' data-i="%d"' % i)]
    if d.get('label'): c.append('<p class="lbl">%s</p>' % d['label'])
    if d.get('mark'):
        c.append('<img class="mark" src="launch/mark.svg" alt="yohaku">')
    if d.get('huge'): c.append('<p class="huge">%s</p>' % d['huge'])
    c.append('<h2>%s</h2>' % '<br>'.join(d['big']))
    if d.get('roman'): c.append('<p class="rom">%s</p>' % d['roman'])
    if d.get('qr'):
        svg = subprocess.run(['node','-e',
            "require('qrcode').toString(process.argv[1],{type:'svg',errorCorrectionLevel:'M',margin:1})"
            ".then(s=>process.stdout.write(s))", d['qr']],
            capture_output=True, text=True, check=True).stdout
        svg = svg.replace('<svg ', '<svg class="qr" ', 1)
        c.append('<div class="qrbox">%s<p class="qurl">%s</p></div>' % (svg, d['qr'].replace('https://','')))
    if d.get('sub'): c.append('<p class="sub">%s</p>' % d['sub'])
    if d.get('punch'): c.append('<p class="punch">%s</p>' % d['punch'])
    if d.get('embed'):
        c.append('<div class="embed"><iframe src="%s" title="one night" loading="lazy"></iframe>'
                 '<a class="full" href="%s" target="_blank" rel="noopener">open it full &rarr;</a></div>'
                 % (d['embed'], d['embed']))
    if d.get('chips'):
        c.append('<div class="chips">' + ''.join(
            '<div class="chip"><b>%s</b><span>%s</span></div>' % (n, t) for n, t in d['chips']) + '</div>')
    if d.get('notes'): c.append('<div class="notes">' + ''.join('<p>%s</p>' % n for n in d['notes']) + '</div>')
    if d.get('foot'): c.append('<p class="foot">%s</p>' % d['foot'])
    c.append('</section>')
    return '\n'.join(c)

io.open('docs/deck.html', 'w', encoding='utf-8').write('''<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Yohaku — the deck</title>
<meta name="description" content="Eight slides. Agents are becoming customers, and a person needs room.">
<style>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@800;900&display=swap');
:root{--ink:#1D1B26;--ink2:#6B6484;--ink3:#9A93B8;--violet:#5B4BE0;--pink:#DE3F97}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{background:#0E0C18;color:var(--ink);overflow:hidden;
font-family:"M PLUS Rounded 1c",-apple-system,BlinkMacSystemFont,"Hiragino Maru Gothic ProN",sans-serif;
font-weight:800;-webkit-font-smoothing:antialiased}
#deck{position:fixed;inset:0;display:grid;place-items:center}
section{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;
padding:6vmin 8vmin;opacity:0;pointer-events:none;transition:opacity .22s;
background:linear-gradient(160deg,#E9F0FF 0%,#F4EDFF 48%,#FFEAF6 100%)}
section.on{opacity:1;pointer-events:auto}
section.inv{background:#5B4BE0;color:#fff;align-items:center;text-align:center}
section.lime{background:#DDF691;color:#242329;align-items:center;text-align:center;justify-content:center;gap:5vmin}
section.lime h2{font-size:clamp(40px,9vmin,120px);color:#242329;line-height:1.14}
.mark{width:min(30vmin,34vh);height:auto;display:block}
h2{font-size:clamp(34px,7.6vmin,104px);font-weight:900;line-height:1.1;letter-spacing:-.025em}
h2 em{font-style:normal;color:var(--violet)}
section.inv h2{font-size:clamp(70px,20vmin,260px);letter-spacing:.04em}
section.inv h2 em{color:#fff}
.rom{font-size:clamp(24px,5vmin,64px);color:#D6CEFF;margin-top:1vmin;letter-spacing:.12em}
.sub{font-size:clamp(17px,2.9vmin,40px);color:var(--ink2);margin-top:3vmin;line-height:1.45;max-width:24ch}
section.inv .sub{color:#CFC6FF;max-width:30ch;margin-top:4vmin}
.punch{font-size:clamp(22px,4.4vmin,60px);color:var(--ink);margin-top:2vmin;line-height:1.24;max-width:20ch}
.punch em{font-style:normal;color:var(--pink)}
.lbl{font-size:clamp(11px,1.5vmin,18px);letter-spacing:.2em;color:var(--ink3);margin-bottom:3vmin}
.foot{font-size:clamp(13px,1.9vmin,24px);color:var(--ink3);margin-top:4vmin}
.notes{margin-top:5vmin;display:flex;flex-direction:column;gap:1.6vmin}
.notes p{font-size:clamp(14px,2.2vmin,30px);color:var(--ink2);line-height:1.4}
.notes b{color:var(--ink)}
.huge{font:900 clamp(78px,26vmin,300px)/0.86 "M PLUS Rounded 1c",sans-serif;color:#5B4BE0;letter-spacing:-.04em}
section:has(.embed) h2{font-size:clamp(24px,4.6vmin,58px)}
section:has(.embed) .lbl{margin-bottom:1.4vmin}
.embed{margin-top:1.8vmin;flex:1;min-height:0;display:flex;flex-direction:column;gap:1vmin}
.embed iframe{flex:1;width:100%;border:0;border-radius:2.4vmin;background:#12101C;min-height:44vh}
.full{align-self:flex-end;font-size:clamp(13px,2vmin,24px);font-weight:900;color:var(--violet);text-decoration:none}
.chips{margin-top:5vmin;display:grid;gap:1.6vmin;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.chip{background:rgba(255,255,255,.7);border-radius:3vmin;padding:2.4vmin 3vmin}
.chip b{display:block;font-size:clamp(18px,3vmin,38px);font-weight:900}
.chip span{display:block;font-size:clamp(12px,1.8vmin,22px);color:var(--ink2);margin-top:.6vmin;line-height:1.35}
#dots{position:fixed;bottom:2.4vmin;left:0;right:0;display:flex;gap:1.1vmin;justify-content:center;z-index:5}
#dots i{width:1.1vmin;height:1.1vmin;min-width:7px;min-height:7px;border-radius:50%;background:#C9C2E8;transition:background .2s}
#dots i.on{background:var(--violet)}
body.inv #dots i{background:rgba(255,255,255,.45)}
body.inv #dots i.on{background:#fff}
</style></head><body>
<div id="deck">
''' + '\n'.join(slide(i, d) for i, d in enumerate(S)) + '''
</div>
<div id="dots">''' + ''.join('<i></i>' for _ in S) + '''</div>
<script>
var S=document.querySelectorAll('section'), D=document.querySelectorAll('#dots i'), i=0;
function go(n){i=Math.max(0,Math.min(S.length-1,n));
  S.forEach(function(s,k){s.classList.toggle('on',k===i)});
  D.forEach(function(d,k){d.classList.toggle('on',k===i)});
  document.body.classList.toggle('inv',S[i].classList.contains('inv'));
  history.replaceState(null,'','?p='+(i+1));}
addEventListener('keydown',function(e){
  if(['ArrowRight','ArrowDown',' ','PageDown','Enter'].indexOf(e.key)>-1){e.preventDefault();go(i+1)}
  if(['ArrowLeft','ArrowUp','PageUp','Backspace'].indexOf(e.key)>-1){e.preventDefault();go(i-1)}
  if(e.key==='Home')go(0); if(e.key==='End')go(S.length-1);
  if(e.key==='f'&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();});
var x=null;
addEventListener('touchstart',function(e){x=e.touches[0].clientX},{passive:true});
addEventListener('touchend',function(e){if(x===null)return;var d=e.changedTouches[0].clientX-x;
  if(Math.abs(d)>45)go(i+(d<0?1:-1)); x=null},{passive:true});
addEventListener('click',function(e){if(e.clientX<innerWidth*0.25)go(i-1);else go(i+1)});
go((parseInt(new URLSearchParams(location.search).get('p'),10)||1)-1);
</script>
</body></html>
''')
print('docs/deck.html —', len(S), 'slides')

# ── the same words, as something to read while speaking ──────────────────────
HARD = [('agent-to-agent protocol', 'エージェント・トゥ・エージェントで一度切る。1語で言おうとしない'),
        ('settles itself over x402', 'settles の後に軽く間。x402 は「エックス・フォー・オー・トゥー」'),
        ('an answer a human is proven to have given', 'proven だけ強く。残りは平ら'),
        ('assistants any more', 'any more を落とさない。ここが否定の要'),
        ('yohaku', 'ヨハク。ゆっくり。ここは日本語のままでいい')]
SPINE = ['customers','you','an answer only a person can give','the supply is running out','asleep',
         'nobody at the counter','what a person should never have to see','room','yohaku',
         'Most never reach a judgement','It cannot say yes','Only two','proven to have given',
         'Check your own balance','two taps','where we stop']

blocks = []
for i, d in enumerate(S):
    en, ja = LINES[d['k']]
    cue = ('<p class="cue">［%s］</p>' % CUE[d['k']]) if d['k'] in CUE else ''
    blocks.append('<article data-i="%d">%s<p class="no">%d</p><p class="en">%s</p><p class="ja">%s</p></article>'
                  % (i, cue, i + 1, en, ja))

io.open('docs/script.html', 'w', encoding='utf-8').write('''<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Yohaku — the script</title><meta name="robots" content="noindex">
<style>
@import url(\'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap\');
*{box-sizing:border-box;margin:0}
body{background:#12101C;color:#F2F0FA;min-height:100vh;padding:5vmin 6vmin 16vmin;
font-family:"M PLUS Rounded 1c",-apple-system,BlinkMacSystemFont,"Hiragino Maru Gothic ProN",sans-serif;
font-weight:800;-webkit-font-smoothing:antialiased}
article{display:none}article.on{display:block}
.no{font:900 clamp(13px,1.8vmin,20px)/1 ui-monospace,Menlo,monospace;color:#6E66A8;letter-spacing:.2em;margin-bottom:2vmin}
.cue{font-size:clamp(13px,2vmin,22px);color:#FFC46B;margin-bottom:2vmin}
.en{font-size:clamp(21px,4.4vmin,54px);line-height:1.48;letter-spacing:-.01em}
.en b{color:#A99BFF}
.ja{font-size:clamp(13px,2vmin,22px);line-height:1.75;color:#8B83B8;margin-top:4vmin;font-weight:700}
#bar{position:fixed;left:0;right:0;bottom:0;background:#1B1830;padding:2.4vmin 4vmin;
display:flex;gap:3vmin;align-items:center;justify-content:space-between;font-size:clamp(12px,1.8vmin,18px)}
#bar b{color:#A99BFF}
button{font:inherit;font-size:clamp(12px,1.8vmin,18px);font-weight:900;background:#2E2850;color:#F2F0FA;
border:0;border-radius:99px;padding:1.4vmin 3vmin;cursor:pointer}
#help{display:none;padding-top:4vmin;border-top:2px solid #241F42;margin-top:5vmin}
#help.on{display:block}
#help h3{font-size:clamp(14px,2vmin,22px);color:#8B83B8;margin-bottom:2vmin;letter-spacing:.08em}
#help p{font-size:clamp(13px,1.9vmin,20px);line-height:1.7;color:#C8C2E6;margin-bottom:1.4vmin}
#help p b{color:#F2F0FA}
#spine{font-size:clamp(13px,1.9vmin,20px);line-height:2;color:#8B83B8}
#spine b{color:#A99BFF}
</style></head><body>
''' + "\n".join(blocks) + '''
<div id="help">
<h3>言いにくい所</h3>
''' + "".join("<p><b>%s</b><br>%s</p>" % (a, b) for a, b in HARD) + '''
<h3 style="margin-top:4vmin">詰まったら、その文を捨てて次の太字から</h3>
<p id="spine">''' + " → ".join("<b>%s</b>" % w for w in SPINE) + '''</p>
</div>
<div id="bar">
  <button onclick="go(i-1)">◀</button>
  <span><b id="n">1</b> / ''' + str(len(S)) + ''' &nbsp;·&nbsp; 317 words &nbsp;·&nbsp; 2:07</span>
  <button onclick="document.getElementById(\'help\').classList.toggle(\'on\')">notes</button>
  <button onclick="go(i+1)">▶</button>
</div>
<script>
var A=document.querySelectorAll(\'article\'), i=0;
function go(n){i=Math.max(0,Math.min(A.length-1,n));
  A.forEach(function(a,k){a.classList.toggle(\'on\',k===i)});
  document.getElementById(\'n\').textContent=i+1;
  history.replaceState(null,\'\',\'?p=\'+(i+1)); scrollTo(0,0);}
addEventListener(\'keydown\',function(e){
  if([\'ArrowRight\',\'ArrowDown\',\' \',\'PageDown\'].indexOf(e.key)>-1){e.preventDefault();go(i+1)}
  if([\'ArrowLeft\',\'ArrowUp\',\'PageUp\'].indexOf(e.key)>-1){e.preventDefault();go(i-1)}});
var x=null;
addEventListener(\'touchstart\',function(e){x=e.touches[0].clientX},{passive:true});
addEventListener(\'touchend\',function(e){if(x===null)return;var d=e.changedTouches[0].clientX-x;
  if(Math.abs(d)>45)go(i+(d<0?1:-1)); x=null},{passive:true});
go((parseInt(new URLSearchParams(location.search).get(\'p\'),10)||1)-1);
</script>
</body></html>
''')
print('docs/script.html —', len(S), 'blocks, same source as the deck')

# ── Canva に写すための素のテキスト ────────────────────────────────────────────
import re as _re

def _plain(v):
    """<em> と <br> を落として、Canva にそのまま貼れる素の文字にする。"""
    if isinstance(v, (list, tuple)): v = '\n'.join(v)
    v = v.replace('<br>', '\n')
    v = _re.sub(r'</?em>', '', v)
    v = _re.sub(r'<[^>]+>', '', v)
    return (v.replace('&#183;', '·').replace('&mdash;', '—').replace('&rarr;', '→')
             .replace('&ldquo;', '“').replace('&rdquo;', '”').replace('&amp;', '&').strip())

def _accent(v):
    """紫にする語だけ抜き出す。"""
    if isinstance(v, (list, tuple)): v = ' '.join(v)
    return [_plain(m) for m in _re.findall(r'<em>(.*?)</em>', v)]

TIMES = ['0:00–0:25','0:25–0:35','0:35–0:55','0:55–1:15','1:15–1:55','1:55–2:10','2:10–2:25','2:25–2:33','2:33–2:40']
SIZES = {'huge':'420px','h2':'170px','sub':'46px','notes':'38px','lbl':'26px','punch':'70px','foot':'30px'}

cards = []
for i, d in enumerate(S):
    rows = []
    def row(label, text, note=''):
        if not text: return
        cid = 'c%d_%s' % (i, label)
        rows.append('<div class="f"><div class="fh"><b>%s</b><span>%s</span>'
                    '<button data-for="%s">copy</button></div><pre id="%s">%s</pre></div>'
                    % (label, note, cid, cid, html.escape(text)))
    if d.get('huge'): row('巨大な数字', d['huge'], SIZES['huge'] + ' · 紫 #5B4BE0')
    if d.get('lbl'):  row('小ラベル', _plain(d['lbl']), SIZES['lbl'] + ' · 灰 #9A93B8 · 字間広め')
    row('見出し', _plain(d['big']), SIZES['h2'] + (' · 白 #FFFFFF' if d.get('invert') else ' · 黒 #1D1B26'))
    if d.get('roman'): row('ローマ字', _plain(d['roman']), '64px · 淡紫 #D6CEFF')
    if d.get('sub'):   row('サブ', _plain(d['sub']), SIZES['sub'] + ' · 灰 #6B6484')
    if d.get('punch'): row('強調文', _plain(d['punch']), SIZES['punch'] + ' · ピンク #DE3F97')
    if d.get('notes'): row('注記', _plain(d['notes']), SIZES['notes'] + ' · 灰 #6B6484')
    if d.get('foot'):  row('脚注', _plain(d['foot']), SIZES['foot'] + ' · 灰 #9A93B8')
    acc = _accent(d['big']) + _accent(d.get('punch', ''))
    extra = []
    if acc: extra.append('<p class="hint">紫 #5B4BE0 にする語: <b>%s</b></p>' % html.escape(' / '.join(acc)))
    if d.get('invert'): extra.append('<p class="hint warn">この1枚だけ <b>背景を #5B4BE0 のベタ塗り・文字は白</b>。中央寄せで周囲を大きく空ける</p>')
    if d.get('embed'): extra.append('<p class="hint warn">ここに <b>40秒のアニメーション</b>（画面収録した動画）を置く。文字は見出しだけ</p>')
    en, ja = LINES[d['k']]
    cards.append('<section><h2>%d ｜ %s</h2>%s%s'
                 '<details><summary>この1枚で言うこと</summary><p class="say">%s</p>'
                 '<p class="sayja">%s</p></details></section>'
                 % (i + 1, TIMES[i], ''.join(rows), ''.join(extra),
                    _plain(en), html.escape(ja)))

io.open('docs/canva.html', 'w', encoding='utf-8').write("""<!doctype html><html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Yohaku — Canva に写す用</title><meta name="robots" content="noindex">
<style>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap');
*{box-sizing:border-box;margin:0}
body{background:#12101C;color:#EDEAF8;padding:20px 16px 60px;max-width:760px;margin:0 auto;
font-family:"M PLUS Rounded 1c",-apple-system,"Hiragino Maru Gothic ProN",sans-serif;font-weight:700}
h1{font-size:27px;font-weight:900;margin-bottom:6px}
p.s{font-size:15px;color:#8B83B8;margin-bottom:20px;line-height:1.7}
.global{background:#1B1830;border-radius:18px;padding:16px 18px;margin-bottom:20px;font-size:15px;line-height:1.9}
.global b{color:#A99BFF}
section{background:#1B1830;border-radius:20px;padding:16px 16px 14px;margin-bottom:14px}
section>h2{font-size:18px;font-weight:900;margin-bottom:12px;color:#A99BFF}
.f{margin-bottom:11px}
.fh{display:flex;align-items:center;gap:9px;margin-bottom:6px;flex-wrap:wrap}
.fh b{font-size:15px}
.fh span{font:900 11.5px ui-monospace,Menlo,monospace;color:#8B83B8;flex:1}
button{font:inherit;font-size:13px;font-weight:900;background:#5B4BE0;color:#fff;border:0;
border-radius:99px;padding:7px 16px;cursor:pointer}
button.done{background:#57A80A}
pre{white-space:pre-wrap;word-break:break-word;font-family:inherit;font-weight:800;font-size:17px;
line-height:1.55;color:#EDEAF8;background:#12101C;border-radius:12px;padding:12px 13px}
.hint{font-size:13.5px;color:#8B83B8;margin-top:8px;line-height:1.6}
.hint.warn{color:#FFC46B}
details{margin-top:10px}summary{cursor:pointer;font-size:14px;color:#8B83B8}
.say{font-size:15px;line-height:1.7;margin-top:8px}
.sayja{font-size:13.5px;color:#8B83B8;line-height:1.75;margin-top:6px}
</style></head><body>
<h1>Canva に写す用</h1>
<p class="s">1枚ぶんずつ <b>copy</b> して貼るだけ。記号は入っていません。<br>
色とサイズは各行の右に書いてあります。</p>
<div class="global">
<b>背景</b>　#E9F0FF → #F4EDFF → #FFEAF6（160°のグラデ）<br>
<b>フォント</b>　Zen Maru Gothic の Black（無ければ M PLUS Rounded 1c）<br>
<b>紫</b> #5B4BE0　<b>ピンク</b> #DE3F97　<b>黒</b> #1D1B26　<b>灰</b> #6B6484<br>
<b>枠線と影は付けない。</b>サイズは 1920×1080 想定
</div>
""" + '\n'.join(cards) + """
<script>
document.addEventListener('click', async e => {
  const b = e.target.closest('button[data-for]'); if (!b) return;
  const t = document.getElementById(b.dataset.for).textContent;
  try { await navigator.clipboard.writeText(t); } catch {}
  b.textContent = 'copied'; b.classList.add('done');
  setTimeout(() => { b.textContent = 'copy'; b.classList.remove('done'); }, 1500);
});
</script>
</body></html>
""")
print('docs/canva.html —', len(cards), 'slides')
