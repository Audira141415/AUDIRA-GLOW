/* Pencil sharpener — port of the Colorfigures 2.0 kids figure to the 1.0 engine with the free camera.
   A crank pencil sharpener: a peek window on top over the slanted blade, a see-through shavings drawer on the lit
   front, a crank on the shaded side. The pencil is a real 3D hexagonal prism + cone that sharpens turn by turn. */

/* ---------- geometry (x = depth, y = width, z = up) ---------- */
const W = 70, D = 60, H = 58, Z0 = 4, TZ = Z0 + H;       // body on a desk plate
const PCY = 30, PCZ = 46;                                // pencil axis (runs along x, out of the lit front), centred on the front face (y 0..60)
const TIP = 18, CB = 33, RCONE = 3.9, RHEX = 4.3, BLEN = 70, OUT = 62;   // blade cone tip..base, radii; body length; pull-out
const hx = 24, hz = 34, CR = 17;                         // crank hub on the shaded side (y = D), arm length
const DY0 = 8, DY1 = 52, DZ0 = 6, DZ1 = 28, DOUT = 22;   // shavings drawer
const BRD = [-10, -10, W + 10, D + 22];                  // desk plate
const WIN = [6, 10, 62, 50];                             // peek window on the top (x0, y0, x1, y1)

const PLATE = { l:'#ddd8ca', m:'#cbc5b6', d:'#b9b3a4' };
const PENCIL = { l:'#ffd95a', m:'#f6c234', d:'#dba11c' };
const WOODM = { l:'#eab676', m:'#d6a062', d:'#b57d43' };
const GRAPH = { l:'#55504c', m:'#3d3a38', d:'#2a2826' };
const STEELC = { l:'#e3e7e9', m:'#c9cfd2', d:'#9aa2a6' };
const PINK = { l:'#f7a9bb', m:'#f28fa6', d:'#c86a80' };
const HOLD = { l:'#5a544e', m:'#46413c', d:'#2f2b28' };
const ARMM = { l:'#c3cacd', m:'#a7b0b3', d:'#7f878a' };
const CAPM = { l:'#a9b1b4', m:'#8d9699', d:'#687073' };
const HANDLE = { l:'#e6b07a', m:'#c98a4a', d:'#9a6533' };
const RECESS = '#2b2523';

const rad = x => Math.max(0, RCONE * (x - TIP) / (CB - TIP));       // the blade's slant: cone radius at x
const f1 = v => v.toFixed(1);
// a wood shaving: a frilly fan curl with the yellow paint on its edge (screen-space glyph)
const curl = (x, y, s, a) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${Math.round(a)}) scale(${s})">
  <path d="M-3 0a3 3 0 1 0 3-3" fill="#f0c98e" stroke="#f2b822" style="stroke-width:1" stroke-dasharray="1.1 .5"/>
  <path d="M-1.5 .2a1.5 1.5 0 1 0 1.5-1.7" fill="none" stroke="#8a5a3c" style="stroke-width:.45"/></g>`;
// a straight prism along y with a convex (x, z) outline — the crank arm
function prismY(pts, y0, y1, m, w = .8){
  const A = pts.map(([x, z]) => [x, y0, z]), B = pts.map(([x, z]) => [x, y1, z]), c = avg(pts.map(([x, z]) => [x, 0, z]));
  let s = '';
  for (let i = 0; i < pts.length; i++){
    const j = (i + 1) % pts.length, a = pts[i], b = pts[j];
    let n = norm([b[1] - a[1], 0, -(b[0] - a[0])]);
    if (n[0] * ((a[0] + b[0]) / 2 - c[0]) + n[2] * ((a[1] + b[1]) / 2 - c[2]) < 0) n = n.map(v => -v);
    if (vis(n)) s += shape([A[i], A[j], B[j], B[i]], toneI(n, m), w);
  }
  if (vis([0, 1, 0])) s += shape(B, toneI([0, 1, 0], m), w);
  if (vis([0, -1, 0])) s += shape(A, toneI([0, -1, 0], m), w);
  return s + hullInk([...A, ...B], 1.1);
}
// the drawer front's face-local frame (2.0's SIDE plane: u runs toward -y, v toward -z, from (x, DY1, DZ1))
const drawerFrame = x => txM(P(x, DY1, DZ1), Dv(0, -1, 0), Dv(0, 0, -1));
const dwUV = (x, pts) => pts.map(([u, v]) => [x, DY1 - u, DZ1 - v]);

/* ---------- state ---------- */
let ui;
const st = { s: 0, th: -Math.PI / 2, phi: 0, sh: 0, out: false, drawer: 0, pile: 0, falling: [], turns: 0,
             turning: false, holding: false, peel: 0, busy: false };

/* ---------- the pencil (shifted sh along x; only the part with xmin <= x <= xmax) ----------
   returns its pieces from the tip to the eraser, joined so the nearer end is drawn last */
function pencil(sh, xmin = -1e9, xmax = 1e9){
  const s = st.s, rt = RCONE * .66 * (1 - s) + .12 * s;                 // tip radius: blunt -> needle
  const tipX = TIP + (CB - TIP) * rt / RCONE + sh, cb = CB + sh, e = CB + BLEN - 8 * s + sh;   // shorter as it sharpens
  const ax = x => [x, PCY, PCZ], parts = [];
  if (rt > 1.3 && tipX - 1 >= xmin && tipX <= xmax) parts.push(rod(ax(tipX), ax(tipX - 1), 1.3, GRAPH, toneI, .8, .8, 14));   // blunt graphite nub
  const x0 = Math.max(tipX, xmin), x1 = Math.min(cb, xmax);
  if (x0 < x1){
    const xg = TIP + (CB - TIP) * 1.3 / RCONE + sh, sharp = rt < 1.3;
    const xw = sharp ? Math.max(x0, Math.min(xg, x1)) : x0;
    if (sharp && xw > x0) parts.push(rod(ax(xw), ax(x0), rad(xw - sh), GRAPH, toneI, .8, rad(x0 - sh), 14));   // graphite point
    if (xw < x1) parts.push(rod(ax(x1), ax(xw), rad(x1 - sh), WOODM, toneI, .9, rad(xw - sh), 18));            // shaved wood cone
  }
  const h0 = Math.max(cb, xmin), h1 = Math.min(e - 10, xmax);
  if (h0 < h1){                                                       // hexagonal yellow body
    const v = (x, k) => { const a = st.phi + k * Math.PI / 3; return [x, PCY + RHEX * Math.cos(a), PCZ + RHEX * Math.sin(a)]; };
    let g = '';
    for (let k = 0; k < 6; k++){
      const m = st.phi + (k + .5) * Math.PI / 3, n = [0, Math.cos(m), Math.sin(m)];
      if (vis(n)) g += shape([v(h0, k), v(h1, k), v(h1, k + 1), v(h0, k + 1)], toneI(n, PENCIL), .7);
    }
    const ring0 = [0, 1, 2, 3, 4, 5].map(k => v(h0, k)), ring1 = [0, 1, 2, 3, 4, 5].map(k => v(h1, k));
    if (h0 === cb && vis([-1, 0, 0])) g += shape(ring0, '#eab676', .7);                        // bare wood end around the cone
    g += hullInk([...ring0, ...ring1], 1.3);
    parts.push(g);
  }
  if (Math.max(e - 10, xmin) < Math.min(e - 4, xmax)) parts.push(cylX(Math.max(e - 10, xmin), Math.min(e - 4, xmax), PCY, PCZ, 4.5, STEELC, toneI, 1, 20));   // ferrule
  if (Math.max(e - 4, xmin) < Math.min(e, xmax)) parts.push(cylX(Math.max(e - 4, xmin), Math.min(e, xmax), PCY, PCZ, 4.2, PINK, toneI, 1, 20));             // eraser
  return (vis([1, 0, 0]) ? parts : parts.reverse()).join('');
}

/* ---------- inside the peek window: blade holder, slanted blade, pencil, a curl peeling off ---------- */
function inside(){
  const bz = 47.2, E0 = [TIP - 1, PCY - .2, bz], E1 = [CB + 4, PCY - rad(CB + 4) - .2, bz];
  let blade = shape([E0, E1, [CB + 4, E1[1] - 7, bz], [TIP - 3, PCY - 6, bz]], '#dfe5e7', .8);
  blade += `<path d="${pd([E0, E1], false)}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`;
  blade += shape(on(PZ(bz + .05), ellUV(26, PCY - 9, 1.2, 1.2, 14)), '#8d9699', .5);
  const parts = [
    { at: [24, PCY - 17, 42], svg: box(12, PCY - 21, 38, 36, PCY - 13, 46.5, HOLD, toneI, .8) },   // holder beside the pencil, moves with it
    { at: [24, PCY - 6, bz], svg: blade },
    { at: [24, PCY, PCZ], svg: pencil(st.sh, -1e9, W) },
  ];
  let g = byDepth(parts);
  if (st.peel > 0){ const p = P(25, PCY - rad(25) - 2.5, 49); g += curl(p[0], p[1], .5 + st.peel * .6, st.peel * 300); }
  return g;
}

/* ---------- the drawer (sticks out of the front, x = W) ---------- */
function drawer(m){
  const o = st.drawer, X = W + .6 + o, DM = { l: m.m, m: mix(m.m, m.d, .35), d: mix(m.m, m.d, .6) };
  let tray = '';
  if (o > .5)   // the tray outside the body: its walls, and the open top seen as a dark recess
    tray = box(W, DY0, DZ0, W + o, DY1, DZ1, DM, tone, .9) + shape([[W, DY0, DZ1], [W + o, DY0, DZ1], [W + o, DY1, DZ1], [W, DY1, DZ1]], RECESS, .9);
  // the shavings: real 3D pieces lying on the tray floor, spread through its depth (behind the front plate), seen
  // through the window and, with the drawer out, down through the open top
  const shav = [], piece = (u, v, n, a) => { const fr = ((Math.sin(n * 7.31) * 9301.17) % 1 + 1) % 1, x = X - 3 - fr * (DOUT - 6);
    const [, y, z] = dwUV(x, [[u, v]])[0], q = P(x, y, z); shav.push({ at: [x, y, z], svg: curl(q[0], q[1], 1.25, a) }); };
  for (let n = 0; n < st.pile; n++){ const [pu, pv] = slot(n); piece(pu, pv, n, n * 77); }
  st.falling.forEach((c, i) => piece(c.u, c.v, st.pile + i, c.a));
  const pile = byDepth(shav);
  if (o > .5 && pile) tray += clipTo([[W, DY0, DZ1], [W + o, DY0, DZ1], [W + o, DY1, DZ1], [W, DY1, DZ1]], pile);   // looking down into the open tray
  // front plate: in front of the tray when the front faces us, behind it otherwise
  const plate = box(W + o, DY0, DZ0, X, DY1, DZ1, DM, tone, 1);
  let d = vis([1, 0, 0]) ? tray + plate : plate + tray;
  if (vis([1, 0, 0])){
    const XF = X + .05, win = on(PX(XF), rrUV(DY1 - 41, DZ1 - 18, DY1 - 3, DZ1 - 3, 1.5, 4));
    d += fill(pd(win), '#e3eaec');
    if (pile) d += clipTo(win, pile);
    d += fill(pd(win), '#cfe9f0', 'opacity=".22"');
    d += clipTo(win, fill(pd(dwUV(XF, [[10, 18], [16, 3], [19, 3], [13, 18]])), '#ffffff', 'opacity=".38"'));
    d += ink(pd(win), 1.1);
    d += shape(on(PX(XF), rrUV(DY1 - 28, DZ1 - 21, DY1 - 16, DZ1 - 19.2, .9, 4)), HOLD.m, .7);   // finger pull
  }
  return act('drawer', d);
}
function slot(n){                     // where the n-th shaving settles in the drawer (face-local u, v)
  const r = Math.sin(n * 12.9898) * 43758.5453, fr = r - Math.floor(r);
  return [7 + fr * 30, 16 - Math.floor(n / 7) * 2.4 - (n % 3) * .6];
}

/* ---------- the crank (sticks out of the shaded side, y = D) ---------- */
function crank(){
  const ex = hx + CR * Math.cos(st.th), ez = hz + CR * Math.sin(st.th), nx = -Math.sin(st.th) * 2.4, nz = Math.cos(st.th) * 2.4;
  const hub = rod([hx, D, hz], [hx, D + 4, hz], 6, STEELC, toneI, 1.1, 6, 24);
  const arm = prismY([[hx + nx, hz + nz], [ex + nx, ez + nz], [ex - nx, ez - nz], [hx - nx, hz - nz]], D + 4, D + 5, ARMM);
  const top = byDepth([
    { at: [hx, D + 4.7, hz], svg: rod([hx, D + 4, hz], [hx, D + 5.6, hz], 3.4, CAPM, toneI, .9, 3.4, 18) },
    { at: [ex, D + 11, ez], svg: rod([ex, D + 5, ez], [ex, D + 17, ez], 3, HANDLE, toneI, 1.1, 3, 18) },
  ]);
  return act('crank', vis([0, 1, 0]) ? hub + arm + top : top + arm + hub);
}

/* ---------- the front fittings: drawer, metal collar round the hole, the pencil outside ---------- */
function frontBits(m){
  let collar = cylX(W, W + 2.5, PCY, PCZ, 6.5, STEELC, toneI, 1.1, 24);
  if (vis([1, 0, 0])) collar += shape(on(PX(W + 2.55), ellUV(PCY, PCZ, 4.9, 4.9, 22)), RECESS, .9);
  const pen = act('pencil', pencil(st.sh, W + 2.5));
  return drawer(m) + (vis([1, 0, 0]) ? collar + pen : pen + collar);   // the drawer is lower: always farther
}

/* ---------- scene ---------- */
const bodyRing = z => on(PZ(z), rrUV(0, 0, W, D, 6));
function scene(st, m){
  const FRONT = vis([1, 0, 0]), SIDE = vis([0, 1, 0]);
  let s = board(...BRD, Z0, 6, PLATE);
  const ex = hx + CR * Math.cos(st.th), ez = hz + CR * Math.sin(st.th);
  const clip = boardTop(...BRD, Z0, 6);
  s += castShadow([...bodyRing(Z0), ...bodyRing(TZ), [ex, D + 17, ez + 3], [ex, D + 17, ez - 3], [hx, D + 4, hz + 6]], Z0, clip);
  const e = CB + BLEN - 8 * st.s + st.sh;
  if (!st.out && st.sh < 20) s += castShadow([[W, PCY, PCZ - 4], [e, PCY - 4, PCZ - 4], [e, PCY + 4, PCZ + 4], [W, PCY, PCZ + 4]], Z0, clip);

  // ---- the body ----
  const top = mix(tone([0, 0, 1], m), '#ffffff', .3);
  let body = loft(bodyRing(Z0), bodyRing(TZ), n => tone(n, m));
  body += fill(pd(bodyRing(TZ)), top) + ink(pd(bodyRing(TZ)), 1.3);
  // shaded side: a name sticker under the crank
  if (SIDE){
    const sm = tone([0, 1, 0], m);
    body += shape(on(PY(D + .15), rrUV(40, TZ - 50, 64, TZ - 40, 3, 4)), mix(sm, '#ffffff', .22), .9);
    body += txY(52, D + .25, TZ - 47.2, 'SHARPY', 5, mix(sm, '#000000', .45), 800);
  }
  body += hullInk([...bodyRing(Z0), ...bodyRing(TZ)], 2.8);
  const k = ease(st.xr || 0);
  if (k > 0) body = xrGhostRings(body, '', k, bodyRing(Z0), bodyRing(TZ), m) + `<g opacity="${f(k)}">${sharpMech(st, k)}</g>`;   // inside parts over the ghost

  // ---- things sticking out: behind the body when their face is turned away, in front when it faces us ----
  const cr = crank(), fr = frontBits(m);
  let before = '', after = '';
  // crank vs front fittings: the plane x = W separates them, so the one on the viewer's side of it is nearer
  const pair = FRONT ? [['c', cr], ['f', fr]] : [['f', fr], ['c', cr]];
  for (const [k, svg] of pair){ const faces = k === 'c' ? SIDE : FRONT; if (faces) after += svg; else before += svg; }
  const surf = [];
  if (SIDE) surf.push({ at:[hx, D + 4, hz], text:'CRANK', on: !!st.holding });
  if (FRONT) surf.push({ at:[W + 2.5, PCY, PCZ + 6.5], text:'PENCIL', on:false }, { at:[W + st.drawer, (DY0 + DY1)/2, DZ0], text:'DRAWER', on: st.drawer > 0 });
  return s + before + body + after + (k > .6 ? MECH_LABELS : xrCallouts(surf, [0, W + 20, 0, D + 20, 0, TZ]));
}


/* ---------- see-through + labels kit (shared; the figure supplies its own working parts) ----------
   xrCallouts(items, B): pills in two columns either side of the object, sorted top to bottom so leaders never cross.
     items: [{ at:[x,y,z], text, on }], B: the object's bounds [x0, x1, y0, y1, z0, z1].
   xrGhost(body, mech, k, OUTp, x0, x1, m): far walls faintly, the working parts, then the case as a ghost over them.
   xrMount(getUI, caption): the See-through / Labels switches (top right), the caption under the figure, label hiding. */
function xrCallouts(items, B){
  const pts = []; for (const x of [B[0], B[1]]) for (const y of [B[2], B[3]]) for (const z of [B[4], B[5]]) pts.push(P(x, y, z));
  const xmin = Math.min(...pts.map(p => p[0])), xmax = Math.max(...pts.map(p => p[0])), cx = (xmin + xmax)/2;
  // on a phone (LBL_U = drawing units per screen px) each label is a numbered badge and the names go in a legend under the figure
  const k = INK_K, u = window.LBL_U ? LBL_U() : 0, fs = u ? 10*u : 8.6*k, hgt = u ? 17*u : fs*1.8, gap = hgt + (u ? 3*u : 3*k);
  const L = [], R = [];
  const svgEl = document.getElementById('fig'), vb = svgEl.viewBox.baseVal, btn = document.getElementById('btns');
  const wMax = u ? hgt*1.3 + 12*k : Math.max(...items.map(it => it.text.length))*fs*.62 + fs*1.5 + 12*k;
  const roomL = xmin - vb.x >= wMax, roomR = vb.x + vb.width - xmax >= wMax;
  for (const it of items){ const [X, Y] = P(...it.at); ((X < cx && roomL) || !roomR ? L : R).push({ ...it, X, Y }); }
  let s = '';
  let top = { [-1]: fs, [1]: fs + 30*k };
  if (btn && svgEl.getScreenCTM()){ const r = btn.getBoundingClientRect(), q = new DOMPoint(r.right, r.bottom + 50).matrixTransform(svgEl.getScreenCTM().inverse());
    if (q.y > 0) top[-1] = q.y + hgt; }
  for (const [col, side] of [[L, -1], [R, 1]]){
    col.sort((a, b) => a.Y - b.Y);
    let y = -1e9; for (const c of col){ c.py = Math.max(c.Y, y + gap, top[side]); y = c.py; }
    const shift = col.length ? Math.max(0, col.reduce((a, c) => a + c.py - c.Y, 0) / col.length) : 0;
    const room = col.length ? col[0].py - top[side] : 0; for (const c of col) c.py -= Math.min(shift, room);
    for (const c of col){
      c.n = ((window.__ln || (window.__ln = {}))[c.text] || (__ln[c.text] = Object.keys(__ln).length + 1)); const w = u ? hgt*(c.n > 9 ? 1.3 : 1) : c.text.length*fs*.62 + fs*1.5;
      let px = side < 0 ? xmin - 10*k - w/2 : xmax + 10*k + w/2; px = Math.max(vb.x + w/2 + 2*k, Math.min(vb.x + vb.width - w/2 - 2*k, px));
      const ex = px - side*w/2;
      s += `<g class="tag${c.on ? ' on' : ''}" data-n="${c.n}" data-t="${c.text}"><path d="M${f(c.X)} ${f(c.Y)}L${f(ex + side*-4*k)} ${f(c.py)}L${f(ex)} ${f(c.py)}" fill="none" stroke="${INK}" stroke-width="1"/>`
        + `<circle cx="${f(c.X)}" cy="${f(c.Y)}" r="${f(1.4*k)}" fill="${INK}"/>`
        + `<rect x="${f(px - w/2)}" y="${f(c.py - hgt/2)}" width="${f(w)}" height="${f(hgt)}" rx="${f(hgt/2)}" fill="${c.on ? 'var(--accent,#f4b829)' : '#fff4d6'}" stroke="${INK}" stroke-width="1.2"/>`
        + `<text x="${f(px)}" y="${f(c.py + fs*.36)}" font-size="${f(fs)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" letter-spacing=".04em" fill="${INK}">${u ? c.n : c.text}</text></g>`;
    }
  }
  return s;
}
function xrGhost(body, mech, k, OUTp, x0, x1, m){
  const fF = facing([1,0,0]), fB = facing([-1,0,0]);
  const far = `<g opacity="${f(.5*k)}">` + loft(on(PX(x0), OUTp), on(PX(x1), OUTp), n => mix(toneI(n.map(v => -v), m), '#f2efe7', .55), true)
    + (fF ? fill(pd(on(PX(x0), OUTp)), mix(m.d, '#f2efe7', .5)) : '') + (fB ? fill(pd(on(PX(x1), OUTp)), mix(m.d, '#f2efe7', .5)) : '') + `</g>`;
  return far + mech + `<g opacity="${f(1 - .8*k)}">${body}</g>` + `<g opacity="${f(.6*k)}">` + hullInk([...on(PX(x0), OUTp), ...on(PX(x1), OUTp)], 2.8) + `</g>`;
}
function xrMount(getUI, caption){
  const ui = getUI(), q = new URLSearchParams(location.search), html = document.documentElement;
  if (q.get('labels') !== '1') html.classList.add('nolabels');
  if (ui.st.xr == null){ ui.st.xr = 0; ui.st.xrT = 0; }
  if (q.get('xr') === '1') ui.st.xr = ui.st.xrT = 1;
  const old = document.getElementById('lblctl'); if (old) old.style.display = 'none';
  const vset = document.createElement('div'); vset.className = 'vset';
  vset.innerHTML = '<div class="vrow"><button class="act" id="xrb" aria-pressed="false">See-through</button><button class="act" id="lblb" aria-pressed="false">Labels</button></div>';
  document.querySelector('.stage').appendChild(vset);
  // pages with a stats panel in the top right: the switches go just under it
  const place = () => { const sp = document.getElementById('stats'); vset.style.top = sp ? (sp.offsetTop + sp.offsetHeight + 10) + 'px' : ''; };
  place(); new ResizeObserver(place).observe(document.getElementById('stats') || vset);
  const xrb = document.getElementById('xrb'), lblb = document.getElementById('lblb');
  const sync = () => { xrb.setAttribute('aria-pressed', !!getUI().st.xrT); lblb.setAttribute('aria-pressed', !html.classList.contains('nolabels')); };
  xrb.onclick = () => { const u = getUI(), st = u.st; st.xr = st.xr || 0; st.xrT = st.xrT ? 0 : 1; sync();
    u.animate(dt => { const g = Math.sign(st.xrT - st.xr); st.xr = Math.min(1, Math.max(0, st.xr + g*dt/.7)); return st.xr !== st.xrT; }); };
  lblb.onclick = () => { html.classList.toggle('nolabels'); sync(); };
  sync();
  const cap = document.createElement('p'); cap.className = 'mcap'; document.querySelector('.stage').after(cap);
  const css = document.createElement('style');
  css.textContent = '.vset{position:absolute;top:4px;right:0;z-index:2}.vrow{display:flex;gap:6px}.vset .act[aria-pressed=true]{background:var(--ink);color:var(--paper)}'
    + 'html.nolabels #fig .tag{display:none}.mcap{width:100%;max-width:760px;min-height:3em;margin:0 0 14px;font-size:12.5px;line-height:1.5;text-align:center;transition:opacity .3s}'
    + '@media (max-width:560px){.vset{position:static;margin:4px 0}}';
  document.head.appendChild(css);
  const r0 = ui.render; ui.render = () => { r0(); const st = getUI().st; cap.style.opacity = st.xr > .5 ? 1 : 0; cap.textContent = caption(st); };
  ui.render();
}
// same, for a body lofted between two horizontal rings A (bottom) and B (top)
function xrGhostRings(body, mech, k, A, B, m){
  const far = `<g opacity="${f(.5*k)}">` + loft(A, B, n => mix(toneI(n.map(v => -v), m), '#f2efe7', .55), true) + fill(pd(A), mix(m.d, '#f2efe7', .5)) + `</g>`;
  return far + mech + `<g opacity="${f(1 - .8*k)}">${body}</g>` + `<g opacity="${f(.6*k)}">` + hullInk([...A, ...B], 2.8) + `</g>`;
}

/* ---------- see-through: inside a crank pencil sharpener ----------
   The crank turns a shaft across the body; a bevel gear at its end turns the cutter carriage, whose helical cutter orbits
   the pencil tip and shaves a cone; the shavings fall into the drawer below. */
const STEELS = { l:'#e3e7e9', m:'#c9cfd2', d:'#9aa2a6' }, SBR = { l:'#f2d37a', m:'#d7af4a', d:'#9a7a2a' }, SGM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' };
/* ---------- see-through: how a real crank pencil sharpener works ----------
   Parts (each held by another):
   DRIVE   crank (outside) . bushing in the side wall . crank shaft . bevel pinion on its end
   CARRIAGE crown ring gear (meshes the pinion, turns around the pencil axis) . two cage bars back to the rear disc .
           rear disc on a stub axle . front and back bearing plates fixed to the body
   CUTTERS two helical burrs lying along the cone, one each side, each on its own axle . a pinion on each burr's back end
           running round the fixed internal ring gear, so the burrs spin as the carriage carries them round the pencil
   PENCIL  grip jaws above and below the pencil behind the hole, each pressed by a spring . the pencil itself
   SHAVINGS chute walls from under the cutters down into the drawer */
const sP = (x, a, r) => [x, PCY + r*Math.cos(a), PCZ + r*Math.sin(a)];
const BUR = { x0:16, x1:31, r:2.4 }, IRG = { x0:14.6, x1:16, ri:4.6, ro:7.6 }, RDISC = { x0:11, x1:13, r:6 };
let MECH_LABELS = '';
function sharpMech(st, k){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg }), turning = !!st.holding || !!st.turning, a = st.th;
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const GR = 7, CRR = 12, cx0 = hx + GR, gy = PCY, orb = -a*GR/CRR;
  // ---- drive: bushing, crank shaft, bevel pinion
  put([[hx - 2.6, D - 3, hz - 2.6], [hx + 2.6, D, hz + 2.6]], rod([hx, D - 3, hz], [hx, D, hz], 2.6, SBR, toneI, .7));
  put([[hx - 1.5, gy + 1.5, hz - 1.5], [hx + 1.5, D - 3, hz + 1.5]], rod([hx, D - 3, hz], [hx, gy + 1.5, hz], 1.4, METAL, toneI, .9));
  const ring = on(PY(gy - 1.5), ellUV(hx, hz, GR, GR, 28)), ring2 = on(PY(gy + 1.5), ellUV(hx, hz, GR, GR, 28));
  let g = loft(ring, ring2, n => toneI(n, SBR)) + (vis([0,1,0]) ? fill(pd(ring2), SBR.l) : fill(pd(ring), SBR.l)) + hullInk([...ring, ...ring2], 1);
  const gf = vis([0,1,0]) ? gy + 1.6 : gy - 1.6;
  for (let i = 0; i < 12; i++){ const t = a + i*Math.PI/6; g += ink(pd([[hx + 4.6*Math.cos(t), gf, hz + 4.6*Math.sin(t)], [hx + GR*Math.cos(t), gf, hz + GR*Math.sin(t)]], false), .6); }
  put([[hx - GR, gy - 1.5, hz - GR], [hx + GR, gy + 1.5, hz + GR]], g);
  // ---- fixed bearing plates (front with the pencil hole, back with the stub axle)
  for (const [x0, x1] of [[cx0 + 3.2, cx0 + 5], [6, 8]]){
    // a strap standing on the floor, its boss round the axis (the front one is the pencil's guide hole)
    let pl = box(x0, PCY - 3, Z0, x1, PCY + 3, PCZ, SGM, toneI, .7) + cylX(x0, x1, PCY, PCZ, 6.2, SGM, toneI, .7, 22);
    if (x0 > 20 && vis([1,0,0])) pl += shape(on(PX(x1 + .05), ellUV(PCY, PCZ, 4.9, 4.9, 18)), RECESS, .5);
    put([[x0, PCY - 6.2, Z0], [x1, PCY + 6.2, PCZ + 6.2]], pl);
  }
  put([[8, PCY - 1, PCZ - 1], [RDISC.x0, PCY + 1, PCZ + 1]], rod([8, PCY, PCZ], [RDISC.x0, PCY, PCZ], 1, METAL, toneI, .6));
  // ---- carriage: crown ring gear at the front, rear disc, two cage bars between them (turning with the carriage)
  const cr = on(PX(cx0), ellUV(PCY, PCZ, CRR, CRR, 32)), cr2 = on(PX(cx0 + 3), ellUV(PCY, PCZ, CRR, CRR, 32));
  let c = loft(cr, cr2, n => toneI(n, SBR)) + (vis([1,0,0]) ? fill(pd(cr2), SBR.l) : fill(pd(cr), SBR.l)) + hullInk([...cr, ...cr2], 1.1);
  const cf = vis([1,0,0]) ? cx0 + 3.1 : cx0 - .1;
  for (let i = 0; i < 16; i++){ const t = orb + i*Math.PI/8; c += ink(pd([[cf, PCY + 9.5*Math.cos(t), PCZ + 9.5*Math.sin(t)], [cf, PCY + CRR*Math.cos(t), PCZ + CRR*Math.sin(t)]], false), .55); }
  if (vis([1,0,0])) c += shape(on(PX(cf + .02), ellUV(PCY, PCZ, 5.6, 5.6, 18)), RECESS, .5);
  put([[cx0, PCY - CRR, PCZ - CRR], [cx0 + 3, PCY + CRR, PCZ + CRR]], c);
  put([[RDISC.x0, PCY - RDISC.r, PCZ - RDISC.r], [RDISC.x1, PCY + RDISC.r, PCZ + RDISC.r]], cylX(RDISC.x0, RDISC.x1, PCY, PCZ, RDISC.r, SBR, toneI, .7, 22));
  for (const da of [Math.PI/2, -Math.PI/2]){ const p0 = sP(RDISC.x1, orb + da, 5), p1 = sP(cx0, orb + da, 9.5);
    put([[Math.min(p0[0], p1[0]) - 1, Math.min(p0[1], p1[1]) - 1, Math.min(p0[2], p1[2]) - 1], [Math.max(p0[0], p1[0]) + 1, Math.max(p0[1], p1[1]) + 1, Math.max(p0[2], p1[2]) + 1]], rod(p0, p1, .8, SBR, toneI, .6)); }
  // ---- the fixed internal ring gear the burrs' pinions run round
  { const o0 = on(PX(IRG.x0), ellUV(PCY, PCZ, IRG.ro, IRG.ro, 28)), o1 = on(PX(IRG.x1), ellUV(PCY, PCZ, IRG.ro, IRG.ro, 28)), fx = vis([1,0,0]) ? IRG.x1 + .05 : IRG.x0 - .05;
    let rg = loft(o0, o1, n => toneI(n, SGM)) + fill(pd(on(PX(fx), ellUV(PCY, PCZ, IRG.ro, IRG.ro, 28))), SGM.l) + fill(pd(on(PX(fx + (fx > IRG.x0 ? .02 : -.02)), ellUV(PCY, PCZ, IRG.ri, IRG.ri, 24))), RECESS) + hullInk([...o0, ...o1], .8);
    for (let i = 0; i < 18; i++){ const t = i/18*2*Math.PI; rg += line([sP(fx, t, IRG.ri), sP(fx, t, IRG.ri + .9)], .35); }
    put([[IRG.x0, PCY - IRG.ro, PCZ - IRG.ro], [IRG.x1, PCY + IRG.ro, PCZ + IRG.ro]], rg); }
  // ---- two helical burrs along the cone, spinning on their own axles, pinions at their back ends
  const spin = a * 3.2;
  for (const da of [0, Math.PI]){ const t = orb + da, rA = Math.max(0, rad(BUR.x0)) + BUR.r, rB = rad(BUR.x1) + BUR.r, A = sP(BUR.x0, t, rA), B = sP(BUR.x1, t, rB);
    let bu = rod(A, B, BUR.r, STEELS, toneI, .8);
    for (let i = 0; i < 7; i++){ const u = ((i + spin/(2*Math.PI)*1) % 7 + 7) % 7 / 7, x = gl3(BUR.x0 + 1, BUR.x1 - 1, u), r = Math.max(0, rad(x)) + BUR.r, Cx = sP(x, t, r);
      const nrm = [0, Math.cos(t), Math.sin(t)], side = [0, -Math.sin(t), Math.cos(t)], toV = facing(side) ? 1 : -1;
      bu += line([[Cx[0] - 1, Cx[1] + side[1]*BUR.r*.9*toV + nrm[1]*.3, Cx[2] + side[2]*BUR.r*.9*toV + nrm[2]*.3], [Cx[0] + 1, Cx[1] - side[1]*BUR.r*.2*toV + nrm[1]*BUR.r*.8, Cx[2] - side[2]*BUR.r*.2*toV + nrm[2]*BUR.r*.8]], .4); }
    bu += rod(sP(RDISC.x1, t, rA), A, .5, METAL, toneI, .4);
    bu += rod(sP(IRG.x0 + .1, t, IRG.ri - 2), sP(IRG.x1 - .1, t, IRG.ri - 2), 2, SBR, toneI, .5);
    put([[RDISC.x1, Math.min(A[1], B[1]) - 3, Math.min(A[2], B[2]) - 3], [BUR.x1, Math.max(A[1], B[1]) + 3, Math.max(A[2], B[2]) + 3]], bu);
  }
  // ---- the pencil, and the grip jaws pressing it from above and below behind the hole
  // the pencil in two pieces either side of the carriage ring and the front boss it passes through (so each sorts on its own)
  put([[TIP, PCY - 4.5, PCZ - 4.5], [cx0, PCY + 4.5, PCZ + 4.5]], pencil(st.sh, -1e9, cx0));
  put([[cx0 + 5, PCY - 4.5, PCZ - 4.5], [W, PCY + 4.5, PCZ + 4.5]], pencil(st.sh, cx0 + 5, W));
  if (!st.out) for (const s of [1, -1]){ const z0 = PCZ + s*4.4, z1 = PCZ + s*6.6;
    bx(56, PCY - 3, Math.min(z0, z1), 64, PCY + 3, Math.max(z0, z1), SGM, .6);
    const sp = []; for (let i = 0; i <= 10; i++) sp.push([60 + (i && i < 10 ? (i % 2 ? 1.4 : -1.4) : 0), PCY, z1 + s*i*.7]);
    put([[58, PCY - .5, Math.min(z1, z1 + s*7)], [62, PCY + .5, Math.max(z1, z1 + s*7)]], line(sp, .5)); }
  bx(54, PCY - 5, PCZ + 13.6, 66, PCY + 5, PCZ + 15, SGM, .6); bx(54, PCY - 5, PCZ - 15, 66, PCY + 5, PCZ - 13.6, SGM, .6);
  // ---- shavings chute: two sloping walls from under the cutters into the drawer's mouth
  const glass = pts => `<g opacity=".35">${fill(pd(pts), '#e9eef0')}</g>` + ink(pd(pts), .6);
  put([[10, 14, DZ1], [40, 46, 36]], [14, 46].map((y, i) => glass([[10, y, 36], [40, y, 36], [36, i ? DY1 - 6 : DY0 + 6, DZ1 + .5], [14, i ? DY1 - 6 : DY0 + 6, DZ1 + .5]])).join(''));
  const s = byDepth(parts);
  MECH_LABELS = k <= .6 ? '' : xrCallouts([
    { at: [hx, (D + PCY + 8)/2, hz + 1.5], text: 'CRANK SHAFT', on: turning },
    { at: [hx, PCY, hz - 7], text: 'BEVEL GEARS', on: turning },
    { at: [cx0 + 1.5, PCY, PCZ + CRR], text: 'CUTTER CARRIAGE', on: turning },
    { at: sP((BUR.x0 + BUR.x1)/2, orb + Math.PI/2, 6), text: 'HELICAL BURRS', on: turning },
    { at: [IRG.x1, PCY, PCZ - IRG.ro], text: 'FIXED RING GEAR', on: turning },
    { at: [60, PCY, PCZ + 6.6], text: 'PENCIL GRIP', on: !st.out },
    { at: [38, 46, 33], text: 'SHAVINGS CHUTE', on: turning },
    { at: [W - 2, (DY0 + DY1)/2, DZ1], text: 'SHAVINGS DRAWER', on: st.drawer > 0 } ], [0, W + 20, 0, D + 20, 0, TZ]);
  return s;
}
const gl3 = (a, b, t) => a + (b - a)*t;
const sharpCaption = st => st.holding || st.turning ? 'Cranking: the bevel gears turn the carriage around the pencil. As it goes round, each burr’s pinion runs round the fixed ring gear, so the two helical burrs also spin and shave the tip to a cone.'
  : 'Inside: a crank, bevel gears and a carriage holding two helical burrs around the pencil tip. Grip jaws hold the pencil still; the shavings slide down the chute into the drawer.';

/* ---------- motion ---------- */
function tween(ms, step, done){ let t = 0;
  ui.animate(dt => { t += dt * 1000; const k = Math.min(1, t / ms); step(ease(k)); if (k >= 1){ done && done(); return false; } return true; }); }
let fallOn = false;
function kickFall(){                   // falling shavings drop down the drawer window until they land on the pile
  if (fallOn) return; fallOn = true;
  ui.animate(dt => {
    st.falling.forEach(c => { c.v = Math.min(c.tv, c.v + 27.5 * dt); c.a += 350 * dt; });
    const landed = st.falling.filter(c => c.v >= c.tv); st.falling = st.falling.filter(c => c.v < c.tv);
    st.pile += landed.length;
    if (!st.falling.length){ fallOn = false; return false; }
    return true;
  });
}
function turn(){
  if (st.turning || st.busy) return;
  const cutting = !st.out && st.s < 1;
  st.turning = true;
  const th0 = st.th, ph0 = st.phi, s0 = st.s, s1 = Math.min(1, st.s + .2);
  if (cutting) [140, 300, 460].forEach((ms, i) => setTimeout(() => {
    if (st.pile + st.falling.length >= 42) return;
    const [su, sv] = slot(st.pile + st.falling.length); st.falling.push({ u: su, v: -2, tv: sv, a: i * 90 }); kickFall();
  }, ms));
  tween(650, k => {
    st.th = th0 + k * 2 * Math.PI; st.phi = ph0 + k * 2 * Math.PI;
    if (cutting){ st.s = s0 + (s1 - s0) * k; st.peel = Math.sin(k * Math.PI); }
  }, () => {
    st.turning = false; st.peel = 0;
    if (cutting){ st.turns++; if (st.s >= 1) ui.flash('sharp! take the pencil (T)', 2000); }
    else ui.flash(st.out ? 'no pencil in the hole' : 'already sharp! take the pencil (T)');
    if (st.holding) turn();
  });
}
function take(){
  if (st.busy || st.turning) return;
  st.busy = true;
  const from = st.sh, goOut = !st.out;
  if (!goOut && st.s >= 1){ st.s = 0; st.turns = 0; }          // a fresh blunt pencil
  tween(550, k => { st.sh = goOut ? from + (OUT - from) * k : from * (1 - k); }, () => { st.out = goOut; st.busy = false; });
}
function empty(){
  if (st.busy) return;
  st.busy = true;
  tween(380, k => { st.drawer = DOUT * k; }, () => setTimeout(() => {
    st.pile = 0; st.falling = []; ui.render();
    tween(380, k => { st.drawer = DOUT * (1 - k); }, () => { st.busy = false; ui.flash('drawer empty'); });
  }, 350));
}
const hold = on => { st.holding = on; if (on) turn(); };
addEventListener('pointerup', () => { st.holding = false; });
addEventListener('pointercancel', () => { st.holding = false; });
addEventListener('keydown', e => {
  if (/input|textarea|button/i.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'enter'){ e.preventDefault(); if (!e.repeat) hold(true); }
  else if (k === 't') take();
  else if (k === 'e') empty();
});
addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') st.holding = false; });

ui = mountFigure({
  fig: '06', turn:'full', title: 'Pencil sharpener', hint: 'Hold the crank or TURN (space) · TAKE pencil (T) · EMPTY drawer (E)',
  size: [108, 82, 62], center: [W / 2, D / 2], palette: 'tomato', state: st,
  idea: 'The blade is set at a slant, so as the pencil turns it shaves the wood away in a cone and leaves a sharp point.',
  scene,
  readout: st => st.out ? (st.s >= 1 ? 'look at that point! sharp' : `out · ${Math.round(st.s * 100)}% sharp`)
    : `${st.s >= 1 ? 'sharp!' : st.s ? 'getting sharper' : 'blunt'} · ${Math.round(st.s * 100)}% · turns ${st.turns} · shavings ${st.pile}`,
  buttons: [
    { label: 'Turn the crank', onClick: () => { hold(true); setTimeout(() => { st.holding = false; }, 1500); } },
    { label: 'Take the pencil', onClick: () => take() },
    { label: 'Empty the drawer', onClick: () => empty() },
  ],
  acts: {
    crank: () => hold(true),
    pencil: () => take(),
    drawer: () => empty(),
  },
  params: (st, q) => {
    if (q.has('s')) st.s = Math.max(0, Math.min(1, +q.get('s')));
    if (q.get('out') === '1'){ st.out = true; st.sh = OUT; }
    if (q.has('drawer')) st.drawer = DOUT * Math.max(0, Math.min(1, +q.get('drawer')));
    if (q.has('pile')) st.pile = Math.max(0, Math.min(42, +q.get('pile')));
    if (q.has('th')) st.th = +q.get('th') * Math.PI / 180;
    if (q.has('phi')) st.phi = +q.get('phi') * Math.PI / 180;
    if (q.has('peel')) st.peel = +q.get('peel');
  },
});
xrMount(() => ui, sharpCaption);