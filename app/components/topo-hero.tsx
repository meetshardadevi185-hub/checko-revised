'use client';

import { useEffect, useRef, useState } from 'react';
import { startInkDrops } from '../intro/ink-drops-engine';

/**
 * Section 1 · Hero — ink drops fall onto a Checko label over a flowing topographic map,
 * set into a raised 3D pattern and get verified. The copy fades in underneath.
 */
export default function TopoHero() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const stop = startInkDrops();
    const t = setTimeout(() => setOn(true), 400);
    return () => { stop(); clearTimeout(t); };
  }, []);

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
        <div className="topo-hero-stage" />
        <div className={`th-reveal${on ? ' on' : ''}`}>
          <h2 className="th-h">Put a proof of authenticity on every product.</h2>
          <p className="th-t">
            World&rsquo;s 1st truly <span className="th-key"><span className="k">3D unclonable</span><span className="th-rule" /></span> anti-counterfeiting technology.
          </p>
          <p className="th-s">Helping brands protect what matters most: the consumers who trust them.</p>
        </div>
      </div>
    </section>
  );
}
