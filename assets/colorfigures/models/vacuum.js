/* ---------- geometry (x = depth toward viewer-right, y = toward viewer-left, z = up) ---------- */
const RUG_H = 1.2, RX0 = 42, RX1 = 112, RY0 = 32, RY1 = 98;       // the rug (the board)
const LANES = [48.5, 81.5];                                         // two nozzle-wide strips across the rug
const XA_MIN = RX0 - 16, XA_MAX = RX1 - 30;                         // axle travel: mouth reaches both rug ends
const WR = 9.5, ZA = RUG_H + WR, TILT = 12 * Math.PI/180;           // wheel radius, axle height, recline when working
const DR = 9, DV = 8.4, WV = [10.8, 14.8];                           // pivot knuckle radius, half width; wheel inner/outer v
const BIN_U = 9, BIN_W0 = 22, BR = 7.4, BH = 38;                    // clear bin: axis (local u), bottom (local w), radius, height
const FLOOR_W = 3, MAXH = 24, SHR_W = 29, COL_W = 35;               // bin-local heights: floor, MAX line above floor, shroud bottom, top collar
const TUBE = [-3, 8.8], TUBE_R = 1.8;                               // ribbed clear hose up the left side of the spine
const CAN = { x:66, y:13, r0:9.5, r1:11, h:30 };
const SOCK = [16, 104, 24, 113, 7];
const MOUTH = [18, 29, 14];                                         // suction mouth under the head: x from axle, half width

const GREY = { l:'#dde1e2', m:'#b6bcbf', d:'#848b8f' };
const RUBBER = { l:'#5a5752', m:'#403d39', d:'#2a2825' };
const BINBASE = { l:'#8d9599', m:'#6f777b', d:'#4a5155' };
const DIRT = { l:'#b3a996', m:'#958b79', d:'#6d6556' };
const RUGM = { l:'#b7c99d', m:'#9db487', d:'#7b9168' }, RUG_BORDER = '#8ea979';
const CANM = matOf('#a9c0c6'), BAG = { l:'#5d5a56', m:'#45423f', d:'#2e2c2a' };
const CORD_M = { l:'#6a655e', m:'#3b3834', d:'#22201d' };
const GREEN = '#43c25c', RED = '#e2483d', AMBER = '#f2b431';
const sstep = (a,b,t) => { const k = Math.min(1, Math.max(0, (t-a)/(b-a))); return k*k*(3-2*k); };
const clamp01 = v => Math.min(1, Math.max(0, v));

/* ---------- the tilting body: local (u forward, v left, w up) about the axle ---------- */
let VX = 0, VY = 0, VT = 0;
const T = (u,v,w) => [VX + u*Math.cos(VT) - w*Math.sin(VT), VY + v, ZA + u*Math.sin(VT) + w*Math.cos(VT)];
const Rn = ([a,b,c]) => [a*Math.cos(VT) - c*Math.sin(VT), b, a*Math.sin(VT) + c*Math.cos(VT)];
function lbox(u0,v0,w0,u1,v1,w1,r,m,iw=1.8){
  const pr = rrUV(u0,v0,u1,v1,r,5), A = pr.map(([u,v]) => T(u,v,w0)), B = pr.map(([u,v]) => T(u,v,w1));
  const up = vis(Rn([0,0,1]));
  return loft(A, B, n => tone(n, m)) + (up ? fill(pd(B), tone(Rn([0,0,1]), m)) + ink(pd(B), .9) : '') + hullInk([...A, ...B], iw);
}
function lcyl(cu,cv,w0,w1,r,m,iw=1){
  const rg = w => ellUV(cu,cv,r,r,20).map(([u,v]) => T(u,v,w)), A = rg(w0), B = rg(w1);
  const up = vis(Rn([0,0,1]));
  return loft(A, B, n => toneI(n, m)) + (up ? fill(pd(B), toneI(Rn([0,0,1]), m)) + ink(pd(B), .7) : '') + hullInk([...A, ...B], iw);
}
// soft cable (from washer.html)
function smooth3(pts, it=3){
  for (let k=0;k<it;k++){ const o=[pts[0]];
    for (let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1]; o.push(a.map((v,j)=>v*.75+b[j]*.25), a.map((v,j)=>v*.25+b[j]*.75)); }
    o.push(pts[pts.length-1]); pts=o; }
  return pts;
}
function cable(pts, r, m){
  const q = smooth3(pts), d = pd(q, false), sw = w => `style="stroke-width:${f(w)}"`, cap = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const hl = 'M' + q.map(p => { const [X,Y] = P(...p); return f(X - r*.35)+' '+f(Y - r*.35); }).join('L');
  return `<path d="${d}" ${cap} stroke="${INK}" ${sw(2*r + 2.2*INK_K)}/>` + `<path d="${d}" ${cap} stroke="${m.m}" ${sw(2*r)}/>` + `<path d="${hl}" ${cap} stroke="${m.l}" ${sw(r*.5)} opacity=".8"/>`;
}
function chaikin(pts, it=2){
  for (let k=0;k<it;k++){ const o=[]; for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length];
    o.push([a[0]*.75+b[0]*.25, a[1]*.75+b[1]*.25], [a[0]*.25+b[0]*.75, a[1]*.25+b[1]*.75]); } pts=o; }
  return pts;
}

/* ---------- dirt on the rug ---------- */
function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const CRUMBS = ['#c8995a', '#a8743f', '#7a5233', '#d6b27a'];
const BITCOL = { paper:'#fbf7ea', bead:'#3e86d9', thread:'#e2483d', ring:'#f2c230', fluff:'#d8d4ca' };
function makeDirt(){
  const R = rng(11), out = [];
  const add = (k, x, y) => {
    const s = k === 'crumb' ? .9 + R()*.7 : k === 'fluff' ? 2.2 + R()*1.1 : 1;
    const n = k === 'fluff' ? 9 : 6, shp = Array.from({length:n}, (_,i) => { const a = i/n*2*Math.PI, rr = s*(.7 + R()*.45); return [rr*Math.cos(a), rr*Math.sin(a)]; });
    out.push({ id: out.length, k, x, y, s, rot: R()*6.28, phi0: R()*6.28, shape: k === 'fluff' ? chaikin(shp, 2) : shp,
      col: k === 'crumb' ? CRUMBS[Math.floor(R()*4)] : BITCOL[k], vol: k === 'crumb' ? .026 : k === 'fluff' ? .055 : .04, state:'rug', t:0 });
  };
  // a few bits, and some dirt where the nozzle never goes (between the strips, the far edge)
  [['paper',88,55],['bead',71,88],['thread',99,76],['ring',63,43],['crumb',79,65],['fluff',95,65.2],['crumb',58,96.6],['crumb',101,33.4]].forEach(a => add(...a));
  let tries = 0;
  while (out.length < 36 && tries++ < 3000){
    const x = RX0 + 4 + R()*(RX1 - RX0 - 8), y = RY0 + 3 + R()*(RY1 - RY0 - 6);
    if (x > 45 && x < 72 && y > 32 && y < 65) continue;                       // under the parked head
    if (out.some(p => Math.hypot(p.x - x, p.y - y) < 6.2)) continue;
    add(R() < .62 ? 'crumb' : 'fluff', x, y);
  }
  return out;
}
function rugPiece(p){
  const z = RUG_H + .05, c = Math.cos(p.rot), sn = Math.sin(p.rot);
  const Q = (u,v,zz=z) => [p.x + u*c - v*sn, p.y + u*sn + v*c, zz];
  if (p.k === 'crumb') return fill(pd(p.shape.map(([u,v]) => Q(u,v))), mix(p.col,'#000000',.35)) + shape(p.shape.map(([u,v]) => Q(u*.9,v*.9,z+.7)), p.col, .5);
  if (p.k === 'fluff') return fill(pd(p.shape.map(([u,v]) => Q(u,v))), '#aaa59a') + shape(p.shape.map(([u,v]) => Q(u*.95,v*.95,z+.7)), '#e2ded5', .5)
    + ink(pd([Q(-p.s*.5,.2,z+.75), Q(0,-.5,z+.75), Q(p.s*.45,.3,z+.75)], false), .4);
  if (p.k === 'paper') return fill(pd([Q(-2,-1.4),Q(2,-1.4),Q(2,1.4),Q(-2,1.4)]), '#c9c3b2') + shape([Q(-1.9,-1.3,z+.4),Q(1.9,-1.3,z+.4),Q(1.9,1.3,z+.4),Q(-1.9,1.3,z+.4)], p.col, .6) + line([Q(-.3,-1.3,z+.45),Q(.4,1.3,z+.45)], .4);
  if (p.k === 'bead'){ const [X,Y] = P(p.x, p.y, z + 1.1);
    return `<circle cx="${f(X)}" cy="${f(Y)}" r="1.4" fill="${p.col}" stroke="${INK}" stroke-width=".55"/><circle cx="${f(X+.45)}" cy="${f(Y-.45)}" r=".45" fill="#fff" opacity=".8"/>`; }
  if (p.k === 'thread'){ const pts = []; for (let u = -3.2; u <= 3.2; u += .4) pts.push(Q(u, .9*Math.sin(u*1.1), z+.2));
    return `<path d="${pd(pts,false)}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/><path d="${pd(pts,false)}" fill="none" stroke="${p.col}" stroke-width=".8" stroke-linecap="round"/>`; }
  const o = on(PZ(z+.5), ellUV(p.x, p.y, 1.7, 1.7, 14)), i = on(PZ(z+.5), ellUV(p.x, p.y, .7, .7, 10));   // cereal ring
  return fill(pd(on(PZ(z), ellUV(p.x, p.y, 1.7, 1.7, 14))), mix(p.col,'#000000',.35)) + `<path d="${pd(o)}${pd(i)}" fill="${p.col}" fill-rule="evenodd"/>` + ink(pd(o), .5) + ink(pd(i), .4);
}
const speck = (pt, p, k=1) => { const [X,Y] = P(...pt), r = (p.k === 'fluff' ? 1.25 : p.k === 'crumb' ? .7 : .95) * k;
  return `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="${p.col}" stroke="${INK}" stroke-width=".35"/>`; };

/* ---------- state ---------- */
const st = { pal:'tomato', on:false, xa: XA_MIN + 14, tx: XA_MIN + 14, lane:0, yc: LANES[0], ty: LANES[0], th:0,
  br:0, sw:0, clk:0, level:.3, full:false, fullNoted:false, binItems:[], emp:null, heap:0, canItems:[], swept:[null,null],
  dirt: makeDirt(), loop:false, offNoted:false };
const moving = st => Math.abs(st.tx - st.xa) > .01 || Math.abs(st.ty - st.yc) > .01;
const inflight = st => st.dirt.filter(p => p.state === 'fly');
const committed = st => st.level + inflight(st).reduce((a,p) => a + p.vol, 0);
const onRug = st => st.dirt.filter(p => p.state === 'rug').length;

/* ---------- emptying timeline (seconds) ---------- */
const E = { slide:[0,.45], carry:[.45,1.65], open:[1.65,1.95], fall:[1.85,2.8], close:[2.9,3.2], back:[3.2,4.4], slideIn:[4.4,4.85], end:4.85 };
const OVER = [CAN.x, CAN.y, 47];                                     // bin bottom centre above the can
const dock0 = st => [st.xa + BIN_U, st.yc, ZA + BIN_W0];             // the body is upright while emptying
const kOf = (t, [a,b]) => ease(clamp01((t - a)/(b - a)));
function binPose(st){
  const t = st.emp.t, D0 = dock0(st), D1 = [D0[0] + 17, D0[1], D0[2]], L = (a,b,k) => a.map((v,i) => v + (b[i]-v)*k);
  let o;
  if (t < E.slide[1]) o = L(D0, D1, kOf(t, E.slide));
  else if (t < E.carry[1]){ const k = kOf(t, E.carry); o = L(D1, OVER, k); o[2] += 10*Math.sin(Math.PI*k); }
  else if (t < E.back[0]) o = OVER.slice();
  else if (t < E.back[1]){ const k = kOf(t, E.back); o = L(OVER, D1, k); o[2] += 10*Math.sin(Math.PI*k); }
  else o = L(D1, D0, kOf(t, E.slideIn));
  const alpha = (t < E.close[0] ? kOf(t, E.open) : 1 - kOf(t, E.close)) * 75 * Math.PI/180;
  return { o, alpha, inSlot: t < E.slide[1] || t >= E.slideIn[0] };
}
const heapZ = st => CAN.h - 5 + Math.min(3.4, st.heap * 1.2);
// dirt clumps falling out of the open flap
function falling(st){
  if (!st.emp || st.emp.t < E.fall[0]) return [];
  const t = st.emp.t, R = rng(5), out = [], cols = [DIRT.m, DIRT.l, DIRT.d, ...st.emp.items];
  for (let i = 0; i < 18; i++){
    const ts = 1.88 + i*.045, a = R()*6.28, rr = R()*4.2, ox = rr*Math.cos(a), oy = rr*Math.sin(a), sz = .8 + R()*.9;
    if (i/18 > st.emp.lvl0 + .15) break;                             // less in the bin, fewer clumps
    if (t < ts) continue;
    const z = OVER[2] - .5*170*(t - ts)*(t - ts);
    if (z < heapZ(st)) continue;
    out.push({ pt:[OVER[0] + ox, OVER[1] + oy, z], r: sz, col: cols[i % cols.length] });
  }
  return out;
}
const clump = q => { const [X,Y] = P(...q.pt); return `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(q.r)}" fill="${q.col}" stroke="${INK}" stroke-width=".4"/>`; };

/* ---------- the clear cyclone bin ---------- */
function drawBin(st, F, lvl, part='all'){
  const { B, tilt } = F, tn = Math.tan(tilt);
  const ring = (w, r=BR, n=36) => Array.from({length:n}, (_,i) => { const a = i/n*2*Math.PI; return B(r*Math.cos(a), r*Math.sin(a), w); });
  const h = lvl * MAXH, surfW = u => Math.max(FLOOR_W, Math.min(SHR_W - 1, FLOOR_W + h - u*tn));     // the dirt top stays level
  const nearSide = a => { const p0 = B(0,0,0), p1 = B(Math.cos(a), Math.sin(a), 0); return vis(sub(p1, p0)); };
  let s = '';
  // far wall, bin floor
  if (part !== 'inner'){
    s += `<g opacity=".5">${loft(ring(FLOOR_W), ring(COL_W), n => toneI(n, CLEAR), true)}</g>`;
    s += fill(pd(ring(FLOOR_W, BR - .3)), '#848c90', 'opacity=".5"');
  } else s += fill(pd(ring(FLOOR_W, BR - .3)), BINBASE.l) + ink(pd(ring(FLOOR_W, BR - .3)), .5);   // see-through: the flap's top face
  // the dirt, level on top
  if (h > .25){
    const n = 36, rr = BR - .3, bot = ring(FLOOR_W, rr, n);
    const top = Array.from({length:n}, (_,i) => { const a = i/n*2*Math.PI, u = rr*Math.cos(a), v = rr*Math.sin(a); return B(u, v, surfW(u)); });
    s += loft(bot, top, nr => toneI(nr, DIRT)) + fill(pd(top), DIRT.l) + ink(pd(top), .5);
    // a few lumps and the coloured bits that went in
    const cols = [DIRT.d, DIRT.m, ...st.binItems.slice(-10)];
    cols.forEach((c, i) => { const a = i*2.4 + .5, r2 = 1.6 + (i*37 % 45)/10, u = r2*Math.cos(a), v = r2*Math.sin(a), [X,Y] = P(...B(u, v, surfW(u) + .15));
      s += `<circle cx="${f(X)}" cy="${f(Y)}" r="${i < 2 ? .9 : .75}" fill="${c}" stroke="${INK}" stroke-width=".3"/>`; });
  }
  // swirl + dirt spiralling down: far half, shroud, near half
  const swirl = near => {
    let o = '';
    if (st.on && !st.emp){
      for (const [dw, rr, sp] of [[3.5, 6.2, 1], [8, 5.6, -1.3], [12.5, 6.4, .8]]){
        const w = FLOOR_W + h + dw; if (w > SHR_W - .5) continue;
        const pts = []; for (let i = 0; i <= 40; i++){ const a = i/40*2*Math.PI; if (nearSide(a) === near) pts.push(B(rr*Math.cos(a), rr*Math.sin(a), w)); }
        if (pts.length > 2) o += `<path d="${pd(pts,false)}" fill="none" stroke="#6f8f99" stroke-width=".8" stroke-linecap="round" stroke-dasharray="2.2 2.4" stroke-dashoffset="${f(-st.sw*14*sp)}" opacity=".85"/>`;
      }
    }
    for (const p of st.dirt) if (p.state === 'fly' && p.t > .56){
      const q = (p.t - .56)/.44, a = p.phi0 + q*4.5*Math.PI, rr = 6.0 - 1.2*q, u = rr*Math.cos(a);
      if (nearSide(a) !== near) continue;
      o += speck(B(u, rr*Math.sin(a), 33 + (surfW(u) - 33)*q*q), p);
    }
    return o;
  };
  s += swirl(false);
  const sr = w => ring(w, 3, 20);
  s += loft(sr(SHR_W), sr(COL_W), n => toneI(n, METAL)) + loft(sr(SHR_W + 1.2), sr(SHR_W + 3.4), n => toneI(n, GREY)) + hullInk([...sr(SHR_W), ...sr(COL_W)], .8);
  if (part === 'inner'){   // see-through: the shroud's perforations (rows of holes on its near side), the cone tip under it
    let holes = '';
    for (let w = SHR_W + .7; w < SHR_W + 1.2; w += 1) for (let i = 0; i < 18; i++){ const a = i/18*2*Math.PI + (w > SHR_W + 1 ? .17 : 0);
      if (!nearSide(a) || !nearSide(a + .5) || !nearSide(a - .5)) continue; const [X,Y] = P(...B(3.02*Math.cos(a), 3.02*Math.sin(a), w)); holes += `<circle cx="${f(X)}" cy="${f(Y)}" r=".32" fill="#4a5155"/>`; }
    for (const w of [SHR_W + 3.9, SHR_W + 4.7, SHR_W + 5.5]) for (let i = 0; i < 18; i++){ const a = i/18*2*Math.PI + (Math.round(w) % 2 ? .17 : 0);
      if (!nearSide(a) || !nearSide(a + .5) || !nearSide(a - .5)) continue; const [X,Y] = P(...B(3.02*Math.cos(a), 3.02*Math.sin(a), w)); holes += `<circle cx="${f(X)}" cy="${f(Y)}" r=".32" fill="#4a5155"/>`; }
    s += holes + loft(sr(SHR_W), ring(SHR_W - 3, 1.2, 20), n => toneI(n, METAL)) + hullInk([...sr(SHR_W), ...ring(SHR_W - 3, 1.2, 20)], .7);
  }
  s += swirl(true);
  if (part === 'inner') return s + `<g opacity=".55">${hullInk([...ring(0), ...ring(BH)], 1.2)}${ink(pd(ring(COL_W)), .6)}${ink(pd(ring(FLOOR_W), false), .5)}</g>`;   // the clear wall's outline
  // front glass: tint + two streaks
  const silh = sp(hull([...ring(0), ...ring(BH)].map(p => P(...p))));
  s += `<g pointer-events="none">${fill(silh, '#cfe9f0', 'opacity=".22"')}`;
  const o0 = B(0,0,0), e1 = norm(sub(B(1,0,0), o0)), e2 = norm(sub(B(0,1,0), o0)), aSh = Math.atan2(dot(CAM_V, e2), dot(CAM_V, e1)) - Math.PI/4;
  for (const [a0, a1] of [[-.05 + aSh, .3 + aSh], [.42 + aSh, .52 + aSh]]){
    const q = [B(BR*Math.cos(a0), BR*Math.sin(a0), 5), B(BR*Math.cos(a1), BR*Math.sin(a1), 5), B(BR*Math.cos(a1), BR*Math.sin(a1), 32), B(BR*Math.cos(a0), BR*Math.sin(a0), 32)];
    s += fill(pd(q), '#ffffff', 'opacity=".38"');
  }
  s += `</g>`;
  // opaque base (holds the flap) and top collar
  s += loft(ring(0), ring(FLOOR_W), n => toneI(n, BINBASE)) + ink(pd(ring(FLOOR_W), false), .7);
  s += loft(ring(COL_W), ring(BH), n => toneI(n, GREY)) + ink(pd(ring(COL_W)), .7);
  s += fill(pd(ring(BH)), GREY.l) + `<path d="${pd(ring(BH, 6.2))}${pd(ring(BH, 3.3))}" fill="#3a3e40" fill-rule="evenodd"/>` + shape(ring(BH + .05, 3.1, 20), METAL.l, .6) + ink(pd(ring(BH)), .8);
  // MAX line + mark
  const mw = FLOOR_W + MAXH, arc = []; for (let a = -.6; a <= 1.5; a += .1) if (nearSide(a)) arc.push(B(BR*Math.cos(a), BR*Math.sin(a), mw));
  if (arc.length > 1) s += `<path d="${pd(arc,false)}" fill="none" stroke="#4f6068" stroke-width=".8" stroke-dasharray="1.6 1"/>`;
  if (nearSide(.05) && nearSide(.65)){ const a = .35, U = norm(sub(B(BR*Math.cos(a-.1), BR*Math.sin(a-.1), mw), B(BR*Math.cos(a+.1), BR*Math.sin(a+.1), mw))), V = norm(sub(B(0,0,0), B(0,0,1)));
    s += `<text transform="${txM(P(...B(BR*Math.cos(a)+.1, BR*Math.sin(a), mw + .7)), Dv(...U), Dv(...V))}" font-size="2.1" fill="#3f4d54" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">MAX</text>`; }
  // release catch on the front
  if (nearSide(-.6) && nearSide(.6)) s += act('release', shape([B(BR+.15,-1.7,31.2), B(BR+.15,1.7,31.2), B(BR+.15,1.7,34.6), B(BR+.15,-1.7,34.6)], RED, .8));
  s += hullInk([...ring(0), ...ring(BH)], 1.8);
  return s;
}
// the bottom flap, hinged on the viewer-right edge, hanging open
function flapArt(F, alpha){
  if (alpha < .01) return '';
  const pts = ellUV(0, 0, BR - .2, BR - .2, 28).map(([u,v]) => F.B(u, -BR + (v + BR)*Math.cos(alpha), -(v + BR)*Math.sin(alpha)));
  return shape(pts, BINBASE.l, 1.1);
}
const freeFrame = o => ({ B:(u,v,w) => [o[0]+u, o[1]+v, o[2]+w], tilt:0 });
const dockFrame = () => ({ B:(u,v,w) => T(BIN_U+u, v, BIN_W0+w), tilt:VT });

/* ---------- the vacuum ---------- */
function nozzle(st, m){
  const x0 = VX + 10, x1 = VX + 30, y0 = VY - 15, y1 = VY + 15, z0 = RUG_H + .2, z1 = RUG_H + 8;
  const ring = (z, ins=0) => on(PZ(z), rrUV(x0+ins, y0+ins, x1-ins, y1-ins, 4 - ins*.5, 5));
  const A = ring(z0, .6), B = ring(z1);
  let s = loft(A, B, n => tone(n, m));
  // closed top: the brush roll inside is shown only in see-through
  s += fill(pd(B), tone([0,0,1], m)) + ink(pd(B), 1.1);
  s += hullInk([...A, ...B], 2.2);
  // rubber bumper along the front lip
  const bump = box(x1 - .2, y0 + 4, RUG_H + .9, x1 + 1, y1 - 4, RUG_H + 4.2, RUBBER, toneI, .8);
  return vis([1,0,0]) ? s + bump : bump + s;
}
// floor-head yoke arm (one each side of the knuckle): runs from the nozzle's back up to the axle hub
function arm(side, m){
  const y0 = VY + side*8.6, y1 = VY + side*10.6;
  const prof = [[-3.5, ZA-3.5], [0, ZA-5], [10.6, 3], [10.6, 9], [3, ZA+3.5], [-1.5, ZA+3.5]];
  const A = prof.map(([x,z]) => [VX + x, y0, z]), B = prof.map(([x,z]) => [VX + x, y1, z]);
  const out = [0, side, 0], cap = vis(out) ? B : vis(out.map(v => -v)) ? A : null;
  return loft(A, B, n => tone(n, m)) + (cap ? shape(cap, tone(vis(out) ? out : [0,-side,0], m), .9) : '') + hullInk([...A, ...B], 1.4);
}
// rear wheels on the base's axle, outside the yoke arms
function wheel(side){
  const v0 = side*WV[0], v1 = side*WV[1], c = v => [VX, VY + v, ZA];
  let s = rod(c(v0), c(v1), WR, RUBBER, toneI, 1.4);
  if (vis([0, side, 0])){
    s += rod(c(v1), c(v1 + side*.6), 5, METAL, toneI, .9);
    const a0 = -st.xa / WR; let d = '';
    for (let k = 0; k < 3; k++){ const a = a0 + k*2*Math.PI/3; d += pd([c(v1 + side*.65), [VX + 4.2*Math.cos(a), VY + v1 + side*.65, ZA + 4.2*Math.sin(a)]], false); }
    s += `<path d="${d}" fill="none" stroke="${METAL.d}" stroke-width="1.1" stroke-linecap="round"/>`;
  }
  return s;
}
function panel(st){
  const pf = (v,w) => T(17.55, v, w), pl = uv => uv.map(([v,w]) => pf(v,w));
  let s = shape(pl(rrUV(-10, 61.6, 10, 69.4, 1.6)), '#2b3033', 1);
  // power button with a ring light
  s += act('power', fill(pd(pl(ellUV(6.6, 65.5, 2.9, 2.9, 20))), st.on ? GREEN : '#555b5e') + shape(pl(ellUV(6.6, 65.5, 2.15, 2.15, 20)), '#e9ecec', .8)
    + ink(pd(pl(arcUV(6.6, 65.3, 1.05, 125, 415, 10)), false), .6) + ink(pd(pl([[6.6, 65.4], [6.6, 66.9]]), false), .6));
  // suction bars: three when it pulls well, one when the bin is full
  for (let i = 0; i < 3; i++){
    const v = 1.8 - i*1.8, lit = st.on && (!st.full || i === 0);
    s += fill(pd(pl(rectUV(v - .6, 63.2, v + .6, 65.2 + i*1.4))), lit ? (st.full ? AMBER : GREEN) : '#4a5054');
  }
  const fullOn = st.on && st.full, blink = Math.floor(st.clk*3) % 2 === 0;
  s += fill(pd(pl(ellUV(-6.6, 67.4, .9, .9, 12))), fullOn ? (blink ? RED : '#7a2c26') : '#4a5054');
  const o = pf(-6.6, 62.9), U = sub(pf(-7,0), pf(-6,0)), V = sub(pf(0,0), pf(0,1));
  s += `<text transform="${txM(P(...o), Dv(...norm(U)), Dv(...norm(V)))}" font-size="2.3" fill="${fullOn ? '#ff9a8f' : '#80878b'}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">FULL</text>`;
  return s;
}
// ribbed clear hose: from the collar on the motor housing, up the spine's left side, elbow into the back of the top cap
function hose(st){
  const [hu, hv] = TUBE, r = TUBE_R;
  const q = smooth3([T(hu, hv, 21.5), T(hu, hv, 56), T(hu, hv, 62), T(hu + .6, hv, 64.8), T(-1.4, hv, 65.5)]);
  const d = pd(q, false), sw = w => `style="stroke-width:${f(w)}"`, cap = 'fill="none" stroke-linejoin="round"';
  let s = `<path d="${d}" ${cap} stroke-linecap="round" stroke="${INK}" ${sw(2*r + 2.2*INK_K)}/>` + `<path d="${d}" ${cap} stroke-linecap="round" stroke="#d3e6ec" ${sw(2*r)}/>`;
  for (const p of st.dirt) if (p.state === 'fly' && p.t > .12 && p.t < .5){
    const k = (p.t - .12)/.38, j = (p.id % 3 - 1)*.5; s += speck(T(hu + j*.6, hv + j*.5, 22 + k*36), p);
  }
  s += `<path d="${d}" ${cap} stroke="${CLEAR.d}" ${sw(2*r)} stroke-dasharray=".45 1.15" opacity=".55"/>`;   // the ribs
  const hl = 'M' + q.map(p => { const [X,Y] = P(...p); return f(X - r*.4)+' '+f(Y - r*.3); }).join('L');
  s += `<path d="${hl}" ${cap} stroke-linecap="round" stroke="#ffffff" ${sw(r*.45)} opacity=".7"/>`;
  s += lcyl(hu, hv, 21, 24.4, 2.3, GREY, .9);                                           // collar on the housing
  s += rod(T(-2.6, hv, 65.5), T(-.6, hv, 65.5), 2.3, GREY, toneI, .9);                  // cuff into the cap
  return s;
}
function vacuum(st, m){
  const fr = vis(Rn([1,0,0])), lf = vis(Rn([0,1,0]));
  // the floor base: nozzle, neck and yoke arms holding the axle, the wheels on it, the pivot knuckle between the arms
  let s = byDepth([
    { at:[VX, VY - 12.8, ZA], svg: wheel(-1) }, { at:[VX, VY + 12.8, ZA], svg: wheel(1) },
    { at:[VX + 2, VY - 9.6, ZA], svg: arm(-1, m) }, { at:[VX + 2, VY + 9.6, ZA], svg: arm(1, m) },
    { at:[VX + 19.5, VY, 5], svg: nozzle(st, m) },
    { at:[VX + 6.5, VY, 6], svg: box(VX + 3, VY - 5, RUG_H + 1.5, VX + 11, VY + 5, RUG_H + 8.2, GREY, toneI, .9) },
    { at:[VX, VY, ZA], svg: rod(T(0, -DV, 0), T(0, DV, 0), DR, m, tone, 1.6) },
  ]);
  // motor housing, sitting on the knuckle
  s += lbox(-8, -10.4, 8.8, 17, 10.4, 22, 3.5, m, 2);
  if (fr){ let vents = ''; for (const w of [12, 14.6, 17.2]) vents += pd([T(17.05, -6, w), T(17.05, 6, w)], false);
    s += `<path d="${vents}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`; }
  else { let vents = ''; for (const w of [12, 14.6, 17.2]) vents += pd([T(-8.05, -8, w), T(-8.05, -1, w)], false);
    s += `<path d="${vents}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>`
      + cable(cordPts().slice(0, 4), .75, CORD_M) + rod(T(-7.6, 3, 14), T(-9.3, 3, 14), 1.3, RUBBER, toneI, .9); }   // cord leaving the back, grommet
  // spine (backbone) with cord hooks on its back
  let hooks = '';
  for (const [w, dir] of [[30, 1], [64, -1]]) hooks += lbox(-10.4, -2.2, w, -7.8, 2.2, w + 1.8, .6, GREY, .9) + lbox(-10.4, -2.2, dir > 0 ? w + 1.8 : w - 2, -9.2, 2.2, dir > 0 ? w + 3.8 : w, .4, GREY, .8);
  const spine = (fr ? hooks : '') + lbox(-8, -7, 20, 1.8, 7, 74, 2.5, GREY, 2) + (fr ? '' : hooks);
  // the bin in its seat on the housing, against the spine (or sliding in / out of it)
  let bin = '';
  if (!st.emp || st.emp.t <= 0) bin = drawBin(st, dockFrame(), st.level);
  else { const bp = binPose(st); if (bp.inSlot) bin = drawBin(st, freeFrame(bp.o), st.level); }
  // top cap: fixed to the spine, closing the bin, display on its front
  const cap = lbox(-1, -11, 60, 17.5, 11, 71, 3.5, m, 2) + (fr ? panel(st) : '');
  const hs = hose(st), sh = lf ? spine + hs : hs + spine;
  s += fr ? sh + bin + cap : bin + cap + sh;
  // handle: wand out of the spine top, grip and loop (the highest part, drawn last)
  s += rod(T(-3.5, 0, 73.5), T(-3.5, 0, 100), 1.7, GREY, tone, 1.2);
  s += rod(T(-3.5, 0, 99), T(-3.5, 0, 108.5), 2.2, RUBBER, toneI, 1.2);
  s += rod(T(-3.5, 0, 107.2), T(4.5, 0, 104.4), 1.3, RUBBER, toneI, 1);
  s += rod(T(4.5, 0, 104.6), T(4.5, 0, 96.6), 1.3, RUBBER, toneI, 1);
  s += rod(T(4.5, 0, 96.8), T(-3.5, 0, 94.4), 1.3, RUBBER, toneI, 1);
  return s;
}
function vacShadowPts(){
  const lo = [...on(PZ(RUG_H), rrUV(VX+10, VY-15, VX+30, VY+15, 4, 3)), ...on(PZ(RUG_H+8), rrUV(VX+10, VY-15, VX+30, VY+15, 4, 3))];
  for (const u of [-WR, WR]) for (const v of [-WV[1], WV[1]]) for (const w of [-WR, WR]) lo.push(T(u, v, w));
  for (const [u0,u1,v,w0,w1] of [[-8,17,10.4,8.8,22],[-8,1.8,7,20,74],[-1,17.5,11,60,71]]) for (const u of [u0,u1]) for (const vv of [-v,v]) for (const w of [w0,w1]) lo.push(T(u, vv, w));
  const hi = [T(-3.5,-1.7,74), T(-3.5,1.7,74), T(-3.5,-2.2,108.5), T(-3.5,2.2,108.5), T(4.5,-1.3,96.6), T(4.5,1.3,104.6)];
  return [lo, hi];
}

/* ---------- the trash can, the socket and the cord ---------- */
function trashCan(st){
  const { x, y, r0, r1, h } = CAN, rimZ = h + .4;
  const ring = (z, r, n=32) => on(PZ(z), ellUV(x, y, r, r, n));
  const A = ring(0, r0), B = ring(h, r1);
  let s = loft(A, B, n => tone([n[0], n[1], 0], CANM));
  const bagLo = Array.from({length:32}, (_,i) => { const a = i/32*2*Math.PI; return [x + (r1+.15)*Math.cos(a), y + (r1+.15)*Math.sin(a), h - 4 + .9*Math.sin(5*a)]; });
  const bagHi = ring(rimZ, r1 + .15), inner = ring(rimZ, r1 - .8);
  s += loft(bagLo, bagHi, n => toneI([n[0], n[1], 0], BAG)) + ink(pd(bagLo), .7);
  s += `<path d="${pd(bagHi)}${pd(inner)}" fill="${BAG.l}" fill-rule="evenodd"/>`;
  // inside: bag wall, rubbish heap, the dirt that has landed, dirt still falling below the rim
  let inn = fill(pd(inner), BAG.d) + loft(ring(rimZ - 8, r1 - 1), inner, n => toneI(n, BAG), true);
  const hz = heapZ(st), hp = ring(hz, r1 - 1);
  inn += fill(pd(hp), '#cfc8b8');
  for (const [dx, dy, r] of [[-4, -1.5, 2.6], [-1.5, -5, 2.2], [-6, -5.5, 1.8]]) inn += shape(on(PZ(hz + .6), chaikin(ellUV(x + dx, y + dy, r, r*.8, 7), 1)), '#fbf7ea', .6);
  for (let i = 0; i < st.heap; i++){ const a = i*1.9, rr = 2 + i % 3 * 1.4;
    inn += shape(on(PZ(hz + .4), chaikin(ellUV(x - 3 + rr*Math.cos(a), y - 3 + rr*Math.sin(a), 3, 2.2, 8), 1)), DIRT.m, .5); }
  st.canItems.slice(-8).forEach((c, i) => { const [X,Y] = P(x - 4 + (i % 4)*2, y - 5 + Math.floor(i/4)*3 + (i % 2), hz + .9); inn += `<circle cx="${f(X)}" cy="${f(Y)}" r=".8" fill="${c}" stroke="${INK}" stroke-width=".3"/>`; });
  for (const q of falling(st)) if (q.pt[2] < rimZ) inn += clump(q);
  s += clipTo(inner, inn);
  s += ink(pd(inner), 1) + ink(pd(bagHi), 1.1) + hullInk([...A, ...bagHi], 2.2);
  return s;
}
function socket(){
  const [x0,y0,x1,y1,h] = SOCK, yc = (y0+y1)/2;
  let s = box(x0, y0, 0, x1, y1, h, CERAMIC, tone, 1.1);
  if (vis([1,0,0])) s += shape(on(PX(x1 + .05), ellUV(yc, h/2, 2.8, 2.8, 16)), CERAMIC.m, .8);
  s += box(x1, yc - 2, h/2 - 2, x1 + 4.6, yc + 2, h/2 + 2, DARK, toneI, 1);          // the plug, pushed in
  return s;
}
function cordPts(){
  const fz = (x, y) => (x >= RX0 && x <= RX1 && y >= RY0 && y <= RY1 ? RUG_H : 0) + .9;
  const e = T(-8.2, 3, 14), p2 = [e[0] - 9, e[1] + 4], end = [SOCK[2] + 4.6, (SOCK[1] + SOCK[3])/2, SOCK[4]/2];
  const mid = [(p2[0] + end[0] + 6)/2, (p2[1] + end[1])/2 + 4];
  return [e, [e[0] - 2.5, e[1] + .6, e[2] - 4], [e[0] - 5.5, e[1] + 2, fz(e[0]-5.5, e[1]+2) + 3], [...p2, fz(...p2)], [...mid, fz(...mid)], [end[0] + 5, end[1], fz(end[0] + 5, end[1])], [end[0] + 1.5, end[1], end[2] - .6], end];
}

/* ---------- scene ---------- */
function scene(st, m){
  VX = st.xa; VY = st.yc; VT = st.th;
  const rugTop = boardTop(RX0, RY0, RX1, RY1, RUG_H, 1.5);
  const [vlo, vhi] = vacShadowPts();
  const canPts = [...on(PZ(0), ellUV(CAN.x, CAN.y, CAN.r0, CAN.r0, 20)), ...on(PZ(CAN.h), ellUV(CAN.x, CAN.y, CAN.r1, CAN.r1, 20))];
  const [sx0, sy0, sx1, sy1, sh] = SOCK, sockPts = [[sx0,sy0,0],[sx1,sy0,0],[sx1,sy1,0],[sx0,sy1,0],[sx0,sy0,sh],[sx1,sy0,sh],[sx1,sy1,sh],[sx0,sy1,sh]];
  const bp = st.emp && st.emp.t > 0 ? binPose(st) : null;
  const binPts = bp ? [...on(PZ(bp.o[2]), ellUV(bp.o[0], bp.o[1], BR, BR, 16)), ...on(PZ(bp.o[2] + BH), ellUV(bp.o[0], bp.o[1], BR, BR, 16))] : null;
  const shadows = z0 => castShadow(vlo, z0) + castShadow(vhi, z0) + castShadow(canPts, z0) + castShadow(sockPts, z0)
    + (bp && !bp.inSlot ? `<g opacity=".4">${castShadow(binPts, z0)}</g>` : '');
  const fringe = (x, dir) => { let d = ''; for (let y = RY0 + 2.5; y <= RY1 - 2.5; y += 4.5) d += pd([[x, y, .25], [x + dir*3.2, y + .4, .25]], false);
    return `<path d="${d}" fill="none" stroke="#c4b48e" stroke-width="1.1" stroke-linecap="round"/>`; };

  let s = fringe(RX0, -1) + shadows(0);
  s += board(RX0, RY0, RX1, RY1, RUG_H, 1.5, RUGM);
  const zt = RUG_H + .02, o1 = on(PZ(zt), rrUV(RX0+3, RY0+3, RX1-3, RY1-3, 1)), o2 = on(PZ(zt), rrUV(RX0+6.5, RY0+6.5, RX1-6.5, RY1-6.5, .8));
  s += `<path d="${pd(o1)}${pd(o2)}" fill="${RUG_BORDER}" fill-rule="evenodd"/>` + ink(pd(o1), .6) + ink(pd(o2), .6);
  // freshly vacuumed strips, then shadows on the rug
  let strips = '';
  st.swept.forEach((r, i) => { if (r) strips += fill(pd(on(PZ(RUG_H + .03), rectUV(r[0], LANES[i] - MOUTH[2], r[1], LANES[i] + MOUTH[2]))), '#ffffff', 'opacity=".14"'); });
  s += clipTo(rugTop, strips + shadows(RUG_H));
  s += fringe(RX1, 1);
  for (const p of st.dirt) if (p.state === 'rug') s += rugPiece(p);
  s += cable(cordPts(), .75, CORD_M);   // the cord lies flat on the floor: never in front of anything standing, so it goes first

  // can, vacuum, the bin while it is carried (sorted)
  const parts = [ { at:[CAN.x, CAN.y, 15], svg: trashCan(st) }, { at:[st.xa + 5, st.yc, 40], svg: (k => k > 0 ? xrUnder(vacuum(st, m), '', k) + `<g opacity="${f(k)}">${XR_OPTS.mech(st, k)}</g>` : vacuum(st, m))(ease(st.xr || 0)) },
    { at:[(SOCK[0]+SOCK[2])/2, (SOCK[1]+SOCK[3])/2, 3.5], box:[[SOCK[0], SOCK[1], 0], [SOCK[2] + 4.6, SOCK[3], SOCK[4]]], svg: socket() } ];
  if (bp && !bp.inSlot){
    let b = flapArt(freeFrame(bp.o), bp.alpha);
    for (const q of falling(st)) if (q.pt[2] >= CAN.h + .4) b += clump(q);
    b += drawBin(st, freeFrame(bp.o), st.level);
    parts.push({ at:[bp.o[0], bp.o[1], bp.o[2] + BH/2], svg: b });
  }
  s += byDepth(parts);
  return s;
}

/* ---------- behaviour: one loop, one state ---------- */
let ui;
function wake(){
  if (st.loop) return; st.loop = true; let last = performance.now();
  ui.animate(() => { const n = performance.now(), dt = Math.min(.05, Math.max(0, (n - last)/1000)); last = n; const more = step(dt); if (!more) st.loop = false; return more; });
}
function step(dt){
  st.clk += dt;
  const work = (st.on || moving(st)) && !st.emp, thT = work ? TILT : 0;
  st.th += Math.sign(thT - st.th) * Math.min(Math.abs(thT - st.th), dt * TILT / .45);
  if (!st.emp){
    const dx = st.tx - st.xa, dy = st.ty - st.yc;
    st.xa += Math.sign(dx) * Math.min(Math.abs(dx), dt * Math.min(24, 2 + Math.abs(dx)*5));
    st.yc += Math.sign(dy) * Math.min(Math.abs(dy), dt * Math.min(22, 2 + Math.abs(dy)*5));
  }
  st.br += dt * (st.on ? (st.full ? 8 : 26) : 0);
  st.sw += dt * (st.on ? (st.full ? 1.2 : 6) : 0);
  // suction at the mouth
  if (st.on && !st.emp){
    const mx0 = st.xa + MOUTH[0], mx1 = st.xa + MOUTH[1];
    const li = LANES.findIndex(l => Math.abs(l - st.yc) < .3);
    if (li >= 0){ const r = st.swept[li]; st.swept[li] = r ? [Math.min(r[0], mx0), Math.max(r[1], mx1)] : [mx0, mx1]; }
    for (const p of st.dirt){
      if (p.state !== 'rug' || p.x < mx0 || p.x > mx1 || Math.abs(p.y - st.yc) > MOUTH[2]) continue;
      if (committed(st) >= .999) break;
      p.state = 'fly'; p.t = 0;
    }
    if (committed(st) >= .999 && !st.full){ st.full = true; }
    if (st.full && !st.fullNoted){ st.fullNoted = true; ui.flash('bin full — suction is weak, empty the bin', 2600); }
  }
  for (const p of st.dirt) if (p.state === 'fly'){
    p.t += dt / 1.3;
    if (p.t >= 1){ p.state = 'bin'; st.level = Math.min(1, st.level + p.vol); if (p.k !== 'crumb' || p.id % 3 === 0) st.binItems.push(p.col); }
  }
  // emptying
  if (st.emp){
    const e = st.emp;
    if (e.t === 0 && (st.th > .003 || inflight(st).length)) return true;   // stand it up, let the duct clear
    if (e.t === 0){ e.lvl0 = st.level; e.items = st.binItems.slice(); }
    e.t += dt;
    if (e.t > E.fall[0]) st.level = e.lvl0 * (1 - sstep(E.fall[0], E.fall[1], e.t));
    if (!e.landed && e.t > E.fall[1]){ e.landed = true; if (e.lvl0 > .02) st.heap++; st.canItems.push(...e.items); st.binItems = []; }
    if (e.t >= E.end){ st.emp = null; st.level = 0; st.full = false; st.fullNoted = false; ui.flash('bin emptied and clicked back in', 1800); }
    return true;
  }
  return st.on || moving(st) || inflight(st).length > 0 || Math.abs(st.th - thT) > 1e-4;
}
const busy = (st, ui) => { if (st.emp){ ui.flash('wait — the bin is being emptied'); return true; } return false; };
function power(st, ui){
  if (busy(st, ui)) return;
  st.on = !st.on;
  if (st.on && st.full){ st.fullNoted = true; ui.flash('bin full — suction is weak, empty the bin', 2600); }
  wake();
}
function push(st, ui, to){
  if (busy(st, ui)) return;
  const end = to > st.xa ? 'front' : 'back';
  if (Math.abs(st.tx - to) < .01 && Math.abs(st.xa - to) < .5) return ui.flash(end === 'front' ? 'already at the front edge — pull it back' : 'already at the back edge — push it forward');
  st.tx = to; wake();
  if (!st.on) ui.flash("it's switched off — it rolls, but the dirt stays put", 2000);
  else if (st.full) ui.flash('bin full — suction is weak, empty the bin', 2000);
}
function moveOver(st, ui){
  if (busy(st, ui)) return;
  st.lane = 1 - st.lane; st.ty = LANES[st.lane]; wake();
}
function emptyBin(st, ui){
  if (st.emp) return ui.flash('already emptying the bin');
  if (committed(st) < .01) return ui.flash('the bin is already empty');
  const wasOn = st.on;
  st.on = false; st.tx = st.xa; st.ty = st.yc;
  st.emp = { t:0, landed:false, lvl0: st.level, items: [] };
  ui.flash(wasOn ? 'switched off — carrying the bin to the can' : 'carrying the bin to the can', 1800);
  wake();
}

const Q = new URLSearchParams(location.search);

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

/* ---------- see-through: how a real upright cyclone vacuum works ----------
   One motor at the bottom pulls air the whole way round. The floor head has its own small motor for the brush roll.
   Parts (each held by another; the air and the current each run from a real port to a real port):
   FLOOR HEAD  brush roll core . bristle strips . two end caps . two bearing blocks on the side walls . roll pulley .
               brush motor . its shaft and pulley . its cradle on the head floor . drive belt . roll-chamber outlet port .
               floor-head duct back through the neck . pivot pins through the yoke arms into the wheel hubs
   PIVOT       swivel ball at the pivot centre (the duct and the brush-motor wire both pass the joint here)
   DIRTY AIR   body duct from the swivel up the left of the housing to the hose collar . (the hose up the spine) .
               cap inlet duct from the hose cuff down into the bin top, entering at the side so the air spins
   CYCLONE     clear bin . dirt . shroud with its perforations . cone skirt under it . vortex-finder stem up into the cap
   CLEAN AIR   pre-motor filter: base plate, foam pad, plenum cover with its back port . clean-air duct down the spine .
               fan cover (clear) . impeller backplate . impeller vanes . hub . exhaust port . exhaust duct . HEPA filter
               frame and pleats behind the front vents
   MOTOR       armature can with winding slots . commutator . two carbon-brush holders . bottom bracket . two rubber feet
   POWER       cord in through the grommet . strain-relief clamp . terminal block . two-wire harness up the inside of the
               spine . switch board behind the panel: power switch, three suction LEDs, FULL LED, chip, capacitor,
               standoffs . motor feeds from the block to the brush holders . brush-motor feed down through the pivot */
const PCB = { l:'#4fa36a', m:'#2f8a4a', d:'#1d5f31' }, COPPER = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, LIT = matOf('#ff9a3a');
const DUCTM = { l:'#e8eef0', m:'#c4ced1', d:'#8e9a9e' }, FOAM = { l:'#bcd3ea', m:'#9bb8d6', d:'#6f8fb0' }, PLAST = matOf('#e8e4da');
const HEPA_M = { l:'#fbf8ee', m:'#e6e0cf', d:'#bdb6a2' };
const MOT = { u:-3.4, v:-3.5 };                                        // motor + fan axis (body frame), vertical
const XR_LAST = { level: 0 };
const vBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - .6), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + .6)];
const vBend = (pts, r = 2.2) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k]) * d/la), q = c.map((v, k) => b[k] + (v - b[k]) * d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a route cut into short pieces (each with its own box) so byDepth sorts it against the solids. Width is physical
// (style, not scaled with the ink). opts: fill, flow (dashed stream inside), specks [[x,y,z], ...], dots (terminal dots)
function routeParts(pts, r, col, opt = {}){
  const q = vBend(pts, opt.bend || Math.max(1.6, r*1.6)), out = [], L = opt.L || 5, n = q.length;
  const sw = w => `style="stroke-width:${f(w)}"`, J = 'fill="none" stroke-linejoin="round"';
  for (let i = 0; i < n - 1; ){
    let j = i + 1, len = 0; while (j < n - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j - 1][k])); j++; }
    if (len < L) while (j < n - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false), cap0 = i === 0 ? 'round' : 'butt', cap1 = j === n - 1 ? 'round' : 'butt', cap = cap0 === 'round' || cap1 === 'round' ? 'round' : 'butt';
    let svg = `<path d="${d}" ${J} stroke-linecap="${cap}" stroke="${INK}" ${sw(2*r + 1.1*INK_K + (r > 1 ? .5 : 0))}/>` + `<path d="${d}" ${J} stroke-linecap="${cap}" stroke="${col}" ${sw(2*r)}/>`;
    if (r > 1){ const hl = 'M' + seg.map(p => { const [X,Y] = P(...p); return f(X - r*.35)+' '+f(Y - r*.3); }).join('L');
      svg += `<path d="${hl}" ${J} stroke-linecap="${cap}" stroke="#ffffff" ${sw(r*.4)} opacity=".6"/>`; }
    if (opt.flow) svg += `<path d="${d}" ${J} stroke="${opt.flow}" ${sw(Math.max(.5, r*.35))} stroke-dasharray="1.6 2.2" stroke-dashoffset="${f(-(opt.phase || 0) - i*.0)}" opacity=".9"/>`;
    const bx = vBoxOf(seg);
    if (opt.specks) for (const sp of opt.specks){ if (sp.used) continue; if (sp.pt.every((v, k) => v >= bx[0][k] && v <= bx[1][k])){ sp.used = true; svg += speck(sp.pt, sp.p, .8); } }
    if (opt.dots && i === 0){ const [X, Y] = P(...q[0]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(.9*INK_K/.43)}" fill="${INK}"/>`; }
    if (opt.dots && j === n - 1){ const [X, Y] = P(...q[j]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(.9*INK_K/.43)}" fill="${INK}"/>`; }
    out.push({ box: bx, svg }); i = j; }
  return out;
}
const along = (pts, t) => { const q = vBend(pts), L = []; let tot = 0; for (let i = 1; i < q.length; i++){ const l = Math.hypot(...q[i].map((v, k) => v - q[i-1][k])); L.push(l); tot += l; }
  let d = t*tot; for (let i = 0; i < L.length; i++){ if (d <= L[i]) return q[i].map((v, k) => v + (q[i+1][k] - v)*d/(L[i] || 1)); d -= L[i]; } return q[q.length - 1]; };
// box in the tilting body frame: six faces, each drawn when it faces the viewer
function tbox(u0,v0,w0,u1,v1,w1,m,w=.7){
  const F = [[[0,1,0],[[u0,v1,w0],[u1,v1,w0],[u1,v1,w1],[u0,v1,w1]]], [[1,0,0],[[u1,v0,w0],[u1,v1,w0],[u1,v1,w1],[u1,v0,w1]]],
    [[0,-1,0],[[u0,v0,w0],[u1,v0,w0],[u1,v0,w1],[u0,v0,w1]]], [[-1,0,0],[[u0,v0,w0],[u0,v1,w0],[u0,v1,w1],[u0,v0,w1]]],
    [[0,0,1],[[u0,v0,w1],[u1,v0,w1],[u1,v1,w1],[u0,v1,w1]]], [[0,0,-1],[[u0,v0,w0],[u1,v0,w0],[u1,v1,w0],[u0,v1,w0]]]];
  return F.filter(([n]) => vis(Rn(n))).map(([n,q]) => shape(q.map(p => T(...p)), toneI(Rn(n), m), w)).join('');
}
const tBox = (u0,v0,w0,u1,v1,w1) => vBoxOf([T(u0,v0,w0),T(u1,v0,w0),T(u0,v1,w0),T(u1,v1,w0),T(u0,v0,w1),T(u1,v0,w1),T(u0,v1,w1),T(u1,v1,w1)]);
// vertical cylinder in the body frame
const tcyl = (u,v,w0,w1,r,m,iw=.8) => rod(T(u,v,w0), T(u,v,w1), r, m, toneI, iw, r, 22);
const tcylBox = (u,v,w0,w1,r) => tBox(u-r,v-r,w0,u+r,v+r,w1);
// air and wire routes (body routes in the body frame, head routes in the world; both meet at the pivot centre)
const HEAD_DUCT = () => [[VX + 19, VY, 5.4], [VX + 8, VY, 5.4], [VX + 2.1, VY, ZA - 1.5]];
const BODY_DUCT = () => [[0, 0, 2.6], [0, 0, 5], [0, 5.8, 8.5], [TUBE[0], TUBE[1], 13], [TUBE[0], TUBE[1], 22]].map(p => T(...p));
const CAP_INLET = () => [[-.6, TUBE[1], 65.5], [4, TUBE[1], 65.5], [6, 7.6, 61.6], [9.4, 5.4, 61.4], [9.4, 5.4, 60.1]].map(p => T(...p));
const SPINE_DUCT = () => [[4.1, MOT.v, 68], [MOT.u, MOT.v, 68], [MOT.u, MOT.v, 21.6]].map(p => T(...p));
const EXHAUST = () => [[1.0, MOT.v, 19.8], [6.5, MOT.v, 19.8], [9.6, MOT.v, 15.5], [12.4, MOT.v, 15.5]].map(p => T(...p));
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
function vacMech(st, m){
  VX = st.xa; VY = st.yc; VT = st.th;
  const ON = !!st.on, parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const H = '#3a3632', Hon = '#ffb347', MAINS = '#8a3a24', spin = st.sw * 3, docked = !st.emp || st.emp.t <= 0;
  const fz = RUG_H + 3.9, rx = VX + 24;                                                 // brush roll axis (as before)
  // ---- floor head: brush roll on two bearings, belt from the brush motor's pulley
  let roll = rod([rx, VY - 12.8, fz], [rx, VY + 12.4, fz], 2.9, DARK, toneI, .9), d = '';
  for (let k = 0; k < 6; k++){ let seg = []; const flush = () => { if (seg.length > 1) d += pd(seg, false); seg = []; };
    for (let y = VY - 12.3; y <= VY + 11.9; y += .8){ const a = st.br + k*Math.PI/3 + (y - VY)*.2, n = [Math.cos(a), 0, Math.sin(a)];
      if (vis(n)) seg.push([rx + 2.95*n[0], y, fz + 2.95*n[2]]); else flush(); }
    flush(); }
  roll += `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:1.3" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${m.l}" style="stroke-width:.8" stroke-linecap="round"/>`;
  put([[rx - 3, VY - 12.8, fz - 3], [rx + 3, VY + 12.4, fz + 3]], roll);   // (core under the bristles)
  for (const s of [-1, 1]){
    const yc = s < 0 ? -13.2 : 13.0;
    if (s < 0) put([[rx - 2.4, VY - 13.6, fz - 2.4], [rx + 2.4, VY - 12.8, fz + 2.4]], rod([rx, VY - 13.6, fz], [rx, VY - 12.8, fz], 2.4, GREY, toneI, .7));   // end cap
    else put([[rx - 2.2, VY + 12.4, fz - 2.2], [rx + 2.2, VY + 13.4, fz + 2.2]], rod([rx, VY + 12.4, fz], [rx, VY + 13.4, fz], 2.2, METAL, toneI, .7)); // roll pulley
    const y0 = s < 0 ? VY - 14.4 : VY + 13.4, y1 = s < 0 ? VY - 13.6 : VY + 14.4;
    put([[rx - 1.8, y0, RUG_H + .2], [rx + 1.8, y1, fz + 2]], box(rx - 1.8, y0, RUG_H + .2, rx + 1.8, y1, fz + 2, DARK, toneI, .6)
      + (vis([0, -s, 0]) ? shape(on(PY(s < 0 ? y1 + .02 : y0 - .02), ellUV(rx, fz, 1, 1, 12)), METAL.l, .45) : ''));                         // bearing block on the side wall
  }
  const bmx = VX + 15, bmz = 5.3;
  put([[bmx - 2, VY + 7, RUG_H + .2], [bmx + 2, VY + 12, bmz - 2.3]], box(bmx - 2, VY + 7, RUG_H + .2, bmx + 2, VY + 12, bmz - 2.35, GREY, toneI, .6));   // cradle
  put([[bmx - 2.4, VY + 6.5, bmz - 2.4], [bmx + 2.4, VY + 12.2, bmz + 2.4]], rod([bmx, VY + 6.5, bmz], [bmx, VY + 12.2, bmz], 2.4, ON ? LIT : GEARM_V, toneI, .8)
    + (vis([0,-1,0]) ? shape(on(PY(VY + 6.48), ellUV(bmx, bmz, 1.2, 1.2, 12)), METAL.m, .4) : ''));
  put([[bmx - 1, VY + 12.2, bmz - 1], [bmx + 1, VY + 13.4, bmz + 1]], rod([bmx, VY + 12.2, bmz], [bmx, VY + 12.4, bmz], .5, METAL, toneI, .4) + rod([bmx, VY + 12.4, bmz], [bmx, VY + 13.4, bmz], 1, METAL, toneI, .5));
  { const yb = VY + 12.9, cir = (cx, cz, r) => Array.from({length:24}, (_, i) => { const a = i/24*2*Math.PI; return [cx + r*Math.cos(a), cz + r*Math.sin(a)]; });
    const h = hull([...cir(rx, fz, 2.45), ...cir(bmx, bmz, 1.25)]).map(([x, z]) => [x, yb, z]), dd = pd(h);
    put([[bmx - 1.4, yb - .5, fz - 2.6], [rx + 2.6, yb + .5, fz + 2.6]], `<path d="${dd}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="${dd}" fill="none" stroke="#2f2c29" style="stroke-width:.55" stroke-linejoin="round"/>`); }
  put([[VX + 19, VY - 3, 2.6], [VX + 21, VY + 3, 8.2]], box(VX + 19, VY - 3, 2.6, VX + 21, VY + 3, 8.2, GREY, toneI, .6));     // roll-chamber outlet port
  for (const s of [-1, 1]) put([[VX - 1.1, VY + s*8.4 - (s < 0 ? 7 : 0), ZA - 1.1], [VX + 1.1, VY + s*8.4 + (s > 0 ? 7 : 0), ZA + 1.1]],
    rod([VX, VY + s*8.4, ZA], [VX, VY + s*15.4, ZA], 1.1, METAL, toneI, .6));                                                    // pivot pins
  { const [X, Y] = P(VX, VY, ZA), R = 2.7*CAM_K;                                                                                  // swivel ball
    put([[VX - 2.7, VY - 2.7, ZA - 2.7], [VX + 2.7, VY + 2.7, ZA + 2.7]], `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(R)}" fill="${GREY.m}" stroke="${INK}" stroke-width=".9"/><circle cx="${f(X - R*.25)}" cy="${f(Y - R*.25)}" r="${f(R*.62)}" fill="${GREY.l}"/>`); }
  // ---- dirty air: specks of dirt riding the ducts (same clock as the hose and the bin)
  const fly = st.dirt.filter(p => p.state === 'fly');
  const sk1 = fly.filter(p => p.t <= .12).map(p => { const q = p.t/.12, H1 = HEAD_DUCT(), B1 = BODY_DUCT(); return { p, pt: q < .45 ? along(H1, q/.45) : along(B1, (q - .45)/.55) }; });
  const sk2 = fly.filter(p => p.t > .5 && p.t <= .56).map(p => ({ p, pt: along(CAP_INLET(), (p.t - .5)/.06) }));
  const clear = '#d3e6ec';
  parts.push(...routeParts(HEAD_DUCT(), 1.8, clear, { specks: sk1 }));
  parts.push(...routeParts(BODY_DUCT(), 1.8, clear, { specks: sk1 }));
  parts.push(...routeParts(CAP_INLET(), 1.4, clear, { specks: sk2 }));
  // ---- cyclone: the bin's contents (drawn whole again over the ghost) and the vortex-finder stem into the cap
  if (docked) put(vBoxOf([T(BIN_U - BR, -BR, BIN_W0), T(BIN_U + BR, BR, BIN_W0 + COL_W)]), drawBin(st, dockFrame(), st.level, 'inner'));
  put(tcylBox(BIN_U, 0, 57, 63.4, 2.6), tcyl(BIN_U, 0, BIN_W0 + COL_W, 63.4, 2.6, GREY));
  // ---- pre-motor filter in the cap: base plate, foam pad, plenum cover with its back port
  put(tcylBox(BIN_U, 0, 63.4, 63.8, 6), tcyl(BIN_U, 0, 63.4, 63.8, 6, GREY, .7));
  put(tcylBox(BIN_U, 0, 63.8, 66, 5.6), tcyl(BIN_U, 0, 63.8, 66, 5.6, FOAM, .7)
    + (vis(Rn([0,0,1])) ? [1.6, 3.2, 4.6].map(r => ink(pd(ellUV(BIN_U, 0, r, r, 20).map(([u, v]) => T(u, v, 66.02))), .3)).join('') : ''));
  put(tcylBox(BIN_U, 0, 66, 70, 6), tcyl(BIN_U, 0, 66, 70, 6, PLAST, .8));
  // ---- clean air down the spine to the fan, out through the HEPA filter
  parts.push(...routeParts(SPINE_DUCT(), 2, DUCTM.l, { flow: ON ? '#7fb7c8' : null, phase: st.sw*8 }));
  parts.push(...routeParts(EXHAUST(), 1.8, DUCTM.l, { flow: ON ? '#7fb7c8' : null, phase: st.sw*8 }));
  // fan: clear cover (far half), impeller (backplate, vanes, hub), cover near half and its top plate with the eye
  { const ring = (w, r, n = 28) => ellUV(MOT.u, MOT.v, r, r, n).map(([u, v]) => T(u, v, w));
    const vanes = []; for (let i = 0; i < 9; i++){ const a = spin + i/9*2*Math.PI, a2 = a + .5;
      const pA = [MOT.u + 1.2*Math.cos(a), MOT.v + 1.2*Math.sin(a)], pB = [MOT.u + 3.9*Math.cos(a2), MOT.v + 3.9*Math.sin(a2)];
      const q = [T(...pA, 19.6), T(...pB, 19.6), T(...pB, 21), T(...pA, 21)], mid = T((pA[0] + pB[0])/2, (pA[1] + pB[1])/2, 20.3);
      vanes.push({ at: mid, svg: shape(q, ON ? LIT.l : METAL.l, .45) }); }
    const imp = fill(pd(ring(19.6, 4)), METAL.m) + ink(pd(ring(19.6, 4)), .6) + byDepth(vanes) + tcyl(MOT.u, MOT.v, 19.6, 21, 1.2, METAL, .5);
    const shell = loft(ring(18.8, 4.4), ring(21.6, 4.4), n => toneI(n, CLEAR), true);
    const near = `<g opacity=".45">${loft(ring(18.8, 4.4), ring(21.6, 4.4), n => toneI(n, CLEAR))}${vis(Rn([0,0,1])) ? fill(pd(ring(21.6, 4.4)), CLEAR.l) : ''}</g>`;
    put(tcylBox(MOT.u, MOT.v, 18.6, 21.6, 4.4), shell + imp + near + ink(pd(ring(21.6, 4.4)), .6) + hullInk([...ring(18.8, 4.4), ...ring(21.6, 4.4)], .9)); }
  // motor: armature can with winding slots, commutator, brush holders, bracket, rubber feet
  { let can = tcyl(MOT.u, MOT.v, 12, 18.6, 3.6, METAL, .9);
    for (let i = 0; i < 10; i++){ const a = i/10*2*Math.PI, n = Rn([Math.cos(a), Math.sin(a), 0]); if (!vis(n) || dot(rotV(n), [1,1,1].map(v => v/Math.sqrt(3))) < .25) continue;
      const q = [[a - .12, 13], [a + .12, 13], [a + .12, 17.6], [a - .12, 17.6]].map(([b, w]) => T(MOT.u + 3.62*Math.cos(b), MOT.v + 3.62*Math.sin(b), w));
      can += shape(q, ON ? LIT.m : COPPER.m, .35); }
    put(tcylBox(MOT.u, MOT.v, 12, 18.6, 3.6), can);
    put(tcylBox(MOT.u, MOT.v, 10.6, 12, 1.8), tcyl(MOT.u, MOT.v, 10.6, 12, 1.8, COPPER, .6));
    for (const [u0, u1] of [[-6.6, -5.2], [-1.6, -.2]]) put(tBox(u0, -4.3, 10.6, u1, -2.7, 11.8), tbox(u0, -4.3, 10.6, u1, -2.7, 11.8, DARK, .5));
    put(tBox(-7, -4.5, 10, .2, -2.5, 10.6), tbox(-7, -4.5, 10, .2, -2.5, 10.6, GEARM_V, .5));
    for (const u of [-6.4, -.4]) put(tcylBox(u, MOT.v, 8.8, 10, .9), tcyl(u, MOT.v, 8.8, 10, .9, RUBBER, .5)); }
  // HEPA filter behind the front vents: frame and pleats
  { let hp = tbox(12.4, -8.6, 10.2, 16.3, 8.6, 20.6, HEPA_M, .8), pl = '';
    if (vis(Rn([0,0,1]))) for (let v = -7.6; v <= 7.7; v += 1.2) pl += pd([T(12.9, v, 20.62), T(15.8, v, 20.62)], false);
    for (const [u, nn] of [[16.32, [1,0,0]], [12.38, [-1,0,0]]]) if (vis(Rn(nn))) for (let v = -7.6; v <= 7.7; v += 1.2) pl += pd([T(u, v, 10.8), T(u, v, 20)], false);
    put(tBox(12.4, -8.6, 10.2, 16.3, 8.6, 20.6), hp + `<path d="${pl}" fill="none" stroke="${HEPA_M.d}" stroke-width=".5"/>`); }
  // ---- power: cord, strain relief, terminal block, harness up the spine, switch board, motor and brush-motor feeds
  put(tBox(-7, 2, 8.8, -4.6, 5, 11), tbox(-7, 2, 8.8, -4.6, 5, 11, PLAST, .6) + (vis(Rn([0,0,1])) ? [-6.4, -5.8, -5.2].map(u => fill(pd(ellUV(u, 3.5, .3, .3, 8).map(([a, b]) => T(a, b, 11.02))), METAL.d)).join('') : ''));
  put(tBox(-7.5, 1.9, 12.8, -6.7, 4.1, 15.2), tbox(-7.5, 1.9, 12.8, -6.7, 4.1, 15.2, GEARM_V, .5));                       // strain-relief clamp
  parts.push(...routeParts([T(-9.3, 3, 14), T(-6.4, 3, 14), T(-6.4, 2.8, 11)], .75, CORD_M.m, { L: 3 }));                // cord in through the grommet
  const lane = (v, col) => routeParts([T(-5.2, v, 11), T(-5.2, v, 22), T(-5.6, v, 69.6), T(-1.5, v + 3, 69.6), T(14.6, v + 3, 69.6), T(15.6, v + 3, 68.6)], .42, col, { dots: true, L: 6 });
  parts.push(...lane(3.8, MAINS), ...lane(4.8, ON ? Hon : H));
  parts.push(...routeParts([T(-6.2, 2, 10.2), T(-6.2, -1, 10.8), T(-5.9, -2.7, 11.2)], .4, ON ? Hon : H, { dots: true, L: 3 }));
  parts.push(...routeParts([T(-4.6, 2.4, 9.4), T(-.9, 1.4, 9.4), T(-.9, -2.7, 11.2)], .4, ON ? Hon : H, { dots: true, L: 3 }));
  parts.push(...routeParts([T(-4.6, 3.4, 9.6), T(-3.5, 3.4, 6.5), T(0, 3.4, 0)], .4, ON ? Hon : H, { L: 3 }));
  parts.push(...routeParts([[VX, VY + 3.4, ZA], [VX + 5, VY + 3.4, 7.5], [VX + 13, VY + 4.5, bmz + 1.2], [bmx, VY + 6.5, bmz + 1.2]], .4, ON ? Hon : H, { L: 4, dots: true }));
  // switch board behind the panel: power switch, LEDs, chip, capacitor, standoffs
  { const full = ON && st.full, blink = Math.floor(st.clk*3) % 2 === 0;
    put(tBox(15.6, -9.4, 61.4, 16.3, 9.4, 69.6), tbox(15.6, -9.4, 61.4, 16.3, 9.4, 69.6, PCB, .7)
      + (vis(Rn([-1,0,0])) ? [[-8.6, 62.2], [8.6, 62.2], [-8.6, 68.8], [8.6, 68.8]].map(([v, w]) => fill(pd(ellUV(v, w, .35, .35, 8).map(([a, b]) => T(15.58, a, b))), METAL.l)).join('') : ''));
    put(tBox(16.3, 5.6, 64.5, 17.5, 7.6, 66.5), tbox(16.3, 5.6, 64.5, 17.5, 7.6, 66.5, ON ? LIT : PLAST, .5));
    for (const [i, v] of [1.8, 0, -1.8].entries()){ const lit = ON && (!st.full || i === 0); put(tBox(16.3, v - .5, 63.6, 17.3, v + .5, 64.6), tbox(16.3, v - .5, 63.6, 17.3, v + .5, 64.6, lit ? matOf(st.full ? AMBER : GREEN) : GEARM_V, .4)); }
    put(tBox(16.3, -7.1, 66.9, 17.3, -6.1, 67.9), tbox(16.3, -7.1, 66.9, 17.3, -6.1, 67.9, full && blink ? matOf(RED) : GEARM_V, .4));
    put(tBox(14.9, -5.6, 62.6, 15.6, -1.8, 65.6), tbox(14.9, -5.6, 62.6, 15.6, -1.8, 65.6, DARK, .5));
    put([T(13.6, -8.4, 66.2), T(15.6, -6.6, 68)].reduce((b, p) => b, vBoxOf([T(13.6, -8.4, 66.2), T(15.6, -6.6, 68)])), rod(T(15.6, -7.5, 67.1), T(13.8, -7.5, 67.1), .9, matOf('#3e6fb0'), toneI, .5));
    for (const v of [-8.6, 8.6]) put(vBoxOf([T(16.3, v - .4, 62.2), T(17.5, v + .4, 62.2)]), rod(T(16.3, v, 62.2), T(17.5, v, 62.2), .4, METAL, toneI, .4)); }
  return mSort(parts);
}
const GEARM_V = { l:'#7c8389', m:'#5c6369', d:'#3b4146' };
const XR_OPTS = { getSt: () => { try { return ui.st; } catch (e) { return {}; } }, B: [RX0 - 30, RX1 + 10, RY0 - 20, RY1 + 30, 0, 110],
  mech: (st, k) => vacMech(st, PALS[st.pal]),
  inside: st => { VX = st.xa; VY = st.yc; VT = st.th; const on = !!st.on;
    return [ { at: T(MOT.u, MOT.v - 3.6, 15), text:'MOTOR', on },
      { at: T(MOT.u + 4.4, MOT.v, 20.2), text:'IMPELLER', on },
      { at: T(16.3, -6, 18), text:'HEPA FILTER', on },
      { at: T(MOT.u, MOT.v - 2, 45), text:'CLEAN-AIR DUCT', on },
      { at: T(BIN_U, -5.6, 65), text:'PRE-MOTOR FILTER', on },
      ...(!st.emp || st.emp.t <= 0 ? [{ at: T(BIN_U + 3, 0, BIN_W0 + SHR_W + 3), text:'CYCLONE SHROUD', on }] : []),
      { at: T(16.3, -9, 68), text:'SWITCH BOARD', on },
      { at: [VX + 12, VY - 1.8, 5.4], text:'SUCTION DUCT', on },
      { at: [VX + 24, VY - 8, RUG_H + 6.8], text:'BRUSH ROLL', on },
      { at: [VX + 15, VY + 9.4, 7.7], text:'BRUSH MOTOR', on },
      { at: [VX + 19.5, VY + 12.9, RUG_H + 6.6], text:'BELT', on } ]; } };
const XR_CAPTION = st => st.emp
    ? 'Emptying: the bin lifts off with its shroud, and the dirt drops out of the bottom flap. The pre-motor filter stays in the top cap, so no dust reaches the motor.'
  : st.on && st.full
    ? 'Bin past MAX: the dirt reaches the shroud, air can no longer spin freely round the bin, and the pre-motor filter catches what the cyclone misses. The motor runs on, but suction at the brush roll falls.'
  : st.on
    ? 'On: the switch board sends current down the spine to the motor. Its impeller pulls air from the brush roll (spun by its own motor and belt) through the swivel duct and the hose into the bin, where it spins and flings the dirt out. Clean air goes in through the shroud, up through the pre-motor filter, down the spine duct to the fan and out through the HEPA filter.'
  : 'Inside: one motor at the bottom pulls air the whole way round: brush roll, suction duct through the pivot, hose, cyclone bin, pre-motor filter, the duct down the spine, the impeller, then the HEPA filter behind the vents. A small brush motor turns the roll by a belt.';

XR_OPTS.inline = true;
scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'19', turn:'full', title:'Upright vacuum', hint:'switch on, push it over the rug, empty the bin when it shows FULL',
  size:[116, 116, 80], palette:'tomato', state: st,
  scene,
  readout: st => st.emp ? 'emptying the bin' : st.full ? 'bin full — empty it' : st.on ? 'vacuuming' : 'off',
  stats: st => [ { label:'Bin', value: Math.round(Math.min(1, st.level)*100) + '%' }, { label:'Bits on the rug', value: onRug(st), small:true } ],
  buttonsLabel:'Vacuum',
  buttons:[
    { label:'Switch on / off', onClick: power },
    { label:'Push forward', onClick:(st,ui) => push(st, ui, XA_MAX) },
    { label:'Pull back', onClick:(st,ui) => push(st, ui, XA_MIN) },
    { label:'Move over a strip', onClick: moveOver },
    { label:'Empty the bin', onClick: emptyBin },
  ],
  acts:{ power:(st,el,ui) => power(st,ui), release:(st,el,ui) => emptyBin(st,ui) },
  params:(st,q) => {
    if (q.get('on') === '1'){ st.on = true; st.th = TILT; }
    if (q.has('x')) st.xa = st.tx = XA_MIN + (XA_MAX - XA_MIN)*clamp01(+q.get('x'));
    if (q.has('lane')){ st.lane = +q.get('lane') ? 1 : 0; st.yc = st.ty = LANES[st.lane]; }
    if (q.has('bin')){ st.level = clamp01(+q.get('bin')); st.full = st.level >= .999; st.fullNoted = st.full; }
    if (q.has('empty')){ st.on = false; st.th = 0; st.emp = { t: Math.max(.001, +q.get('empty'))*E.end, landed:false, lvl0: st.level, items:['#3e86d9','#f2c230'] }; }
  },
});
if (!Q.has('hold') && (st.on || st.emp)) wake();
xrMount(() => ui, XR_CAPTION);