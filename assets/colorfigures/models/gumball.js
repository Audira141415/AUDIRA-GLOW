/* Gumball machine. Put a coin in, turn the crank, a gumball rolls out.
   Port of the Colorfigures 2.0 kids figure to the 1.0 engine with the free camera.
   Base: x = depth 70, y = width 84, z = 4..72 on a plate. The lit front (x = W) has a peek window onto the mechanism:
   the coin unlocks the gumball wheel, the crank turns the wheel a quarter turn, the pocket over the exit drops a gum. */
const W = 70, D = 84, H = 72, BR = 8;                        // body depth, width, top; corner radius
const GC = [35, 42, 106], GR = 34;                           // glass globe: centre and radius
const CRK = [24, 25], CRANK_R = 9;                           // crank centre (y, z) on the front
const SPH = Math.sqrt(1.5);                                  // a sphere of radius r draws as a circle of r * SPH
const WIN_D = 2.5;                                           // the mechanism window is set this deep into the front
const GUM = ['#e2473a','#f2c230','#3e86d9','#38a565','#ef6f9a','#f08a2b','#8c4bd1','#fbf7ea'];
const PLATE = { l:'#ddd8ca', m:'#cbc5b6', d:'#b9b3a4' }, PLATE_TOP = '#e6e2d6';
const STEELM = { l:'#d9dddd', m:'#bcc2c3', d:'#9ea6a9' }, KNOBM = { l:'#57514b', m:'#46413c', d:'#2a2724' };
const WINBG = '#e3eaec', HOLE = '#3a3431', COINC = '#e8b84a', LAMP = '#ff8a2a', LAMP_OFF = '#d6cfc4';
const gbF = v => v.toFixed(2);

/* ---------- small helpers ---------- */
// the front plane in the 2.0 figure's local coords: (u, v) -> y = D - u, z = H - v. Rect / rounded rect as (y,z) UV.
const fr = (u0, v0, u1, v1, r = 0) => r ? rrUV(D - u1, H - v1, D - u0, H - v0, r, 5) : rectUV(D - u1, H - v1, D - u0, H - v0);
const frP = (x, u0, v0, u1, v1, r = 0) => on(PX(x), fr(u0, v0, u1, v1, r));
const frC = (x, u, v, r, n = 20) => on(PX(x), ellUV(D - u, H - v, r, r, n));
// text on a plane: o = 3D anchor, U = reading direction, anchor start/middle
const gbText = (p, U, str, size, col, weight = 800, anchor = 'middle', ls = '.04em') =>
  `<text transform="${txM(P(...p), Dv(...U), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="${anchor}" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing="${ls}">${str}</text>`;
// a shiny ball (a gumball, the knob on the lid): flat colour, a shaded lower half, a highlight, its ink
function gbBall(c, r, col, w = .8){
  const [X, Y] = P(...c), R = r * SPH;
  return `<circle cx="${gbF(X)}" cy="${gbF(Y)}" r="${gbF(R)}" fill="${col}"/>`
    + `<path d="M${gbF(X-R)} ${gbF(Y)}A${gbF(R)} ${gbF(R)} 0 0 0 ${gbF(X+R)} ${gbF(Y)}A${gbF(R)} ${gbF(R*.55)} 0 0 1 ${gbF(X-R)} ${gbF(Y)}Z" fill="#000" opacity=".18"/>`
    + `<circle cx="${gbF(X-R*.35)}" cy="${gbF(Y-R*.38)}" r="${gbF(R*.26)}" fill="#fff" opacity=".7"/>`
    + `<circle cx="${gbF(X)}" cy="${gbF(Y)}" r="${gbF(R)}" fill="none" stroke="${INK}" stroke-width="${w}"/>`;
}
// a prism: a convex (y,z) outline swept along x from x0 to x1 (the crank's bar)
function gbPrism(uv, x0, x1, m, w = 1){
  const A = on(PX(x0), uv), B = on(PX(x1), uv), capB = facing([1,0,0]), cap = capB ? B : A;
  return loft(A, B, n => tone(n, m)) + fill(pd(cap), tone(capB ? [1,0,0] : [-1,0,0], m)) + ink(pd(cap), w * .8) + hullInk([...A, ...B], w);
}
// the half of an upright band (a collar) that faces the viewer, with its outline: drawn over what it wraps
function gbBand(cx, cy, z0, z1, r, m, w = 1.2){
  const ring = z => on(PZ(z), ellUV(cx, cy, r, r, 36));
  let s = loft(ring(z0), ring(z1), n => tone(n, m));
  const yaw = YAW * Math.PI / 180, arc = z => Array.from({length: 25}, (_, i) => { const a = yaw - Math.PI/2 + Math.PI * i / 24; return [cx + r*Math.cos(a), cy + r*Math.sin(a), z]; });
  return s + ink(pd([...arc(z1), ...arc(z0).reverse()]), w);
}
// clip a circle in the plane y = yc (centre xc, zc) to x >= xMin: the part of the coin outside the slot
function gbCoinPoly(xc, zc, r, xMin, yc){
  const pts = Array.from({length: 28}, (_, i) => { const t = i / 28 * 2 * Math.PI; return [xc + r*Math.cos(t), zc + r*Math.sin(t)]; });
  const out = [];
  for (let i = 0; i < pts.length; i++){
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[0] >= xMin, ib = b[0] >= xMin;
    if (ia) out.push(a);
    if (ia !== ib){ const t = (xMin - a[0]) / (b[0] - a[0]); out.push([xMin, a[1] + (b[1] - a[1]) * t]); }
  }
  return out.map(([x, z]) => [x, yc, z]);
}

/* ---------- gumballs in the globe: a jittered lattice inside the sphere, filled up to a level ---------- */
let gbSeed = 7; const gbRnd = () => (gbSeed = (gbSeed * 16807) % 2147483647) / 2147483647;
function fillGlobe(){
  const out = [], r = 4.6, s = 8.6;
  for (let x = -GR; x <= GR; x += s) for (let y = -GR; y <= GR; y += s) for (let z = -GR; z <= 8; z += s * .86){
    const p = [x + (gbRnd()-.5)*2.2, y + (gbRnd()-.5)*2.2 + ((Math.round(z/(s*.86)) % 2) ? s/2 : 0), z];
    if (Math.hypot(...p) > GR - r - .6) continue;
    out.push({ at:[GC[0]+p[0], GC[1]+p[1], GC[2]+p[2]], r, col: GUM[Math.floor(gbRnd()*GUM.length)] });
  }
  return out;
}

/* ---------- state ----------
   phase: idle -> coin (coin sliding in) -> ready -> turn (crank going round) -> drop (gum falls) -> roll -> tray
   pockets are indexed around the wheel; pocket j sits at angle (j + k)*90 deg from the top, clockwise */
const st = { phase:'idle', el:0, globe: fillGlobe(), pockets:[GUM[1], GUM[2], null, null], k:0, wig:1e9,
             falling:null, tray:null, coins:0, nextCol:null };
st.nextCol = st.globe[0].col;
const gbEase = k => k < .5 ? 2*k*k : 1 - (-2*k + 2)**2/2;
const turnK = () => st.phase === 'turn' ? gbEase(Math.min(1, st.el / 1400)) : 0;
const wiggle = () => st.wig < 600 ? 14 * Math.sin(st.wig / 600 * Math.PI * 4) * (1 - st.wig / 600) : 0;

/* ---------- the mechanism, seen through the window (a flat plate set WIN_D into the front) ---------- */
function mech(){
  const XB = W - WIN_D, x = XB + .15, tk = turnK(), cx = 26, cy = 32, R = 9.5;
  let s = fill(pd(frP(XB, 2, 8, 52, 60)), WINBG);
  // feed tube from the globe, with the next gum waiting
  s += shape(frP(x, 22, 14, 30, 23), STEELM.l, .8);
  if (st.nextCol) s += shape(frC(x + .05, 26, 19.6, 2.8), st.nextCol, .7);
  // exit chute below the wheel
  s += shape(frP(x, 22, 40.5, 30, 52.5), STEELM.l, .8) + fill(pd(frP(x + .05, 23.5, 40.5, 28.5, 52.5)), HOLE);
  // wheel with four pockets
  s += shape(frC(x + .1, cx, cy, R, 32), STEELM.l, .9) + shape(frC(x + .15, cx, cy, 1.4, 12), HOLE, .6);
  st.pockets.forEach((c, j) => {
    const a = ((j + st.k) * 90 + tk * 90) * Math.PI / 180, px = cx + 6*Math.sin(a), py = cy - 6*Math.cos(a);
    s += shape(frC(x + .15, px, py, 3.3, 16), HOLE, .6);
    if (c) s += shape(frC(x + .2, px, py, 2.7, 16), c, .6);
  });
  // the gum falling down the exit chute
  if (st.falling) s += shape(frC(x + .2, 26, st.falling.v, 2.7, 16), st.falling.col, .6);
  // coin box with the coins collected so far
  s += fill(pd(frP(x, 34, 43.5, 43.5, 50.5)), '#4a4440') + ink(pd(frP(x, 34, 43.5, 43.5, 50.5)), .7);
  for (let i = 0; i < Math.min(st.coins, 5); i++) s += shape(frP(x + .1, 35.2, 49.2 - i*1.3 - 1.2, 42.2, 49.2 - i*1.3), COINC, .5);
  // the coin: slides down the ramp, rests against the wheel (that unlocks it), falls into the box when you turn
  s += line(on(PX(x), [[D - 44, H - 21], [D - 38.5, H - 26.6]]), .9);
  let coin = null;
  if (st.phase === 'coin'){ const k = Math.min(1, st.el / 700); if (k > .45){ const q = (k - .45) / .55; coin = [44 - 5.6*q, 21.5 + 7*q]; } }
  else if (st.phase === 'ready') coin = [38.4, 28.5];
  else if (st.phase === 'turn' && st.el < 420){ const q = st.el / 420; coin = [38.4, 28.5 + 19*q*q]; }
  if (coin) s += shape(frC(x + .25, coin[0], coin[1], 2.8, 18), COINC, .6) + `<path d="${pd(frC(x + .3, coin[0], coin[1], 1.6, 14))}" fill="none" stroke="#a87a1e" stroke-width=".5"/>`;
  return s;
}

/* ---------- parts that stick out of the front: crank, tray (with the gum on it), the coin going in ---------- */
function crank(m){
  const MID = midOf(m), rot = (st.k + turnK()) * 90, a = (rot * 4 + wiggle()) * Math.PI / 180;   // a quarter turn of the wheel = one full turn of the crank
  const [y0, z0] = CRK, du = Math.sin(a), dv = -Math.cos(a), L = 7.5, wd = 1.6;
  const pt = (t, n) => { const u = t*du + n*(-dv), v = t*dv + n*du; return [y0 - u, z0 - v]; };
  const e = pt(L, 0), toFront = facing([1,0,0]);
  const base = cylX(W, W + 3, y0, z0, CRANK_R, STEELM, tone, 1.2, 28);
  const bar = gbPrism([pt(-2, -wd), pt(L, -wd), pt(L, wd), pt(-2, wd)], W + 3, W + 4.2, MID, .9);
  const tips = byDepth([
    { at:[W + 4.6, y0, z0], svg: cylX(W + 4.2, W + 5, y0, z0, 2.4, STEELM, tone, .9, 16) },
    { at:[W + 7, e[0], e[1]], svg: cylX(W + 4.2, W + 10, e[0], e[1], 2.2, KNOBM, tone, .9, 16) } ]);
  return act('crank', toFront ? base + bar + tips : tips + bar + base);
}
function tray(){
  const floor = box(W - 1, 46, 4, W + 11, 68, 7.5, STEELM, tone, 1);
  const lip = box(W + 9, 46, 7.5, W + 11, 68, 10, STEELM, tone, .9);
  let gum = '';
  const g = gumOut();
  if (g && g.x >= W + 1) gum = act('gum', gbBall([g.x, 57, 12.1], 4.5, g.col, 1));
  return floor + (facing([1,0,0]) ? gum + lip : lip + gum);
}
function gumOut(){
  if (st.phase === 'roll') return { x: W - 6 + 11 * gbEase(Math.min(1, st.el / 500)), col: st.tray };
  if (st.phase === 'tray') return { x: W + 5, col: st.tray };
  return null;
}
function coinOut(){
  if (st.phase !== 'coin' || st.el >= 420) return null;
  const xc = W + 14 - 20 * gbEase(Math.min(1, st.el / 420)), zc = 48, r = 4.2;
  const outer = gbCoinPoly(xc, zc, r, W, CRK[0]), inner = gbCoinPoly(xc, zc, r * .62, W, CRK[0]);
  if (outer.length < 3) return null;
  return { at:[Math.max(xc, W + 1), CRK[0], zc], svg: shape(outer, COINC, .8) + (inner.length > 2 ? `<path d="${pd(inner, false)}" fill="none" stroke="#a87a1e" stroke-width=".8"/>` : '') };
}

/* ---------- scene ---------- */
const midOf = m => ({ l: m.m, m: mix(m.m, '#1a1612', .2), d: mix(m.m, '#1a1612', .44) });
const bodyRing = z => on(PZ(z), rrUV(0, 0, W, D, BR));
function scene(s0, m){
  const FRONT = facing([1,0,0]), LEFT = facing([0,1,0]), MID = midOf(m);
  const bTop = boardTop(-6, -6, W + 6, D + 6, 4, 8);
  // plate
  const A = on(PZ(0), rrUV(-6, -6, W + 6, D + 6, 8));
  let s = loft(A, bTop, n => tone(n, PLATE)) + fill(pd(bTop), PLATE_TOP) + ink(pd(bTop), 1) + hullInk([...A, ...bTop], 1.6);
  // cast shadow of the body and the globe, on the plate
  const globeRing = on(PZ(GC[2]), ellUV(GC[0], GC[1], GR, GR, 24));
  s += castShadow([...bodyRing(4), ...bodyRing(H), ...globeRing, [GC[0], GC[1], GC[2] + GR + 9]], 4, bTop);

  // ---- things sticking out of the front (sorted for the camera) ----
  const co = coinOut();
  const parts = byDepth([
    { at:[W + 4, CRK[0], CRK[1]], svg: crank(m) },
    { at:[W + 5, 57, 7], svg: tray() },
    co ]);

  // ---- body: rounded box ----
  let body = loft(bodyRing(4), bodyRing(H), n => tone(n, m)) + fill(pd(bodyRing(H)), mix(m.l, '#ffffff', .22)) + ink(pd(bodyRing(H)), 1.2);
  if (FRONT){
    const F = W + .15, F2 = W + .3;
    // name strip
    body += shape(frP(F, 10, 5, 74, 13.5, 2.5), '#fff4d6', 1) + gbText([F2, 42, H - 11.6], [0,-1,0], 'GUMBALLS', 6, INK, 900, 'middle', '1');
    // coin slot plate and the price
    body += act('slot', shape(frP(F, 51, 16, 69, 31, 3), STEELM.l, 1.1) + shape(frP(F2, 58.5, 19, 61.5, 28, 1), HOLE, .8));
    body += gbText([F2, 24, H - 35.5], [0,-1,0], '25 CENTS', 3.6, INK, 800);
    // chute opening, with the gum while it is still inside
    const ch = frP(F, 16, 55, 38, 67, 3);
    body += fill(pd(ch), '#2b2622');
    const g = gumOut();
    if (g && g.x < W + 1) body += clipTo(ch, gbBall([g.x, 57, 12.1], 4.5, g.col, 1));
    body += ink(pd(ch), 1.2);
  }
  if (LEFT){
    // the three steps, each with a lamp that lights when it is your turn
    const Y = D + .2, dec = mix(m.d, '#ffffff', .22), tc = mix(m.d, '#000000', .45);
    body += shape(on(PY(Y), rrUV(8, H - 56, 62, H - 12, 6)), dec, 1);
    const step = st.phase === 'idle' ? 0 : (st.phase === 'tray' ? 2 : 1);
    const blink = st.phase === 'idle' && st.wig < 900 ? Math.floor(st.wig / 150) % 2 === 0 : true;
    ['INSERT COIN', 'TURN CRANK', 'TAKE GUM'].forEach((t, i) => {
      const z = H - 22 - i*12;
      body += shape(on(PY(Y + .1), ellUV(15, z, 2.6, 2.6, 16)), i === step && blink ? LAMP : LAMP_OFF, .7);
      body += gbText([21, Y + .15, z - 2], [1,0,0], `${i+1} ${t}`, 4.7, tc, 800, 'start', '0');
    });
  }
  body += hullInk([...bodyRing(4), ...bodyRing(H)], 2.8);
  const xk = ease(st.xr || 0);
  if (xk > 0){ const gb = `<g opacity="${f(1 - .8*xk)}">${body}</g>`, mk = `<g opacity="${f(xk)}">${gumMech()}</g>`; s += FRONT ? gb + mk + parts : parts + gb + mk; }
  else s += FRONT ? body + parts : parts + body;

  // ---- neck, globe, collar, lid (all above the top: always in front of the body) ----
  const g0 = s.length;   // in see-through they fade back so the gumball wheel under them shows
  s += cyl(GC[0], GC[1], H, H + 4, 20, MID, tone, 1.4, 32);
  const [gx, gy] = P(...GC), GS = GR * SPH;
  const circ = `cx="${gbF(gx)}" cy="${gbF(gy)}" r="${gbF(GS)}"`;
  s += `<circle ${circ} fill="#e3eef1" opacity=".55"/>`;
  const collar = gbBand(GC[0], GC[1], H + 4, H + 7.5, 21.5, MID, 1.2), collarFront = PITCH < 37;
  if (!collarFront) s += collar;
  const balls = byDepth(st.globe.map(b => ({ at: b.at, svg: gbBall(b.at, b.r, b.col, .7) })));
  s += `<clipPath id="gb-globe"><circle cx="${gbF(gx)}" cy="${gbF(gy)}" r="${gbF(GS - .4)}"/></clipPath><g clip-path="url(#gb-globe)">${balls}</g>`;
  s += `<circle ${circ} fill="#cfe9f0" opacity=".22" pointer-events="none"/>`;
  s += `<path d="M${gbF(gx - GS*.72)} ${gbF(gy - GS*.12)}A${gbF(GS*.8)} ${gbF(GS*.8)} 0 0 1 ${gbF(gx - GS*.1)} ${gbF(gy - GS*.78)}L${gbF(gx - GS*.06)} ${gbF(gy - GS*.66)}A${gbF(GS*.68)} ${gbF(GS*.68)} 0 0 0 ${gbF(gx - GS*.6)} ${gbF(gy - GS*.06)}Z" fill="#fff" opacity=".38" pointer-events="none"/>`;
  s += `<circle ${circ} fill="none" stroke="${INK}" stroke-width="1.8"/>`;
  if (collarFront) s += collar;
  s += cyl(GC[0], GC[1], GC[2] + GR - 6, GC[2] + GR + 1, 15, MID, tone, 1.4, 32) + gbBall([GC[0], GC[1], GC[2] + GR + 5], 4.2, MID.l, 1);
  if (xk > 0) s = s.slice(0, g0) + `<g opacity="${f(1 - .6*xk)}">${s.slice(g0)}</g>`;

  // ---- labels: the working parts behind the window, only while the front faces us ----
  return s;
}

/* pills in a column beside the machine, on the side the front faces, sorted top to bottom so leaders never cross */
function labels(m){
  const XM = W - WIN_D + .2;
  const items = [
    { at:[XM, D - 26, H - 19.6], text:'GUMS',  on: st.phase === 'turn' },
    { at:[XM, D - 38.4, H - 28.5], text:'COIN', on: st.phase === 'coin' || st.phase === 'ready' },
    { at:[XM, D - 26 - 6.5, H - 32 - 6.5], text:'WHEEL', on: st.phase === 'turn' } ];
  const box3 = [];
  for (const x of [-6, W + 14]) for (const y of [-6, D + 6]) for (const z of [0, H]) box3.push(P(x, y, z));
  const side = P(W, D/2, H/2)[0] > P(0, D/2, H/2)[0] ? 1 : -1;
  const xs = box3.map(p => p[0]), k = INK_K, fs = 8.6*k, gap = fs*1.8 + 4*k;
  const colX = side > 0 ? Math.max(...xs) + 16*k : Math.min(...xs) - 16*k;
  const pts = items.map(it => ({ ...it, p: P(...it.at) })).sort((a, b) => a.p[1] - b.p[1]);
  let y = -1e9, s = '';
  if (side > 0){
    // front toward screen right: the crank sits right beside the window. Each leader drops out of the window, runs along
    // the strip of face between the window and the chute, drops again in the gap between the chute and the crank, and
    // runs out flat under the crank. Rightmost point -> highest run and nearest pill, so no two leaders cross; the pills
    // are staggered so a lower run passes just under the pills above it.
    const y0 = P(W + 3, CRK[0], CRK[1] - CRANK_R)[1] + 2.5, dy = 6.5;
    let cx = colX;
    pts.sort((a, b) => b.p[0] - a.p[0]).forEach((it, i) => {
      const zs = 20.6 - i*1.2, ye = 34 + i*3, py = y0 + i*dy;
      const a1 = P(it.at[0], it.at[1], zs), a2 = P(W + .2, ye, zs), a3 = [a2[0], py];
      const w = it.text.length*fs*.62 + fs*1.5, hgt = fs*1.8;
      s += `<g class="tag${it.on ? ' on' : ''}"><path d="M${f(it.p[0])} ${f(it.p[1])}L${f(a1[0])} ${f(a1[1])}L${f(a2[0])} ${f(a2[1])}L${f(a3[0])} ${f(a3[1])}L${f(cx)} ${f(py)}" fill="none" stroke="${INK}" stroke-width="1"/>`
        + `<circle cx="${f(it.p[0])}" cy="${f(it.p[1])}" r="${f(1.3*k)}" fill="${INK}"/>`
        + `<rect x="${f(cx)}" y="${f(py - hgt/2)}" width="${f(w)}" height="${f(hgt)}" rx="${f(hgt/2)}" fill="${it.on ? 'var(--accent,#f4b829)' : '#fff4d6'}" stroke="${INK}" stroke-width="1.2"/>`
        + `<text x="${f(cx + w/2)}" y="${f(py + fs*.36)}" font-size="${f(fs)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" letter-spacing=".04em" fill="${INK}">${it.text}</text></g>`;
      cx += w + 3*k;
    });
    return s;
  }
  const low = -1e9;
  for (const it of pts){
    const w = it.text.length*fs*.62 + fs*1.5, py = Math.max(it.p[1] - 10*k, y + gap, low); y = py;
    const px = colX + side * w/2;
    s += tag(it.at, (px - it.p[0]) / k, (py - it.p[1]) / k, it.text, it.on);
  }
  return s;
}

/* ---------- motion: one stepper runs while something moves ---------- */
let ui, gbRunning = false;
function tick(ms){
  st.el += ms; st.wig += ms;
  if (st.phase === 'coin' && st.el >= 700){ st.phase = 'ready'; st.el = 0; }
  else if (st.phase === 'turn' && st.el >= 1400){
    st.k = (st.k + 1) % 4; st.coins++;
    // the pocket now at the bottom (angle 180) drops its gum; the one now at the top refills from the globe
    const at = deg => st.pockets.findIndex((_, j) => ((j + st.k) * 90) % 360 === deg);
    const bottom = at(180), top = at(0);
    const col = st.pockets[bottom]; st.pockets[bottom] = null;
    st.pockets[top] = st.nextCol;
    if (st.globe.length){                                   // the level in the globe drops: take a gum off the top
      let best = 0; st.globe.forEach((b, i) => { const sc = b.at[2]*3 + b.at[0] + b.at[1], o = st.globe[best]; if (sc > o.at[2]*3 + o.at[0] + o.at[1]) best = i; });
      st.globe.splice(best, 1);
    }
    st.nextCol = st.globe.length ? st.globe[Math.floor(st.globe.length / 2)].col : null;
    st.el = 0;
    if (col){ st.phase = 'drop'; st.falling = { v: 38, col }; st.tray = col; }
    else { st.phase = 'idle'; ui.flash('that pocket was empty — refill the globe'); }
  }
  else if (st.phase === 'drop'){ const k = Math.min(1, st.el / 380); st.falling.v = 38 + 18*k*k; if (k >= 1){ st.falling = null; st.phase = 'roll'; st.el = 0; } }
  else if (st.phase === 'roll' && st.el >= 500){ st.phase = 'tray'; st.el = 0; }
  return ['coin', 'turn', 'drop', 'roll'].includes(st.phase) || st.wig < 900;
}
function wake(){
  if (gbRunning) return; gbRunning = true;
  let last = performance.now();
  ui.animate(() => { const n = performance.now(), ms = Math.min(50, Math.max(0, n - last)); last = n;
    const go = tick(ms); if (!go) gbRunning = false; return go; });
}

/* ---------- actions ---------- */
function coin(st, ui){
  if (st.phase === 'tray') return ui.flash('take your gumball first');
  if (st.phase !== 'idle') return ui.flash('one coin at a time');
  st.phase = 'coin'; st.el = 0; wake();
}
function turn(st, ui){
  if (st.phase === 'ready'){ st.phase = 'turn'; st.el = 0; return wake(); }
  if (st.phase === 'idle' || st.phase === 'tray'){            // locked: it only wiggles
    st.wig = 0; wake();
    return ui.flash(st.phase === 'tray' ? 'take your gumball first' : 'locked — insert a coin first');
  }
}
function take(st, ui){
  if (st.phase !== 'tray') return ui.flash(st.phase === 'idle' ? 'the tray is empty — insert a coin and turn the crank' : 'wait for the gumball');
  st.tray = null; st.phase = 'idle';
}
function refill(st, ui){
  if (st.phase !== 'idle' && st.phase !== 'tray') return ui.flash('wait for the gumball first');
  st.globe = fillGlobe(); if (!st.nextCol) st.nextCol = st.globe[0].col;
}

/* ---------- see-through: how a real gumball machine works ----------
   Parts (each held by another; the coin and the gumball each have a real path):
   CRANK   crank (outside) . crank shaft through a bearing in the chassis plate . coin wheel on the shaft with a coin slot .
           lock pawl on a pivot screw, its spring and the dog that drops into the slot . small gear on the shaft's end
   CHASSIS plate behind the front on four standoffs . coin guide from the slot down to the coin wheel
   WHEEL   crown gear (one crank turn = a quarter turn) . vertical shaft . bearing in the deck . deck with the exit hole .
           gumball wheel with four pockets under the globe
   GUM     exit tube from the hole, out past the crown gear and down to the chute
   COINS   open coin box under the coin wheel, with the coins collected so far */
const gl = (a, b, t) => a + (b - a) * t;
const GBR = { l:'#f2d37a', m:'#d7af4a', d:'#9a7a2a' }, GSTL = { l:'#b4bcbf', m:'#848d91', d:'#555d61' }, GDK = { l:'#5c6369', m:'#3b4146', d:'#24282c' };
const SY = CRK[0], SZ = CRK[1];                                         // crank shaft axis (y, z)
const GCW = { x0:61, x1:63, r:7 }, GPL = { x0:58, x1:59, y0:10, y1:38, z0:16, z1:44 };
const GPIN = { x0:34, x1:36, r:4.5 }, GCROWN = { z0:SZ + 4.5, z1:SZ + 6.5, r:18 };
const GDECK = { z0:63.5, z1:65 }, GWH = { z0:65.5, z1:69.5, r:17, pr:11, hr:5 }, FEED = 215 * Math.PI/180;
const GHOLE = [GC[0] + GWH.pr*Math.cos(FEED - Math.PI), GC[1] + GWH.pr*Math.sin(FEED - Math.PI)];
const GTUBE = [[GHOLE[0], GHOLE[1], GDECK.z0], [59, 55, 46], [60, 56, 24], [W - 6, 57, 12.1]], GTR = 5.5;
const GBIN = [52, 14, 4.5, 66, 34, 14];
const gPath = (pts, t) => { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++){ const l = Math.hypot(...pts[i].map((v, k) => v - pts[i-1][k])); L.push(l); tot += l; }
  let d = t * tot; for (let i = 0; i < L.length; i++){ if (d <= L[i]) return pts[i].map((v, k) => gl(v, pts[i+1][k], d / L[i])); d -= L[i]; } return pts[pts.length - 1]; };
function gumMech(){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const glass = (pts, c = '#e9eef0', o = .4, w = .6) => `<g opacity="${o}">${fill(pd(pts), c)}</g>` + ink(pd(pts), w);
  const ca = ((st.k + turnK()) * 90 * 4 + wiggle()) * Math.PI/180;      // crank angle, as the crank outside draws it
  const wa = (st.k + turnK()) * Math.PI/2;                                // the wheel turns a quarter as far
  const locked = st.phase === 'idle' || st.phase === 'tray', coinOn = st.phase === 'coin' || st.phase === 'ready';
  // ---- chassis plate on standoffs, bearing, crank shaft
  bx(GPL.x0, GPL.y0, GPL.z0, GPL.x1, GPL.y1, GPL.z1, GSTL, .8);
  for (const [y, z] of [[GPL.y0 + 1.5, GPL.z0 + 1.5], [GPL.y1 - 1.5, GPL.z0 + 1.5], [GPL.y0 + 1.5, GPL.z1 - 1.5], [GPL.y1 - 1.5, GPL.z1 - 1.5]])
    put([[GPL.x1, y - .6, z - .6], [W - .5, y + .6, z + .6]], rod([GPL.x1, y, z], [W - .5, y, z], .55, STEELM, toneI, .5));
  put([[GPL.x0 - .8, SY - 2.2, SZ - 2.2], [GPL.x1 + .8, SY + 2.2, SZ + 2.2]], cylX(GPL.x0 - .8, GPL.x1 + .8, SY, SZ, 2.2, GBR, toneI, .7, 18));
  put([[GPIN.x1, SY - 1, SZ - 1], [W, SY + 1, SZ + 1]], rod([W, SY, SZ], [GPIN.x1, SY, SZ], 1, STEELM, toneI, .7));
  // coin wheel with its slot (the slot turns with the crank)
  let cw = cylX(GCW.x0, GCW.x1, SY, SZ, GCW.r, GBR, toneI, .8, 32);
  const nA = Math.PI/2 + ca;
  if (facing([1,0,0])){
    cw += shape(on(PX(GCW.x1 + .05), [[SY + (GCW.r - 2.6)*Math.cos(nA) - .5*Math.sin(nA), SZ + (GCW.r - 2.6)*Math.sin(nA) + .5*Math.cos(nA)], [SY + GCW.r*Math.cos(nA) - .5*Math.sin(nA), SZ + GCW.r*Math.sin(nA) + .5*Math.cos(nA)],
      [SY + GCW.r*Math.cos(nA) + .5*Math.sin(nA), SZ + GCW.r*Math.sin(nA) - .5*Math.cos(nA)], [SY + (GCW.r - 2.6)*Math.cos(nA) + .5*Math.sin(nA), SZ + (GCW.r - 2.6)*Math.sin(nA) - .5*Math.cos(nA)]]), '#3a3226', .5);
    for (let i = 0; i < 14; i++){ const a = ca + i/14*2*Math.PI; cw += line([[GCW.x1 + .05, SY + 5*Math.cos(a), SZ + 5*Math.sin(a)], [GCW.x1 + .05, SY + 6.1*Math.cos(a), SZ + 6.1*Math.sin(a)]], .3); }
  }
  put([[GCW.x0, SY - GCW.r, SZ - GCW.r], [GCW.x1, SY + GCW.r, SZ + GCW.r]], cw);
  // lock pawl: red while it holds the wheel, green once a coin has lifted it
  const PV = [34, 39], a0 = Math.atan2(SZ + GCW.r*.72 - PV[1], SY + GCW.r*.72 - PV[0]) + (locked ? 0 : .22);
  const tip = [PV[0] + 9*Math.cos(a0), PV[1] + 9*Math.sin(a0)], px = (GPL.x1 + GCW.x0)/2, pm = locked ? matOf('#e2483d') : matOf('#38a565');
  put([[GPL.x1, Math.min(PV[0], tip[0]) - .9, Math.min(PV[1], tip[1]) - .9], [GCW.x0, Math.max(PV[0], tip[0]) + .9, Math.max(PV[1], tip[1]) + .9]],
    rod([px, PV[0], PV[1]], [px, tip[0], tip[1]], .75, pm, toneI, .6) + cylX(GPL.x1, px + .9, PV[0], PV[1], 1.1, STEELM, toneI, .5, 12)
    + rod([px, tip[0], tip[1]], [GCW.x0 + 1, tip[0], tip[1]], .65, pm, toneI, .5));
  { const s0 = [gl(PV[0], tip[0], .3), gl(PV[1], tip[1], .3)], s1 = [GPL.y1 - 2, GPL.z0 + 10], sp = [];
    for (let i = 0; i <= 16; i++){ const t = i/16, o = (i % 2 ? .6 : -.6) * (i && i < 16 ? 1 : 0); sp.push([px, gl(s0[0], s1[0], t) + o, gl(s0[1], s1[1], t)]); }
    put([[px - .5, Math.min(s0[0], s1[0]) - 1, Math.min(s0[1], s1[1]) - 1], [px + .5, Math.max(s0[0], s1[0]) + 1, Math.max(s0[1], s1[1]) + 1]], line(sp, .5)); }
  // coin guide from the slot (y 22.5..25.5, z 44..53) down to the top of the coin wheel, and the coin in it
  const gy = 22.2, gpts = [[GCW.x0 + .2, gy, SZ + GCW.r + .3], [W - .5, gy, SZ + GCW.r + .3], [W - .5, gy, 53], [GCW.x0 + .2, gy, 53]];
  let cg = glass(gpts, '#d8d2c2'), coin = null;
  if (st.phase === 'coin'){ const k = Math.min(1, st.el / 700); if (k > .45){ const q = (k - .45)/.55; coin = [gl(W - 2, GCW.x0 + 1, q), gl(49, SZ + GCW.r - 1.2, q)]; } }
  else if (st.phase === 'ready') coin = [(GCW.x0 + GCW.x1)/2, SZ + GCW.r - 1.2];
  else if (st.phase === 'turn' && st.el < 420){ const q = st.el / 420; coin = [(GCW.x0 + GCW.x1)/2, gl(SZ + GCW.r - 1.2, GBIN[5] + 2.8, q*q)]; }
  if (coin) cg += shape(on(PY(SY), ellUV(coin[0], coin[1], 2.8, 2.8, 18)), COINC, .6);
  put([[GCW.x0, gy - .3, SZ + GCW.r], [W, SY + 1.5, 53]], cg);
  // small gear under the crown gear; crown gear, vertical shaft, deck and the gumball wheel
  put([[GPIN.x0, SY - GPIN.r, SZ - GPIN.r], [GPIN.x1, SY + GPIN.r, SZ + GPIN.r]], cylX(GPIN.x0, GPIN.x1, SY, SZ, GPIN.r, GBR, toneI, .7, 18)
    + [...Array(10)].map((_, i) => { const a = ca + i/10*2*Math.PI; return facing([1,0,0]) ? line([[GPIN.x1 + .05, SY + 3.6*Math.cos(a), SZ + 3.6*Math.sin(a)], [GPIN.x1 + .05, SY + 4.5*Math.cos(a), SZ + 4.5*Math.sin(a)]], .3) : ''; }).join(''));
  let crown = cyl(GC[0], GC[1], GCROWN.z0, GCROWN.z1, GCROWN.r, GBR, toneI, .9, 48);
  for (let i = 0; i < 40; i++){ const a = wa + i/40*2*Math.PI, p = [GC[0] + GCROWN.r*Math.cos(a), GC[1] + GCROWN.r*Math.sin(a)];
    if (facing([Math.cos(a), Math.sin(a), 0])) crown += line([[p[0], p[1], GCROWN.z0], [p[0], p[1], GCROWN.z0 + .9]], .35); }
  crown += shape(on(PZ(GCROWN.z1 + .05), ellUV(GC[0], GC[1], 3, 3, 16)), GBR.d, .5);
  put([[GC[0] - GCROWN.r, GC[1] - GCROWN.r, GCROWN.z0], [GC[0] + GCROWN.r, GC[1] + GCROWN.r, GCROWN.z1]], crown);
  put([[GC[0] - 1, GC[1] - 1, GCROWN.z1], [GC[0] + 1, GC[1] + 1, GWH.z0]], rod([GC[0], GC[1], GCROWN.z1], [GC[0], GC[1], GWH.z0], 1, STEELM, toneI, .6));
  const deck = [[3, 3, GDECK.z1], [W - 3, 3, GDECK.z1], [W - 3, D - 3, GDECK.z1], [3, D - 3, GDECK.z1]];
  put([[3, 3, GDECK.z0], [W - 3, D - 3, GDECK.z1]], glass(deck, '#d8d2c2', .22, .4) + shape(on(PZ(GDECK.z1 + .05), ellUV(GHOLE[0], GHOLE[1], GWH.hr + .3, GWH.hr + .3, 20)), '#3a3632', .6)
    + cyl(GC[0], GC[1], GDECK.z1, GWH.z0, 2.2, GBR, toneI, .6, 14));
  let wh = cyl(GC[0], GC[1], GWH.z0, GWH.z1, GWH.r, STEELM, toneI, .9, 48);
  st.pockets.forEach((c, j) => { const a = FEED + ((j + st.k) * 90 + turnK() * 90) * Math.PI/180, p = [GC[0] + GWH.pr*Math.cos(a), GC[1] + GWH.pr*Math.sin(a)];
    wh += shape(on(PZ(GWH.z1 + .05), ellUV(p[0], p[1], GWH.hr, GWH.hr, 20)), HOLE, .6);
    if (c) wh += gbBall([p[0], p[1], GWH.z1 - 1.2], 3.4, c, .6); });
  put([[GC[0] - GWH.r, GC[1] - GWH.r, GWH.z0], [GC[0] + GWH.r, GC[1] + GWH.r, GWH.z1 + 2]], wh);
  // exit tube: out past the crown gear's rim, then down to the chute; the gum inside it while it falls
  let tube = '';
  for (let i = 1; i < GTUBE.length; i++) tube += rod(GTUBE[i-1], GTUBE[i], GTR, matOf('#dfe9ec'), toneI, .7);
  for (const p of GTUBE.slice(1, -1)) tube += gbBall(p, GTR, '#dfe9ec', .7);
  let gum = '';
  if (st.falling){ const t = Math.min(1, (st.falling.v - 38)/18); gum = gbBall(gPath(GTUBE, t), 4.4, st.falling.col, .8); }
  put(gBox(GTUBE, GTR), `<g opacity=".5">${tube}</g>` + gum);
  // coins: an open box under the coin wheel
  let bin = box(...GBIN, GDK, toneI, .9) + shape(on(PZ(GBIN[5] + .05), rectUV(GBIN[0] + 1, GBIN[1] + 1, GBIN[3] - 1, GBIN[4] - 1)), '#1e1b18', .6);
  for (let i = 0; i < Math.min(st.coins, 8); i++){ const c = [GBIN[0] + 4 + (i % 4)*2.4, GBIN[1] + 6 + Math.floor(i/4)*6 + (i % 2)*1.5]; bin += shape(on(PZ(GBIN[5] + .15 + i*.02), ellUV(c[0], c[1], 2.4, 2.4, 14)), COINC, .4); }
  put([[GBIN[0], GBIN[1], GBIN[2]], [GBIN[3], GBIN[4], GBIN[5]]], bin);
  return byDepth(parts);
}
const gBox = (pts, r) => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - r), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + r)];
const XR_OPTS = { getSt: () => st, B: [0, W + 14, 0, D, 4, GC[2] + GR], inline: true,
  inside: st => [ { at:[GCW.x1, SY, SZ + GCW.r], text:'COIN WHEEL', on: st.phase === 'coin' || st.phase === 'ready' },
    { at:[GPL.x1, 34, 39], text:'LOCK PAWL', on: st.wig < 600 },
    { at:[GC[0], GC[1] - GCROWN.r, GCROWN.z1], text:'GEARS', on: st.phase === 'turn' },
    { at:[GC[0] + GWH.r, GC[1], GWH.z1], text:'GUMBALL WHEEL', on: st.phase === 'turn' },
    { at:[60, 56 + GTR, 34], text:'EXIT TUBE', on: st.phase === 'drop' },
    { at:[(W + GPIN.x1)/2, SY, SZ + 1], text:'CRANK SHAFT', on: st.phase === 'turn' },
    { at:[GBIN[3], GBIN[1], GBIN[5]], text:'COIN BOX', on: false } ],
  surface: st => facing([1,0,0]) ? [ { at:[W + 3, CRK[0], CRK[1] + CRANK_R], text:'CRANK', on: st.phase === 'turn' }, { at:[W + .3, 24, 53], text:'COIN SLOT', on: st.phase === 'coin' },
    { at:[W, 57, 17], text:'CHUTE', on: st.phase === 'roll' }, { at:[GC[0], GC[1] - GR, GC[2]], text:'GLOBE', on: false } ] : [{ at:[GC[0], GC[1] - GR, GC[2]], text:'GLOBE', on: false }] };
const XR_CAPTION = st => {
  if (st.phase === 'coin') return 'The coin drops down the guide into the slot of the coin wheel on the crank shaft, and lifts the lock pawl clear.';
  if (st.phase === 'ready') return 'Coin in: the pawl is lifted, so the crank is free to turn.';
  if (st.phase === 'turn') return 'One turn of the crank: the small gear turns the big crown gear, and the gumball wheel above it, a quarter turn. The coin falls off the coin wheel into the coin box.';
  if (st.phase === 'drop') return 'The pocket over the hole drops its gumball down the exit tube.';
  if (st.phase === 'roll' || st.phase === 'tray') return 'The gumball rolls out of the tube into the chute.';
  if (st.wig < 600) return 'No coin: the lock pawl’s dog sits in the coin wheel’s slot, so the crank only wiggles.';
  return 'Inside: the crank shaft carries a coin wheel and a small gear. The gear turns a big crown gear, and the gumball wheel above it, a quarter turn for each coin.';
};

scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'22', turn:'full', title:'Gumball machine', hint:'Insert a coin (0) · turn the crank (space) · take the gum (T)',
  size:[W + 14, D, GC[2] + GR + 9], center:[GC[0], GC[1]], palette:'tomato', state: st,
  scene,
  readout: st => st.phase,
  buttons:[
    { label:'Insert a coin', onClick: coin },
    { label:'Turn the crank', onClick: turn },
    { label:'Take the gumball', onClick: take },
    { label:'Refill the globe', onClick: refill },
  ],
  acts:{ slot:(st, el, ui) => coin(st, ui), crank:(st, el, ui) => turn(st, ui), gum:(st, el, ui) => take(st, ui) },
  params:(st, q) => {
    if (q.get('phase') === 'ready'){ st.phase = 'ready'; }
    if (q.get('phase') === 'tray'){ st.phase = 'tray'; st.tray = GUM[2]; }
  },
});
addEventListener('keydown', e => {
  if (/input|textarea|button/i.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  const fn = (k === '0' || k === 'c') ? coin : (k === ' ' || k === 'enter') ? turn : k === 't' ? take : null;
  if (!fn) return; e.preventDefault(); fn(st, ui); ui.render();
});

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
    if (k > 0 && opts.under) s = xrUnder(s, opts.mech(st, k), k);   // the whole drawing is the object
    else if (k > 0 && !opts.inline) s = `<g opacity="${f(1 - .5*k)}">${s}</g><g opacity="${f(k)}">${opts.mech(st, k)}</g>`;   // inline: the figure ghosts its own case
    const items = k > .6 ? opts.inside(st) : opts.surface ? opts.surface(st) : [];
    return s + (items.length ? xrCallouts(items, opts.B) : '');
  };
}

xrMount(() => ui, XR_CAPTION);