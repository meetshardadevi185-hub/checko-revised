'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { industries, useCases, type UseCase } from '../content';

/*
 * Section · Industries — a conveyor belt driven by scroll.
 * The section pins to the screen; as you scroll, the belt carries the nine industries Checko serves.
 * The product in the centre comes forward, larger, and the panel underneath says what Checko does there.
 * On phones and under 620px tall it stays a plain, swipeable row (the panel underneath follows the swipe).
 */

const N = industries.length;
const UC_ICON: Record<UseCase, string> = {
  auth: 'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6zM9 12l2 2 4-4',
  trace: 'M6 18a2.5 2.5 0 1 0 0-.01M18 6a2.5 2.5 0 1 0 0-.01M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5',
  geo: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  loyalty: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z',
  warranty: 'M7 3h7l4 4v14H7zM14 3v4h4M10 14l2 2 3-4',
  engage: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
};
const Ic = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);


export default function Industries() {
  const [cur, setCur] = useState(0);
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const belt = useRef<HTMLDivElement>(null);
  const curRef = useRef(0);

  useEffect(() => {
    const el = root.current, tr = track.current, bl = belt.current;
    if (!el || !tr || !bl) return;
    const pinMQ = matchMedia('(min-height: 620px) and (min-width: 761px)');
    let raf = 0, visible = false;

    const frame = () => {
      if (!pinMQ.matches) { tr.style.transform = ''; if (visible) raf = requestAnimationFrame(frame); return; }
      const r = el.getBoundingClientRect(), range = Math.max(1, el.offsetHeight - window.innerHeight);
      const prog = clamp(-r.top / range, 0, 1) * (N - 1);
      // travel between stops, and hold at each stop so the product can be seen
      const i = Math.floor(prog), f = prog - i;
      const pos = Math.min(N - 1, i + ease(clamp((f - 0.3) / 0.55, 0, 1)));
      const idx = Math.round(pos);
      // one slot = the width of a product cell (set in CSS as --slot)
      tr.style.transform = `translate3d(calc(${-pos} * var(--slot)), 0, 0)`;
      bl.style.backgroundPositionX = `calc(${-pos} * var(--slot))`;
      if (idx !== curRef.current) { curRef.current = idx; setCur(idx); }
      if (visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(el);
    // swipe mode: the product nearest the middle of the row is the current one
    const vp = tr.parentElement;
    const onScroll = () => {
      if (pinMQ.matches || !vp) return;
      const mid = vp.scrollLeft + vp.clientWidth / 2;
      let best = 0, bd = 1e9;
      [...tr.children].forEach((c, i) => { const e = c as HTMLElement, d = Math.abs(e.offsetLeft + e.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      if (best !== curRef.current) { curRef.current = best; setCur(best); }
    };
    vp?.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); cancelAnimationFrame(raf); vp?.removeEventListener('scroll', onScroll); };
  }, []);

  // clicking a product (or a step dot) scrolls the belt to it
  const go = (i: number) => {
    const el = root.current;
    if (!el) return;
    if (!matchMedia('(min-height: 620px) and (min-width: 761px)').matches) {
      track.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setCur(i); return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY, range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * ((i + 0.05) / (N - 1)) - (i ? 0 : 1), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const ind = industries[cur];
  return (
    <section ref={root} id="industries" className="industries-belt" aria-labelledby="industries-title" style={{ '--n': N } as React.CSSProperties}>
      <div className="ib-pin">
        <div className="ib-head" data-rv>
          <div>
            <span className="kicker">Industries we serve</span>
            <h2 id="industries-title">Protecting the products your customers <span className="hl">rely on.</span></h2>
            <p className="ib-sub">Checko labels work across all of these industries, on almost any pack.</p>
          </div>
          <span className="ib-count" aria-hidden="true"><b>{String(cur + 1).padStart(2, '0')}</b> / {String(N).padStart(2, '0')}</span>
        </div>

        <div className="ib-stage">
          <div className="ib-viewport">
            <div ref={track} className="ib-track" role="list">
              {industries.map((it, i) => (
                <button key={it.img} type="button" role="listitem" className={`ib-item${i === cur ? ' on' : ''}`}
                  onClick={() => go(i)} aria-label={`${it.name}: ${it.risk}`} aria-current={i === cur}>
                  <Image src={`/assets/${it.img}.webp`} alt="" width={1024} height={1024} sizes="(max-width: 700px) 46vw, 300px" quality={90} />
                </button>
              ))}
            </div>
          </div>
          <div ref={belt} className="ib-belt" aria-hidden="true" />
        </div>

        <div className="ib-info" aria-live="polite">
          <div key={cur} className="ib-info-in">
            <div className="ib-say">
              <span className="ib-who"><Ic d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />Protects {ind.who.toLowerCase()}</span>
              <h3>{ind.name}</h3>
              <p className="ib-risk">{ind.risk}</p>
              <p className="ib-fit">{ind.fit}</p>
              <div className="ib-ctas">
                <a className="button" href="#contact">Explore {ind.name} <span aria-hidden="true">→</span></a>
                <a className="ib-ghost" href="#contact">Talk to our team</a>
              </div>
            </div>
            <div className="ib-uses">
              <h4>Checko use cases here</h4>
              <ul>
                {ind.uses.map(u => <li key={u}><i><Ic d={UC_ICON[u]} /></i>{useCases[u]}</li>)}
              </ul>
              <p className="ib-runs">Runs on <b>{ind.uses.length} of 6</b> Checko use cases.</p>
            </div>
          </div>
        </div>

        <div className="ib-steps" aria-label="Choose an industry">
          {industries.map((it, i) => (
            <button key={it.img} type="button" className={i === cur ? 'on' : ''} aria-label={it.name} aria-current={i === cur} onClick={() => go(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
