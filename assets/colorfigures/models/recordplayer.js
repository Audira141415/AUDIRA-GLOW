/* Record player (port of the Colorfigures 2.0 figure to the 1.0 engine with the free camera).
   Body: x = depth 120, y = width 160, z = height 30. The lit front (x = W) carries the display and the speed buttons. */
const W = 120, D = 160, H = 30, BR = 6;                    // body, plan corner radius
const CX = 60, CY = 66, PR = 48, RR = 44;                  // platter centre / radius, record radius
const PTZ = H + 4, RTZ = PTZ + 1.4;                        // platter top, record top
const PV = [24, 136], ARM_L = 72, ARMZ = H + 13;           // tonearm pivot, length, height at the pivot
const POST = [96, 136], POST_Z = RTZ + 10;                 // arm rest
const ACC = '#ff9a2e', ACC_HI = '#ffc77a';                 // the 2.0 page's accent (display, leds, notes)
const DARKP = matOf('#3b3733'), WEIGHT = '#46413c', PLAT = matOf('#cfd6d8'), VINYL = matOf('#1d1b1a');
const BTNM = { l:'#e6e9e9', m:'#d9dddd', d:'#9ea6a9' }, TUBEM = { l:'#f1f3f3', m:'#e3e7e8', d:'#aeb5b7' };
const f2 = v => v.toFixed(2);

/* ---------- front panel: (u, v) as in the 2.0 face, u -> y = D - u, v -> z = H - v ---------- */
const FP = (u, v, dx = .3) => [W + dx, D - u, H - v];
const onF = (uv, dx) => uv.map(([u, v]) => FP(u, v, dx));
const txF = (u, v, str, size, weight = 700, anchor = 'start', col = INK, dx = .45) =>
  `<text transform="${txM(P(...FP(u, v, dx)), Dv(0,-1,0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="${anchor}" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}">${str}</text>`;
const BTN_UV = { 33:[118, 7, 131, 17], 45:[134, 7, 147, 17] };

/* ---------- small helpers ---------- */
function ballS(p, r, col){                                  // sphere: circle r*1.2247, shade lower half, highlight
  const [X, Y] = P(...p), R = r*1.2247, dk = mix(col, '#000000', .35);
  return `<circle cx="${f2(X)}" cy="${f2(Y)}" r="${f2(R)}" fill="${col}"/>`
    + `<path d="M${f2(X-R)} ${f2(Y)} A${f2(R)} ${f2(R)} 0 0 0 ${f2(X+R)} ${f2(Y)} A${f2(R)} ${f2(R*.55)} 0 0 1 ${f2(X-R)} ${f2(Y)}Z" fill="${dk}" opacity=".55"/>`
    + `<circle cx="${f2(X-R*.35)}" cy="${f2(Y-R*.38)}" r="${f2(R*.26)}" fill="#fff" opacity=".7"/>`
    + `<circle cx="${f2(X)}" cy="${f2(Y)}" r="${f2(R)}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
}
// oriented box: centre line from a to b (plan), half width hw, z0..z1 — all faces that face the viewer
function obox(a, b, hw, z0, z1, m){
  const d = norm([b[0]-a[0], b[1]-a[1], 0]), n = [-d[1], d[0], 0];
  const c = (p, s) => [p[0] + n[0]*hw*s, p[1] + n[1]*hw*s];
  const A0 = c(a,-1), A1 = c(a,1), B0 = c(b,-1), B1 = c(b,1);
  const q = (pts, z) => pts.map(([x, y], i) => [x, y, z[i]]);
  const F = [
    [n,                 q([A1,B1,B1,A1], [z0,z0,z1,z1])],
    [n.map(v => -v),    q([A0,B0,B0,A0], [z0,z0,z1,z1])],
    [d,                 q([B0,B1,B1,B0], [z0,z0,z1,z1])],
    [d.map(v => -v),    q([A0,A1,A1,A0], [z0,z0,z1,z1])],
    [[0,0,1],           q([A0,B0,B1,A1], [z1,z1,z1,z1])] ];
  const all = [A0,A1,B0,B1].flatMap(([x,y]) => [[x,y,z0],[x,y,z1]]);
  return F.filter(([nn]) => vis(nn)).map(([nn, pts]) => face(pd(pts), toneI(nn, m))).join('') + hullInk(all, 1);
}
// draw order for a few parts: rel(a, b) = true (a first), false (b first) or null (by depth)
function ordered(items, rel){
  const out = [], left = items.filter(Boolean);
  const r = (a, b) => { const x = rel(a.id, b.id); if (x != null) return x; const y = rel(b.id, a.id); return y == null ? null : !y; };
  while (left.length){
    let cand = left.filter(x => !left.some(y => y !== x && r(y, x) === true));
    if (!cand.length) cand = left.slice();
    cand.sort((a, b) => depthOf(a.at) - depthOf(b.at));
    out.push(cand[0]); left.splice(left.indexOf(cand[0]), 1);
  }
  return out.map(x => x.svg).join('');
}

/* ---------- arm geometry ---------- */
const head = a => { const t = a*Math.PI/180; return [PV[0] + ARM_L*Math.cos(t), PV[1] + ARM_L*Math.sin(t)]; };
function angFor(r){ let lo = -80, hi = 0;
  for (let i = 0; i < 30; i++){ const m = (lo+hi)/2, [x,y] = head(m); (Math.hypot(x-CX, y-CY) > r ? hi = m : lo = m); }
  return (lo+hi)/2; }
const A_OUT = angFor(41), A_IN = angFor(17);

/* ---------- the record ---------- */
function record(st){
  if (!st.has) return '';
  const z = PTZ + 64*st.up, rz = z + 1.4, op = Math.min(1, (1 - st.up)*4 + .25);
  const TZ = PZ(rz + .02), ring = r => on(TZ, ellUV(CX, CY, r, r, 48));
  let s = cyl(CX, CY, z, rz, RR, VINYL, toneI, 1.2, 40);
  s += `<path d="${pd(ring(RR))}" fill="#211f1d" stroke="#14110e" stroke-width=".6"/>`;
  let g = ''; for (let r = 17; r < RR - 1; r += 2.6) g += pd(ring(r));
  s += `<path d="${g}" fill="none" stroke="#4a4642" stroke-width=".5"/>`;
  s += `<path d="${pd(ring(13))}" fill="#e2473a" stroke="#14110e" stroke-width=".6"/>`;
  // label text turns with the record (the top plane is never seen mirrored: the camera is always above)
  s += `<g transform="${txM(P(CX, CY, rz + .03), Dv(1,0,0), Dv(0,1,0))}"><g transform="rotate(${f2(st.spin)})">
    <text y="-4" text-anchor="middle" font-size="4" font-weight="900" fill="#fbf7ea" font-family="ui-monospace,Menlo,monospace">SIDE A</text>
    <text y="7.5" text-anchor="middle" font-size="3.6" font-weight="700" fill="#fbf7ea" font-family="ui-monospace,Menlo,monospace">${st.rpm} RPM</text></g></g>`;
  // sheen: two fixed soft wedges
  for (const a0 of [-163, 17]){
    const pts = [...arcUV(CX, CY, RR*.838, a0, a0 + 56, 10), ...arcUV(CX, CY, RR*.527, a0 + 56, a0, 10)];
    s += `<path d="${pd(on(TZ, pts))}" fill="#fff" opacity=".08"/>`;
  }
  s += cyl(CX, CY, rz, rz + 3, 1.4, PLAT, toneI, .8, 12);           // spindle
  return `<g opacity="${f2(op)}">${s}</g>`;
}

/* ---------- scene ---------- */
function scene(st, m){
  const FRONT = facing([1,0,0]);
  const bot = on(PZ(4), rrUV(0, 0, W, D, BR)), top = on(PZ(H), rrUV(0, 0, W, D, BR));
  let s = castShadow([...on(PZ(0), rrUV(2, 2, W-2, D-2, BR)), ...top, ...on(PZ(PTZ), ellUV(CX, CY, PR, PR, 16))]);
  // feet (under the body: always drawn before it)
  s += byDepth([[10,10],[W-10,10],[10,D-10],[W-10,D-10]].map(([x,y]) => ({ at:[x,y,0], svg: cyl(x, y, 0, 5, 4.5, DARKP, toneI, 1, 16) })));
  // body: a convex rounded slab
  s += loft(bot, top, n => tone(n, m));
  s += fill(pd(top), tone([0,0,1], m));
  s += shape(on(PZ(H + .05), rrUV(4, 112, 16, 156, 2)), m.m, .8);    // the little speed sign by the arm
  if (FRONT) s += frontPanel(st, m);
  s += ink(pd(top), 1.5) + hullInk([...bot, ...top], 2.8);
  s += topParts(st);
  // a record lifted high floats above the arm
  if (st.has && st.up >= .15) s += record(st);
  // needle tag + notes in the air
  if (st.lift < .5 && st.has){ const [hx, hy] = head(st.ang);
    s += `<g opacity="${f2(1 - 2*st.lift)}" pointer-events="none">${tag([hx, hy, RTZ], -72, 30, 'NEEDLE IN THE GROOVE')}</g>`; }
  s += st.notes.map(n => { const [X, Y] = P(...n.p), k = n.s * INK_K * 1.7;
    return `<g opacity="${f2(n.o)}" transform="translate(${f2(X + n.dx)} ${f2(Y)}) scale(${f2(k)})" pointer-events="none">
      <ellipse cx="0" cy="0" rx="2.4" ry="1.8" transform="rotate(-20)" fill="${ACC}" stroke="${INK}" stroke-width="${f2(.8/k)}"/>
      <path d="M2 -.6 L2 -9 L5.5 -7 L5.5 -5.6 L3 -7 L3 -.6Z" fill="${ACC}" stroke="${INK}" stroke-width="${f2(.8/k)}"/></g>`; }).join('');
  return s;
}

function frontPanel(st, m){
  const fc = tone([1,0,0], m);
  let s = '';
  s += txF(12, 16, 'SPIN', 8, 900);
  s += txF(12, 22, 'STEREO TURNTABLE', 3.6, 700);
  // display
  s += shape(onF(rrUV(56, 4, 110, 23, 3), .35), '#46413c', 1.1);
  const hot = st.has;
  s += `<path d="${pd(onF(rrUV(58, 6, 108, 21, 2), .4))}" fill="${hot ? mix('#eef0f0', ACC, .12) : '#dfe7e9'}" stroke="${hot ? ACC : '#46413c'}" stroke-width=".8"/>`;
  const playing = st.phase === 'playing';
  const l1 = !st.has ? 'NO RECORD' : playing ? 'PLAYING' : st.phase === 'moving' ? 'CUEING' : 'READY';
  s += txF(61, 11.2, l1, 3.8, 700, 'start', ACC_HI);
  if (st.has) s += txF(105, 11.2, st.rpm + ' RPM', 3.8, 700, 'end', ACC_HI);
  // the level trace
  let wv = [[61, 17]];
  if (playing) for (let u = 61.5; u <= 105; u += .7){ const k = st.t/120 + u*.9;
    wv.push([u, 17 - 3.2*Math.sin(k)*Math.sin(k*.23 + 1) - 1.2*Math.sin(k*2.7)]); }
  else wv.push([105, 17]);
  s += `<path d="${pd(onF(wv, .45), false)}" fill="none" stroke="${playing ? ACC : '#6d6760'}" stroke-width="${playing ? 1.1 : .8}" stroke-linejoin="round" stroke-linecap="round"/>`;
  // speed buttons: small metal keys standing out of the front, sorted for the camera
  const keys = [33, 45].map(k => { const [u0, v0, u1, v1] = BTN_UV[k], [, y1, z1] = FP(u0, v0), [, y0, z0] = FP(u1, v1);
    const pr = st.press && st.press.k === k ? Math.sin(Math.min(1, st.press.t / .25) * Math.PI) : 0, bd = 1.8 - 1.3*pr;
    let b = box(W, y0, z0, W + bd, y1, z1, BTNM, toneI, .9);
    b += `<text transform="${txM(P(W + bd + .05, (y0+y1)/2, z0 + 3.2), Dv(0,-1,0), Dv(0,0,-1))}" font-size="4.6" fill="${INK}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">${k}</text>`;
    return { at:[W + bd, (y0+y1)/2, (z0+z1)/2], svg: act('b' + k, b) }; });
  s += byDepth(keys);
  for (const k of [33, 45]){ const u = (BTN_UV[k][0] + BTN_UV[k][2]) / 2;
    s += shape(onF(ellUV(u, 20.5, 1.4, 1.4, 12), .4), st.rpm === k ? ACC : '#c9c1b2', .6); }
  s += ink(pd(onF(rrUV(56, 4, 110, 23, 3), .35)), 1.1);
  return s;
}

function topParts(st){
  const t = st.ang*Math.PI/180, c = Math.cos(t), sn = Math.sin(t), dir = [c, sn];
  const [hx, hy] = head(st.ang), hz = RTZ + 3 + 9*st.lift;
  const ballP = [PV[0] - 13*c, PV[1] - 13*sn, ARMZ];
  // platter (+ the record while it rests on it)
  const plat = cyl(CX, CY, H, PTZ, PR, PLAT, toneI, 1.4, 40) + (st.has && st.up < .15 ? act('rec', record(st)) : '');
  const base = cyl(PV[0], PV[1], H, H + 5, 9, DARKP, toneI, 1.2, 28);
  const piv = cyl(PV[0], PV[1], H + 5, ARMZ, 3, PLAT, toneI, 1, 16);
  const post = cyl(POST[0], POST[1], H, POST_Z, 2.4, DARKP, toneI, 1, 14);
  const K = rod([PV[0] - 10*c, PV[1] - 10*sn, ARMZ], [PV[0], PV[1], ARMZ], 1.1, TUBEM, toneI, .9) + ballS(ballP, 4.2, WEIGHT);
  // tube end, headshell, needle
  const tubeEnd = [hx - 6*c, hy - 6*sn, hz + 1.1];
  let T = `<path d="${pd([[hx, hy, hz - 2], [hx, hy, RTZ + (st.lift > .02 ? 9*st.lift + 1 : 0)]], false)}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>`;
  if (st.phase === 'playing'){ const q = P(hx, hy, RTZ); T += `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(1.6*INK_K*1.4)}" fill="${ACC}" opacity=".9"/>`; }
  T += obox([hx - 7*c, hy - 7*sn], [hx + 4*c, hy + 4*sn], 2.6, hz - 2, hz, PALS[stPal()]);
  T += rod([PV[0], PV[1], ARMZ], tubeEnd, 1.1, TUBEM, toneI, .9);
  // the tube point nearest the rest post (for sorting the two)
  const a3 = [PV[0], PV[1], ARMZ], seg = sub(tubeEnd, a3), w = sub([POST[0], POST[1], 0], a3);
  const k = Math.max(0, Math.min(1, (w[0]*seg[0] + w[1]*seg[1]) / (seg[0]**2 + seg[1]**2)));
  const near = [a3[0] + seg[0]*k, a3[1] + seg[1]*k, a3[2] + seg[2]*k];
  // nearest platter-rim point to a part standing beside it
  const rim = (x, y) => { const d = Math.hypot(x - CX, y - CY); return [CX + (x - CX)/d*PR, CY + (y - CY)/d*PR, PTZ]; };
  const dz = (p, z) => depthOf([p[0], p[1], z]);
  const items = [
    { id:'A', at:[CX, CY, PTZ], svg: plat },
    { id:'base', at:[PV[0], PV[1], H + 2.5], svg: base },
    { id:'piv', at:[PV[0], PV[1], H + 9], svg: piv },
    { id:'post', at:[POST[0], POST[1], H + 8], svg: post },
    { id:'K', at: ballP, svg: act('arm', K) },
    { id:'T', at:[hx, hy, hz], svg: act('arm', T) } ];
  const rel = (a, b) => {
    const pair = a + '|' + b;
    switch (pair){
      case 'A|T': case 'base|T': case 'piv|T': case 'base|piv': case 'A|piv': case 'base|K': case 'A|K': return true;
      case 'A|base': { const r = rim(PV[0], PV[1]); return dz(r, PTZ) < dz(PV, PTZ); }
      case 'A|post': { const r = rim(POST[0], POST[1]); return dz(r, PTZ) < dz(POST, PTZ); }
      case 'piv|K': return dz(PV, ARMZ) < depthOf(ballP);
      case 'post|T': return dz(POST, near[2]) < depthOf(near);
      case 'K|T': return depthOf(ballP) < dz(PV, ARMZ);
    }
    return null; };
  return ordered(items, rel);
}
let stPal = () => 'cobalt';

/* ---------- motion: one loop that runs while anything moves ---------- */
let rpUI = null, rpRun = false, rpSound = null, rpAudio = null;
function tween(st, ms, step, done){ st.tw.push({ t:0, ms, step, done }); kick(); }
function kick(){ if (rpRun || !rpUI) return; rpRun = true; rpUI.animate(dt => { const go = tick(rpUI.st, dt*1000); if (!go) rpRun = false; return go; }); }
function tick(st, dt){
  st.t += dt;
  for (const w of st.tw.slice()){ w.t += dt; const k = Math.min(1, w.t / w.ms); w.step(ease(k));
    if (k >= 1){ st.tw.splice(st.tw.indexOf(w), 1); w.done && w.done(); } }
  const want = st.phase === 'playing' || (st.phase === 'moving' && st.lift < 1) || st.motorOn ? 1 : 0;
  st.motor += (want - st.motor) * Math.min(1, dt/450);
  if (!want && st.motor < .004) st.motor = 0;
  st.spin = (st.spin + dt * .2 * (st.rpm/33.3) * st.motor) % 360;
  if (st.phase === 'playing'){
    st.prog = Math.min(1, st.prog + dt/45000);
    st.ang = A_OUT + (A_IN - A_OUT)*st.prog;
    if (st.prog >= 1) lift(st);
    if (Math.random() < dt/260){ const [hx, hy] = head(st.ang);
      st.notes.push({ p:[hx, hy, RTZ + 8], dx:(Math.random()-.5)*8*INK_K, s:.8 + Math.random()*.5, o:1, vz:.025 + Math.random()*.02, vx:(Math.random()-.5)*.02 }); }
  }
  st.notes.forEach(n => { n.p[2] += n.vz*dt; n.dx += (n.vx*dt + Math.sin(st.t/300 + n.s*9)*.15) * INK_K; n.o -= dt/1800; });
  st.notes = st.notes.filter(n => n.o > 0);
  if (st.press){ st.press.t += dt/1000; if (st.press.t > .25) st.press = null; }
  return st.tw.length > 0 || st.phase === 'playing' || st.motor > 0 || st.notes.length > 0 || !!st.press;
}
const busy = st => st.phase === 'moving' || st.phase === 'loading';
function putOn(st, then){
  if (st.has && st.up === 0) return then && then();
  if (busy(st)) return;
  st.has = true; st.phase = 'loading'; st.up = 1;
  tween(st, 1100, k => st.up = 1 - k, () => { st.up = 0; st.phase = 'ready'; then && then(); });
}
function drop(st, user){
  if (user) startSound(st);
  if (!st.has) return putOn(st, () => drop(st, false));
  if (st.phase !== 'ready') return;
  st.phase = 'moving'; st.motorOn = true; st.prog = 0;
  tween(st, 1000, k => st.ang = A_OUT*k, () => tween(st, 700, k => st.lift = 1 - k, () => { st.phase = 'playing'; }));
}
function lift(st, then){
  if (st.phase !== 'playing') return then && st.phase === 'ready' && then();
  st.phase = 'moving'; stopSound();
  const a0 = st.ang;
  tween(st, 500, k => st.lift = k, () => tween(st, 1000, k => st.ang = a0*(1 - k), () => { st.motorOn = false; st.phase = 'ready'; then && then(); }));
}
function takeOff(st){
  if (!st.has || st.phase === 'loading') return;
  if (st.phase !== 'ready') return lift(st, () => takeOff(st));
  st.phase = 'loading';
  tween(st, 1000, k => st.up = k, () => { st.has = false; st.up = 1; st.phase = 'empty'; });
}
function speed(st){ st.rpm = st.rpm === 33 ? 45 : 33; st.press = { k: st.rpm, t: 0 }; if (rpSound) rpSound.rate = st.rpm/33; kick(); }

// sound: a little looping tune, only after a real click
function startSound(st){
  if (rpSound) return;
  let ctx, out;
  try { if (!rpAudio){ const c = new (window.AudioContext || window.webkitAudioContext)(), g = c.createGain(); g.gain.value = .5; g.connect(c.destination); rpAudio = { ctx:c, out:g }; }
        ({ ctx, out } = rpAudio); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { return; }
  const tune = [0,4,7,12,7,4,2,5,9,5,2,-1, 0,4,7,11,12,7,4,0];
  const s = { i:0, rate:st.rpm/33, next:ctx.currentTime + .9, id:0 };
  s.id = setInterval(() => {
    if (st.phase !== 'playing') return;
    while (s.next < ctx.currentTime + .25){
      const o = ctx.createOscillator(), g = ctx.createGain(), n = tune[s.i++ % tune.length];
      o.type = 'triangle'; o.frequency.value = 262 * 2 ** ((n + (s.rate > 1 ? 5 : 0))/12);
      g.gain.setValueAtTime(0, s.next); g.gain.linearRampToValueAtTime(.12, s.next + .02); g.gain.exponentialRampToValueAtTime(.001, s.next + .32);
      o.connect(g); g.connect(out); o.start(s.next); o.stop(s.next + .35);
      s.next += .3 / s.rate;
    }
    if (s.next < ctx.currentTime) s.next = ctx.currentTime + .05;
  }, 80);
  rpSound = s;
}
function stopSound(){ if (rpSound){ clearInterval(rpSound.id); rpSound = null; } }


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
function xrMount(getUI, caption, opt = {}){   // opt.labelsOnly: only the Labels switch (the insides are on show already)
  const ui = getUI(), q = new URLSearchParams(location.search), html = document.documentElement;
  if (q.get('labels') !== '1') html.classList.add('nolabels');
  if (ui.st.xr == null){ ui.st.xr = 0; ui.st.xrT = 0; }
  if (q.get('xr') === '1') ui.st.xr = ui.st.xrT = 1;
  const old = document.getElementById('lblctl'); if (old) old.style.display = 'none';
  const vset = document.createElement('div'); vset.className = 'vset';
  vset.innerHTML = '<div class="vrow">' + (opt.labelsOnly ? '' : '<button class="act" id="xrb" aria-pressed="false">See-through</button>') + '<button class="act" id="lblb" aria-pressed="false">Labels</button></div>';
  document.querySelector('.stage').appendChild(vset);
  // pages with a stats panel in the top right: the switches go just under it
  const place = () => { const sp = document.getElementById('stats'); vset.style.top = sp ? (sp.offsetTop + sp.offsetHeight + 10) + 'px' : ''; };
  place(); new ResizeObserver(place).observe(document.getElementById('stats') || vset);
  const xrb = document.getElementById('xrb'), lblb = document.getElementById('lblb');
  const sync = () => { if (xrb) xrb.setAttribute('aria-pressed', !!getUI().st.xrT); lblb.setAttribute('aria-pressed', !html.classList.contains('nolabels')); };
  if (xrb) xrb.onclick = () => { const u = getUI(), st = u.st; st.xr = st.xr || 0; st.xrT = st.xrT ? 0 : 1; sync();
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
// generic see-through for any figure: the whole drawing fades back and the inside parts show over it.
//   opts: { mech(st, k) -> svg, inside(st) -> label items, surface(st) -> label items (optional), B: bounds, getSt() }
// washer-style ghost for an object without a single box case: its inside parts first, then the object pale over them
const xrUnder = (svg, mech, k) => `<g opacity="${f(k)}">${mech}</g><g opacity="${f(1 - .62*k)}">${svg}</g>`;
function xrWrap(sceneFn, opts){
  return function(){
    let s = sceneFn.apply(this, arguments);
    const st = opts.getSt(), k = ease(st.xr || 0);
    if (k > 0 && opts.under) s = xrUnder(s, opts.mech(st, k), k) + (opts.over ? opts.over(st, k) : '');   // the whole drawing is the object
    else if (k > 0 && !opts.inline) s = `<g opacity="${f(1 - .5*k)}">${s}</g><g opacity="${f(k)}">${opts.mech(st, k)}</g>`;   // inline: the figure ghosts its own case
    const items = k > .6 ? opts.inside(st) : opts.surface ? opts.surface(st) : [];
    return s + (items.length ? xrCallouts(items, opts.B) : '');
  };
}

/* ---------- see-through: how a real belt-drive, fully automatic turntable works ----------
   Plinth: back x = 0 (the arm side), front x = W (display, speed keys), floor z = 4, deck z = H.
   Parts (each sits on another part; cables run from a real port to a real port, along the floor):
   DRIVE    main bearing: flange screwed to the floor (3 screws), housing, oil hole . spindle up through the deck .
            sub-platter on the spindle under the deck (belt groove, 3 lightening holes) . the platter sits on it .
            DC motor can hanging from its bracket plate . 2 bracket posts to the deck, rubber grommet on each .
            motor shaft . pulley . the rubber belt round the pulley and the sub-platter groove
   AUTO     pinion on the spindle . cam gear (mutilated: one gap, so it turns once and stops) on its stud and floor boss .
            crank pin on the gear . return bar to the arm lever . arm lever on the pillar under the deck .
            lift cam under the gear . cue lift slider . its two guide posts . return spring and its post .
            wedge at the slider's end . pushrod up into the hollow pillar
   TONEARM  pillar under the deck . big mounting nut and washer . anti-skate lever and spring inside the arm base, spring post .
            cartridge under the headshell . its 4 pins . stylus cantilever and diamond tip .
            4 colour-coded wires along the tube (left +/-, right +/-) . down the pillar . shielded cable out of the slot
            to the preamp . ground wire from the pillar to the ground lug
   SIGNAL   phono preamp board on 4 standoffs . 2 op-amps . RIAA capacitors . tonearm connector . ground lug .
            2 board-mounted RCA jacks (red, white) through the back wall
   POWER    power board on 4 standoffs . DC jack and power switch through the back wall . regulator with heatsink .
            filter capacitor . 2 connectors . cable to the preamp . cable along the floor to the control board
   CONTROL  control board behind the front (2 brackets) . 2 speed switches behind the 33/45 keys . 2 LEDs .
            2 speed trim pots . motor driver chip . motor and power connectors . ribbon to the display board . LCD module */
const boxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - 1), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + 1)];
const bend = (pts, r = 2.5) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k]) * d/la), q = c.map((v, k) => b[k] + (v - b[k]) * d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a cable as short pieces, each with its own box, so byDepth can put it behind or in front of the solids it passes
const wireParts = (pts, col, w = .55, ends = true, rb = 2.5, L = 7) => { const q = rb ? bend(pts, rb) : pts, out = [];
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j - 1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ends && i === 0){ const [X, Y] = P(...q[0]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.3" fill="${INK}"/>`; }
    if (ends && j === q.length - 1){ const [X, Y] = P(...q[j]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.3" fill="${INK}"/>`; }
    out.push({ box: boxOf(seg), svg }); i = j; }
  return out; };
// spur gear: a toothed prism (trapezoid teeth), a gap of `gap` missing teeth for a mutilated gear
function gearSvg(x, y, z0, z1, r, nT, m, rot, gap = 0){
  const pts = [], da = 2*Math.PI/nT;
  for (let i = 0; i < nT; i++){ const a0 = rot*Math.PI/180 + i*da, miss = i < gap;
    for (const [fa, rr] of [[0, r - .9], [.22, r - .9], [.36, miss ? r - .9 : r], [.64, miss ? r - .9 : r], [.78, r - .9]]) pts.push([x + rr*Math.cos(a0 + fa*da), y + rr*Math.sin(a0 + fa*da)]); }
  const A = pts.map(([u, v]) => [u, v, z0]), B = pts.map(([u, v]) => [u, v, z1]);
  return loft(A, B, n => toneI(n, m)) + fill(pd(B), toneI([0,0,1], m)) + ink(pd(B), .55) + hullInk([...A, ...B], .9);
}
// coil spring between two points
const coil = (a, b, r, turns, w = .5) => { const d = sub(b, a), L = Math.hypot(...d), t = norm(d), u = norm(cross(t, Math.abs(t[2]) < .9 ? [0,0,1] : [1,0,0])), v = cross(t, u), pts = [];
  for (let i = 0; i <= turns*12; i++){ const s = i/(turns*12), an = s*turns*2*Math.PI; pts.push([0,1,2].map(k => a[k] + d[k]*s + (u[k]*Math.cos(an) + v[k]*Math.sin(an))*r)); }
  return `<path d="${pd(pts, false)}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`; };
const dotZ = (x, y, z, r = .5, c = METAL.l) => fill(pd(on(PZ(z), ellUV(x, y, r, r, 8))), c) + ink(pd(on(PZ(z), ellUV(x, y, r, r, 8))), .35);
const dotX = (x, y, z, r = .5, c = METAL.l) => fill(pd(on(PX(x), ellUV(y, z, r, r, 8))), c) + ink(pd(on(PX(x), ellUV(y, z, r, r, 8))), .35);

const SUB = { r:20, z0:22, z1:29 }, BELT_Z = 25.5;
const MOT = { x:90, y:30, r:5, z0:9, z1:20 }, PUL = { r:2.3, z0:24.4, z1:26.6 };
const BRG = { r:4, z1:14 }, PIN = { r:3, z0:15, z1:17 };
const U_ARM = norm([PV[0] - CX, PV[1] - CY, 0]);                                      // spindle -> tonearm pillar
const CAMC = [CX + U_ARM[0]*15, CY + U_ARM[1]*15], CAM = { r:12, z0:15, z1:17 };        // cam gear meshes the pinion: 12 + 3 = 15
const U_SL = norm([PV[0] - CAMC[0], PV[1] - CAMC[1], 0]), SL_D = Math.hypot(PV[0] - CAMC[0], PV[1] - CAMC[1]);
const SL = { z0:10, z1:11, hw:1.2, L:60 };
const PRE = [3, 100, 9, 22, 124, 10.5], PWR = [4, 28, 9, 22, 50, 10.5];
const CTL = [113, 6, 8, 114.5, 46, 27], DSP = [114.5, 50, 7, 116, 106, 26];
const PCB = { l:'#4fa36a', m:'#2f8a4a', d:'#1d5f31' }, GEARM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' };
const BRASS = matOf('#e2b45a'), RUBBER = matOf('#3a3632'), CHIP = matOf('#2a2622'), PLAST = matOf('#e8e4da'), LIVE = matOf('#ff9a3a');
let CAM_ACC = 0, CAM_RAW = null, SUB_SVG = '';
function rpMech(st){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .7) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const cy = (x, y, z0, z1, r, m, w = .8, n = 20) => put([[x - r, y - r, z0], [x + r, y + r, z1]], cyl(x, y, z0, z1, r, m, toneI, w, n));
  const motorOn = st.motor > .05, playing = st.phase === 'playing', moving = st.phase === 'moving';
  const H_ = '#3a3632', Hon = '#ffb347';
  // ---- drive: bearing, spindle, sub-platter, motor, pulley, belt
  cy(CX, CY, 4, 5.5, 7, GEARM, .8, 24);
  let fl = ''; for (const a of [90, 210, 330]) fl += dotZ(CX + 5.4*Math.cos(a*Math.PI/180), CY + 5.4*Math.sin(a*Math.PI/180), 5.55);
  put([[CX - 7, CY - 7, 5.5], [CX + 7, CY + 7, 5.6]], fl);
  put([[CX - BRG.r, CY - BRG.r, 5.5], [CX + BRG.r, CY + BRG.r, BRG.z1]], cyl(CX, CY, 5.5, BRG.z1, BRG.r, BRASS, toneI, .8, 20) + (facing([1,0,0]) ? dotX(CX + BRG.r - .3, CY, 11, .45, '#3a3632') : ''));
  cy(CX, CY, BRG.z1, SUB.z0, 1.4, METAL, .6, 12);                                                   // spindle, bearing to sub-platter
  put([[CX - PIN.r, CY - PIN.r, PIN.z0], [CX + PIN.r, CY + PIN.r, PIN.z1]], gearSvg(CX, CY, PIN.z0, PIN.z1, PIN.r, 10, BRASS, st.spin));
  let sub = cyl(CX, CY, SUB.z0, SUB.z1, SUB.r, PLAT, toneI, 1, 40);
  const [g0, g1] = nearHalf(); const groove = arcUV(CX, CY, SUB.r + .02, g0, g1, 30);
  sub += line(groove.map(([x, y]) => [x, y, BELT_Z - .9]), .45) + line(groove.map(([x, y]) => [x, y, BELT_Z + .9]), .45);
  for (let i = 0; i < 3; i++){ const a = st.spin + i*120; sub += shape(on(PZ(SUB.z1 + .05), ellUV(CX + 12*Math.cos(a*Math.PI/180), CY + 12*Math.sin(a*Math.PI/180), 3, 3, 14)), '#5c6369', .5); }
  sub += cyl(CX, CY, SUB.z1, H, 1.4, METAL, toneI, .5, 12);                                          // spindle on up through the deck
  SUB_SVG = sub;
  // motor hangs from its bracket; bracket on two posts with rubber grommets to the underside of the deck
  put([[MOT.x - MOT.r, MOT.y - MOT.r, MOT.z0], [MOT.x + MOT.r, MOT.y + MOT.r, MOT.z1]], cyl(MOT.x, MOT.y, MOT.z0, MOT.z1, MOT.r, motorOn ? LIVE : GEARM, toneI, .9, 22)
    + ink(pd(on(PZ(MOT.z0 + 2), arcUV(MOT.x, MOT.y, MOT.r, ...nearHalf(), 16)), false), .4));
  bx(MOT.x - 7, MOT.y - 7, MOT.z1, MOT.x + 7, MOT.y + 7, MOT.z1 + 1, METAL, .7);
  for (const [dx, dy] of [[-6, -6], [6, 6]]){ cy(MOT.x + dx, MOT.y + dy, MOT.z1 + 1, H, .8, METAL, .5, 10); cy(MOT.x + dx, MOT.y + dy, MOT.z1 + 1, MOT.z1 + 2.6, 1.7, RUBBER, .6, 14); }
  cy(MOT.x, MOT.y, MOT.z1 + 1, PUL.z1 + .6, .45, METAL, .4, 8);
  const pulSvg = cyl(MOT.x, MOT.y, PUL.z0, PUL.z1, PUL.r, BRASS, toneI, .7, 16)
    + ink(pd(on(PZ((PUL.z0 + PUL.z1)/2), arcUV(MOT.x, MOT.y, PUL.r, ...nearHalf(), 10)), false), .35)
    + line([[MOT.x, MOT.y, PUL.z1 + .02], [MOT.x + 1.9*Math.cos(st.spin*.15), MOT.y + 1.9*Math.sin(st.spin*.15), PUL.z1 + .02]], .4);
  const loop = beltLoop([CX, CY], SUB.r + .35, [MOT.x, MOT.y], PUL.r + .35).map(([x, y]) => [x, y, BELT_Z]);
  const bp = wireParts([...loop, loop[0]], motorOn ? Hon : '#3a3632', .45, false, 0, 3), bk = { s:'', p:'' }, fr = { s:'', p:'' };
  for (const pc of bp){ const m = boxMid(pc.box), dS = Math.hypot(m[0] - CX, m[1] - CY), dP = Math.hypot(m[0] - MOT.x, m[1] - MOT.y);
    const [cx0, cy0, rr, key] = dS - SUB.r < dP - PUL.r ? [CX, CY, SUB.r, 's'] : [MOT.x, MOT.y, PUL.r, 'p'], dd = Math.hypot(m[0] - cx0, m[1] - cy0);
    const q = [cx0 + (m[0] - cx0)/dd*rr, cy0 + (m[1] - cy0)/dd*rr, BELT_Z];
    (depthOf([m[0], m[1], BELT_Z]) < depthOf(q) ? bk : fr)[key] += pc.svg; }
  put([[CX - SUB.r - 1, CY - SUB.r - 1, SUB.z0], [CX + SUB.r + 1, CY + SUB.r + 1, SUB.z1]], bk.s + SUB_SVG + fr.s);
  put([[MOT.x - PUL.r - 1, MOT.y - PUL.r - 1, PUL.z0], [MOT.x + PUL.r + 1, MOT.y + PUL.r + 1, PUL.z1]], bk.p + pulSvg + fr.p);
  // ---- auto mechanism: pinion -> mutilated cam gear -> crank pin -> return bar -> arm lever; lift cam -> slider -> wedge -> pushrod
  const raw = 180*Math.min(1, Math.max(0, st.ang/A_OUT)) + 180*(1 - st.lift);
  if (CAM_RAW != null) CAM_ACC += Math.abs(raw - CAM_RAW); CAM_RAW = raw;
  const camA = Math.atan2(-U_SL[1], -U_SL[0])*180/Math.PI + 180 + CAM_ACC;                 // crank pin starts on the pillar side
  cy(CAMC[0], CAMC[1], 4, 6, 2.6, GEARM, .7, 16);                                            // boss on the floor
  cy(CAMC[0], CAMC[1], 6, SL.z0 - .2, 1.2, METAL, .5, 10);                                    // stud
  const e = .5 + 2*st.lift, cc = [CAMC[0] + U_SL[0]*e, CAMC[1] + U_SL[1]*e];                 // lift cam: an eccentric disc
  put([[cc[0] - 5, cc[1] - 5, SL.z0 - .2], [cc[0] + 5, cc[1] + 5, SL.z1 + .6]], cyl(cc[0], cc[1], SL.z0 - .2, SL.z1 + .6, 5, GEARM, toneI, .8, 24));
  cy(CAMC[0], CAMC[1], SL.z1 + .6, CAM.z0, 2.4, GEARM, .6, 14);                               // hub up to the gear
  put([[CAMC[0] - CAM.r, CAMC[1] - CAM.r, CAM.z0], [CAMC[0] + CAM.r, CAMC[1] + CAM.r, CAM.z1]], gearSvg(CAMC[0], CAMC[1], CAM.z0, CAM.z1, CAM.r, 36, moving ? LIVE : PLAST, camA, 6)
    + dotZ(CAMC[0], CAMC[1], CAM.z1 + .03, 1.2, METAL.m));
  const cp = [CAMC[0] + 7.5*Math.cos(camA*Math.PI/180), CAMC[1] + 7.5*Math.sin(camA*Math.PI/180)];
  cy(cp[0], cp[1], CAM.z1, 21.3, .7, METAL, .5, 10);                                          // crank pin
  const th = (st.ang + Math.atan2(CAMC[1] - PV[1], CAMC[0] - PV[0])*180/Math.PI)*Math.PI/180, tip = [PV[0] + 9*Math.cos(th), PV[1] + 9*Math.sin(th)];
  // pillar under the deck: mounting nut and washer against the deck, the lever, the slot the cable leaves by
  put([[PV[0] - 2, PV[1] - 2, 13], [PV[0] + 2, PV[1] + 2, 27]], cyl(PV[0], PV[1], 13, 26.4, 2, METAL, toneI, .8, 16));
  cy(PV[0], PV[1], 26.4, 27, 5.2, METAL, .5, 24);
  cy(PV[0], PV[1], 27, H, 4.4, GEARM, .8, 6);
  put([[Math.min(PV[0], tip[0]) - 1, Math.min(PV[1], tip[1]) - 1, 18.5], [Math.max(PV[0], tip[0]) + 1, Math.max(PV[1], tip[1]) + 1, 20]], obox(PV, tip, .9, 18.5, 20, GEARM) + cyl(PV[0], PV[1], 18.5, 20, 2.6, GEARM, toneI, .7, 16));
  cy(tip[0], tip[1], 18.5, 21.3, .6, METAL, .5, 10);
  put([[Math.min(cp[0], tip[0]) - 1, Math.min(cp[1], tip[1]) - 1, 20], [Math.max(cp[0], tip[0]) + 1, Math.max(cp[1], tip[1]) + 1, 20.8]], obox(cp, tip, .8, 20, 20.8, moving ? LIVE : METAL));
  // cue lift slider on two guide posts, held against the lift cam by a return spring; wedge at its end under the pushrod
  const s0d = 5 + e, s0 = [CAMC[0] + U_SL[0]*s0d, CAMC[1] + U_SL[1]*s0d], s1 = [s0[0] + U_SL[0]*SL.L, s0[1] + U_SL[1]*SL.L];
  const along = d => [CAMC[0] + U_SL[0]*d, CAMC[1] + U_SL[1]*d];
  for (const d of [24, 46]){ const g = along(d); cy(g[0], g[1], 4, SL.z0, .8, METAL, .5, 10); }
  let sl = obox(s0, s1, SL.hw, SL.z0, SL.z1, moving ? LIVE : METAL);
  for (const d of [24, 46]){ const a = along(d - 2.5 + e), b = along(d + 2.5 + e); sl += line([[a[0], a[1], SL.z1 + .02], [b[0], b[1], SL.z1 + .02]], .45); }
  put([[Math.min(s0[0], s1[0]) - 1.5, Math.min(s0[1], s1[1]) - 1.5, SL.z0], [Math.max(s0[0], s1[0]) + 1.5, Math.max(s0[1], s1[1]) + 1.5, SL.z1]], sl);
  const wA = along(s0d + SL.L - 6), wB = s1, n2 = [-U_SL[1]*SL.hw, U_SL[0]*SL.hw], WH = 2.6;
  const wq = (p, sgn, z) => [p[0] + n2[0]*sgn, p[1] + n2[1]*sgn, z];
  let wd = shape([wq(wA, -1, SL.z1), wq(wB, -1, SL.z1), wq(wB, -1, SL.z1 + WH)], mix(METAL.m, '#000000', .1), .5) + shape([wq(wA, 1, SL.z1), wq(wB, 1, SL.z1), wq(wB, 1, SL.z1 + WH)], mix(METAL.m, '#000000', .1), .5)
    + shape([wq(wA, -1, SL.z1), wq(wA, 1, SL.z1), wq(wB, 1, SL.z1 + WH), wq(wB, -1, SL.z1 + WH)], METAL.l, .6);
  if (facing([U_SL[0], U_SL[1], 0])) wd += shape([wq(wB, -1, SL.z1), wq(wB, 1, SL.z1), wq(wB, 1, SL.z1 + WH), wq(wB, -1, SL.z1 + WH)], METAL.m, .6);
  put([[Math.min(wA[0], wB[0]) - 1.5, Math.min(wA[1], wB[1]) - 1.5, SL.z1], [Math.max(wA[0], wB[0]) + 1.5, Math.max(wA[1], wB[1]) + 1.5, SL.z1 + WH]], wd);
  const dAx = SL_D - (s0d + SL.L - 6), wh = WH*Math.max(0, Math.min(1, dAx/6));                // wedge height under the pillar axis
  cy(PV[0], PV[1], SL.z1 + wh, 13, .6, METAL, .45, 10);                                       // pushrod into the hollow pillar
  const sp0 = along(30 + e), sPost = [sp0[0] - U_SL[1]*5, sp0[1] + U_SL[0]*5];
  cy(sPost[0], sPost[1], 4, SL.z1 + .5, .8, METAL, .5, 10);
  const sA = along(20 + e);
  put([[Math.min(sA[0], sPost[0]) - 1, Math.min(sA[1], sPost[1]) - 1, SL.z1], [Math.max(sA[0], sPost[0]) + 1, Math.max(sA[1], sPost[1]) + 1, SL.z1 + 1]], coil([sA[0], sA[1], SL.z1 + .3], [sPost[0], sPost[1], SL.z1 + .3], .45, 7, .45));
  // ---- tonearm (above the deck, inside the ghosted arm): anti-skate, wires in the tube, cartridge and stylus
  const t = st.ang*Math.PI/180, c = Math.cos(t), sn = Math.sin(t);
  const [hx, hy] = head(st.ang), hz = RTZ + 3 + 9*st.lift, tubeEnd = [hx - 6*c, hy - 6*sn, hz + 1.1];
  const askA = t + Math.PI/2, ask = [PV[0] + 5*Math.cos(askA), PV[1] + 5*Math.sin(askA)], askP = [PV[0] + 7.2*Math.cos(askA + .9), PV[1] + 7.2*Math.sin(askA + .9)];
  let as = obox([PV[0], PV[1]], ask, .5, H + 2.6, H + 3.4, METAL) + cyl(askP[0], askP[1], H, H + 3.6, .6, METAL, toneI, .5, 10) + coil([ask[0], ask[1], H + 3], [askP[0], askP[1], H + 3], .5, 5, .45);
  put([[PV[0] - 8, PV[1] - 8, H], [PV[0] + 8, PV[1] + 8, H + 4]], as);
  const WC = ['#e2483d', '#f4f1e8', '#3d9a5a', '#3a6ad0'], nx = [-sn, c, 0];
  const pinsAt = i => [hx - 3.4*c + nx[0]*(i - 1.5)*.55, hy - 3.4*sn + nx[1]*(i - 1.5)*.55, hz - 2.4];
  let wr = '';
  WC.forEach((col, i) => { const o = (i - 1.5)*.32, pv = [PV[0] + nx[0]*o, PV[1] + nx[1]*o, ARMZ], te = [tubeEnd[0] + nx[0]*o, tubeEnd[1] + nx[1]*o, tubeEnd[2]];
    const path = pd([pinsAt(i), [te[0] + 2*c, te[1] + 2*sn, te[2] - 1.2], te, pv, [pv[0], pv[1], H + 5]], false);
    wr += `<path d="${path}" fill="none" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${playing ? mix(col, '#ffb347', .35) : col}" stroke-width=".45" stroke-linejoin="round"/>`; });
  put(boxOf([[PV[0], PV[1], H + 5], tubeEnd, [hx, hy, hz]]), wr);
  // cartridge under the headshell, its four pins, cantilever and diamond
  const cz0 = hz - 2.9, cartM = matOf('#c8372c');
  let ca = obox([hx - 3.6*c, hy - 3.6*sn], [hx + 1.6*c, hy + 1.6*sn], 1.5, cz0, hz - 2, cartM);
  for (let i = 0; i < 4; i++){ const p = pinsAt(i); ca += fill(pd(on(PZ(p[2]), ellUV(p[0], p[1], .22, .22, 6))), WC[i]); }
  ca += `<path d="${pd([[hx + 1.2*c, hy + 1.2*sn, cz0 + .2], [hx, hy, Math.max(RTZ + .1, cz0 - 1)]], false)}" stroke="${INK}" stroke-width=".7" fill="none"/>`;
  if (playing){ const q = P(hx, hy, RTZ + .1); ca += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="1.6" fill="#ff9a3a" stroke="${INK}" stroke-width=".4"/>`; }
  put([[hx - 4, hy - 4, RTZ], [hx + 4, hy + 4, hz - 2]], ca);
  // ---- signal: shielded cable out of the pillar's slot to the phono preamp; ground wire to the ground lug; RCA outs on the back
  bx(...PRE, PCB, .8);
  for (const [x, y] of [[5, 102], [20, 102], [5, 122], [20, 122]]) cy(x, y, 4, PRE[2], .7, BRASS, .4, 8);
  bx(9, 106, PRE[5], 13, 110, PRE[5] + 1.2, CHIP, .5); bx(9, 112, PRE[5], 13, 116, PRE[5] + 1.2, CHIP, .5);
  for (const [x, y] of [[16, 106], [18.5, 108], [16, 113]]) cy(x, y, PRE[5], PRE[5] + 2.2, .9, matOf('#3a6ad0'), .45, 10);
  bx(14, 119, PRE[5], 20, 123, PRE[5] + 2.5, PLAST, .6);                                         // tonearm connector
  bx(6.5, 121, PRE[5], 9.5, 123, PRE[5] + .6, METAL, .5);                                       // ground lug
  for (const [y, col] of [[104, '#e2483d'], [112, '#f4f1e8']]){
    bx(.5, y, PRE[5], 6, y + 5, PRE[5] + 5, CHIP, .6);
    put([[-2.2, y + .5, PRE[5] + .5], [.5, y + 4.5, PRE[5] + 4.5]], cylX(-2.2, .5, y + 2.5, PRE[5] + 2.5, 1.9, METAL, toneI, .7, 16)
      + (facing([-1,0,0]) ? shape(on(PX(-2.25), ellUV(y + 2.5, PRE[5] + 2.5, 1.2, 1.2, 12)), col, .4) + fill(pd(on(PX(-2.3), ellUV(y + 2.5, PRE[5] + 2.5, .45, .45, 8))), '#1d1a16') : ''));
  }
  parts.push(...wireParts([[PV[0] - 2, PV[1], 15], [17, PV[1], 15], [17, PV[1], 6], [17, 126, 6], [17, 126, 11.8], [17, 123.1, 11.8]], playing ? Hon : '#4a4642', .55));
  parts.push(...wireParts([[PV[0], PV[1] + 2, 14], [PV[0], 141, 14], [PV[0], 141, 6], [10, 141, 6], [10, 126, 6], [10, 126, 11.2], [8, 123.1, 11.2]], '#3d9a5a', .4));
  // ---- power: board, DC jack and switch through the back wall, regulator, cables
  bx(...PWR, PCB, .8);
  for (const [x, y] of [[6, 30], [20, 30], [6, 48], [20, 48]]) cy(x, y, 4, PWR[2], .7, BRASS, .4, 8);
  bx(.5, 31, PWR[5], 6, 37, PWR[5] + 4.5, CHIP, .6);
  put([[-1, 32, PWR[5] + .8], [.5, 36, PWR[5] + 3.7]], cylX(-1, .5, 34, PWR[5] + 2.25, 1.5, METAL, toneI, .6, 14) + (facing([-1,0,0]) ? fill(pd(on(PX(-1.05), ellUV(34, PWR[5] + 2.25, .9, .9, 10))), '#1d1a16') : ''));
  const pOn = st.motorOn || st.has;
  bx(.5, 41, PWR[5], 5, 47, PWR[5] + 3.5, CHIP, .6);
  bx(-1.2, pOn ? 41.6 : 43.4, PWR[5] + 1, .5, pOn ? 44.6 : 46.4, PWR[5] + 2.5, pOn ? LIVE : PLAST, .5);   // slide switch knob, through the wall
  bx(11, 33, PWR[5], 15, 36, PWR[5] + 3, CHIP, .5); bx(11, 36, PWR[5], 15, 37, PWR[5] + 6, METAL, .5);  // regulator and heatsink
  cy(17.5, 36, PWR[5], PWR[5] + 4, 1.4, matOf('#3a6ad0'), .5, 12);
  bx(18, 44, PWR[5], 21, 48, PWR[5] + 2.5, PLAST, .6); bx(6, 47, PWR[5], 10, 50, PWR[5] + 2.5, PLAST, .6);
  parts.push(...wireParts([[21.1, 46, 11.8], [25, 46, 11.8], [26, 46, 5], [26, 11, 5], [109, 11, 5], [109, 11, 10], [111.4, 11, 10]], pOn ? '#c2300a' : '#7a2a18', .55));
  parts.push(...wireParts([[8, 50.1, 11.8], [8, 53, 11.8], [8, 54, 5], [8, 97, 5], [8, 97, 11.8], [8, 99.9, 11.8]], pOn ? '#c2300a' : '#7a2a18', .5));
  bx(6, 100, PRE[5], 10, 103, PRE[5] + 2.5, PLAST, .6);
  // ---- control board behind the front: speed switches behind the keys, LEDs, trim pots, driver, connectors; display
  for (const y of [13, 42]) bx(110.5, y, 4, 113, y + 2, CTL[2], METAL, .5);
  bx(...CTL, PCB, .8);
  for (const k of [33, 45]){ const [u0, v0, u1, v1] = BTN_UV[k], yc = D - (u0 + u1)/2, zc = H - (v0 + v1)/2, pr = st.press && st.press.k === k;
    bx(CTL[3], yc - 2.2, zc - 2.2, CTL[3] + 2.4, yc + 2.2, zc + 2.2, pr ? LIVE : CHIP, .5);
    put([[CTL[3] + 2.4, yc - .8, zc - .8], [W - .3, yc + .8, zc + .8]], cylX(CTL[3] + 2.4, W - .3 - (pr ? 0 : .6), yc, zc, .8, METAL, toneI, .45, 10));
    const lz = H - 20.5, lit = st.rpm === k;
    put([[CTL[3], yc - .7, lz - .7], [W - .3, yc + .7, lz + .7]], cylX(CTL[3], W - .3, yc, lz, .7, lit ? matOf('#ffc77a') : matOf('#c9c1b2'), toneI, .4, 10)); }
  for (const [y, z] of [[20, 12], [30, 12]]) put([[CTL[0] - 1.2, y - 1.6, z - 1.6], [CTL[0], y + 1.6, z + 1.6]], box(CTL[0] - 1.2, y - 1.6, z - 1.6, CTL[0], y + 1.6, z + 1.6, matOf('#3a6ad0'), toneI, .5)
    + (facing([-1,0,0]) ? line([[CTL[0] - 1.25, y - 1, z], [CTL[0] - 1.25, y + 1, z]], .5) : ''));
  bx(CTL[0] - 1, 18, 18, CTL[0], 26, 23, motorOn ? LIVE : CHIP, .5);                            // motor driver
  bx(CTL[0] - 1.5, 9, 8.5, CTL[0], 13, 11.5, PLAST, .5); bx(CTL[0] - 1.5, 36, 8.5, CTL[0], 40, 11.5, PLAST, .5);
  parts.push(...wireParts([[MOT.x, MOT.y + 3, MOT.z0], [MOT.x, MOT.y + 3, 5], [MOT.x, 38, 5], [109, 38, 5], [109, 38, 10], [111.4, 38, 10]], motorOn ? Hon : H_, .5));
  bx(CTL[3], 46, 19, CTL[3] + .4, DSP[1], 23, matOf('#c9c1b2'), .4);                            // ribbon
  bx(...DSP, PCB, .7);
  bx(DSP[3], 53, 9, W - .4, 103, 24, st.has ? matOf('#7d8e90') : matOf('#5f6c6e'), .6);         // LCD module
  return byDepth(parts);
}
function beltLoop(c1, r1, c2, r2){ const d = [c2[0]-c1[0], c2[1]-c1[1]], L = Math.hypot(...d), ph = Math.atan2(d[1], d[0]), be = Math.acos((r1 - r2)/L), out = [];
  for (let i = 0; i <= 8; i++){ const a = ph + be - 2*be*i/8; out.push([c2[0] + r2*Math.cos(a), c2[1] + r2*Math.sin(a)]); }
  for (let i = 0; i <= 40; i++){ const a = ph - be - (2*Math.PI - 2*be)*i/40; out.push([c1[0] + r1*Math.cos(a), c1[1] + r1*Math.sin(a)]); }
  return out; }
const XR_OPTS = { getSt: () => { try { return rpUI.st; } catch (e) { return {}; } }, B: [0, W, 0, D, 0, 56],
  mech: () => '', over: (st, k) => `<g opacity="${f(k)}">${rpMech(st)}</g>`,
  inside: st => { const on = st.motor > .05, pl = st.phase === 'playing', mv = st.phase === 'moving';
    const [hx, hy] = head(st.ang), hz = RTZ + 3 + 9*st.lift, sl = [CAMC[0] + U_SL[0]*30, CAMC[1] + U_SL[1]*30];
    return [ { at:[MOT.x, MOT.y - MOT.r, 14], text:'MOTOR', on },
      { at:[(CX + MOT.x)/2 + 4, (CY + MOT.y)/2 + 6, BELT_Z], text:'BELT', on },
      { at:[CX + BRG.r, CY, 10], text:'MAIN BEARING', on },
      { at:[CAMC[0] - CAM.r, CAMC[1], CAM.z1], text:'CAM GEAR', on: mv },
      { at:[sl[0], sl[1], SL.z1], text:'CUE LIFT', on: mv },
      { at:[hx - c3(st.ang), hy, hz - 2.5], text:'CARTRIDGE', on: pl },
      { at:[(PV[0] + hx)/2, (PV[1] + hy)/2, (ARMZ + hz)/2 + 1], text:'TONEARM WIRES', on: pl },
      { at:[PRE[3], 110, PRE[5]], text:'PHONO PREAMP', on: pl },
      { at:[-2.2, 108, PRE[5] + 2.5], text:'RCA OUTS', on: pl },
      { at:[CTL[3] + 2, D - (BTN_UV[33][0] + BTN_UV[45][2])/2, H - 7], text:'SPEED SWITCHES', on: !!st.press },
      { at:[-1, 44, PWR[5] + 2], text:'POWER SWITCH', on: !!(st.motorOn || st.has) } ]; } };
const c3 = a => 1.2*Math.cos(a*Math.PI/180);
const XR_CAPTION = st => {
  const ph = st.phase;
  if (st.press) return `The ${st.rpm} key presses a speed switch on the control board, which sets the motor’s voltage; a trim pot for each speed sets it exactly.`;
  if (ph === 'playing') return `${st.rpm} rpm: the motor’s pulley pulls the belt round the sub-platter, which turns the platter on the main bearing’s spindle. The cartridge’s signal runs down four tonearm wires to the phono preamp and out at the RCA jacks.`;
  if (ph === 'moving') return 'The spindle’s pinion turns the cam gear once. Its crank pin pushes the return bar to swing the arm, and the lift cam slides the cue lift, whose wedge raises or lowers the pushrod in the pillar.';
  if (ph === 'ready') return 'Ready: the arm rests on the cue lift. The power switch on the back feeds the power board, which runs the control board and the phono preamp.';
  return 'Inside the plinth: a motor turns the sub-platter by a rubber belt, a cam gear works the arm, and the phono preamp boosts the cartridge’s signal for the RCA jacks on the back.';
};

XR_OPTS.under = true;
scene = xrWrap(scene, XR_OPTS);
rpUI = mountFigure({
  fig:'23', turn:'full', title:'Record player', hint:'Put on a record · drop the needle',
  size:[W, D, 56], palette:'cobalt',
  state:{ has:false, up:1, ang:0, lift:1, prog:0, spin:0, motor:0, motorOn:false, rpm:33, phase:'empty', t:0, notes:[], tw:[], press:null },
  scene,
  readout: st => !st.has ? 'no record' : st.phase,
  buttons:[
    { label:'Put on a record', onClick:(st) => putOn(st) },
    { label:'Drop the needle', onClick:(st) => drop(st, true) },
    { label:'33 / 45', onClick:(st) => speed(st) },
    { label:'Lift the needle', onClick:(st, ui) => st.phase === 'playing' ? lift(st) : ui.flash(st.has ? 'the needle is already up' : 'no record on the platter') },
    { label:'Take the record off', onClick:(st, ui) => st.has ? takeOff(st) : ui.flash('there is no record to take off') },
  ],
  acts:{
    b33:(st) => { if (st.rpm !== 33) speed(st); },
    b45:(st) => { if (st.rpm !== 45) speed(st); },
    rec:(st) => { if (st.phase === 'ready') drop(st, true); },
    arm:(st) => st.phase === 'playing' ? lift(st) : drop(st, true),
  },
  params:(st, q) => {
    if (q.get('rpm') === '45') st.rpm = 45;
    if (q.get('rec') === '1'){ st.has = true; st.up = 0; st.phase = 'ready'; }
    if (q.has('up')){ st.has = true; st.up = +q.get('up'); st.phase = st.up > 0 ? 'loading' : 'ready'; }
    if (q.has('play')){ st.has = true; st.up = 0; st.phase = 'playing'; st.motorOn = true; st.motor = 1; st.lift = 0;
      st.prog = Math.min(1, +q.get('play') || 0); st.ang = A_OUT + (A_IN - A_OUT)*st.prog; }
    if (q.has('ang')) st.ang = +q.get('ang');
    if (q.has('lift')) st.lift = +q.get('lift');
  },
});
stPal = () => rpUI.st.pal;
kick();
addEventListener('keydown', e => {
  if (/input|textarea|button/i.test(e.target.tagName)) return;
  const st = rpUI.st, k = e.key.toLowerCase();
  if (k === ' ' || k === 'enter'){ e.preventDefault(); st.phase === 'playing' ? lift(st) : drop(st, true); }
  else if (k === 'r') putOn(st);
  else if (k === 's') speed(st);
  else return;
  rpUI.render();
});
xrMount(() => rpUI, XR_CAPTION);