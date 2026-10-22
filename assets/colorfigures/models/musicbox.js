/* Music box (port of Colorfigures 2.0 kids/musicbox.js to the 1.0 engine with the free camera).
   An open box (lid tilted back with a mirror inside), a glass cover over the movement: a brass drum along y,
   studded with pins that spell "Twinkle Twinkle", and a steel comb whose teeth get shorter toward the front.
   The crank on the +y side turns the drum; each pin that reaches a tooth flicks it, lights it and plays a note.
   x = depth (front face at x = W), y = width, z = up. The lid hangs behind the box (x < 0). */

/* ---------- geometry (same numbers as the 2.0 figure) ---------- */
const W = 72, D = 136, Z0 = 4, HB = 40, HT = Z0 + HB, WT = 5, FL = Z0 + 4;   // depth, width, plate, body height, wall, floor
const YO = 96;                                               // the glass opening spans y WT..YO; the deck behind it holds the dancer
const LA = 105 * Math.PI / 180, LCA = Math.cos(LA), LSA = Math.sin(LA), LTH = 3;   // lid opened past upright
const LX = W * LCA, LZ = HT + W * LSA;                       // free edge of the lid
const DCX = 20, DZC = HT - 9.5, DR = 8;                      // drum axis (along y) and radius
const NOTES = ['C','D','E','F','G','A','B','C'], FREQ = [523.25,587.33,659.25,698.46,783.99,880,987.77,1046.5];
const TY = NOTES.map((_, i) => 14 + i * 9.5);                // tooth centres along y (low notes at the back)
const TL = NOTES.map((_, i) => 32 - 2.9 * i);                // tooth lengths: long = low, short = high
const TIP = DCX + DR + .4, XB = TIP + TL[0] + 4, TW = 2.7;   // tip line, outer edge of the comb base, half tooth width
const LINE_A = [0,0,4,4,5,5,4,-1, 3,3,2,2,1,1,0,-1], LINE_B = [4,4,3,3,2,2,1,-1, 4,4,3,3,2,2,1,-1];
const SONG = [...LINE_A, ...LINE_B, ...LINE_A], SN = SONG.length, DEG = 360 / SN;   // one pin slot per beat, one turn = the song
const BEAT = 360, BPT = 4;                                   // ms per beat; beats per crank turn
const KX = W / 2, KZ = Z0 + 18, KR = 12, KY = D + 6;         // crank shaft centre on the y = D face, arm radius
const DX = 36, DY = 116;                                     // dancer
const CZ0 = DZC - 4, CYA = TY[0] - 5, CYB = TY[7] + 5, CRA = TIP + TL[0], CRB = TIP + TL[7];   // comb base
const OFFX = 22, OFFY = 6;                                   // the model reaches x = -22 (lid) and y = -6 (plate)

/* ---------- materials ---------- */
const ACC = '#ff9a2e', ACC_HI = '#ffc77a';
const PLATE = { l:'#ddd8ca', m:'#cbc5b6', d:'#b9b3a4' };
const VELVET = { l:'#8e3b52', m:'#7a3246', d:'#5e2535' }, FLOOR_C = '#6d2a3e';
const BRASS = { l:'#ecc566', m:'#d9a53c', d:'#a8792a' }, CRANKM = matOf('#c99a3a'), KNOBM = { l:'#a9764f', m:'#8a5a3c', d:'#5f3c27' };
const STEEL = { l:'#d9dddd', m:'#b9c0c3', d:'#9ea6a9' }, RISER = matOf('#7d6a52'), BEAR = matOf('#b9c0c3');
const CREAMM = { l:'#fff4d6', m:'#e9dcb6', d:'#c9bb92' }, SKIN = matOf('#f2d6c4'), SHOE = matOf('#d8869c'), LILAC = matOf('#c9b6f2');
const TOOTH_C = '#d3d9db', PIN_C = '#3a3226', ARM_C = '#e8bfa6';

/* ---------- helpers ---------- */
// convex prism between two rings A and B (same length): visible side faces + visible caps, each inked
function prism(A, B, m, shade=toneI, w=.9){
  const cen = avg(A.concat(B)), n = A.length, faces = [];
  for (let i = 0; i < n; i++){
    const q = [A[i], A[(i+1)%n], B[(i+1)%n], B[i]];
    let nr = norm(cross(sub(q[1], q[0]), sub(q[3], q[0])));
    if (dot(nr, sub(avg(q), cen)) < 0) nr = nr.map(v => -v);
    faces.push([nr, q]);
  }
  for (const cap of [A, B]){
    let nr = norm(cross(sub(cap[1], cap[0]), sub(cap[2], cap[0])));
    if (dot(nr, sub(avg(cap), cen)) < 0) nr = nr.map(v => -v);
    faces.push([nr, cap]);
  }
  return faces.filter(([nr]) => vis(nr)).map(([nr, q]) => shape(q, shade(nr, m), w)).join('');
}
const prismZ = (plan, z0, z1, m, shade, w) => prism(plan.map(([x,y]) => [x,y,z0]), plan.map(([x,y]) => [x,y,z1]), m, shade, w);
// cubic bezier in a plane's (u,v) coords, sampled
const bez = (a, b, c, d, n=12) => Array.from({length:n+1}, (_, i) => { const t = i/n, s = 1-t;
  return [0,1].map(k => s*s*s*a[k] + 3*s*s*t*b[k] + 3*s*t*t*c[k] + t*t*t*d[k]); });

/* ---------- the lid: a slab hinged at the back top edge (x = 0, z = HT) ---------- */
// u = along y (0..D), v = from the free edge toward the hinge (0..W), k = into the lid (0..LTH)
const lidP = (u, v, k=0) => [LX - v*LCA - k*LSA, u, LZ - v*LSA + k*LCA];
const N_IN = [LSA, 0, -LCA], N_FREE = [LCA, 0, LSA];
const lidCorners = () => [0, D].flatMap(u => [0, W].flatMap(v => [0, LTH].map(k => lidP(u, v, k))));
function lid(m){
  const F = [
    [N_IN,               [lidP(0,0),lidP(D,0),lidP(D,W),lidP(0,W)], 'in'],
    [N_IN.map(v => -v),  [lidP(0,0,LTH),lidP(D,0,LTH),lidP(D,W,LTH),lidP(0,W,LTH)], 'out'],
    [N_FREE,             [lidP(0,0),lidP(D,0),lidP(D,0,LTH),lidP(0,0,LTH)], 'e'],
    [N_FREE.map(v => -v),[lidP(0,W),lidP(D,W),lidP(D,W,LTH),lidP(0,W,LTH)], 'e'],
    [[0,-1,0],           [lidP(0,0),lidP(0,W),lidP(0,W,LTH),lidP(0,0,LTH)], 'e'],
    [[0,1,0],            [lidP(D,0),lidP(D,W),lidP(D,W,LTH),lidP(D,0,LTH)], 'e'] ];
  let s = '';
  for (const [n, q, kind] of F){
    if (!vis(n)) continue;
    if (kind === 'in'){
      // inside of the lid: pale face, velvet panel, oval mirror with a streak
      s += shape(q, mix(tone(n, m), '#ffffff', .35), 1);
      const pl = ([u, v]) => lidP(u, v, -.05);
      s += shape(rrUV(6, 6, D-6, W-6, 3).map(pl), '#8e3b52', 1.1);
      const mir = ellUV(D/2, W/2, 34, 22, 40).map(pl);
      s += shape(mir, '#e3eaec', 1.1);
      s += clipTo(mir, fill(pd([[D/2-22, W/2+12],[D/2-6, W/2-19],[D/2+2, W/2-19],[D/2-14, W/2+14]].map(pl)), '#ffffff', 'opacity=".38"'));
    } else s += shape(q, tone(n, m), kind === 'out' ? 1 : .9);
  }
  return s + hullInk(lidCorners(), 2.4);
}

/* ---------- the movement under the glass ---------- */
function pinsNow(st){
  const out = [];
  for (let s = 0; s < SN; s++){
    const n = SONG[s]; if (n < 0) continue;
    let a = (((s - st.pos) % SN) + SN) % SN * DEG; if (a > 180) a -= 360;
    const r = a * Math.PI / 180, c = Math.cos(r), si = Math.sin(r), rv = rotV([c, 0, si]);
    if (rv[0] + rv[1] + rv[2] < .08) continue;                               // on the hidden side of the drum
    const hot = performance.now() - st.hot[n] < 260 && Math.abs(a) < 12;
    const svg = `<path d="${pd([[DCX + DR*c, TY[n], DZC + DR*si],[DCX + (DR+2.2)*c, TY[n], DZC + (DR+2.2)*si]], false)}" fill="none" stroke="${hot ? ACC : PIN_C}" stroke-width="2.4" stroke-linecap="round"/>`;
    const zone = DCX + (DR+2.2)*c > TIP;                                      // reaches over the tooth tips
    out.push({ svg, zone, above: si > 0 });
  }
  return out;
}
function drumSide(st, pins){
  const fy = facing([0,1,0]), turn = -st.pos * DEG, sp = (turn + 30) * Math.PI / 180, ye = fy ? 88.05 : 7.95;
  const drum = rod([DCX, 8, DZC], [DCX, 88, DZC], DR, BRASS, toneI, 1.2, DR, 28)
    + pins.filter(p => !p.zone).map(p => p.svg).join('')
    + ink(pd([[DCX, ye, DZC],[DCX + DR*.8*Math.cos(sp), ye, DZC + DR*.8*Math.sin(sp)]], false), 1.1);
  const back = box(DCX-4, 5.5, FL, DCX+4, 8, DZC+3, BEAR, toneI, .9);
  const front = box(DCX-4, 88, FL, DCX+4, 90.5, DZC+3, BEAR, toneI, .9);
  return fy ? back + drum + front : front + drum + back;
}
function teeth(st){
  const now = performance.now();
  let s = '';
  NOTES.forEach((_, i) => {
    const age = now - st.hot[i], k = age < 1400 ? Math.exp(-age / 260) : 0;
    const lift = k * 1.6 * Math.cos(age / 22), x0 = TIP, x1 = TIP + TL[i], y = TY[i], hot = age < 380;
    s += `<path d="${pd([[x1, y - TW, DZC + .05],[x1, y + TW, DZC + .05],[x0, y + TW, DZC + lift],[x0, y - TW, DZC + lift]])}" fill="${hot ? ACC : TOOTH_C}" stroke="${hot ? ACC_HI : INK}" stroke-width=".9" stroke-linejoin="round"/>`;
    const q = P(x1 - 3.5, y, DZC);
    s += `<text x="${f(q[0])}" y="${f(q[1] + 1)}" text-anchor="middle" font-size="3.2" font-weight="800" fill="${INK}" font-family="ui-monospace,Menlo,monospace">${NOTES[i]}</text>`;
  });
  return s;
}
function combSide(st, pins){
  const riser = box(XB - 6, CYA, FL, XB + 2, CYB, CZ0, RISER, toneI, .9);
  const base = prismZ([[CRA, CYA],[XB, CYA],[XB, CYB],[CRB, CYB]], CZ0, DZC, STEEL, toneI, 1);
  const zone = pins.filter(p => p.zone);
  const tth = zone.filter(p => !p.above).map(p => p.svg).join('') + teeth(st) + zone.filter(p => p.above).map(p => p.svg).join('');
  // the teeth end at the slanted root line of the base: whichever side of it faces the viewer is drawn last
  const toTeeth = [-(CYB - CYA), CRB - CRA, 0].map(v => -v);   // horizontal normal of the root line, pointing at the teeth
  const nT = dot(toTeeth, [CRA - XB, 0, 0]) > 0 ? toTeeth : toTeeth.map(v => -v);
  return riser + (vis(nT) ? base + tth : tth + base);
}
function movement(st){
  const opening = [[WT,WT,HT],[W-WT,WT,HT],[W-WT,YO,HT],[WT,YO,HT]];
  let s = fill(pd([[WT,WT,FL],[W-WT,WT,FL],[W-WT,YO,FL],[WT,YO,FL]]), FLOOR_C);
  const walls = [
    [[1,0,0],  [[WT,WT,FL],[WT,YO,FL],[WT,YO,HT],[WT,WT,HT]]],
    [[-1,0,0], [[W-WT,WT,FL],[W-WT,YO,FL],[W-WT,YO,HT],[W-WT,WT,HT]]],
    [[0,1,0],  [[WT,WT,FL],[W-WT,WT,FL],[W-WT,WT,HT],[WT,WT,HT]]],
    [[0,-1,0], [[WT,YO,FL],[W-WT,YO,FL],[W-WT,YO,HT],[WT,YO,HT]]] ];
  for (const [n, q] of walls) if (vis(n)) s += shape(q, tone(n, VELVET), .8);
  const pins = pinsNow(st), a = drumSide(st, pins), b = combSide(st, pins);
  s += facing([1,0,0]) ? a + b : b + a;                                         // the plane x = TIP separates drum and comb
  // glass: tint, two streaks, the rim
  const gp = ([u, v]) => [WT + u, WT + v, HT];
  const gw = W - 2*WT, gh = YO - WT;
  let g = fill(pd(opening), '#cfe9f0', 'opacity=".22"');
  g += fill(pd([[6, gh],[gw-30, 0],[gw-22, 0],[14, gh]].map(gp)), '#ffffff', 'opacity=".38"');
  g += fill(pd([[24, gh],[gw-10, 8],[gw-10, 13],[30, gh]].map(gp)), '#ffffff', 'opacity=".38"');
  return clipTo(opening, s + `<g pointer-events="none">${g}</g>`) + ink(pd(opening), 1.3);
}

/* ---------- the box ---------- */
function body(st, m){
  const sides = [
    [[1,0,0],  [[W,0,Z0],[W,D,Z0],[W,D,HT],[W,0,HT]]],
    [[-1,0,0], [[0,0,Z0],[0,D,Z0],[0,D,HT],[0,0,HT]]],
    [[0,1,0],  [[0,D,Z0],[W,D,Z0],[W,D,HT],[0,D,HT]]],
    [[0,-1,0], [[0,0,Z0],[W,0,Z0],[W,0,HT],[0,0,HT]]] ];
  let s = '';
  for (const [n, q] of sides){
    if (!vis(n)) continue;
    const c = tone(n, m);
    s += shape(q, c, .9);
    if (n[0] === 1){
      // lit front: wood panel with grain + the "turn the crank" plaque
      const fp = ([u, v]) => [W + .05, D - u, HT - v];
      s += shape(rrUV(6, Z0 + 5, D - 6, HT - 5, 3).map(([y, z]) => [W + .05, y, z]), mix(c, m.d, .14), 1);
      s += `<path d="${pd(bez([12,12],[40,10],[70,15],[124,11]).map(fp), false)}${pd(bez([12,30],[50,33],[90,27],[124,31]).map(fp), false)}" fill="none" stroke="${INK}" stroke-width="1.1" opacity=".28"/>`;
      const hot = performance.now() - st.btnHot < 260;
      s += act('btn', shape(rrUV(34, HT - 27, 102, HT - 13, 4).map(([y, z]) => [W + .1, y, z]), hot ? ACC : '#fff4d6', 1.1)
        + tx(W + .15, D - 68, HT - 22.3, 'TURN THE CRANK', 5.6, INK, 800));
    }
    if (n[1] === 1) s += shape(on(PY(D + .05), ellUV(KX, KZ, 5, 5, 20)), CRANKM.m, 1);   // brass plate behind the crank
  }
  s += movement(st);
  // top deck around the glass
  const top = [[0,0,HT],[W,0,HT],[W,D,HT],[0,D,HT]], hole = [[WT,WT,HT],[W-WT,WT,HT],[W-WT,YO,HT],[WT,YO,HT]];
  s += `<path d="${pd(top)}${pd(hole)}" fill="${tone([0,0,1], m)}" fill-rule="evenodd"/>` + ink(pd(top), .9);
  return s + hullInk([0, W].flatMap(x => [0, D].flatMap(y => [Z0, HT].map(z => [x, y, z]))), 2.6);
}

/* ---------- the crank on the y = D side ---------- */
function crank(st){
  const ph = -st.pos / BPT * 2 * Math.PI, ex = KX + KR*Math.cos(ph), ez = KZ + KR*Math.sin(ph), ux = -Math.sin(ph)*2.4, uz = Math.cos(ph)*2.4;
  const ring = y => [[KX+ux, y, KZ+uz],[ex+ux, y, ez+uz],[ex-ux, y, ez-uz],[KX-ux, y, KZ-uz]];
  const parts = [
    rod([KX, D, KZ], [KX, KY - .8, KZ], 2.2, CRANKM, toneI, 1),
    prism(ring(KY - .7), ring(KY + .5), CRANKM, toneI, 1),
    rod([KX, KY - 1, KZ], [KX, KY + .8, KZ], 3, CRANKM, toneI, 1),
    rod([ex, KY + .5, ez], [ex, KY + 9, ez], 2.4, KNOBM, toneI, 1.1) ];
  if (!facing([0,1,0])) parts.reverse();
  const hot = performance.now() - st.crankHot < 260;
  return act('crank', `<g${hot ? ' opacity=".75"' : ''}>${parts.join('')}</g>`);
}

/* ---------- the dancer on her turntable ---------- */
function dancer(st){
  const z = HT + 1.6, th = st.spin * Math.PI / 180;
  let s = cyl(DX, DY, HT, z, 9, CREAMM, toneI, 1.1, 28);
  s += cyl(DX, DY, z, z + 9.5, .8, SKIN, toneI, .8, 12) + cyl(DX, DY, z, z + 1.2, 1.6, SHOE, toneI, .8, 14);
  const ringAt = (zz, r) => on(PZ(zz), ellUV(DX, DY, r, r, 24));
  const tut = [...ringAt(z + 9, 7.5), ...ringAt(z + 11.5, 2.2)];
  s += fill(sp(hull(tut.map(p => P(...p)))), LILAC.l) + hullInk(tut, 1.1);
  s += ink(pd([[DX, DY, z + 11.5],[DX + 7.5*Math.cos(th + 1.2), DY + 7.5*Math.sin(th + 1.2), z + 9]], false), 1);
  // arms curve up over the head (fifth position); the far one goes behind the body
  const arm = k => { const ax = Math.cos(th)*k, ay = Math.sin(th)*k;
    return { at: [DX + ax*3, DY + ay*3, z + 18], svg: `<path d="${pd([[DX + ax*1.6, DY + ay*1.6, z + 16],[DX + ax*4.2, DY + ay*4.2, z + 18.5],[DX + ax*1.8, DY + ay*1.8, z + 22]], false)}" fill="none" stroke="${ARM_C}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>` }; };
  const arms = [arm(1), arm(-1)].sort((a, b) => depthOf(a.at) - depthOf(b.at));
  s += arms[0].svg + cyl(DX, DY, z + 11, z + 16.5, 1.7, LILAC, toneI, .9, 14);
  const hc = [DX, DY, z + 19.5], bc = [DX - .8*Math.cos(th), DY - .8*Math.sin(th), z + 21.3], h = P(...hc), b = P(...bc);
  const head = `<circle cx="${f(h[0])}" cy="${f(h[1])}" r="2.4" fill="${SKIN.l}" stroke="${INK}" stroke-width=".9"/>`;
  const bun = `<circle cx="${f(b[0])}" cy="${f(b[1])}" r="1.3" fill="#5a3a2a" stroke="${INK}" stroke-width=".6"/>`;
  s += depthOf(bc) < depthOf(hc) - .3 ? bun + head : head + bun;
  return s + arms[1].svg;
}

/* ---------- scene ---------- */
function scene(st, m){
  let s = board(-6, -6, W + 6, D + 6, Z0, 6, PLATE);
  const boxPts = [0, W].flatMap(x => [0, D].flatMap(y => [Z0, HT].map(z => [x, y, z])));
  s += castShadow([...boxPts, ...lidCorners()], Z0, boardTop(-6, -6, W + 6, D + 6, Z0, 6));
  // three planes keep the big parts apart in every view: x = 0 (lid | rest), y = D (crank | rest), z = HT (deck on top)
  const rest = facing([0,1,0]) ? body(st, m) + dancer(st) + crank(st) : crank(st) + body(st, m) + dancer(st);
  return s + (facing([1,0,0]) ? lid(m) + rest : rest + lid(m));
}

/* ---------- sound: a soft pluck, bright and quick to fade ---------- */
let mbAudio = null;
const mbNodes = new Set();
function unlock(){
  if (mbAudio) return;
  try { const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC(), out = ctx.createGain();
    out.gain.value = .9; out.connect(ctx.destination); if (ctx.state === 'suspended') ctx.resume(); mbAudio = { ctx, out }; } catch (e) {}
}
function ping(i){
  if (!mbAudio) return;
  const { ctx, out } = mbAudio, t0 = ctx.currentTime, g = ctx.createGain();
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.28, t0 + .004); g.gain.exponentialRampToValueAtTime(.0001, t0 + 1.3);
  g.connect(out);
  [['triangle', FREQ[i], 1], ['sine', FREQ[i] * 4.2, .12]].forEach(([type, fr, v]) => {
    const o = ctx.createOscillator(), gg = ctx.createGain(); o.type = type; o.frequency.value = fr; gg.gain.value = v;
    o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + 1.35); mbNodes.add(o);
    o.onended = () => { mbNodes.delete(o); gg.disconnect(); };
  });
  setTimeout(() => g.disconnect(), 1500);
}

/* ---------- playing ---------- */
let mbUI = null, ticking = false;
function pluck(st, i){
  st.hot[i] = performance.now(); st.count++; ping(i);
  st.msg = `note ${NOTES[i]} · tooth ${i + 1} of 8 · ${i < 3 ? 'long tooth, low note' : i > 4 ? 'short tooth, high note' : 'middle tooth, middle note'}`;
}
// move the drum to p, plucking every pin it passes
function advance(st, p){
  for (let k = Math.floor(st.pos) + 1; k <= Math.floor(p); k++){ const n = SONG[((k % SN) + SN) % SN]; if (n >= 0) pluck(st, n); }
  st.spin += (p - st.pos) * 45; st.pos = p; st.goal = Math.max(st.goal, p); st.stopAt = performance.now();
}
function kick(st){
  if (ticking || !mbUI) return; ticking = true;
  mbUI.animate(dt => {
    const now = performance.now();
    if (!st.drag && st.goal > st.pos + 1e-3) advance(st, Math.min(st.goal, st.pos + dt * 1000 / BEAT));
    const busy = st.goal > st.pos + 1e-3 || !!st.drag || NOTES.some((_, i) => now - st.hot[i] < 1500) || now - st.btnHot < 300 || now - st.crankHot < 300;
    if (!busy){ ticking = false; if (st.count){ st.count = 0; st.msg = 'turn the crank to play'; } }
    return busy;
  });
}
function start(st){ if (st.goal - st.pos < .05 && !st.drag){ st.count = 0; st.msg = 'the drum is turning…'; } }
function wind(st, beats){ unlock(); start(st); st.goal = Math.min(Math.max(st.goal, st.pos) + beats, st.pos + 24); kick(st); }

const ST = { pos: -.6, goal: -.6, spin: 0, hot: NOTES.map(() => -1e9), count: 0, stopAt: 0, drag: null, btnHot: -1e9, crankHot: -1e9, msg: 'turn the crank to play' };

/* ---------- see-through: the spring motor hidden under the dancer's deck ----------
   The glass shows the pin drum and comb. The deck behind it (y = YO..D - WT) hides the motor that turns them:
   WIND     crank on the outside . winding arbor through the end wall, its brass bush on the wall . arbor bridge (post on the floor)
            ratchet wheel on the arbor . click (pawl) on its stud from the end wall
   SPRING   barrel (a drum round the mainspring) . the mainspring coiled inside it . barrel teeth round its rim
   TRAIN    drum axle carried on through a bush in the partition . cylinder wheel on the axle, meshing the barrel teeth
            (12.3 + 8 = 20.3 = the distance between the two axes)
   GOVERNOR worm wheel on the drum axle . vertical fan arbor with its worm (5 + 1.2 = 6.2 from the axle) .
            lower cock screwed to the back wall . upper cock under the deck . the two-vane air brake fan . stop lever on its stud,
            whose tip sits in the fan's path when the box is stopped
   DANCER   bevel gear on the drum axle's end . bevel on the cross shaft (axes meet at x 20, y 116) . cross shaft along x .
            two hangers from the deck . bevel at its other end . bevel on the dancer's spindle (axes meet at x 36, y 116) .
            spindle up through its bush in the deck to the turntable
   Parts sit on the floor (bridge), hang from the deck (cocks, hangers, bushes, stop stud) or on the walls (click stud, lower cock, bushes). */
const MB_LIVE = matOf('#ff9a3a'), GEARB = { l:'#e8c46a', m:'#cfa043', d:'#9c7428' }, DKST = matOf('#8f989b');
const BAR = { x:36, z:KZ, r:10.5, g:12.3 }, CW = { r:8, y0:104, y1:106 }, WW = { r:5, y0:108, y1:110 };
const FAN = { x:DCX - WW.r - 1.2, y:109, z0:40, z1:43, r:3.8 }, XS = { y:116, z:DZC };
// spur gear on an axis along y (centre x, z), y0..y1; or along z (centre x, y), z0..z1
function gearAx(ax, c0, c1, a0, a1, r, nT, m, rot, w = .8){
  const pts = [], da = 2*Math.PI/nT;
  for (let i = 0; i < nT; i++){ const b = rot*Math.PI/180 + i*da;
    for (const [fa, rr] of [[0, r - .8], [.22, r - .8], [.36, r], [.64, r], [.78, r - .8]]) pts.push([rr*Math.cos(b + fa*da), rr*Math.sin(b + fa*da)]); }
  const at = (a, [u, v]) => ax === 'y' ? [c0 + u, a, c1 + v] : [c0 + u, c1 + v, a];
  const A = pts.map(p => at(a0, p)), B = pts.map(p => at(a1, p)), n = ax === 'y' ? [0,1,0] : [0,0,1];
  const cap = vis(n) ? B : A, cn = vis(n) ? n : n.map(v => -v);
  return loft(A, B, nn => toneI(nn, m)) + fill(pd(cap), toneI(cn, m)) + ink(pd(cap), .5) + hullInk([...A, ...B], w);
}
const rodY = (x, z, y0, y1, r, m, w = .6) => ({ box: [[x - r, y0, z - r], [x + r, y1, z + r]], svg: rod([x, y0, z], [x, y1, z], r, m, toneI, w, r, 14) });
const rodX = (y, z, x0, x1, r, m, w = .6) => ({ box: [[x0, y - r, z - r], [x1, y + r, z + r]], svg: rod([x0, y, z], [x1, y, z], r, m, toneI, w, r, 14) });
const mbDot = (pl, u, v, r = .45) => fill(pd(on(pl, ellUV(u, v, r, r, 8))), STEEL.l) + ink(pd(on(pl, ellUV(u, v, r, r, 8))), .35);
function mbMech(st){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .7, extra = '') => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w) + extra);
  const run = st.goal > st.pos + 1e-3 || !!st.drag, turn = -st.pos * DEG;
  // ---- winding: arbor through the end wall, bush, bridge, ratchet and click
  parts.push(rodY(BAR.x, BAR.z, 101, 104, 1.1, STEEL), rodY(BAR.x, BAR.z, 122, 124, 1.1, STEEL), rodY(BAR.x, BAR.z, 125.5, D, 1.1, STEEL));
  put([[BAR.x - 3, D - WT - 2, BAR.z - 3], [BAR.x + 3, D - WT, BAR.z + 3]], rod([BAR.x, D - WT - 2, BAR.z], [BAR.x, D - WT, BAR.z], 3, BRASS, toneI, .7, 3, 18));
  bx(BAR.x - 2.5, 101, FL, BAR.x + 2.5, 102.6, BAR.z - 1.1, DKST, .7, facing([0,-1,0]) ? mbDot(PY(100.95), BAR.x, FL + 3) : '');
  put([[BAR.x - 6, 124, BAR.z - 6], [BAR.x + 6, 125.5, BAR.z + 6]], gearAx('y', BAR.x, BAR.z, 124, 125.5, 6, 14, STEEL, -turn*8/BAR.g));
  const piv = [BAR.x + 9.5, BAR.z + 5], tipC = [BAR.x + 5.3, BAR.z + 3];
  parts.push(rodY(piv[0], piv[1], 124, D - WT, .8, STEEL));                                             // click stud from the end wall
  put([[tipC[0] - 1, 123.8, tipC[1] - 1], [piv[0] + 1, 125.7, piv[1] + 1]],
    prism([[piv[0], 123.9, piv[1] + .8], [piv[0], 123.9, piv[1] - .8], [tipC[0], 123.9, tipC[1]]], [[piv[0], 125.6, piv[1] + .8], [piv[0], 125.6, piv[1] - .8], [tipC[0], 125.6, tipC[1]]], STEEL, toneI, .6));
  // ---- spring barrel: teeth round its rim, the mainspring coiled inside (seen on its end cap)
  let bar = gearAx('y', BAR.x, BAR.z, CW.y0, CW.y1, BAR.g, 46, run ? GEARB : BRASS, turn*CW.r/BAR.g, 1)
    + rod([BAR.x, CW.y1, BAR.z], [BAR.x, 122, BAR.z], BAR.r, run ? GEARB : BRASS, toneI, 1, BAR.r, 32);
  if (facing([0,1,0])){ const sp = [], a0 = turn*CW.r/BAR.g*Math.PI/180;
    for (let i = 0; i <= 5*40; i++){ const t = i/40, a = a0 + t*2*Math.PI, rr = 1.6 + t*1.6; sp.push([BAR.x + rr*Math.cos(a), 122.05, BAR.z + rr*Math.sin(a)]); }
    bar += shape(on(PY(122.03), ellUV(BAR.x, BAR.z, BAR.r - 1.2, BAR.r - 1.2, 32)), mix(BRASS.m, '#3a3226', .55), .5) + `<path d="${pd(sp, false)}" fill="none" stroke="#e9eef0" stroke-width=".7"/>`; }
  put([[BAR.x - BAR.g, CW.y0, BAR.z - BAR.g], [BAR.x + BAR.g, 122, BAR.z + BAR.g]], bar);
  // ---- train: drum axle through the partition bush, cylinder wheel, worm wheel, bevel at its end
  parts.push(rodY(DCX, DZC, 90.5, 95, 1, STEEL), rodY(DCX, DZC, 97, CW.y0, 1, STEEL), rodY(DCX, DZC, CW.y1, WW.y0, 1, STEEL), rodY(DCX, DZC, WW.y1, 112.6, 1, STEEL));
  put([[DCX - 2.4, 95, DZC - 2.4], [DCX + 2.4, 97, DZC + 2.4]], rod([DCX, 95, DZC], [DCX, 97, DZC], 2.4, BRASS, toneI, .7, 2.4, 16));
  put([[DCX - CW.r, CW.y0, DZC - CW.r], [DCX + CW.r, CW.y1, DZC + CW.r]], gearAx('y', DCX, DZC, CW.y0, CW.y1, CW.r, 30, run ? MB_LIVE : GEARB, -turn));
  put([[DCX - WW.r, WW.y0, DZC - WW.r], [DCX + WW.r, WW.y1, DZC + WW.r]], gearAx('y', DCX, DZC, WW.y0, WW.y1, WW.r, 20, GEARB, -turn));
  put([[DCX - 1.7, 112.6, DZC - 1.7], [DCX + 1.7, 114.4, DZC + 1.7]], rod([DCX, 112.6, DZC], [DCX, 114.4, DZC], 1.7, GEARB, toneI, .6, 1, 14));
  // ---- governor: worm on the fan arbor, two cocks, the air-brake fan, the stop lever
  const fa = turn*20*Math.PI/180;
  bx(WT, FAN.y - 1.2, 24, FAN.x + 1.6, FAN.y + 1.2, 25, DKST, .6, facing([0,0,1]) ? mbDot(PZ(25.05), WT + 2, FAN.y) : '');
  bx(FAN.x - 1.6, FAN.y - 1.6, 43.4, FAN.x + 1.6, FAN.y + 1.6, HT, DKST, .6);
  put([[FAN.x - .5, FAN.y - .5, 25], [FAN.x + .5, FAN.y + .5, 31]], cyl(FAN.x, FAN.y, 25, 31, .5, STEEL, toneI, .5, 10));
  put([[FAN.x - 1.2, FAN.y - 1.2, 31], [FAN.x + 1.2, FAN.y + 1.2, 38]], cyl(FAN.x, FAN.y, 31, 38, 1.2, run ? MB_LIVE : STEEL, toneI, .6, 14)
    + (() => { const h = []; for (let i = 0; i <= 7*14; i++){ const t = i/14, a = fa + t*2*Math.PI; if (vis([Math.cos(a), Math.sin(a), 0])) h.push([FAN.x + 1.22*Math.cos(a), FAN.y + 1.22*Math.sin(a), 31.3 + t*.9]); else if (h.length && h[h.length - 1] !== null) h.push(null); }
      return h.reduce((acc, p) => { if (!p){ acc.push([]); return acc; } acc[acc.length - 1].push(p); return acc; }, [[]]).filter(s => s.length > 1).map(s => line(s, .4)).join(''); })());
  put([[FAN.x - .5, FAN.y - .5, 38], [FAN.x + .5, FAN.y + .5, 43.4]], cyl(FAN.x, FAN.y, 38, 43.4, .5, STEEL, toneI, .5, 10));
  for (const s of [1, -1]){ const c = Math.cos(fa)*s, sn = Math.sin(fa)*s, a = [FAN.x + .5*c, FAN.y + .5*sn], b = [FAN.x + FAN.r*c, FAN.y + FAN.r*sn];
    put([[Math.min(a[0], b[0]) - .3, Math.min(a[1], b[1]) - .3, FAN.z0], [Math.max(a[0], b[0]) + .3, Math.max(a[1], b[1]) + .3, FAN.z1]],
      shape([[a[0], a[1], FAN.z0], [b[0], b[1], FAN.z0], [b[0], b[1], FAN.z1], [a[0], a[1], FAN.z1]], run ? '#ffc07a' : '#e9eef0', .6)); }
  const sPiv = [8.5, 119], sa = Math.atan2(FAN.y + 2.6 - sPiv[1], FAN.x - 1.4 - sPiv[0]) + (run ? .55 : 0), sTip = [sPiv[0] + 8.4*Math.cos(sa), sPiv[1] + 8.4*Math.sin(sa)];
  put([[sPiv[0] - .7, sPiv[1] - .7, 41], [sPiv[0] + .7, sPiv[1] + .7, HT]], cyl(sPiv[0], sPiv[1], 41, HT, .7, STEEL, toneI, .5, 10));
  put([[Math.min(sPiv[0], sTip[0]) - 1, Math.min(sPiv[1], sTip[1]) - 1, 41], [Math.max(sPiv[0], sTip[0]) + 1, Math.max(sPiv[1], sTip[1]) + 1, 41.8]], prism(
    [[sPiv[0] - .7, sPiv[1] + .7*0, 41], [sTip[0], sTip[1], 41], [sTip[0] + .3, sTip[1] + .5, 41], [sPiv[0] + .4, sPiv[1] + .7, 41]].map(p => p),
    [[sPiv[0] - .7, sPiv[1], 41.8], [sTip[0], sTip[1], 41.8], [sTip[0] + .3, sTip[1] + .5, 41.8], [sPiv[0] + .4, sPiv[1] + .7, 41.8]], run ? DKST : MB_LIVE, toneI, .5));
  // ---- dancer drive: bevels, cross shaft on two hangers, spindle up through the deck
  put([[21.6 - .9, XS.y - 1.7, XS.z - 1.7], [23.4, XS.y + 1.7, XS.z + 1.7]], rod([21.6, XS.y, XS.z], [23.4, XS.y, XS.z], 1, GEARB, toneI, .6, 1.7, 14));
  parts.push(rodX(XS.y, XS.z, 23.4, 26.5, .7, STEEL), rodX(XS.y, XS.z, 27.5, 30.5, .7, STEEL), rodX(XS.y, XS.z, 31.5, 33, .7, STEEL));
  for (const x of [26.5, 30.5]) bx(x, XS.y - 1.2, XS.z - 1.6, x + 1, XS.y + 1.2, HT, DKST, .6);
  put([[33, XS.y - 1.7, XS.z - 1.7], [34.6, XS.y + 1.7, XS.z + 1.7]], rod([33, XS.y, XS.z], [34.6, XS.y, XS.z], 1.7, GEARB, toneI, .6, 1, 14));
  put([[DX - 1.7, DY - 1.7, XS.z + 1], [DX + 1.7, DY + 1.7, XS.z + 2.8]], rod([DX, DY, XS.z + 1], [DX, DY, XS.z + 2.8], 1, GEARB, toneI, .6, 1.7, 14));
  put([[DX - .6, DY - .6, XS.z + 2.8], [DX + .6, DY + .6, 42]], cyl(DX, DY, XS.z + 2.8, 42, .6, STEEL, toneI, .5, 10));
  put([[DX - 1.6, DY - 1.6, 42], [DX + 1.6, DY + 1.6, HT]], cyl(DX, DY, 42, HT, 1.6, BRASS, toneI, .6, 14));
  return byDepth(parts);
}
const MB_XR = { getSt: () => { try { return mbUI.st; } catch (e) { return ST; } }, B: [0, W, 0, D + 10, Z0, HT + 20], under: true,
  mech: () => '',
  over: (st, k) => { const pins = pinsNow(st), a = drumSide(st, pins), b = combSide(st, pins), mv = facing([1,0,0]) ? a + b : b + a, mech = mbMech(st);
    const inner = facing([0,1,0]) ? mv + mech + crank(st) : crank(st) + mech + mv;
    return `<g opacity="${f(k)}">${inner}</g><g opacity="${f(.38*k)}">${dancer(st)}</g>`; },   // the dancer stands over the governor: it fades
  inside: st => { const run = st.goal > st.pos + 1e-3 || !!st.drag;
    return [ { at:[DCX, 50, DZC + DR], text:'PIN DRUM', on: run },
      { at:[TIP + 14, TY[3], DZC], text:'STEEL COMB', on: run },
      { at:[BAR.x, 114, BAR.z + BAR.r], text:'SPRING BARREL', on: run },
      { at:[BAR.x + 6, 124.7, BAR.z], text:'RATCHET', on: !!st.drag },
      { at:[DCX, (CW.y0 + CW.y1)/2, DZC + CW.r], text:'CYLINDER WHEEL', on: run },
      { at:[FAN.x - 1.2, FAN.y, 35], text:'WORM', on: run },
      { at:[FAN.x, FAN.y + FAN.r, FAN.z1], text:'AIR-BRAKE FAN', on: run },
      { at:[8.5, 119, 41.8], text:'STOP LEVER', on: !run },
      { at:[29, XS.y, XS.z + .7], text:'DANCER DRIVE', on: run } ]; },
  surface: () => [ { at:[DCX, 50, DZC + DR], text:'PIN DRUM', on: false }, { at:[TIP + 14, TY[3], DZC], text:'STEEL COMB', on: false },
    { at:[KX, KY, KZ], text:'CRANK', on: false }, { at:[DX, DY, HT + 12], text:'DANCER', on: false } ] };
const MB_CAPTION = st => (st.goal > st.pos + 1e-3 || st.drag)
  ? 'The wound mainspring turns the barrel; its teeth drive the cylinder wheel and the pin drum. A worm on the drum axle spins the air-brake fan to hold the tempo, and bevel gears turn the dancer’s spindle.'
  : 'Under the deck: the crank winds a mainspring in the barrel, and the ratchet and click stop it slipping back. At rest the stop lever holds the air-brake fan, so nothing turns.';
scene = xrWrap(scene, MB_XR);

mbUI = mountFigure({
  fig:'24', turn:'full', title:'Music box', hint:'turn the crank: drag it, click it, or press space for one line',
  idea:'Pins on a turning drum pluck metal teeth: long teeth make low notes, short teeth make high notes.',
  size:[W + OFFX + 6, D + OFFY + 18, 114], center:[W/2 + OFFX, D/2 + OFFY], palette:'blush',
  state: ST,
  scene,
  readout: st => st.msg,
  buttons:[
    { label:'Turn the crank', onClick:(st, ui) => wind(st, 8) },
    { label:'One note', onClick:(st, ui) => wind(st, 1) },
  ],
  acts:{ btn:(st, el, ui) => { st.btnHot = performance.now(); wind(st, 8); } },
  params:(st, q) => { if (q.has('pos')){ st.pos = st.goal = +q.get('pos'); st.spin = st.pos * 45; } },
});
// the framing box starts at the origin; the model reaches back to x = -OFFX, y = -OFFY: shift the projection to match
RC = [RC[0] - OFFX, RC[1] - OFFY]; OX += (OFFX - OFFY) * C; OY += (OFFX + OFFY) * S;
mbUI.render();

/* ---------- crank: drag it round (forward only, like the real ratchet), or click it for one line ---------- */
(() => {
  const svg = document.getElementById('fig'), st = ST;
  const toSvg = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  // angle of the pointer around the shaft, measured in the crank's own plane (y = KY) for the current camera
  const angleAt = e => { const q = toSvg(e), c0 = P(KX, KY, KZ), ex = Dv(1,0,0), ez = Dv(0,0,1), dx = q.x - c0[0], dy = q.y - c0[1];
    const det = ex[0]*ez[1] - ex[1]*ez[0];
    if (Math.abs(det) < .2 * Math.hypot(...ex) * Math.hypot(...ez)) return null;          // crank seen edge-on
    return Math.atan2((ex[0]*dy - ex[1]*dx) / det, (dx*ez[1] - dy*ez[0]) / det); };
  svg.addEventListener('pointerdown', e => {
    if (e.button || !e.target.closest('[data-act="crank"]')) return;
    unlock(); start(st); try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    st.drag = { id: e.pointerId, a: angleAt(e), x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, moved: 0 };
    svg.style.cursor = 'grabbing'; e.preventDefault(); kick(st);
  });
  svg.addEventListener('pointermove', e => { const d = st.drag; if (!d || e.pointerId !== d.id) return;
    d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.x, e.clientY - d.y));
    const a = angleAt(e); let dp = 0;
    if (a != null && d.a != null){ let da = a - d.a; da = Math.atan2(Math.sin(da), Math.cos(da)); dp = -da / (2 * Math.PI) * BPT; }
    else dp = Math.hypot(e.clientX - d.px, e.clientY - d.py) / 60;                            // edge-on: any stroke turns it
    d.a = a; d.px = e.clientX; d.py = e.clientY;
    if (dp > 0) advance(st, st.pos + Math.min(dp, 2));
    mbUI.invalidate(); });
  const drop = e => { const d = st.drag; if (!d || e.pointerId !== d.id) return; st.drag = null; svg.style.cursor = '';
    if (d.moved < 4){ st.crankHot = performance.now(); wind(st, 8); } else st.goal = st.pos; kick(st); };
  svg.addEventListener('pointerup', drop); svg.addEventListener('pointercancel', drop);
  addEventListener('keydown', e => {
    if (/input|textarea|button/i.test(e.target.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); st.btnHot = performance.now(); wind(st, 8); }
    else if (e.key === 'n' || e.key === 'N') wind(st, 1);
  });
})();

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

xrMount(() => mbUI, MB_CAPTION);