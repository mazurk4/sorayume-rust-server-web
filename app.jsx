/* global React, ReactDOM, CONTENT */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─── localStorage-backed state ────────────────────────────────────
function useLocalState(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : defaultVal;
    } catch { return defaultVal; }
  });
  const set = useCallback((v) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [val, set];
}

// ─── Starfield (seeded random so stars don't jump on re-render) ──
function makeStars(n, seed=1){
  const rand = (() => { let s = seed; return () => (s = (s*9301 + 49297) % 233280) / 233280; })();
  const arr = [];
  for (let i=0;i<n;i++){
    const big = rand() < 0.08;
    const gold = rand() < 0.18;
    arr.push({
      top: rand()*100,
      left: rand()*100,
      size: big ? 2.5 + rand()*1.5 : 1 + rand()*1.2,
      tw: 2 + rand()*4,
      d: rand()*-6,
      gold, blue: !gold && rand() < 0.3,
    });
  }
  return arr;
}
const STARS = makeStars(160, 7);

function Starfield(){
  return (
    <>
      <div className="sky" aria-hidden="true"></div>
      <div className="stars-layer" aria-hidden="true">
        {STARS.map((s,i) => (
          <div key={i}
            className={`star ${s.gold?'gold':''} ${s.blue?'blue':''}`}
            style={{
              top:`${s.top}%`, left:`${s.left}%`,
              width:`${s.size}px`, height:`${s.size}px`,
              '--tw':`${s.tw}s`, '--d':`${s.d}s`,
            }}
          />
        ))}
        <div className="shoot"></div>
        <div className="shoot s2"></div>
        <div className="shoot s3"></div>
      </div>
    </>
  );
}

// ─── Wipe schedule loader (assets/wipes.txt; JST entries) ────────
// Format: YYYY-MMDD-HH:MM, one per line. Lines starting with '#' and blank lines are ignored.
function parseWipeLine(line) {
  const m = line.trim().match(/^(\d{4})-(\d{2})(\d{2})-(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  // JST = UTC+9 → convert to UTC by subtracting 9 hours
  return new Date(Date.UTC(+y, +mo - 1, +d, +h - 9, +mi, 0));
}
function useWipeSchedule() {
  const [schedule, setSchedule] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('assets/wipes.txt?_=' + Date.now())
      .then(r => r.ok ? r.text() : '')
      .then(text => {
        if (cancelled) return;
        const dates = text.split('\n')
          .map(parseWipeLine)
          .filter(Boolean)
          .sort((a, b) => a - b);
        setSchedule(dates);
      })
      .catch(() => { if (!cancelled) setSchedule([]); });
    return () => { cancelled = true; };
  }, []);
  return schedule;
}

// ─── Wipe countdown ──────────────────────────────────────────────
function useNextWipe() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const schedule = useWipeSchedule();

  const next = useMemo(() => {
    // Prefer the next future entry from wipes.txt
    if (schedule && schedule.length > 0) {
      const future = schedule.find(d => d > now);
      if (future) return future;
    }
    // Fallback: next Wednesday 12:00 JST (= 03:00 UTC)
    const d = new Date();
    const utcDay = d.getUTCDay();
    const utcHr  = d.getUTCHours();
    const utcMin = d.getUTCMinutes();
    let daysAhead = (3 - utcDay + 7) % 7;
    const isPastToday = utcHr > 3 || (utcHr === 3 && utcMin >= 0);
    if (daysAhead === 0 && isPastToday) daysAhead = 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysAhead, 3, 0, 0));
  }, [Math.floor(now.getTime()/60000), schedule]);

  const diff = Math.max(0, next - now);
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hrs, mins, secs, target: next };
}

function pick(v, lang){
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v.jp || '';
}

// ─── Slide chrome ────────────────────────────────────────────────
function SlideHead({ num, title, sub }) {
  return (
    <div>
      <div className="slide-num">{num}</div>
      <h2 className="slide-title"><span className="spark"></span>{title}</h2>
      {sub && <div className="slide-sub">{sub}</div>}
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────
function Nav({ lang, setLang, dark, onToggleDark, slideIdx, slides, goTo }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="#" onClick={(e)=>{e.preventDefault(); goTo(0);}}>
          <img src="assets/icon.png" alt="" />
          <div>
            <div className="b1">SORAYU.ME</div>
            <div className="b2">RUST SERVER</div>
          </div>
        </a>
        <div className="nav-links">
          {slides.map((s, i) => !s.navKey ? null : (
            <a key={s.id}
               className={`nav-link ${slideIdx === i ? 'active' : ''}`}
               href={`#${s.id}`}
               onClick={(e)=>{e.preventDefault(); goTo(i);}}>
              {pick(CONTENT.nav[s.navKey] || {jp:s.id, en:s.id}, lang)}
            </a>
          ))}
        </div>
        <div className="nav-controls">
          <button
            className="nav-theme-btn"
            onClick={onToggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
              </svg>
            )}
          </button>
          <div className="nav-lang" role="tablist" aria-label="language">
            <button className={lang==='jp'?'on':''} onClick={()=>setLang('jp')}>JP</button>
            <button className={lang==='en'?'on':''} onClick={()=>setLang('en')}>EN</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Quick info ──────────────────────────────────────────────────
function CopyButton({ text, lang }) {
  const [ok, setOk] = useState(false);
  return (
    <button className={`copy-btn ${ok?'ok':''}`} onClick={async ()=>{
      try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false), 1600); } catch(e){}
    }}>
      {ok ? pick(CONTENT.quick.copied, lang) : pick(CONTENT.quick.copy, lang)}
    </button>
  );
}

function formatJST(d) {
  if (!(d instanceof Date)) return '';
  // Render as YYYY-MM-DD HH:mm JST regardless of viewer's timezone
  const jst = new Date(d.getTime() + 9 * 3600000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth()+1)}-${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())} JST`;
}

function QuickInfo({ lang }) {
  const { days, hrs, mins, secs, target } = useNextWipe();
  const connect = 'client.connect rust-game.sorayu.me:28015';
  const steamJoin = 'steam://run/252490//+connect rust-game.sorayu.me:28015';
  return (
    <div className="quick">
      <div className="qcard">
        <div className="qlabel">{pick(CONTENT.quick.connect, lang)}</div>
        <div className="connect-line">
          <code>{connect}</code>
          <CopyButton text={connect} lang={lang} />
        </div>
        <a className="steam-join" href={steamJoin}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{width:14,height:14}}>
            <path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8.3 7.1 9.6l-1.3-2.6c-.4.1-.9.2-1.3.2-1.8 0-3.3-1.5-3.3-3.3 0-.4.1-.8.2-1.2L7 17l.6 1.3c.2.4.6.7 1 .8.4.1.9 0 1.2-.2 1.6-.8 2.2-2.8 1.4-4.4l-.6-1.2 4.3-3c.1 0 .2.1.3.1 2 0 3.6-1.6 3.6-3.6S17.2 3.2 15.2 3.2c-2 0-3.6 1.6-3.6 3.6v.1l-3 4.3c-1-.5-2.1-.4-3 .1l-3.4-1.7c.6-3.7 3.7-6.5 7.4-7 .3-.1.7-.1 1-.1 4.4 0 8 3.6 8 8s-3.6 8-8 8c-.3 0-.7 0-1-.1L8 22c1.3.3 2.6.5 4 .5 5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
          </svg>
          {lang==='jp' ? 'ゲームに参加' : 'Join game'}
        </a>
        <div className="connect-hint">
          {lang==='jp' ? 'ボタンで Steam が起動。コマンドは F1 コンソールでも使用可' : 'Click to launch via Steam. Or paste the command into the F1 console.'}
        </div>
      </div>
      <div className="qcard">
        <div className="qlabel">{pick(CONTENT.quick.nextWipe, lang)}</div>
        <div className="countdown">
          <span className="num">{days}</span><span className="lbl">{lang==='jp'?'日':'d'}</span>
          <span className="num" style={{marginLeft:6}}>{String(hrs).padStart(2,'0')}</span><span className="lbl">{lang==='jp'?'時':'h'}</span>
          <span className="num" style={{marginLeft:6}}>{String(mins).padStart(2,'0')}</span><span className="lbl">{lang==='jp'?'分':'m'}</span>
          <span className="num" style={{marginLeft:6,fontSize:18,opacity:.7}}>{String(secs).padStart(2,'0')}</span>
        </div>
        <div className="countdown-when">{target ? formatJST(target) : pick(CONTENT.quick.wipeNote, lang)}</div>
      </div>
      <div className="qcard">
        <div className="qlabel">{pick(CONTENT.quick.discord, lang)}</div>
        <a className="discord-btn" href="https://discord.gg/dxxPQQxJfQ" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a.07.07 0 0 0-.073.035c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.49 0c-.164-.394-.405-.874-.617-1.249A.077.077 0 0 0 9.697 3a19.736 19.736 0 0 0-3.76 1.369.07.07 0 0 0-.032.027C2.343 9.045 1.39 13.58 1.858 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.12 13.12 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .079.009c.12.099.246.198.373.293a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.42-2.157 2.42zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.42-2.157 2.42z"/>
          </svg>
          {pick(CONTENT.quick.joinNow, lang)}
        </a>
      </div>
    </div>
  );
}

// ─── Slide contents ──────────────────────────────────────────────
function HeroSlide({ lang, onNext }) {
  return (
    <section className="slide hero-slide" id="hero" data-screen-label="01 Hero">
      <div className="hero-frame">
        <img src="assets/banner.png" alt="SORAYU.ME Rust Server" />
        <div className="hero-overlay">
          <span className="hero-tag">
            <span className="dot"></span>
            {pick(CONTENT.hero.status, lang)} · {pick(CONTENT.hero.tag, lang)}
          </span>
          <div className="hero-cta">
            <a className="scroll-cue" onClick={(e)=>{e.preventDefault(); onNext();}} href="#">
              {lang==='jp' ? 'スクロールしてはじめる ↓' : 'Scroll to begin ↓'}
            </a>
          </div>
        </div>
      </div>
      <QuickInfo lang={lang} />
    </section>
  );
}

function ServerInfoSlide({ lang }) {
  const c = CONTENT.settings;
  const w = CONTENT.welcome;
  return (
    <section className="slide" id="info" data-screen-label="03 Server info">
      <div className="slide-inner">
        <SlideHead num="01 — Server" title={lang==='jp'?'サーバー情報':'Server information'} sub="Settings & operations" />
        <div className="card">
          <h3><span className="pip"></span>{lang==='jp'?'設定':'Settings'}</h3>
          <p style={{marginBottom:4}}>{pick(c.intro, lang)}</p>
          <div className="settings-grid">
            {c.items.map((it, i) => (
              <div className="setting" key={i}>
                <span className="k">{pick(it.k, lang)}</span>
                <span className="v">{pick(it.v, lang)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3><span className="pip"></span>{pick(w.title, lang)}</h3>
          {w.body[lang].map((p,i) => <p key={i}>{p}</p>)}
        </div>
        <div className="callout">
          <span className="ico">i</span>
          <div>
            {lang==='jp'
              ? <span>サポート・チート報告は Discord 内のお問い合わせチャンネルから <b>#claim-ticket</b> を発行してください。</span>
              : <span>For support or cheater reports, open a ticket in <b>#claim-ticket</b> on Discord.</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function RulesSlide({ lang }) {
  return (
    <section className="slide" id="rules" data-screen-label="04 Rules">
      <div className="slide-inner">
        <SlideHead num="02 — Rules" title={lang==='jp'?'サーバールール':'Server rules'} sub={lang==='jp'?'プレイの基本':'Core rules'} />
        <div className="card">
          <div className="rules">
            {CONTENT.rules.map((r, i) => (
              <div className="rule" key={i}>
                <div className="rn">{String(i+1).padStart(2,'0')}</div>
                <div>
                  <div className="rt">{pick(r.t, lang)}</div>
                  <div className="rd">{pick(r.d, lang)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSlide({ lang }) {
  return (
    <section className="slide" id="faq" data-screen-label="05 FAQ">
      <div className="slide-inner">
        <SlideHead num="03 — FAQ" title="FAQ" sub={lang==='jp'?'よくある質問':'Frequently asked'} />
        <div className="faq">
          {CONTENT.faq.map((item, i) => (
            <details key={i} {...(i===0 ? {open:true} : {})}>
              <summary>
                <span className="q">Q{String(i+1).padStart(2,'0')}</span>
                <span>{pick(item.q, lang)}</span>
                <span className="chev">›</span>
              </summary>
              <div className="a-body">
                {item.a[lang].map((p, idx) => <p key={idx}>{p}</p>)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModSlide({ lang }) {
  const c = CONTENT.mod;
  return (
    <section className="slide" id="mod" data-screen-label="06 Recruit">
      <div className="slide-inner">
        <SlideHead num="04 — Recruit" title={lang==='jp'?'モデレーター募集中':'We\'re recruiting'} sub="Now hiring" />
        <div className="card">
          <p>{pick(c.intro, lang)}</p>
          <div className="mod-grid">
            {c.roles.map((r, i) => (
              <div className="mod" key={i}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{fontFamily:'"Cinzel",serif', fontWeight:700, color:'var(--gold)', fontSize:13}}>{r.n}</span>
                  {r.badge && <span className="badge">{pick(r.badge, lang)}</span>}
                </div>
                <h4>{pick(r.title, lang)}</h4>
                <div className="req">{lang==='jp'?'必須':'Required'}</div>
                <ul>{r.must[lang].map((m,j)=><li key={j}>{m}</li>)}</ul>
                <div className="req">{lang==='jp'?'歓迎':'Nice to have'}</div>
                <ul>{r.want[lang].map((m,j)=><li key={j}>{m}</li>)}</ul>
                {r.note && <div className="note">※ {pick(r.note, lang)}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StreamSlide({ lang }) {
  const c = CONTENT.stream;
  return (
    <section className="slide" id="stream" data-screen-label="07 Streaming">
      <div className="slide-inner">
        <SlideHead num="05 — Streaming" title={pick(c.title, lang)} sub="Stream policy" />
        <div className="card">
          <h3><span className="pip"></span>{lang==='jp'?'配信許可について':'Streaming permission'}</h3>
          {c.body[lang].map((p,i)=><p key={i}>{p}</p>)}
          <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
            {c.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                 style={{fontSize:12, padding:'5px 10px', background:'var(--bg-2)', borderRadius:6, border:'1px solid var(--line)'}}>
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
        <div className="card">
          <h3><span className="pip"></span>{lang==='jp'?'注意点':'Notes'}</h3>
          <ul>{c.notes[lang].map((p,i)=><li key={i}>{p}</li>)}</ul>
        </div>
        <div className="card">
          <h3><span className="pip"></span>{pick(c.event.title, lang)}</h3>
          <p>{pick(c.event.body, lang)}</p>
        </div>
      </div>
    </section>
  );
}

const NEWS_LATEST = 5;
const NEWS_PER_PAGE = 10;

function sortedNews() {
  return [...CONTENT.news].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function NewsSlide({ lang }) {
  const all = sortedNews();
  const latest = all.slice(0, NEWS_LATEST);
  const hasMore = all.length > NEWS_LATEST;
  return (
    <section className="slide" id="news" data-screen-label="08 News">
      <div className="slide-inner">
        <SlideHead num="06 — News" title={lang==='jp'?'おしらせ':'News'} sub="Updates" />
        <div className="card">
          {latest.map((n) => (
            <a
              key={n.id || n.date}
              className="news-item news-link"
              href={`#news/${n.id || n.date}`}
            >
              <div className="news-date">{n.date}</div>
              <div className="news-body">
                <div className="nt">{pick(n.title, lang)}</div>
                <div className="nd">{pick(n.body, lang)}</div>
              </div>
              <div className="news-chev" aria-hidden="true">›</div>
            </a>
          ))}
          {hasMore && (
            <div className="news-more">
              <a href="#news/page/2">
                {lang==='jp' ? '過去のおしらせを見る →' : 'View past news →'}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function NewsDetailView({ lang, id, onBack }) {
  const item = CONTENT.news.find(n => (n.id || n.date) === id);
  if (!item) {
    return (
      <section className="news-page">
        <div className="slide-inner">
          <a className="news-back" href="#news" onClick={(e)=>{e.preventDefault(); onBack();}}>
            ← {lang==='jp' ? 'おしらせ一覧へ' : 'Back to news'}
          </a>
          <div className="card">
            <p>{lang==='jp' ? 'おしらせが見つかりません。' : 'News item not found.'}</p>
          </div>
        </div>
      </section>
    );
  }
  const paragraphs = (item.content && item.content[lang]) || [pick(item.body, lang)];
  return (
    <section className="news-page">
      <div className="slide-inner">
        <a className="news-back" href="#news" onClick={(e)=>{e.preventDefault(); onBack();}}>
          ← {lang==='jp' ? 'おしらせ一覧へ' : 'Back to news'}
        </a>
        <article className="card news-article">
          <div className="news-article-meta">{item.date}</div>
          <h1 className="news-article-title">{pick(item.title, lang)}</h1>
          <div className="news-article-body">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </article>
      </div>
    </section>
  );
}

function NewsArchiveView({ lang, page, onBack }) {
  const all = sortedNews();
  const totalPages = Math.max(1, Math.ceil(all.length / NEWS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * NEWS_PER_PAGE;
  const items = all.slice(start, start + NEWS_PER_PAGE);
  return (
    <section className="news-page">
      <div className="slide-inner">
        <a className="news-back" href="#news" onClick={(e)=>{e.preventDefault(); onBack();}}>
          ← {lang==='jp' ? 'おしらせ一覧へ' : 'Back to news'}
        </a>
        <div className="news-archive-head">
          <h1 className="news-article-title">{lang==='jp' ? 'おしらせバックナンバー' : 'News archive'}</h1>
          <div className="news-article-meta">
            {lang==='jp' ? `${safePage} / ${totalPages} ページ` : `Page ${safePage} / ${totalPages}`}
          </div>
        </div>
        <div className="card">
          {items.length === 0 ? (
            <p>{lang==='jp' ? 'このページにおしらせはありません。' : 'No items on this page.'}</p>
          ) : items.map((n) => (
            <a
              key={n.id || n.date}
              className="news-item news-link"
              href={`#news/${n.id || n.date}`}
            >
              <div className="news-date">{n.date}</div>
              <div className="news-body">
                <div className="nt">{pick(n.title, lang)}</div>
                <div className="nd">{pick(n.body, lang)}</div>
              </div>
              <div className="news-chev" aria-hidden="true">›</div>
            </a>
          ))}
        </div>
        <div className="news-pager">
          <a
            className={`news-pager-btn ${safePage <= 1 ? 'disabled' : ''}`}
            href={safePage > 1 ? `#news/page/${safePage - 1}` : '#news'}
            aria-disabled={safePage <= 1}
          >
            ← {lang==='jp' ? '前へ' : 'Prev'}
          </a>
          <span className="news-pager-info">{safePage} / {totalPages}</span>
          <a
            className={`news-pager-btn ${safePage >= totalPages ? 'disabled' : ''}`}
            href={safePage < totalPages ? `#news/page/${safePage + 1}` : `#news/page/${safePage}`}
            aria-disabled={safePage >= totalPages}
          >
            {lang==='jp' ? '次へ' : 'Next'} →
          </a>
        </div>
      </div>
    </section>
  );
}

function OutroSlide({ lang, onOpenTerms }) {
  return (
    <section className="slide foot-slide" id="outro" data-screen-label="09 Outro">
      <div className="foot-brand">
        <img src="assets/icon.png" alt="" />
        <div>
          <div><b>SORAYU.ME</b></div>
          <div style={{fontFamily:'"Cinzel",serif',letterSpacing:'.16em',fontSize:11,color:'var(--brown)',marginTop:4}}>RUST SERVER</div>
          <div className="foot-meta">{lang==='jp'?'see you under the stars.':'see you under the stars.'}</div>
        </div>
      </div>
      <div className="foot-links">
        <a className="discord-btn" href="https://discord.gg/dxxPQQxJfQ" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{width:16,height:16}}>
            <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a.07.07 0 0 0-.073.035c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.49 0c-.164-.394-.405-.874-.617-1.249A.077.077 0 0 0 9.697 3a19.736 19.736 0 0 0-3.76 1.369.07.07 0 0 0-.032.027C2.343 9.045 1.39 13.58 1.858 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.12 13.12 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .079.009c.12.099.246.198.373.293a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.42-2.157 2.42zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.42-2.157 2.42z"/>
          </svg>
          {lang==='jp'?'Discord に参加':'Join Discord'}
        </a>
        <button type="button" className="terms-link" onClick={onOpenTerms}>
          {pick(CONTENT.terms.link, lang)}
        </button>
        <span style={{opacity:.5}}>·</span>
        <span>© {new Date().getFullYear()} SORAYU.ME</span>
      </div>
    </section>
  );
}

function TermsModal({ onClose }) {
  const t = CONTENT.terms;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.title.jp}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{t.title.jp}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="modal-body">
          {t.intro.map((p, i) => <p key={`intro-${i}`}>{p}</p>)}
          {t.sections.map((s, i) => (
            <section key={i} className="terms-section">
              <h3>{s.h}</h3>
              {s.lead && <p>{s.lead}</p>}
              <ol>
                {s.body.map((b, j) => <li key={j}>{b}</li>)}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────
const SLIDES = [
  { id:'hero',    navKey:null,       Comp:HeroSlide,      lab:{jp:'トップ', en:'Home'} },
  { id:'info',    navKey:'info',     Comp:ServerInfoSlide,lab:{jp:'サーバー情報', en:'Server'} },
  { id:'rules',   navKey:'rules',    Comp:RulesSlide,     lab:{jp:'ルール', en:'Rules'} },
  { id:'faq',     navKey:'faq',      Comp:FAQSlide,       lab:{jp:'FAQ', en:'FAQ'} },
  { id:'mod',     navKey:'mod',      Comp:ModSlide,       lab:{jp:'募集', en:'Recruit'} },
  { id:'stream',  navKey:'stream',   Comp:StreamSlide,    lab:{jp:'配信', en:'Streaming'} },
  { id:'news',    navKey:'news',     Comp:NewsSlide,      lab:{jp:'おしらせ', en:'News'} },
  { id:'outro',   navKey:null,       Comp:OutroSlide,     lab:{jp:'End', en:'End'} },
];

// Parse hash → view descriptor
function parseHash(raw) {
  const h = (raw || '').replace(/^#/, '');
  if (!h) return { kind:'deck', slideId:null };
  if (h.startsWith('news/')) {
    const rest = h.slice(5);
    if (rest.startsWith('page/')) {
      const n = parseInt(rest.slice(5), 10);
      return { kind:'news-archive', page: Number.isFinite(n) && n >= 1 ? n : 1 };
    }
    if (rest === 'archive') return { kind:'news-archive', page:1 };
    if (rest.length > 0)    return { kind:'news-detail', id:rest };
  }
  return { kind:'deck', slideId:h };
}

function App() {
  const [dark, setDark] = useLocalState('sorayu-dark', true);
  const [lang, setLang] = useLocalState('sorayu-lang', 'jp');
  const [slideIdx, setSlideIdx] = useState(0);
  const [view, setView] = useState(() => parseHash(window.location.hash));
  const [termsOpen, setTermsOpen] = useState(false);
  const deckRef = useRef(null);
  const slideIdxRef = useRef(0);
  const snapTimerRef = useRef(0);
  const programmaticScrollUntilRef = useRef(0);

  useEffect(() => { slideIdxRef.current = slideIdx; }, [slideIdx]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  const onToggleDark = () => setDark(!dark);
  const onSetLang = (l) => setLang(l);

  // Hash → view sync
  useEffect(() => {
    const onHashChange = () => setView(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // When switching views (deck ↔ news-page), reset scroll appropriately.
  // Use instant scroll (overriding CSS scroll-behavior) so the view jump doesn't animate
  // and race with the detection logic.
  useEffect(() => {
    const jump = (top) => {
      programmaticScrollUntilRef.current = Date.now() + 500;
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, top);
      // restore on next frame
      requestAnimationFrame(() => { html.style.scrollBehavior = prev; });
    };

    if (view.kind === 'deck') {
      if (view.slideId) {
        const idx = SLIDES.findIndex(s => s.id === view.slideId);
        if (idx >= 0) {
          const el = document.querySelectorAll('.slide')[idx];
          if (el) jump(el.offsetTop);
          setSlideIdx(idx);
        }
      }
    } else {
      jump(0);
    }
  }, [view.kind, view.slideId, view.id, view.page]);

  // Detect which slide occupies the viewport center; also sync hash
  // (only when scroll has actually settled on the slide top, to avoid mount-time flicker)
  useEffect(() => {
    if (view.kind !== 'deck') return;
    let raf = 0;
    const recompute = () => {
      const slides = document.querySelectorAll('.slide');
      if (!slides.length) return;
      const probe = window.scrollY + window.innerHeight / 2;
      let best = 0;
      for (let i = 0; i < slides.length; i++) {
        if (slides[i].offsetTop <= probe) best = i;
      }
      setSlideIdx(best);

      // Keep URL in sync with whichever slide is currently in view.
      const id = SLIDES[best]?.id;
      if (id && parseHash(window.location.hash).slideId !== id) {
        history.replaceState(null, '', `#${id}`);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
    };
    recompute();
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recompute);
    };
  }, [view.kind]);

  const goTo = useCallback((i) => {
    if (view.kind !== 'deck') {
      // Switch back to deck first; hashchange handler will scroll
      const id = SLIDES[Math.max(0, Math.min(SLIDES.length-1, i))]?.id;
      if (id) window.location.hash = `#${id}`;
      return;
    }
    const slides = document.querySelectorAll('.slide');
    const clamped = Math.max(0, Math.min(slides.length-1, i));
    const target = slides[clamped];
    if (target) window.scrollTo({ top: target.offsetTop, behavior:'smooth' });
  }, [view.kind]);

  // Snap-on-stop: after the user stops scrolling, gently snap to the nearest
  // slide IF the misalignment is small enough that it's clearly "the slide
  // they're trying to read". Tall slides (taller than viewport) are left alone
  // so the user can scroll through their content naturally.
  useEffect(() => {
    if (view.kind !== 'deck') return;

    const SNAP_DELAY = 220;        // ms after last scroll before snapping
    const SNAP_SOFT_TOLERANCE = 0.55; // fraction of viewport: drift below this triggers a soft snap

    const trySnap = () => {
      if (Date.now() < programmaticScrollUntilRef.current) return;
      const slides = document.querySelectorAll('.slide');
      if (!slides.length) return;
      const vh = window.innerHeight;
      const sy = window.scrollY;

      // pick the slide whose top is closest to current scrollY
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < slides.length; i++) {
        const d = Math.abs(slides[i].offsetTop - sy);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      }
      const target = slides[nearestIdx];
      if (!target) return;

      // If user is well within a tall slide, don't snap.
      if (target.offsetHeight > vh + 4 && sy > target.offsetTop + 4 && sy + vh < target.offsetTop + target.offsetHeight - 4) {
        return;
      }
      // Only snap if drift is modest (typical "stopped mid-section" case)
      if (nearestDist <= vh * SNAP_SOFT_TOLERANCE && nearestDist > 2) {
        window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      }
    };

    const onScroll = () => {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(trySnap, SNAP_DELAY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(snapTimerRef.current);
    };
  }, [view.kind]);

  // Keyboard nav (deck only)
  useEffect(() => {
    if (view.kind !== 'deck') return;
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); goTo(slideIdxRef.current+1); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(slideIdxRef.current-1); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End')  { e.preventDefault(); goTo(SLIDES.length-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view.kind, goTo]);

  const goBackToNews = useCallback(() => {
    window.location.hash = '#news';
  }, []);

  const progress = SLIDES.length > 1 ? (slideIdx / (SLIDES.length-1)) * 100 : 0;
  const isDeck = view.kind === 'deck';

  return (
    <>
      <Starfield />
      <Nav lang={lang} setLang={onSetLang} dark={dark} onToggleDark={onToggleDark} slideIdx={slideIdx} slides={SLIDES} goTo={goTo} />
      {isDeck && (
        <div className="deck-progress"><div className="bar" style={{width:`${progress}%`}}></div></div>
      )}

      {isDeck ? (
        <div className="deck" ref={deckRef}>
          {SLIDES.map((s, i) => (
            <s.Comp key={s.id} lang={lang} onNext={() => goTo(i+1)} onOpenTerms={() => setTermsOpen(true)} />
          ))}
        </div>
      ) : view.kind === 'news-detail' ? (
        <NewsDetailView lang={lang} id={view.id} onBack={goBackToNews} />
      ) : (
        <NewsArchiveView lang={lang} page={view.page} onBack={goBackToNews} />
      )}

      {isDeck && (
        <>
          {/* Right rail dots */}
          <div className="deck-dots" aria-hidden="true">
            {SLIDES.map((s, i) => (
              <button key={s.id} className={`d ${slideIdx===i?'on':''}`} onClick={()=>goTo(i)} aria-label={pick(s.lab, lang)}>
                <span className="lab">{pick(s.lab, lang)}</span>
              </button>
            ))}
          </div>

          {/* Counter + arrows */}
          <div className="deck-counter">
            <b>{String(slideIdx+1).padStart(2,'0')}</b>
            <span style={{margin:'0 6px',opacity:.4}}>/</span>
            {String(SLIDES.length).padStart(2,'0')}
          </div>
          <div className="deck-arrows">
            <button onClick={()=>goTo(slideIdx-1)} disabled={slideIdx===0} aria-label="prev">↑</button>
            <button onClick={()=>goTo(slideIdx+1)} disabled={slideIdx===SLIDES.length-1} aria-label="next">↓</button>
          </div>
        </>
      )}

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
