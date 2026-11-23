'use client';

import { useEffect, useRef, useState } from 'react';
import { solutions, v2Products } from '../content';

/*
 * Section · Solutions — "One product, four answers" (chosen concept C).
 * One unbranded electrical product stays on stage. Each Checko product is a question a brand asks, and the box moves to answer it:
 * the camera frames its label (Authenticate), it opens a conversation (Engage), travels the supply chain (Trace)
 * and becomes a tile on the market map (Insights).
 * Scroll-driven: the section pins to the screen and each question opens as you scroll; clicking one scrolls to it.
 * On very short screens (under 620px tall) it stays a normal accordion.
 */

const PR = { src: '/assets/v2b-elec.webp', aspect: v2Products.elec.aspect, tag: v2Products.elec.tag };
const STN: [string, string, number, number][] = [['Plant', 'Packed', 0.1, 0.74], ['Distributor', 'Received', 0.37, 0.5], ['Wholesaler', 'Received', 0.63, 0.7], ['Electrician', 'Installed', 0.9, 0.42]];
const CARDS: [Icon, string, string, string?][] = [['warranty', 'Warranty registered', '2-year cover active'], ['video', 'Installation guide', 'Watched in full'], ['ar', 'Seen in AR', 'Before buying more'], ['offer', 'MCB offer opened', 'Cross-sell', 'Saved']];
// Insights: weekly scans (genuine) and the regions they came from; one region is flagged
const WEEK = [22, 28, 26, 34, 39, 37, 45, 52, 49, 58, 63, 71];
const REG: [string, number, boolean?][] = [['North', 0.82], ['West', 0.94], ['South', 0.66], ['East', 0.38, true]];

type Icon = keyof typeof PATHS;
const PATHS = {
  auth: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  engage: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  trace: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  insights: '<path d="M5 19V11M10 19V5M15 19v-6M20 19v-9M3 21h18"/>',
  warranty: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 14l2 2 3-4"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
  ar: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  offer: '<path d="M3 12V4h8l10 10-7 7z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>',
  pause: '<path d="M9 6v12M15 6v12"/>', play: '<path d="M8 5l11 7-11 7z"/>',
};
const Sv = ({ d, w = 1.8 }: { d: Icon; w?: number }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: PATHS[d] }} />
);
const Check = () => <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M6 14.5 L11.5 20 L22 8.5" fill="none" stroke="#1A1D1F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Warn = () => <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M14 5 L24 22 H4 Z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" /><path d="M14 11 V15.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><circle cx="14" cy="18.8" r="1.3" fill="#fff" /></svg>;
const Tick = () => <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3 5 8.6 9.6 3.5" fill="none" stroke="#1A1D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (a: number, b: number, t: number) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function Solutions() {
  const [cur, setCur] = useState(0);
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // the frame loop reads these, so changes never restart it
  const state = useRef({ cur: 0, shownAt: 0, pinned: false });
  const N = solutions.length;

  const openStep = (i: number) => {
    const s = state.current;
    if (i === s.cur) return;
    s.cur = i; s.shownAt = performance.now();
    setCur(i);
  };
  // pinned: scroll to the point where question i is open; otherwise just open it
  const go = (i: number) => {
    const el = root.current;
    i = (i + N) % N;
    if (!el || !state.current.pinned) { openStep(i); return; }
    const top = el.getBoundingClientRect().top + window.scrollY, range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * ((i + 0.5) / N), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    const el = root.current, st = stage.current;
    if (!el || !st) return;
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = <T extends Element>(q: string) => st.querySelector(q) as T;
    const $$ = <T extends Element>(q: string) => [...st.querySelectorAll(q)] as T[];
    const prod = $<HTMLDivElement>('.c-prod');
    const OV = { auth: $<HTMLDivElement>('.ov-auth'), engage: $<HTMLDivElement>('.ov-engage'), trace: $<HTMLDivElement>('.ov-trace'), ins: $<HTMLDivElement>('.ov-ins') };
    const aBrk = $<HTMLDivElement>('.brk'), aLine = aBrk.querySelector('i') as HTMLElement, calls = $$<HTMLElement>('.callout'), aChip = $<HTMLElement>('.ov-auth .chip');
    const eCards = $$<HTMLElement>('.ecard');
    const rAll = $<SVGPathElement>('.route .all'), rDone = $<SVGPathElement>('.route .done'), circ = $$<SVGCircleElement>('.route circle'), stns = $$<HTMLElement>('.stn');
    const iLine = $<SVGPathElement>('.ins-chart .ln'), iArea = $<SVGPathElement>('.ins-chart .ar'), iDot = $<SVGCircleElement>('.ins-chart .pt');
    const iBars = $$<HTMLElement>('.ins-reg i'), sides = $$<HTMLElement>('.side > div');
    const bars = [...el.querySelectorAll('.qi .pgbar')] as HTMLElement[];
    const rise = (e: HTMLElement, u: number, d = 12) => { u = RM ? 1 : ease(clamp(u, 0, 1)); e.style.opacity = String(u); e.style.transform = u >= 1 ? '' : `translateY(${(1 - u) * d}px)`; };
    const fade = (e: HTMLElement, u: number) => { e.style.opacity = String(RM ? 1 : clamp(u, 0, 1)); };
    const opa: Record<string, number> = { auth: 0, engage: 0, trace: 0, ins: 0 };
    let rect: { x: number; y: number; w: number } | null = null, last = performance.now(), raf = 0, visible = false;
    const s = state.current; s.shownAt = performance.now();
    const pinMQ = matchMedia('(min-height: 620px)');
    const count = el.querySelector('.sol-count b') as HTMLElement | null;

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      // the scroll decides which question is open
      s.pinned = pinMQ.matches;
      let p = 0;
      if (s.pinned) {
        const r = el.getBoundingClientRect(), range = Math.max(1, el.offsetHeight - window.innerHeight);
        const prog = clamp(-r.top / range, 0, 0.9999) * N, idx = Math.floor(prog);
        p = prog - idx;
        openStep(idx);
      }
      const cur = s.cur, t = (now - s.shownAt) / 1000;
      if (count) count.textContent = String(cur + 1).padStart(2, '0');
      bars.forEach((b, j) => { b.style.width = (s.pinned ? (j < cur ? 100 : j === cur ? p * 100 : 0) : 0) + '%'; });
      const W = st.clientWidth, H = st.clientHeight, narrow = W < 520;
      const pts = STN.map(q => [q[2] * W, q[3] * H]);
      const legs = RM ? 3 : clamp((t - 0.6) / 1.2, 0, 3), f = Math.min(2, Math.floor(legs)), fr = legs - f;
      const at = cur === 2 ? [lerp(pts[f][0], pts[f + 1][0], ease(fr)), lerp(pts[f][1], pts[f + 1][1], ease(fr))] : null;
      let want: { x: number; y: number; w: number };
      if (cur === 0) { const Wr = Math.min((W * 0.3) / PR.tag[2], (H * 0.3 * PR.aspect) / PR.tag[3]); want = { x: W / 2 - (PR.tag[0] + PR.tag[2] / 2) * Wr, y: H * 0.48 - ((PR.tag[1] + PR.tag[3] / 2) * Wr) / PR.aspect, w: Wr }; }
      else if (cur === 1) { const bw = Math.min(W * 0.46, H * 0.66 * PR.aspect), bh = bw / PR.aspect; want = { x: W * (narrow ? 0.02 : 0.05), y: (H - bh) / 2, w: bw }; }
      else if (cur === 2) { const w = narrow ? 58 : 84; want = { x: at![0] - w / 2, y: at![1] - w / PR.aspect - 14, w }; }
      else { const w = narrow ? 40 : 64; want = { x: W * (narrow ? 0.04 : 0.7), y: H * (narrow ? 0.015 : 0.04), w }; }
      if (!rect || RM) rect = { ...want };
      const k = 1 - Math.exp(-dt * (cur === 2 ? 14 : 5));
      (['x', 'y', 'w'] as const).forEach(q => { rect![q] += (want[q] - rect![q]) * k; });
      prod.style.width = rect.w + 'px'; prod.style.height = rect.w / PR.aspect + 'px'; prod.style.transform = `translate(${rect.x}px,${rect.y}px)`;
      (['auth', 'engage', 'trace', 'ins'] as const).forEach((q, j) => {
        opa[q] += ((j === cur ? 1 : 0) - opa[q]) * (RM ? 1 : k * 1.4);
        OV[q].style.opacity = opa[q].toFixed(3); OV[q].style.visibility = opa[q] < 0.01 ? 'hidden' : 'visible';
      });
      const tr = { x: rect.x + PR.tag[0] * rect.w, y: rect.y + (PR.tag[1] * rect.w) / PR.aspect, w: PR.tag[2] * rect.w, h: (PR.tag[3] * rect.w) / PR.aspect };
      if (cur === 0) {
        Object.assign(aBrk.style, { left: tr.x - 10 + 'px', top: tr.y - 10 + 'px', width: tr.w + 20 + 'px', height: tr.h + 20 + 'px' });
        const u = RM ? 1 : smooth(0.8, 2.2, t); aLine.style.top = u * (tr.h + 16) + 'px'; aLine.style.opacity = RM || u >= 1 ? '0' : '1';
        const mid = tr.x + tr.w / 2;
        const spots = narrow
          ? [[mid, tr.y - 50, 2], [mid, tr.y + tr.h + 64, 2], [mid, tr.y + tr.h + 100, 2]]
          : [[tr.x - 18, tr.y + tr.h * 0.3, 1], [tr.x + tr.w + 18, tr.y + tr.h * 0.12, 0], [tr.x + tr.w + 18, tr.y + tr.h * 0.7, 0]];
        calls.forEach((cl, i) => { const [x, y, side] = spots[i]; cl.style.left = x + 'px'; cl.style.top = y + 'px'; cl.style.transform = side === 2 ? 'translateX(-50%)' : side ? 'translateX(-100%)' : ''; fade(cl, (t - 1.2 - i * 0.3) / 0.4); });
        aChip.style.left = mid + 'px'; aChip.style.top = tr.y + tr.h + 22 + 'px'; fade(aChip, (t - 2.3) / 0.3);
      }
      if (cur === 1) eCards.forEach((c, i) => rise(c, (t - 0.6 - i * 0.4) / 0.45));
      if (cur === 2 || opa.trace > 0.01) {
        rAll.setAttribute('d', 'M' + pts.map(q => q.join(' ')).join(' L'));
        rDone.setAttribute('d', 'M' + pts.slice(0, f + 1).map(q => q.join(' ')).join(' L') + (at ? ` L${at[0]} ${at[1]}` : ''));
        circ.forEach((c, i) => { c.setAttribute('cx', String(pts[i][0])); c.setAttribute('cy', String(pts[i][1])); c.setAttribute('fill', legs >= i - 0.001 ? '#1A1D1F' : '#FFFFFF'); });
        stns.forEach((n, i) => { n.style.left = pts[i][0] + 'px'; n.style.top = pts[i][1] + 16 + 'px'; });
      }
      if (cur === 3) {
        // the weekly line draws itself, the area fills in under it, then the regions report in
        const u = RM ? 1 : ease(smooth(0.3, 1.9, t)), len = iLine.getTotalLength();
        iLine.style.strokeDasharray = `${len}`; iLine.style.strokeDashoffset = `${len * (1 - u)}`;
        iArea.style.opacity = String(u * 0.9);
        const pt = iLine.getPointAtLength(len * u); iDot.setAttribute('cx', String(pt.x)); iDot.setAttribute('cy', String(pt.y));
        iBars.forEach((b, i) => { const v = RM ? 1 : ease(smooth(1.2 + i * 0.18, 2.1 + i * 0.18, t)); b.style.transform = `scaleX(${(v * REG[i][1]).toFixed(3)})`; });
        sides.forEach((d, i) => rise(d, (t - 1.2 - i * 0.45) / 0.45));
      }
      if (visible) raf = requestAnimationFrame(frame);
    };
    // only animate while the section is on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }, { threshold: 0 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={root} id="solutions" className="solutions" aria-labelledby="solutions-title" style={{ '--steps': N } as React.CSSProperties}>
      <div className="sol-pin">
      <div className="c-grid">
        <div className="sol-left">
        <div className="sol-head" data-rv>
          <span className="kicker">Solutions</span>
          <h2 id="solutions-title">One product. One scan. <span className="hl">Four answers.</span></h2>
          <p>Follow one product from the scan to the market data it leaves behind. Keep scrolling.</p>
        </div>
        <div className="qs">
          {solutions.map((s, i) => {
            const on = cur === i;
            return (
              <div key={s.key} className={`qi${on ? ' on' : ''}`}>
                <button type="button" aria-expanded={on} aria-controls={`sol-${s.key}`} onClick={() => go(i)}>
                  <i><Sv d={s.key as Icon} /></i>
                  <span><b>{s.q}</b><small>{s.name}</small></span>
                </button>
                <div className="more" id={`sol-${s.key}`}>
                  <div>
                    <div className="say">
                      <h3>{s.head}</h3>
                      <p>{s.body}</p>
                      <ul>{s.chips.map(c => <li key={c}><b><Tick /></b>{c}</li>)}</ul>
                      <a className="say-cta" href="#contact">Talk to our team <span aria-hidden="true">→</span></a>
                    </div>
                  </div>
                </div>
                <span className="pgbar" />
              </div>
            );
          })}
        </div>
        </div>
        <div className="c-side">
          <div ref={stage} className="c-stage" aria-hidden="true">
            <div className="c-prod"><img src={PR.src} alt="" width={1948} height={1380} decoding="async" /></div>
            <div className="ov ov-auth">
              <div className="brk"><i /></div>
              <span className="callout"><i />Raised 3D pattern</span>
              <span className="callout"><i />Code tied to that pattern</span>
              <span className="callout"><i />Checked by AI</span>
              <span className="chip ok"><Check />Genuine</span>
            </div>
            <div className="ov ov-engage">
              <div className="stack">
                {CARDS.map(([ic, b, sm, em]) => (
                  <div key={b} className="ecard"><i><Sv d={ic} /></i><div><b>{b}</b><span>{sm}</span></div>{em && <em>{em}</em>}</div>
                ))}
              </div>
            </div>
            <div className="ov ov-trace">
              <svg className="route">
                <path className="all" fill="none" stroke="#C9CCCA" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
                <path className="done" fill="none" stroke="#1A1D1F" strokeWidth="3" strokeLinecap="round" />
                {STN.map(([a]) => <circle key={a} r="9" fill="#fff" stroke="#1A1D1F" strokeWidth="2.5" />)}
              </svg>
              {STN.map(([a, b]) => <span key={a} className="stn">{a}<small>{b}</small></span>)}
            </div>
            <div className="ov ov-ins">
              <div className="ins-card">
                <div className="ins-top"><b>Genuine scans</b><span>Last 12 weeks</span></div>
                <svg className="ins-chart" viewBox="0 0 300 160" preserveAspectRatio="none">
                  <defs><linearGradient id="insfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9962B" stopOpacity=".35" /><stop offset="1" stopColor="#C9962B" stopOpacity="0" /></linearGradient></defs>
                  {[40, 80, 120].map(y => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#E6E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
                  <path className="ar" d="M0.0 110.4 L27.3 99.6 L54.5 103.2 L81.8 88.8 L109.1 79.8 L136.4 83.4 L163.6 69.0 L190.9 56.4 L218.2 61.8 L245.5 45.6 L272.7 36.6 L300.0 22.2 L300 160 L0 160 Z" fill="url(#insfill)" />
                  <path className="ln" d="M0.0 110.4 L27.3 99.6 L54.5 103.2 L81.8 88.8 L109.1 79.8 L136.4 83.4 L163.6 69.0 L190.9 56.4 L218.2 61.8 L245.5 45.6 L272.7 36.6 L300.0 22.2" fill="none" stroke="#1A1D1F" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <circle className="pt" r="5" fill="#C9962B" stroke="#fff" strokeWidth="2" />
                </svg>
                <ul className="ins-reg">
                  {REG.map(([n, , bad]) => <li key={n} className={bad ? 'bad' : ''}><span>{n}</span><em><i /></em></li>)}
                </ul>
              </div>
              <div className="side">
                <div><b>48,210</b><span>scans this week</span></div>
                <div><span className="chip bad"><Warn />Suspect</span><span>East region flagged. Field team alerted.</span></div>
                <div><b>+18%</b><span>genuine demand, West zone</span></div>
              </div>
            </div>
          </div>
          <div className="c-foot">
            <span className="sol-count" aria-hidden="true"><b>01</b> / {String(N).padStart(2, '0')}</span>
            <span className="sample">Illustration with sample data.</span>
            <div className="ctrl">
              <button type="button" aria-label="Previous solution" disabled={cur === 0} onClick={() => go(cur - 1)}><Sv d="prev" w={2} /></button>
              <button type="button" aria-label="Next solution" disabled={cur === N - 1} onClick={() => go(cur + 1)}><Sv d="next" w={2} /></button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
