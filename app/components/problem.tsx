'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * Section 2 · The problem — the headline and running ticker stay fixed on the left;
 * the three "ways it hurts" stats are a stack of cards on the right that cycle on
 * their own, each one sliding in front of the last (reference: a card carousel that
 * auto-advances while sitting next to a fixed headline), and can also be stepped
 * through by hand or by scrolling the mouse wheel while hovered.
 */

const YEAR = 365 * 24 * 3600;
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// every amount in US dollars; India's tax loss is FICCI's ₹58,521 crore (2019–20) at that year's average of about ₹70.9 per US$
type Feed = 'global' | 'tax';
const FEEDS: Record<Feed, { rate: number; fmt: Intl.NumberFormat; label: string; per: string }> = {
  global: { rate: 467e9 / YEAR, fmt: usd, label: 'Fakes traded worldwide since you opened this page', per: '≈ $14,800 every second' },
  tax: { rate: 8.3e9 / YEAR, fmt: usd, label: 'Tax India lost since you opened this page', per: '≈ $260 every second' },
};

// amounts first, then percentages
type Viz = 'share' | 'people' | 'tax';
type IconKey = 'coins' | 'tax' | 'people';
const ROWS: { big: string; title: string; line: string; viz: Viz; feed: Feed; src: string; icon: IconKey }[] = [
  { big: '$467bn', title: 'in fake goods traded every year', line: 'Up to 2.3% of all world imports. Every copy is a sale the real brand never makes.', viz: 'share', feed: 'global', src: 'OECD & EUIPO, Mapping Global Trade in Fakes 2025 (2021 data)', icon: 'coins' },
  { big: '$8.3bn', title: 'in tax lost in a single year', line: 'India, just five industries, one year.', viz: 'tax', feed: 'tax', src: 'FICCI CASCADE, Illicit Markets, 2022 (2019–20 data): ₹58,521 crore at about ₹70.9 per US$', icon: 'tax' },
  { big: '89%', title: 'of urban Indians have bought a fake', line: 'A good copy looks exactly like the real thing.', viz: 'people', feed: 'global', src: 'ASPA & CRISIL, State of Counterfeiting in India 2025 (1,639 consumers, 9 cities)', icon: 'people' },
];

const ICONS: Record<IconKey, string> = {
  coins: '<circle cx="9" cy="9" r="6"/><path d="M12.5 5.5a6 6 0 1 1 0 11"/>',
  tax: '<path d="M6 3h8l4 4v14H6z"/><path d="M8 9h7M8 13h7M8 17h4"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 20c0-2.2-.8-4.1-2.1-5.4A5 5 0 0 1 21 18.5V20"/>',
};
const Icon = ({ k }: { k: IconKey }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[k] }} />
);
const Stack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" />
  </svg>
);
const Prev = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>;
const Next = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;

function Chart({ viz, on }: { viz: Viz; on: boolean }) {
  if (viz === 'share') {
    const pct = 2.3;
    return (
      <div className="pv-share">
        <div className="pv-bar"><i style={{ width: on ? `${pct}%` : 0 }} /></div>
        <div className="pv-legend">
          <span><b className="char" />Fakes, 2.3%</span>
          <span><b />All other world trade</span>
        </div>
      </div>
    );
  }
  if (viz === 'people') {
    return (
      <div className="pv-people">
        <div className="pv-ppl" role="img" aria-label="89 out of 100 people highlighted">
          {Array.from({ length: 100 }, (_, k) => <i key={k} className={on && k < 89 ? 'on' : ''} style={{ transitionDelay: `${k * 14}ms` }} />)}
        </div>
        <span className="pv-cap">89 in every 100</span>
      </div>
    );
  }
  return (
    <div className="pv-pair">
      <div><strong>$8.3bn</strong><span>tax lost in 2019–20</span></div>
      <div><strong>5</strong><span>industries studied</span></div>
    </div>
  );
}

// "$467bn", "$8.3bn", "89%": counts from 0 the first time the section comes into view
function CountUp({ value, run }: { value: string; run: boolean }) {
  const m = value.match(/^([^\d]*)([\d,]+)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!m || !run || !ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const [, pre, num, post] = m, to = Number(num.replace(/,/g, '')), fmt = new Intl.NumberFormat('en-US');
    const el = ref.current, start = performance.now(), dur = 1400;
    let raf = 0;
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - u, 3);
      el.textContent = pre + fmt.format(Math.round(to * e)) + post;
      if (u < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className="acc-big">{value}</span>;
}

const CYCLE_MS = 4200;

export default function Problem() {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(false);
  const [feed, setFeed] = useState<Feed>('global');
  const [swapping, setSwapping] = useState(false);
  const [paused, setPaused] = useState(false);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement>(null);
  const root = useRef<HTMLElement>(null);
  const feedRef = useRef<Feed>('global');
  const activeRef = useRef(0);
  activeRef.current = active;

  // the running total: written straight to the DOM, and only while the section is on screen
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = false, shown = '';
    const tick = () => {
      const t = reduced ? 60 : performance.now() / 1000;
      const F = FEEDS[feedRef.current], s = F.fmt.format(Math.floor(F.rate * t));
      if (num.current && s !== shown) { shown = s; num.current.textContent = s; }
      if (bar.current) bar.current.style.width = reduced ? '100%' : `${(t % 1) * 100}%`;
      if (visible && !reduced) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) setSeen(true); cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(tick); else tick(); });
    if (root.current) io.observe(root.current);
    tick();
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  function goTo(next: number) {
    const n = ROWS.length;
    const k = ((next % n) + n) % n;
    setActive(k);
    const f = ROWS[k].feed;
    if (f === feedRef.current) return;
    setSwapping(true);
    window.setTimeout(() => { feedRef.current = f; setFeed(f); setSwapping(false); }, 240);
  }

  // auto-advance, paused on hover/focus/touch, right after a manual step, and while reduced motion is requested
  const lastManual = useRef(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      if (paused || performance.now() - lastManual.current < CYCLE_MS) return;
      goTo(activeRef.current + 1);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

  function manualGo(next: number) {
    lastManual.current = performance.now();
    goTo(next);
  }

  // scroll (wheel) over the card stack steps through it instead of scrolling the page
  const wheelLock = useRef(false);
  function onWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaY) < 12 || wheelLock.current) return;
    e.preventDefault();
    wheelLock.current = true;
    window.setTimeout(() => { wheelLock.current = false; }, 420);
    manualGo(activeRef.current + (e.deltaY > 0 ? 1 : -1));
  }

  return (
    <section ref={root} id="problem" className="problem" aria-labelledby="problem-title">
      <div className="problem-inner" data-rv>
        <div className="problem-left">
          <span className="problem-pill">The problem</span>
          <h2 id="problem-title">Counterfeiting costs <span className="hl">everyone.</span></h2>
          <p className="problem-sub">Every one of these starts with a fake nobody could tell apart.</p>
          <div className={`ticker${swapping ? ' swap' : ''}`} aria-live="off">
            <span className="ticker-lab">{FEEDS[feed].label}</span>
            <span ref={num} className="ticker-num">$0</span>
            <span className="ticker-rate">{FEEDS[feed].per}<i><b ref={bar} /></i></span>
          </div>
          <a className="problem-cta" href="#solutions">See how Checko stops it <span aria-hidden="true">→</span></a>
        </div>

        <div className="problem-right">
          <div className="pc-head">
            <i><Stack /></i>
            <span>Three ways it hurts</span>
          </div>
          <div
            className="pc-stack"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onWheel={onWheel}
            role="group"
            aria-roledescription="carousel"
            aria-label="Three ways counterfeiting hurts"
          >
            {ROWS.map((r, k) => {
              const n = ROWS.length;
              // signed position relative to the active card: 0 = centre, -1 = one to the left, +1 = one to the right
              let rel = (k - active + n) % n;
              if (rel > n / 2) rel -= n;
              const isFront = rel === 0;
              return (
                <article
                  key={r.big}
                  className={`pc-card${isFront ? ' front' : ''}`}
                  style={{ '--rel': rel } as React.CSSProperties}
                  aria-hidden={!isFront}
                >
                  <div className="pc-top">
                    <span className="pc-ic"><Icon k={r.icon} /></span>
                    <CountUp value={r.big} run={seen} />
                    <span className="pc-title">{r.title}</span>
                  </div>
                  <p className="pc-line">{r.line}</p>
                  <div className="pc-viz"><Chart viz={r.viz} on={isFront && seen} /></div>
                  <cite className="pc-src">{r.src}</cite>
                </article>
              );
            })}
          </div>
          <div className="pc-nav">
            <button type="button" className="arrow" aria-label="Previous" onClick={() => manualGo(active - 1)}><Prev /></button>
            <div className="pc-dots" role="tablist" aria-label="Choose a stat">
              {ROWS.map((r, k) => (
                <button key={r.big} type="button" role="tab" aria-selected={k === active} aria-label={r.title} className={k === active ? 'on' : ''} onClick={() => manualGo(k)} />
              ))}
            </div>
            <button type="button" className="arrow" aria-label="Next" onClick={() => manualGo(active + 1)}><Next /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
