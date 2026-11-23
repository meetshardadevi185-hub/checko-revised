/* Ported from Checko-Ink-Drops-Banner.html: ink drops fall onto a Checko label over a topographic map. */
/* eslint-disable */
// @ts-nocheck
export function startInkDrops() {

let RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const C = {white:'#FFFFFF', char:'#1A1D1F', body:'#50555A', line:'#E6E8E6', honey:'#F2C14E', green:'#4EAB47', error:'#B42318'};
const LOGO = new Image(); LOGO.src = '/assets/checko-card-logo.png';


/* ---------- shared helpers ---------- */
function hash(n){ n = Math.imul(n ^ n >>> 16, 0x45d9f3b); n = Math.imul(n ^ n >>> 16, 0x45d9f3b); return (n ^ n >>> 16) >>> 0; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const serial = s => 'A' + String(hash(s) % 10000000).padStart(7, '0');

function fit(cv){
  const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  return {w: r.width, h: r.height, d};
}
function track(el){
  const p = {x: 0, y: 0, in: false};
  const set = e => { const r = el.getBoundingClientRect(); p.x = e.clientX - r.left; p.y = e.clientY - r.top; p.in = true; };
  el.addEventListener('pointermove', set);
  el.addEventListener('pointerdown', set);
  el.addEventListener('pointerleave', () => { p.in = false; });
  return p;
}
function rr(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function chip(ctx, x, y, ok, text, alpha, sc = 1){
  if (alpha <= 0) return 0;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `600 ${11 * sc}px Poppins, Arial, sans-serif`;
  const h = 22 * sc, w = ctx.measureText(text).width + 32 * sc;
  ctx.fillStyle = ok ? C.green : C.error; rr(ctx, x, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = C.char; ctx.lineWidth = 2.2 * sc; ctx.beginPath();
  ctx.moveTo(x + 8 * sc, y + .5 * sc); ctx.lineTo(x + 11.5 * sc, y + 4 * sc); ctx.lineTo(x + 18 * sc, y - 3.5 * sc); ctx.stroke();
  ctx.fillStyle = C.char; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 24 * sc, y + .5 * sc);
  ctx.restore(); return w;
}
function spawn(w, h, avoid){
  let x, y, n = 0;
  do { x = Math.random() * w; y = Math.random() * h; n++; } while (avoid && n < 20 && x > avoid.x && x < avoid.x + avoid.w && y > avoid.y && y < avoid.y + avoid.h);
  return {x, y, vx: 0, vy: 0, r: .8 + Math.pow(Math.random(), 1.8) * 1.9};
}
// the drifting specks, shared by every version: black only
function drift(ctx, parts, T, dt, ptr, w, h, avoid){
  ctx.fillStyle = 'rgba(26,29,31,.7)'; ctx.beginPath();
  for (const p of parts){
    if (!RM){
      const nx = Math.sin(p.y * .011 + T * .35) + Math.sin((p.x + p.y) * .006 - T * .2);
      const ny = Math.cos(p.x * .009 - T * .3) + Math.cos((p.x - p.y) * .007 + T * .25);
      p.vx += (nx * 13 - p.vx) * .04 + (Math.random() - .5) * 10;
      p.vy += (ny * 13 - p.vy) * .04 + (Math.random() - .5) * 10;
      if (Math.random() < .003){ const q = spawn(w, h, avoid); p.x = q.x; p.y = q.y; }
      if (ptr.in){ const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy; if (d2 < 12100){ const f = (1 - d2 / 12100) * 260 * dt, dl = Math.sqrt(d2) + .1; p.x += dx / dl * f; p.y += dy / dl * f; } }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -5) p.x = w + 5; if (p.x > w + 5) p.x = -5; if (p.y < -5) p.y = h + 5; if (p.y > h + 5) p.y = -5;
    }
    ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, TAU);
  }
  ctx.fill();
}
// freeze: every speck inside the window is captured, and the window is topped up so it is never sparse
function capture(parts, wn, want, w, h, avoid){
  const frozen = [];
  parts = parts.filter(p => {
    if (p.x > wn.x && p.x < wn.x + wn.w && p.y > wn.y && p.y < wn.y + wn.h){ frozen.push({x: p.x - wn.x, y: p.y - wn.y, r: p.r, k: .75 + Math.random() * .5}); return false; }
    return true;
  });
  const minN = Math.round(wn.w * wn.h / 153);
  while (frozen.length < minN){ const q = spawn(wn.w, wn.h); frozen.push({x: q.x, y: q.y, r: q.r, k: .75 + Math.random() * .5}); }
  while (parts.length < want) parts.push(spawn(w, h, avoid));
  return {parts, frozen};
}

/* ---------- 5b · Tilt and light ---------- */
/* The ink: a field of soft blobs, thresholded into liquid, lit as a raised glossy surface. */
function inkGL(cv){
  const gl = cv.getContext('webgl', {premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false});
  if (!gl) return null;
  const vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fs = `precision mediump float;varying vec2 v;uniform sampler2D F;uniform vec2 T;uniform float thr,relief;uniform vec3 L;uniform vec2 tilt;
  float ht(vec2 p){return smoothstep(thr,.95,texture2D(F,p).r);}
  void main(){
    vec2 uv=v-tilt*ht(v)*.03*relief;
    float f=texture2D(F,uv).r;
    float cov=smoothstep(thr-.025,thr+.025,f);
    float hx=ht(uv+vec2(T.x,0.))-ht(uv-vec2(T.x,0.)),hy=ht(uv+vec2(0.,T.y))-ht(uv-vec2(0.,T.y));
    vec3 n=normalize(vec3(-hx*6.*relief,-hy*6.*relief,1.));
    vec3 l=normalize(L),hv=normalize(l+vec3(0.,0.,1.));
    float nh=max(dot(n,hv),0.);
    float spec=pow(nh,70.)*1.15+pow(nh,9.)*.1;
    vec3 ink=vec3(.03,.034,.038)+vec3((1.-n.z)*.16)+vec3(spec);
    ink=mix(vec3(.06,.065,.07),ink,relief);
    float sh=ht(uv+l.xy*T*9.)*(1.-cov)*.3*relief;
    vec3 paper=vec3(.984,.984,.98)*(1.-sh);
    gl_FragColor=vec4(mix(paper,ink,cov),1.);
  }`;
  const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  const u = n => gl.getUniformLocation(pr, n), uT = u('T'), uThr = u('thr'), uRel = u('relief'), uL = u('L'), uTilt = u('tilt');
  return (field, o) => {
    gl.viewport(0, 0, cv.width, cv.height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, field);
    gl.uniform2f(uT, 1.4 / field.width, 1.4 / field.height); gl.uniform1f(uThr, .32); gl.uniform1f(uRel, o.relief);
    gl.uniform3f(uL, o.L[0], o.L[1], o.L[2]); gl.uniform2f(uTilt, o.tilt[0], o.tilt[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}
function Born3D(){
  const root = document.querySelector('[data-key="born3d"].hero');
  const host = document.getElementById('born3d'), cv = host.querySelector(':scope > canvas'), ctx = cv.getContext('2d');
  const card = host.querySelector('.b3-card'), win = card.querySelector('.b3-win'), wcv = win.querySelector('canvas');
  const serialEl = card.querySelector('.b3-serial'), chipEl = card.querySelector('.chip'), tagEl = card.querySelector('.b3-tag');
  const stack = host.querySelector('.b3-stack');
  const ptr = track(host);
  const draw = inkGL(wcv);
  const field = document.createElement('canvas'), fctx = field.getContext('2d');
  let parts = [], last = performance.now(), clock = 0, cyc = 0, lastW = 0, nth = 0, L = null, minis = [], light = [-.6, .6, .55];
  const CYCLE = 9.2, LS = .5, GAP = 14;
  function geom(w, h){
    const small = w < 700, narrow = w < 1050, lw = small ? Math.min(270, w - 40) : 290, lh = lw * .64;
    const x = small ? (w - lw) / 2 : narrow ? w * .72 - lw / 2 : w * .7 - lw / 2 - 20, y = h * .5 - lh / 2;
    return {x, y, w: lw, h: lh, win: {x: x + 16, y: y + 38, w: lw - 32, h: lh - 80}, narrow};
  }
  // the liquid: every frozen speck becomes a soft blob that grows until neighbours merge
  function paintField(fr, grow, d){
    const ww = L.g.win.w, wh = L.g.win.h, fw = Math.round(ww * d), fh = Math.round(wh * d);
    if (field.width !== fw || field.height !== fh){ field.width = fw; field.height = fh; }
    if (wcv.width !== fw || wcv.height !== fh){ wcv.width = fw; wcv.height = fh; }
    fctx.globalCompositeOperation = 'source-over'; fctx.fillStyle = '#000'; fctx.fillRect(0, 0, fw, fh);
    fctx.globalCompositeOperation = 'lighter';
    // blobs peak below white so overlaps build rounded hills instead of flat plateaus
    const end = .4 * Math.sqrt(ww * wh / fr.length);
    for (const p of fr){
      const s = (p.r * .85 + (end * p.k - p.r * .85) * grow) * d, R = s * 2.5, x = p.x * d, y = p.y * d;
      const g = fctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, 'rgb(158,158,158)'); g.addColorStop(.2, 'rgb(139,139,139)'); g.addColorStop(.4, 'rgb(97,97,97)');
      g.addColorStop(.6, 'rgb(51,51,51)'); g.addColorStop(.8, 'rgb(21,21,21)'); g.addColorStop(1, '#000');
      fctx.fillStyle = g; fctx.fillRect(x - R, y - R, R * 2, R * 2);
    }
  }
  function addMini(Lc){
    const m = document.createElement('div'); m.className = 'b3-card mini';
    m.innerHTML = card.innerHTML;
    m.querySelector('.b3-tag').remove();
    const img = new Image(); img.src = Lc.img; const wv = m.querySelector('.b3-win'); wv.innerHTML = ''; wv.appendChild(img);
    wv.style.width = Lc.g.win.w + 'px'; wv.style.height = Lc.g.win.h + 'px';
    m.querySelector('.b3-serial').textContent = Lc.code; m.querySelector('.chip').classList.add('on');
    m.style.width = Lc.g.w + 'px'; m.style.height = Lc.g.h + 'px'; m.style.opacity = '1';
    stack.prepend(m); minis.unshift({el: m, g: Lc.g});
    if (minis.length > 4){ const old = minis.pop(); old.el.remove(); }
  }
  function layoutMinis(w, h){
    minis.forEach((m, i) => {
      const x = w - m.g.w * LS - 34, y = h / 2 - (m.g.h * LS * 1.5 + GAP) + i * (m.g.h * LS + GAP);
      m.el.style.transform = `translate(${x}px,${y}px) scale(${LS})`;
      m.el.style.opacity = i < 3 ? '1' : '0';
    });
  }
  return {
    root,
    replay(){ clock = 0; cyc = 0; L = null; minis.forEach(m => m.el.remove()); minis = []; card.style.opacity = 0; },
    frame(now){
      const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; clock += RM ? 0 : dt;
      const {w, h, d} = fit(cv); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
      const g = geom(w, h);
      const want = clamp(Math.round(w * h / 153), 750, 3900);
      if (lastW !== w){ lastW = w; parts = Array.from({length: want}, () => spawn(w, h)); }
      const prev = cyc; cyc = RM ? 6.8 : clock % CYCLE;
      if (!L && (cyc < prev || (cyc > 1.3 && cyc < 1.5) || RM)){
        L = {g, frozen: [], code: serial(7000 + nth++), done: false, img: null};
        card.style.width = g.w + 'px'; card.style.height = g.h + 'px';
        win.style.width = g.win.w + 'px'; win.style.height = g.win.h + 'px';
        serialEl.textContent = ''; chipEl.classList.remove('on'); tagEl.classList.remove('on');
      }
      if (L && !L.done && (cyc >= 1.9 || RM)){
        L.done = true;
        ({parts, frozen: L.frozen} = capture(parts, L.g.win, want, w, h, L.g));
        win.classList.add('flash'); setTimeout(() => win.classList.remove('flash'), 60);
      }
      drift(ctx, parts, clock, dt, ptr, w, h, L && L.done ? L.g : null);
      if (!g.narrow) layoutMinis(w, h);
      if (!L){ card.style.opacity = 0; return; }
      if (!L.done){
        ctx.save(); ctx.globalAlpha = smooth(1.3, 1.9, cyc); ctx.strokeStyle = C.char; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -clock * 30;
        ctx.strokeRect(L.g.win.x, L.g.win.y, L.g.win.w, L.g.win.h); ctx.restore();
        card.style.opacity = 0; return;
      }
      const melt = smooth(2.2, 3.7, cyc), relief = smooth(3.5, 4.4, cyc);
      const tilt = RM ? 0 : smooth(3.7, 4.6, cyc) * (1 - smooth(6.0, 6.7, cyc));
      const over = ptr.in && ptr.x > L.g.x - 40 && ptr.x < L.g.x + L.g.w + 40 && ptr.y > L.g.y - 40 && ptr.y < L.g.y + L.g.h + 40;
      const cx = L.g.x + L.g.w / 2, cy = L.g.y + L.g.h / 2;
      let rx = 38 * tilt, ry = 9 * Math.sin(clock * 1.3) * tilt, rz = -9 * tilt;
      let target;
      if (over && cyc > 3.6 && cyc < 7.4){
        target = [(ptr.x - cx) / 140, -(ptr.y - cy) / 140, .55];
        rx = Math.max(rx, 0) - (ptr.y - cy) / L.g.h * 14; ry += (ptr.x - cx) / L.g.w * 18;
      } else {
        const a = 2.4 + clock * 1.5;
        target = [Math.cos(a) * .95, Math.sin(a) * .95, .5];
      }
      light = light.map((v, i) => v + (target[i] - v) * .12);
      paintField(L.frozen, melt, d);
      if (draw) draw(field, {relief, L: light, tilt: [ry / 40, -rx / 40]});
      tagEl.classList.toggle('on', tilt > .5);
      L.typed = Math.floor(smooth(6.4, 7.0, cyc) * L.code.length); serialEl.textContent = L.code.slice(0, RM ? 99 : L.typed);
      chipEl.classList.toggle('on', cyc > 7.0 || RM);
      if (cyc > 7.4 && !L.img) L.img = wcv.toDataURL();
      const fly = g.narrow || RM ? 0 : ease(smooth(7.7, 8.6, cyc));
      const s = 1 + (LS - 1) * fly, tx = w - L.g.w * LS - 34, ty = h / 2 - (L.g.h * LS * 1.5 + GAP);
      const px = L.g.x + (tx - L.g.x) * fly - L.g.w * (1 - s) / 2, py = L.g.y + (ty - L.g.y) * fly - L.g.h * (1 - s) / 2;
      const pop = 1 + .04 * (1 - smooth(1.9, 2.15, cyc));
      card.style.opacity = g.narrow ? String(1 - smooth(8.2, 8.8, cyc)) : '1';
      card.style.transform = `translate(${px}px,${py}px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s * pop})`;
      if (cyc > 8.6 && !RM){
        if (!g.narrow && L.img) addMini(L);
        L = null; card.style.opacity = 0;
      }
    }
  };
}

/* ---------- 5c–5f · the 3D ink engine ---------- */
/* The label is a real surface: a fine mesh pushed up by the ink height field, lit, shadowed and seen through a moving camera. */
const V3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
};
function persp(fy, asp, n, f){ const t = 1 / Math.tan(fy / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; }
function lookAt(e, c, u){
  const z = V3.norm(V3.sub(e, c)), x = V3.norm(V3.cross(u, z)), y = V3.cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -V3.dot(x, e), -V3.dot(y, e), -V3.dot(z, e), 1];
}
function mul4(a, b){ const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ let s = 0; for (let k = 0; k < 4; k++) s += a[i + k * 4] * b[k + j * 4]; o[i + j * 4] = s; } return o; }
// world units are CSS pixels; looking straight down at dist 1 the label sits 1:1 with the page, so the freeze lines up exactly
function camera(w, h, sx, sy, c){
  const fov = 30 * DEG, D = h / 2 / Math.tan(fov / 2) * c.dist;
  const el = c.el * DEG, az = c.az * DEG, ce = Math.cos(el), se = Math.sin(el), ca = Math.cos(az), sa = Math.sin(az);
  const t = [c.px, c.py, 0], eye = [t[0] + D * ce * sa, t[1] - D * ce * ca, D * se];
  const P = persp(fov, w / h, Math.max(1, D * .02), D * 4 + 2000);
  // lens shift: the camera aims at the label but draws it where the layout puts it
  const ox = (sx - w / 2) / (w / 2), oy = -(sy - h / 2) / (h / 2);
  for (let j = 0; j < 4; j++){ P[j * 4] += ox * P[j * 4 + 3]; P[j * 4 + 1] += oy * P[j * 4 + 3]; }
  return {VP: mul4(P, lookAt(eye, t, [-se * sa, se * ca, ce])), eye, D};
}
function project(VP, p, w, h){
  const c = [0, 1, 3].map(r => VP[r] * p[0] + VP[r + 4] * p[1] + VP[r + 8] * p[2] + VP[r + 12]);
  return [(c[0] / c[2] + 1) / 2 * w, (1 - c[1] / c[2]) / 2 * h];
}
const LIT = `
vec3 inkCol(vec3 n, vec3 l, vec3 v, float sh){
  vec3 hv = normalize(l + v); float nh = max(dot(n, hv), 0.);
  float spec = (pow(nh, 90.) * 1.4 + pow(nh, 12.) * .12) * (1. - sh);
  float fr = pow(1. - max(dot(n, v), 0.), 4.) * .3;
  return vec3(.022, .025, .03) + vec3(max(dot(n, l), 0.) * .07 * (1. - sh) + spec + fr);
}`;
function engine3d(cv){
  const gl = cv.getContext('webgl', {alpha: true, premultipliedAlpha: true, antialias: true, depth: true});
  if (!gl) return null;
  const vtf = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;
  const an = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
  function prog(vs, fs){
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(([t, s]) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(o)); gl.attachShader(p, o); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)){ console.warn(gl.getProgramInfoLog(p)); return null; }
    const cache = {};
    return {p, u: n => n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(p, n)), a: n => gl.getAttribLocation(p, n)};
  }
  const ink = prog(`${vtf ? '#define VTF\n' : ''}precision highp float;
    attribute vec2 a; uniform mat4 VP; uniform sampler2D H; uniform vec4 R; uniform float relief, thr; uniform vec3 off;
    varying vec2 uv; varying vec3 wp;
    void main(){
      uv = a; float h = 0.;
    #ifdef VTF
      h = (1. - exp(-6. * max(texture2D(H, a).r - thr, 0.))) * relief;
    #endif
      wp = vec3(R.xy + a * R.zw, h) + off;
      gl_Position = VP * vec4(wp, 1.);
    }`, `precision highp float;
    varying vec2 uv; varying vec3 wp;
    uniform sampler2D H; uniform vec4 R; uniform vec2 T, cut; uniform float relief, thr, rmax; uniform vec3 L, eye, off, fog;
    ${LIT}
    // a liquid bead: rises fast from the edge, then rounds over; merged ink is only a little taller than a lone drop
    float ht(vec2 p){ return 1. - exp(-6. * max(texture2D(H, p).r - thr, 0.)); }
    void main(){
      vec3 lp = wp - off;
      vec2 q = abs(lp.xy - R.xy - R.zw * .5) - (R.zw * .5 - 8.);
      if (length(max(q, 0.)) > 8.) discard;
      if (cut.y > .5 && lp.y < cut.x) discard;
      if (cut.y < -.5 && lp.y >= cut.x) discard;
      float f = texture2D(H, uv).r, h0 = ht(uv) * relief;
      float cov = smoothstep(thr - .022, thr + .022, f);
      float hx = ht(uv + vec2(T.x, 0.)) - ht(uv - vec2(T.x, 0.)), hy = ht(uv + vec2(0., T.y)) - ht(uv - vec2(0., T.y));
      vec3 n = normalize(vec3(-vec2(hx / (2. * T.x * R.z), hy / (2. * T.y * R.w)) * relief, 1.));
      vec3 l = normalize(L), v = normalize(eye - wp);
      // soft shadow: march toward the light and see whether raised ink blocks it
      float sh = 0.;
      if (relief > .05){
        float k = l.z / max(length(l.xy), .001); vec2 ld = normalize(l.xy + 1e-5);
        float smax = min(relief / max(k, .08), relief * 8.);
        for (int i = 1; i <= 8; i++){
          float s = smax * float(i) / 8.;
          sh = max(sh, smoothstep(0., relief * .2, ht(uv + ld * s / R.zw) * relief - h0 - s * k));
        }
      }
      float ao = smoothstep(.06, thr, f) * .1 * clamp(relief / rmax, 0., 1.);
      vec3 paper = vec3(.984, .984, .98) * (1. - sh * .32 - ao);
      vec3 col = mix(paper, inkCol(n, l, v, sh), cov);
      col = mix(col, vec3(1.), smoothstep(fog.x, fog.y, distance(eye, wp)) * fog.z);
      gl_FragColor = vec4(col, 1.);
    }`);
  const flat = prog(`precision highp float;
    attribute vec2 a; uniform mat4 VP; uniform vec4 R; uniform float z; uniform vec3 off;
    varying vec2 uv; varying vec3 wp;
    void main(){ uv = a; wp = vec3(R.xy + a * R.zw, z) + off; gl_Position = VP * vec4(wp, 1.); }`, `precision highp float;
    varying vec2 uv; varying vec3 wp;
    uniform sampler2D C; uniform float mode; uniform vec2 cut; uniform vec4 S; uniform vec3 S2, off;
    void main(){
      vec3 lp = wp - off;
      if (mode < .5){
        if (cut.y > .5 && lp.y < cut.x) discard;
        if (cut.y < -.5 && lp.y >= cut.x) discard;
        vec4 c = texture2D(C, uv); if (c.a < .003) discard;
        gl_FragColor = c;
      } else {
        vec2 q = abs(lp.xy - S.xy) - (S.zw - S2.x);
        float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - S2.x;
        gl_FragColor = vec4(0., 0., 0., (1. - smoothstep(-S2.y, S2.y, d)) * S2.z);
      }
    }`);
  const wallP = prog(`precision highp float;
    attribute vec3 p; attribute vec3 c; uniform mat4 VP; varying vec3 col;
    void main(){ col = c; gl_Position = VP * vec4(p, 1.); }`, `precision highp float; varying vec3 col; void main(){ gl_FragColor = vec4(col, 1.); }`);
  const sph = prog(`precision highp float;
    attribute vec3 p; uniform mat4 VP; uniform vec4 D; uniform vec3 S; varying vec3 nn, wp;
    void main(){ nn = normalize(p / S); wp = D.xyz + p * D.w * S; gl_Position = VP * vec4(wp, 1.); }`, `precision highp float;
    varying vec3 nn, wp; uniform vec3 L, eye;
    ${LIT}
    void main(){ gl_FragColor = vec4(inkCol(normalize(nn), normalize(L), normalize(eye - wp), 0.), 1.); }`);
  if (!ink || !flat || !wallP || !sph) return null;

  const buf = (data, target = gl.ARRAY_BUFFER) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
  // the window mesh: 320 × 140 vertices, fine enough for the macro flight
  const GX = 320, GY = 140, gv = new Float32Array(GX * GY * 2), gi = new Uint16Array((GX - 1) * (GY - 1) * 6);
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++){ gv[(j * GX + i) * 2] = i / (GX - 1); gv[(j * GX + i) * 2 + 1] = j / (GY - 1); }
  for (let j = 0, k = 0; j < GY - 1; j++) for (let i = 0; i < GX - 1; i++, k += 6){ const a = j * GX + i; gi.set([a, a + 1, a + GX, a + 1, a + GX + 1, a + GX], k); }
  const gridV = buf(gv), gridI = buf(gi, gl.ELEMENT_ARRAY_BUFFER);
  const quadV = buf(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]));
  const sv = [], si = [], SA = 10, SB = 16;
  for (let i = 0; i <= SA; i++){ const t = i / SA * Math.PI; for (let j = 0; j <= SB; j++){ const p = j / SB * TAU; sv.push(Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t)); } }
  for (let i = 0; i < SA; i++) for (let j = 0; j < SB; j++){ const a = i * (SB + 1) + j, b = a + SB + 1; si.push(a, b, a + 1, a + 1, b, b + 1); }
  const sphV = buf(new Float32Array(sv)), sphI = buf(new Uint16Array(si), gl.ELEMENT_ARRAY_BUFFER), sphN = si.length;
  const wallV = gl.createBuffer();
  // textures: the ink height field on unit 0, the printed card on unit 1
  const mk = unit => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE)); return t; };
  mk(0); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  mk(1); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let VP = new Float32Array(16), eye = [0, 0, 1], fw = 1, fh = 1;
  const attr = (P, name, b, size, stride = 0, off = 0) => { const l = P.a(name); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, stride, off); return l; };
  function quad(R, z, off, mode, cut, S, S2){
    gl.useProgram(flat.p);
    gl.uniformMatrix4fv(flat.u('VP'), false, VP); gl.uniform4fv(flat.u('R'), R); gl.uniform1f(flat.u('z'), z); gl.uniform3fv(flat.u('off'), off);
    gl.uniform1f(flat.u('mode'), mode); gl.uniform2fv(flat.u('cut'), cut); gl.uniform4fv(flat.u('S'), S); gl.uniform3fv(flat.u('S2'), S2); gl.uniform1i(flat.u('C'), 1);
    const l = attr(flat, 'a', quadV, 2); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(l);
  }
  return {
    setField(c){ gl.activeTexture(gl.TEXTURE0); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); fw = c.width; fh = c.height; },
    setCard(c){ gl.activeTexture(gl.TEXTURE1); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); gl.generateMipmap(gl.TEXTURE_2D); },
    begin(cam){
      gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      VP = new Float32Array(cam.VP); eye = cam.eye;
    },
    // a soft rounded-rect shadow lying flat at height z
    shadow(x, y, hw, hh, r, blur, a, z){
      gl.depthMask(false);
      quad([x - hw - blur * 2, y - hh - blur * 2, (hw + blur * 2) * 2, (hh + blur * 2) * 2], z, [0, 0, 0], 1, [0, 0], [x, y, hw, hh], [r, blur, a]);
      gl.depthMask(true);
    },
    card(R, off, cut){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2, 4); quad(R, 0, off, 0, cut, [0, 0, 0, 0], [0, 0, 1]); gl.disable(gl.POLYGON_OFFSET_FILL); },
    ink(R, off, cut, o){
      gl.useProgram(ink.p);
      gl.uniformMatrix4fv(ink.u('VP'), false, VP); gl.uniform1i(ink.u('H'), 0); gl.uniform4fv(ink.u('R'), R);
      gl.uniform1f(ink.u('relief'), o.relief); gl.uniform1f(ink.u('thr'), THR); gl.uniform1f(ink.u('rmax'), o.rmax);
      gl.uniform3fv(ink.u('off'), off); gl.uniform2fv(ink.u('cut'), cut); gl.uniform2f(ink.u('T'), 2.4 / fw, 2.4 / fh);
      gl.uniform3fv(ink.u('L'), o.light); gl.uniform3fv(ink.u('eye'), eye); gl.uniform3fv(ink.u('fog'), o.fog);
      const l = attr(ink, 'a', gridV, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridI);
      gl.drawElements(gl.TRIANGLES, gi.length, gl.UNSIGNED_SHORT, 0); gl.disableVertexAttribArray(l);
    },
    wall(arr){
      gl.useProgram(wallP.p); gl.uniformMatrix4fv(wallP.u('VP'), false, VP);
      gl.bindBuffer(gl.ARRAY_BUFFER, wallV); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      const l1 = attr(wallP, 'p', wallV, 3, 24, 0), l2 = attr(wallP, 'c', wallV, 3, 24, 12);
      gl.drawArrays(gl.TRIANGLES, 0, arr.length / 6); gl.disableVertexAttribArray(l1); gl.disableVertexAttribArray(l2);
    },
    spheres(list, light){
      if (!list.length) return;
      gl.useProgram(sph.p); gl.uniformMatrix4fv(sph.u('VP'), false, VP); gl.uniform3fv(sph.u('L'), light); gl.uniform3fv(sph.u('eye'), eye);
      const l = attr(sph, 'p', sphV, 3); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphI);
      for (const q of list){ gl.uniform4f(sph.u('D'), q.x, q.y, q.z, q.r); gl.uniform3f(sph.u('S'), 1 / Math.sqrt(q.s), 1 / Math.sqrt(q.s), q.s); gl.drawElements(gl.TRIANGLES, sphN, gl.UNSIGNED_SHORT, 0); }
      gl.disableVertexAttribArray(l);
    }
  };
}

/* One 3D hero: specks drift and freeze into a card exactly as in Born random, then the version's own camera, light and ink take over. */
// the same blob shape as 5b at 70% strength, with the threshold scaled to match, so merged ink has headroom before it clips flat
const STOPS = [[0, 158], [.2, 139], [.4, 97], [.6, 51], [.8, 21], [1, 0]].map(([o, v]) => [o, v * .7]), THR = .32 * .7;
function Ink3D(key, cfg){
  const root = document.querySelector(`[data-key="${key}"].hero`), host = document.getElementById(key);
  const bg = host.querySelector('.bg'), ctx = bg.getContext('2d'), glc = host.querySelector('.gl'), tagEl = host.querySelector('.i3-tag');
  const ptr = track(host), E = engine3d(glc);
  const FSC = 3, field = document.createElement('canvas'), fctx = field.getContext('2d');
  const cardC = document.createElement('canvas'); cardC.width = 1024; cardC.height = 512; const cctx = cardC.getContext('2d');
  let parts = [], last = performance.now(), clock = 0, cyc = 0, lastW = 0, nth = 0, L = null, cam = null, light = [-.6, .6, .55], cardKey = '';
  function geom(w, h){
    const lw = w < 700 ? Math.min(280, w - 90) : Math.round(clamp(w * .3, 380, 480)), lh = Math.round(lw * .64);
    const st = document.querySelector('.topo-hero-stage'), hb = document.getElementById('drops');
    const yc = st && hb ? st.getBoundingClientRect().top - hb.getBoundingClientRect().top + st.offsetHeight / 2 : h * .5;
    const x = Math.round((w - lw) / 2), y = Math.round(yc - lh / 2);
    return {x, y, w: lw, h: lh, win: {x: x + 16, y: y + 38, w: lw - 32, h: lh - 80}};
  }
  // the printed card: drawn stretched into a power-of-two texture so it can be mipmapped at steep angles
  function paintCard(flash){
    const g = L.g, k = [L.code, L.typed, L.chip, flash.toFixed(2), g.w].join('|');
    if (k === cardKey) return false; cardKey = k;
    const x = cctx; x.setTransform(1024 / g.w, 0, 0, 512 / g.h, 0, 0); x.clearRect(0, 0, g.w, g.h);
    x.fillStyle = C.white; rr(x, .5, .5, g.w - 1, g.h - 1, 14); x.fill(); x.strokeStyle = C.line; x.lineWidth = 1; x.stroke();
    x.fillStyle = '#FBFBFA'; rr(x, 16, 38, g.win.w, g.win.h, 8); x.fill();
    if (flash > 0){ x.globalAlpha = flash; x.strokeStyle = C.honey; x.lineWidth = 3; rr(x, 13, 35, g.win.w + 6, g.win.h + 6, 10); x.stroke(); x.globalAlpha = 1; }
    if (LOGO.complete && LOGO.naturalWidth) x.drawImage(LOGO, 16, 12, 15 * LOGO.naturalWidth / LOGO.naturalHeight, 15);
    x.font = '500 10px Poppins, Arial, sans-serif'; x.fillStyle = C.body; x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillText(L.code.slice(0, L.typed), 16, g.h - 21);
    chip(x, g.w - 102, g.h - 21, true, 'Genuine', L.chip, 1);
    return true;
  }
  // the liquid: each blob is a soft hill; where hills add up past the threshold there is ink
  function paintField(blobs){
    const fw = Math.round(L.g.win.w * FSC), fh = Math.round(L.g.win.h * FSC);
    if (field.width !== fw || field.height !== fh){ field.width = fw; field.height = fh; }
    fctx.globalCompositeOperation = 'source-over'; fctx.fillStyle = '#000'; fctx.fillRect(0, 0, fw, fh);
    fctx.globalCompositeOperation = 'lighter';
    for (const b of blobs){
      if (!(b.a > 0)) continue;
      const s = b.s * FSC, R = s * 2.5, x = b.x * FSC, y = b.y * FSC;
      const g = fctx.createRadialGradient(x, y, 0, x, y, R);
      STOPS.forEach(([o, v]) => { const c = Math.min(255, Math.round(v * b.a)); g.addColorStop(o, `rgb(${c},${c},${c})`); });
      fctx.fillStyle = g; fctx.fillRect(x - R, y - R, R * 2, R * 2);
    }
  }
  // the cut face: paper edge below, solid ink rising to the height of the pattern along the cut
  function wallAt(cut, R, relief){
    const fw = field.width, fh = field.height, row = clamp(Math.round((1 - (cut - R[1]) / R[3]) * fh), 0, fh - 1);
    const N = 280, x0 = -L.g.w / 2, x1 = L.g.w / 2, t = 2.5, out = [];
    const v = (x, z, c) => out.push(x, cut, z, c, c * 1.04, c * 1.08);
    let px = 0, ph = 0;
    for (let i = 0; i <= N; i++){
      const x = x0 + (x1 - x0) * i / N; let hh = 0;
      if (x > R[0] && x < R[0] + R[2]){ const col = clamp(Math.round((x - R[0]) / R[2] * fw), 0, fw - 1); hh = (1 - Math.exp(-6 * Math.max(L.fd[(row * fw + col) * 4] / 255 - THR, 0))) * relief; }
      if (i){
        v(px, -t, .8); v(x, -t, .8); v(x, 0, .88); v(px, -t, .8); v(x, 0, .88); v(px, 0, .88);
        if (ph > 0 || hh > 0){ v(px, 0, .03); v(x, 0, .03); v(x, hh, .1 + hh / relief * .12); v(px, 0, .03); v(x, hh, .1 + hh / relief * .12); v(px, ph, .1 + ph / relief * .12); }
      }
      px = x; ph = hh;
    }
    return new Float32Array(out);
  }
  return {
    root,
    replay(){ clock = 0; cyc = 0; L = null; cam = null; glc.style.opacity = 0; tagEl.classList.remove('on'); },
    frame(now){
      const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; clock += RM ? 0 : dt;
      const {w, h, d} = fit(bg); fit(glc); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
      const g = geom(w, h);
      const want = clamp(Math.round(w * h / 153), 750, 3900);
      if (lastW !== w){ lastW = w; parts = []; }
      const prev = cyc; cyc = RM ? cfg.still : clock % cfg.cycle;
      if (!L && (cyc < prev || (cyc > 1.3 && cyc < 1.5) || RM)) L = {g, frozen: [], code: serial(9000 + nth++), done: false, typed: 0, chip: 0, fd: null};
      if (L && !L.done && (cyc >= 1.9 || RM)){
        L.done = true;
        ({parts, frozen: L.frozen} = capture(parts, L.g.win, want, w, h, L.g));
        L.end = .4 * Math.sqrt(L.g.win.w * L.g.win.h / L.frozen.length);
        if (cfg.freeze) cfg.freeze(L);
      }
      if (!L || !L.done){ glc.style.opacity = 0; tagEl.classList.remove('on'); return; }
      const G = L.g, cx = G.x + G.w / 2, cy = G.y + G.h / 2;
      const R = [-G.w / 2 + 16, G.h / 2 - 38 - G.win.h, G.win.w, G.win.h];
      const over = ptr.in && Math.abs(ptr.x - cx) < G.w * .9 && Math.abs(ptr.y - cy) < G.h * 1.3;
      const S = cfg.state(cyc, clock, {over, nx: clamp((ptr.x - cx) / (G.w * .6), -1, 1), ny: clamp((ptr.y - cy) / (G.h * .7), -1, 1)}, R);
      // ease the camera so the cursor never makes it jump
      const aim = {el: S.el, az: S.az, dist: S.dist, px: S.pan ? S.pan[0] : 0, py: S.pan ? S.pan[1] : 0, cut: S.cut || 0, gap: S.gap || 0};
      if (!cam || RM) cam = aim; else for (const k in aim) cam[k] += (aim[k] - cam[k]) * .14;
      light = light.map((v, i) => v + (S.light[i] - v) * .12);
      L.typed = RM ? 99 : Math.floor(S.typed * L.code.length); L.chip = RM ? 1 : S.chip;
      glc.style.opacity = String((RM ? 1 : smooth(1.9, 2.4, cyc)) * (1 - (S.fade || 0)));
      if (!E) return;
      paintField(cfg.blobs ? cfg.blobs(L, cyc) : L.frozen.map(p => ({x: p.x, y: p.y, s: p.r * .85 + (L.end * p.k - p.r * .85) * S.melt, a: 1})));
      E.setField(field);
      if (paintCard(RM ? 0 : clamp(1 - (cyc - 1.9) / .5, 0, 1))) E.setCard(cardC);
      const V = camera(w, h, cx, cy, cam);
      E.begin(V);
      E.shadow(0, -8 - cam.gap / 2, G.w / 2, G.h / 2 + cam.gap / 2, 14, 22, .16, -4);
      const o = {relief: S.relief, rmax: cfg.rmax, light, fog: S.fog ? [V.D * 1.4, V.D * 4.5, S.fog] : [0, 1, 0]};
      const cardR = [-G.w / 2, -G.h / 2, G.w, G.h];
      if (cam.gap > .3){
        const near = [0, -cam.gap, 0];
        E.card(cardR, [0, 0, 0], [cam.cut, 1]); E.ink(R, [0, 0, 0], [cam.cut, 1], o);
        E.card(cardR, near, [cam.cut, -1]); E.ink(R, near, [cam.cut, -1], o);
        if (S.melt >= 1){ if (!L.fd) L.fd = fctx.getImageData(0, 0, field.width, field.height).data; E.wall(wallAt(cam.cut, R, S.relief)); }
      } else { E.card(cardR, [0, 0, 0], [0, 0]); E.ink(R, [0, 0, 0], [0, 0], o); }
      if (cfg.drops){
        const ds = cfg.drops(L, cyc, clock, R);
        ds.forEach(q => E.shadow(q.x, q.y, q.r, q.r, q.r, 1 + q.z * .05, .3 * (1 - clamp(q.z / 170, 0, .9)), .35));
        E.spheres(ds, light);
      }
      tagEl.classList.toggle('on', !!S.tag);
      if (S.tag){
        if (tagEl.textContent !== S.tag) tagEl.textContent = S.tag;
        const tw = tagEl.offsetWidth;
        const [tx, ty] = S.tagFixed ? [w - 28 - tw / 2, h - 34] : project(V.VP, [0, G.h / 2, cfg.tagZ || 0], w, h);
        tagEl.style.transform = `translate(${Math.round(clamp(tx - tw / 2, 8, w - tw - 8))}px,${Math.round(ty - 40)}px)`;
      }
    }
  };
}

const BASE = [-.6, .6, .55];
const makers = {
  born3d: Born3D,
  // 5c · the camera drops to the label's edge and the pattern stands up as hills
  side: () => Ink3D('side', {cycle: 10.8, still: 5.6, rmax: 14, state(c, clk, P){
    const swing = ease(smooth(3.2, 4.7, c)) * (1 - ease(smooth(7.3, 8.3, c))), hold = smooth(4.5, 7.3, c);
    const live = P.over && c > 4.6 && c < 7.3;
    const a = Math.PI * (.85 - .7 * hold), rake = [Math.cos(a) * .92, .3, .26];
    return {melt: smooth(2.1, 3.3, c), relief: 14 * smooth(3.3, 4.5, c),
      el: 90 - (live ? 90 - (24 - 12 * P.ny) : 72) * swing, az: (live ? P.nx * 45 : -32 + 54 * hold) * swing, dist: 1 - .3 * swing,
      light: BASE.map((v, i) => v + (rake[i] - v) * swing),
      tag: swing > .6 ? 'Side view · the ink stands up' : '',
      typed: smooth(8.3, 8.9, c), chip: c > 9.0 ? 1 : 0, fade: smooth(9.9, 10.5, c)};
  }}),
  // 5d · the specks are drops in the air; the label catches them one at a time
  drops: () => Ink3D('drops', {cycle: 10.5, still: 6.4, rmax: 9, tagZ: 150,
    freeze(L){
      const idx = L.frozen.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      idx.forEach((i, n) => { const p = L.frozen[i]; p.tl = 3.0 + n / idx.length * 2.7 + Math.random() * .08; p.z0 = 25 + Math.random() * 120; p.ph = Math.random() * TAU; });
    },
    // landing: a narrow tall splash that spreads, wobbles and runs into its neighbours
    blobs: (L, c) => L.frozen.map(p => { const t = c - p.tl; return t < 0 ? {a: 0} : {x: p.x, y: p.y, s: L.end * p.k * (.3 + .7 * (1 - Math.exp(-t * 5))), a: 1 + .6 * Math.exp(-t * 3.2) * Math.cos(t * 15)}; }),
    drops(L, c, clk, R){
      const out = [], top = R[1] + R[3], rise = smooth(1.9, 3.0, c), F = .4;
      for (const p of L.frozen){
        if (c >= p.tl) continue;
        const r = 2 + p.r * .9;
        let z = p.z0 + Math.sin(clk * 2.2 + p.ph) * 3 + (1 - ease(rise)) * (520 + p.z0 * 2), s = 1;
        const f = (c - (p.tl - F)) / F;
        if (f > 0){ z *= 1 - f * f; s = 1 + .6 * f; }
        out.push({x: R[0] + p.x, y: top - p.y, z: Math.max(0, z) + r, r, s});
      }
      return out;
    },
    state(c, clk, P){
      const tilt = ease(smooth(2.0, 3.0, c)) * (1 - ease(smooth(7.0, 7.9, c))), sweep = smooth(5.9, 7.0, c), a = 2.4 + sweep * TAU;
      return {relief: 9, el: 90 - 40 * tilt, az: (-24 + (P.over ? P.nx * 26 : 0)) * tilt, dist: 1 - .08 * tilt,
        light: [Math.cos(a) * .85, Math.sin(a) * .85, .5],
        tag: '',
        typed: smooth(7.9, 8.5, c), chip: c > 8.6 ? 1 : 0, fade: smooth(9.6, 10.2, c)};
    }}),
  // 5e · the camera dives into the window and glides low over the ink
  macro: () => Ink3D('macro', {cycle: 11.4, still: 6.2, rmax: 8, state(c, clk, P, R){
    const dive = ease(smooth(3.9, 5.2, c)) * (1 - ease(smooth(7.9, 9.0, c))), fly = smooth(4.4, 8.2, c), a = 2.3 + fly * 1.6;
    return {melt: smooth(2.1, 3.3, c), relief: 8 * smooth(3.0, 4.0, c),
      el: 90 - 64 * dive, az: (-16 + 30 * fly + (P.over ? P.nx * 20 : 0)) * dive, dist: 1 - .8 * dive,
      pan: [(R[0] + R[2] * (.14 + .72 * fly)) * dive, (R[1] + R[3] * (.5 - (P.over ? P.ny * .25 : 0))) * dive],
      light: [Math.cos(a) * .8, Math.sin(a) * .8, .5], fog: dive,
      tag: dive > .6 ? 'Inside one label, up close' : '', tagFixed: true,
      typed: smooth(9.0, 9.5, c), chip: c > 9.6 ? 1 : 0, fade: smooth(10.5, 11.1, c)};
  }}),
  // 5f · the label splits and the cut face shows the height of the ink
  slice: () => Ink3D('slice', {cycle: 11.5, still: 6.0, rmax: 14, state(c, clk, P, R){
    const tilt = ease(smooth(3.3, 4.4, c)) * (1 - ease(smooth(8.2, 9.0, c))), open = ease(smooth(4.6, 5.4, c)) * (1 - ease(smooth(7.6, 8.3, c)));
    const live = P.over && open > .5;
    const k = live ? .5 - .42 * P.ny : .5 + .32 * Math.sin((c - 5.4) * 1.5) * smooth(5.4, 6.0, c);
    return {melt: smooth(2.1, 3.3, c), relief: 14 * smooth(3.1, 4.1, c),
      el: 90 - 58 * tilt, az: (-22 + 12 * smooth(5, 8, c) + (live ? P.nx * 14 : 0)) * tilt, dist: 1 - .3 * tilt,
      cut: R[1] + R[3] * k, gap: 56 * open, light: [-.5, .45, .7],
      tag: open > .6 ? 'Cross-section · the ink has height' : '',
      typed: smooth(9.0, 9.6, c), chip: c > 9.7 ? 1 : 0, fade: smooth(10.6, 11.2, c)};
  }})
};

/* ---------- the topographic ground: contour lines over mountain terrain; the cursor raises a peak ---------- */
function Topo(cv, host){
  const gl = cv.getContext('webgl', {antialias: false, alpha: false});
  if (!gl) return {frame(){}};
  const der = !!gl.getExtension('OES_standard_derivatives');
  const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fs = `${der ? '#extension GL_OES_standard_derivatives : enable\n#define DER\n' : ''}precision highp float;
  uniform vec2 res; uniform float t, dpr; uniform vec3 m; uniform vec4 tb;
  float hs(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6. - 15.) + 10.);
    return mix(mix(hs(i), hs(i + vec2(1., 0.)), u.x), mix(hs(i + vec2(0., 1.)), hs(i + vec2(1., 1.)), u.x), u.y); }
  mat2 rot = mat2(.8, -.6, .6, .8);
  float fbm(vec2 p){ float h = 0., a = .5; for (int i = 0; i < 4; i++){ h += a * vn(p); p = rot * p * 2.02 + vec2(1.7, 9.2); a *= .45; } return h; }
  // ranges: broad warped hills with sharp ridge lines along their crests
  float ridge(vec2 p){ float h = 0., a = .5; for (int i = 0; i < 3; i++){ float n = 1. - abs(vn(p) * 2. - 1.); h += a * n * n; p = rot * p * 2.1 + vec2(4.1, 2.3); a *= .4; } return h; }
  float H(vec2 px){
    vec2 p = px / 620. + vec2(t * .008, -t * .005);
    vec2 w = vec2(fbm(p + 5.2), fbm(p + 1.3)) * .9;
    float h = fbm(p + w) * 1.1 + ridge(p * .8 + w * .5) * .55;
    vec2 d = (px - m.xy) / 190.; h += m.z * exp(-dot(d, d));
    return h;
  }
  void main(){
    vec2 px = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / dpr;
    float h = H(px), N = 15.;
    float v = h * N;
  #ifdef DER
    float fw = fwidth(v); vec2 g = vec2(dFdx(h), dFdy(h)) * dpr;
  #else
    float hx = H(px + vec2(1., 0.)), hy = H(px + vec2(0., 1.)); vec2 g = vec2(hx - h, hy - h); float fw = (abs(g.x) + abs(g.y)) * N / dpr;
  #endif
    float d1 = abs(fract(v - .5) - .5) / max(fw, 1e-4);
    float d5 = abs(fract(v / 5. - .5) - .5) / max(fw / 5., 1e-4);
    float line = 1. - clamp(d1 - .35 * dpr, 0., 1.);
    float idx = 1. - clamp(d5 - .9 * dpr, 0., 1.);
    // soft hill shading from the upper left
    vec3 n = normalize(vec3(-g * 70., 1.)); float sh = clamp(dot(n, normalize(vec3(-.6, -.6, .55))), 0., 1.);
    vec3 paper = vec3(1.) * (.975 + .025 * sh);
    vec2 dm = (px - m.xy) / 260.; float near = exp(-dot(dm, dm)) * clamp(m.z / .55, 0., 1.);
    float a = max(line * (.42 + .2 * near), idx * (.72 + .2 * near));
    float ty = smoothstep(tb.x - 50., tb.x + 10., px.y) * (1. - smoothstep(tb.y - 30., tb.y + 40., px.y));
    float tx = 1. - smoothstep(tb.w * .8, tb.w * 1.25, abs(px.x - tb.z));
    a *= 1. - .88 * ty * tx;
    a *= 1. - smoothstep(res.y / dpr - 90., res.y / dpr, px.y);
    gl_FragColor = vec4(mix(paper, vec3(.04, .045, .05), a), 1.);
  }`;
  const sh = (type, s) => { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uRes = U('res'), uT = U('t'), uD = U('dpr'), uM = U('m'), uTB = U('tb');
  const ptr = track(host), M = {x: 0, y: 0, a: 0};
  let t0 = performance.now(), first = true;
  return {frame(now){
    const r = cv.getBoundingClientRect();
    // cap the pixel count so a 4K screen stays smooth
    const d = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2.4e6 / Math.max(1, r.width * r.height)));
    const W = Math.max(1, Math.round(r.width * d)), Hh = Math.max(1, Math.round(r.height * d));
    if (cv.width !== W || cv.height !== Hh){ cv.width = W; cv.height = Hh; }
    if (first){ M.x = r.width * .72; M.y = r.height * .3; first = false; }
    if (ptr.in){ M.x += (ptr.x - M.x) * .08; M.y += (ptr.y - M.y) * .08; }
    M.a += ((ptr.in && !RM ? .55 : 0) - M.a) * .05;
    gl.viewport(0, 0, W, Hh);
    gl.uniform2f(uRes, W, Hh); gl.uniform1f(uD, d); gl.uniform1f(uT, RM ? 0 : (now - t0) / 1000);
    gl.uniform3f(uM, M.x, M.y, M.a);
    const tr = document.querySelector('.th-reveal');
    if (tr){ const q = tr.getBoundingClientRect(); gl.uniform4f(uTB, q.top - r.top, q.bottom - r.top, q.left - r.left + q.width / 2, q.width / 2); } else gl.uniform4f(uTB, 1e5, 1e5, 0, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }};
}

const host = document.getElementById('drops');
if (!host) return () => {};
const topo = Topo(host.querySelector('.topo'), host);
let active = null, dead = false, raf = 0;
const start = () => {
  if (active || dead) return;
  active = makers.drops();
  raf = requestAnimationFrame(function loop(t){
    if (dead) return;
    const r = host.getBoundingClientRect();
    if (!document.hidden && r.bottom > 0 && r.top < innerHeight){ topo.frame(t); active.frame(t); }
    raf = requestAnimationFrame(loop);
  });
};
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);
const to = setTimeout(start, 1200);
return () => { dead = true; clearTimeout(to); cancelAnimationFrame(raf); };
}
