'use client';

import Image from 'next/image';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { products, type Product } from '../content';

/*
 * Hero demo: the phone really scans the label.
 * The product sits in the middle; the phone glides over it until its camera is on the Checko label, holds,
 * scans and confirms, then lifts away while the next product slides in. On desktop the phone can also be
 * dragged with the mouse: bring its camera onto the label and the scan starts. The camera always shows
 * what is underneath it, magnified, so the screen and the product agree.
 */

// phases: 0 moving into position → 1 hold steady → 2 scanning → 3 verified → 4 phone lifts away (ms each)
const PHASES = [1100, 500, 1600, 1300, 700];
const SCALE = 0.55;          // the phone is drawn at 55% of its design size
const ZOOM = 2.1;            // camera magnification
const REST = { x: 0.74, y: 0.1 }; // where the phone waits, as fractions of the stage width

// the product slot in the middle of the stage (fractions of the stage width; the stage is 600 × 590)
const SLOT = { x: 0.03, y: 0.15, w: 0.62, h: 0.66 };
const SLOT_TALL = { x: 0.1, y: 0.1, w: 0.48, h: 0.76 };

function Check({ animated = false }: { animated?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <m.path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.15 }} />
    </svg>
  );
}

// where the product's label sits on the stage, in px, given the stage width
function labelBox(p: Product, W: number) {
  const s = p.aspect < 0.8 ? SLOT_TALL : SLOT;
  const bw = s.w * W, bh = s.h * W;
  let dw = bw, dh = bw / p.aspect;
  if (dh > bh) { dh = bh; dw = bh * p.aspect; }
  const ix = s.x * W + (bw - dw) / 2, iy = s.y * W + (bh - dh) / 2;
  const [tx, ty, tw, th] = p.tag;
  return { img: { x: ix, y: iy, w: dw, h: dh }, cx: ix + (tx + tw / 2) * dw, cy: iy + (ty + th / 2) * dh, w: tw * dw, h: th * dh };
}

export default function ScanDemo() {
  const reduced = !!useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pos = useRef<HTMLDivElement>(null);
  const phoneEl = useRef<HTMLDivElement>(null);
  const cam = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(true);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fine, setFine] = useState(false);
  const [hint, setHint] = useState(true);
  const holdUntil = useRef(0);   // after a drag, auto play waits until this time
  const st = useRef({ x: -1, y: -1, ry: 0, drag: false, gx: 0, gy: 0, onLabel: false, index: 0, phase: 0 });
  st.current.index = index; st.current.phase = phase;
  const running = inView && !reduced && !paused && !dragging;
  const goTo = useCallback((i: number) => { const n = products.length; setIndex(((i % n) + n) % n); setPhase(0); }, []);

  useEffect(() => { setFine(matchMedia('(hover: hover) and (pointer: fine)').matches); }, []);

  // only animate while the demo is on screen
  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the automatic sequence (paused while someone drags the phone)
  useEffect(() => {
    if (!running) return;
    const wait = Math.max(0, holdUntil.current - performance.now());
    const t = window.setTimeout(() => {
      if (phase >= PHASES.length - 1) { setIndex(i => (i + 1) % products.length); setPhase(0); }
      else setPhase(phase + 1);
    }, PHASES[phase] + wait);
    return () => clearTimeout(t);
  }, [running, phase, index]);

  // the frame loop: moves the phone (towards its target, or under the cursor) and keeps the camera view in step
  useEffect(() => {
    const sg = stage.current, ps = pos.current, ph = phoneEl.current, cm = cam.current;
    if (!sg || !ps || !ph || !cm) return;
    let raf = 0, last = performance.now();
    // the camera's centre inside the (unscaled) phone, from layout offsets (not affected by transforms)
    const camOffset = () => {
      let x = cm.offsetWidth / 2, y = cm.offsetHeight / 2, el: HTMLElement | null = cm;
      while (el && el !== ph) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent as HTMLElement | null; }
      return { x: x * SCALE, y: y * SCALE };
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const W = sg.clientWidth, s = st.current, co = camOffset();
      const p = products[s.index], L = labelBox(p, W);
      let tx: number, ty: number;
      if (s.x < 0) { s.x = REST.x * W; s.y = REST.y * W; }
      if (s.drag) { tx = s.gx; ty = s.gy; }
      else if (now < holdUntil.current && !s.onLabel) { tx = s.x; ty = s.y; }        // just let go: stay put for a moment
      else if (s.phase >= 4) { tx = REST.x * W; ty = REST.y * W; }                    // lift away
      else { tx = L.cx - co.x; ty = L.cy - co.y; }                                    // camera onto the label
      const k = s.drag ? 1 - Math.exp(-dt * 30) : 1 - Math.exp(-dt * (reduced ? 60 : 4.2));
      const px = s.x;
      s.x += (tx - s.x) * k; s.y += (ty - s.y) * k;
      // the phone leans into its movement, like a hand moving it
      const v = dt > 0 ? (s.x - px) / dt / W : 0;
      s.ry += (Math.max(-1, Math.min(1, v * 1.6)) * 14 - s.ry) * (1 - Math.exp(-dt * 8));
      const el = root.current;
      if (el && !reduced) {
        el.style.setProperty('--ry', `${(s.ry + Math.sin(now / 1700) * 3).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(Math.cos(now / 2300) * 2).toFixed(2)}deg`);
        el.style.setProperty('--gp', `${(50 - s.ry * 2.5).toFixed(1)}%`);
        el.style.setProperty('--sx', (s.ry / 14).toFixed(3));
      }
      ps.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
      // the camera shows what is underneath it, magnified
      const cx = s.x + co.x, cy = s.y + co.y;
      const camW = cm.offsetWidth, camH = cm.offsetHeight; // unscaled px inside the phone
      const z = ZOOM / SCALE;
      if (live.current) {
        live.current.style.width = `${L.img.w * z}px`; live.current.style.height = `${L.img.h * z}px`;
        live.current.style.transform = `translate3d(${(camW / 2 - (cx - L.img.x) * z).toFixed(1)}px, ${(camH / 2 - (cy - L.img.y) * z).toFixed(1)}px, 0)`;
      }
      s.onLabel = Math.abs(cx - L.cx) < L.w * 0.55 && Math.abs(cy - L.cy) < L.h * 0.6;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // dragging (desktop): the phone follows the mouse; when its camera reaches the label, the scan starts
  const drag = useRef({ ox: 0, oy: 0 });
  const onDown = (e: React.PointerEvent) => {
    if (!fine || !stage.current) return;
    const r = stage.current.getBoundingClientRect(), s = st.current;
    drag.current = { ox: e.clientX - r.left - s.x, oy: e.clientY - r.top - s.y };
    s.gx = s.x; s.gy = s.y; s.drag = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true); setHint(false); setPhase(0);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = st.current;
    if (!s.drag || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    s.gx = e.clientX - r.left - drag.current.ox; s.gy = e.clientY - r.top - drag.current.oy;
  };
  const onUp = () => {
    const s = st.current;
    if (!s.drag) return;
    s.drag = false; setDragging(false);
    // let the user's scan finish, or give them a moment, before the demo carries on by itself
    holdUntil.current = performance.now() + 2500;
  };
  // while dragging: on the label → hold, scan, verify; off it → back to "positioning"
  useEffect(() => {
    if (!dragging) return;
    let t = 0;
    const tick = () => {
      const s = st.current;
      if (s.onLabel) {
        if (s.phase === 0) setPhase(1);
      } else if (s.phase > 0 && s.phase < 3) setPhase(0);
      t = window.setTimeout(tick, 120);
    };
    tick();
    return () => clearTimeout(t);
  }, [dragging]);
  useEffect(() => {
    // a scan started by dragging runs through its steps even while the mouse is still down
    if (!dragging || phase === 0 || phase >= 3) return;
    const t = window.setTimeout(() => { if (st.current.onLabel) setPhase(phase + 1); }, PHASES[phase]);
    return () => clearTimeout(t);
  }, [dragging, phase]);

  // the product that just left slides out to the left before it rejoins the queue
  const [exiting, setExiting] = useState<number | null>(null);
  const lastIndex = useRef(index);
  useEffect(() => {
    if (lastIndex.current === index) return;
    const n = products.length, forward = index === (lastIndex.current + 1) % n, gone = lastIndex.current;
    lastIndex.current = index;
    if (!forward) { setExiting(null); return; }
    setExiting(gone);
    const t = window.setTimeout(() => setExiting(null), 1000);
    return () => clearTimeout(t);
  }, [index]);
  const stepped = lastIndex.current !== index && index === (lastIndex.current + 1) % products.length;
  const exitNow = stepped ? lastIndex.current : lastIndex.current !== index ? null : exiting;

  const product = products[index];
  const verified = reduced || (phase >= 3 && phase < 4) || (phase === 4 && !dragging);
  const locked = reduced || phase >= 1;
  const scanning = phase === 2 && !reduced;

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={root} className={`visual scan-real${!fine && !reduced ? ' auto-turn' : ''}`} role="img"
        aria-label={`Demonstration: a phone moves over the Checko label on ${product.name}, scans it and shows that the product is genuine.`}>
        <div ref={stage} className="visual-stage" aria-hidden="true">
          {products.map((p, i) => {
            const n = products.length, o = ((i - index) % n + n) % n; // 0 centre, 1 next, others waiting
            const slot = i === exitNow ? 'exit' : o === 0 ? 'centre' : o === 1 ? 'next' : 'wait';
            return (
              <div key={p.id} className={`ps ps-${slot}`} data-tall={p.aspect < 0.8 ? '' : undefined}>
                <Image src={`/assets/${p.id}.webp`} alt="" fill sizes="(max-width: 860px) 70vw, 32vw" quality={90} priority={i === 0} />
              </div>
            );
          })}
          <AnimatePresence mode="wait" initial={false}>
            <m.div className="product-caption" key={`cap-${product.id}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
              <strong>{product.name}</strong><span>{product.category} · Protected by Checko</span>
            </m.div>
          </AnimatePresence>

          <div ref={pos} className={`phone-pos${dragging ? ' dragging' : ''}${fine ? ' can-drag' : ''}`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <AnimatePresence>
              {verified && (
                <m.div className="genuine-chip" key={`chip-${product.id}`} initial={reduced ? false : { opacity: 0, scale: 0.7, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                  <Check /> Genuine
                </m.div>
              )}
            </AnimatePresence>
            <div ref={phoneEl} className="phone">
              <div className="phone-side" />
              <i className="phone-glare" />
              <div className="screen">
                <div className="status"><span>9:41</span><span className="island" /><span className="bars"><i /><i /><i /></span></div>
                <div className="app-brand">
                  <img className="app-logo" src="/assets/checko.svg" alt="" width={479} height={139} />
                  <span>PRODUCT AUTHENTICATION</span>
                </div>
                <div ref={cam} className="camera">
                  {/* live view: whatever is under the camera, magnified */}
                  <img ref={live} className="cam-live" src={`/assets/${product.id}.webp`} alt="" decoding="async" />
                  {/* locked on the label: the sharp close-up */}
                  <img className={`cam-lock${locked ? ' on' : ''}`} src={`/assets/${product.id.replace('v2b-', 'v2b-cam-')}.webp`} alt="" decoding="async" />
                  <div className={`focus-frame${verified ? ' success' : ''}`}><i /><i /><i /><i />{scanning && <div className="scan-line" />}</div>
                  {verified && <span className="camera-badge">3D PATTERN MATCHED</span>}
                </div>
                <AnimatePresence mode="wait">
                  {verified ? (
                    <m.div className="result" key="verified" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="success-icon"><Check animated={!reduced} /></div>
                      <strong>Verified</strong>
                      <p>This is a<br /><b>genuine product</b></p>
                      <span className="secure-note">Checked against the registered label</span>
                    </m.div>
                  ) : (
                    <m.div className="scan-copy" key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {scanning && <span className="scan-spinner" />}
                      <strong>{phase === 0 ? (dragging ? 'Move onto the label…' : 'Finding the label…') : phase === 1 ? 'Hold steady' : 'Scanning label…'}</strong>
                      <p>Any phone. Any light.</p>
                      {scanning && <div className="progress"><i className="scan-progress" /></div>}
                    </m.div>
                  )}
                </AnimatePresence>
                <span className="home-indicator" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-ctrl" role="group" aria-label="Product slider">
        <button type="button" className="hc-arrow" aria-label="Previous product" onClick={() => goTo(index - 1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div className="hc-dots">
          {products.map((p, i) => (
            <button key={p.id} type="button" className={i === index ? 'on' : ''} aria-label={`Show ${p.name}`} aria-current={i === index} onClick={() => goTo(i)}>
              {i === index && running && <i key={index} className="hc-fill" />}
            </button>
          ))}
        </div>
        <button type="button" className="hc-arrow" aria-label={paused ? 'Play the slider' : 'Pause the slider'} aria-pressed={paused} onClick={() => setPaused(v => !v)}>
          {paused ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>}
        </button>
        <button type="button" className="hc-arrow" aria-label="Next product" onClick={() => goTo(index + 1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      {fine && <p className={`hc-hint${hint ? '' : ' gone'}`}>Tip: drag the phone onto the label to scan it yourself.</p>}
    </LazyMotion>
  );
}
