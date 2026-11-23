/*
 * Checko Hero: topographic contour lines, forever.
 *
 * Light background (site white). Fine contour lines flow like a survey map, forever looping.
 * The lines gather into rings around the checko wordmark, the shoreline lights up in gold,
 * the letters fill in, then — once the mark has "developed" — three lines of copy reveal
 * underneath, one after another, timed automatically but speeding up if the visitor scrolls.
 * After that the background keeps flowing behind the settled mark and text.
 *
 * Plain 2D canvas: a coarse grid of heights, marching squares per contour level, one path per frame.
 */

const BG = '#FFFFFF';
const LINE = '10,12,14';
const GOLD = '170,124,36';

/* Timeline in seconds, for the one-time "develop" sequence; after `open` the lines just keep flowing. */
const T = {
  appear: [0, .5],
  gather: [.8, 2.5],
  shore: [2.2, 2.9],
  fill: [2.75, 3.35],
  tagline: [3.15, 3.8],
  open: 4.2,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hash = n => { let x = Math.sin(n) * 43758.5453; return x - Math.floor(x); };

/* ---------- 3D gradient noise (improved Perlin) ---------- */
const perm = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 7654321;
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
function grad(h, x, y, z) {
  const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}
function noise(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(perm[AA] & 15, x, y, z), grad(perm[BA] & 15, x - 1, y, z), u),
      lerp(grad(perm[AB] & 15, x, y - 1, z), grad(perm[BB] & 15, x - 1, y - 1, z), u), v),
    lerp(lerp(grad(perm[AA + 1] & 15, x, y, z - 1), grad(perm[BA + 1] & 15, x - 1, y, z - 1), u),
      lerp(grad(perm[AB + 1] & 15, x, y - 1, z - 1), grad(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
}

/* ---------- distance field of a mask (two-pass chamfer, in grid cells) ---------- */
function chamfer(inside, W, H) {
  const INF = 1e9, d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = inside[i] ? 0 : INF;
  const a = 1, b = Math.SQRT2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + a);
    if (y > 0) { v = Math.min(v, d[i - W] + a); if (x > 0) v = Math.min(v, d[i - W - 1] + b); if (x < W - 1) v = Math.min(v, d[i - W + 1] + b); }
    d[i] = v;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x; let v = d[i];
    if (x < W - 1) v = Math.min(v, d[i + 1] + a);
    if (y < H - 1) { v = Math.min(v, d[i + W] + a); if (x < W - 1) v = Math.min(v, d[i + W + 1] + b); if (x > 0) v = Math.min(v, d[i + W - 1] + b); }
    d[i] = v;
  }
  return d;
}

function fit(cv) {
  const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  return { w: r.width, h: r.height, d };
}

/* ---------- the three-line reveal under the mark ---------- */
function makeReveal(root) {
  const box = root.querySelector('.th-reveal');
  if (!box) return null;
  const h = box.querySelector('.th-h'), t = box.querySelector('.th-t'), s = box.querySelector('.th-s');
  const words = el => {
    const ws = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return ws.map((x, i) => {
      const o = document.createElement('span'); o.className = 'w';
      const n = document.createElement('i'); n.textContent = x; o.appendChild(n);
      el.appendChild(o);
      if (i < ws.length - 1) el.append(' ');
      return n;
    });
  };
  const hw = words(h);
  const tText = t.textContent;
  const KEY = '3D unclonable';
  const keyA = tText.indexOf(KEY), keyB = keyA >= 0 ? keyA + KEY.length : -1;
  t.textContent = '';
  let wd = null;
  const keyWrap = document.createElement('span'); keyWrap.className = 'th-key';
  const rule = document.createElement('span'); rule.className = 'th-rule';
  const tc = [...tText].map((ch, i) => {
    const inKey = keyA >= 0 && i >= keyA && i < keyB;
    const host = inKey ? keyWrap : t;
    if (inKey && !keyWrap.parentNode) t.appendChild(keyWrap);
    if (ch === ' ') { wd = null; host.append(' '); return null; }
    if (!wd) { wd = document.createElement('span'); wd.className = 'wd'; host.appendChild(wd); }
    const o = document.createElement('span'); o.className = 'c' + (keyA >= 0 && i >= keyA && i < keyB ? ' k' : '');
    o.textContent = ch; wd.appendChild(o);
    return { o, ch, i, seed: hash(i * 7919) % 1000 / 1000 };
  }).filter(Boolean);
  (keyWrap.parentNode ? keyWrap : t).appendChild(rule);
  const sws = s.textContent.trim().split(/\s+/);
  s.textContent = '';
  const sw = sws.map((x, i) => { const o = document.createElement('span'); o.className = 'w'; o.textContent = x + (i < sws.length - 1 ? ' ' : ''); s.appendChild(o); return o; });
  const GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+<>/';
  let start = -1, p = 0, shown = -1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint(p) {
    box.classList.toggle('on', p > 0);
    hw.forEach((n, i) => {
      const k = smooth(.02 + i * .045, .2 + i * .045, p), e = 1 - Math.pow(1 - k, 3);
      n.style.transform = `translateY(${(1 - e) * 110}%) rotate(${(1 - e) * 6}deg)`;
      n.style.filter = `blur(${(1 - e) * 10}px)`;
      n.style.opacity = String(Math.min(1, k * 1.6));
    });
    const tk = smooth(.38, .72, p), fr = Math.floor(performance.now() / 55);
    tc.forEach(c => {
      const i = c.i, at = i / tText.length * .8 + c.seed * .2;
      if (tk <= at * .9) { c.o.style.opacity = '0'; return; }
      c.o.style.opacity = '1';
      if (tk >= at) { if (c.o.textContent !== c.ch) c.o.textContent = c.ch; }
      else c.o.textContent = GLY[(Math.floor(hash(i * 131 + fr) * 1000) >>> 3) % GLY.length];
    });
    rule.style.transform = `scaleX(${smooth(.68, .8, p)})`;
    sw.forEach((o, i) => {
      const k = smooth(.7 + i / sw.length * .24, .76 + i / sw.length * .24, p);
      o.style.opacity = String(.35 + .65 * Math.min(1, k * 1.5 + (p > .68 ? .3 : 0)));
    });
  }

  function scrollP(host) {
    const r = host.getBoundingClientRect(), vh = window.innerHeight || 800;
    return clamp((vh * .78 - r.top - r.height * .15) / (vh * .6), 0, 1);
  }

  paint(0);
  return {
    reset() { start = -1; p = 0; shown = -1; paint(0); },
    tick(now, host, ready) {
      if (reduced) { if (shown !== 1) { shown = 1; paint(1); } return; }
      if (ready && start < 0) start = now;
      if (start < 0) return;
      const auto = smooth(0, 1, (now - start) / 5200), sp = scrollP(host) * 1.15;
      const target = Math.max(auto, sp);
      p += (Math.max(p, target) - p) * .12;
      if (Math.abs(p - shown) > .001 || (p > .38 && p < .75)) { shown = p; paint(p); }
    },
  };
}

/**
 * @param {{canvas: HTMLCanvasElement, root: HTMLElement, logo: HTMLImageElement, font: string}} o
 */
export function startTopoHero({ canvas, root, logo, font }) {
  const ctx = canvas.getContext('2d');
  let { w, h, d } = fit(canvas);
  let narrow = w < 700;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ptr = { x: 0, y: 0, in: false };
  const onMove = e => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true; };
  const onLeave = () => { ptr.in = false; };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);

  let word = null, lx = 0, ly = 0, LW = 0, LH = 0, sdf = null, GW = 0, GH = 0, cell = 5.5;
  const H = { grid: null };

  function buildWordmark() {
    LW = Math.round(narrow ? Math.min(w * .72, 320) : Math.min(560, w * .4));
    LH = Math.round(LW * logo.naturalHeight / logo.naturalWidth);
    lx = Math.round((w - LW) / 2); ly = Math.round(h * (narrow ? .32 : .32) - LH / 2);
    word = document.createElement('canvas'); word.width = LW * d; word.height = LH * d;
    const x = word.getContext('2d', { willReadFrequently: true });
    x.drawImage(logo, 0, 0, word.width, word.height);
    const im = x.getImageData(0, 0, word.width, word.height), p = im.data;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const green = p[i + 1] > p[i] + 30;
      if (!green) { p[i] = 26; p[i + 1] = 29; p[i + 2] = 31; }
    }
    x.putImageData(im, 0, 0);

    cell = narrow ? 5 : 6;
    GW = Math.ceil(w / cell) + 2; GH = Math.ceil(h / cell) + 2;
    const inside = new Uint8Array(GW * GH), cover = new Float32Array(GW * GH);
    const m = document.createElement('canvas'); m.width = GW; m.height = GH;
    const mx = m.getContext('2d', { willReadFrequently: true });
    mx.drawImage(logo, lx / cell, ly / cell, LW / cell, LH / cell);
    const mp = mx.getImageData(0, 0, GW, GH).data;
    for (let i = 0; i < GW * GH; i++) { cover[i] = mp[i * 4 + 3] / 255; inside[i] = cover[i] > .5 ? 1 : 0; }
    const dOut = chamfer(inside, GW, GH);
    const outside = new Uint8Array(GW * GH); for (let i = 0; i < GW * GH; i++) outside[i] = 1 - inside[i];
    const dIn = chamfer(outside, GW, GH);
    sdf = new Float32Array(GW * GH);
    for (let i = 0; i < GW * GH; i++) {
      sdf[i] = (inside[i] ? -dIn[i] + .5 : dOut[i] - .5) * cell;
      if ((inside[i] ? dIn[i] : dOut[i]) <= 1.5 && cover[i] > .02 && cover[i] < .98) sdf[i] = (.5 - cover[i]) * cell * 1.2;
    }
    H.grid = new Float32Array(GW * GH);

    /* ---- sample a jittered sphere-field inside the mask, for the 3D "ball pit" fill ---- */
    const dotCell = narrow ? 4.4 : 5.2;
    dots = [];
    const dgw = Math.ceil(LW / dotCell), dgh = Math.ceil(LH / dotCell);
    const lm = document.createElement('canvas'); lm.width = dgw; lm.height = dgh;
    const lmx = lm.getContext('2d', { willReadFrequently: true });
    lmx.drawImage(logo, 0, 0, dgw, dgh);
    const lmp = lmx.getImageData(0, 0, dgw, dgh).data;
    let di = 0;
    for (let j = 0; j < dgh; j++) for (let i = 0; i < dgw; i++, di++) {
      const a = lmp[di * 4 + 3] / 255;
      if (a < .2) continue;
      const jitterX = (hash(i * 13.1 + j * 71.7) - .5) * dotCell * .8;
      const jitterY = (hash(i * 91.3 + j * 17.9 + 5) - .5) * dotCell * .8;
      const px = lx + (i + .5) * dotCell + jitterX, py = ly + (j + .5) * dotCell + jitterY;
      const rSeed = hash(i * 37.2 + j * 53.9 + 11);
      // generously oversized + overlapping so neighboring blobs fuse into one continuous raised-ink shape
      const r = dotCell * (.62 + rSeed * .5) * Math.min(1, .55 + a * .6);
      const order = hash(i * 7.3 + j * 101.1 + 23);
      dots.push({ x: px, y: py, r, order, fall: hash(i * 29.7 + j * 3.3 + 41) });
    }
    dots.sort((a, b) => a.order - b.order);
  }
  let dots = [];
  buildWordmark();

  const ring = narrow ? 11 : 14;
  const reach = Math.max(LH * 1.5, 160);
  const fs = narrow ? Math.min(18, w * .048) : Math.min(26, LW * .044);
  const tag = 'The fingerprint of things.';

  let raf = 0, t0 = performance.now(), dead = false, openedAt = -1;
  const rv = makeReveal(root);

  function heights(t, g) {
    const f = 1 / (narrow ? 200 : 290), z = t * .1;
    const grid = H.grid;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const k = j * GW + i, x = i * cell, y = j * cell;
      const wx = noise(x * f * .7, y * f * .7, z + 10) * 1.3, wy = noise(x * f * .7 + 40, y * f * .7, z + 20) * 1.3;
      let n = noise(x * f + wx, y * f + wy, z) + .45 * noise(x * f * 2.1 + wy, y * f * 2.1 + wx, z * 1.6 + 5);
      if (ptr.in) { const dx = x - ptr.x, dy = y - ptr.y; n += .55 * Math.exp(-(dx * dx + dy * dy) / 5200); }
      const terrain = narrow ? 4.4 * Math.tanh(1.05 * n) : 5.1 * Math.tanh(1.7 * n);
      const s = sdf[k];
      const wv = -s / ring + 3.2;
      const wgt = g * (1 - smooth(reach * .45, reach, s));
      grid[k] = terrain * (1 - wgt) + wv * wgt;
    }
  }

  function contours(path, shorePath) {
    const grid = H.grid;
    for (let j = 0; j < GH - 1; j++) for (let i = 0; i < GW - 1; i++) {
      const k = j * GW + i;
      const a = grid[k], b = grid[k + 1], c = grid[k + GW + 1], e = grid[k + GW];
      const lo = Math.min(a, b, c, e), hi = Math.max(a, b, c, e);
      for (let L = Math.ceil(lo); L <= hi; L++) {
        const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (e > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * cell, y = j * cell;
        const top = () => [x + cell * (L - a) / (b - a), y];
        const right = () => [x + cell, y + cell * (L - b) / (c - b)];
        const bottom = () => [x + cell * (L - e) / (c - e), y + cell];
        const left = () => [x, y + cell * (L - a) / (e - a)];
        const p = L === 3 && shorePath && sdf[k] < ring * 1.5 ? shorePath : path;
        const seg = (P, Q) => { p.moveTo(P[0], P[1]); p.lineTo(Q[0], Q[1]); };
        switch (idx) {
          case 1: case 14: seg(left(), bottom()); break;
          case 2: case 13: seg(bottom(), right()); break;
          case 3: case 12: seg(left(), right()); break;
          case 4: case 11: seg(top(), right()); break;
          case 6: case 9: seg(top(), bottom()); break;
          case 7: case 8: seg(left(), top()); break;
          case 5: seg(left(), top()); seg(bottom(), right()); break;
          case 10: seg(left(), bottom()); seg(top(), right()); break;
        }
      }
    }
  }

  /* clear a soft, tight pad of white behind each line of text so the contours never run through the letters */
  const textEls = [...root.querySelectorAll('.th-h, .th-t, .th-s')];
  function knockOutText() {
    if (!textEls.length || !textEls[0].parentElement.classList.contains('on')) return;
    const cr = canvas.getBoundingClientRect();
    const rg = document.createRange();
    ctx.save();
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 14;
    for (const el of textEls) {
      rg.selectNodeContents(el);
      const lines = [];
      for (const r of rg.getClientRects()) {
        if (r.width < 1 || r.height < 6) continue;
        const L = lines.find(l => Math.abs(l.top - r.top) < r.height * .5);
        if (L) { L.left = Math.min(L.left, r.left); L.right = Math.max(L.right, r.right); L.top = Math.min(L.top, r.top); L.bottom = Math.max(L.bottom, r.bottom); }
        else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
      for (const l of lines) {
        const x = l.left - cr.left - 8, y = l.top - cr.top - 2, w2 = l.right - l.left + 16, h2 = l.bottom - l.top + 4;
        ctx.beginPath(); ctx.roundRect(x, y, w2, h2, 10); ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw(t, develop) {
    const g = smooth(T.gather[0], T.gather[1], develop);
    heights(t, g);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

    const shoreOn = develop > T.shore[0] - .3;
    const path = new Path2D(), shore = shoreOn ? new Path2D() : null;
    contours(path, shore);
    const appear = smooth(T.appear[0], T.appear[1], develop);
    const fill = smooth(T.fill[0], T.fill[1], develop);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${LINE},${(1 - .15 * fill) * appear})`; ctx.lineWidth = 1.4;
    ctx.stroke(path);
    if (shore) {
      const s = smooth(T.shore[0], T.shore[1], develop);
      ctx.strokeStyle = `rgba(${GOLD},${(.4 + .6 * s) * (1 - .75 * fill) * appear})`; ctx.lineWidth = 1 + 1 * s;
      ctx.stroke(shore);
    }
    knockOutText();
    if (fill > 0) {
      const n = dots.length, settle = smooth(0, 1, fill);
      const live = [];
      // pass 1: solid, fully-opaque ink body per blob — heavy overlap fuses neighbors into one continuous shape, no seams
      for (let i = 0; i < n; i++) {
        const dot = dots[i];
        const at = dot.order * .82;
        if (settle < at * .92) continue;
        const k = smooth(at * .92, Math.min(1, at + .14), settle);
        const e = 1 - Math.pow(1 - k, 3);
        if (e < .04) continue;
        const drop = (1 - e) * (10 + dot.fall * 18);
        const scale = .4 + .6 * e;
        const r = dot.r * scale;
        const cx = dot.x, cy = dot.y - drop;
        live.push({ cx, cy, r, e });
        ctx.globalAlpha = Math.min(1, e * 1.3);
        ctx.fillStyle = `rgb(${LINE})`;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(.1, r), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // pass 2: a soft specular highlight per blob for the glossy raised-ink look, without breaking the fused silhouette
      for (const b of live) {
        if (b.e < .5) continue;
        const hl = (b.e - .5) * 2;
        const grad = ctx.createRadialGradient(b.cx - b.r * .32, b.cy - b.r * .38, b.r * .05, b.cx - b.r * .1, b.cy - b.r * .1, b.r * .85);
        grad.addColorStop(0, `rgba(255,255,255,${.22 * hl})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    const tg = smooth(T.tagline[0], T.tagline[1], develop);
    return { fill, tg };
  }

  function frame(now) {
    if (dead) return;
    const t = (now - t0) / 1000;
    const develop = reduced ? T.open : Math.min(t, T.open);
    const { tg } = draw(t, develop);
    if (tg >= 1 && openedAt < 0) openedAt = now;
    if (rv) rv.tick(now, root, openedAt >= 0);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function onResize() {
    const r = fit(canvas); w = r.w; h = r.h; d = r.d;
    narrow = w < 700;
    buildWordmark();
  }
  window.addEventListener('resize', onResize);

  return {
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    },
  };
}
