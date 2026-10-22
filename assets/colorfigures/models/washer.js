/* ---------- geometry (x = depth, y = width, z = up) ---------- */
const W = 62, D = 65, H = 88, PL = 4, RCR = 7;         // depth, width, height, foot height, corner radius (RC is core's turning centre)
const OUT = rrUV(0, PL, D, H, RCR);                     // body profile in (y,z)
const CY = D/2, CZ = 39;                                // porthole centre on the front
const RO = 19, RB = 23.5, RG = 16.5, BT = 4.5;          // opening (drum) radius, bezel outer, glass radius, bezel thickness
const DRUM_D = 40;                                      // drum depth
const PANEL = [2, 68, D-2, H-2];                        // control strip
const DRW = [42, 72, 60, 83];                           // detergent drawer opening y0,z0,y1,z1
const DIAL = [34, 77, 5.2];                             // y, z, r
const DISP = [11.8, 73, 24.6, 81.5];
const BTN = [7, 77, 3.1];
const DOOR_MAX = 98 * Math.PI/180, DRAWER_MAX = 15;
const hy = CY - RB - 1, uc = RB + 1;                    // hinge line (screen-right edge of the door) and bezel centre in door coords

const STEEL = { l:'#8c9599', m:'#6a7377', d:'#454d51' };
const RUBBER = { l:'#5a5752', m:'#403d39', d:'#2a2825' };
const GREEN = '#43c25c', RED = '#e2483d', AMBER = '#f2b431';

/* ---------- helpers for the back and sides ---------- */
// text on the back plane (x = const, read from behind) and on the -y side
const txB = (x,y,z,str,size,col=INK,weight=700) => `<text transform="${txM(P(x,y,z), Dv(0,1,0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".04em">${str}</text>`;
const txR = (x,y,z,str,size,col=INK,weight=700) => `<text transform="${txM(P(x,y,z), Dv(-1,0,0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".04em">${str}</text>`;
// a soft hose / cable: smoothed 3D polyline drawn as ink + colour strokes (widths in model units, so not rescaled)
function smooth3(pts, it=3){
  for (let k=0;k<it;k++){ const o=[pts[0]];
    for (let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1];
      o.push(a.map((v,j)=>v*.75+b[j]*.25), a.map((v,j)=>v*.25+b[j]*.75)); }
    o.push(pts[pts.length-1]); pts=o; }
  return pts;
}
function tube(pts, r, m, rib=false){
  const q = smooth3(pts), d = pd(q, false), sw = w => `style="stroke-width:${f(w)}"`, cap = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const hl = 'M' + q.map(p => { const [X,Y] = P(...p); return f(X - r*.35)+' '+f(Y - r*.35); }).join('L');
  return `<path d="${d}" ${cap} stroke="${INK}" ${sw(2*r + 2.4*INK_K)}/>` + `<path d="${d}" ${cap} stroke="${m.m}" ${sw(2*r)}/>`
    + (rib ? `<path d="${d}" fill="none" stroke="${m.d}" ${sw(2*r)} stroke-dasharray=".45 1.1" opacity=".55"/>` : '')
    + `<path d="${hl}" ${cap} stroke="${m.l}" ${sw(r*.55)} opacity=".85"/>`;
}
// a round screw head on a plane, with a slot
const screw = (pl, u, v, r=1.1) => shape(on(pl, ellUV(u, v, r, r, 12)), METAL.m, .7) + ink(pd(on(pl, [[u-r*.7, v-r*.25],[u+r*.7, v+r*.25]]), false), .6);

/* ---------- programs (compressed: T seconds of real time) ---------- */
const PROGS = [
  { name:'COTTON', min:90, T:10, fill:1.4, wash:6.0, drain:7.0, ang:55 },
  { name:'QUICK',  min:30, T:7,  fill:1.0, wash:3.6, drain:4.4, ang:105 },
  { name:'SPIN',   min:12, T:4,  fill:0,   wash:0,   drain:0,   ang:155 },
];
const sstep = (a,b,t) => { const k = Math.min(1, Math.max(0, (t-a)/(b-a || 1e-9))); return k*k*(3-2*k); };
const phaseAt = (p,t) => t < p.fill ? 'fill' : t < p.wash ? 'wash' : t < p.drain ? 'drain' : 'spin';
function omegaAt(p,t){                                   // drum speed, rad/s (sign = direction)
  const ph = phaseAt(p,t);
  if (ph === 'fill') return 0.7;
  if (ph === 'wash') return 2.6 * (Math.sin((t - p.fill) * Math.PI / 1.5) >= 0 ? 1 : -1);
  if (ph === 'drain') return 1.2;
  return (1.5 + 19 * sstep(p.drain, p.drain + 1.2, t)) * (1 - sstep(p.T - .7, p.T, t));
}
function angleAt(p,t){ let a = 0; for (let s = 0; s < t; s += .01) a += omegaAt(p, s) * Math.min(.01, t - s); return a; }
function waterAt(p,t){ if (!p.fill) return 0; if (t < p.fill) return sstep(0, p.fill, t); if (t < p.wash) return 1; if (t < p.drain) return 1 - sstep(p.wash, p.drain, t); return 0; }

/* ---------- clothes: soft flat shapes floating just behind the glass ---------- */
function chaikin(pts, it=2){
  for (let k=0;k<it;k++){ const o=[]; for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length];
    o.push([a[0]*.75+b[0]*.25, a[1]*.75+b[1]*.25], [a[0]*.25+b[0]*.75, a[1]*.25+b[1]*.75]); } pts=o; }
  return pts;
}
const SHAPES = {
  shirt: { body: chaikin([[-6,1.6],[-3.4,4.6],[-1.3,4.6],[0,3.3],[1.3,4.6],[3.4,4.6],[6,1.6],[4.2,-.2],[3.6,.9],[3.6,-5],[-3.6,-5],[-3.6,.9],[-4.2,-.2]],2),
           lines: [[[-1.3,4.6],[0,3.3],[1.3,4.6]], [[-3.6,-3.6],[3.6,-3.6]]] },
  sock:  { body: chaikin([[-1.9,5],[1.9,5],[1.9,-1],[5.2,-1.5],[5.8,-3.4],[4.8,-5],[-1.3,-5],[-1.9,-3.6]],2),
           lines: [[[-1.9,3.4],[1.9,3.4]], [[3.6,-1.4],[3.4,-5]]] },
  towel: { body: chaikin([[-5.6,-3.8],[5.6,-3.8],[5.6,3.8],[-5.6,3.8]],1),
           band: [[-5.4,.6],[5.4,.6],[5.4,2],[-5.4,2]], lines: [[[-5.4,-2.6],[5.4,-2.6]]] },
};
// heap: rest angle (deg, in the y-z plane), radius from drum axis, depth behind the front, own tilt
const CLOTHES = [
  { k:'towel', col:'#3e86d9', d:6.5, heap:[-125, 11,    10] },
  { k:'shirt', col:'#e2473a', d:5.5, heap:[-160, 9,    -25] },
  { k:'sock',  col:'#f2c230', d:4.5, heap:[-82, 12,     75] },
  { k:'shirt', col:'#fbf7ea', d:3.8, heap:[-108, 9.5,   15] },
  { k:'sock',  col:'#38a565', d:3.2, heap:[-150, 4.5, -110] },
  { k:'towel', col:'#d94f86', d:2.6, heap:[-62, 8,     160] },
];
function cloth(c, cy, cz, psi, op=1){
  const sh = SHAPES[c.k], X = W - c.d, k = 1.3, cs = k*Math.cos(psi), sn = k*Math.sin(psi);
  const T = ([u,v]) => [X, cy + u*cs - v*sn, cz + u*sn + v*cs];
  const m = matOf(c.col);
  let s = fill(pd(sh.body.map(T)), m.l) ;
  if (sh.band) s += fill(pd(sh.band.map(T)), c.col === '#fbf7ea' ? '#3e86d9' : '#fbf7ea', 'opacity=".85"');
  for (const l of sh.lines) s += ink(pd(l.map(T), false), .7);
  s += ink(pd(sh.body.map(T)), 1);
  return op < 1 ? `<g opacity="${op}">${s}</g>` : s;
}

/* ---------- laundry: clothes fly between the drum and a basket on the floor ---------- */
const BASKET = { x0: W + 7, x1: W + 29, y0: 36, y1: 62, h: 11, r: 4 };
const SPOTS = [[W+13,43,20],[W+22,53,-35],[W+15,55,80],[W+23,43,140],[W+18,49,-100],[W+14,48,45]];   // x, y, turn (deg)
const FLY = .45, GAP = .3;                                  // seconds per item, stagger
const xferEnd = () => (CLOTHES.length - 1) * GAP + FLY;
// progress of item i in the current transfer (0 = not started, 1 = landed)
const itemP = (st, i) => st.xfer ? Math.min(1, Math.max(0, (st.xfer.T - i*GAP) / FLY)) : 1;
// where item i is: 'drum', 'basket', or a number 0..1 while flying out (towards the basket)
function whereIs(st, i){
  if (!st.xfer) return st.laundry === 'basket' ? 'basket' : 'drum';
  const p = itemP(st, i);
  if (st.xfer.dir === 'out') return p <= 0 ? 'drum' : p >= 1 ? 'basket' : p;
  return p <= 0 ? 'basket' : p >= 1 ? 'drum' : 1 - p;
}
function cloth3(c, ctr, e1, e2, psi, op=1){
  const sh = SHAPES[c.k], k = 1.3, cs = k*Math.cos(psi), sn = k*Math.sin(psi);
  const T = ([u,v]) => { const a = u*cs - v*sn, b = u*sn + v*cs; return [ctr[0]+a*e1[0]+b*e2[0], ctr[1]+a*e1[1]+b*e2[1], ctr[2]+a*e1[2]+b*e2[2]]; };
  const m = matOf(c.col);
  let s = fill(pd(sh.body.map(T)), m.l);
  if (sh.band) s += fill(pd(sh.band.map(T)), c.col === '#fbf7ea' ? '#3e86d9' : '#fbf7ea', 'opacity=".85"');
  for (const l of sh.lines) s += ink(pd(l.map(T), false), .7);
  s += ink(pd(sh.body.map(T)), 1);
  return op < 1 ? `<g opacity="${op}">${s}</g>` : s;
}
const drumPos = c => { const [h0, hr] = c.heap, a = h0*Math.PI/180; return [W - c.d, CY + hr*Math.cos(a), CZ + hr*Math.sin(a)]; };
const basketPos = i => { const [x,y,t] = SPOTS[i]; return [x, y, BASKET.h - 2.2 + i*.35, t*Math.PI/180]; };
// clothes in the air: one byDepth part each, so they sort against the door, basket and drawer in every view
function flying(st){
  const parts = [];
  CLOTHES.forEach((c, i) => {
    const w = whereIs(st, i); if (typeof w !== 'number') return;
    const a = drumPos(c), [bx,by,bz,bt] = basketPos(i), q = ease(w);
    const ctr = [a[0] + (bx-a[0])*q + 4*Math.sin(Math.PI*q), a[1] + (by-a[1])*q, a[2] + (bz-a[2])*q + 16*Math.sin(Math.PI*q)];
    const e2 = norm([q, 0, 1-q]);                           // stands up in the drum, lies flat in the basket
    parts.push({ at: ctr, svg: cloth3(c, ctr, [0,1,0], e2, c.heap[2]*Math.PI/180*(1-q) + bt*q + 2.2*Math.sin(Math.PI*q)) });
  });
  return parts;
}
const PL_M = { l:'#7cc4ea', m:'#5aa6d0', d:'#2f6d92' };
const bRing = (z, ins) => { const B = BASKET; return on(PZ(z), rrUV(B.x0+ins, B.y0+ins, B.x1-ins, B.y1-ins, B.r)); };   // PZ: u = x, v = y
const basketShadow = () => castShadow([...bRing(0, 1.5), ...bRing(BASKET.h, 0)]);
const basketAt = () => [(BASKET.x0 + BASKET.x1)/2, (BASKET.y0 + BASKET.y1)/2, BASKET.h/2];
function basket(st){
  const B = BASKET, ring = bRing;
  let s = '';
  const top = ring(B.h, 0), bot = ring(0, 1.5);
  s += loft(bot, top, n => toneI(n, PL_M));
  // slots in the walls that face the viewer
  let sl = '';
  if (facing([1,0,0]))  for (let y = B.y0 + 6; y <= B.y1 - 6; y += 4) sl += pd([[B.x1-.6, y, 3.5],[B.x1-.6, y, 7.5]], false);
  if (facing([-1,0,0])) for (let y = B.y0 + 6; y <= B.y1 - 6; y += 4) sl += pd([[B.x0+.6, y, 3.5],[B.x0+.6, y, 7.5]], false);
  if (facing([0,1,0]))  for (let x = B.x0 + 6; x <= B.x1 - 6; x += 4) sl += pd([[x, B.y1-.6, 3.5],[x, B.y1-.6, 7.5]], false);
  if (facing([0,-1,0])) for (let x = B.x0 + 6; x <= B.x1 - 6; x += 4) sl += pd([[x, B.y0+.6, 3.5],[x, B.y0+.6, 7.5]], false);
  s += `<path d="${sl}" fill="none" stroke="${PL_M.d}" stroke-width="1.6" stroke-linecap="round"/>`;
  s += hullInk([...bot, ...top], 1.4);
  // inside: floor + the clothes that have landed, lying flat
  let inside = fill(pd(top), PL_M.d) + fill(pd(ring(B.h - 3, 1)), mix(PL_M.d, '#000000', .2));
  CLOTHES.forEach((c, i) => { if (whereIs(st, i) !== 'basket') return; const [x,y,z,t] = basketPos(i); inside += cloth3(c, [x,y,z], [0,1,0], [1,0,0], t); });
  s += clipTo(top, inside);
  s += ink(pd(top), 1.4) + ink(pd(ring(B.h, 1.2)), .7);
  return s;
}
// detergent box: tips over the open drawer and pours powder into the main compartment
function soapBox(st){
  if (st.soapAnim == null) return '';
  const t = st.soapAnim, inn = Math.min(1, t/.2), out = t > .85 ? (t-.85)/.15 : 0;
  const tilt = (t < .2 ? 0 : t < .35 ? (t-.2)/.15 : t < .85 ? 1 : 1 - out) * 112 * Math.PI/180;
  const base = [W + DRAWER_MAX*.5, 59, 96 + 10*(1-ease(inn)) + 10*ease(out)], op = Math.min(inn, 1-out);
  const c = Math.cos(tilt), sn = Math.sin(tilt), wx = 6, wy = 9, h = 12;
  const X = ([x,y,z]) => [base[0] + x, base[1] + y*c - z*sn, base[2] + y*sn + z*c], R = ([x,y,z]) => [x, y*c - z*sn, y*sn + z*c];
  const BOX = matOf('#f08a2b');
  const F = [
    [[1,0,0],  [[wx/2,-wy/2,0],[wx/2,wy/2,0],[wx/2,wy/2,h],[wx/2,-wy/2,h]]],
    [[-1,0,0], [[-wx/2,-wy/2,0],[-wx/2,wy/2,0],[-wx/2,wy/2,h],[-wx/2,-wy/2,h]]],
    [[0,1,0],  [[-wx/2,wy/2,0],[wx/2,wy/2,0],[wx/2,wy/2,h],[-wx/2,wy/2,h]]],
    [[0,-1,0], [[-wx/2,-wy/2,0],[wx/2,-wy/2,0],[wx/2,-wy/2,h],[-wx/2,-wy/2,h]]],
    [[0,0,1],  [[-wx/2,-wy/2,h],[wx/2,-wy/2,h],[wx/2,wy/2,h],[-wx/2,wy/2,h]]],
    [[0,0,-1], [[-wx/2,-wy/2,0],[wx/2,-wy/2,0],[wx/2,wy/2,0],[-wx/2,wy/2,0]]] ];
  let s = '';
  for (const [n, q] of F){ const rn = R(n); if (!vis(rn)) continue;
    s += shape(q.map(X), n[2] === 1 ? '#fbf7ea' : toneI(rn, BOX), 1);
    if (n[0] === 1) s += fill(pd([[wx/2+.05,-wy/2,h*.45],[wx/2+.05,wy/2,h*.45],[wx/2+.05,wy/2,h*.7],[wx/2+.05,-wy/2,h*.7]].map(X)), '#fbf7ea'); }
  // powder stream from the open corner down into the drawer
  if (t > .33 && t < .87){
    const sp = X([0, -wy/2, h]), zb = DRW[3] - 1.2, ys = 51;
    s += `<path d="${pd([sp, [sp[0]-1, ys, zb]], false)}" fill="none" stroke="#6fa6e8" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1.6 1.3" stroke-dashoffset="${f(-t*60)}"/>`;
  }
  return `<g opacity="${f(op)}">${s}</g>`;
}

/* ---------- state helpers ---------- */
const prog = st => PROGS[st.prog];
const fmt = min => Math.floor(min/60) + ':' + String(Math.max(0, Math.round(min % 60))).padStart(2,'0');
const remaining = st => { const p = prog(st); return st.run ? Math.ceil(p.min * (1 - st.tau / p.T)) : p.min; };

/* ---------- the drum seen through the opening ---------- */
const ringX = (x, r, n=36) => on(PX(x), ellUV(CY, CZ, r, r, n));
// how much the inner drum wall at angle a (in the y-z plane) faces the viewer (>0 = visible); view 0: -(cos a + sin a)
const wallVis = (dy, dz) => { const r = rotV([0, -dy, -dz]); return r[0] + r[1] + r[2]; };
function drum(st){
  const p = prog(st), t = st.tau, run = st.run;
  const A = run ? angleAt(p, t) : st.restA, om = run ? omegaAt(p, t) : 0, fast = Math.abs(om) > 7;
  let s = fill(pd(ringX(W - DRUM_D, RO)), '#2b3134');
  s += ink(pd(ringX(W - DRUM_D + .1, 5)), .8);
  // inner wall, darker further back
  const secs = [[0,7,0],[7,16,.18],[16,DRUM_D,.36]];
  for (const [a,b,k] of secs){
    const dm = { l:mix(STEEL.l,'#000000',k), m:mix(STEEL.m,'#000000',k), d:mix(STEEL.d,'#000000',k) };
    s += loft(ringX(W - a, RO), ringX(W - b, RO), n => toneI(n, dm), true);
  }
  // perforations (or motion streaks when spinning fast) and the three lifters
  const dep = [2.5, 6, 9.5, 13, 16.5, 20, 24];
  if (fast){
    for (const d of dep){ const arc = ellUV(CY, CZ, RO-.05, RO-.05, 48).filter(([y,z]) => wallVis(y-CY, z-CZ) > 0).map(([y,z]) => [W-d,y,z]);
      s += `<path d="${pd(arc,false)}" fill="none" stroke="#1d2224" stroke-width=".9" stroke-dasharray="1 2.4" opacity=".7"/>`; }
  } else {
    let dots = '';
    for (const d of dep) for (let i = 0; i < 24; i++){
      const a = A + (i + (d*.37 % 1)) / 24 * 2*Math.PI, cy = Math.cos(a), sz = Math.sin(a);
      if (wallVis(cy, sz) < .15) continue;
      const q = (da, dx) => [W - d + dx, CY + (RO-.05)*Math.cos(a+da), CZ + (RO-.05)*Math.sin(a+da)];
      dots += pd([q(-.035,-.45), q(.035,-.45), q(.035,.45), q(-.035,.45)]);
    }
    s += `<path d="${dots}" fill="#20262a"/>`;
  }
  for (let k = 0; k < 3; k++){
    const a = A + k * 2*Math.PI/3 + .4;
    if (wallVis(Math.cos(a), Math.sin(a)) < -.2) continue;
    const q = (r, da, d) => [W - d, CY + r*Math.cos(a+da), CZ + r*Math.sin(a+da)];
    const op = fast ? ' opacity=".45"' : '';
    s += `<g${op}>` + shape([q(RO,-.2,1), q(RO,-.2,DRUM_D-4), q(RO-2.4,0,DRUM_D-4), q(RO-2.4,0,1)], '#9aa3a6', .7)
       + shape([q(RO,.2,1), q(RO,.2,DRUM_D-4), q(RO-2.4,0,DRUM_D-4), q(RO-2.4,0,1)], '#b8c0c2', .7) + `</g>`;
  }
  // clothes: tumble on a circle around the drum axis, pinned to the wall when spinning
  const spread = run ? sstep(0, .9, t) * (1 - sstep(p.T - .8, p.T, t)) : 0;
  const spinK = run ? sstep(p.drain, p.drain + 1, t) * (1 - sstep(p.T - .8, p.T, t)) : 0;
  const items = CLOTHES.map((c, i) => ({ c, i })).filter(o => whereIs(st, o.i) === 'drum').map(({ c, i }) => {
    const [h0, hr, ht] = c.heap, even = -Math.PI/2 + i * 2*Math.PI/CLOTHES.length;
    const base = h0*Math.PI/180 * (1-spread) + even * spread;
    const ang = base + A * spread;
    const r = hr * (1-spread) + (9.5 + 2.2*Math.sin(A*1.3 + i*1.7)) * spread * (1-spinK) + 14.3 * spinK * spread;
    const psi = ht*Math.PI/180 + A * spread * (1 + .25*Math.sin(i));
    return { c, ang, r, psi };
  }).sort((a,b) => b.c.d - a.c.d);
  for (const o of items){
    if (fast) for (let g = 3; g >= 1; g--){ const ga = o.ang - Math.sign(om) * g * .26;
      s += cloth(o.c, CY + o.r*Math.cos(ga), CZ + o.r*Math.sin(ga), o.psi - Math.sign(om)*g*.26, .34 - g*.08); }
    s += cloth(o.c, CY + o.r*Math.cos(o.ang), CZ + o.r*Math.sin(o.ang), o.psi);
  }
  // water: translucent fill with a wavy top and a little foam
  const lv = run ? waterAt(p, t) : 0;
  if (lv > .01){
    const zl = CZ - RO - 1 + lv * 17, xw = W - 2, top = [];
    for (let y = CY + RO + 2; y >= CY - RO - 2; y -= 1)
      top.push([xw, y, zl + 1.1*Math.sin(y*.55 + t*7) + .6*Math.sin(y*.21 - t*4) + .07*(y-CY)*Math.sign(om)]);
    const poly = [...top, [xw, CY-RO-2, CZ-RO-3], [xw, CY+RO+2, CZ-RO-3]];
    s += fill(pd(poly), '#4f9fdc', 'opacity=".42"');
    s += `<path d="${pd(top,false)}" fill="none" stroke="#d7f0ff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`;
    if (phaseAt(p,t) === 'wash') for (let i = 0; i < 9; i++){
      const y = CY - 13 + i*3.3 + Math.sin(t*3 + i)*1.2, z = zl + 1.1*Math.sin(y*.55 + t*7) + .3;
      s += fill(pd(on(PX(xw - .2), ellUV(y, z, 1 + (i%3)*.35, .8 + (i%2)*.3, 10))), '#ffffff', 'opacity=".85"');
    }
  }
  // gasket: rubber lip around the mouth of the drum
  s += loft(ringX(W, RO - 2.2), ringX(W - 3, RO - 2.2), n => toneI(n, RUBBER), true);
  s += fill(pd(ringX(W, RO)) + pd(ringX(W, RO - 2.2)), RUBBER.m, 'fill-rule="evenodd"') + ink(pd(ringX(W, RO - 2.2)), .9);
  return s;
}

/* ---------- the porthole door: bezel ring + glass, turning about a vertical hinge at its right edge ---------- */
const dP = (a,u,v,th) => [W + a*Math.cos(th) + u*Math.sin(th), hy - a*Math.sin(th) + u*Math.cos(th), v];
const dRing = (a, r, th, n=40) => ellUV(uc, CZ, r, r, n).map(([u,v]) => dP(a,u,v,th));
function dBox(a0,a1,u0,u1,v0,v1,m,th,w=1){
  const c = (a,u,v) => dP(a,u,v,th), nA = [Math.cos(th), -Math.sin(th), 0], nU = [Math.sin(th), Math.cos(th), 0];
  const F = [
    [nA, [c(a1,u0,v0),c(a1,u1,v0),c(a1,u1,v1),c(a1,u0,v1)]], [nA.map(x=>-x), [c(a0,u0,v0),c(a0,u1,v0),c(a0,u1,v1),c(a0,u0,v1)]],
    [nU, [c(a0,u1,v0),c(a1,u1,v0),c(a1,u1,v1),c(a0,u1,v1)]], [nU.map(x=>-x), [c(a0,u0,v0),c(a1,u0,v0),c(a1,u0,v1),c(a0,u0,v1)]],
    [[0,0,1], [c(a0,u0,v1),c(a1,u0,v1),c(a1,u1,v1),c(a0,u1,v1)]] ];
  return F.filter(([n]) => vis(n)).map(([n,q]) => shape(q, toneI(n,m), w)).join('');
}
const BEZEL = { l:'#f4f5f3', m:'#c9cfd0', d:'#8f989b' };
function door(st){
  const th = ease(st.door) * DOOR_MAX, nF = [Math.cos(th), -Math.sin(th), 0];
  let s = '';
  // hinge arms (behind the ring on the hinge side)
  for (const z of [CZ+9, CZ-13]) s += dBox(.5, 3.4, -1, 3, z, z+4, METAL, th, .9);
  s += loft(dRing(0, RB, th), dRing(BT, RB, th), n => toneI(n, BEZEL));
  if (vis(nF)){
    s += loft(dRing(1.5, RG, th), dRing(BT, RG, th), n => toneI(n, { l:'#d9dedf', m:'#aab2b4', d:'#7d8689' }), true);
    // glass: tint + streaks (contents were drawn earlier)
    const gl = dRing(1.5, RG, th);
    s += fill(pd(gl), '#cfe9f0', `opacity="${st.door > 0 ? .5 : .2}"`);
    const st1 = [[-9,-15],[-3,-15],[13,13],[7,13]].map(([u,v]) => dP(1.5, uc+u, CZ+v, th));
    const st2 = [[-0,-15],[2.5,-15],[18.5,13],[16,13]].map(([u,v]) => dP(1.5, uc+u, CZ+v, th));
    s += clipTo(gl, fill(pd(st1),'#ffffff','opacity=".36"') + fill(pd(st2),'#ffffff','opacity=".36"'));
    // front face of the ring
    const fo = dRing(BT, RB, th), fi = dRing(BT, RG, th);
    s += `<path d="${pd(fo)}${pd(fi)}" fill="${toneI(nF, BEZEL)}" fill-rule="evenodd"/>`;
    s += ink(pd(dRing(BT+.05, RG + 3.2, th)), .7) + ink(pd(fi), 1.5) + ink(pd(fo), 1.8);
    // handle on the opening edge (screen left)
    s += dBox(BT-1, BT+2, 2*RB - 2, 2*RB + 3, CZ - 6.5, CZ + 6.5, BEZEL, th, 1.1);
    s += dBox(BT+2, BT+2.6, 2*RB, 2*RB + 2.5, CZ - 5, CZ + 5, matOf('#9aa3a6'), th, .8);
  } else {
    // inside of the door: back face of the ring and the glass bowl that pushes into the drum
    const bo = dRing(0, RB, th), bi = dRing(0, RG, th);
    s += `<path d="${pd(bo)}${pd(bi)}" fill="${toneI(nF.map(x=>-x), BEZEL)}" fill-rule="evenodd"/>` + ink(pd(bo), 1.8);
    s += fill(pd(bi), '#cfe9f0', 'opacity=".35"');
    const b0 = dRing(0, RG, th), b1 = dRing(-4, RG - 3.5, th), b2 = dRing(-6, RG - 8, th);
    s += `<g opacity=".72">` + loft(b0, b1, n => toneI(n, CLEAR)) + loft(b1, b2, n => toneI(n, CLEAR)) + fill(pd(b2), CLEAR.l) + `</g>`;
    s += ink(pd(b2), .9) + hullInk([...b0, ...b1, ...b2], 1.2);
    const gl = [[-4,-9],[-1.5,-9],[6,6],[3.5,6]].map(([u,v]) => dP(-5.2, uc+u, CZ+v, th));
    s += fill(pd(gl), '#ffffff', 'opacity=".45"');
  }
  return act('door', s);
}

/* ---------- detergent drawer ---------- */
function drawer(st){
  const s0 = ease(st.drawer) * DRAWER_MAX, xf = W + s0;
  const [y0,z0,y1,z1] = DRW;
  let s = '';
  if (s0 > .2){
    // tray body (only the part outside the machine can be seen)
    const by0 = y0 + .6, by1 = y1 - .6, bz0 = z0 + .6, bz1 = z1 - 1.2;
    const sw = facing([0,1,0]) ? by1 : by0;
    s += shape([[W,sw,bz0],[xf,sw,bz0],[xf,sw,bz1],[W,sw,bz1]], '#d6dadb', 1);   // side wall toward the viewer
    s += shape([[W,by0,bz1],[xf,by0,bz1],[xf,by1,bz1],[W,by1,bz1]], '#eef0f0', 1);   // rim
    // compartments: prewash | main (powder) | softener
    const comp = [[by0+.8, by0+5.2, '#3a3e40'], [by0+6, by1-5.4, '#3a3e40'], [by1-4.6, by1-.8, '#3a3e40']];
    const xa = W + .2, xb = xf - .9;
    if (xb > xa) comp.forEach(([a,b,c], i) => {
      s += shape([[xa,a,bz1],[xb,a,bz1],[xb,b,bz1],[xa,b,bz1]], c, .7);
      if (i === 1 && st.soapLvl > .02) s += fill(pd([[xa,a+.6,bz1+.05],[xb-.6,a+.6,bz1+.05],[xb-.6,b-.6,bz1+.05],[xa,b-.6,bz1+.05]]), '#dfe9f7', `opacity="${f(Math.min(1, st.soapLvl*1.4))}"`) +
        `<path d="${[0,1,2,3,4,5].slice(0, Math.ceil(st.soapLvl*6)).map(k => pd(on(PZ(bz1+.1), ellUV(xa + (xb-xa)*(.2+.13*k), a+1.5+(k%3)*1.6, .35, .35, 6)))).join('')}" fill="#6fa6e8"/>`;
      if (i === 2) s += fill(pd([[xa,a+.5,bz1+.05],[xb-.5,a+.5,bz1+.05],[xb-.5,b-.5,bz1+.05],[xa,b-.5,bz1+.05]]), '#c99de8', 'opacity=".9"');
    });
  }
  // front plate
  const m = { l:'#f7f6f1', m:'#dcdad0', d:'#a8a597' };
  s += box(xf, y0+.2, z0+.2, xf + 1.4, y1-.2, z1-.2, m, toneI, 1.2);
  s += shape(on(PX(xf + 1.45), rrUV(y0 + 4, z0 + 1.6, y1 - 4, z0 + 3.4, .9)), '#3a3e40', .8);   // finger pull
  s += tx(xf + 1.5, (y0+y1)/2, z0 + 6.1, 'I  II  S', 2.6, '#6a6658', 700);
  return act('drawer', s);
}

/* ---------- control panel pieces ---------- */
function dial(st){
  const [y,z,r] = DIAL, F = W + .25;
  let s = cylX(F, F + 2.6, y, z, r, BEZEL, toneI, 1.2, 28);
  // ribbed edge marks
  // grip bar, pointing at the selected program
  const a = PROGS[st.prog].ang * Math.PI/180, ca = Math.cos(a), sa = Math.sin(a);
  const bar = [[-1.1,-4.3],[1.1,-4.3],[1.1,4.3],[-1.1,4.3]].map(([u,v]) => [y + u*sa + v*ca, z - u*ca + v*sa]);
  const B0 = on(PX(F + 2.6), bar), B1 = on(PX(F + 4.4), bar);
  s += loft(B0, B1, n => toneI(n, BEZEL)) + fill(pd(B1), BEZEL.l) + hullInk([...B0, ...B1], 1) + ink(pd(B1), .8);
  s += fill(pd(on(PX(F + 4.45), ellUV(y + 3.2*ca, z + 3.2*sa, .7, .7, 10))), RED);
  // program ticks + letters
  let t = '';
  PROGS.forEach((p, i) => {
    const pa = p.ang * Math.PI/180, sel = i === st.prog;
    t += fill(pd(on(PX(W + .3), ellUV(y + 6*Math.cos(pa), z + 6*Math.sin(pa), .7, .7, 10))), sel ? GREEN : '#b5b2a6');
    t += tx(W + .3, y + 8*Math.cos(pa), z + 8*Math.sin(pa) - .9, p.name[0], 2.6, sel ? INK : '#6a6658', 800);
  });
  return t + act('dial', s);
}
function display(st){
  const [y0,z0,y1,z1] = DISP, cy = (y0+y1)/2, p = prog(st);
  let s = shape(on(PX(W + .3), rrUV(y0, z0, y1, z1, 1.6)), '#1d2a26', 1.2);
  let l1, l2;
  if (st.done && !st.run){ l1 = 'DING!'; l2 = 'DONE'; }
  else if (st.run){ const ph = phaseAt(p, st.tau); l1 = st.paused ? 'PAUSE' : { fill:'FILL', wash:'WASH', drain:'RINSE', spin:'SPIN' }[ph]; l2 = fmt(remaining(st)); }
  else { l1 = p.name; l2 = fmt(p.min); }
  s += tx(W + .4, cy, z0 + 5.6, l1, 2.5, '#8af0ae', 700);
  s += tx(W + .4, cy, z0 + 1.7, l2, 3.6, '#8af0ae', 800);
  return s;
}
function startBtn(st){
  const [y,z,r] = BTN, lit = st.run ? (st.paused ? AMBER : GREEN) : st.done ? GREEN : '#b5b2a6';
  let s = fill(pd(on(PX(W + .25), ellUV(y, z, r + 1, r + 1, 24))), lit) + ink(pd(on(PX(W + .25), ellUV(y, z, r + 1, r + 1, 24))), .9);
  s += cylX(W + .3, W + 2.4, y, z, r, BEZEL, toneI, 1.1, 24);
  const tri = [[y + 1, z - 1.4], [y + 1, z + 1.4], [y - 1.4, z]];
  s += fill(pd(on(PX(W + 2.45), tri)), INK);
  return act('start', s) + tx(W + .3, y, PANEL[1] + 1.4, 'START', 1.9, '#6a6658', 800);
}

/* ---------- the back (x = 0) and the right side (y = 0): only seen once the machine is turned ---------- */
const BK = PX(-.15);                                       // plane just proud of the back panel
const CORD = [[-1.6,12,82],[-3.6,12.4,79.5],[-5,13,71],[-5.8,13.6,44],[-6.2,14.2,16],[-6.8,15.2,3.4],[-7.6,17.6,1],[-8.6,20,1.2],[-9.5,20.5,1.7]];
const INLET = [[-4.6,44,81],[-7.6,44.4,79],[-10,45,72],[-11.6,45.6,50],[-12.4,46,22],[-12.8,45.4,6],[-14,44.2,1.6],[-16.5,42.6,1.3]];
const DRAIN_UP = [[-2.6,24,13],[-2.9,24,30],[-2.9,24,52],[-3,24.2,66]];
const DRAIN_DN = [[-3,24.2,66],[-3.4,24.5,70.5],[-6.6,25.2,72],[-9.4,25.8,67],[-12.6,26.4,52],[-15.6,26.8,30],[-17.6,27.2,12],[-19.4,27.6,3],[-22,28,1.4],[-25,28.4,1.4]];
const HOSE_M = matOf('#a9b0b2'), CORD_M = { l:'#5b5650', m:'#2f2c29', d:'#1b1917' }, INLET_M = { l:'#ffffff', m:'#e8ecec', d:'#b9c0c1' };
const TAP_B = matOf('#3e86d9'), TAP_R = matOf('#e2483d'), CAPS = matOf('#dedbd0');
function backFace(m){
  const tb = tone([-1,0,0], m), dk = mix(tb, '#000000', .06);
  let s = '';
  // service panel with vent slots and four screws
  s += shape(on(BK, rrUV(32, 24, 58, 64, 3)), dk, 1.2);
  for (const z of [55.5, 52, 48.5, 45]) s += shape(on(PX(-.2), rrUV(37, z, 53, z + 1.6, .8)), mix(tb, '#000000', .45), .7);
  for (const [u,v] of [[35,27],[55,27],[35,61],[55,61]]) s += screw(PX(-.2), u, v);
  // a row of screws holding the lid
  for (const u of [22, 36, 58]) s += screw(PX(-.2), u, 85.3, 1);
  // model / rating plate with a barcode
  s += shape(on(PX(-.2), rectUV(36, 7.5, 58, 19)), '#fbf7ea', .9);
  s += txB(-.3, 47, 15.8, 'WASHMATIC 9', 2, INK, 800);
  s += txB(-.3, 47, 13, 'WM9-4 · 230V~ 50Hz', 1.25, '#6a6658', 700);
  let bc = ''; for (let i = 0; i < 18; i++){ const u = 39 + i*.9; if (i % 3 !== 1) bc += pd([[-.25, u, 8.8],[-.25, u, 11.2]], false); }
  s += `<path d="${bc}" fill="none" stroke="${INK}" stroke-width=".7"/>`;
  // labels by the water inlets and the drain
  s += txB(-.3, 48, 76, 'IN', 1.8, mix(tb, '#000000', .6), 800);
  s += txB(-.3, 24, 8.5, 'OUT', 1.8, mix(tb, '#000000', .6), 800);
  return s;
}
// everything that sticks out of the back, in a fixed order that is correct for both views that see the back (1, 2)
function backBits(){
  let s = '';
  // transit-bolt caps
  for (const [y,z] of [[17,40],[61,44],[40,70]]) s += cylX(-1.2, 0, y, z, 2.6, CAPS, toneI, .9, 18) + ink(pd(on(PX(-1.25), [[y-1.3, z],[y+1.3, z]]), false), .7);
  // power-cord grommet, drain spigot, hot inlet (capped red), cold inlet (blue nut, hose on)
  s += cylX(-1.6, 0, 12, 82, 1.9, RUBBER, toneI, .9, 18);
  s += cylX(-2.6, 0, 24, 13, 2.5, HOSE_M, toneI, 1, 18);
  s += cylX(-2.4, 0, 52, 81, 1.4, METAL, toneI, .8, 18) + cylX(-4.6, -2.4, 52, 81, 2.2, TAP_R, toneI, 1, 18);
  s += cylX(-2.4, 0, 44, 81, 1.4, METAL, toneI, .8, 18) + cylX(-4.6, -2.4, 44, 81, 2.3, TAP_B, toneI, 1, 18);
  // the hoses and the cord hang out from the back at different depths, so they are sorted for the current view
  const mid = pts => avg(pts);
  const plug = box(-14, 18, 0, -9.5, 23, 3.4, CORD_M, toneI, 1) + [19.5, 21.5].map(y =>
      `<path d="${pd([[-14, y, 1.7],[-16.6, y, 1.7]], false)}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`
    + `<path d="${pd([[-14, y, 1.7],[-16.6, y, 1.7]], false)}" fill="none" stroke="${METAL.m}" style="stroke-width:.5" stroke-linecap="round"/>`).join('');
  s += byDepth([
    { at: mid(CORD), svg: tube(CORD, .75, CORD_M) },
    { at: [-11.75, 20.5, 1.7], svg: plug },
    { at: mid(INLET), svg: tube(INLET, 1.3, INLET_M) + cylX(-19.6, -16.5, 42.4, 1.6, 1.6, TAP_B, toneI, .9, 18) },
    { at: mid(DRAIN_UP), svg: tube(DRAIN_UP, 1.8, HOSE_M, true) + box(-5.2, 21.6, 58, -1.8, 26.4, 61.5, METAL, toneI, .9) },
    { at: mid(DRAIN_DN), svg: tube(DRAIN_DN, 1.8, HOSE_M, true) },
  ]);
  return s;
}
function sideRight(m){                                     // the -y side
  const sm = tone([0,-1,0], m), pl = PY(-.2), tc = mix(sm, m.d, .3);   // on a sunlit face the face colour vanishes on the decal
  let s = '';
  // big round decal with bubbles
  s += shape(on(pl, rrUV(12, 36, W - 12, 64, 6)), mix(sm, '#ffffff', .12), 1.2);
  for (const [u,v,r] of [[W-20, 56, 3.4],[W-27, 59.5, 2],[W-25, 52.5, 1.4]]) s += shape(on(PY(-.25), ellUV(u, v, r, r, 16)), tc, .9);
  s += txR(W/2 - 3, -.3, 47, 'WASHMATIC', 4.6, tc, 800);
  s += txR(W/2 - 3, -.3, 41, 'QUIET DRIVE', 2.6, tc, 800);
  // vent grille near the back, low down
  for (let k = 0; k < 6; k++){ const u = 7 + k*2.6; s += shape(on(PY(-.25), rrUV(u, 10, u + 1.2, 22, .6)), mix(sm, '#000000', .45), .7); }
  // warning sticker
  s += shape(on(PY(-.25), [[W-17, 12],[W-9, 12],[W-13, 19]]), '#f2c230', .9);
  s += txR(W - 13, -.3, 12.8, '!', 4, INK, 900);
  return s;
}

/* ---------- scene ---------- */
function scene(st, m){
  const p = prog(st);
  const FRONT = facing([1,0,0]), BACK = facing([-1,0,0]), LEFT = facing([0,1,0]), RIGHT = facing([0,-1,0]);
  const showBasket = st.door > .02 || st.laundry === 'basket' || st.xfer;
  let s = castShadow([...on(PX(0), OUT), ...on(PX(W), OUT)]);
  if (st.door > .02){ const th = ease(st.door) * DOOR_MAX; s += castShadow(dRing(0, RB, th, 24).concat(dRing(BT, RB, th, 24))); }
  if (showBasket) s += basketShadow();

  // spin shake: offset everything but the shadow
  const om = st.run ? omegaAt(p, st.tau) : 0, shake = Math.max(0, (Math.abs(om) - 8) / 12);
  const jx = shake * (.55*Math.sin(st.tau*97) + .3*Math.sin(st.tau*151)), jy = shake * (.45*Math.sin(st.tau*123 + 1));
  OX += jx; OY += jy;
  try {
    // feet
    s += byDepth([[5,D-5],[5,5],[W-5,D-5],[W-5,5]].map(([x,y]) => ({ at:[x,y,0], svg: cyl(x, y, 0, PL + .5, 2.6, RUBBER, toneI, 1, 16) })));

    // ---- the body ----
    let body = '';
    const X = PX(W);
    if (FRONT){
      // drum through the opening
      const inner = drum(st);
      body += clipTo(ringX(W, RO), st.door > .02 ? act('door', fill(pd(ringX(W, RO)), 'transparent') + inner) : inner);
      // drawer cavity
      const dr = rectUV(DRW[0], DRW[1], DRW[2], DRW[3]);
      body += fill(pd(on(PX(W), dr)), '#1f1d1a');
      // front face with its holes, then the control strip
      body += `<path d="${pd(on(X, OUT))}${pd(ringX(W, RO))}${pd(on(X, dr))}" fill="${tone([1,0,0], m)}" fill-rule="evenodd"/>`;
      body += ink(pd(ringX(W, RO)), 1.6);
      const pnl = on(PX(W + .15), rrUV(...PANEL, 4));
      body += `<path d="${pd(pnl)}${pd(on(PX(W + .15), dr))}" fill="${mix(tone([1,0,0], m), '#ffffff', .62)}" fill-rule="evenodd"/>`;
      body += ink(pd(pnl), 1.3) + ink(pd(on(PX(W + .15), dr)), 1.6);
      // service hatch + badge on the kick panel
      body += shape(on(PX(W + .15), rrUV(4.5, 7, 14.5, 12.5, 1.5)), mix(tone([1,0,0], m), '#000000', .06), 1);
      body += ink(pd(on(PX(W + .2), [[8,9.75],[11,9.75]]), false), 1);
      body += tx(W + .3, 46, 8.6, 'WASHMATIC 9', 2.6, tone([1,0,0], m) === m.d ? m.l : m.d, 800);
    }
    if (BACK) body += fill(pd(on(PX(0), OUT)), tone([-1,0,0], m)) + backFace(m);

    // outer body + side details
    body += extrude(OUT, 0, W, m);
    if (LEFT){
      const sm = tone([0,1,0], m);
      body += shape(on(PY(D + .2), rrUV(12, 30, W - 12, 62, 6)), mix(sm, '#ffffff', .12), 1.2);
      const tc = mix(sm, m.d, .3);
      body += txY(W/2, D + .3, 49, 'WASH', 10, tc, 800);
      body += txY(W/2, D + .3, 40, '4 KG · 40°', 4, tc, 800);
      let v = ''; for (const z of [12, 16, 20]) v += pd([[14, D + .2, z], [W - 14, D + .2, z]], false);
      body += `<path d="${v}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
    }
    if (RIGHT) body += sideRight(m);
    // top: a little care-label sticker
    const tp = PZ(H + .1);
    body += shape(on(tp, rrUV(16, 18, 34, 44, 2)), '#fbf7ea', 1);
    for (const k of [0,1,2,3]) body += ink(pd(on(tp, [[29 - k*3.6, 22], [29 - k*3.6, k === 0 ? 40 : 35]]), false), k === 0 ? 1.1 : .7);

    // silhouette + the outline of whichever end panel faces us
    if (FRONT) body += ink(pd(on(X, OUT)), 2.2);
    if (BACK) body += ink(pd(on(PX(0), OUT)), 2.2);
    body += hullInk([...on(PX(0), OUT), ...on(PX(W), OUT)], 2.8);

    // ---- things in front of the front face ----
    let mounted = display(st) + dial(st) + startBtn(st);
    // little indicator icons above the porthole
    mounted += tx(W + .3, CY, PANEL[1] - 3.2, st.run ? 'LOCKED' : 'UNLOCKED', 1.9, st.run ? RED : '#6a6658', 800);
    for (const z of [CZ + 9, CZ - 13]) mounted += cyl(W + 1.6, hy + 1, z - .5, z + 4.5, 1.3, METAL, toneI, .9, 14);
    const th = ease(st.door) * DOOR_MAX, s0 = ease(st.drawer) * DRAWER_MAX;
    const parts = [
      { at: dP(BT/2, uc, CZ, th), svg: door(st) },
      showBasket && { at: basketAt(), svg: basket(st) },
      { at: [W + s0 + .7, (DRW[0]+DRW[2])/2, (DRW[1]+DRW[3])/2], svg: drawer(st) },   // pulled out, it sits in front of the door's top rim
      st.soapAnim != null && { at: [W + DRAWER_MAX*.5, 59, 100], svg: soapBox(st) },
      ...flying(st) ];
    const frontStuff = FRONT ? mounted + byDepth(parts) : byDepth(parts) + mounted;

    // whatever is on a face turned away goes BEFORE the body (it hides it; bits sticking out past the edge still show)
    // inside view: the far walls faintly, the working parts, then the cabinet as a ghost over them
    const k = ease(st.xr || 0);
    if (k > 0){
      const far = `<g opacity="${f(.5*k)}">` + loft(on(PX(0), OUT), on(PX(W), OUT), n => mix(toneI(n.map(v => -v), m), '#f2efe7', .55), true)
        + (FRONT ? fill(pd(on(PX(0), OUT)), mix(m.d, '#f2efe7', .5)) : '') + (BACK ? fill(pd(on(PX(W), OUT)), mix(m.d, '#f2efe7', .5)) : '') + `</g>`;
      body = far + `<g opacity="${f(1 - .8*k)}">${body}</g>` + `<g opacity="${f(.6*k)}">` + hullInk([...on(PX(0), OUT), ...on(PX(W), OUT)], 2.8) + `</g>` + `<g opacity="${f(k)}">${mechanism(st, m, k)}</g>`;   // inside parts over the ghost; the door, dial and display come after
    }
    if (FRONT) s += backBits() + body + frontStuff;
    else       s += frontStuff + body + backBits();
    if (k > .6) s += MECH_LABELS;
    else s += callouts(surfaceLabels(st, FRONT, BACK));
  } finally { OX -= jx; OY -= jy; }
  return s;
}

/* ---------- inside view: the working parts, behind a see-through cabinet ----------
   Everything here is real washer anatomy, sized to this cabinet, and driven by the same program clock as the drum.
   The tub hangs from two springs and stands on two dampers; the drum turns inside it on a shaft driven by a belt
   from the motor; the heater sits in the sump under the drum; the pump empties the sump out of the back. */
const XT0 = 15, XT1 = W - 3, RT = 22.5;                 // tub: back, front, radius
const XD0 = W - 2 - 38, XD1 = W - 2;                   // drum
const XPU = 10, RPU = 17;                               // big pulley plane and radius
const MOT = { x0: 13, x1: 31, y: CY + 6, z: 10.5, r: 4.6, rp: 2.3 };
const PUMP = { x0: 44, x1: 56, y: 10.5, z: 9, r: 4 };
const TUBM = { l:'#eef0ee', m:'#cdd3d2', d:'#9aa4a4' }, ALU = { l:'#e6e9ea', m:'#b9c0c3', d:'#7f888c' };
const MOTM = { l:'#7d8a96', m:'#5e6b77', d:'#3c4650' }, CONC = { l:'#d6d2c8', m:'#b5b0a4', d:'#8a857a' };
const VALVE = { l:'#f2efe6', m:'#d6d1c3', d:'#a29c8b' }, COPPER = { l:'#e6a46d', m:'#c47c45', d:'#8a4e24' };
const WATER = '#4f9fdc';
const ringT = (x, r, n=40) => on(PX(x), ellUV(CY, CZ, r, r, n));
const tubZ = dy => CZ - Math.sqrt(RT*RT - dy*dy);     // tub underside at y = CY + dy
const tubTop = dy => CZ + Math.sqrt(RT*RT - dy*dy);
const SPR = [-1, 1].map(s => ({ a: [34, CY + s*13, tubTop(13)], b: [34, CY + s*26, H - 3] }));      // springs: tub → cabinet top
const DMP = [-1, 1].map(s => ({ a: [36, CY + s*12, PL], b: [36, CY + s*12, tubZ(12)] }));           // dampers: floor → tub

const add3 = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v)*t);
function coil(a, b, r, turns, w=1){
  const d = norm(sub(b, a)), u = norm(cross(d, [1,0,0])), v = cross(d, u), pts = [], n = turns*14;
  for (let i = 0; i <= n; i++){ const t = i/n, g = t*turns*2*Math.PI, c = Math.cos(g)*r, s = Math.sin(g)*r;
    pts.push([a[0]+(b[0]-a[0])*t + u[0]*c + v[0]*s, a[1]+(b[1]-a[1])*t + u[1]*c + v[1]*s, a[2]+(b[2]-a[2])*t + u[2]*c + v[2]*s]); }
  const dd = pd(pts, false);
  return `<path d="${dd}" fill="none" stroke="${INK}" stroke-width="${2.2*w}" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="${METAL.m}" style="stroke-width:.55" stroke-linecap="round"/>`;
}
// water moving through a hose: blue dashes running along it
const flow = (pts, t, on, rev=false) => !on ? '' :
  `<path d="${pd(smooth3(pts), false)}" fill="none" stroke="${WATER}" style="stroke-width:1.1" stroke-dasharray="2.2 2.6" stroke-dashoffset="${f((rev ? 1 : -1) * t * 22)}" stroke-linecap="round"/>`;
// the far half of the tub (seen through its near half), its contents, then the near half
function tubPart(st, k, sway, A, lv, heat){
  const op = (o, s) => `<g opacity="${o}">${s}</g>`, back = vis([-1,0,0]), front = vis([1,0,0]);
  const A0 = ringT(XT0, RT), A1 = ringT(XT1, RT);
  let s = '';
  // far wall + the end cap we see from inside
  s += op(.55, loft(A0, A1, n => toneI(n, TUBM), true) + (!back ? fill(pd(A0), TUBM.d) : '') + (!front ? fill(pd(A1), TUBM.d) : ''));
  // the water: a slice of the tub's circle, below the level line
  if (lv > .01){
    const zl = CZ - RT + .6 + lv*19, a0 = Math.asin(Math.max(-1, Math.min(1, (zl - CZ)/(RT - .4))));
    const prof = arcUV(CY, CZ, RT - .4, 180 - a0*180/Math.PI, 360 + a0*180/Math.PI, 24);
    s += op(.5, extrude(prof, XT0 + .4, XT1 - .4, { l:'#9fd0f2', m:'#6fb2e6', d:'#3f86c4' }, toneI));
  }
  // heater: a U-shaped element in the sump under the drum, glowing while it heats
  const hm = heat > 0 ? { l: mix(COPPER.l, '#ff7a2a', heat), m: mix(COPPER.m, '#ff5a1a', heat), d: mix(COPPER.d, '#c2300a', heat) } : COPPER;
  const hz = tubZ(0) + 2.1;
  s += rod([XT0 + .4, CY - 3, hz], [XT1 - 9, CY - 3, hz], .75, hm) + rod([XT1 - 9, CY + 3, hz], [XT0 + .4, CY + 3, hz], .75, hm)
     + rod([XT1 - 9, CY - 3, hz], [XT1 - 9, CY + 3, hz], .75, hm) + rod([XT0 + .4, CY, hz + 1], [XT0 + 7, CY, hz + 1], .45, METAL);   // element and the thermostat's probe beside it
  if (heat > .05) s += `<path d="${pd([[XT1 - 9, CY, hz],[XT0 + 1, CY, hz]], false)}" stroke="#ff8a3a" style="stroke-width:${f(6*heat)}" opacity="${f(.25*heat)}" stroke-linecap="round"/>`;
  // the drum: perforated steel, three spider arms on its back, turning
  const R0 = ringT(XD0, RO), R1 = ringT(XD1, RO);
  s += loft(R0, R1, n => toneI(n, STEEL));
  let dots = '';
  const fast = Math.abs(st.run ? omegaAt(prog(st), st.tau) : 0) > 7;
  for (let x = XD0 + 3; x < XD1 - 2; x += 3.4) for (let i = 0; i < 30; i++){
    const a = A + (i + (x*.37 % 1)) / 30 * 2*Math.PI, n = [0, Math.cos(a), Math.sin(a)];
    if (camDot(rotV(n), [1,1,1]) < .25) continue;
    const q = (da, dx) => [x + dx, CY + (RO+.05)*Math.cos(a+da), CZ + (RO+.05)*Math.sin(a+da)];
    dots += fast ? pd([q(-.25,0), q(.25,0)], false) : pd([q(-.03,-.45), q(.03,-.45), q(.03,.45), q(-.03,.45)]);
  }
  s += fast ? `<path d="${dots}" fill="none" stroke="#2a3134" stroke-width=".8" opacity=".6"/>` : `<path d="${dots}" fill="#2a3134"/>`;
  if (back){ s += fill(pd(R0), toneI([-1,0,0], STEEL));
    for (let j = 0; j < 3; j++){ const a = A + j*2*Math.PI/3; s += shape(on(PX(XD0 - .3), [[CY + 2*Math.cos(a+.5), CZ + 2*Math.sin(a+.5)], [CY + 17*Math.cos(a+.12), CZ + 17*Math.sin(a+.12)], [CY + 17*Math.cos(a-.12), CZ + 17*Math.sin(a-.12)], [CY + 2*Math.cos(a-.5), CZ + 2*Math.sin(a-.5)]]), ALU.m, .8); }
    s += ink(pd(R0), 1); }
  s += hullInk([...R0, ...R1], 1.6) + ink(pd(R1), .9);
  // through the mouth: the drum's inside with the clothes and water, as in the normal view
  if (front) s += clipTo(ringX(XD1, RO - .2), drum(st));
  // near wall, rims
  s += op(.32, loft(A0, A1, n => toneI(n, TUBM)) + (back ? fill(pd(A0), toneI([-1,0,0], TUBM)) : ''));
  s += ink(pd(A0), .9) + ink(pd(A1), .9) + hullInk([...A0, ...A1], 1.6);
  // rubber bellows from the tub's mouth to the cabinet front
  const g0 = ringT(XT1, RT - 1.5), g1 = ringT(W - .3, RO + 1.2);
  s += op(.85, loft(g1, g0, n => toneI(n, RUBBER))) + ink(pd(g0), .8);
  return s;
}
function pulleyBelt(st, A){
  let s = '';
  const fx = vis([1,0,0]) ? XPU + 1.2 : XPU - 1.2, fn = vis([1,0,0]) ? [1,0,0] : [-1,0,0];
  // shaft from the drum's back through the tub to the pulley
  s += rod([XPU - 1.4, CY, CZ], [XT0, CY, CZ], 1.5, METAL);
  s += cylX(XPU - 1.2, XPU + 1.2, CY, CZ, RPU, ALU, toneI, 1.4, 40);
  // five spoke windows, turning with the drum
  let win = '';
  for (let j = 0; j < 5; j++){ const a0 = A + j*2*Math.PI/5;
    win += pd(on(PX(fx + (fn[0] > 0 ? .05 : -.05)), [...arcUV(CY, CZ, 5.5, (a0+.22)*180/Math.PI, (a0+1.0)*180/Math.PI, 5), ...arcUV(CY, CZ, 13.5, (a0+1.0)*180/Math.PI, (a0+.22)*180/Math.PI, 7)])); }
  s += `<path d="${win}" fill="${ALU.d}" stroke="${INK}" stroke-width=".7"/>`;
  s += shape(on(PX(fx + fn[0]*.1), ellUV(CY, CZ, 3, 3, 16)), ALU.m, .8);
  // belt: the two outside tangents between the pulleys plus the wrapped arcs
  const c1 = [CY, CZ], c2 = [MOT.y, MOT.z], r1 = RPU + .3, r2 = MOT.rp + .3, d = [c2[0]-c1[0], c2[1]-c1[1]];
  const L = Math.hypot(...d), ph = Math.atan2(d[1], d[0]), be = Math.acos((r1 - r2)/L);
  const pt = (c, r, a) => [c[0] + r*Math.cos(a), c[1] + r*Math.sin(a)], loop = [];
  for (let i = 0; i <= 10; i++) loop.push(pt(c2, r2, ph + be - 2*be*i/10));
  for (let i = 0; i <= 40; i++) loop.push(pt(c1, r1, ph - be - (2*Math.PI - 2*be)*i/40));
  const bp = pd(on(PX(XPU), loop));
  s += `<path d="${bp}" fill="none" stroke="${INK}" style="stroke-width:${f(2.6*INK_K + 1.6)}" stroke-linejoin="round"/>`
     + `<path d="${bp}" fill="none" stroke="#3a3632" style="stroke-width:1.6" stroke-linejoin="round"/>`
     + `<path d="${bp}" fill="none" stroke="#8a8378" style="stroke-width:.6" stroke-dasharray="1 2.2" stroke-dashoffset="${f(-A*RPU)}"/>`;
  // motor pulley
  s += cylX(XPU - 1.2, XPU + 1.2, MOT.y, MOT.z, MOT.rp, METAL, toneI, 1, 16);
  const ma = A * RPU / MOT.rp;
  s += ink(pd(on(PX(fx + fn[0]*.1), [[MOT.y, MOT.z], [MOT.y + 1.8*Math.cos(ma), MOT.z + 1.8*Math.sin(ma)]]), false), .9);
  return s;
}
function motor(st, A){
  let s = cylX(MOT.x0, MOT.x1, MOT.y, MOT.z, MOT.r, MOTM, toneI, 1.4, 24);
  // cooling ribs + a strap holding it to the tub
  for (let x = MOT.x0 + 3; x < MOT.x1 - 2; x += 2.6) s += line(arcUV(MOT.y, MOT.z, MOT.r + .05, 30, 200, 8).map(([y, z]) => [x, y, z]), .6);
  s += rod([XPU + 1.3, MOT.y, MOT.z], [MOT.x0, MOT.y, MOT.z], .8, METAL);
  s += box(MOT.x0 + 4, MOT.y - 2, MOT.z + MOT.r - .5, MOT.x1 - 4, MOT.y + 2, tubZ(MOT.y - CY) + .4, DARK, toneI, .9);
  return s;
}
function pump(st, t, running){
  let s = cylX(PUMP.x0, PUMP.x1, PUMP.y, PUMP.z, PUMP.r, DARK, toneI, 1.3, 20);
  s += box(PUMP.x0 + 2, PUMP.y - 3, PL, PUMP.x1 - 2, PUMP.y + 3, PUMP.z - PUMP.r + .3, DARK, toneI, .8);   // foot
  const cap = vis([1,0,0]) ? PUMP.x1 + .1 : PUMP.x0 - .1, a = running ? t*30 : 0;
  for (let j = 0; j < 4; j++){ const g = a + j*Math.PI/2; s += ink(pd(on_(cap, g)), .7); }
  return s;
  function on_(x, g){ return on(PX(x), [[PUMP.y, PUMP.z], [PUMP.y + 3*Math.cos(g), PUMP.z + 3*Math.sin(g)]]); }
}
function counterweight(){
  const x0 = XT1 - 13, x1 = XT1 - 1, y0 = CY - 12, y1 = CY + 12, z0 = tubTop(12) + .6, z1 = tubTop(0) + 6;
  let s = box(x0, y0, z0, x1, y1, z1, CONC, toneI, 1.2);
  for (const y of [y0 + 3.5, y1 - 3.5]) s += cyl((x0 + x1)/2, y, z1, z1 + .8, 1.3, METAL, toneI, .8, 12);
  // grit on the visible faces
  let g = ''; for (let i = 0; i < 26; i++){ const u = (i*.618 % 1), v = (i*.382 + .1) % 1;
    g += pd(on(PZ(z1 + .05), ellUV(x0 + 1 + u*(x1 - x0 - 2), y0 + 1 + v*(y1 - y0 - 2), .35, .35, 6))); }
  return s + `<path d="${g}" fill="${CONC.d}"/>`;
}
function inlet(){
  // valve block on the back wall, one solenoid per inlet (hot red, cold blue), behind the inlet taps
  let s = box(1, 40, 77, 6.5, 56, 85, VALVE, toneI, 1.1);
  s += cyl(3.8, 44, 85, 88 - .6, 1.9, matOf('#4a78c8'), toneI, .9, 14) + cyl(3.8, 52, 85, 88 - .6, 1.9, matOf('#d0503e'), toneI, .9, 14);
  return s;
}
const HOSE_IN = [[6.5, 48, 81], [16, 49, 84.5], [W - 30, 51, 84.5], [W - 22.5, 51, 80]];
const HOSE_SOAP = [[W - 11, 50, 71], [W - 11, 49, 66], [W - 11, 47, tubTop(14.5) + .2]];
const HOSE_SUMP = [[W - 9, CY, tubZ(0)], [W - 9, CY - 6, tubZ(0) - 3], [W - 9, 20, 11], [PUMP.x1 - 3, PUMP.y + PUMP.r, PUMP.z]];
const HOSE_OUT = [[PUMP.x0, PUMP.y, PUMP.z], [36, 9, 9], [14, 14, 9], [4, 22, 12], [0, 24, 13]];
const HOSE_AIR = [[XT0 + 4, CY - 8, tubZ(8) - .2], [9, 14, 15], [4.5, 10, 24], [4.5, 10, 62], [6, 10, 80]];   // air trap at the tub's bottom, up the back wall to the pressure switch
const HOSE_IN2 = [[6.5, 53, 81], [16, 54, 84.5], [W - 30, 54, 84.5], [W - 22.5, 54, 80]];
function drawerBox(){
  return `<g opacity=".7">` + box(W - 22.5, DRW[0] - .5, DRW[1] - 1.5, W - .4, DRW[2] + .5, DRW[3] + .5, VALVE, toneI, 1) + `</g>`;
}
// pills in two columns either side of the cabinet, sorted top to bottom so leaders never cross
function callouts(items){
  const pts = []; for (const x of [0, W]) for (const y of [0, D]) for (const z of [0, H]) pts.push(P(x, y, z));
  const xmin = Math.min(...pts.map(p => p[0])), xmax = Math.max(...pts.map(p => p[0])), cx = (xmin + xmax)/2;
  // on a phone (LBL_U = drawing units per screen px) each label is a numbered badge and the names go in a legend under the figure
  const k = INK_K, u = window.LBL_U ? LBL_U() : 0, fs = u ? 10*u : 8.6*k, hgt = u ? 17*u : fs*1.8, gap = hgt + (u ? 3*u : 3*k);
  const L = [], R = [];
  const svgEl = document.getElementById('fig'), vb = svgEl.viewBox.baseVal, btn = document.getElementById('btns');
  const wMax = u ? hgt*1.3 + 12*k : Math.max(...items.map(it => it.text.length))*fs*.62 + fs*1.5 + 12*k;
  const roomL = xmin - vb.x >= wMax, roomR = vb.x + vb.width - xmax >= wMax;
  for (const it of items){ const [X, Y] = P(...it.at); ((X < cx && roomL) || !roomR ? L : R).push({ ...it, X, Y }); }
  let s = '';
  // keep clear of the button list (top left) and inside the frame
  let top = { [-1]: fs, [1]: fs };
  if (btn && svgEl.getScreenCTM()){ const r = btn.getBoundingClientRect(), q = new DOMPoint(r.right, r.bottom + 50).matrixTransform(svgEl.getScreenCTM().inverse());
    if (q.y > 0) top[-1] = q.y + hgt; }
  for (const [col, side] of [[L, -1], [R, 1]]){
    col.sort((a, b) => a.Y - b.Y);
    const place = () => { let y = -1e9; for (const c of col){ c.py = Math.max(c.Y, y + gap, top[side]); y = c.py; } };
    place();
    // pull the column back up toward its parts, but never above its top limit
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
// labels for what can be seen from outside: front parts when the front faces us, back parts when the back does
function surfaceLabels(st, FRONT, BACK){
  const th = ease(st.door) * DOOR_MAX, s0 = ease(st.drawer) * DRAWER_MAX, L = [];
  if (FRONT) L.push(
    { at: dP(BT, uc + RB*.72, CZ - RB*.7, th), text: 'DOOR', on: st.door > 0 },
    { at: [W + .3, (DISP[0] + DISP[2])/2, (DISP[1] + DISP[3])/2], text: 'DISPLAY', on: st.run },
    { at: [W + 1, DIAL[0], DIAL[1] + DIAL[2]], text: 'PROGRAM DIAL', on: false },
    { at: [W + 1, BTN[0], BTN[1] + BTN[2]], text: 'START', on: st.run },
    { at: [W + s0, (DRW[0] + DRW[2])/2, DRW[3]], text: 'SOAP DRAWER', on: st.drawer > 0 },
    { at: [W + .2, 9.5, 9.75], text: 'FILTER HATCH', on: false });
  if (BACK) L.push(
    { at: [-4.6, 48, 83], text: 'WATER INLETS', on: false },
    { at: [-1.6, 12, 83.5], text: 'POWER CORD', on: false },
    { at: [-1.2, 17, 42.4], text: 'TRANSIT BOLTS', on: false },
    { at: [-3, 24, 30], text: 'DRAIN HOSE', on: false });
  return L;
}
let MECH_LABELS = '';
function mechanism(st, m, k){
  const p = prog(st), t = st.tau, run = st.run, ph = run ? phaseAt(p, t) : null;
  const A = run ? angleAt(p, t) : st.restA, om = run ? omegaAt(p, t) : 0;
  const lv = run ? waterAt(p, t) : 0, heat = ph === 'wash' ? sstep(p.fill, p.fill + .8, t) * (1 - sstep(p.wash - 1, p.wash, t)) : 0;
  const filling = ph === 'fill', draining = ph === 'drain' || (ph === 'spin' && t < p.drain + 1.5);
  // the tub swings on its springs when the drum is fast or reverses
  const sh = Math.max(0, (Math.abs(om) - 6) / 14), sway = [0, sh*1.6*Math.sin(t*41), sh*1.1*Math.sin(t*53 + 1) + (lv*-1.2)];
  const [sx, sy] = Dv(...sway);
  const hung = svg => { OX += sx; OY += sy; try { return svg(); } finally { OX -= sx; OY -= sy; } };
  const parts = [
    { at: [XPU, MOT.y - 2, MOT.z + 2], svg: hung(() => pulleyBelt(st, A)) },
    { at: [(MOT.x0 + MOT.x1)/2, MOT.y, MOT.z], svg: hung(() => motor(st, A)) },
    { at: [(XT0 + XT1)/2, CY, CZ], svg: hung(() => tubPart(st, k, sway, A, lv, heat)) },
    { at: [XT1 - 7, CY, tubTop(0) + 3], svg: hung(counterweight) },
    { at: [(PUMP.x0 + PUMP.x1)/2, PUMP.y, PUMP.z], svg: pump(st, t, draining) },
    { at: [3.8, 48, 81], svg: inlet() },
    { at: [W - 11, 51, 77], svg: drawerBox() },
    ...SPR.map(s => ({ at: lerp3(s.a, s.b, .5), svg: coil(add3(s.a, sway), s.b, 1.5, 9) + rod(s.b, add3(s.b, [0,0,-1.5]), .5, METAL) })),
    ...DMP.map(d => { const top = add3(d.b, sway), mid = lerp3(d.a, top, .55);
      return { at: lerp3(d.a, d.b, .5), svg: rod(d.a, mid, 1.9, DARK) + rod(mid, top, .8, METAL) }; }),
    { at: [W - 9, 22, 12], svg: tube(HOSE_SUMP, 1.4, HOSE_M, true) + flow(HOSE_SUMP, t, draining) },
    { at: [20, 12, 9], svg: tube(HOSE_OUT, 1.4, HOSE_M, true) + flow(HOSE_OUT, t, draining) },
    { at: [W/2, 50, 84], svg: tube(HOSE_IN, 1.1, matOf('#cfd6d8')) + flow(HOSE_IN, t, filling) + tube(HOSE_SOAP, 1.3, HOSE_M, true) + flow(HOSE_SOAP, t, filling) },
    { at: [8, 11, 40], svg: tube(HOSE_AIR, .55, matOf('#e8e2cf')) + box(3, 7, 80, 9, 13, 85, VALVE, toneI, .9) },
  ];
  parts.push(...mechExtra(st, t, sway, hung, { om, heat, filling, draining, lv }));
  let s = byDepth(parts);
  MECH_LABELS = k <= .6 ? '' : callouts([
    { at: [XT0 + 3, CY + 16, tubTop(16) - 2], text: 'TUB', on: false },
    { at: [XD1 - 8, CY + 12, CZ + 14], text: 'DRUM', on: Math.abs(om) > .1 },
    { at: [XT0 - 2.5, CY, CZ + 5.5], text: 'BEARINGS', on: Math.abs(om) > .1 },
    { at: [MOT.x1, MOT.y + MOT.r, MOT.z], text: 'MOTOR', on: Math.abs(om) > .1 },
    { at: SPR[1].b.map((v, i) => i === 2 ? v - 8 : v), text: 'SPRING', on: sh > .1 },
    { at: lerp3(DMP[1].a, DMP[1].b, .3), text: 'DAMPER', on: sh > .1 },
    { at: [XT0 - 1, CY + 5, tubZ(0) + 3.5], text: 'HEATER', on: heat > .1 },
    { at: [PUMP.x1, PUMP.y, PUMP.z + PUMP.r], text: 'DRAIN PUMP', on: draining },
    { at: [3.8, 56, 82], text: 'INLET VALVES', on: filling },
    { at: [6, 7, 84], text: 'PRESSURE SWITCH', on: filling },
    { at: [56, 4, 71.5], text: 'CONTROL BOARD', on: !!st.run },
  ]);
  return s;
}
/* ---------- the rest of the anatomy, added to what was here ----------
   Parts (each held by another part; wires and hoses run port to port along walls, floor and lid):
   DRUM / TUB   drum . three-arm spider . shaft . bearing housing with two bearings and a seal on the tub's back . tub .
                rubber bellows to the front . top counterweight . front counterweight hung under the tub on two straps
   SUSPENSION   two springs hooked into a cross rail under the lid . two dampers on brackets on the base
   DRIVE        motor bolted under the tub . motor pulley . belt . big pulley on the shaft
   WATER IN     inlet valve block with two solenoids . two hoses to the soap drawer housing . hose from the drawer to the tub
   WATER OUT    sump hose . drain pump on the base with its terminal block . filter housing and cap behind the front hatch .
                drain hose to the back
   HEAT         U-shaped element entering through a flange on the tub's back . thermostat probe beside it . terminals
   SENSING      pressure switch on the back wall . air tube up from the air trap under the tub
   CONTROL      main control board on a tray behind the panel (relays, capacitor, connectors) . display board behind the panel
                with a ribbon to the main board . door lock at the door's latch side
   HARNESS      board -> pressure switch and inlet solenoids along the lid . board -> door lock . board down the front corner,
                along the floor to the drain pump, the motor and the heater */
const WPCB = { l:'#4fa36a', m:'#2f8a4a', d:'#1d5f31' }, WAH = '#3a3632', WAON = '#ffb347', WLIT = matOf('#ff9a3a');
const WBOARD = [52, 3, 70, 60.5, 39, 70.8], LOCK = [W - 6, 55, 34, W - .6, 60, 42], HZ = () => tubZ(0) + 2.1;
const wBB = (pts, e = 0) => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - e), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + e)];
const wBend = (pts, r = 2.2) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a wire as short depth-sortable pieces, terminal dots on its ends
const wLine = (pts, col, w = .45, ends = true) => { const q = wBend(pts), out = [], L = 7;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const e of [i === 0 && ends ? q[0] : null, j === q.length - 1 && ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.1" fill="${INK}"/>`; }
    out.push({ box: wBB(seg, .8), svg }); i = j; }
  return out; };
function mechExtra(st, t, sway, hung, o){
  const parts = [], put = (b, svg, sw) => parts.push({ box: b, svg: sw ? hung(() => svg()) : (typeof svg === 'function' ? svg() : svg) });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8, sw = false) => put([[x0, y0, z0], [x1, y1, z1]], () => box(x0, y0, z0, x1, y1, z1, m, toneI, w), sw);
  const wire = (pts, on, w, ends) => parts.push(...wLine(pts, on ? WAON : WAH, w, ends));
  const run = !!st.run, spin = Math.abs(o.om) > .1, hz = HZ();
  // bearing housing on the tub's back, two bearings and a seal ring seen on its back face
  put([[XT0 - 2.6, CY - 5.6, CZ - 5.6], [XT0, CY + 5.6, CZ + 5.6]], () => cylX(XT0 - 2.6, XT0, CY, CZ, 5.6, ALU, toneI, 1, 28)
    + (vis([-1,0,0]) ? [4.2, 2.6].map(r => ink(pd(on(PX(XT0 - 2.65), ellUV(CY, CZ, r, r, 24))), .5)).join('') : ''), true);
  // heater flange, its two terminals and the thermostat on the tub's back
  put([[XT0 - 2.8, CY - 5, hz - 2], [XT0, CY + 5, hz + 2.6]], () => {
    let h = box(XT0 - .8, CY - 5, hz - 1.6, XT0, CY + 5, hz + 2.4, METAL, toneI, .7);
    for (const dy of [-3, 3]) h += rod([XT0 - .8, CY + dy, hz], [XT0 - 2.6, CY + dy, hz], .5, COPPER, toneI, .5);
    h += box(XT0 - 2.6, CY - 1, hz + .2, XT0 - .8, CY + 1, hz + 1.8, matOf('#e2483d'), toneI, .5);
    return h; }, true);
  // front counterweight hung under the tub on two straps
  for (const y of [CY - 8, CY + 8]) bx(45.5, y - .8, 15.9, 46.5, y + .8, tubZ(y - CY) + .3, METAL, .5, true);
  put([[41, CY - 10, 10.4], [51, CY + 10, 16]], () => { let w = box(41, CY - 10, 10.4, 51, CY + 10, 16, CONC, toneI, 1);
    let g = ''; for (let i = 0; i < 14; i++){ const u = (i*.618 % 1), v = (i*.382 + .1) % 1; g += pd(on(PZ(16.05), ellUV(42 + u*8, CY - 9 + v*18, .3, .3, 6))); }
    return w + `<path d="${g}" fill="${CONC.d}"/>`; }, true);
  // suspension: cross rail under the lid that the springs hook into; damper brackets on the base
  bx(32, 1, 86, 36, D - 1, 87.4, METAL, .8);
  for (const sp of SPR) put([[33.5, sp.b[1] - .5, sp.b[2]], [34.5, sp.b[1] + .5, 86]], () => rod(sp.b, [sp.b[0], sp.b[1], 86], .45, METAL, toneI, .5));
  for (const d of DMP) bx(33, d.a[1] - 2.6, PL - .1, 39, d.a[1] + 2.6, PL + 1.2, DARK, .7);
  // drain filter behind the front hatch, on the pump's outlet; pump terminal block
  put([[56, PUMP.y - 2.8, PUMP.z - 2.8], [W - 1.5, PUMP.y + 2.8, PUMP.z + 2.8]], () => cylX(56, W - 1.5, PUMP.y, PUMP.z, 2.8, DARK, toneI, .8, 18));
  put([[W - 1.5, PUMP.y - 3.4, PUMP.z - 3.4], [W - .3, PUMP.y + 3.4, PUMP.z + 3.4]], () => cylX(W - 1.5, W - .3, PUMP.y, PUMP.z, 3.4, matOf('#d8d2c2'), toneI, .8, 20)
    + (vis([1,0,0]) ? line([[W - .25, PUMP.y - 2.4, PUMP.z], [W - .25, PUMP.y + 2.4, PUMP.z]], 1.1) : ''));
  bx(48, 5, 7, 51, 6.5, 11, VALVE, .6);
  // control: tray and main board behind the panel (relays, capacitor, connectors); display board on the panel's back
  bx(WBOARD[0], WBOARD[1], WBOARD[2], WBOARD[3], WBOARD[4], WBOARD[5], VALVE, .7);
  put([[52.6, 4, 70.8], [60, 38, 71.5]], () => { let b = box(52.6, 4, 70.8, 60, 38, 71.5, WPCB, toneI, .6);
    if (vis([0,0,1])) b += [[53.5, 6, 57, 11], [53.5, 13, 57, 18], [53.5, 20, 57, 25]].map(([x0, y0, x1, y1]) => box(x0, y0, 71.5, x1, y1, 74, matOf('#3e6fb0'), toneI, .5)).join('')
      + cyl(57.5, 30, 71.5, 75, 1.6, DARK, toneI, .6, 14) + box(53, 32, 71.5, 55, 37.5, 73, VALVE, toneI, .5) + box(58, 4.5, 71.5, 59.6, 9, 73, VALVE, toneI, .5)
      + fill(pd(on(PZ(71.55), ellUV(58.8, 22, .5, .5, 8))), run ? '#7dff9a' : '#2a5a36');
    return b; });
  bx(W - 2.6, 9, 72.5, W - 1.9, 38, 84.5, WPCB, .6);
  put([[57, 18, 71.5], [W - 1.9, 22, 73.5]], () => `<path d="${pd([[W - 2.6, 20, 72.6], [59, 20, 73], [57.5, 20, 71.6]], false)}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="${pd([[W - 2.6, 20, 72.6], [59, 20, 73], [57.5, 20, 71.6]], false)}" fill="none" stroke="#cfd6d8" stroke-width="1.2" stroke-linecap="round"/>`);
  // door lock at the latch side of the opening, on the front wall
  put([LOCK.slice(0, 3), LOCK.slice(3)], () => box(...LOCK, run ? WLIT : VALVE, toneI, .8)
    + (vis([1,0,0]) ? shape(on(PX(LOCK[3] + .05), rectUV(56.5, 37, 58.5, 39.5)), '#1d1a16', .4) : ''));
  // harness: along the lid to the pressure switch and the inlet solenoids
  wire([[53, 10, 71.5], [49, 10, 83.5], [9.2, 10, 83.5]], o.filling, .45);
  wire([[53, 35, 72.2], [49, 37.5, 83.5], [8, 37.5, 83.5], [6.5, 42, 83.5]], o.filling, .45);
  wire([[8, 37.5, 83.5], [8, 54.8, 84.6], [6.5, 54.8, 84.6]], o.filling, .4, true);
  // board to the door lock
  wire([[59.5, 38, 70.8], [60, 41, 67], [58.5, 57.5, 65], [58.5, 57.5, LOCK[5]]], run, .45);
  // down the front corner and along the floor: pump, motor, heater
  wire([[59.5, 4, 70.8], [60, 2, 66], [60, 2, PL + 1], [12.5, 2, PL + 1]], run, .6, false);
  wire([[49.5, 2, PL + 1], [49.5, 4, 8], [49.5, 5, 9]], o.draining, .45);
  wire([[22, 2, PL + 1], [22, 36, PL + 1], [22, MOT.y, MOT.z - MOT.r - .1]], spin, .45);
  wire([[12.5, 2, PL + 1], [12.5, 28, PL + 1], [12.5, 28, hz - 3], [XT0 - 2.6, CY - 3, hz]], o.heat > .05, .45);
  wire([[12.5, 28, hz - 3], [XT0 - 2.6, CY + 3, hz]], o.heat > .05, .45);
  // second inlet hose, valve to the soap drawer housing
  parts.push({ at: [W/2, 54, 84], svg: tube(HOSE_IN2, 1.1, matOf('#cfd6d8')) + flow(HOSE_IN2, t, o.filling) });
  return parts;
}
const CAPS_X = {
  idle: 'Inside: the drum turns on bearings in a tub hung from springs and dampers. Press Start to watch the parts work.',
  fill: 'Fill: the board locks the door and opens the inlet valves. Water runs through the soap drawer into the tub until the pressure switch feels the air in its tube squeeze and stops it.',
  wash: 'Wash: the heater warms the water until its thermostat says enough. The motor turns the belt and the big pulley, and the drum rocks a few turns each way on its bearings.',
  drain: 'Drain: the pump pulls the water from the bottom of the tub through its filter and pushes it up the drain hose.',
  spin: 'Spin: the drum spins fast and flings the water out through its holes. Springs, dampers and two concrete weights keep the shaking tub in place.',
};

/* ---------- behaviour ---------- */
let ui;
// own clock: frame timestamps can lag performance.now(), which would give a negative first dt
function tick(fn){ let last = performance.now(); ui.animate(() => { const n = performance.now(), dt = Math.min(.05, Math.max(0, (n - last) / 1000)); last = n; return fn(dt); }); }
function runLoop(){
  if (st0.loop) return;
  st0.loop = true;
  tick(dt => {
    const st = ui.st;
    if (!st.run || st.paused){ st.loop = false; return false; }
    st.tau += dt;
    if (st.soapLvl > 0 && prog(st).fill) st.soapLvl = Math.max(0, 1 - st.tau / prog(st).fill);   // the fill water flushes the powder in
    if (st.tau >= prog(st).T){
      st.run = false; st.loop = false; st.done = true; st.tau = 0;
      ui.flash('ding! ' + prog(st).name.toLowerCase() + ' done — open the door', 2600);
      return false;
    }
    return true;
  });
}
function start(st, ui){
  if (st.run){ st.paused = !st.paused; if (!st.paused) runLoop(); else ui.flash('paused — press start to resume'); return; }
  if (st.door > 0 || st.doorT) return ui.flash('close the door first');
  if (st.laundry === 'basket') return ui.flash('the drum is empty — load laundry first');
  st.run = true; st.paused = false; st.done = false; st.tau = 0; runLoop();
}
function addSoap(st, ui){
  if (st.run) return ui.flash('the drawer is locked while washing');
  if (st.soapAnim != null) return;
  if (st.soapLvl >= 1) return ui.flash('there is already soap in the drawer');
  if (!st.drawerT) toggleDrawer(st, ui);
  st.soap = true; st.soapAnim = 0; const from = st.soapLvl;
  tick(dt => {
    st.soapAnim += dt / 2.4;
    const t = st.soapAnim; if (t > .35) st.soapLvl = Math.max(from, Math.min(1, (t - .35) / .45));
    if (t >= 1){ st.soapAnim = null; st.soapLvl = 1; ui.flash('soap in — the drawer slides shut'); setTimeout(() => { if (st.drawerT) toggleDrawer(st, ui); }, 350); return false; }
    return true;
  });
}
function cycleProg(st, ui){
  if (st.run) return ui.flash('program locked while running');
  st.prog = (st.prog + 1) % PROGS.length; st.done = false; st.picked = true;
}
function swingDoor(st, to, then){
  st.doorT = to;
  tick(dt => { const g = Math.sign(st.doorT - st.door); st.door = Math.min(1, Math.max(0, st.door + g * dt / .9));
    if (st.door === st.doorT){ if (then) then(); return false; } return true; });
}
function transfer(st, dir, then){
  st.xfer = { dir, T: 0 };
  tick(dt => { st.xfer.T += dt; if (st.xfer.T >= xferEnd()){ st.laundry = dir === 'out' ? 'basket' : 'drum'; st.xfer = null; if (then) then(); return false; } return true; });
}
function toggleDoor(st, ui, unloadAlways=false){
  if (st.run) return ui.flash('door locked — wait for the cycle to end');
  if (st.xfer) return;
  if (!st.doorT){                                   // open; after a finished wash the laundry comes out into the basket
    const unload = (unloadAlways || st.done) && st.laundry === 'drum'; st.done = false;
    swingDoor(st, 1, unload ? () => { ui.flash('unloading the clean laundry…', 1600); transfer(st, 'out', () => ui.flash('laundry is in the basket', 1800)); } : null);
  } else swingDoor(st, 0);
}
// load: the door opens if needed, the basket load goes into the drum, the door closes again
function loadLaundry(st, ui){
  if (st.run) return ui.flash('the machine is running');
  if (st.xfer) return;
  if (st.laundry === 'drum') return ui.flash('the drum is already loaded');
  const go = () => { ui.flash('loading the laundry…', 1600); transfer(st, 'in', () => swingDoor(st, 0, () => ui.flash('loaded — add soap, then start', 1800))); };
  st.doorT ? go() : swingDoor(st, 1, go);
}
function toggleDrawer(st, ui){
  st.drawerT = st.drawerT ? 0 : 1; if (st.drawerT) st.soap = true;
  tick(dt => { const g = Math.sign(st.drawerT - st.drawer); st.drawer = Math.min(1, Math.max(0, st.drawer + g * dt / .5)); return st.drawer !== st.drawerT; });
}

let st0;
ui = mountFigure({
  fig:'01', title:'Washing machine', credit:false, turn:'full',   // checked from every side hint:'load the laundry, add soap, pick a program, start — then unload',
  idea:"Spinning fast flings the water out through the little holes in the drum, while the clothes get pressed against the wall.",
  size:[W, D, H], palette:'mint',
  state:{ prog:0, run:false, paused:false, loop:false, tau:0, done:false, door:0, doorT:0, drawer:0, drawerT:0, restA:0,
          soapLvl:0, soapAnim:null, laundry:'basket', xfer:null, xr:0, xrT:0 },   // starts empty: the laundry waits in the basket
  scene,
  readout: st => {
    const p = prog(st);
    if (st.run){
      const ph = { fill:'filling', wash:'washing', drain:'rinsing + draining', spin:'spinning' }[phaseAt(p, st.tau)];
      return st.paused ? `${p.name} paused · ${fmt(remaining(st))} left — press start` : `${p.name} · ${ph} · ${fmt(remaining(st))} left`;
    }
    if (st.laundry === 'basket' && !st.xfer) return st.door > 0 ? 'laundry is in the basket — close the door, or load the next wash' : 'empty — load the laundry from the basket to start';
    if (st.door > 0) return 'door open — click it to close, then start';
    if (st.done) return 'done — open the door to unload';
    return `${p.name} · ${fmt(p.min)} — click the dial to change program, start to wash`;
  },
  buttons:[
    { label:'Load laundry', onClick:(st,ui) => loadLaundry(st,ui) },
    { label:'Add soap', onClick:(st,ui) => addSoap(st,ui) },
    { label:'Choose program', choices: st => PROGS.map((p,i) => ({ label:p.name, current: st.prog === i, disabled: st.run, why: 'the program is locked while it runs',
        onClick:(st,ui) => { if (st.run) return ui.flash('program locked while running'); st.prog = i; st.picked = true; st.done = false; } })) },
    { label:'Start / pause', onClick:(st,ui) => start(st,ui) },
    { label:'Open door, unload', onClick:(st,ui) => {
        if (!st.doorT) return toggleDoor(st, ui, true);
        if (st.xfer) return;
        if (st.laundry === 'drum'){ ui.flash('unloading the laundry…', 1600); transfer(st, 'out', () => ui.flash('laundry is in the basket', 1800)); }
        else ui.flash('the drum is already empty'); } },
    { label:'Close door', onClick:(st,ui) => st.doorT ? toggleDoor(st,ui) : ui.flash('Door is closed') },
  ],
  buttonsLabel:'Machine',
  acts:{ dial:(st,el,ui) => cycleProg(st,ui), start:(st,el,ui) => start(st,ui), door:(st,el,ui) => toggleDoor(st,ui), drawer:(st,el,ui) => toggleDrawer(st,ui) },
  params:(st,q) => {
    const pi = PROGS.findIndex(p => p.name === (q.get('prog') || '').toUpperCase()); if (pi >= 0) st.prog = pi;
    if (q.get('run') === '1' || q.get('done') === '1' || q.get('laundry') === 'drum') st.laundry = 'drum';
    if (q.get('run') === '1'){ st.run = true; st.tau = Math.min(.999, Math.max(0, +(q.get('t') || 0))) * PROGS[st.prog].T; }
    if (q.get('door') === 'open' || q.get('door') === '1'){ st.door = st.doorT = 1; st.run = false; }
    if (q.has('doorT')) st.door = st.doorT = +q.get('doorT');
    if (q.get('xr') === '1') st.xr = st.xrT = 1;
    if (q.get('drawer') === '1') st.drawer = st.drawerT = 1;
    if (q.get('done') === '1'){ st.done = true; st.run = false; }
    if (q.has('soap')){ const v = +q.get('soap'); if (v > 0 && v < 1){ st.soapAnim = v; st.soapLvl = Math.max(0, Math.min(1, (v-.35)/.45)); st.drawer = st.drawerT = 1; } else st.soapLvl = v ? 1 : 0; }
    if (q.get('laundry') === 'basket'){ st.laundry = 'basket'; st.door = st.doorT = 1; }
    if (q.has('unload')){ st.door = st.doorT = 1; st.xfer = { dir:'out', T: +q.get('unload') * xferEnd() }; }
  },
});
st0 = ui.st;
// view set, top right: see-through on/off and labels on/off, independent (labels start off unless ?labels=1)
if (new URLSearchParams(location.search).get('labels') !== '1') document.documentElement.classList.add('nolabels');
const vset = document.createElement('div'); vset.className = 'vset';
vset.innerHTML = '<div class="vrow"><button class="act" id="xrb" aria-pressed="false">See-through</button><button class="act" id="lblb" aria-pressed="true">Labels</button></div>';
document.querySelector('.stage').appendChild(vset);
const xrb = document.getElementById('xrb'), lblb = document.getElementById('lblb');
const syncSet = () => { const on = !!ui.st.xrT; xrb.setAttribute('aria-pressed', on);
  lblb.setAttribute('aria-pressed', !document.documentElement.classList.contains('nolabels')); };
xrb.onclick = () => { const st = ui.st; st.xrT = st.xrT ? 0 : 1; syncSet();
  tick(dt => { const g = Math.sign(st.xrT - st.xr); st.xr = Math.min(1, Math.max(0, st.xr + g*dt/.7)); return st.xr !== st.xrT; }); };
lblb.onclick = () => { document.getElementById('lbl').click(); syncSet(); };
document.getElementById('lblctl').style.display = 'none';
syncSet();
const capEl = document.createElement('p'); capEl.className = 'mcap'; document.querySelector('.stage').after(capEl);
const capStyle = document.createElement('style'); capStyle.textContent = '.vset{position:absolute;top:4px;right:0;z-index:2;display:flex;flex-direction:column;align-items:flex-end;gap:8px}.vset .cap{color:var(--muted);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.vrow{display:flex;gap:6px}.vset .act[aria-pressed=true]{background:var(--ink);color:var(--paper)}.vset .act[hidden]{display:none}@media (max-width:560px){.vset{position:static;align-items:flex-start;margin:4px 0}.vset .cap{display:none}}.mcap{width:100%;max-width:760px;min-height:3em;margin:0 0 14px;font-size:12.5px;line-height:1.5;text-align:center;transition:opacity .3s}';
document.head.appendChild(capStyle);
const _render = ui.render; ui.render = () => { _render(); const st = ui.st; capEl.style.opacity = st.xr > .5 ? 1 : 0;
  capEl.textContent = CAPS_X[st.run ? phaseAt(prog(st), st.tau) : 'idle']; };
ui.render();