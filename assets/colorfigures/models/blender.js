/* ---------- layout (x = depth, y = width, z = up; 1 unit = 1 cm) ---------- */
const DEG = Math.PI / 180, H0 = 2, K = 1.3;              // board thickness, blender scale (the blender is the hero)
// everything stands in a ring round the blender: [angle from +x toward +y, distance, footprint radius]
const RING = { lid:[-98, 22, 8.4], orange:[-68, 18, 3.4], glass:[-40, 28, 5], mango:[-12, 18, 4.4], ice:[15, 18, 4.8], blue:[42, 18, 4.2],
               banana:[69, 18, 4], straw:[96, 17, 3.6], spinach:[123, 17, 3.8], milk:[151, 21, 5], oj:[177, 21, 5] };
const BOX0 = (() => { let x0 = -14.7, x1 = 14.7, y0 = -14.7, y1 = 14.7;
  for (const [a, r, e] of Object.values(RING)){ const x = r*Math.cos(a*DEG), y = r*Math.sin(a*DEG); x0 = Math.min(x0, x - e); x1 = Math.max(x1, x + e); y0 = Math.min(y0, y - e); y1 = Math.max(y1, y + e); }
  return [x0 - 1.2, y0 - 1.2, x1 + 1.2, y1 + 1.2]; })();
const BX = -BOX0[0], BY = -BOX0[1], BW = BOX0[2] - BOX0[0], BD = BOX0[3] - BOX0[1], HT = 50;
const posOf = k => { const [a, r] = RING[k]; return [BX + r*Math.cos(a*DEG), BY + r*Math.sin(a*DEG)]; };
const BHW = 8*K, BZ1 = H0 + 11*K, PADZ = BZ1 + .8*K;    // motor base half-width, top, top of the coupling pad
const BPROF = rrUV(BY - BHW, H0, BY + BHW, BZ1, 2.6*K);
// jug, in its own frame (cm before scaling): origin at the bottom centre, +z along its axis, spout toward -y
const JC = 3.4, JF = 3.8, JT = 21.5, ROB = 4.7, ROT = 6.0, WALL = .35;
const rOut = lz => ROB + (lz - JC) / (JT - JC) * (ROT - ROB);
const rIn = lz => rOut(lz) - WALL;
const [GX, GY] = posOf('glass'), GB = 3.7, GT = 4.4, GZT = H0 + 13.5, GF = H0 + 1.1;
const gIn = z => GB - .35 + (z - H0) / (GZT - H0) * (GT - GB);
const DIR = [Math.cos(RING.glass[0]*DEG), Math.sin(RING.glass[0]*DEG)];       // the spout faces the glass
const E2 = [-DIR[0], -DIR[1]], E1 = [E2[1], -E2[0]];      // local +y and +x on the board
const LIDREST = [...posOf('lid'), H0];
const POUR_CZ = 30, RIMZ = PADZ + K*JT;

const BERRY = { l:'#f0614c', m:'#d63f37', d:'#8e2420' }, LEAF = '#5aa646';
const BAN = { l:'#f7d64a', m:'#e0b52c', d:'#9c7a18' }, BANIN = '#f6ecc9';
const ICE = { l:'#f6fcfd', m:'#d8edf2', d:'#acd2dc' }, MANGO = { l:'#ffc23d', m:'#f29b1e', d:'#a85d10' };
const BOWL = { l:'#9cc8ea', m:'#76a8d2', d:'#3e6f98' }, BOWL2 = { l:'#f3d9a4', m:'#dcbb7c', d:'#9c7b45' };
const GLASSW = { l:'#e6f2f4', m:'#d2e5e9', d:'#bcd5db' };
const ORANGE = { l:'#ffad3b', m:'#f08a1c', d:'#a65410' };
const SPIN = [0, 1, 1.6, 2.4], SPN = ['', 'Low', 'Medium', 'High'];

/* ---------- ingredients ---------- */
// n = pieces on the board, split = breaks into 3 chunks over the jug (peeled fruit), v = ml each, pig = colour + strength in the blend
const ING = {
  straw:   { name:'Strawberries', n:3, v:20, pig:['#e03a58', 3.2], rate:[0,.09,.18,.33] },
  banana:  { name:'Banana',       n:1, v:90, split:true, pig:['#f0d98a', 1.1], rate:[0,.12,.22,.36] },
  mango:   { name:'Mango',        n:3, v:27, pig:['#f7a823', 2.2], rate:[0,.1,.2,.34] },
  blue:    { name:'Blueberries',  n:1, v:40, pig:['#5a3a8e', 4.5], rate:[0,.1,.2,.34] },
  spinach: { name:'Spinach',      n:3, v:13, pig:['#3f8f3a', 9], rate:[0,.07,.16,.32] },
  orange:  { name:'Orange',       n:1, v:75, split:true, pig:['#f39a1e', 2.0], rate:[0,.1,.2,.34] },
  ice:     { name:'Ice cubes',    n:4, v:15, pig:['#eef6f7', .6], rate:[0,.03,.1,.31] },
  milk:    { name:'Milk',         liquid:true, v:250, pig:['#f8f5ee', 1], col:'#3e86d9', label:'MILK' },
  oj:      { name:'Orange juice', liquid:true, v:250, pig:['#f5a524', 1.2], col:'#f08a1c', label:'JUICE' },
};
const SOLIDS = ['straw', 'banana', 'mango', 'blue', 'spinach', 'orange', 'ice'], LIQS = ['milk', 'oj'];
function drinkName(st){
  const has = k => jugItems(st).some(it => it.kind === k);
  if (has('spinach')) return 'Green glow';
  if (has('blue')) return 'Purple power';
  if (has('straw') && has('banana')) return 'Berry banana';
  if ((has('mango') || has('orange')) && !has('straw')) return 'Tropical';
  if (has('straw')) return 'Pink berry';
  return 'Smoothie';
}

/* ---------- small helpers ---------- */
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let clipN = 0;
const clip2 = (pts, inner) => { const id = 'q' + (++clipN); return `<clipPath id="${id}"><path d="${sp(pts)}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };
const scr = pts3 => pts3.map(p => P(...p));
const hull2 = pts3 => hull(scr(pts3));
const rotT = (piv, th) => { const c = Math.cos(th), s = Math.sin(th); return l => [piv[0] + l[0], piv[1] + l[1]*c - l[2]*s, piv[2] + l[1]*s + l[2]*c]; };
// the jug's frame: tip by th toward local -y (the spout), turn so the spout faces the glass, scale by K
const jugT = (piv, th) => { const c = Math.cos(th), s = Math.sin(th);
  return l => { const a = l[0], b = l[1]*c - l[2]*s, z = l[1]*s + l[2]*c; return [piv[0] + K*(a*E1[0] + b*E2[0]), piv[1] + K*(a*E1[1] + b*E2[1]), piv[2] + K*z]; }; };
const ringL = (lz, r, n=32) => Array.from({length:n}, (_, i) => { const a = (-90 + i*360/n) * DEG; return [r*Math.cos(a), r*Math.sin(a), lz]; });
const ringT = (T, lz, r, n=28) => ringL(lz, r, n).map(T);
const zRing = (x, y, z, r, n=24) => on(PZ(z), ellUV(x, y, r, r, n));
function chaikin(pts, it=2){
  for (let k = 0; k < it; k++){ const o = []; for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i+1) % pts.length];
    o.push([a[0]*.75 + b[0]*.25, a[1]*.75 + b[1]*.25], [a[0]*.25 + b[0]*.75, a[1]*.25 + b[1]*.75]); } pts = o; }
  return pts;
}
function frustT(T, z0, z1, r0, r1, m, w=1.2, n=28){
  const A = ringT(T, z0, r0, n), B = ringT(T, z1, r1, n), up = sub(T([0,0,1]), T([0,0,0]));
  let s = loft(A, B, nr => toneI(nr, m));
  if (vis(up)) s += fill(pd(B), toneI(up, m)) + ink(pd(B), w*.7);
  else s += fill(pd(A), toneI(up.map(v => -v), m)) + ink(pd(A), w*.7);
  return s + hullInk([...A, ...B], w);
}
function mixCols(list, dflt='#f8f5ee'){ let r = 0, g = 0, b = 0, t = 0;
  for (const [c, w] of list){ if (w <= 0) continue; r += parseInt(c.substr(1,2),16)*w; g += parseInt(c.substr(3,2),16)*w; b += parseInt(c.substr(5,2),16)*w; t += w; }
  if (!t) return dflt;
  return '#' + [r, g, b].map(v => Math.round(v/t).toString(16).padStart(2,'0')).join(''); }
function stream(pts, col, w, t){
  if (pts.length < 2) return '';
  const d = pd(pts, false), cap = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  return `<path d="${d}" ${cap} stroke="${INK}" style="stroke-width:${f(w + 1.1*INK_K)}"/><path d="${d}" ${cap} stroke="${col}" style="stroke-width:${f(w)}"/>`
    + `<path d="${d}" ${cap} stroke="#ffffff" opacity=".55" style="stroke-width:${f(w*.28)}" stroke-dasharray="1.2 1.6" stroke-dashoffset="${f(t*14)}"/>`;
}
const dot2 = (X, Y, r, c, extra='') => `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="${c}" ${extra}/>`;

/* ---------- liquid in the (possibly tipped) jug: always level ---------- */
function volQ(q, th){
  const c = Math.cos(th), s = Math.sin(th), N = 48, dz = (JT - JF) / N; let v = 0;
  for (let k = 0; k < N; k++){
    const lz = JF + (k + .5)*dz, r = rIn(lz); let A;
    if (s < 1e-5) A = Math.PI*r*r * clamp((q - (lz - dz/2)) / dz, 0, 1);
    else { const t = (q - lz*c) / s; A = t >= r ? Math.PI*r*r : t <= -r ? 0 : r*r*Math.acos(-t/r) + t*Math.sqrt(r*r - t*t); }
    v += A*dz;
  }
  return v;
}
function levelQ(V, th){ let lo = -40, hi = 40; for (let i = 0; i < 34; i++){ const mid = (lo + hi)/2; if (volQ(mid, th) < V) lo = mid; else hi = mid; } return (lo + hi)/2; }
const qLip = th => -rIn(JT)*Math.sin(th) + JT*Math.cos(th);
function liqGeo(V, J, th){
  const q = levelQ(V, th), c = Math.cos(th), s = Math.sin(th), N = 32;
  const R0 = ringL(JF, rIn(JF), N), R1 = ringL(JT, rIn(JT), N);
  const g = p => p[1]*s + p[2]*c - q, below = [], surf = [];
  const cut = (a, b) => { const ga = g(a), gb = g(b); if ((ga <= 0) !== (gb <= 0)) surf.push(lerp3(a, b, ga / (ga - gb))); };
  for (let i = 0; i < N; i++){ const j = (i+1) % N; cut(R0[i], R0[j]); cut(R1[i], R1[j]); cut(R0[i], R1[i]);
    if (g(R0[i]) <= 0) below.push(R0[i]); if (g(R1[i]) <= 0) below.push(R1[i]); }
  const sw = surf.map(J);
  return { q, surf: sw.length > 2 ? hull(scr(sw)) : [], sil: hull(scr([...sw, ...below.map(J)])) };
}

/* ---------- state helpers ---------- */
const jugItems = st => st.items.filter(it => it.where === 'jug');
const solids = st => jugItems(st).reduce((a, it) => a + it.v, 0);
const liqVol = st => st.liq.milk + st.liq.oj;
const jugTotal = st => liqVol(st) + solids(st);
function renderV(st){
  const L = liqVol(st); if (L <= 0) return 0;
  const sol = solids(st), disp = Math.min(1, 1.6 * L / (L + sol || 1));
  return L + jugItems(st).reduce((a, it) => a + it.v*(1 - it.g) + it.v*it.g*disp, 0);
}
const smoothFrac = st => { const sol = solids(st); return sol ? 1 - jugItems(st).reduce((a, it) => a + it.v*it.g, 0) / sol : 1; };
const liqColour = st => mixCols([...LIQS.map(k => [ING[k].pig[0], st.liq[k]*ING[k].pig[1]]), ...jugItems(st).map(it => [ING[it.kind].pig[0], it.v*(1 - it.g)*ING[it.kind].pig[1]])],
                                st.liq.oj > st.liq.milk ? ING.oj.pig[0] : ING.milk.pig[0]);
const chunky = st => jugItems(st).some(it => it.g > .05);
const glassCap = (() => { let v = 0; const N = 40, dz = (GZT - GF)/N; for (let k = 0; k < N; k++){ const r = gIn(GF + (k+.5)*dz); v += Math.PI*r*r*dz; } return v; })();
const GLASS_STOP = glassCap * .93;
function glassLevel(V){ let z = GF; const dz = .05; let v = 0; while (v < V && z < GZT){ const r = gIn(z); v += Math.PI*r*r*dz; z += dz; } return z; }
function jugPose(st){
  if (!st.pour) return { piv:[BX, BY, PADZ], th:0 };
  return { piv:[BX, BY, PADZ + (POUR_CZ - PADZ)*ease(st.pour.e)], th: st.pour.th };
}
const J0 = jugT([BX, BY, PADZ], 0);

/* ---------- where each piece sits on the board, and in the jug ---------- */
const OFFS = { straw:[[-1.8,-1.4],[1.9,-.4],[-.2,2.1]], mango:[[-1.2,-1],[1.3,-.6],[0,1.5]], spinach:[[-1.6,-1.2],[1.5,-.4],[-.2,1.8]], ice:[[-1.4,-1.2],[1.3,-.9],[-.3,1.5],[.3,.1]] };
function srcPos(it){
  const [x, y] = posOf(it.kind), o = OFFS[it.kind] ? OFFS[it.kind][it.i] : [0, 0];
  if (it.kind === 'straw') return [x + o[0], y + o[1], H0 + 1.4];
  if (it.kind === 'mango') return [x + o[0], y + o[1], H0 + .6 + 1.05 + (it.i === 2 ? 0 : 0)];
  if (it.kind === 'spinach') return [x + o[0], y + o[1], H0 + .3];
  if (it.kind === 'ice') return [x + o[0], y + o[1], H0 + (it.i === 3 ? 2.6 : .6) + 1.05];
  if (it.kind === 'blue') return [x, y, H0 + 3.2];
  if (it.kind === 'orange') return [x, y, H0 + 2.6];
  return [x, y, H0 + 1.6];
}
function freshItems(){ const a = []; for (const k of SOLIDS) for (let i = 0; i < ING[k].n; i++) a.push({ kind:k, i, v:ING[k].v, g:1, where:'board', ft:0, slots:[] }); return a; }
// slot s in the jug: a loose heap, lower slots first; ice floats on the liquid
function slotLocal(st, s, kind){
  const a = s*2.39996, r = .9 + ((s*.618) % 1)*2.7;
  let z = JF + 1.5 + Math.floor(s/5)*1.5;
  const V = renderV(st); if (kind === 'ice' && V > 1) z = Math.max(z, levelQ(V, 0) - .7);
  return [r*Math.cos(a), r*Math.sin(a), Math.min(z, JT - 3)];
}

/* ---------- sprites (screen units) ---------- */
const BERRY_OUT = chaikin([[-1.6,-1.3],[-.5,-1.85],[.9,-1.45],[2.5,0],[.9,1.45],[-.5,1.85],[-1.6,1.3],[-1.95,0]], 2);
const SEEDS = [[.1,-.9],[1.1,-.45],[.5,.4],[-.6,.85],[1.4,.5],[-.5,-.15]];
const xf2 = (X, Y, sc, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return ([u, v]) => [X + (u*c - v*s)*sc, Y + (u*s + v*c)*sc]; };
function berry2(X, Y, sc, rot){
  const T = xf2(X, Y, sc, rot), out = BERRY_OUT.map(T);
  let o = fill(sp(out), BERRY.m) + clip2(out, fill(sp(out.map(([x, y]) => [x + .5*sc, y - .55*sc])), BERRY.l));
  for (const p of SEEDS){ const [x, y] = T(p); o += dot2(x, y, .2*sc, '#ffe7a0'); }
  o += ink(sp(out), 1);
  for (const a of [0, 60, -60, 125, -125]){ const r = a*DEG, d = [Math.cos(r), Math.sin(r)], pp = [-d[1], d[0]], cc = [-1.65, 0];
    const leaf = [[cc[0] + pp[0]*.42, cc[1] + pp[1]*.42], [cc[0] + d[0]*1.25, cc[1] + d[1]*1.25], [cc[0] - pp[0]*.42, cc[1] - pp[1]*.42]].map(T);
    o += fill(sp(leaf), LEAF) + ink(sp(leaf), .6); }
  return o;
}
function blob(X, Y, rx, ry, rot, c1, c2){   // a soft oval with a lit side (chunks, segments)
  const pts = Array.from({length:18}, (_, i) => { const a = i/18*2*Math.PI; return xf2(X, Y, 1, rot)([Math.cos(a)*rx, Math.sin(a)*ry]); });
  return fill(sp(pts), c2) + clip2(pts, fill(sp(pts.map(([x, y]) => [x + .35*rx, y - .35*ry])), c1)) + ink(sp(pts), .9);
}
const banChunk = (X, Y, r, rot) => blob(X, Y, r*1.15, r*.9, rot, BANIN, '#e9d9a8') + dot2(X + .15*r, Y - .1*r, .3*r, 'none', 'stroke="#c9b27a" stroke-width=".7"');
const segment = (X, Y, r, rot) => blob(X, Y, r*1.25, r*.75, rot, '#ffbb55', '#ef8a22');
function blueberry(X, Y, r){ return dot2(X, Y, r, '#3e3a7a') + dot2(X + r*.3, Y - r*.3, r*.6, '#5c5aa8') + dot2(X - r*.15, Y - r*.15, r*.22, '#1e1c40') + `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="none" stroke="${INK}" stroke-width=".7"/>`; }
const blueCluster = (X, Y, sc, rot) => [[0, 0], [1.1, .4], [-.6, .9], [.4, -.9]].map(([u, v]) => { const [x, y] = xf2(X, Y, sc, rot)([u, v]); return blueberry(x, y, .75*sc); }).join('');
const LEAF_OUT = chaikin([[-2.6, 0], [-1.2, -1.2], [.9, -1.3], [2.6, 0], [.9, 1.3], [-1.2, 1.2]], 2);
function leaf2(X, Y, sc, rot){ const T = xf2(X, Y, sc, rot), out = LEAF_OUT.map(T), a = T([-2.6, 0]), b = T([2.2, 0]), st = T([-3.4, .1]);
  return fill(sp(out), '#3f8f3a') + clip2(out, fill(sp(out.map(([x, y]) => [x + .4*sc, y - .5*sc])), '#5aaa48')) + ink(sp(out), .9)
    + `<path d="M${f(st[0])} ${f(st[1])}L${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" fill="none" stroke="#a9d68a" stroke-width=".8" stroke-linecap="round"/>`; }
function leaf3(c, ang){   // a spinach leaf lying flat on the board
  const ca = Math.cos(ang), sa = Math.sin(ang), T = ([u, v]) => [c[0] + (u*ca - v*sa)*1.15, c[1] + (u*sa + v*ca)*1.15, c[2]];
  const out = LEAF_OUT.map(T);
  return fill(pd(out), '#4f9a3c') + ink(pd(out), 1) + `<path d="${pd([T([-3.6, 0]), T([2.2, 0])], false)}" fill="none" stroke="#a9d68a" stroke-width=".9" stroke-linecap="round"/>`;
}
function orangeBall(X, Y, r, peeled){
  const c1 = peeled ? '#ffc277' : ORANGE.l, c2 = peeled ? '#f3a144' : ORANGE.m;
  let s = dot2(X, Y, r, c2) + clip2(Array.from({length:20}, (_, i) => [X + r*Math.cos(i/20*2*Math.PI), Y + r*Math.sin(i/20*2*Math.PI)]), dot2(X + .3*r, Y - .32*r, r, c1));
  if (peeled) for (const a of [-60, -20, 20, 60]){ const x = X + Math.sin(a*DEG)*r*.95; s += `<path d="M${f(X)} ${f(Y - r)}Q${f(x)} ${f(Y)} ${f(X)} ${f(Y + r)}" fill="none" stroke="#e08a2e" stroke-width=".7"/>`; }
  else s += dot2(X + .2*r, Y - .9*r, .22*r, '#5a7a2a') + `<path d="M${f(X + .2*r)} ${f(Y - .9*r)}q${f(.6*r)} ${f(-.5*r)} ${f(1.1*r)} ${f(-.1*r)}" fill="#5aa646" stroke="${INK}" stroke-width=".6"/>`;
  return s + `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="none" stroke="${INK}" stroke-width="1.1"/>`;
}
function tube2(spine3, rf, mat, tips=true){
  const n = 18, q = [];
  for (let i = 0; i <= n; i++){ const t = i/n, kk = t*(spine3.length - 1), j = Math.min(spine3.length - 2, Math.floor(kk)), u = kk - j;
    const a = spine3[Math.max(0, j-1)], b = spine3[j], c = spine3[j+1], d = spine3[Math.min(spine3.length-1, j+2)];
    const cr = (p0, p1, p2, p3) => .5*((2*p1) + (-p0 + p2)*u + (2*p0 - 5*p1 + 4*p2 - p3)*u*u + (-p0 + 3*p1 - 3*p2 + p3)*u*u*u);
    q.push({ p: P(cr(a[0],b[0],c[0],d[0]), cr(a[1],b[1],c[1],d[1]), cr(a[2],b[2],c[2],d[2])), r: rf(t) }); }
  const up = [], lo = [], mid = [], hl = [];
  q.forEach((o, i) => { const a = q[Math.max(0, i-1)].p, b = q[Math.min(n, i+1)].p; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    let nx = -dy, ny = dx; if (ny > 0){ nx = -nx; ny = -ny; }
    up.push([o.p[0] + nx*o.r, o.p[1] + ny*o.r]); lo.push([o.p[0] - nx*o.r, o.p[1] - ny*o.r]);
    mid.push([o.p[0] - nx*o.r*.2, o.p[1] - ny*o.r*.2]); hl.push([o.p[0] + nx*o.r*.5, o.p[1] + ny*o.r*.5]); });
  const outl = [...up, ...[...lo].reverse()];
  let s = fill(sp(outl), mat.l) + fill(sp([...mid, ...[...lo].reverse()]), mat.m);
  s += `<path d="M${hl.slice(3, -3).map(p => f(p[0]) + ' ' + f(p[1])).join('L')}" fill="none" stroke="#ffffff" opacity=".45" stroke-width="1.3" stroke-linecap="round"/>`;
  if (tips){ const e0 = q[0].p, e1 = q[n].p; s += dot2(e0[0], e0[1], .45, '#5a4220') + dot2(e1[0], e1[1], .7, '#5a4220'); }
  return s + ink(sp(outl), 1.1);
}
const banRad = t => 1.75 * (.3 + .7*Math.pow(Math.sin(Math.PI*clamp(t, .02, .98)), .6));
// the banana lies across its spot, curving outward
const banSpine3 = (d=[0,0,0]) => { const [x, y] = posOf('banana'); return [[-4.5, -1.2], [-1.6, .4], [1.6, .4], [4.5, -1.2]].map(([u, v]) => [x + v*.7 + d[0] + u*.7, y - u*.7 + v*.7 + d[1], H0 + 1.6 + d[2]]); };
function banPeel(){
  const [x, y] = posOf('banana'), S = [x + 3, y - 3, H0 + .4]; let s = '';
  for (const [dx, dy] of [[-4.5, 2.2], [-2, 5], [-5.4, -.6]]) s += tube2([S, [S[0] + dx*.5, S[1] + dy*.5, H0 + .4], [S[0] + dx, S[1] + dy, H0 + .3]], t => 1.35*(1 - .55*t), { l:'#f3cf47', m:'#d8ae28' }, false);
  return s + dot2(...P(...S), .7, '#5a4220');
}
function orangePeel(){
  const [x, y] = posOf('orange'), pts = [];
  for (let i = 0; i <= 8; i++){ const a = i*.9, r = 2.6 - i*.18; pts.push([x + r*Math.cos(a), y + r*Math.sin(a), H0 + .5 + (i % 2)*.4]); }
  return tube2(pts, t => .75, { l:'#ffa63a', m:'#e0801c' }, false);
}
const iceCube = (c, a) => box(c[0]-a, c[1]-a, c[2]-a, c[0]+a, c[1]+a, c[2]+a, ICE, toneI, .8);
const mangoCube = (c, a) => box(c[0]-a, c[1]-a, c[2]-a, c[0]+a, c[1]+a, c[2]+a, MANGO, toneI, .8);
// one chunk of an ingredient at world point w
function piece(kind, w, sc, rot){
  const [X, Y] = P(...w);
  switch (kind){
    case 'straw': return berry2(X, Y, .85*sc, rot);
    case 'banana': return banChunk(X, Y, 1.35*sc, rot);
    case 'orange': return segment(X, Y, 1.3*sc, rot);
    case 'blue': return blueCluster(X, Y, sc, rot);
    case 'spinach': return leaf2(X, Y, .75*sc, rot);
    case 'mango': return mangoCube(w, 1.05*sc);
    default: return iceCube(w, 1.05*sc);
  }
}

/* ---------- pieces in the jug: rest, tumbling in the vortex, breaking up ---------- */
function jugPieces(st, J){
  const out = [], ok = clamp(st.spin, 0, 1), V = renderV(st), lvl = V > 1 ? levelQ(V, 0) : JF + 4;
  for (const it of jugItems(st)){
    if (it.g <= .03) continue;
    it.slots.forEach(s0 => {
      const b = slotLocal(st, s0, it.kind), rho = 1.4 + ((s0*.37) % 1)*2.2, ph = s0*2.4 + st.orbitA*(.8 + (s0 % 3)*.15);
      const oz = JF + 1.3 + Math.max(.5, lvl - JF - 2.2) * (.5 + .45*Math.sin(st.orbitA*.9 + s0*1.7));
      const base = lerp3(b, [rho*Math.cos(ph), rho*Math.sin(ph), oz], ok);
      const nf = it.g > .7 ? 1 : it.g > .35 ? 2 : 3, sc = (it.kind === 'ice' || it.kind === 'mango' ? .55 : .45) + .55*it.g;
      for (let q = 0; q < nf; q++){
        const a = ph*1.3 + q*2.1, spread = nf > 1 ? .9 + (1 - it.g)*.8 : 0;
        const l = [base[0] + spread*Math.cos(a), base[1] + spread*Math.sin(a), base[2] + (q - 1)*.35*(nf > 1)];
        const r = Math.hypot(l[0], l[1]), lim = rIn(l[2]) - 1.4; if (r > lim){ l[0] *= lim/r; l[1] *= lim/r; }
        const w = J(l);
        out.push({ at: w, above: V <= 1 || l[2] > lvl - .5, svg: piece(it.kind, w, sc / (nf > 1 ? 1.1 : 1), (it.i + s0)*1.3 + st.orbitA*(q + 1)*.6) });
      }
    });
  }
  return out;
}
// a piece on its way from the board into the jug; peeled fruit flies whole, then splits over the opening
function flights(st){
  const air = [], inside = [];
  for (const it of st.items){ if (it.where !== 'fly' || it.ft <= 0) continue;
    const t = it.ft, src = srcPos(it);
    if (ING[it.kind].split){
      const apex = J0([0, 0, JT + 3.5]);
      if (t < .72){ const u = ease(t/.72), ctl = [apex[0], apex[1], RIMZ + 12], p = lerp3(lerp3(src, ctl, u), lerp3(ctl, apex, u), u);
        if (it.kind === 'banana') air.push({ at:p, svg: tube2(banSpine3(sub(p, src)), u2 => banRad(u2)*.85, { l:BANIN, m:'#e6d6a6' }, false) });
        else air.push({ at:p, svg: orangeBall(...P(...p), 2.6*1.22, true) });
      } else { const u = (t - .72)/.28; it.slots.forEach((s0, j) => { const p = lerp3(apex, J0(slotLocal(st, s0, it.kind)), u*u); (p[2] > RIMZ ? air : inside).push({ at:p, svg: piece(it.kind, p, 1, j*2) }); }); }
      continue;
    }
    // up and over the rim to a point just above the mouth, then straight down through the opening onto its spot
    // (one curve from the board to the spot came in sideways, through the glass wall)
    const dst = J0(slotLocal(st, it.slots[0], it.kind)), top = [dst[0], dst[1], RIMZ + 3], TA = .7;
    let p;
    if (t < TA){ const u = ease(t / TA), ctl = [(src[0] + top[0]) / 2, (src[1] + top[1]) / 2, RIMZ + 14]; p = lerp3(lerp3(src, ctl, u), lerp3(ctl, top, u), u); }
    else { const u = (t - TA) / (1 - TA); p = lerp3(top, dst, u * u); }
    (p[2] > RIMZ ? air : inside).push({ at:p, svg: piece(it.kind, p, 1, t*6 + it.i) });
  }
  return { air, inside };
}

/* ---------- the jug ---------- */
function blades(st, J){
  const parts = [], fast = st.spin > .55;
  for (let k = 0; k < 4; k++){
    const a = st.bladeA + k*Math.PI/2, ca = Math.cos(a), sa = Math.sin(a), pw = [-sa, ca];
    const tz = JF + .8 + (k % 2 ? .9 : -.3), b0 = .5, L = 3.3;
    const q = [[b0*ca + pw[0]*.3, b0*sa + pw[1]*.3, JF + .8], [L*ca + pw[0]*.2, L*sa + pw[1]*.2, tz], [L*ca - pw[0]*.2, L*sa - pw[1]*.2, tz], [b0*ca - pw[0]*.3, b0*sa - pw[1]*.3, JF + .8]].map(J);
    parts.push({ at: J([L*ca*.5, L*sa*.5, JF + .8]), svg: shape(q, METAL.l, .7) });
  }
  let s = fast ? fill(pd(ringT(J, JF + 1, 3.4, 28)), METAL.m, 'opacity=".5"') + ink(pd(ringT(J, JF + 1, 3.4, 28)), .5) : '';
  s += fast ? `<g opacity=".35">${byDepth(parts)}</g>` : byDepth(parts);
  return s + frustT(J, JF - .1, JF + 1.2, .75, .6, METAL, .8, 14);
}
function jugSvg(st, m, pose, fl){
  const J = jugT(pose.piv, pose.th), th = pose.th, RN = l => sub(J(l), J([0,0,0]));
  const out0 = ringT(J, JC, ROB, 32), out1 = ringT(J, JT, ROT, 32), in0 = ringT(J, JF, rIn(JF), 32), in1 = ringT(J, JT, rIn(JT), 32);
  const sil = hull2([...out0, ...out1]), inSil = hull2([...in0, ...in1]);
  const kxr = ease(st.xr || 0), collar = (c => kxr > 0 ? `<g opacity="${f(1 - .62*kxr)}">${c}</g>` : c)(frustT(J, 0, JC, 5.1, 5.0, DARK, 1.6)), collarFirst = !vis(RN([0, 0, -1]));
  // the handle is on the jug's +y side: behind the glass when that side faces away (seen through it), in front otherwise
  const handleNear = vis(RN([0, 1, 0]));
  let s = (handleNear ? '' : handle(J, m)) + (collarFirst ? collar : '');
  s += `<g opacity=".7">${loft(out0, out1, n => toneI(n, GLASSW), true)}</g>`;
  let inn = fill(pd(in0), '#d4e3e6', 'opacity=".55"');
  const V = renderV(st), pieces = th < .01 ? jugPieces(st, J) : [];
  if (V > 1){
    const G = liqGeo(V, J, th), col = liqColour(st);
    inn += fill(sp(G.sil), mix(col, '#000000', .1)) + clip2(G.sil, fill(sp(G.sil.map(([x, y]) => [x + 2.2, y])), col));
    inn += blades(st, J) + byDepth(pieces.filter(p => !p.above));
    if (G.surf.length){
      inn += `<path d="${sp(G.sil)}${sp(G.surf)}" fill="${col}" fill-rule="evenodd" opacity=".5"/>`;
      const top = mix(col, '#ffffff', .3);
      let sf = fill(sp(G.surf), top);
      const dv = Math.min(st.spin*2.6, (G.q - JF)*.7);
      if (th < .01 && dv > .15){
        const R = rIn(G.q);
        for (let k = 1; k <= 5; k++){ const u = k/5; sf += fill(pd(ringT(J, G.q - dv*Math.pow(u, 1.3), R*(1 - .82*u), 28)), mix(top, '#000000', .05 + .07*k)); }
        for (let a = 0; a < 3; a++){ const pts = [];
          for (let i = 0; i <= 14; i++){ const u = i/14, ang = st.orbitA*1.7 + a*2.094 + u*2.6, r = R*(1 - .82*u); pts.push(J([r*Math.cos(ang), r*Math.sin(ang), G.q - dv*Math.pow(u, 1.3)])); }
          sf += `<path d="${pd(pts, false)}" fill="none" stroke="${mix(col, '#000000', .28)}" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`; }
        // streaks of whatever is still being chopped
        const ch = jugItems(st).filter(it => it.g > .05 && it.kind !== 'ice');
        ch.slice(0, 3).forEach((it, a) => { const pts = [];
          for (let i = 0; i <= 10; i++){ const u = .1 + i/14, ang = st.orbitA*1.7 + a*2.1 + 1 + u*2.6, r = R*(1 - .82*u); pts.push(J([r*Math.cos(ang), r*Math.sin(ang), G.q - dv*Math.pow(u, 1.3)])); }
          sf += `<path d="${pd(pts, false)}" fill="none" stroke="${ING[it.kind].pig[0]}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`; });
      }
      inn += clip2(G.surf, sf) + `<path d="${sp(G.surf)}" fill="none" stroke="${mix(col, '#000000', .3)}" stroke-width=".7"/>`;
    }
    inn += byDepth(pieces.filter(p => p.above));
    st._jugZ = pose.piv[2] + K*G.q;
  } else { inn += blades(st, J) + byDepth(pieces); st._jugZ = pose.piv[2] + K*(JF + (pieces.length ? 2.5 : 0)); }
  inn += byDepth(fl.inside);
  if (st.mflow > 0 && st._spout) inn += stream([[st._spout[0], st._spout[1], RIMZ], [st._spout[0], st._spout[1], st._jugZ]], ING[st.carton.kind].pig[0], 1.2, st.time);
  s += clip2(inSil, inn);
  // glass: tint, streaks, marks, ink
  s += fill(sp(sil), '#cfe9f0', 'opacity=".16" pointer-events="none"');
  let stk = '';
  for (const [a0, a1] of [[-37, -30], [-25, -22]]){ const g = (a, lz) => J([(rOut(lz) + .03)*Math.cos(a*DEG), (rOut(lz) + .03)*Math.sin(a*DEG), lz]);
    stk += fill(pd([g(a0, 6), g(a1, 6), g(a1, 19.5), g(a0, 19.5)]), '#ffffff', 'opacity=".4"'); }
  s += `<g pointer-events="none">${clip2(sil, stk)}</g>`;
  for (const ml of [250, 500, 750, 1000, 1250]){
    const lz = levelQ(ml, 0), big = ml % 500 === 0, r = rOut(lz) + .03, arc = [];
    for (let a = -15; a <= (big ? 1 : -5); a += 4) arc.push(J([r*Math.cos(a*DEG), r*Math.sin(a*DEG), lz]));
    s += `<path d="${pd(arc, false)}" fill="none" stroke="${INK}" stroke-width="${big ? 1 : .8}" stroke-linecap="round" opacity=".75"/>`;
    if (big){ const a = 12*DEG, o = P(...J([r*Math.cos(a), r*Math.sin(a), lz - .6]));
      s += `<text transform="${txM(o, Dv(...RN([Math.sin(a), -Math.cos(a), 0])), Dv(...RN([0, 0, -1])))}" font-size="1.9" fill="${INK}" opacity=".8" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">${ml}</text>`; }
  }
  const lidOnJug = st.lidOn && st.lidT === 0;
  if (!lidOnJug) s += ink(pd(out1), 1.1) + ink(pd(in1), .6);
  const lipR = rOut(JT), lip = [J([-1.5, -lipR + .2, JT]), J([0, -lipR - 1.2, JT + .25]), J([1.5, -lipR + .2, JT])];
  s += fill(pd(lip), '#e4f1f3') + ink(pd(lip, false), .9);
  s += ink(pd(out0), .8) + hullInk([...out0, ...out1], 2.2);
  if (!collarFirst) s += collar;
  if (lidOnJug) s += act('lid', lidSolid(l => J([l[0], l[1], l[2] + JT - .3])));
  return s + (handleNear ? handle(J, m) : '');
}
function lidSolid(T){ return frustT(T, 0, 1.7, 6.3, 6.25, DARK, 1.5, 32) + frustT(T, 1.7, 2.7, 2.1, 1.9, { l:'#6d675f', m:'#4b4640', d:'#2c2925' }, 1, 20); }
const lidAt = p => lidSolid(l => [p[0] + K*l[0], p[1] + K*l[1], p[2] + K*l[2]]);
function handle(J, m){
  const a = [0, rOut(18.5) - .3, 18.5], b = [0, 9.8, 18.2], c = [0, 9.2, 7.6], d = [0, rOut(7) - .3, 7];
  let s = rod(J(a), J(b), .85*K, m, toneI, 1.1) + rod(J(c), J(d), .85*K, m, toneI, 1.1) + rod(J(b), J(c), 1.05*K, m, toneI, 1.2);
  for (const p of [b, c]){ const [X, Y] = P(...J(p)); s += `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(1.05*1.2*K)}" fill="${m.m}" stroke="${INK}" stroke-width="1"/>`; }
  return s;
}

/* ---------- motor base: dial, pulse button, run light, and a little screen with the drink's name ---------- */
function baseSvg(st, m){
  const x1 = BX + BHW, FX = PX(x1);
  // the end facing the viewer gets its panel; the controls are on the front (+x) end, so they show only from the front
  const front = vis([1, 0, 0]), BK = PX(BX - BHW);
  let s = extrude(BPROF, BX - BHW, x1, m) + (front ? shape(on(FX, BPROF), tone([1, 0, 0], m), 0) + ink(pd(on(FX, BPROF)), 2)
                                                   : shape(on(BK, BPROF), tone([-1, 0, 0], m), 0) + ink(pd(on(BK, BPROF)), 2));
  if (front){
  const yK = BY + 3*K, zK = H0 + 4.1*K, ALPHA = [150, 110, 70, 30], spd = st.blend ? st.blend.speed : 0;
  const ptAt = (a, R, dz=0) => [yK - R*Math.cos(a*DEG), zK + R*Math.sin(a*DEG) + dz];
  ALPHA.forEach((a, i) => { const [u, v] = ptAt(a, 3.3*K, -.7); s += tx(x1 + .2, u, v, String(i), 2.1, i === spd && spd ? INK : mix(tone([1,0,0], m), '#000000', .55), 800); });
  let kn = cylX(x1, x1 + 1.6*K, yK, zK, 2.0*K, CERAMIC, toneI, 1.1, 28);
  const [pu, pv] = ptAt(ALPHA[spd], 1.5*K);
  kn += `<path d="${pd([[x1 + 1.65*K, yK, zK], [x1 + 1.65*K, pu, pv]], false)}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
  s += act('dial', kn);
  const pushed = st.blend && st.blend.pulse && st.blend.left > 0, py = BY - 4.4*K, pz = H0 + 3.6*K, pl = pushed ? .3 : 1.0;
  s += act('pulse', cylX(x1, x1 + pl, py, pz, 1.6*K, CERAMIC, toneI, 1, 20) + tx(x1 + pl + .05, py, pz - .75, 'P', 2.2, INK, 800));
  // screen: speed while running, the drink's name when it is smooth
  const sc = on(PX(x1 + .1), rrUV(BY - 7*K, H0 + 8.3*K, BY + 7*K, H0 + 10.3*K, .8));
  s += shape(sc, '#1d2a26', 1.1);
  const lit = st.blend && st.blend.left > 0, sol = solids(st) > 0;
  const msg = lit ? `${SPN[st.blend.speed].toUpperCase()}` : jugTotal(st) < 1 ? 'READY' : !liqVol(st) ? 'ADD LIQUID' : !sol ? 'LIQUID ONLY' : chunky(st) ? `${Math.round(smoothFrac(st)*100)}% SMOOTH` : drinkName(st).toUpperCase();
  s += tx(x1 + .2, BY, H0 + 8.75*K, msg, 2.2, '#8af0ae', 800);
  s += shape(on(PX(x1 + .1), ellUV(BY - 4.4*K, H0 + 6.6*K, .55*K, .55*K, 12)), lit ? '#43c25c' : '#b5b2a6', .7);
  }
  s += hullInk([...on(PX(BX - BHW), BPROF), ...on(FX, BPROF)], 2.7);
  return s + cyl(BX, BY, BZ1, PADZ, 5.6*K, DARK, toneI, 1.2, 28);
}

/* ---------- props in the empty corner (no actions: they just set the scene) ---------- */
function choppingBoard(){
  const CB = { l:'#ecd2a2', m:'#d8b67e', d:'#b08a52' }, z1 = H0 + 1.4;
  let s = box(3, 4, H0, 17, 16, z1, CB, tone, 1.1);
  s += ink(pd([[14.5, 5.2, z1 + .02], [14.5, 14.8, z1 + .02]], false), .5);                         // a groove near the edge
  // knife: steel blade lying flat, dark handle
  s += shape([[5, 7, z1 + .05], [12.5, 6.2, z1 + .05], [12.5, 7.6, z1 + .05], [5.4, 8.1, z1 + .05]], METAL.l, .8);
  s += box(12.5, 6.1, z1, 16.4, 7.7, z1 + .9, DARK, toneI, .9);
  // half a lemon, cut face up
  const LM = { l:'#f7dd5a', m:'#e9c43a', d:'#b8932a' }, c = [9.5, 12, z1];
  s += loft(zRing(c[0], c[1], z1, 2.3, 18), zRing(c[0], c[1], z1 + 1.6, 2.6, 18), n => toneI(n, LM)) + fill(pd(zRing(c[0], c[1], z1 + 1.6, 2.6, 18)), '#fbf3c6');
  for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3; s += ink(pd([[c[0], c[1], z1 + 1.62], [c[0] + 2.1*Math.cos(a), c[1] + 2.1*Math.sin(a), z1 + 1.62]], false), .35); }
  return s + ink(pd(zRing(c[0], c[1], z1 + 1.6, 2.6, 18)), .8);
}
function strawCup(){
  const CUPM = { l:'#f3a6bb', m:'#d8869c', d:'#a85a70' }, cx = 9, cy = 23, z1 = H0 + 8;
  const A = zRing(cx, cy, H0, 2.6, 18), B = zRing(cx, cy, z1, 2.9, 18);
  // an open cup: inside far wall, then the straws standing in it, then the near outer wall over their lower ends
  let s = loft(A, B, n => toneI(n, { l: CUPM.d, m: CUPM.d, d: mix(CUPM.d, '#000000', .25) }), true);
  const cols = ['#e2473a', '#3e86d9', '#f2c230'];
  [[-.8, -.5, 15, -1.6], [.6, .4, 14, 1.2], [-.1, .9, 13.4, .2]].forEach(([dx, dy, h, lean], i) => {
    const a = [cx + dx, cy + dy, H0 + 1], b = [cx + dx + lean * .5, cy + dy + lean, H0 + h], d = pd([a, b], false);
    s += `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:1.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${cols[i]}" style="stroke-width:.8" stroke-linecap="round"/>`; });
  return s + loft(A, B, n => toneI(n, CUPM)) + ink(pd(B), .9) + hullInk([...A, ...B], 1.2);
}

/* ---------- things on the board ---------- */
function bowl(c, rb, rt, h, mat, inner, contents){   // inner far wall, floor, contents, near wall
  const bot = zRing(c[0], c[1], H0, rb, 28), top = zRing(c[0], c[1], H0 + h, rt, 28);
  return loft(bot, top, n => toneI(n, mat), true) + fill(pd(zRing(c[0], c[1], H0 + .6, rb + .1, 24)), inner) + contents
    + loft(bot, top, n => toneI(n, mat)) + ink(pd(top), 1.1) + hullInk([...bot, ...top], 1.5);
}
const onBoard = (st, k) => st.items.filter(it => it.kind === k && it.where === 'board');
function boardThing(st, k){
  const c = posOf(k), used = st.used[k];
  switch (k){
    case 'straw': return onBoard(st, k).map(it => { const p = srcPos(it); return berry2(...P(...p), 1, [.5, -1.2, 2.3][it.i]); }).join('');
    case 'banana': return used ? banPeel() : tube2(banSpine3(), banRad, BAN);
    case 'orange': return used ? orangePeel() : orangeBall(...P(c[0], c[1], H0 + 2.6), 2.6*1.22, false);
    case 'spinach': return onBoard(st, k).map(it => leaf3(srcPos(it), [.4, -1, 2][it.i])).join('');
    case 'mango': return cyl(c[0], c[1], H0, H0 + .6, 4.1, CERAMIC, toneI, 1.1, 28) + byDepth(onBoard(st, k).map(it => ({ at: srcPos(it), svg: mangoCube(srcPos(it), 1.05) })));
    case 'ice': return bowl(c, 3.1, 4.6, 3, BOWL, BOWL.d, byDepth(onBoard(st, k).map(it => ({ at: srcPos(it), svg: iceCube(srcPos(it), 1.05) }))));
    case 'blue': { let b = '';
      if (!used) [[0,0,3.1],[1.3,.6,2.9],[-1.2,.8,2.9],[.5,-1.4,2.9],[-.8,-1,2.9],[1.9,-.9,2.6],[-1.9,-.3,2.6],[.2,1.9,2.6],[-.3,.5,3.6]].sort((a, q) => a[0]+a[1]+a[2] - q[0]-q[1]-q[2])
        .forEach(([dx, dy, dz]) => { const [X, Y] = P(c[0] + dx, c[1] + dy, H0 + dz); b += blueberry(X, Y, .85); });
      return bowl(c, 2.8, 4, 2.8, BOWL2, BOWL2.d, b); }
  }
  return '';
}
const THING_H = { straw:2.8, banana:3.2, orange:5.2, spinach:.4, mango:2.8, ice:3, blue:3 };
function cartonT(st, k){
  const [x, y] = posOf(k), rest = [x, y, H0], pourP = [BX, BY + 15.5, RIMZ + 2.5 + 6.58];
  const kk = st.carton && st.carton.kind === k ? st.carton.k : 0, e = ease(kk);
  return { T: rotT(lerp3(rest, pourP, e), 105*DEG*ease(clamp((kk - .15)/.85, 0, 1))), lifted: kk > 0 };
}
function cartonSvg(st, k){
  const { T } = cartonT(st, k), a = 3.4, hw = 14.5, ap = 17.5, RN = n => sub(T(n), T([0,0,0])), I = ING[k];
  const W2 = { l:'#fbfaf3', m:'#e3e0d2', d:'#bdb8a6' };
  const F = [
    [[1,0,0], [[a,-a,0],[a,a,0],[a,a,hw],[a,0,ap],[a,-a,hw]]], [[-1,0,0], [[-a,-a,0],[-a,a,0],[-a,a,hw],[-a,0,ap],[-a,-a,hw]]],
    [[0,1,0], [[-a,a,0],[a,a,0],[a,a,hw],[-a,a,hw]]], [[0,-1,0], [[-a,-a,0],[a,-a,0],[a,-a,hw],[-a,-a,hw]]],
    [norm([0,3,3.4]), [[-a,a,hw],[a,a,hw],[a,0,ap],[-a,0,ap]]], [norm([0,-3,3.4]), [[-a,-a,hw],[a,-a,hw],[a,0,ap],[-a,0,ap]]],
    [[0,0,-1], [[-a,-a,0],[a,-a,0],[a,a,0],[-a,a,0]]] ];
  const capN = RN([0, -.66, .75]), cap = rod(T([0, -1.4, 16.3]), T([0, -2.2, 17.2]), .9, matOf(I.col), toneI, .9);
  let s = vis(capN) ? '' : cap;
  for (const [n, q] of F){ const rn = RN(n); if (!vis(rn)) continue;
    s += shape(q.map(T), toneI(rn, W2), .9);
    if (Math.abs(n[2]) < .1){ const band = n[0] ? [[n[0]*a*1.01, -a, 3], [n[0]*a*1.01, a, 3], [n[0]*a*1.01, a, 7], [n[0]*a*1.01, -a, 7]]
                                                  : [[-a, n[1]*a*1.01, 3], [a, n[1]*a*1.01, 3], [a, n[1]*a*1.01, 7], [-a, n[1]*a*1.01, 7]];
      s += fill(pd(band.map(T)), toneI(rn, matOf(I.col))); }
    if (n[0] === 1){ const o = P(...T([a + .05, 0, 9.4]));
      s += `<text transform="${txM(o, Dv(...RN([0,-1,0])), Dv(...RN([0,0,-1])))}" font-size="2.3" fill="${I.col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">${I.label}</text>`; }
  }
  if (vis(capN)) s += cap;
  const pts = []; for (const x of [-a, a]) for (const [y, z] of [[-a,0],[a,0],[-a,hw],[a,hw],[0,ap]]) pts.push(T([x, y, z]));
  s += hullInk(pts, 2);
  if (st.carton && st.carton.kind === k) st._spout = T([0, -2.3, 17.3]);
  return act(k, s);
}
function tumbler(st){
  const A = zRing(GX, GY, H0, GB, 32), B = zRing(GX, GY, GZT, GT, 32), iA = zRing(GX, GY, GF, gIn(GF), 32), iB = zRing(GX, GY, GZT, gIn(GZT), 32);
  const sil = hull2([...A, ...B]);
  let s = `<g opacity=".7">${loft(A, B, n => toneI(n, GLASSW), true)}</g>`;
  let inn = fill(pd(iA), '#d4e3e6', 'opacity=".6"'), zs = GF;
  if (st.glassV > .5){
    zs = glassLevel(st.glassV); const top = zRing(GX, GY, zs, gIn(zs), 32), sl = hull2([...iA, ...top]), col = st.glassCol;
    inn += fill(sp(sl), mix(col, '#000000', .1)) + clip2(sl, fill(sp(sl.map(([x, y]) => [x + 1.4, y])), col)) + fill(pd(top), mix(col, '#ffffff', .3)) + ink(pd(top), .7);
  }
  let above = '';
  if (st.flow > 4 && st._lip){
    const L = st._lip, w = clamp(st.flow/90, .45, 1)*1.6, bot = [GX + (L[0] - GX)*.3, GY + (L[1] - GY)*.3, zs], path = [];
    for (let i = 0; i <= 12; i++) path.push(lerp3(L, bot, i/12));
    const up = path.filter(p => p[2] >= GZT), dn = path.filter(p => p[2] <= GZT);
    for (let i = 1; i < path.length; i++) if (path[i][2] < GZT && path[i-1][2] >= GZT){ const a = path[i-1], b = path[i], c = lerp3(a, b, (a[2] - GZT)/(a[2] - b[2])); up.push(c); dn.unshift(c); break; }
    const col = st._pourCol || st.glassCol;
    inn += stream(dn, col, w, st.time) + fill(pd(zRing(bot[0], bot[1], zs + .02, 1.4, 16)), mix(col, '#ffffff', .45), 'opacity=".8"');
    above = stream(up, col, w, st.time);
  }
  s += clip2(hull2([...iA, ...iB]), inn) + fill(sp(sil), '#cfe9f0', 'opacity=".16"');
  const g = (a, z) => { const r = GB + (z - H0)/(GZT - H0)*(GT - GB) + .03; return [GX + r*Math.cos(a*DEG), GY + r*Math.sin(a*DEG), z]; };
  s += clip2(sil, fill(pd([g(8, H0 + 2), g(16, H0 + 2), g(16, GZT - 1.5), g(8, GZT - 1.5)]), '#ffffff', 'opacity=".4"') + fill(pd([g(21, H0 + 2), g(24, H0 + 2), g(24, GZT - 1.5), g(21, GZT - 1.5)]), '#ffffff', 'opacity=".4"'));
  s += ink(pd(iA), .7) + ink(pd(B), 1.1) + ink(pd(iB), .6) + hullInk([...A, ...B], 1.9);
  return act('glass', s) + above;
}

/* ---------- scene ---------- */
const BTOP = boardTop(0, 0, BW, BD, H0, 6);
function lidPos(st){ const u = ease(st.lidT), p = lerp3(J0([0, 0, JT - .3]), LIDREST, u); p[2] += 9*Math.sin(Math.PI*u); return p; }
function scene(st, m){
  clipN = 0; st._spout = null;
  // mains cord: out of the back of the motor base, flat across the board to its back edge (x = 0), then down over it.
  // The flat part can go first; the part hanging off the edge is behind the board, or in front of it seen from behind.
  const cordD = pts => { const d = pd(pts, false); return `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="#3b3834" style="stroke-width:1.5" stroke-linecap="round" stroke-linejoin="round"/>`; };
  // it runs through the clear lane between the chopping board (y <= 16) and the straw cup (y >= 20), under nothing
  const cy0 = BY - 5, cordFlat = cordD([[BX - BHW, cy0, H0 + 2.2], [BX - BHW - 2, cy0 - 1.5, H0 + .7], [13.5, 19.5, H0 + .7], [11, 18.2, H0 + .7], [.4, 18, H0 + .7]]);
  const cordHang = cordD([[.4, 18, H0 + .7], [-1.2, 18, H0 - .4], [-1.6, 18, -9]]), hangFront = facing([-1, 0, 0]);
  let s = (hangFront ? '' : cordHang) + board(0, 0, BW, BD, H0, 6, WOOD) + (hangFront ? cordHang : '');
  const pose = jugPose(st), J = jugT(pose.piv, pose.th), fl = flights(st);
  // shadows: solid for solid things, lighter for glass, half for things in the air
  let sh = '', half = '', light = '';
  sh += castShadow([...on(PX(BX - BHW), BPROF), ...on(PX(BX + BHW), BPROF)], H0);
  const jpts = [...ringT(J, 0, 5.1, 16), ...ringT(J, JT + (st.lidOn && !st.lidT ? 2.7 : 0), ROT, 16), J([0, 9.8, 18.2]), J([0, 9.2, 7.6])];
  if (st.pour) half += castShadow(jpts, H0); else light += castShadow(jpts, H0);
  light += castShadow([...zRing(GX, GY, H0, GB, 16), ...zRing(GX, GY, GZT, GT, 16)], H0);
  for (const k of SOLIDS){ const [x, y] = posOf(k), r = RING[k][2] - .6, h = THING_H[k];
    if (k === 'straw' || k === 'spinach'){ if (k === 'straw') onBoard(st, k).forEach(it => { const p = srcPos(it); sh += castShadow([...zRing(p[0], p[1], H0, 1.5, 10), ...zRing(p[0], p[1], H0 + h, 1.3, 10)], H0); }); continue; }
    if (k === 'banana' && st.used.banana) continue;
    sh += castShadow([...zRing(x, y, H0, r*.75, 14), ...zRing(x, y, H0 + h, r, 14)], H0); }
  for (const k of LIQS){ const { T, lifted } = cartonT(st, k), cp = [];
    for (const x of [-3.4, 3.4]) for (const y of [-3.4, 3.4]) for (const z of [0, 17.5]) cp.push(T([x, y, z]));
    if (lifted) half += castShadow(cp, H0); else sh += castShadow(cp, H0); }
  if (!(st.lidOn && st.lidT === 0)){ const lp = lidPos(st), lr = [...zRing(lp[0], lp[1], lp[2], 6.3*K, 16), ...zRing(lp[0], lp[1], lp[2] + 2.7*K, 6.2*K, 16)];
    if (st.lidT < 1) half += castShadow(lr, H0); else sh += castShadow(lr, H0); }
  // the empty corner: a chopping board with a knife and half a lemon, and a cup of straws
  sh += castShadow([[3,4,H0],[17,4,H0],[17,16,H0],[3,16,H0],[3,4,H0+1.4],[17,4,H0+1.4],[17,16,H0+1.4],[3,16,H0+1.4]], H0)
      + castShadow([...zRing(9, 23, H0, 2.6, 14), ...zRing(9, 23, H0 + 8, 2.9, 14), [9.6, 23.4, H0 + 15]], H0);
  s += clipTo(BTOP, `<g opacity=".45">${light}</g><g opacity=".5">${half}</g>${sh}`);
  s += cordFlat;   // after the shadows, which would otherwise paint over the cord lying on the board

  // ---- things on the board, back to front; the blender shakes a little while it runs ----
  const parts = [];
  for (const k of SOLIDS){ const [x, y] = posOf(k); parts.push({ at:[x, y, 1], svg: act(k, boardThing(st, k)) }); }
  parts.push({ box:[[3, 4, H0], [17, 16, H0 + 3]], svg: choppingBoard() }, { box:[[6.1, 20.1, H0], [11.9, 25.9, H0 + 15]], svg: strawCup() });
  const shk = st.spin*.15, jx = shk*Math.sin(st.time*97), jy = shk*.8*Math.sin(st.time*131 + 1);
  OX += jx; OY += jy;
  let bl;
  try {
    const kx = ease(st.xr || 0);
    bl = (kx > 0 ? xrUnder(baseSvg(st, m), '', kx) + `<g opacity="${f(kx)}">${XR_OPTS.mech(st, kx)}</g>` : baseSvg(st, m)) + jugSvg(st, m, pose, fl)
      + (kx > 0 ? `<g opacity="${f(kx)}">${jugDrive(st, pose)}</g>` : '');   // the jug's half of the drive, over its faded collar
    if (st.mflow > 0 && st._spout) bl += stream([st._spout, [st._spout[0], st._spout[1], RIMZ]], ING[st.carton.kind].pig[0], 1.2, st.time);
  } finally { OX -= jx; OY -= jy; }
  st._lip = J([0, -rOut(JT) - 1.1, JT + .25]);
  parts.push({ at:[BX, BY, 8], svg: bl });
  // while the jug pours it is above the glass, so the glass goes first then
  parts.push({ at: st.pour ? [BX - 30, BY - 30, 0] : [GX, GY, 6], svg: tumbler(st) });
  for (const k of LIQS) if (!cartonT(st, k).lifted){ const [x, y] = posOf(k); parts.push({ at:[x, y, 8], svg: cartonSvg(st, k) }); }
  const lidFree = !(st.lidOn && st.lidT === 0);
  if (lidFree && st.lidT >= 1) parts.push({ at:LIDREST, svg: act('lid', lidAt(LIDREST)) });
  s += byDepth(parts);
  // ---- in the air ----
  if (lidFree && st.lidT < 1) s += lidAt(lidPos(st));
  s += byDepth(fl.air);
  for (const k of LIQS) if (cartonT(st, k).lifted) s += cartonSvg(st, k);
  return s;
}

/* ---------- behaviour ---------- */
let ui;
function anim(st, fn){ const g = st.gen; ui.animate(dt => st.gen === g ? fn(dt) !== false : false); }
const BUSY = { lid:'the lid is moving', adding:'still adding', liquid:'still pouring', pour:'still pouring' };
const busyWhy = st => st.busy ? `wait — ${BUSY[st.busy]}` : st.blend ? 'wait — the blender is running' : null;
const lidOnJug = st => st.lidOn && st.lidT === 0;
function addBlock(st, k){ if (st.used[k]) return `the ${ING[k].name.toLowerCase()} ${['banana', 'mango', 'spinach', 'orange', 'milk', 'oj'].includes(k) ? 'is' : 'are'} already in`; return busyWhy(st); }
function blendBlock(st){
  if (st.busy) return busyWhy(st);
  if (jugTotal(st) < 1) return 'the jug is empty — add some fruit and a liquid first';
  if (liqVol(st) <= 0) return 'pour in milk or juice first — the blades need liquid';
  if (!lidOnJug(st)) return 'put the lid on first — it would splash out';
  return null;
}
function lidMove(st, to, then){
  st.busy = 'lid'; if (to === 1) st.lidOn = false;
  anim(st, dt => { st.lidT = clamp(st.lidT + Math.sign(to - st.lidT)*dt/.65, 0, 1);
    if (st.lidT === to){ st.busy = null; if (to === 0) st.lidOn = true; if (then) then(); return false; } return true; });
}
function lidToggle(st, ui){
  const why = busyWhy(st); if (why) return ui.flash(st.blend ? 'it is running — wait for it to stop' : why);
  lidMove(st, lidOnJug(st) ? 1 : 0);
}
function add(st, ui, k){
  const why = addBlock(st, k); if (why) return ui.flash(why);
  const go = () => ING[k].liquid ? pourLiquid(st, ui, k) : flyIn(st, ui, k);
  if (lidOnJug(st)){ ui.flash('lid off first', 900); lidMove(st, 1, go); } else go();
}
function flyIn(st, ui, k){
  st.busy = 'adding'; st.used[k] = true;
  const list = st.items.filter(it => it.kind === k), dur = ING[k].split ? 1.5 : .85, gap = .28; let T = 0;
  list.forEach(it => { it.where = 'fly'; it.slots = Array.from({length: ING[k].split ? 3 : 1}, () => st.nextSlot++); });
  anim(st, dt => { T += dt; st.time += dt; let done = true;
    list.forEach((it, i) => { it.ft = clamp((T - i*gap)/dur, 0, 1); if (it.ft >= 1) it.where = 'jug'; else done = false; });
    if (done){ st.busy = null; ui.flash(`${ING[k].name.toLowerCase()} in`, 900); return false; } return true; });
}
function pourLiquid(st, ui, k){
  st.busy = 'liquid'; st.used[k] = true; st.carton = { kind:k, k:0, ph:'up' };
  anim(st, dt => { const c = st.carton; st.time += dt;
    if (c.ph === 'up'){ c.k = Math.min(1, c.k + dt/1.0); if (c.k >= 1) c.ph = 'pour'; }
    else if (c.ph === 'pour'){ st.mflow = 1; st.liq[k] = Math.min(ING[k].v, st.liq[k] + ING[k].v/1.6*dt); if (st.liq[k] >= ING[k].v){ st.mflow = 0; c.ph = 'down'; } }
    else { c.k = Math.max(0, c.k - dt/.9); if (c.k <= 0){ st.carton = null; st.busy = null; ui.flash(`${ING[k].name.toLowerCase()} in`, 900); return false; } }
    return true; });
}
function blend(st, ui, speed, pulse=false){
  const why = blendBlock(st); if (why) return ui.flash(why);
  if (st.blend){ st.blend.speed = speed; st.blend.left = pulse ? .6 : 3.5; st.blend.pulse = pulse; return; }
  st.blend = { speed, left: pulse ? .6 : 3.5, pulse };
  anim(st, dt => {
    const b = st.blend, running = b.left > 0; st.time += dt;
    st.spin += ((running ? SPIN[b.speed] : 0) - st.spin) * Math.min(1, dt*(running ? 5 : 3.2));
    st.bladeA += st.spin*38*dt; st.orbitA += st.spin*2.6*dt;
    if (running){ b.left -= dt; for (const it of jugItems(st)){ it.g = Math.max(0, it.g - ING[it.kind].rate[b.speed]*dt*(b.pulse ? 1.2 : 1)); if (it.g < .03) it.g = 0; } }
    if (!running && st.spin < .04){
      st.spin = 0; st.blend = null;
      if (!chunky(st)) ui.flash(solids(st) ? `${drinkName(st).toLowerCase()} — ready to pour` : 'just liquid — add some fruit?');
      else if (b.speed === 1 && jugItems(st).some(it => it.kind === 'ice' && it.g > .5)) ui.flash('the ice needs a higher speed');
      else ui.flash(`${Math.round(smoothFrac(st)*100)}% smooth — blend a little more`);
      return false; }
    return true; });
}
function moveToGlass(st, out){
  const V = renderV(st), kf = Math.max(0, (V - out)/V), col = liqColour(st);
  st.glassCol = st.glassV > .5 ? mixCols([[st.glassCol, st.glassV], [col, out]]) : col; st._pourCol = col;
  if (!st.glassName) st.glassName = solids(st) ? drinkName(st) : ING[st.liq.oj > st.liq.milk ? 'oj' : 'milk'].name;
  st.glassV += out; for (const k of LIQS) st.liq[k] *= kf; jugItems(st).forEach(it => it.v *= kf);
}
function pour(st, ui){
  const why = busyWhy(st); if (why) return ui.flash(why);
  if (jugTotal(st) < 3) return ui.flash('the jug is empty — nothing to pour');
  if (chunky(st)) return ui.flash(liqVol(st) ? 'still chunky — blend it smooth first' : 'add a liquid and blend it first');
  if (st.glassV >= GLASS_STOP - 1) return ui.flash('the glass is full — start again for another');
  const go = () => {
    st.busy = 'pour'; st.pour = { e:0, th:0, ph:'lift' };
    anim(st, dt => { const p = st.pour; st.time += dt;
      if (p.ph === 'lift'){ p.e = Math.min(1, p.e + dt/.9); p.th = ease(p.e)*35*DEG; if (p.e >= 1) p.ph = 'tilt'; }
      else if (p.ph === 'tilt'){
        p.th += (st.flow > 5 ? 12 : 40)*DEG*dt;
        const Vm = volQ(qLip(p.th), p.th);
        let out = Math.max(0, renderV(st) - Vm); out = Math.min(out, GLASS_STOP - st.glassV);
        if (out > 0) moveToGlass(st, out);
        st.flow = st.flow*.8 + (out/Math.max(dt, 1e-3))*.2;
        if (st.glassV >= GLASS_STOP - .5 || renderV(st) < 4 || p.th >= 108*DEG){ p.ph = 'hold'; p.hold = 0; }
      } else if (p.ph === 'hold'){ st.flow *= .8; p.hold += dt; if (p.hold > .45){ p.ph = 'back'; p.k = 1; p.thEnd = p.th; st.flow = 0; } }
      else { p.k = Math.max(0, p.k - dt/1.1); p.e = p.k; p.th = p.thEnd*ease(p.k);
        if (p.k <= 0){ st.pour = null; st.busy = null; ui.flash(st.glassV >= GLASS_STOP - 1 ? 'the glass is full — enjoy' : 'poured — enjoy'); return false; } }
      return true; });
  };
  if (lidOnJug(st)){ ui.flash('lid off to pour', 900); lidMove(st, 1, go); } else go();
}
function fresh(){ return { gen:0, busy:null, lidOn:true, lidT:0, items: freshItems(), nextSlot:0, liq:{ milk:0, oj:0 }, used:{},
  carton:null, mflow:0, blend:null, spin:0, bladeA:.3, orbitA:0, pour:null, glassV:0, glassCol:'#f8f5ee', glassName:'', flow:0, time:0 }; }
function reset(st){ Object.assign(st, fresh(), { gen: st.gen + 1, pal: st.pal }); }


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

/* ---------- see-through: how a real countertop blender works ----------
   A universal motor stands upright in the base, shaft up. Its top end carries a drive socket that pokes through the
   pad; the jug's coupler drops onto it, and the coupler's shaft runs up through a sealed bearing to the blades.
   A fan on the bottom of the same shaft pulls cooling air in through the base plate. The speed dial is a rotary
   switch on the control board behind the front panel; a jug switch under the pad cuts the power when the jug is off.
   Parts (each held by another; every wire runs from a real terminal to a real terminal):
   BASE     four rubber feet . base plate with intake slots . two motor posts with rubber grommets . cord grommet
   MOTOR    bottom bridge with its bearing . two side straps . top bridge with its bearing . laminated stator stack .
            four field-coil end turns (copper) . commutator with its segments . two carbon-brush holders, brushes and
            springs . the shaft . cooling fan (backplate, vanes, hub) in a clear shroud
   DRIVE    drive socket on the shaft top (through the pad) with its teeth . jug coupler . coupler shaft . retaining nut .
            bearing housing in the jug base . lip seal under the jug floor . (the blades, already in the jug)
   CONTROLS control board behind the screen . switch bracket under it with a ribbon cable up . rotary speed switch and its shaft to the dial . pulse microswitch
            and plunger . display module behind the screen . run LED . triac on its finned heat sink . capacitor . chip
            . jug switch with its plunger up through the pad
   POWER    cord in through the grommet . live wire along the floor to the board . neutral up the back to the jug switch
            . jug switch to the board . board to one brush . other brush to a field coil . field coil to the board */
const BLPCB = { l:'#4fa36a', m:'#2f8a4a', d:'#1d5f31' }, BLCOP = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, BLLIT = matOf('#ff9a3a');
const BLGM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' }, BLRUB = { l:'#5a5752', m:'#403d39', d:'#2a2825' }, BLPL = matOf('#e8e4da');
const STEEL = matOf('#aeb6ba');
const bBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - .3), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + .3)];
const bBend = (pts, r = 1.2) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k]) * d/la), q = c.map((v, k) => b[k] + (v - b[k]) * d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a wire cut into short pieces with their own boxes (sorted with the solids); terminal dots at both ends
function bWire(pts, col, r = .32, ends = true){
  const q = bBend(pts), out = [], L = 3, n = q.length, sw = w => `style="stroke-width:${f(w)}"`;
  for (let i = 0; i < n - 1; ){
    let j = i + 1, len = 0; while (j < n - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j - 1][k])); j++; }
    if (len < L) while (j < n - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false), cap = i === 0 || j === n - 1 ? 'round' : 'butt';
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-linecap="${cap}" stroke-linejoin="round" ${sw(2*r + .55)}/><path d="${d}" fill="none" stroke="${col}" stroke-linecap="${cap}" stroke-linejoin="round" ${sw(2*r)}/>`;
    if (ends && i === 0){ const [X, Y] = P(...q[0]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".45" fill="${INK}"/>`; }
    if (ends && j === n - 1){ const [X, Y] = P(...q[j]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".45" fill="${INK}"/>`; }
    out.push({ box: bBoxOf(seg), svg }); i = j; }
  return out;
}
const BL = (dx, dy, z) => [BX + dx, BY + dy, z];                        // base-local offsets, absolute height
// clear shroud round a spinning part: far half, contents, near half faint
const bShroud = (cx, cy, z0, z1, r, inner) => { const A = zRing(cx, cy, z0, r, 28), B = zRing(cx, cy, z1, r, 28);
  return loft(A, B, n => toneI(n, CLEAR), true) + inner + `<g opacity=".4">${loft(A, B, n => toneI(n, CLEAR))}</g>` + ink(pd(B), .5) + hullInk([...A, ...B], .8); };
// see-through sorter: orders only the pairs that overlap on screen (box-separated pairs by their gap, the rest by
// centre depth), then a topological pass; a loop is broken at its farthest part (LESSONS 27-28)
function mSort(parts){
  parts = parts.filter(Boolean);
  const n = parts.length, rect = parts.map(p => { const b = p.box || [p.at, p.at], xs = [], ys = [];
    for (const x of [b[0][0], b[1][0]]) for (const y of [b[0][1], b[1][1]]) for (const z of [b[0][2], b[1][2]]){ const q = P(x, y, z); xs.push(q[0]); ys.push(q[1]); }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });
  const dep = parts.map(p => depthOf(p.at || boxMid(p.box))), after = parts.map(() => []), indeg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++){
    const a = rect[i], b = rect[j]; if (a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]) continue;
    const o = sepOrder(parts[i], parts[j]) || Math.sign(dep[i] - dep[j]); if (!o) continue;
    if (o < 0){ after[i].push(j); indeg[j]++; } else { after[j].push(i); indeg[i]++; } }
  const done = new Array(n).fill(false), out = [];
  for (let k = 0; k < n; k++){
    let best = -1; for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (best < 0 || dep[i] < dep[best])) best = i;
    if (best < 0) for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || dep[i] < dep[best])) best = i;
    done[best] = true; out.push(parts[best].svg); for (const j of after[best]) indeg[j]--; }
  return out.join('');
}
function blendMech(st){
  const run = (st.spin || 0) > .05, jugOn = !st.pour, a0 = st.bladeA || 0, parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .6) => put([BL(x0, y0, z0), BL(x1, y1, z1)], box(BX + x0, BY + y0, z0, BX + x1, BY + y1, z1, m, toneI, w));
  const cz = (dx, dy, z0, z1, r, m, w = .7, n = 22) => put([BL(dx - r, dy - r, z0), BL(dx + r, dy + r, z1)], cyl(BX + dx, BY + dy, z0, z1, r, m, toneI, w, n));
  const live = run ? '#ffb347' : '#3a3632';
  // ---- base: feet, base plate with intake slots, motor posts and grommets, cord grommet
  // feet and base plate lie flat on the floor of the base: drawn first, under everything that stands on them
  const feet = [[-7.6, -7.6], [7.6, -7.6], [-7.6, 7.6], [7.6, 7.6]].map(([dx, dy]) => ({ at: BL(dx, dy, H0 + .3), svg: cyl(BX + dx, BY + dy, H0, H0 + .6, 1.2, BLRUB, toneI, .6, 16) }));
  let plate = box(BX - 9.6, BY - 9.6, H0 + .6, BX + 9.6, BY + 9.6, H0 + 1.1, BLPL, toneI, .7), slots = '';
  if (vis([0,0,1])) for (let i = -3; i <= 3; i++) for (const dy of [-8.4, 8.4]) slots += shape(on(PZ(H0 + 1.12), rrUV(BX + i*2.2 - .5, BY + dy - 1, BX + i*2.2 + .5, BY + dy + 1, .4)), '#3a3632', .3);
  const floor = byDepth(feet) + plate + slots;
  for (const dy of [-6.3, 6.3]){ cz(0, dy, H0 + 1.1, 5.0, .8, BLGM, .6, 14); cz(0, dy, 5.0, 5.6, 1.1, BLRUB, .6, 14); }
  bx(-9.8, -6.2, 3.4, -8.6, -3.8, 5.0, BLRUB);
  // ---- cooling fan on the bottom of the shaft, in its clear shroud
  { const vanes = []; for (let i = 0; i < 8; i++){ const a = a0*.6 + i/8*2*Math.PI, a2 = a + .45;
      const pA = [BX + 1*Math.cos(a), BY + 1*Math.sin(a)], pB = [BX + 4.3*Math.cos(a2), BY + 4.3*Math.sin(a2)];
      vanes.push({ at: [(pA[0] + pB[0])/2, (pA[1] + pB[1])/2, 4.4], svg: shape([[...pA, 3.9], [...pB, 3.9], [...pB, 5.0], [...pA, 5.0]], run ? BLLIT.l : METAL.l, .4) }); }
    const fan = fill(pd(zRing(BX, BY, 3.9, 4.5)), METAL.m) + ink(pd(zRing(BX, BY, 3.9, 4.5)), .5) + byDepth(vanes) + cyl(BX, BY, 3.9, 5.1, .9, METAL, toneI, .5, 14);
    put([BL(-5, -5, H0 + 1.1), BL(5, 5, 5.4)], bShroud(BX, BY, H0 + 1.15, 5.4, 5, fan)); }
  // ---- motor frame: bottom bridge and bearing, straps, top bridge and bearing
  cz(0, 0, 5.2, 5.6, 1.0, STEEL, .5, 16);
  bx(-1, -7.2, 5.6, 1, 7.2, 6.2, BLGM);
  for (const dy of [-5.5, 5.5]) bx(-1, dy - .35, 6.2, 1, dy + .35, 14.6, BLGM);
  bx(-1, -5.85, 14.6, 1, 5.85, 15.2, BLGM);
  cz(0, 0, 15.2, 15.7, 1.0, STEEL, .5, 16);
  // shaft in three pieces either side of the bridges, so each sorts with its neighbours
  cz(0, 0, 6.2, 8.2, .45, METAL, .4, 12); cz(0, 0, 13.0, 14.6, .45, METAL, .4, 12); cz(0, 0, 15.7, 16.3, .45, METAL, .4, 12);
  // stator stack with lamination lines, field-coil end turns, commutator, brushes
  { let stk = box(BX - 4.4, BY - 4.4, 8.2, BX + 4.4, BY + 4.4, 12.2, STEEL, toneI, .8), lam = '';
    for (const [nn, x] of [[[1,0,0], BX + 4.42], [[-1,0,0], BX - 4.42]]) if (vis(nn)) for (let z = 8.7; z < 12; z += .5) lam += pd([[x, BY - 4.2, z], [x, BY + 4.2, z]], false);
    for (const [nn, y] of [[[0,1,0], BY + 4.42], [[0,-1,0], BY - 4.42]]) if (vis(nn)) for (let z = 8.7; z < 12; z += .5) lam += pd([[BX - 4.2, y, z], [BX + 4.2, y, z]], false);
    put([BL(-4.4, -4.4, 8.2), BL(4.4, 4.4, 12.2)], stk + `<path d="${lam}" fill="none" stroke="${STEEL.d}" stroke-width=".35"/>`); }
  const coil = run ? BLLIT : BLCOP;
  for (const [y0, y1] of [[1.6, 4], [-4, -1.6]]) for (const [z0, z1] of [[7.4, 8.2], [12.2, 13]]) bx(-2.8, y0, z0, 2.8, y1, z1, coil, .5);
  { let cm = cyl(BX, BY, 13.0, 14.1, 1.4, BLCOP, toneI, .6, 18);
    for (let i = 0; i < 8; i++){ const a = a0 + i/8*2*Math.PI, n = [Math.cos(a), Math.sin(a), 0]; if (!vis(n)) continue; cm += line([[BX + 1.42*n[0], BY + 1.42*n[1], 13.1], [BX + 1.42*n[0], BY + 1.42*n[1], 14.0]], .3); }
    put([BL(-1.4, -1.4, 13), BL(1.4, 1.4, 14.1)], cm); }
  for (const s of [-1, 1]){ bx(s > 0 ? 1.45 : -3.6, -.6, 13.15, s > 0 ? 3.6 : -1.45, .6, 13.95, BLGM, .5);
    bx(s > 0 ? 3.6 : -4.4, -.35, 13.3, s > 0 ? 4.4 : -3.6, .35, 13.8, BLRUB, .4); }                          // holder + spring cap
  // ---- drive socket on the shaft top, through the pad
  { let sk = cyl(BX, BY, 16.3, PADZ + .3, 1.6, STEEL, toneI, .7, 20), t = '';
    if (vis([0,0,1])) for (let i = 0; i < 4; i++){ const a = a0 + i*Math.PI/2; t += pd([[BX + .4*Math.cos(a), BY + .4*Math.sin(a), PADZ + .32], [BX + 1.4*Math.cos(a), BY + 1.4*Math.sin(a), PADZ + .32]], false); }
    put([BL(-1.6, -1.6, 16.3), BL(1.6, 1.6, PADZ + .3)], sk + `<path d="${t}" fill="none" stroke="${INK}" stroke-width=".6"/>`); }
  // ---- jug switch under the pad: microswitch, plunger up through the pad (pressed while the jug sits on it)
  bx(4.4, -3.6, 14.2, 5.8, -2.4, 15.4, BLPL, .5);
  cz(5.1, -3, 15.4, jugOn ? PADZ - .1 : PADZ + .6, .35, jugOn ? BLLIT : METAL, .4, 10);
  // ---- control board behind the front panel and what is on it
  const FX0 = 8.4, FX1 = 9.0;                                                         // board faces; panel inner face at 9.8
  bx(FX0, -8.6, 9.8, FX1, 8.6, 15.2, BLPCB, .6);                                  // upper board: display, LED, power parts
  bx(FX0, -7.4, 4.6, FX1, 6.4, 8.8, BLGM, .5);                                     // switch bracket below it
  bx(FX0 + .1, -2, 8.8, FX1 - .1, 1, 9.8, matOf('#d8d2c2'), .4);                    // ribbon cable bracket to board
  for (const [dy, z] of [[-8, 10.4], [8, 10.4], [-8, 14.6], [8, 14.6], [-6.8, 5.2], [5.8, 5.2]]) put([BL(FX1, dy - .3, z - .3), BL(9.8, dy + .3, z + .3)], cylX(BX + FX1, BX + 9.8, BY + dy, z, .3, METAL, toneI, .3, 8));
  const yK = 3*K, zK = H0 + 4.1*K, py = -4.4*K, pz = H0 + 3.6*K;
  put([BL(FX1, yK - 1.8, zK - 1.8), BL(9.4, yK + 1.8, zK + 1.8)], cylX(BX + FX1, BX + 9.4, BY + yK, zK, 1.8, run ? BLLIT : BLGM, toneI, .6, 20));      // rotary speed switch
  put([BL(9.4, yK - .45, zK - .45), BL(10.4, yK + .45, zK + .45)], cylX(BX + 9.4, BX + BHW, BY + yK, zK, .45, METAL, toneI, .4, 10));                  // its shaft to the dial
  bx(FX1, py - 1.1, pz - .9, 9.5, py + 1.1, pz + .9, matOf('#3a3632'), .5);                                                                          // pulse microswitch
  put([BL(9.5, py - .3, pz - .3), BL(10.4, py + .3, pz + .3)], cylX(BX + 9.5, BX + BHW, BY + py, pz, .3, BLPL, toneI, .3, 8));
  bx(FX1, -7.2, H0 + 8.2*K, 9.7, 7.2, H0 + 10.4*K, matOf('#2a3430'), .5);                                                                             // display module
  bx(FX1, py - .4, H0 + 6.6*K - .4, 9.7, py + .4, H0 + 6.6*K + .4, run ? matOf('#43c25c') : matOf('#b5b2a6'), .4);                                  // run LED
  { let hs = box(BX + 7.0, BY - 7.6, 10.2, BX + FX0, BY - 4.6, 13.4, METAL, toneI, .6);
    if (vis([-1,0,0])) for (let y = -7.2; y <= -4.9; y += .55) hs += line([[BX + 7.0, BY + y, 10.3], [BX + 7.0, BY + y, 13.3]], .3);
    put([BL(7.0, -7.6, 10.2), BL(FX0, -4.6, 14.6)], hs + box(BX + 7.9, BY - 6.8, 13.4, BX + FX0, BY - 5.4, 14.6, DARK, toneI, .4)); }      // triac on its heat sink
  put([BL(6.6, 2, 10.8), BL(FX0, 3.8, 12.6)], cylX(BX + 6.6, BX + FX0, BY + 2.9, 11.7, .9, matOf('#3e6fb0'), toneI, .5, 14));               // capacitor
  bx(7.9, -1.6, 12.6, FX0, .4, 14.2, DARK, .4);                                                                                                // chip
  // ---- wiring: cord, live to the board, neutral through the jug switch, board to brush, brush-coil-board loop
  parts.push(...bWire([BL(-BHW - 1.4, -5, 4.2), BL(-8.6, -5, 4.2)], '#3b3834', .75, false));
  parts.push(...bWire([BL(-8.6, -5.4, 4.0), BL(-7.6, -8.4, 3.0), BL(6.6, -8.4, 3.0), BL(7.6, -8.4, 9.4), BL(FX0, -8.0, 10.4)], '#8a3a24'));
  parts.push(...bWire([BL(-8.6, -4.4, 4.4), BL(-8.8, -7.6, 6), BL(-8.8, -7.6, 15.6), BL(5.1, -7.6, 15.6), BL(5.1, -3.6, 15.0)], jugOn ? '#8a3a24' : '#3a3632'));
  parts.push(...bWire([BL(5.8, -3, 14.8), BL(7.4, -3, 14.6), BL(FX0, -3, 14.2)], jugOn ? '#8a3a24' : '#3a3632'));
  parts.push(...bWire([BL(FX0, 1.2, 13.8), BL(5.6, .9, 13.55), BL(4.4, 0, 13.55)], live));
  parts.push(...bWire([BL(-4.4, 0, 13.55), BL(-6.2, 0, 13.4), BL(-6.2, -6.2, 9.2), BL(-2.4, -6.2, 7.8), BL(-2.4, -4, 7.8)], live));
  parts.push(...bWire([BL(2.4, 4, 7.8), BL(2.4, 6.4, 7.6), BL(7.2, 6.8, 7.6), BL(7.2, 6.8, 10.4), BL(FX0, 6.8, 10.8)], live));
  return floor + mSort(parts);
}
// the jug's half of the drive: coupler, shaft, nut, bearing housing and seal under the jug floor, drawn over the faded
// collar and clipped to it (outside the floor's own outline, where the floor and contents cover them)
function jugDrive(st, pose){
  const J = jugT(pose.piv, pose.th), a0 = st.bladeA || 0, up = vis(sub(J([0,0,1]), J([0,0,0]))), items = [];
  const cp = frustT(J, .3, 1.5, 1.5, 1.5, BLRUB, .7, 20);
  let teeth = ''; for (let i = 0; i < 4; i++){ const a = a0 + i*Math.PI/2 + Math.PI/4; teeth += pd([J([.4*Math.cos(a), .4*Math.sin(a), .28]), J([1.4*Math.cos(a), 1.4*Math.sin(a), .28])], false); }
  const parts = [frustT(J, 1.5, 1.8, .9, .9, STEEL, .5, 6), frustT(J, 1.8, JF - .3, 1.25, 1.25, METAL, .7, 20), frustT(J, JF - .3, JF - .02, 1.05, 1.05, BLRUB, .5, 18), frustT(J, 1.5, JF, .35, .35, METAL, .3, 10)];
  const stack = up ? cp + parts.join('') : parts.slice().reverse().join('') + `<path d="${teeth}" fill="none" stroke="${INK}" stroke-width=".5"/>` + cp;
  const clipPts = hull2([...ringT(J, 0, 5.15, 32), ...ringT(J, JF, 5.15, 32)]), floor = hull2(ringT(J, JF, rIn(JF), 32)), id = 'jd' + (++clipN);
  return `<clipPath id="${id}"><path d="${sp(clipPts)}${sp(floor)}" clip-rule="evenodd"/></clipPath><g clip-path="url(#${id})">${stack}</g>`;
}
const XR_OPTS = { getSt: () => { try { return ui.st; } catch (e) { return {}; } }, B: [0, BW, 0, BD, 0, HT],
  mech: (st, k) => blendMech(st),
  inside: st => { const run = (st.spin || 0) > .05, J = jugT(jugPose(st).piv, jugPose(st).th);
    return [ { at: BL(0, 4.4, 10.2), text:'MOTOR', on: run },
      { at: BL(3.6, 0, 13.95), text:'CARBON BRUSH', on: run },
      { at: BL(0, -5, 4.4), text:'COOLING FAN', on: run },
      { at: BL(1.6, 0, 16.9), text:'DRIVE SOCKET', on: run },
      { at: J([1.5, 0, .9]), text:'JUG COUPLER', on: run },
      { at: J([1.25, 0, 2.8]), text:'BEARING + SEAL', on: run },
      { at: BL(9.4, 3*K, H0 + 4.1*K + 1.8), text:'SPEED SWITCH', on: run },
      { at: BL(9.0, 0, 15.2), text:'CONTROL BOARD', on: run },
      { at: BL(5.1, -3, 15.4), text:'JUG SWITCH', on: !st.pour },
      { at: BL(7.6, 7.6, H0 + .3), text:'RUBBER FEET', on: false },
      { at: BL(-9.8, -5, 5.0), text:'CORD GROMMET', on: false } ]; } };
const XR_CAPTION = st => st.pour
    ? 'Jug lifted: its coupler leaves the drive socket and the jug switch’s plunger springs up, opening the circuit, so the motor cannot run without the jug in place.'
  : (st.spin || 0) > .05
    ? `Blending on ${SPN[st.blend ? st.blend.speed : 3] || 'high'}: the speed switch sends current through the jug switch, the carbon brushes and the field coils. The motor's shaft turns the drive socket, which turns the jug's coupler and the blades above the sealed bearing; the fan on the shaft's lower end pulls air in through the base plate.`
  : 'Inside the base: an upright motor whose shaft ends in a drive socket under the jug and a cooling fan at the bottom. The jug’s coupler sits on the socket and turns the blades through a sealed bearing. A rotary switch behind the dial sets the speed; a jug switch under the pad only lets it run with the jug on.';

XR_OPTS.inline = true;
scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'20', turn:'full', title:'Blender', hint:'pick fruit and a liquid, lid on, blend, then pour',
  size:[BW, BD, HT], palette:'mint', state: fresh(), scene,
  readout: st => st.blend ? `blending on ${SPN[st.blend.speed]}` : '',
  stats: st => [ { label:'In the jug', value: Math.round(jugTotal(st)) + ' ml' },
                 solids(st) > 0 && { label: chunky(st) || !liqVol(st) ? 'Smooth' : 'Drink', value: chunky(st) || !liqVol(st) ? Math.round(smoothFrac(st)*100) + '%' : drinkName(st), small:true },
                 { label:'In the glass', value: Math.round(st.glassV) + ' ml', small:true } ],
  buttonsLabel:'Blender',
  buttons:[
    { label:'Add', choices: st => [...SOLIDS, ...LIQS].map(k => ({ label: ING[k].name, disabled: !!addBlock(st, k), why: addBlock(st, k), onClick:(st, ui) => add(st, ui, k) })) },
    { label:'Lid on / off', onClick: lidToggle },
    { label:'Blend', choices: st => [1, 2, 3].map(sp => ({ label: SPN[sp], current: !!(st.blend && st.blend.speed === sp && !st.blend.pulse && st.blend.left > 0),
        disabled: !!blendBlock(st) && !st.blend, why: blendBlock(st), onClick:(st, ui) => blend(st, ui, sp) })) },
    { label:'Pulse', onClick:(st, ui) => blend(st, ui, 3, true) },
    { label:'Pour into glass', onClick: pour },
    { label:'Start again', onClick: st => reset(st) },
  ],
  acts: Object.assign({ dial:(st, el, ui) => blend(st, ui, st.blend ? st.blend.speed % 3 + 1 : 1), pulse:(st, el, ui) => blend(st, ui, 3, true),
         lid:(st, el, ui) => lidToggle(st, ui), glass:(st, el, ui) => pour(st, ui) },
         Object.fromEntries([...SOLIDS, ...LIQS].map(k => [k, (st, el, ui) => add(st, ui, k)]))),
  params:(st, q) => {
    const a = q.get('add'); if (a) for (const k of a.split(',')){ if (!ING[k]) continue; st.used[k] = true;
      if (ING[k].liquid) st.liq[k] = ING[k].v; else st.items.forEach(it => { if (it.kind === k){ it.where = 'jug'; it.slots = Array.from({length: ING[k].split ? 3 : 1}, () => st.nextSlot++); } }); }
    if (q.get('lid') === '0'){ st.lidOn = false; st.lidT = 1; }
    if (q.has('smooth')) st.items.forEach(it => it.g = clamp(1 - +q.get('smooth'), 0, 1));
  },
});
xrMount(() => ui, XR_CAPTION);