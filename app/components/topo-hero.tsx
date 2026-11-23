'use client';

import { useEffect, useRef, useState } from 'react';
import { startInkDrops } from '../intro/ink-drops-engine';

const split = (text: string) => text.split(' ').map((w, i) => (
  <span className="w" key={i}><i style={{ transitionDelay: `${i * 70}ms` }}>{w}</i>{' '}</span>
));

/**
 * Section 1 · Hero — ink drops fall onto a Checko label that sits on a plateau of contour rings.
 * Once the card is formed a "Scroll" cue appears; scrolling brings the copy in word by word.
 */
export default function TopoHero() {
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stop = startInkDrops();
    const host = document.getElementById('drops');
    const onReady = () => setReady(true);
    host?.addEventListener('cardready', onReady);
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true); }, { threshold: 0.35 });
    if (copy.current) io.observe(copy.current);
    return () => { stop(); host?.removeEventListener('cardready', onReady); window.removeEventListener('scroll', onScroll); io.disconnect(); };
  }, []);

  const on = ready && seen;

  return (
    <section ref={root} className="topo-hero" aria-labelledby="topo-hero-title">
      <h1 id="topo-hero-title" className="sr-only">Checko: the fingerprint of things</h1>
      <div className="topo-hero-inner">
        <div className="topo-hero-bleed" id="drops" aria-hidden="true">
          <canvas className="topo" />
          <canvas className="bg" />
          <canvas className="gl" />
          <span className="i3-tag" />
        </div>
        <div className="topo-hero-stage">
          <a className={`th-cue${ready && !scrolled ? ' on' : ''}`} href="#problem" aria-label="Scroll to read more">
            <span>Scroll for more</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </a>
        </div>
        <div ref={copy} className={`th-reveal${on ? ' on' : ''}`}>
          <h2 className="th-h">{split('Put a proof of authenticity on every product.')}</h2>
          <p className="th-t">
            World&rsquo;s 1st truly <span className="th-key"><span className="k">3D unclonable</span><span className="th-rule" /></span> anti-counterfeiting technology.
          </p>
          <p className="th-s">Helping brands protect what matters most: the consumers who trust them.</p>
        </div>
      </div>
    </section>
  );
}
