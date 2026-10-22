/* Wind-up toy (port of the Colorfigures 2.0 kids figure to the free-camera 1.0 engine).
   A wind-up car on a floor track. The car's long +y side is see-through: the coiled spring in its toothed barrel,
   a middle gear and a big gear on the rear axle. The key's shaft is the spring's arbor; it sticks out of the +y side.
   Model coordinates of the car are the 2.0 ones (car origin at its rear-right-bottom corner); wuP() moves them onto
   the track (+12, +12) and along it as the car drives. */
const WU = { L:92, W:44, ZB:12, ZT:48, WR:10, WZ:14, AX:[20, 72], PER:22, MAX:6, KEY:18,
  BAR:[64, 29, 11], GB:[43.6, 22.5, 10], GC:[20, 14, 15] };           // barrel, middle gear, axle gear: (x, z, r)
const WU_TX1 = WU.L + WU.PER*WU.MAX + 14;                             // end of the track (car coords)
const WU_BX = WU_TX1 + 24, WU_BY = WU.W + WU.KEY + 24, WU_BH = 4;      // track board (absolute, from 0,0)
const PLATE = { l:'#ddd8ca', m:'#cbc5b6', d:'#b9b3a4' };
const TIRE  = { l:'#4d4943', m:'#33302c', d:'#211f1c' };
const SHAFT = { l:'#dfe3e4', m:'#b9bfc1', d:'#899193' };
const BRASS = { l:'#f6d684', m:'#e9b949', d:'#a9822c' };
const WU_LB = [.5, .866, 0];                                          // body light (turns with the viewer, like tone())

let wuCX = 12, wuBob = 0;
const wuP = ([x, y, z]) => [x + wuCX, y + 12, z + wuBob];
const wuPs = pts => pts.map(wuP);
// the body's shading: the long +y side lit, the nose in mid tone, the back corner in shade, a pale top
const wuShade = (n, m) => n[2] > .9 ? mix(m.l, '#ffffff', .25) : step3(dot(rotV(n), WU_LB), .7, .38, m);
const wuR2 = (u, v, deg) => { const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a); return [u*c - v*s, u*s + v*c]; };
// a flat shape on a y-plane: local (u right = +x, v down = -z) around (cx, cz), turned by deg (clockwise, as SVG rotate)
const wuOnY = (cx, cz, y, uv, deg = 0) => uv.map(([u, v]) => { const [a, b] = wuR2(u, v, deg); return wuP([cx + a, y, cz - b]); });
const wuCirc = (r, n = 28) => Array.from({ length:n }, (_, i) => { const a = i/n*2*Math.PI; return [r*Math.cos(a), r*Math.sin(a)]; });
const wuLight = hex => mix(hex, '#ffffff', .32);
const wuPoly = (pts, col, w = 1.1) => `<path d="${pd(pts)}" fill="${col}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;

/* ---------- gears and spring (flat, in the plane just behind the window) ---------- */
function wuGearUV(r, n, th = 2.2){ const pts = [];
  for (let i = 0; i < n; i++){ const a = i/n*2*Math.PI, s = Math.PI/n;
    [[a - s*.55, r - th/2], [a - s*.3, r + th/2], [a + s*.3, r + th/2], [a + s*.55, r - th/2]].forEach(([b, rr]) => pts.push([rr*Math.cos(b), rr*Math.sin(b)])); }
  return pts; }
/* ---------- body parts ---------- */
const wuRing = (x0, y0, x1, y1, r, z) => wuPs(on(PZ(z), rrUV(x0, y0, x1, y1, r)));
function wuBody(st, m, wa, keyA, k){
  const { L, W, ZB, ZT } = WU;
  const A = wuRing(0, 0, L, W, 9, ZB), B = wuRing(0, 0, L, W, 9, ZT);
  let s = loft(A, B, n => wuShade(n, m)) + fill(pd(B), wuShade([0,0,1], m)) + ink(pd(B), 1.2);
  // two cream headlights on the top, near the nose
  for (const y of [W*.25, W*.75]) s += shape(wuPs(on(PZ(ZT + .1), ellUV(L - 3, y, 2.2, 2.2, 16))), '#fff4d6', .8);
  s += hullInk([...A, ...B], 2.6);
  return s;
}
function wuCabin(st, m, k){
  const z0 = WU.ZT, z1 = WU.ZT + 14, A = wuRing(26, 6, 66, 38, 6, z0), B = wuRing(26, 6, 66, 38, 6, z1);
  let s = loft(A, B, n => wuShade(n, m)) + fill(pd(B), wuShade([0,0,1], m)) + ink(pd(B), 1.1);
  if (facing([0,1,0])){
    // the energy meter on the cabin's +y side (face-local u = x - 26, v = 62 - z)
    const y = 38.15, R = (u0, v0, u1, v1, r) => wuPs(on(PY(y), rrUV(26 + u0, z1 - v1, 26 + u1, z1 - v0, r)));
    s += shape(R(5, 1.2, 35, 13, 2), '#fff4d6', .9);
    const t = P(...wuP([46, y + .05, z1 - 5]));
    s += `<text transform="${txM(t, Dv(1,0,0), Dv(0,0,-1))}" font-size="3.2" fill="${INK}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" letter-spacing=".04em">ENERGY</text>`;
    s += shape(R(7, 6, 33, 12, 1.5), '#2b2523', .8);
    if (k > .005) s += fill(pd(wuPs(on(PY(y + .05), rrUV(26 + 7.6, z1 - 11.4, 26 + 7.6 + 24.8*k, z1 - 6.6, Math.min(1, 12*k))))), 'var(--accent)');
    let tk = ''; for (let i = 1; i <= 5; i++){ const u = 26 + 7 + i*26/6; tk += pd(wuPs([[u, y + .08, z1 - 6.4], [u, y + .08, z1 - 11.6]]), false); }
    s += `<path d="${tk}" fill="none" stroke="${INK}" stroke-width="1.1" opacity=".7"/>`;
  }
  s += hullInk([...A, ...B], 2.2);
  return s;
}
// a wheel: tyre along y from y0 to y1 at axle x; the hub sits on the outer face (side = +1 for the +y wheels)
function wuWheel(x, y0, y1, side, wa){
  const { WR, WZ } = WU, ring = y => wuPs(Array.from({ length:28 }, (_, i) => { const a = i/28*2*Math.PI; return [x + WR*Math.cos(a), y, WZ + WR*Math.sin(a)]; }));
  const A = ring(y0), B = ring(y1);
  let s = loft(A, B, n => toneI(n, TIRE));
  const yo = side > 0 ? y1 : y0, yi = side > 0 ? y0 : y1;
  if (facing([0, side, 0])){
    const cap = side > 0 ? B : A, yh = yo + side*.06;
    s += fill(pd(cap), '#8f8b87') + ink(pd(cap), 1);
    s += wuPoly(wuOnY(x, WZ, yh, wuCirc(5.2, 24)), '#ece6d6', 1);
    s += ink(pd(wuOnY(x, WZ, yh, [[-5, 0], [5, 0]], wa), false) + pd(wuOnY(x, WZ, yh, [[0, -5], [0, 5]], wa), false), 1.1);
    s += fill(pd(wuOnY(x, WZ, yh, wuCirc(1.4, 12))), '#e2473a');
  } else if (facing([0, -side, 0])){
    const cap = side > 0 ? A : B; s += fill(pd(cap), mix('#8f8b87', '#000000', .3)) + ink(pd(cap), 1);
  }
  return s + hullInk([...A, ...B], 1.6);
}
// the key: a steel shaft (the spring's arbor) out of the +y side, and a brass bow that turns
const WU_BOW = (() => { const segs = [[[0,-3.2],[4,-3.2],[6,-10],[12,-10]], [[12,-10],[18,-10],[18,10],[12,10]], [[12,10],[6,10],[4,3.2],[0,3.2]],
    [[0,3.2],[-4,3.2],[-6,10],[-12,10]], [[-12,10],[-18,10],[-18,-10],[-12,-10]], [[-12,-10],[-6,-10],[-4,-3.2],[0,-3.2]]], pts = [];
  for (const [a, b, c, d] of segs) for (let i = 0; i < 9; i++){ const t = i/9, mt = 1 - t;
    pts.push([0, 1].map(j => mt*mt*mt*a[j] + 3*mt*mt*t*b[j] + 3*mt*t*t*c[j] + t*t*t*d[j])); }
  return pts; })();
function wuKey(st, keyA){
  const [kx, kz] = WU.BAR, y0 = WU.W + WU.KEY - .8, y1 = WU.W + WU.KEY + .8;
  const shaft = rod(wuP([kx, WU.W - .5, kz]), wuP([kx, y0 + .2, kz]), 2.2, SHAFT, toneI, 1.1);
  const F = wuOnY(kx, kz, y1, WU_BOW, -keyA), Bk = wuOnY(kx, kz, y0, WU_BOW, -keyA), n = F.length;
  // outline winding in (x, z) decides which way each edge strip faces
  let ar = 0; for (let i = 0; i < n; i++){ const p = F[i], q = F[(i+1) % n]; ar += (p[0] - wuCX)*(q[2]) - (q[0] - wuCX)*(p[2]); }
  let bow = '';
  for (let i = 0; i < n; i++){ const j = (i+1) % n, e = sub(F[j], F[i]); let nr = norm([e[2], 0, -e[0]]); if (ar < 0) nr = nr.map(v => -v);
    if (vis(nr)) bow += face(pd([Bk[i], Bk[j], F[j], F[i]]), toneI(nr, BRASS)); }
  const capF = facing([0,1,0]), cap = capF ? F : Bk, yc = capF ? y1 + .05 : y0 - .05;
  if (capF || facing([0,-1,0])){
    bow += `<path d="${pd(cap)}" fill="${BRASS.m}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`;
    for (const u of [-11, 11]) bow += wuPoly(wuOnY(kx, kz, yc, wuCirc(3.4, 20).map(([a, b]) => [a + u, b]), -keyA), '#fbf7ea', .8);
    if (capF) bow += wuPoly(wuOnY(kx, kz, yc, wuCirc(3.4, 20), -keyA), wuLight(BRASS.m), .8);
  } else bow += ink(pd(F), 1.1);
  bow += hullInk([...F, ...Bk], 1.4);
  return act('key', facing([0,1,0]) ? shaft + bow : bow + shaft);
}
// the car's outline for its cast shadow
const wuShadowPts = () => [...wuRing(0, 0, WU.L, WU.W, 9, WU.ZB), ...wuRing(0, 0, WU.L, WU.W, 9, WU.ZT), ...wuRing(26, 6, 66, 38, 6, WU.ZT + 14),
  ...WU.AX.flatMap(x => [[x - 6, -5, 4], [x + 6, -5, 4], [x - 6, WU.W + 5, 4], [x + 6, WU.W + 5, 4]].map(wuP))];

/* ---------- the track ---------- */
function wuTrack(){
  const z = WU_BH + .05, L = WU.L, xa = x => x + 12, ya = y => y + 12;
  let s = board(0, 0, WU_BX, WU_BY, WU_BH, 6, PLATE);
  // dashed centre line
  let d = ''; for (let x = 0; x < WU_TX1 - 6; x += 11) d += pd([[xa(x), ya(WU.W/2), z], [xa(Math.min(x + 6, WU_TX1 - 6)), ya(WU.W/2), z]], false);
  s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".7"/>`;
  // start line at the nose, then a tick and a number for every wind's worth of track
  s += shape(on(PZ(z), rectUV(xa(L - 2), ya(-8), xa(L + 1), ya(WU.W + 8))), '#46413c', 1);
  let t = '', tx2 = '';
  const flip = Dv(1,0,0)[0] < 0, U = flip ? Dv(-1,0,0) : Dv(1,0,0), V = flip ? Dv(0,-1,0) : Dv(0,1,0);
  for (let k = 1; k <= WU.MAX; k++){ const x = xa(L + WU.PER*k);
    t += pd([[x, ya(WU.W + 2), z], [x, ya(WU.W + 14), z]], false);
    tx2 += `<text transform="${txM(P(x, ya(WU.W + 21), z), U, V)}" font-size="6" fill="${INK}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">${k}</text>`; }
  s += `<path d="${t}" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".7"/>` + tx2;
  return s;
}

/* ---------- scene ---------- */
function scene(st, m){
  const k = Math.min(1, st.e / WU.MAX), keyA = st.e*180, wa = st.pos / WU.WR * 180/Math.PI;
  let s = wuTrack();
  wuCX = 12 + st.pos; wuBob = 0;
  s += castShadow(wuShadowPts(), WU_BH, boardTop(0, 0, WU_BX, WU_BY, WU_BH, 6));
  wuBob = st.bob;
  const plus = [], minus = [];
  WU.AX.forEach(x => {
    plus.push({ at: wuP([x, WU.W + 2, WU.WZ]), svg: act('car', wuWheel(x, WU.W - 1, WU.W + 5, 1, wa)) });
    minus.push({ at: wuP([x, -2, WU.WZ]), svg: act('car', wuWheel(x, -5, 1, -1, wa)) });
  });
  plus.push({ at: wuP([WU.BAR[0], WU.W + WU.KEY, WU.BAR[1]]), svg: wuKey(st, keyA) });
  const front = facing([0,1,0]), xk = ease(st.xr || 0);
  let inner = wuBody(st, m, wa, keyA, k) + wuCabin(st, m, k);
  if (xk > 0) inner = xrGhostRings(inner, '', xk, wuRing(0, 0, WU.L, WU.W, 9, WU.ZB), wuRing(0, 0, WU.L, WU.W, 9, WU.ZT), m) + `<g opacity="${f(xk)}">${wuMech(st, wa, keyA, k, xk)}</g>`;   // inside parts over the ghost
  const body = act('car', inner);
  s += front ? byDepth(minus) + body + byDepth(plus) : byDepth(plus) + body + byDepth(minus);
  if (xk > .6) s += MECH_LABELS;
  return s;
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

/* ---------- see-through: the clockwork motor inside the car ----------
   How a real wind-up car works: the key turns an arbor across the car. A flat steel mainspring is hooked to the
   arbor at its inner end and to a pillar of the frame at its outer end, so turning the key coils it tight. A ratchet
   wheel fixed on the arbor slips past a click (pawl) pivoted on the great wheel while you wind; let go and the spring
   turns the arbor back, the ratchet catches the click and drives the great wheel. The great wheel turns a small
   pinion on the middle arbor, the middle wheel turns a pinion on the front axle (each step faster), and a fan on a
   last pinion beats the air so the run is slow and even. The rear axle just rolls in two brackets.
   Parts (each held by another; car coordinates, arbors along y):
   CHASSIS  floor pan in three pieces round the slot for the axle pinion . far frame plate (straps) . near frame plate
            (straps) . four bent feet with four screws into the pan . bearing bosses on both plates for the key arbor,
            the middle arbor, the fan arbor and the front axle . spring pillar . top pillar . four pillar rivet heads
   WINDING  key arbor (in pieces either side of every wheel and plate) . bushing in the body wall where the key comes out .
            ratchet wheel on the arbor . click on the great wheel . click pivot stud . click spring and its stud
   POWER    mainspring (blued steel strip) . its inner hook stud on the arbor . its outer end on the spring pillar
   TRAIN    great wheel . middle arbor . middle pinion . middle wheel . front-axle pinion . front axle . two axle collars
   GOVERNOR fan arbor . fan pinion . fan hub . two fan vanes
   REAR     rear axle . two bearing brackets on the floor pan . two collars */
const WM = { A:[64, 29], B:[78.5, 25.2], F:[WU.AX[1], WU.WZ], G:[83.5, 36.1], R:[WU.AX[0], WU.WZ], P1:[54.1, 19.1], P2:[72, 40],
  PL:[[6, 7], [37, 38]], FZ:12.8 };
const TIN = { l:'#d9dcd6', m:'#b5bab3', d:'#868c85' }, SPRM = { l:'#7aa3cf', m:'#4b77a8', d:'#2b4c75' };
const WM_LIVE = matOf('#ff9a3a');
// a flat outline in the x-z plane (car coords), extruded along y from y0 to y1
function wmPrismY(xz, y0, y1, m, w = .8, decor = null){
  const A = xz.map(([x, z]) => wuP([x, y0, z])), B = xz.map(([x, z]) => wuP([x, y1, z])), capB = vis([0,1,0]), cap = capB ? B : A;
  return loft(A, B, n => toneI(n, m)) + fill(pd(cap), toneI(capB ? [0,1,0] : [0,-1,0], m)) + ink(pd(cap), w*.8)
    + (decor ? decor(capB ? y1 + .06 : y0 - .06) : '') + hullInk([...A, ...B], w);
}
const wmRot = (cx, cz, uv, deg) => { const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a); return uv.map(([u, v]) => [cx + u*c - v*s, cz + u*s + v*c]); };
const wmCirc = (cx, cz, r, n = 22) => Array.from({ length:n }, (_, i) => { const a = i/n*2*Math.PI; return [cx + r*Math.cos(a), cz + r*Math.sin(a)]; });
const wmOnY = (xz, y) => xz.map(([x, z]) => wuP([x, y, z]));
// sawtooth ratchet: each tooth rises slowly and drops straight back to the root
function wmRatchetUV(ro, rr, n){ const pts = [];
  for (let i = 0; i < n; i++){ const a = i/n*2*Math.PI, b = (i + 1)/n*2*Math.PI; pts.push([rr*Math.cos(a), rr*Math.sin(a)], [ro*Math.cos(b - .02), ro*Math.sin(b - .02)]); }
  return pts; }
function wmStrap(a, b, w){ const d = norm([b[0] - a[0], b[1] - a[1], 0]), nx = -d[1]*w/2, nz = d[0]*w/2;
  return [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]]; }
let MECH_LABELS = '';
function wuMech(st, wa, keyA, k, xk){
  const parts = [], put = (b0, b1, svg) => parts.push({ box:[wuP(b0), wuP(b1)], svg });
  const running = !!st.running, winding = !running && !!st.busy && st.pos < .5;
  const [A, B, F, G, R, P1, P2] = [WM.A, WM.B, WM.F, WM.G, WM.R, WM.P1, WM.P2];
  // angles (degrees, in the x-z plane): wheel -> axle pinion r3 -> middle wheel r10, middle pinion r3 -> great wheel r12; fan pinion r2 on the middle wheel
  const aF = -wa, aB = -aF*3/10, aGr = -aB*3/12, aFan = -aB*10/2, aK = -keyA;
  const trainM = running ? WM_LIVE : BRASS;
  // an arbor along y at (x, z), drawn in pieces between the given y stops (each piece sorts on its own)
  const arbor = (x, z, r, ys, m = SHAFT) => { for (let i = 0; i < ys.length; i += 2) put([x - r, ys[i], z - r], [x + r, ys[i + 1], z + r], rod(wuP([x, ys[i], z]), wuP([x, ys[i + 1], z]), r, m, toneI, .7)); };
  const gear = (c, r, n, th, y0, y1, deg, m, decor) => put([c[0] - r - th, y0, c[1] - r - th], [c[0] + r + th, y1, c[1] + r + th],
    wmPrismY(wmRot(c[0], c[1], wuGearUV(r, n, th), deg), y0, y1, m, .7, decor));
  // ---- floor pan, with a slot for the axle pinion
  const FZ = WM.FZ;
  for (const b of [[3, 3, 66, 41], [78, 3, 89, 41], [66, 3, 78, 25.5], [66, 31.5, 78, 41]])
    put([b[0], b[1], 12], [b[2], b[3], FZ], box(...wuP([b[0], b[1], 12]), ...wuP([b[2], b[3], FZ]), TIN, toneI, .6));
  // ---- the two frame plates: straps between bearing bosses, bent feet screwed to the pan
  const feet = [[50, 13.6], [87, 13.6]];
  const straps = [[feet[0], P1], [P1, A], [A, P2], [P2, G], [G, B], [A, B], [B, F], [F, feet[1]], [feet[0], feet[1]]];
  const bosses = [[A, 3], [B, 2.6], [G, 2.4], [F, 2.8], [P1, 2.2], [P2, 2.2]];
  for (const [y0, y1] of WM.PL){
    const capB = vis([0,1,0]), yc = capB ? y1 + .05 : y0 - .05;
    const outl = [...straps.map(([a, b]) => wmStrap(a, b, 3)), ...bosses.map(([c, r]) => wmCirc(c[0], c[1], r, 20))];
    let pl = outl.map(xz => loft(wmOnY(xz, y0), wmOnY(xz, y1), n => toneI(n, TIN))).join('');
    pl += outl.map(xz => `<path d="${pd(wmOnY(xz, yc))}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`).join('');   // one outline round the whole plate
    pl += outl.map(xz => fill(pd(wmOnY(xz, yc)), toneI(capB ? [0,1,0] : [0,-1,0], TIN))).join('');
    for (const [c] of bosses) pl += fill(pd(wmOnY(wmCirc(c[0], c[1], 1.1, 12), yc + (capB ? .02 : -.02))), TIN.d);   // bearing holes
    pl += [P1, P2].map(c => shape(wmOnY(wmCirc(c[0], c[1], 1.5, 12), yc + (capB ? .04 : -.04)), METAL.l, .5)).join('');   // pillar rivet heads
    put([46, y0, FZ], [90, y1, 43], pl);
    // feet folded out onto the pan, each with a screw
    const out = y0 < 20 ? [y0 - 3, y0] : [y1, y1 + 3];
    for (const [fx] of feet){
      const scr = wuPs(on(PZ(FZ + .55), ellUV(fx, (out[0] + out[1])/2, .8, .8, 10)));
      put([fx - 2.2, out[0], FZ], [fx + 2.2, out[1], FZ + .5], box(...wuP([fx - 2.2, out[0], FZ]), ...wuP([fx + 2.2, out[1], FZ + .5]), TIN, toneI, .6) + shape(scr, METAL.l, .5));
    }
  }
  // ---- pillars between the plates (the spring pillar and the top pillar)
  arbor(P1[0], P1[1], 1.2, [7, 37], METAL); arbor(P2[0], P2[1], 1.2, [7, 37], METAL);
  // ---- key arbor: through both plates, out through a bushing in the wall to the key
  arbor(A[0], A[1], 1, [5, 6, 7, 22, 23.5, 25, 26.5, 30, 35, 37, 38, 42.4]);
  put([A[0] - 2.4, 42.4, A[1] - 2.4], [A[0] + 2.4, 44.2, A[1] + 2.4], rod(wuP([A[0], 42.4, A[1]]), wuP([A[0], 44.2, A[1]]), 2.4, BRASS, toneI, .7));
  // ---- mainspring: a blued strip coiled round the arbor, its outer end running out to the spring pillar
  { const y0 = 30, y1 = 35, rin = 1.6, rout = 9.6 - 4*k, turns = 3 + 4*k, aE = Math.atan2(P1[1] - A[1], P1[0] - A[0]), pts = [];
    const n = Math.ceil(turns*36);
    for (let i = 0; i <= n; i++){ const t = i/n, a = aE - (1 - t)*turns*2*Math.PI, r = rin + (rout - rin)*t; pts.push([A[0] + r*Math.cos(a), A[1] + r*Math.sin(a)]); }
    const dP = 14 - 1.25; pts.push([A[0] + dP*Math.cos(aE), A[1] + dP*Math.sin(aE)]);
    const quads = [];
    for (let i = 0; i < pts.length - 1; i++){
      const p = pts[i], q = pts[i + 1], a0 = wuP([p[0], y0, p[1]]), a1 = wuP([q[0], y0, q[1]]), b1 = wuP([q[0], y1, q[1]]), b0 = wuP([p[0], y1, p[1]]);
      let nr = norm([-(q[1] - p[1]), 0, q[0] - p[0]]); const mid = [(p[0] + q[0])/2 - A[0], 0, (p[1] + q[1])/2 - A[1]];
      if (dot(nr, mid) < 0) nr = nr.map(v => -v);
      const seen = vis(nr) ? nr : nr.map(v => -v), col = toneI(seen, winding || running ? WM_LIVE : SPRM);
      quads.push({ d: depthOf(avg([a0, a1, b1, b0])), svg: face(pd([a0, a1, b1, b0]), col) + ink(pd([a0, a1], false), .45) + ink(pd([b0, b1], false), .45) });
    }
    quads.sort((u, v) => u.d - v.d);
    // the arbor piece inside the coil and its hook stud go first, the strip wraps round them
    const inner = rod(wuP([A[0], y0, A[1]]), wuP([A[0], y1, A[1]]), 1, SHAFT, toneI, .7)
      + rod(wuP([A[0] + 1.3*Math.cos(aE - turns*2*Math.PI), 32.5, A[1] + 1.3*Math.sin(aE - turns*2*Math.PI)]), wuP([A[0] + 1.9*Math.cos(aE - turns*2*Math.PI), 32.5, A[1] + 1.9*Math.sin(aE - turns*2*Math.PI)]), .5, METAL, toneI, .4);
    put([A[0] - 14, y0, A[1] - 14], [A[0] + 10, y1, A[1] + 10], inner + quads.map(q => q.svg).join(''));
  }
  // ---- great wheel (rides loose on the arbor) with the click pivoted on its face; ratchet fixed to the arbor
  gear(A, 12, 36, 1.4, 22, 23.5, aGr, trainM, yc => {
    let s = fill(pd(wmOnY(wmCirc(A[0], A[1], 2.2, 16), yc)), mix(trainM.l, '#ffffff', .2));
    for (let i = 0; i < 4; i++){ const a = (aGr + 45 + i*90)*Math.PI/180; s += shape(wmOnY(wmCirc(A[0] + 6.8*Math.cos(a), A[1] + 6.8*Math.sin(a), 2.4, 16), yc), mix(trainM.d, '#000000', .25), .5); }
    return s; });
  put([A[0] - 5.5, 25, A[1] - 5.5], [A[0] + 5.5, 26.5, A[1] + 5.5], wmPrismY(wmRot(A[0], A[1], wmRatchetUV(5, 3.8, 12), aK), 25, 26.5, winding ? WM_LIVE : SHAFT, .6));
  { const ap = (aGr + 30)*Math.PI/180, pv = [A[0] + 8*Math.cos(ap), A[1] + 8*Math.sin(ap)], at = ap - .75, tip = [A[0] + 4.3*Math.cos(at), A[1] + 4.3*Math.sin(at)];
    const sp2 = [A[0] + 9*Math.cos(ap - .55), A[1] + 9*Math.sin(ap - .55)];
    put([pv[0] - .7, 23.5, pv[1] - .7], [pv[0] + .7, 27.2, pv[1] + .7], rod(wuP([pv[0], 23.5, pv[1]]), wuP([pv[0], 27.2, pv[1]]), .65, METAL, toneI, .5));
    put([sp2[0] - .5, 23.5, sp2[1] - .5], [sp2[0] + .5, 26.6, sp2[1] + .5], rod(wuP([sp2[0], 23.5, sp2[1]]), wuP([sp2[0], 26.6, sp2[1]]), .45, METAL, toneI, .4));
    const claw = wmStrap(pv, tip, 1.5);
    put([Math.min(pv[0], tip[0]) - 1, 25, Math.min(pv[1], tip[1]) - 1], [Math.max(pv[0], tip[0]) + 1, 26.5, Math.max(pv[1], tip[1]) + 1],
      wmPrismY(claw, 25, 26.5, METAL, .6, yc => { const mid = [(pv[0]*.55 + tip[0]*.45), (pv[1]*.55 + tip[1]*.45)];
        return `<path d="${pd(wmOnY([sp2, [(sp2[0] + mid[0])/2 + .5, (sp2[1] + mid[1])/2 + .5], mid], yc + (yc > 26 ? .3 : -.3)), false)}" fill="none" stroke="${INK}" stroke-width=".55"/>`; }));
  }
  // ---- middle arbor: pinion on the great wheel, wheel on the axle pinion and the fan pinion
  arbor(B[0], B[1], .8, [5.6, 6, 7, 21.5, 24, 28, 29.5, 37, 38, 38.6]);
  gear(B, 3, 8, 1.3, 21.5, 24, aB, trainM);
  gear(B, 10, 30, 1.4, 28, 29.5, aB, trainM, yc => {
    let s = fill(pd(wmOnY(wmCirc(B[0], B[1], 1.8, 14), yc)), mix(trainM.l, '#ffffff', .2));
    for (let i = 0; i < 3; i++){ const a = (aB + i*120)*Math.PI/180; s += shape(wmOnY(wmCirc(B[0] + 5.6*Math.cos(a), B[1] + 5.6*Math.sin(a), 2, 14), yc), mix(trainM.d, '#000000', .25), .5); }
    return s; });
  // ---- front axle: through both plates and the wall to the wheels, pinion on it, a collar inside each plate
  arbor(F[0], F[1], 1.1, [-1, 6, 7, 8, 9.2, 27.5, 30, 35.8, 37, 38, 39, 45], METAL);
  for (const [c0, c1] of [[8, 9.2], [35.8, 37]]) put([F[0] - 1.8, c0, F[1] - 1.8], [F[0] + 1.8, c1, F[1] + 1.8], rod(wuP([F[0], c0, F[1]]), wuP([F[0], c1, F[1]]), 1.8, BRASS, toneI, .5));
  gear(F, 3, 8, 1.3, 27.5, 30, aF, trainM);
  // ---- fan governor: pinion on the middle wheel, hub and two vanes
  arbor(G[0], G[1], .7, [5.6, 6, 7, 27.5, 30, 31, 35, 37, 38, 38.6]);
  gear(G, 2, 6, 1, 27.5, 30, aFan, trainM);
  put([G[0] - 1.5, 31, G[1] - 1.5], [G[0] + 1.5, 35, G[1] + 1.5], rod(wuP([G[0], 31, G[1]]), wuP([G[0], 35, G[1]]), 1.5, SHAFT, toneI, .6));
  for (const da of [0, 180]){ const a = (aFan + da)*Math.PI/180, u = [Math.cos(a), Math.sin(a)];
    const p0 = [G[0] + 1.4*u[0], G[1] + 1.4*u[1]], p1 = [G[0] + 6*u[0], G[1] + 6*u[1]];
    put([Math.min(p0[0], p1[0]) - .4, 31.4, Math.min(p0[1], p1[1]) - .4], [Math.max(p0[0], p1[0]) + .4, 34.6, Math.max(p0[1], p1[1]) + .4],
      wmPrismY(wmStrap(p0, p1, .5), 31.4, 34.6, running ? WM_LIVE : TIN, .6)); }
  // ---- rear axle: rolls in two brackets on the pan, a collar against each
  arbor(R[0], R[1], 1.1, [-1, 3, 4.6, 5.2, 6.4, 37.6, 38.8, 39.4, 41, 45], METAL);
  for (const [b0, b1] of [[3, 4.6], [39.4, 41]]){
    put([R[0] - 2.2, b0, FZ], [R[0] + 2.2, b1, R[1] + 2.4], wmPrismY([[R[0] - 2.2, FZ], [R[0] + 2.2, FZ], [R[0] + 2.2, R[1]], [R[0] + 1.6, R[1] + 2], [R[0], R[1] + 2.4], [R[0] - 1.6, R[1] + 2], [R[0] - 2.2, R[1]]], b0, b1, TIN, .6,
      yc => fill(pd(wmOnY(wmCirc(R[0], R[1], 1.2, 12), yc)), TIN.d)));
  }
  for (const [c0, c1] of [[5.2, 6.4], [37.6, 38.8]]) put([R[0] - 1.8, c0, R[1] - 1.8], [R[0] + 1.8, c1, R[1] + 1.8], rod(wuP([R[0], c0, R[1]]), wuP([R[0], c1, R[1]]), 1.8, BRASS, toneI, .5));
  const s = byDepth(parts);
  const L = (x, y, z) => wuP([x, y, z]);
  MECH_LABELS = xk <= .6 ? '' : xrCallouts([
    { at: L(A[0] - 6, 35, A[1] + 5), text: 'MAINSPRING', on: st.e > .2 },
    { at: L(A[0], 42.4, A[1] + 2.4), text: 'KEY ARBOR', on: winding },
    { at: L(A[0] + 3, 26.5, A[1] + 4), text: 'RATCHET AND CLICK', on: winding },
    { at: L(A[0] - 9, 23.5, A[1] + 8), text: 'GREAT WHEEL', on: running },
    { at: L(B[0] + 7, 29.5, B[1] - 6), text: 'MIDDLE GEAR', on: running },
    { at: L(F[0], 30, F[1] - 3), text: 'AXLE PINION', on: running },
    { at: L(G[0], 34.6, G[1] + 5.5), text: 'FAN GOVERNOR', on: running },
    { at: L(48, 38, 14.4), text: 'FRAME PLATE', on: false },
    { at: L(P1[0], 37, P1[1] - 1.2), text: 'SPRING PILLAR', on: false },
    { at: L(R[0], 22, R[1] + 1.1), text: 'REAR AXLE', on: false } ],
    [wuCX - 12, wuCX + WU.L + 12, 0, WU.W + WU.KEY + 24, 0, WU.ZT + 20]);
  return s;
}
const wuCaption = st => st.running ? 'Driving: the mainspring unwinds and turns the arbor; the ratchet catches the click and drags the great wheel round. It turns the middle pinion, the middle wheel turns the pinion on the front axle, and the wheels roll. The fan on its own pinion beats the air so the run stays slow and even.'
  : st.busy && st.pos < .5 ? 'Winding: the key turns the arbor and coils the mainspring tighter round it. The ratchet slips past the click, so the gears and wheels stay still.'
  : st.e > .2 ? 'Wound: the coiled spring pushes the arbor back, but the ratchet is caught by the click on the great wheel. Let go and it drives the gear train.'
  : 'Inside: two tin frame plates on the floor pan hold the key arbor with the mainspring, ratchet and click, the great wheel, a middle gear, the pinion on the front axle and a fan governor. The spring’s outer end hooks on a pillar.';


/* ---------- behaviour ---------- */
let wuTw = 0;
function wuTween(ui, ms, step, done, ez = ease){
  const id = ++wuTw; let t = 0;
  ui.animate(dt => { if (id !== wuTw) return false; t += dt*1000; const k = Math.min(1, t/ms); step(ez(k), k);
    if (k >= 1){ if (done) done(); return false; } return true; });
}
function wind(st, ui){
  if (st.running) return ui.flash('the car is running — wait for it to stop');
  if (st.busy) return;
  if (st.pos > .5){                                        // roll back to the start first
    st.busy = true; st.msg = 'back to the start…'; const p0 = st.pos;
    return wuTween(ui, 500, kk => { st.pos = p0*(1 - kk); }, () => { st.busy = false; st.pos = 0; wind(st, ui); });
  }
  if (st.e >= WU.MAX - .01) return ui.flash('fully wound — let go!');
  st.busy = true; const e0 = st.e;
  wuTween(ui, 320, kk => { st.e = e0 + kk; }, () => { st.busy = false; st.e = Math.round(st.e);
    st.msg = `wound ${st.e} of ${WU.MAX} · ${st.e === WU.MAX ? 'tight! ' : ''}let go to drive`; });
}
function go(st, ui){
  if (st.running) return;
  if (st.busy) return ui.flash('wait a moment…');
  if (st.e < .5) return ui.flash('wind the key first');
  st.running = true; const n0 = st.e, ms = 700 + 650*n0, dist = WU.PER*n0;
  st.msg = 'whirr… the spring is letting go';
  wuTween(ui, ms, (p) => { st.e = n0*(1 - p); st.pos = dist*p; st.bob = .9*Math.abs(Math.sin(st.pos*.45))*(1 - p); },
    () => { st.running = false; st.e = 0; st.bob = 0;
      st.msg = `stopped after ${Math.round(st.pos)} cm · ${n0} wind${n0 > 1 ? 's' : ''} · wind again for another go`; ui.flash(`stopped after ${Math.round(st.pos)} cm`); },
    kk => 1 - (1 - kk)*(1 - kk));                          // fast at first, slowing as the spring runs out
}
function reset(st, ui){
  if (st.running || st.busy) return ui.flash('wait for the car to stop');
  st.e = 0; st.pos = 0; st.bob = 0; st.msg = 'ready · click the key to wind';
}

const wuUI = mountFigure({
  fig:'07', turn:'full', title:'Wind-up toy', hint:'click the key to wind · click the car to let go',
  idea:'Winding the key stores energy in a coiled spring; as the spring unwinds it turns the gears and the wheels.',
  size:[WU_BX, WU_BY, 64], palette:'mint',
  state:{ e:0, pos:0, bob:0, busy:false, running:false, msg:'ready · click the key to wind' },
  scene,
  readout: st => st.msg,
  buttons:[
    { label:'Wind the key', onClick:(st, ui) => wind(st, ui) },
    { label:'Let go', onClick:(st, ui) => go(st, ui) },
    { label:'Reset', onClick:(st, ui) => reset(st, ui) },
  ],
  acts:{ key:(st, el, ui) => wind(st, ui), car:(st, el, ui) => go(st, ui) },
  params:(st, q) => {
    if (q.has('e')) st.e = Math.max(0, Math.min(WU.MAX, +q.get('e')));
    if (q.has('pos')) st.pos = Math.max(0, Math.min(WU.PER*WU.MAX, +q.get('pos')));
  },
});
addEventListener('keydown', e => {
  if (/input|textarea|button/i.test(e.target.tagName)) return;
  const k = e.key.toLowerCase(), st = wuUI.st;
  if (k === 'w') wind(st, wuUI); else if (k === ' ' || k === 'enter') go(st, wuUI); else if (k === 'r') reset(st, wuUI); else return;
  e.preventDefault(); wuUI.render();
});
xrMount(() => wuUI, wuCaption);