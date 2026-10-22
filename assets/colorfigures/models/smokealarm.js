/* Smoke alarm (photoelectric), cover cut away, on a wooden display stand — port of the Colorfigures 2.0 kids figure
   to the 1.0 engine with the free camera. Burnt toast makes smoke, the desk fan clears it, buttons on the stand:
   PUFF SMOKE · CLEAR AIR · TEST. Coordinates are the 2.0 ones with y shifted by SM_Y (so the toast sits inside the
   framing box): x = toward viewer-right, y = toward viewer-left, z = up. */
const SM_Y = 55;
const smRad = a => a * Math.PI / 180, pol = (c, r, a) => [c[0] + r * Math.cos(smRad(a)), c[1] + r * Math.sin(smRad(a))];
const O = [70, 70 + SM_Y], RS = 62, ZB = 24, ZP = 42;                         // puck centre, radius, stand top, board top
const CH = pol(O, 10, 225), CR = 27, ZF = ZP + 3, ZBEAM = ZF + 3;            // chamber centre, radius, floor, beam height
const LED = pol(CH, 23, 150), TRAP = pol(CH, 24, -30), SEN = pol(CH, 21, 60);
const BUZ = pol(O, 40, 120), RED = pol(O, 50, 5), TESTB = pol(O, 44, 55), CHIP = [78, 102 + SM_Y];
const TOAST = [72, -36 + SM_Y], FAN = [104, 174 + SM_Y], FANY = FAN[1] - 2, FANZ = 37;   // the fan faces the alarm (-y) and blows the smoke away
const ACC = '#ff9a2e', ACC_HI = '#ffc77a', SMINK = '#231e16';
const WOODC = '#c98d55', CHDARK = '#2b2523';

/* ---------- shading for a single colour (the 2.0 "prod" look: lit front, darker shade side, lighter top) ---------- */
const smMats = new Map();
const smMat = hex => { if (!smMats.has(hex)) smMats.set(hex, { l: hex, m: mix(hex, '#1a1612', .2), d: mix(hex, '#1a1612', .44) }); return smMats.get(hex); };
const shK = (n, hex) => n[2] > .9 ? mix(hex, '#ffffff', .32) : tone(n, smMat(hex));
const lidK = (side, lid) => (n) => n[2] > .9 ? mix(lid, '#ffffff', .12) : tone(n, smMat(side));
const cylK = (x, y, z0, z1, r, hex, w = 1.1, lid = null, n = 24) => cyl(x, y, z0, z1, r, hex, lid ? lidK(hex, lid) : shK, w, n);
const boxK = (x0, y0, z0, x1, y1, z1, hex, w = .8) => box(x0, y0, z0, x1, y1, z1, hex, shK, w);
const arc3 = (c, r, a0, a1, z, n = 18) => Array.from({ length: n + 1 }, (_, i) => [...pol(c, r, a0 + (a1 - a0) * i / n), z]);
// upright prism over a convex 2D outline: the side faces that face the viewer, then the top
function prism(base, z0, z1, hex, w = .7){
  const c = base.reduce((s, p) => [s[0] + p[0] / base.length, s[1] + p[1] / base.length], [0, 0]); let s = '';
  for (let i = 0; i < base.length; i++){
    const a = base[i], b = base[(i + 1) % base.length]; let n = [b[1] - a[1], -(b[0] - a[0]), 0];
    if (n[0] * ((a[0] + b[0]) / 2 - c[0]) + n[1] * ((a[1] + b[1]) / 2 - c[1]) < 0) n = [-n[0], -n[1], 0];
    n = norm(n); if (vis(n)) s += shape([[...a, z0], [...b, z0], [...b, z1], [...a, z1]], shK(n, hex), w);
  }
  return s + shape(base.map(p => [...p, z1]), shK([0, 0, 1], hex), w);
}
// a thin vertical wall (chamber vane) from p to q, t thick
function vane(p, q, z0, z1, hex, t = 1.8){
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), nx = dy / l * t / 2, ny = -dx / l * t / 2;
  return prism([[p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny], [q[0] - nx, q[1] - ny], [p[0] - nx, p[1] - ny]], z0, z1, hex);
}
/* a curved wall (r0 inside, r1 outside) from angle a0 to a1, cut into segments that are sorted on their own:
   whichever of its inner/outer surface faces the viewer, the top, and the end caps. Returns byDepth parts. */
function arcWall(c, r0, r1, a0, a1, z0, z1, col, segDeg = 15, w = 1){
  const parts = [], nSeg = Math.max(1, Math.round((a1 - a0) / segDeg)), sub = 3;
  for (let k = 0; k < nSeg; k++){
    const s0 = a0 + (a1 - a0) * k / nSeg, s1 = a0 + (a1 - a0) * (k + 1) / nSeg; let s = '', inkD = '';
    for (let j = 0; j < sub; j++){
      const b0 = s0 + (s1 - s0) * j / sub, b1 = s0 + (s1 - s0) * (j + 1) / sub, bm = smRad((b0 + b1) / 2), n = [Math.cos(bm), Math.sin(bm), 0];
      if (vis(n)) s += face(pd([[...pol(c, r1, b0), z0], [...pol(c, r1, b1), z0], [...pol(c, r1, b1), z1], [...pol(c, r1, b0), z1]]), col.out(n));
      else if (vis(n.map(v => -v))){ s += face(pd([[...pol(c, r0, b0), z0], [...pol(c, r0, b1), z0], [...pol(c, r0, b1), z1], [...pol(c, r0, b0), z1]]), col.inn);
        inkD += pd([[...pol(c, r0, b0), z0], [...pol(c, r0, b1), z0]], false); }
    }
    const top = [...arc3(c, r1, s0, s1, z1, sub), ...arc3(c, r0, s1, s0, z1, sub)];
    s += face(pd(top), col.top);
    inkD += pd(arc3(c, r1, s0, s1, z1, sub), false) + pd(arc3(c, r0, s0, s1, z1, sub), false);
    // end caps where the wall stops
    for (const [ae, sg] of [[a0, -1], [a1, 1]]){
      if (Math.abs(ae - s0) > 1e-6 && Math.abs(ae - s1) > 1e-6) continue;
      const t = smRad(ae), n = [-Math.sin(t) * sg, Math.cos(t) * sg, 0];
      const q = [[...pol(c, r0, ae), z0], [...pol(c, r1, ae), z0], [...pol(c, r1, ae), z1], [...pol(c, r0, ae), z1]];
      if (vis(n)) s += shape(q, col.end, w * .8);
      else inkD += pd([q[2], q[3]], false);
    }
    s += `<path d="${inkD}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    parts.push({ at: [...pol(c, (r0 + r1) / 2, (s0 + s1) / 2), (z0 + z1) / 2], svg: s });
  }
  return parts;
}

/* ---------- the parts ---------- */
const BTNS = [['puff', 'PUFF SMOKE', 10, 40, '#d9dddd'], ['clear', 'CLEAR AIR', 54, 40, '#d9dddd'], ['test', 'TEST', 98, 32, '#fff4d6']];
const smNow = () => performance.now();
const flashOn = (st, k) => st.fl[k] && smNow() - st.fl[k] < 260;
function stand(st){
  let s = boxK(0, SM_Y, 0, 140, SM_Y + 140, ZB, WOODC, 1.4);
  // plaque on the +y side
  if (facing([0, 1, 0])){
    const yy = SM_Y + 140;
    s += shape(on(PY(yy + .15), rrUV(94, ZB - 18, 136, ZB - 6, 2)), '#e7c96a', 1);
    s += txY(115, yy + .25, ZB - 14.2, 'SMOKE ALARM', 4.6, SMINK, 800);
  }
  // buttons + four grain slits on the +x side
  if (facing([1, 0, 0])){
    const xx = 140;
    let sl = ''; for (const v of [3, 9, 15, 21]) sl += pd([[xx + .1, SM_Y + 138, ZB - v], [xx + .1, SM_Y + 132, ZB - v]], false);
    s += `<path d="${sl}" fill="none" stroke="${INK}" stroke-width="1.1" opacity=".6" stroke-linecap="round"/>`;
    for (const [a, t, u, wd, col] of BTNS){
      const y1 = SM_Y + 140 - u, y0 = y1 - wd;
      s += act(a, shape(on(PX(xx + .2), rrUV(y0, ZB - 18, y1, ZB - 7, 3)), flashOn(st, a) ? ACC : col, 1.1)
        + tx(xx + .3, (y0 + y1) / 2, ZB - 14.4, t, 5, SMINK, 800));
    }
  }
  return s;
}
function toast(){
  const [x, y] = TOAST;
  return act('toast', cylK(x, y, 0, 2, 17, '#f4f1e8', 1.1, null, 32) + boxK(x - 11, y - 10, 2, x + 11, y + 10, 6, '#5a3a22', 1)
    + shape([[x - 6, y - 5, 6.05], [x + 2, y - 6, 6.05], [x + 4, y + 1, 6.05], [x - 4, y + 3, 6.05]], '#231a14', .7));
}
function fan(st){
  const [x, y] = FAN, pl = PY(FANY), FRONT = facing([0, -1, 0]);   // the fan's front (guard, blades) faces -y
  let s = cylK(x, y, 0, 3, 9, '#f2c230', 1.2) + cylK(x, y, 3, 33, 1.6, '#d9dddd', .9, null, 12);
  const head = rod([x, y + 9, FANZ], [x, FANY + 4, FANZ], 4.5, '#f2c230', shK, 1.1);
  // a real cage: back guard and front guard 8 apart (a real cage is about a third of its diameter deep), a rim band joining them, the blades turning in the middle.
  // Drawn far to near by which side of the fan faces the viewer (the motor head sits behind the back guard)
  const loc = (u, v) => [x + u, FANY, FANZ + v];
  const ca = Math.cos(smRad(st.fanA)), sa = Math.sin(smRad(st.fanA));
  const RIMM = matOf('#f2c230'), ringAt = (yy, r, n = 40) => on(PY(yy), ellUV(x, FANZ, r, r, n));
  const YB = FANY + 4, YF = FANY - 4, A = ringAt(YB, 17), B = ringAt(YF, 17);
  const guard = (yy, front) => { let g = '';
    for (const r of [5, 10, 15]) g += `<path d="${pd(ringAt(yy, r, 32))}" fill="none" stroke="${INK}" stroke-width=".5" opacity=".55"/>`;
    for (let k = 0; k < 8; k++){ const t = k * Math.PI / 4; g += `<path d="${pd([[x + 3.4*Math.cos(t), yy, FANZ + 3.4*Math.sin(t)], [x + 16.8*Math.cos(t), yy, FANZ + 16.8*Math.sin(t)]], false)}" fill="none" stroke="${INK}" stroke-width=".45" opacity=".45"/>`; }
    if (front) g += shape(ringAt(yy, 3.2, 16), '#f2c230', .9);
    return g; };
  let blades = fill(pd(ringAt(FANY, 16.5)), '#fff4d6', 'fill-opacity=".3"');
  for (const a of [0, 120, 240]){
    const c2 = Math.cos(smRad(a)), s2 = Math.sin(smRad(a));
    const pts = ellUV(0, 8.5, 4.6, 8, 20).map(([u, v]) => { const u1 = u * c2 - v * s2, v1 = u * s2 + v * c2; return loc(u1 * ca - v1 * sa, u1 * sa + v1 * ca); });
    blades += shape(pts, '#7fc3e0', .9);
  }
  blades += rod([x, YB, FANZ], [x, YF, FANZ], 2.4, '#f2c230', shK, .9);   // hub on its shaft
  const rimFar = loft(A, B, n => toneI(n, RIMM), true), rimNear = loft(A, B, n => toneI(n, RIMM)) + hullInk([...A, ...B], 1.2);
  const order = FRONT ? [head, guard(YB, false), rimFar, blades, rimNear, guard(YF, true)]
                      : [guard(YF, true), rimFar, blades, rimNear, guard(YB, false), head];
  s += order.join('');
  return act('fan', s);
}
// the alarm body: shell, board, traces, then everything on the board sorted for the camera

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

// the closed alarm: a domed cover over the works, with a vent ring, the test button and the red light through it
function closedCover(st, m, view){
  const cm = { l: mix(m.l, '#ffffff', .4), m: mix(m.l, '#ffffff', .15), d: m.m }, zr = ZP + 14;
  const A = on(PZ(ZP), ellUV(O[0], O[1], RS - 1, RS - 1, 64)), B = on(PZ(zr - 4), ellUV(O[0], O[1], RS - 4, RS - 4, 64)), C = on(PZ(zr), ellUV(O[0], O[1], RS - 16, RS - 16, 64));
  let c = loft(A, B, n => toneI(n, cm)) + loft(B, C, n => toneI(n, cm)) + fill(pd(C), cm.l) + hullInk([...A, ...B, ...C], 1.8) + ink(pd(C), 1);
  let vents = ''; for (let i = 0; i < 24; i++){ const a = i*15; vents += pd([[...pol(O, RS - 8, a), zr - 2.2], [...pol(O, RS - 8, a + 8), zr - 2.2]], false); }
  c += `<path d="${vents}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>`;
  c += act('test', cylK(O[0], O[1], zr, zr + 2.5, 9, view.testing ? ACC_HI : '#fbf7ea', 1.1, null, 28));
  c += cylK(...pol(O, RS - 20, 20), zr - 1, zr + .6, 2.4, view.redOn ? '#ff3b2f' : '#6e231d', .8, null, 14);
  return c;
}
// the alarm: closed in the normal view; in see-through the case fades and the real works are drawn over it
function alarm(st, m, view){
  const k = ease(st.xr || 0), body = cyl(O[0], O[1], ZB, ZP, RS, m, n => n[2] > .9 ? mix(m.l, '#ffffff', .35) : tone(n, m), 2.2, 64);
  if (k <= 0) return body + closedCover(st, m, view);
  const zr = ZP + 14;
  return `<g opacity="${f(1 - .78*k)}">${body + closedCover(st, m, view)}</g>` + `<g opacity="${f(k)}">${alarmWorks(st, m, view)}</g>`
    + (vis([0, 0, 1]) ? `<g opacity="${f(k)}">` + act('test', cylK(O[0], O[1], zr - (view.testing ? .8 : 0), zr + 2.5 - (view.testing ? .8 : 0), 9, view.testing ? ACC_HI : '#fbf7ea', 1.1, null, 28)) + `</g>` : '');
}
/* ---------- see-through: how a real photoelectric smoke alarm is built ----------
   An infrared LED in a black labyrinth chamber pulses every few seconds. Its beam crosses the chamber into a light trap,
   and a photodiode sits off to the side behind a baffle, so in clean air it sees nothing. Smoke particles that drift in
   through the cover's vents and the insect mesh scatter some of the light round the baffle onto the photodiode. The ASIC
   on the board measures that, and when it stays high it drives the piezo horn and flashes the LED (seen through a light
   pipe in the cover). The test button's arm presses a switch that makes the ASIC run the same alarm.
   Parts (each held by another; alarm coordinates, z up, the alarm lying face up on its stand):
   CASE     mounting base (twist-lock plate, two keyhole slots, two screws, four lock tabs) . rear housing (ghost) .
            four PCB standoffs . four PCB screws . cover with its vent ring (ghost) . test button in the cover
   BOARD    D-shaped PCB . copper traces . solder pads . ASIC (SOIC body, 16 legs, pin-1 dot) . electrolytic capacitor .
            three resistors . transistor . diode
   CHAMBER  chamber base . insect mesh (far half, near half) . chamber cap . eight labyrinth baffles (two vanes each) .
            IR LED in its holder, its lens . photodiode in its holder, its lens . shield baffle . light trap . the beam
   ALARM    piezo horn housing . brass disc . ceramic . three leads to the board . LED on the board . light pipe to the cover
   TEST     test switch (body, actuator) . button stem . arm over the chamber . leg down to the switch
   POWER    battery tray (floor, four walls) . 9V battery . its two terminals . snap clip . red and black leads to the board */
const SMB = { u:[Math.cos(smRad(-70)), Math.sin(smRad(-70))], CHORD:24.5, PCB:[40.8, ZP], MR:20, MZ:[ZP + 1.2, ZP + 8], CAP:[ZP + 8, ZP + 9] };
SMB.t = [-SMB.u[1], SMB.u[0]];
const smQ = (a, b) => [O[0] + a*SMB.u[0] + b*SMB.t[0], O[1] + a*SMB.u[1] + b*SMB.t[1]];
const smRect = (a0, b0, a1, b1) => [smQ(a0, b0), smQ(a1, b0), smQ(a1, b1), smQ(a0, b1)];
const TSW = pol(O, 16, 45), LEDP = pol(O, RS - 20, 20), CAPE = [O[0] - 36, O[1] + 10];
const SM_LIVE = '#ff9a3a', SM_WIRE = '#ffb347';
const smBoxOf = (pts, z0, z1) => [[Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), z0], [Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1])), z1]];
const smWire = (pts, col, w = .55) => { const d = pd(pts, false); return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`; };
// a wire in short pieces, each sortable on its own
const smWireParts = (pts, col, w = .55) => { const out = [];
  for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 6));
    for (let j = 0; j < n; j++){ const p = a.map((v, k) => v + (b[k] - v)*j/n), q = a.map((v, k) => v + (b[k] - v)*(j + 1)/n);
      out.push({ box: [[0,1,2].map(k => Math.min(p[k], q[k]) - .6), [0,1,2].map(k => Math.max(p[k], q[k]) + .6)], svg: smWire([p, q], col, w) }); } }
  const [X0, Y0] = P(...pts[0]), [X1, Y1] = P(...pts[pts.length - 1]);
  out[0].svg += `<circle cx="${f(X0)}" cy="${f(Y0)}" r="1.2" fill="${INK}"/>`; out[out.length - 1].svg += `<circle cx="${f(X1)}" cy="${f(Y1)}" r="1.2" fill="${INK}"/>`;
  return out; };
let SM_XR_LABELS = [];
function alarmWorks(st, m, view){
  let parts = [];
  const put = (b, svg) => parts.push({ box: b, svg }), hot = view.beep || view.sees, beep = view.beep, layers = [];
  const flush = () => { layers.push(byDepth(parts)); parts = []; };
  const [PZ0, PZ1] = SMB.PCB;
  // ---- mounting base on the housing floor: twist-lock plate, keyhole slots with screws, lock tabs
  { let s = cylK(O[0], O[1], ZB + .2, ZB + 2.4, 50, '#e8e4da', 1, null, 56);
    for (const a of [90, 270]){ const c = pol(O, 30, a);
      s += shape(on(PZ(ZB + 2.45), rrUV(c[0] - 2, c[1] - 5, c[0] + 2, c[1] + 5, 2)), '#5b5550', .6) + cylK(c[0], c[1] - 2.5, ZB + 2.4, ZB + 3.4, 2.2, '#d9dddd', .6, null, 14); }
    put([[O[0] - 50, O[1] - 50, ZB + .2], [O[0] + 50, O[1] + 50, ZB + 3.4]], s);
    for (const a of [10, 100, 190, 280]){ const c = pol(O, 52.5, a), d = pol(O, 50, a + 12), e = pol(O, 52.5, a + 12), g = pol(O, 50, a);
      put(smBoxOf([c, d, e, g], ZB + .2, ZB + 2), prism([g, c, e, d], ZB + .2, ZB + 2, '#d8d2c2', .6)); } }
  // ---- PCB standoffs (from the housing floor) and the PCB itself, a D cut flat where the battery tray sits
  const posts = [80, 170, 240, 350].map(a => pol(O, 46, a));
  for (const p of posts) put([[p[0] - 2.2, p[1] - 2.2, ZB + 2.4], [p[0] + 2.2, p[1] + 2.2, PZ0]], cylK(p[0], p[1], ZB + 2.4, PZ0, 2.2, '#e8e4da', .8, null, 14));
  flush();                                                     // everything under the board
  const trayNear = vis([SMB.u[0], SMB.u[1], 0]);               // the battery tray stands beyond the board's flat edge: behind it unless we look from the tray's side
  let traySvg = '';
  { const D = []; const a0 = Math.acos(SMB.CHORD / 54) * 180/Math.PI, base = -70;
    for (let i = 0; i <= 48; i++) D.push(pol(O, 54, base + a0 + (360 - 2*a0)*i/48));
    let s = prism(D, PZ0, PZ1, '#2f8a4a', 1.1);
    const tr = (pts, on2) => `<path d="${pd(pts.map(([x, y]) => [x, y, PZ1 + .05]), false)}" fill="none" stroke="${on2 ? SM_LIVE : '#d8c27a'}" stroke-width="${on2 ? 2 : 1.3}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
    const pin = (i, side) => [side < 0 ? CHIP[0] - 4.6 : CHIP[0] + 4.6, CHIP[1] - 5.25 + i*1.5];
    s += tr([pin(0, -1), [CHIP[0] - 12, CHIP[1] - 5.25], pol(CH, 16, 150)], hot)              // chip to the IR LED's legs
      + tr([pin(2, -1), [CHIP[0] - 9, CHIP[1] - 2.25], pol(CH, 16, 60)], view.sees)            // photodiode to the chip
      + tr([pin(7, -1), [62, CHIP[1] + 6], pol(BUZ, 15.5, -20)], beep)                          // chip to the horn
      + tr([pin(5, -1), [66, CHIP[1] + 2.25], pol(BUZ, 15.5, -50)], beep)
      + tr([pin(0, 1), [TSW[0] + 3, CHIP[1] - 5.25], [TSW[0] + 3, TSW[1] + 3]], view.testing)    // test switch
      + tr([pin(3, 1), [96, CHIP[1] - .75], [LEDP[0] - 2, LEDP[1] + 3], LEDP], view.redOn)      // the LED
      + tr([pin(7, 1), [92, CHIP[1] + 5.25], smQ(22, 21), smQ(22, 23.5)], hot)                   // battery +
      + tr([pin(6, 1), [CAPE[0] + 2, CHIP[1] + 4], [CAPE[0] + 3, CAPE[1]]], false)
      + tr([[CAPE[0], CAPE[1] - 3], [CAPE[0] + 4, O[1] - 6], smQ(20, 23.5)], false);              // ground to the battery -
    for (const p of [pol(BUZ, 15.5, -20), pol(BUZ, 15.5, -50), pol(BUZ, 15.5, -80), smQ(22, 23.5), smQ(20, 23.5), ...posts])
      s += shape(on(PZ(PZ1 + .08), ellUV(p[0], p[1], 1.5, 1.5, 12)), '#e9e3d0', .5);            // solder pads and the screws on the standoffs
    s += tx(O[0] - 20, O[1] + 38, PZ1 + .1, 'SA-9V', 3.4, '#e9e3d0', 800);
    layers.push('__TRAY_BEFORE__', s); }
  // ---- ASIC, capacitor, resistors, transistor, diode
  { let s = boxK(CHIP[0] - 4, CHIP[1] - 6, PZ1, CHIP[0] + 4, CHIP[1] + 6, PZ1 + 2, hot ? '#4a3a2a' : '#26262a', .8);
    s += shape(on(PZ(PZ1 + 2.05), ellUV(CHIP[0] - 2.6, CHIP[1] - 4.4, .6, .6, 8)), '#8f8b86', 0);
    if (hot) s += shape(on(PZ(PZ1 + 2.05), rrUV(CHIP[0] - 2.4, CHIP[1] - 3, CHIP[0] + 2.4, CHIP[1] + 3, 1)), SM_LIVE, 0);
    const legs = []; for (let i = 0; i < 8; i++) for (const sd of [-1, 1]){ const y = CHIP[1] - 5.25 + i*1.5, x0 = sd < 0 ? CHIP[0] - 5.2 : CHIP[0] + 4, x1 = x0 + 1.2;
      legs.push({ box: [[x0, y - .35, PZ1], [x1, y + .35, PZ1 + 1.2]], svg: box(x0, y - .35, PZ1, x1, y + .35, PZ1 + 1.2, METAL, toneI, .3) }); }
    put([[CHIP[0] - 5.2, CHIP[1] - 6, PZ1], [CHIP[0] + 5.2, CHIP[1] + 6, PZ1 + 2]], byDepth(legs.filter(l => (l.box[0][0] < CHIP[0]) !== vis([1,0,0]))) + s + byDepth(legs.filter(l => (l.box[0][0] < CHIP[0]) === vis([1,0,0])))); }
  put([[CAPE[0] - 3.5, CAPE[1] - 3.5, PZ1], [CAPE[0] + 3.5, CAPE[1] + 3.5, PZ1 + 9]], cylK(CAPE[0], CAPE[1], PZ1, PZ1 + 9, 3.5, '#3a4f8f', 1, '#cfd6d8', 20)
    + line([[CAPE[0] - 2, CAPE[1], PZ1 + 9.05], [CAPE[0] + 2, CAPE[1], PZ1 + 9.05]], .5) + line([[CAPE[0], CAPE[1] - 2, PZ1 + 9.05], [CAPE[0], CAPE[1] + 2, PZ1 + 9.05]], .5));
  for (const [x, y] of [[88, 150], [88, 155], [64, 150]]) put([[x - 2, y - .7, PZ1], [x + 2, y + .7, PZ1 + 1.4]], boxK(x - 2, y - .7, PZ1, x + 2, y + .7, PZ1 + 1.4, '#d9c79a', .6)
    + box(x - .8, y - .72, PZ1 + .1, x - .4, y + .72, PZ1 + 1.45, smMat('#b5442f'), toneI, 0) + box(x + .3, y - .72, PZ1 + .1, x + .7, y + .72, PZ1 + 1.45, smMat('#2b2523'), toneI, 0));
  put([[89.4, 160.4, PZ1], [92.6, 163.6, PZ1 + 4]], cylK(91, 162, PZ1, PZ1 + 4, 1.6, '#26262a', .7, null, 12));
  put([[63, 155.4, PZ1], [67, 156.6, PZ1 + 1.2]], boxK(63, 155.4, PZ1, 67, 156.6, PZ1 + 1.2, '#2b2523', .6) + box(66, 155.38, PZ1, 66.5, 156.62, PZ1 + 1.25, smMat('#d9dddd'), toneI, 0));
  // ---- piezo horn: housing, brass disc with its ceramic, three leads soldered to the board
  { const [x, y] = BUZ, jig = beep ? (Math.floor(smNow() / 35) % 2 ? .25 : -.25) : 0;
    let s = cylK(x, y, PZ1, PZ1 + 7, 14, '#2b2523', 1.2, '#3b3431', 40);
    s += shape(on(PZ(PZ1 + 7.05), ellUV(x, y, 12.2, 12.2, 36)), beep ? SM_LIVE : '#d7b25a', .8)
      + shape(on(PZ(PZ1 + 7.1 + jig), ellUV(x, y, 8, 8, 28)), beep ? '#ffe2b0' : '#f2efe7', .7)
      + shape(on(PZ(PZ1 + 7.15 + jig), ellUV(x + 1, y - 1, 6, 6, 24)), '#cfd6d8', .5)
      + shape(on(PZ(PZ1 + 7.15 + jig), ellUV(x - 5.6, y + 2.6, 1.1, 1.6, 10)), '#e9e3d0', .4);
    put([[x - 14, y - 14, PZ1], [x + 14, y + 14, PZ1 + 7.2]], s);
    [[-20, 9.6], [-50, 4], [-80, 7]].forEach(([a, r]) => { const p = pol(BUZ, r, a), q = pol(BUZ, 14.6, a), e = pol(BUZ, 15.5, a);
      parts.push(...smWireParts([[...p, PZ1 + 7.2], [...q, PZ1 + 7.6], [...e, PZ1 + 5], [...e, PZ1 + .1]], beep ? SM_WIRE : '#3a3632', .35)); }); }
  // ---- LED on the board and the clear light pipe up to the lens in the cover
  put([[LEDP[0] - 2, LEDP[1] - 2, PZ1], [LEDP[0] + 2, LEDP[1] + 2, PZ1 + 2.6]], boxK(LEDP[0] - 1.8, LEDP[1] - 1.8, PZ1, LEDP[0] + 1.8, LEDP[1] + 1.8, PZ1 + 1.2, '#e9e3d0', .6)
    + cylK(LEDP[0], LEDP[1], PZ1 + 1.2, PZ1 + 2.6, 1.5, view.redOn ? '#ff3b2f' : '#8a2a22', .6, null, 12));
  put([[LEDP[0] - 1.8, LEDP[1] - 1.8, PZ1 + 3], [LEDP[0] + 1.8, LEDP[1] + 1.8, ZP + 13]], `<g opacity=".75">${cylK(LEDP[0], LEDP[1], PZ1 + 3, ZP + 13, 1.8, view.redOn ? '#ffb0a0' : '#e4f2f4', .8, null, 14)}</g>`);
  // ---- test switch on the board; the button's stem, arm over the chamber and leg down onto the switch
  { const dz = view.testing ? -.8 : 0, [x, y] = TSW, zr = ZP + 14;
    put([[x - 3, y - 3, PZ1], [x + 3, y + 3, PZ1 + 3.5]], boxK(x - 3, y - 3, PZ1, x + 3, y + 3, PZ1 + 3, '#26262a', .7) + cylK(x, y, PZ1 + 3, PZ1 + 4.2 + dz*.5, 1.6, view.testing ? SM_LIVE : '#d9dddd', .6, null, 12));
    put([[O[0] - 3, O[1] - 3, ZP + 11 + dz], [O[0] + 3, O[1] + 3, zr + dz]], cylK(O[0], O[1], ZP + 11 + dz, zr + dz, 2.6, '#fbf7ea', .8, null, 16));
    const a = [O[0] - 1.6, O[1] + 1.6], b = [x - 1.6, y + 1.6], c2 = [x + 1.6, y - 1.6], d = [O[0] + 1.6, O[1] - 1.6];
    put(smBoxOf([a, b, c2, d], ZP + 9.5 + dz, ZP + 11 + dz), prism([a, b, c2, d], ZP + 9.5 + dz, ZP + 11 + dz, '#fbf7ea', .7));
    put([[x - 1.4, y - 1.4, PZ1 + 4.2 + dz*.5], [x + 1.4, y + 1.4, ZP + 9.5 + dz]], cylK(x, y, PZ1 + 4.2 + dz*.5, ZP + 9.5 + dz, 1.4, '#fbf7ea', .7, null, 12)); }
  // ---- the photoelectric chamber
  put([[CH[0] - SMB.MR - .5, CH[1] - SMB.MR - .5, PZ1], [CH[0] + SMB.MR + .5, CH[1] + SMB.MR + .5, SMB.CAP[1]]], smChamber(st, view));
  // ---- battery tray, 9V battery on its snap clip, red and black leads to the board
  { const W0 = 25, W1 = 53, B0 = -26.5, B1 = 26.5, Z0 = ZB + 3, Z1 = ZP + 2, t = 1.5, TC = '#3b3431';
    const tray = [];
    tray.push({ at: [...smQ((W0 + W1)/2, 0), Z0 + .5], svg: prism(smRect(W0, B0, W1, B1), Z0, Z0 + 1.5, TC, .8) });
    for (const [p, q] of [[[W0 + t/2, B0], [W0 + t/2, B1]], [[W1 - t/2, B0], [W1 - t/2, B1]], [[W0, B0 + t/2], [W1, B0 + t/2]], [[W0, B1 - t/2], [W1, B1 - t/2]]])
      tray.push({ at: [...smQ((p[0] + q[0])/2, (p[1] + q[1])/2), (Z0 + Z1)/2], svg: vane(smQ(...p), smQ(...q), Z0, Z1, TC, t) });
    const bz0 = Z0 + 1.5, bz1 = bz0 + 17;
    let bat = prism(smRect(27, -24, 51, 17), bz0, bz1, '#35353b', 1.1);
    if (vis([SMB.u[0], SMB.u[1], 0]) === false) bat += '';
    bat += prism(smRect(27.4, -10, 50.6, 4), bz1, bz1 + .05, '#f2c230', 0);
    tray.push({ at: [...smQ(39, -3.5), (bz0 + bz1)/2], svg: bat });
    for (const a of [33, 45]) tray.push({ at: [...smQ(a, 18.3), bz0 + 9], svg: rod([...smQ(a, 17), bz0 + 9], [...smQ(a, 19.5), bz0 + 9], a < 40 ? 2.4 : 2, METAL, toneI, .6) });
    tray.push({ at: [...smQ(39, 21.5), bz0 + 9], svg: prism(smRect(29.5, 19.5, 48.5, 23.5), bz0 + 5, bz0 + 13, '#1d1917', .8) });
    if (trayNear) put(smBoxOf(smRect(W0, B0, W1, B1), Z0, Z1 + 1), byDepth(tray)); else traySvg = byDepth(tray);
    parts.push(...smWireParts([[...smQ(34, 23.5), bz0 + 9], [...smQ(34, 24), Z1 + 1.4], [...smQ(22, 24), Z1 + 1.4], [...smQ(22, 23.5), PZ1 + .1]], hot ? SM_WIRE : '#c2300a', .5));
    parts.push(...smWireParts([[...smQ(44, 23.5), bz0 + 9], [...smQ(44, 25.2), Z1 + 1.4], [...smQ(20, 25.2), Z1 + 1.4], [...smQ(20, 23.5), PZ1 + .1]], hot ? SM_WIRE : '#3a3632', .5)); }
  // ---- smoke drifting over the alarm
  for (const p of view.overAlarm) parts.push({ at: [p.x, p.y, p.z], svg: puffSvg(p, view) });
  SM_XR_LABELS = [
    { at: [...pol(CH, 13, 150), ZBEAM + 2], text: 'IR LED', on: hot },
    { at: [...pol(CH, 14, 60), ZBEAM + 2], text: 'PHOTODIODE', on: view.sees },
    { at: [...pol(CH, 17, 230), SMB.MZ[1]], text: 'LABYRINTH', on: view.inside.length > 0 },
    { at: [...pol(CH, SMB.MR, 280), SMB.MZ[0] + 3], text: 'INSECT MESH', on: false },
    { at: [CHIP[0], CHIP[1], PZ1 + 2], text: 'ASIC', on: hot },
    { at: [...pol(BUZ, 10, 100), PZ1 + 7], text: 'PIEZO HORN', on: beep },
    { at: [TSW[0] + 3, TSW[1], PZ1 + 3], text: 'TEST SWITCH', on: view.testing },
    { at: [...smQ(39, -20), ZB + 21.5], text: '9V BATTERY', on: hot },
    { at: [...smQ(39, 23.5), ZB + 17], text: 'SNAP CLIP', on: false },
    { at: [LEDP[0], LEDP[1], ZP + 9], text: 'LIGHT PIPE', on: view.redOn },
    { at: [...pol(O, 50, 135), ZB + 2.4], text: 'MOUNTING BASE', on: false } ];
  flush();
  return layers.join('').replace('__TRAY_BEFORE__', traySvg);
}
// the chamber: base, far half of the mesh, the labyrinth and optics inside, near half of the mesh, the cap
function smChamber(st, view){
  const R = SMB.MR, [z0, z1] = SMB.MZ, [c0, c1] = SMB.CAP, PZ1 = SMB.PCB[1];
  const ring = (z, r = R, n = 48) => on(PZ(z), ellUV(CH[0], CH[1], r, r, n));
  let s = cylK(CH[0], CH[1], PZ1, z0, R + .5, CHDARK, 1, '#3b3431', 48);
  const mesh = near => { let g = `<g opacity=".38">${loft(ring(z0), ring(z1), n => near ? '#9aa2a6' : '#5b5550', !near)}</g>`, d = '';
    for (let a = 0; a < 360; a += 8){ const n = [Math.cos(smRad(a)), Math.sin(smRad(a)), 0]; if (vis(n) !== near) continue;
      d += pd([[...pol(CH, R, a), z0], [...pol(CH, R, a), z1]], false); }
    for (const z of [z0 + 2.3, z0 + 4.5]){ const pts = []; for (let a = 0; a <= 360; a += 6){ const n = [Math.cos(smRad(a)), Math.sin(smRad(a)), 0]; if (vis(n) === near) pts.push([...pol(CH, R, a), z]); else if (pts.length){ d += pd(pts, false); pts.length = 0; } } if (pts.length > 1) d += pd(pts, false); }
    return g + `<path d="${d}" fill="none" stroke="${INK}" stroke-width=".35" opacity=".7"/>`; };
  s += mesh(false);
  const parts = [], lit = view.lit.length;
  [0, 25, 185, 215, 245, 275, 305, 335].forEach(a => {
    const p = pol(CH, R - 1, a), q = pol(CH, R - 5.5, a), h = pol(CH, R - 5.5, a + 14);
    parts.push({ at: [...pol(CH, R - 3.2, a), z0 + 3], svg: vane(p, q, z0, z1 - .3, CHDARK, 1.4) });
    parts.push({ at: [...pol(CH, R - 5.5, a + 7), z0 + 3], svg: vane(q, h, z0, z1 - .3, CHDARK, 1.4) }); });
  parts.push({ at: [...pol(CH, 13.5, 97), z0 + 3], svg: vane(pol(CH, R - 1, 100), pol(CH, 9, 94), z0, z1 - .3, CHDARK, 1.6) });   // shield baffle: no straight path from the LED to the photodiode
  const holder = (a, lensCol) => { const b0 = pol(CH, R - 1, a - 8), b1 = pol(CH, R - 1, a + 8), b2 = pol(CH, 14.5, a + 9), b3 = pol(CH, 14.5, a - 9);
    return prism([b0, b1, b2, b3], z0, ZBEAM + 2.6, '#4d4641', .7) + rod([...pol(CH, 14.5, a), ZBEAM], [...pol(CH, 12.6, a), ZBEAM], 1.5, smMat(lensCol), toneI, .6, 1.3, 14); };
  parts.push({ at: [...pol(CH, 16.5, 150), ZBEAM], svg: holder(150, lit ? '#ffd9a8' : '#c99a8a') });
  parts.push({ at: [...pol(CH, 16.5, 60), ZBEAM], svg: holder(60, view.sees ? '#7ef0ff' : '#3f6f86') });
  { const a = pol(CH, R - 1, -40), b = pol(CH, 13.5, -30), c = pol(CH, R - 1, -20);
    parts.push({ at: [...pol(CH, 16, -30), z0 + 3], svg: vane(a, b, z0, z1 - .3, '#1d1917', 1.2) + vane(b, c, z0, z1 - .3, '#1d1917', 1.2) }); }   // light trap
  const L3 = [...pol(CH, 12.6, 150), ZBEAM], T3 = [...pol(CH, 13.5, -30), ZBEAM], S3 = [...pol(CH, 12.6, 60), ZBEAM], NB = 6;
  for (let i = 0; i < NB; i++){ const a = L3.map((v, j) => v + (T3[j] - v)*i/NB), b = L3.map((v, j) => v + (T3[j] - v)*(i + 1)/NB);
    parts.push({ at: a.map((v, j) => (v + b[j])/2), svg: lit
      ? `<path d="${pd([a, b], false)}" fill="none" stroke="${ACC_HI}" stroke-width="3.2" stroke-linecap="round" opacity="${f(Math.min(1, .45 + lit*.12))}"/>`
      : `<path d="${pd([a, b], false)}" fill="none" stroke="${ACC}" stroke-width="1.2" stroke-dasharray="2.6 3" opacity=".6"/>` }); }
  view.lit.slice(0, 7).forEach(p => parts.push({ at: [(p.x + S3[0])/2, (p.y + S3[1])/2, (p.z + S3[2])/2],
    svg: `<path d="${pd([[p.x, p.y, p.z], S3], false)}" fill="none" stroke="${ACC}" stroke-width="1.3" stroke-dasharray="1.6 1.4" opacity=".9"/>` }));
  for (const p of view.inside) parts.push({ at: [p.x, p.y, p.z], svg: puffSvg(p, view) });
  s += byDepth(parts) + mesh(true);
  // the cap over the labyrinth, see-through so the inside shows
  s += `<g opacity=".28">${loft(ring(c0), ring(c1), n => '#3b3431')}${fill(pd(ring(c1)), '#3b3431')}</g>` + ink(pd(ring(c1)), .8) + hullInk([...ring(z0), ...ring(c1)], 1.1);
  return s;
}
const smCaption = st => { const v = smView(st);
  if (v.testing) return 'Test: the button’s arm reaches over the chamber and presses the test switch on the board. The ASIC runs the alarm as if it saw smoke, so the battery, the chip and the piezo horn are all proved.';
  if (st.alarm) return 'Alarm: smoke in the chamber scatters the infrared LED’s light round the baffle onto the photodiode. The ASIC sees the signal stay high and drives the piezo horn from the 9V battery; the red LED flashes up the light pipe.';
  if (v.sees) return 'Smoke particles in the beam scatter a little of the infrared light round the shield baffle onto the photodiode. The ASIC waits to see if the signal stays high.';
  if (v.inside.length) return 'Smoke has come in through the cover’s vents and the insect mesh into the black labyrinth. The beam still runs straight into the light trap, so the photodiode stays dark.';
  return 'Inside: a black labyrinth chamber behind an insect mesh. Its infrared LED shines into a light trap, with the photodiode hidden behind a baffle. The ASIC on the board watches it, a piezo horn sounds the alarm, a 9V battery on a snap clip powers it, and a light pipe carries the LED up to the cover.'; };
function puffSvg(p, view){
  const [x, y] = P(p.x, p.y, p.z), lit = view.lit.includes(p);
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${p.r}" fill="${lit ? ACC_HI : '#8f8b86'}" opacity="${f(Math.max(0, p.o) * (lit ? 1 : .75))}" pointer-events="none"/>`;
}
// labels in two columns beside the alarm, so they stay clear of it from every side
function smLabels(items){
  const k = INK_K, fs = 8.6 * k, hgt = fs * 1.8, gap = hgt + 3 * k, rim = [];
  for (let a = 0; a < 360; a += 10) for (const z of [ZB, ZP + 14]) rim.push(P(...pol(O, RS, a), z));
  let xmin = Math.min(...rim.map(p => p[0])), xmax = Math.max(...rim.map(p => p[0])); const cx = P(O[0], O[1], ZP)[0];
  // keep the columns clear of the toast and the fan when they stand beside the alarm at label height
  const ys = items.map(it => P(...it.at)[1]), y0 = Math.min(...ys) - hgt, y1 = Math.max(...ys) + 4 * hgt;
  for (const pts of [[...on(PZ(0), ellUV(TOAST[0], TOAST[1], 17, 17, 16)), ...on(PZ(6), ellUV(TOAST[0], TOAST[1], 14, 14, 8))],
                     [...on(PZ(0), ellUV(FAN[0], FAN[1], 9, 9, 12)), ...on(PY(FANY), ellUV(FAN[0], FANZ, 17, 17, 16)), [FAN[0], FAN[1] - 7, FANZ + 5]]]){
    const q = pts.map(p => P(...p)), qx = q.map(p => p[0]), qy = q.map(p => p[1]);
    if (Math.max(...qy) < y0 || Math.min(...qy) > y1) continue;
    const mx = (Math.min(...qx) + Math.max(...qx)) / 2;
    if (mx < cx) xmin = Math.min(xmin, Math.min(...qx)); else xmax = Math.max(xmax, Math.max(...qx));
  }
  const svgEl = document.getElementById('fig'), vb = svgEl.viewBox.baseVal, btn = document.getElementById('btns');
  let topL = fs; const topR = fs;
  if (btn && svgEl.getScreenCTM()){ const r = btn.getBoundingClientRect(), q = new DOMPoint(r.right, r.bottom + 10).matrixTransform(svgEl.getScreenCTM().inverse()); if (q.y > 0) topL = q.y + hgt / 2; }
  const cols = { [-1]: [], [1]: [] };
  for (const it of items){ const [X, Y] = P(...it.at); cols[X < cx ? -1 : 1].push({ ...it, X, Y }); }
  let s = '';
  for (const side of [-1, 1]){
    const col = cols[side].sort((a, b) => a.Y - b.Y), top = side < 0 ? topL : topR;
    let y = -1e9; for (const c of col){ c.py = Math.max(c.Y, y + gap, top); y = c.py; }
    for (const c of col){
      const w = c.text.length * fs * .62 + fs * 1.5;
      let px = side < 0 ? xmin - 6 * k - w / 2 : xmax + 6 * k + w / 2; px = Math.max(vb.x + w / 2 + 2 * k, Math.min(vb.x + vb.width - w / 2 - 2 * k, px));
      s += tag(c.at, (px - c.X) / k, (c.py - c.Y) / k, c.text, c.on);
    }
  }
  return s;
}

/* ---------- state + one step of the simulation (40 ms, as in the 2.0 figure) ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const bx = TRAP[0] - LED[0], by = TRAP[1] - LED[1], bl = Math.hypot(bx, by);
const offBeam = (x, y) => Math.abs((x - LED[0]) * by - (y - LED[1]) * bx) / bl;
const inAlarm = p => Math.hypot(p.x - O[0], p.y - O[1]) < RS && p.z > ZP;
let smAudio = null; const smNodes = new Set();
function smWakeAudio(){ try { if (!smAudio){ const ctx = new (window.AudioContext || window.webkitAudioContext)(); smAudio = { ctx, out: ctx.destination }; } if (smAudio.ctx.state === 'suspended') smAudio.ctx.resume(); } catch (e) {} }
function smTone(ms){
  if (!smAudio) return; try { const { ctx, out } = smAudio, t = ctx.currentTime, d = ms / 1000;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 3000;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.045, t + .01); g.gain.setValueAtTime(.045, t + d - .03); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .02); smNodes.add(o); o.onended = () => { smNodes.delete(o); g.disconnect(); }; } catch (e) {}
}
function smStep(st){
  const now = smNow();
  st.puffs.forEach(p => {
    if (p.mode === 'fly'){ p.k = Math.min(1, p.k + 40 / p.dur); const k = p.k, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
      p.x = a * p.A[0] + b * p.C[0] + c * p.B[0]; p.y = a * p.A[1] + b * p.C[1] + c * p.B[1]; p.z = a * p.A[2] + b * p.C[2] + c * p.B[2];
      if (k >= 1) p.mode = 'in'; }
    else if (p.mode === 'in'){ p.age += 40; p.vx = p.vx * .9 + rnd(-.12, .12); p.vy = p.vy * .9 + rnd(-.12, .12); p.x += p.vx; p.y += p.vy;
      const dx = p.x - CH[0], dy = p.y - CH[1], d = Math.hypot(dx, dy); if (d > 18){ p.x = CH[0] + dx / d * 18; p.y = CH[1] + dy / d * 18; p.vx *= -1; p.vy *= -1; }
      if (p.age > 24000) p.o -= .01; }
    else if (p.mode === 'out'){ p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vy -= .04; p.o -= .02; }
  });
  st.puffs = st.puffs.filter(p => p.o > 0);
  const lit = st.puffs.filter(p => p.mode === 'in' && offBeam(p.x, p.y) < 7), sees = lit.length >= 2;
  if (sees){ st.offT = 0; if (!st.onT) st.onT = now; if (!st.alarm && now - st.onT > 300){ st.alarm = true; st.t0 = now; } }
  else { st.onT = 0; if (!st.offT) st.offT = now; if (st.alarm && now - st.offT > 700) st.alarm = false; }
  const ph = (now - st.t0) % 1500, beep = (st.alarm && (ph < 300 || (ph > 460 && ph < 760))) || now < st.testUntil;
  if (beep && !st.wasBeep) smTone(st.alarm ? 300 : 400);
  st.wasBeep = beep;
  if (now < st.fanUntil) st.fanA = (st.fanA + 47) % 360;
}
// everything the drawing needs, worked out once per frame
function smView(st){
  const now = smNow(), lit = st.puffs.filter(p => p.mode === 'in' && offBeam(p.x, p.y) < 7), sees = lit.length >= 2;
  const ph = (now - st.t0) % 1500, testing = now < st.testUntil, beep = (st.alarm && (ph < 300 || (ph > 460 && ph < 760))) || testing;
  const redOn = st.alarm ? Math.floor(now / 130) % 2 === 0 : st.blink || testing;
  const inside = st.puffs.filter(p => p.mode === 'in'), free = st.puffs.filter(p => p.mode !== 'in');
  return { lit, sees, beep, testing, redOn, ph, inside, overAlarm: free.filter(inAlarm), outside: free.filter(p => !inAlarm(p)) };
}

let ui, smLive = false;
function smRun(){
  if (smLive) return; smLive = true; let acc = 0;
  ui.animate(dt => { const st = ui.st; acc += dt * 1000; let n = 0; while (acc >= 40 && n < 8){ smStep(st); acc -= 40; n++; } if (n === 8) acc = 0;
    const now = smNow(), busy = st.puffs.length > 0 || st.alarm || now < st.testUntil + 200 || now < st.fanUntil || Object.values(st.fl).some(t => now - t < 300);
    if (!busy){ smLive = false; st.wasBeep = false; } return busy; });
}
function puff(st, ui){
  smWakeAudio(); st.fl.puff = smNow();
  if (st.puffs.filter(p => p.mode !== 'out').length > 40){ ui.flash('plenty of smoke already — clear the air'); smRun(); return; }
  for (let i = 0; i < 16; i++) setTimeout(() => {
    const to = pol(CH, rnd(2, 16), rnd(0, 360));
    st.puffs.push({ mode: 'fly', k: 0, dur: rnd(1800, 2700), A: [TOAST[0] + rnd(-6, 6), TOAST[1] + rnd(-6, 6), 7],
      C: [rnd(45, 70), rnd(5, 25) + SM_Y, rnd(66, 78)], B: [...to, ZBEAM + rnd(-1.5, 1.5)], x: TOAST[0], y: TOAST[1], z: 7, vx: 0, vy: 0, vz: 0, r: rnd(1.8, 3.4), o: .8, age: 0 });
    smRun();
  }, i * 90);
  smRun();
}
function clearAir(st, ui){
  smWakeAudio(); st.fl.clear = smNow(); st.fanUntil = smNow() + 2600;
  if (!st.puffs.some(p => p.mode !== 'out')) ui.flash('the air is already clear — the fan just blows');
  st.puffs.forEach(p => { if (p.mode !== 'out'){ p.mode = 'out'; p.vx = rnd(.3, .7); p.vy = rnd(-1.1, -.6); p.vz = rnd(.3, .7); } });
  smRun();
}
function test(st, ui){ smWakeAudio(); st.fl.test = smNow(); st.testUntil = smNow() + 420; smRun(); }

function scene(st, m){
  const view = smView(st);
  let s = castShadow([[0, SM_Y, 0], [140, SM_Y, 0], [140, SM_Y + 140, 0], [0, SM_Y + 140, 0], [0, SM_Y, ZB], [140, SM_Y, ZB], [140, SM_Y + 140, ZB], [0, SM_Y + 140, ZB],
    ...arc3(O, RS, 0, 360, ZP, 24)]);
  s += castShadow(on(PZ(1), ellUV(TOAST[0], TOAST[1], 17, 17, 24)).concat(on(PZ(4), ellUV(TOAST[0], TOAST[1], 12, 12, 8))));
  s += castShadow([...on(PZ(0), ellUV(FAN[0], FAN[1], 9, 9, 16)), [FAN[0], FAN[1], 33], ...on(PY(FANY), ellUV(FAN[0], FANZ, 17, 17, 20))]).replace('<path', '<path opacity=".7"');
  const top = [
    { at: [70, 70 + SM_Y, 20], svg: stand(st) + alarm(st, m, view) },
    { at: [TOAST[0], TOAST[1], 3], svg: toast() },
    { at: [FAN[0], FAN[1], 27], svg: fan(st) },
    ...view.outside.map(p => ({ at: [p.x, p.y, p.z], svg: puffSvg(p, view) })),
  ];
  s += byDepth(top);
  // BEEP! and sound waves from the buzzer (flat, in screen space)
  if (view.beep){
    const [x, y] = P(BUZ[0], BUZ[1], ZP + 4), second = st.alarm && view.ph > 460;
    s += [10, 17, 24].map(r => `<path d="M${f(x - r * .55)} ${f(y - r)} A${r} ${r} 0 0 0 ${f(x - r)} ${f(y - r * .1)}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`).join('')
      + `<text x="${f(x - (second ? 30 : 46))}" y="${f(y - (second ? 34 : 22))}" font-size="${second ? 13 : 12}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="900" letter-spacing=".04em" fill="${ACC}" stroke="${INK}" stroke-width="1.2" paint-order="stroke">BEEP!</text>`;
  }
  if (ease(st.xr || 0) > .6) s += smLabels(SM_XR_LABELS);
  return s;
}

ui = mountFigure({
  fig: '09', turn:'full', title: 'Smoke alarm', hint: 'Puff smoke: toast, PUFF or space · Clear: fan, CLEAR or C · Test: T',
  idea: 'Inside is a tiny dark chamber with a hidden light. Smoke bounces the light onto a sensor, and that sets off the beep.',
  size: [140, 240, 58], palette: 'cobalt',
  state: { puffs: [], alarm: false, onT: 0, offT: 0, t0: 0, testUntil: 0, wasBeep: false, fanUntil: 0, fanA: 0, blink: false, fl: {} },
  scene,
  readout: st => { const v = smView(st), now = smNow();
    return st.alarm ? 'ALARM · BEEP BEEP · clear the air!' : now < st.testUntil ? 'test · beep!'
      : v.sees ? 'smoke bounces light onto the sensor…' : v.inside.length ? `smoke in chamber: ${v.inside.length} bits` : st.puffs.length ? 'smoke drifting…' : 'clear air · the light misses the sensor'; },
  buttons: [
    { label: 'Puff smoke', onClick: (st, ui) => puff(st, ui) },
    { label: 'Clear the air', onClick: (st, ui) => clearAir(st, ui) },
    { label: 'Test', onClick: (st, ui) => test(st, ui) },
  ],
  acts: { puff: (st, el, ui) => puff(st, ui), toast: (st, el, ui) => puff(st, ui), clear: (st, el, ui) => clearAir(st, ui), fan: (st, el, ui) => clearAir(st, ui), test: (st, el, ui) => test(st, ui) },
  // ?smoke=N starts with N bits of smoke in the chamber (the alarm goes off); ?fly=1 freezes a puff mid-flight; ?fanA=deg turns the blades
  params: (st, q) => {
    const n = +(q.get('smoke') || 0);
    for (let i = 0; i < n; i++){ const p = pol(CH, rnd(2, 16), rnd(0, 360));
      st.puffs.push({ mode: 'in', k: 1, x: p[0], y: p[1], z: ZBEAM + rnd(-1.5, 1.5), vx: 0, vy: 0, vz: 0, r: rnd(1.8, 3.4), o: .8, age: 0 }); }
    if (q.has('fly')){ const k = +q.get('fly');
      for (let i = 0; i < 12; i++){ const to = pol(CH, rnd(2, 16), rnd(0, 360)), A = [TOAST[0] + rnd(-6, 6), TOAST[1] + rnd(-6, 6), 7], C = [rnd(45, 70), rnd(5, 25) + SM_Y, rnd(66, 78)], B = [...to, ZBEAM];
        const kk = Math.min(.98, k + i * .05), a = (1 - kk) ** 2, b = 2 * (1 - kk) * kk, c = kk * kk;
        st.puffs.push({ mode: 'still', k: kk, x: a * A[0] + b * C[0] + c * B[0], y: a * A[1] + b * C[1] + c * B[1], z: a * A[2] + b * C[2] + c * B[2], r: rnd(1.8, 3.4), o: .8 }); } }
    if (q.has('fanA')) st.fanA = +q.get('fanA');
  },
});
// frozen test puffs ('still', from ?fly=) never move
if (ui.st.puffs.length && ui.st.puffs[0].mode !== 'still') smRun();
// the red light blinks every 3 s while idle
setInterval(() => { if (smLive) return; ui.st.blink = true; ui.render(); setTimeout(() => { ui.st.blink = false; if (!smLive) ui.render(); }, 140); }, 3000);
addEventListener('keydown', e => { if (/input|textarea/i.test(e.target.tagName)) return; const k = e.key.toLowerCase(), st = ui.st;
  if (k === ' ' || k === 'p'){ e.preventDefault(); puff(st, ui); }
  else if (k === 'c' || k === 'f') clearAir(st, ui);
  else if (k === 't') test(st, ui);
  else return; ui.render(); });
xrMount(() => ui, smCaption);