/* ============================================================
   Fig. 07 — Capsule toy machine (gashapon / gumball style)
   Units ≈ 1 cm. Base x 0..40 (depth), y 0..40 (width), z 0..58 (lid seam at 54); globe on top, ~106 tall.
   ============================================================ */
const W = 40, D = 40, BH = 54, TOP = 58;           // base box: body up to the lid seam BH, lid up to TOP (flush, one extrusion)
const OUT = rrUV(0, 0, D, TOP, 3.5);               // profile (y,z), rounded along the top side edges
const CX = 20, CY = 20;                            // vertical axis of collar / globe
const COLLAR_R = 15.4, COLLAR_Z = TOP + 4;         // painted collar ring
const FL_R = 16.4, FLOOR = TOP + 5.6;              // metal flange on the collar; the glass sits on it
const GLASS_R = 13.8;                              // the glass meets the floor at this radius
const GR = 20, G = [CX, CY, FLOOR + Math.sqrt(GR*GR - GLASS_R*GLASS_R)];   // globe centre
const CAP_RR = 7.2, CAP0 = G[2] + Math.sqrt(GR*GR - CAP_RR*CAP_RR) - .5;      // metal cap ring on the glass
const DOME_R = 5.4, Z_TOP = CAP0 + 1.8 + DOME_R + 2.6;                        // dome + knob; top of the machine
const DIAL = { y:20, z:28.3, r:8.8 };              // crank dial on the front
const SLOT = [19.2, 37.9, 20.8, 42.7];             // vertical coin slot (y0,z0,y1,z1)
const CH = { y0:11, y1:29, z0:4, z1:16.8 };        // capsule exit
const CHUTE = rrUV(CH.y0, CH.z0, CH.y1, CH.z1, 3.4);
const HINGE = [W + .6, CH.z1], FLAP_L = CH.z1 - CH.z0 - .6;         // flap hinge (x,z) and length
const CAP_R = 5.6;                                    // dispensed capsule radius
const REST = [W + 16, 13, CAP_R];                     // where the capsule comes to rest on the ground
const CAP_COLS = ['#e2473a', '#f2c230', '#3e86d9', '#38a565', '#8c4bd1', '#f08a2b'];
const PRIZES = { duck:'Rubber duck', star:'Lucky star', cat:'Lucky cat', robot:'Tin robot', dino:'Tiny dino' };
const COIN = { l:'#f0d27a', m:'#d2ad4a', d:'#9a7a2a' };
const VV = norm([1,1,1]);
const clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a + (b-a)*t;
const add = (a,b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const scl = (a,k) => a.map(v => v*k);
function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const L2 = (() => { const d = Dv(...LIN), l = Math.hypot(...d); return [d[0]/l, d[1]/l]; })();   // screen dir of the prop light
/* ---------- turning helpers (VIEW 0..3) ---------- */
// viewer-space direction -> model direction for the current camera (the inverse of rotV)
const unrot = v => { const r = dot(v, CAM_B0.R), u = dot(v, CAM_B0.U), w = dot(v, CAM_B0.V); return [0,1,2].map(i => CAM_R[i]*r + CAM_U[i]*u + CAM_V[i]*w); };
const vp = p => [...rotXY(p[0], p[1]), p[2]];                  // model point -> where it sits in turned coordinates
// draw something that should look the same from every side (prizes, the opened capsule) at model point p
function asSeen(p, fn){ const v = VIEW, q = vp(p); VIEW = 0; try { return fn(q); } finally { VIEW = v; } }
// text on the back (x = const, seen from -x) and on the right side (y = const, seen from -y)
const tF = (o,U,str,size,col,weight) => `<text transform="${txM(o, U, Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".04em">${str}</text>`;
const txB = (x,y,z,str,size,col=INK,weight=700) => tF(P(x,y,z), Dv(0,1,0), str, size, col, weight);
const txR = (x,y,z,str,size,col=INK,weight=700) => tF(P(x,y,z), Dv(-1,0,0), str, size, col, weight);
const C2 = (c, r, fillC, extra='') => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${fillC}" ${extra}/>`;

/* ---------- spheres ---------- */
// a ball: orthographic sphere = circle of r·1.2247; base tone + lit offset disc + glint
function ball(c, r, m, w=.9){
  const [X,Y] = P(...c), R = r*1.2247;
  return C2([X,Y], R, m.m, `stroke="${INK}" stroke-width="${w}"`)
       + C2([X + L2[0]*R*.22, Y + L2[1]*R*.22], R*.68, m.l)
       + C2([X + L2[0]*R*.5, Y + L2[1]*R*.5], R*.16, '#ffffff', 'opacity=".75"');
}
// screen geometry of a hemisphere boundary: pole direction p (3D) -> e2 (screen dir of p), e1, minor axis of the rim ellipse
function rimFrame(c, r, p){
  const [X,Y] = P(...c), R = r*1.2247, d = Dv(...p), l = Math.hypot(d[0], d[1]);
  const e2 = l > 1e-6 ? [d[0]/l, d[1]/l] : [0,1], e1 = [-e2[1], e2[0]];
  const mn = R*Math.abs(dot(rotV(p), VV));
  const at = (a, rr, ry) => [X + rr*Math.cos(a)*e1[0] + ry*Math.sin(a)*e2[0], Y + rr*Math.cos(a)*e1[1] + ry*Math.sin(a)*e2[1]];
  const arc = (a0, a1, ry, n=18) => Array.from({length:n+1}, (_,i) => at(a0 + (a1-a0)*i/n, R, ry));
  return { X, Y, R, mn, arc };
}
const poly = (pts, close=true) => 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + (close ? 'Z' : '');
// shading overlay for any sphere: darker crescent away from the light + glint
function sphereShade(X, Y, R, glint=true){
  const o = [X + L2[0]*R*.11, Y + L2[1]*R*.11];
  return `<path d="M${f(X-R)} ${f(Y)}a${f(R)} ${f(R)} 0 1 0 ${f(2*R)} 0a${f(R)} ${f(R)} 0 1 0 ${f(-2*R)} 0Z M${f(o[0]-R*.88)} ${f(o[1])}a${f(R*.88)} ${f(R*.88)} 0 1 0 ${f(2*R*.88)} 0a${f(R*.88)} ${f(R*.88)} 0 1 0 ${f(-2*R*.88)} 0Z" fill="#1a1020" fill-rule="evenodd" opacity=".16"/>`
       + (glint ? C2([X + L2[0]*R*.5, Y + L2[1]*R*.52], R*.17, '#ffffff', 'opacity=".9"')
                + C2([X + L2[0]*R*.18 + L2[1]*R*.35, Y + L2[1]*R*.18 - L2[0]*R*.35], R*.07, '#ffffff', 'opacity=".7"') : '');
}
// a closed two-tone capsule: k = direction of the coloured half's pole
function capsuleArt(c, r, k, col, w=.9){
  const kv = dot(rotV(k), VV), away = kv < 0 ? k : scl(k, -1);
  const { X, Y, R, mn, arc } = rimFrame(c, r, away);
  const cm = matOf(col), pale = mix(col, '#ffffff', .8), inner = mix(col, '#ffffff', .3);
  const crescent = poly([...arc(0, Math.PI, R), ...arc(Math.PI, 0, mn)]);
  const ell = poly(arc(0, 2*Math.PI, mn, 32));
  let s = '';
  if (kv < 0){   // coloured half points away (usual: coloured bottom seen from above) -> clear dome on top
    s += C2([X,Y], R, pale) + fill(ell, inner) + fill(crescent, cm.l);
    s += `<path d="${poly(arc(Math.PI, 2*Math.PI, mn), false)}" fill="none" stroke="${cm.d}" stroke-width=".5" opacity=".55"/>`;
  } else {       // coloured half faces the viewer, the clear half is the far crescent
    s += C2([X,Y], R, cm.l) + fill(crescent, pale);
  }
  s += sphereShade(X, Y, R);
  s += `<path d="${poly(arc(0, Math.PI, mn), false)}" fill="none" stroke="${INK}" stroke-width=".55"/>`;
  s += C2([X,Y], R, 'none', `stroke="${INK}" stroke-width="${w}"`);
  return s;
}
// half a capsule shell (open), pole p: outside visible on the half-disk, inside through the rim ellipse when p points away
function hemiArt(c, r, p, outC, inC, w=.9, under=''){
  const pv = dot(rotV(p), VV), { X, Y, R, mn, arc } = rimFrame(c, r, p);
  const half = poly(arc(0, Math.PI, R)), ell = poly(arc(0, 2*Math.PI, mn, 32));
  let s = '';
  if (pv < 0){
    s += fill(half, outC) + fill(ell, inC) + under;
    s += fill(poly([...arc(0, Math.PI, R), ...arc(Math.PI, 0, mn)]), outC);
    s += `<path d="${poly([...arc(0, Math.PI, R), ...arc(Math.PI, 0, mn)])}" fill="#1a1020" opacity=".12"/>`;
    s += C2([X + L2[0]*R*.45, Y + L2[1]*R*.45], R*.12, '#ffffff', 'opacity=".8"');
    s += ink(poly(arc(0, Math.PI, R), false), w) + `<path d="${ell}" fill="none" stroke="${INK}" stroke-width="${w*.7}"/>`;
  } else {
    s += fill(half, outC) + fill(ell, outC) + under;
    s += ink(poly(arc(0, Math.PI, R), false), w) + ink(poly(arc(Math.PI, 2*Math.PI, mn), false), w);
  }
  return s;
}

/* ---------- the capsule pile inside the globe ---------- */
const fits = (placed, p, r) => Math.hypot(p[0]-CX, p[1]-CY, p[2]-G[2]) <= GR - r - 1.1 && p[2] >= FLOOR + r + .2
  && placed.every(o => Math.hypot(o.p[0]-p[0], o.p[1]-p[1], o.p[2]-p[2]) >= o.r + r - .15);
// let the pile fall into gaps: each capsule (lowest first) takes the lowest free spot near where it was
function settle(list, rnd){
  const placed = [];
  for (const c of list.slice().sort((a,b) => a.p[2] - b.p[2])){
    let best = fits(placed, c.p, c.r) ? c.p : null;
    for (let k=0;k<160;k++){
      const p = [c.p[0] + (rnd()-.5)*6, c.p[1] + (rnd()-.5)*6, c.p[2] - rnd()*5 + .5];
      if ((!best || p[2] < best[2]) && fits(placed, p, c.r)) best = p;
    }
    for (let dz=0; !best && dz<30; dz+=.25){ const p = [c.p[0], c.p[1], c.p[2]+dz]; if (fits(placed, p, c.r)) best = p; }
    placed.push({ ...c, p:best || c.p });
  }
  return placed;
}
// a fresh heap: drop each capsule into the lowest free spot of many random tries
function freshPile(seed=7, n=24){
  const rnd = rng(seed), placed = [];
  for (let i=0;i<n;i++){
    const r = 3.7 + rnd()*.5; let best = null;
    for (let k=0;k<600;k++){
      const a = rnd()*2*Math.PI, d = Math.sqrt(rnd())*(GR - r), p = [CX + Math.cos(a)*d, CY + Math.sin(a)*d, FLOOR + r + rnd()*30];
      if ((!best || p[2] < best[2]) && fits(placed, p, r)) best = p;
    }
    const th = Math.acos(lerp(-1, .35, rnd())), ph = rnd()*2*Math.PI;   // mostly coloured half down
    placed.push({ id:i, r, p:best, col:CAP_COLS[Math.floor(rnd()*CAP_COLS.length)], k:[Math.sin(th)*Math.cos(ph), Math.sin(th)*Math.sin(ph), Math.cos(th)] });
  }
  return placed;
}

/* ---------- prizes (local base b = bottom centre) ---------- */
const bb = (c, u, v) => [c[0] + u*CAM_R[0], c[1] + u*CAM_R[1], c[2] + v];   // billboard plane facing the viewer (turns with the camera)
const bbPts = (c, uv) => uv.map(([u,v]) => bb(c, u, v));
const dot2 = (c, r=.36, col=INK) => { const q = P(...c); return C2(q, r, col); };
function prizeArt(kind, b, k=1.3){
  // local helpers, everything scaled by k
  const up = dz => add(b, [0,0,dz*k]), Q = (c,u,v) => bb(c, u*k, v*k);
  const QP = (c, uv) => uv.map(([u,v]) => Q(c,u,v)), SP = (c, uv) => QP(c, uv).map(q => P(...q));
  const B = (c, r, m, w=.9) => ball(c, r*k, m, w), dotK = (c, r, col) => dot2(c, r*k, col);
  let s = '';
  if (kind === 'duck'){
    const Y = matOf('#f6c935'), c0 = up(2.6), c1 = Q(c0, 1.2, 3);
    s += shape(QP(c0, [[-2,.5],[-3.7,2.5],[-1.4,1.7]]), Y.m, .8);
    s += B(c0, 2.8, Y) + ink(poly(SP(c0, [[-1.7,.5],[-.3,-.6],[.9,.3]]), false), .7);
    s += B(c1, 1.95, Y);
    s += shape(QP(c1, [[1.2,.1],[3.3,-.3],[1.2,-.9]]), '#f08a2b', .7);
    s += dotK(Q(c1, .55, .55), .34) + dotK(Q(c1, -.3, -.5), .42, '#f3a3a0');
  } else if (kind === 'star'){
    const c = up(4.4), pts = [];
    for (let i=0;i<10;i++){ const a = Math.PI/2 + i*Math.PI/5, rr = i%2 ? 1.6 : 3.7; pts.push([rr*Math.cos(a), rr*Math.sin(a)]); }
    s += shape(QP(add(c, [-.9*k,0,.3*k]), pts), '#d49c1f', 1);
    s += shape(QP(c, pts), '#ffd84a', 1.1);
    s += dotK(Q(c, -.8, .4), .32) + dotK(Q(c, .8, .4), .32);
    s += dotK(Q(c, -1.4, -.2), .38, '#f3a3a0') + dotK(Q(c, 1.4, -.2), .38, '#f3a3a0');
    s += ink(poly(SP(c, [[-.6,-.5],[0,-1],[.6,-.5]]), false), .6);
    s += fill(poly(SP(c, [[-1.4,1.9],[-.9,2.4],[-1.7,2.6]])), '#ffffff', 'opacity=".8"');
  } else if (kind === 'cat'){
    const O = matOf('#f2a65a'), c = up(3.4);
    for (const sx of [-1, 1]){
      s += shape(QP(c, [[sx*2.7,1.2],[sx*2.4,4.3],[sx*.6,2.5]]), O.m, .9);
      s += fill(poly(SP(c, [[sx*2.3,1.9],[sx*2.15,3.5],[sx*1.2,2.5]])), '#f3a3a0');
    }
    s += B(c, 3.1, O);
    s += fill(poly(SP(c, [[-.9,3],[0,2.2],[.9,3],[0,3.6]])), mix(O.m,'#000000',.12));
    for (const sx of [-1, 1]){
      s += ink(poly(SP(c, [[sx*1.6,.4],[sx*1.1,.95],[sx*.6,.4]]), false), .75);
      s += ink(poly(SP(c, [[sx*1.7,-.6],[sx*3.6,-.2]]), false), .45);
      s += ink(poly(SP(c, [[sx*1.7,-1],[sx*3.5,-1.3]]), false), .45);
      s += dotK(Q(c, sx*1.9, -.35), .45, '#f37f8a');
    }
    s += shape(QP(c, [[-.45,-.3],[.45,-.3],[0,-.8]]), '#e2617a', .4);
    s += ink(poly(SP(c, [[-.8,-1.1],[-.4,-1.4],[0,-1],[.4,-1.4],[.8,-1.1]]), false), .5);
  } else if (kind === 'robot'){
    const Hd = matOf('#9fc0cf'), [x,y,z] = b, K = v => v*k;
    s += box(x-K(1.9), y-K(1.9), z, x+K(1.9), y+K(1.9), z+K(3.6), METAL, toneI, .9);
    s += shape(on(PX(x+K(1.9)+.05), rectUV(y-K(1.1), z+K(1), y+K(1.1), z+K(2.6))), '#1d2a26', .5);
    s += dot2([x+K(1.9)+.1, y+K(.5), z+K(1.8)], K(.3), '#e2483d') + dot2([x+K(1.9)+.1, y-K(.4), z+K(1.8)], K(.3), '#43c25c');
    s += box(x-K(1.6), y-K(1.6), z+K(3.6), x+K(1.6), y+K(1.6), z+K(6.6), Hd, toneI, .9);
    for (const dy of [-.8, .8]) s += shape(on(PX(x+K(1.6)+.05), ellUV(y+K(dy), z+K(5.4), K(.55), K(.55), 10)), '#ffd84a', .5);
    s += line([[x+K(1.6)+.05, y-K(.8), z+K(4.3)],[x+K(1.6)+.05, y+K(.8), z+K(4.3)]], .6);
    s += line([[x, y, z+K(6.6)],[x, y, z+K(8.3)]], .8) + ball([x, y, z+K(8.6)], K(.65), matOf('#e2483d'), .6);
  } else if (kind === 'dino'){
    const Gm = matOf('#5cc46a'), c0 = up(2.6), c1 = Q(c0, 1, 3.5);
    s += shape(QP(c0, [[-1.6,-.4],[-4.6,-1.6],[-1.8,1]]), Gm.m, .8);
    s += shape(QP(c1, [[-1.4,1.4],[-1.6,3.2],[-.4,2]]), '#f6c935', .7);
    s += shape(QP(c0, [[-2.4,1.6],[-3.4,3.2],[-1.6,2.6]]), '#f6c935', .7);
    s += shape(QP(c0, [[-2.8,-.2],[-4.1,1],[-2.6,1]]), '#f6c935', .7);
    s += B(c0, 2.9, Gm);
    s += fill(poly(SP(Q(c0,.7,-.5), ellUV(0,0,1.4,1.6,16))), '#d9efb0');
    s += B(c1, 2.2, Gm);
    s += dotK(Q(c1, .7, .5), .36) + dotK(Q(c1, 1.4, -.4), .2) + dotK(Q(c1, -.2, -.4), .4, '#f3a3a0');
  }
  return s;
}

/* ---------- state ---------- */
const st = { pal:'blush', coin:false, coinT:null, crank:0, turn:null, jig:null, roll:null, out:null, pile:freshPile(), served:0, collected:[] };
const PRIZE_KEYS = Object.keys(PRIZES);

/* ---------- the dispensed capsule's path: chute -> lip -> drop -> bounce -> rest ---------- */
function rollPose(u){
  const x0 = W - 10, xLip = W + 5, xLand = W + 9.5, z0 = CH.z0 + CAP_R;
  let x, z;
  if (u < .36){ const t = u/.36; x = lerp(x0, xLip, t*t*(1.6 - .6*t)); z = z0; }
  else if (u < .54){ const t = (u-.36)/.18; x = lerp(xLip, xLand, t); z = z0 - CH.z0*t*t; }
  else { const t = (u-.54)/.46, k = 1 - Math.pow(1-t, 2.2); x = lerp(xLand, REST[0], k);
         z = CAP_R + (t < .45 ? 2.4*Math.sin(Math.PI*t/.45) : t < .7 ? .6*Math.sin(Math.PI*(t-.45)/.25) : 0); }
  const a = (x - x0)/(REST[0] - x0) * 2*Math.PI;
  const y = u < .54 ? 20 : lerp(20, REST[1], 1 - Math.pow(1 - (u-.54)/.46, 2.2));
  return { c:[x, y, z], k:[-Math.sin(a), 0, -Math.cos(a)] };
}
function flapAngle(){
  if (st.roll == null) return 0;
  const u = st.roll.t, D2R = Math.PI/180;
  if (u < .12) return 0;
  if (u < .3) return 76*ease((u-.12)/.18)*D2R;
  if (u < .58) return 76*D2R;
  const t = (u-.58)/.42;
  return 76*D2R*Math.max(0, Math.cos(t*Math.PI*1.5)*Math.exp(-3*t)*(1-t) + (1-t)*(t<.33?1-3*t:0)*0);
}

/* ---------- pieces ---------- */
// the dial: a metal escutcheon on the face, a turning disc and a chunky two-finger grip bar across it
const GRIP = { l:'#fffdf6', m:'#e8e3d3', d:'#c2bba5' };
function crankArt(theta){
  const hub = [DIAL.y, DIAL.z], cs = Math.cos(theta), sn = Math.sin(theta), m = PALS[st.pal];
  const rot = ([a, b]) => [hub[0] + a*cs - b*sn, hub[1] + a*sn + b*cs];
  const X0 = W + 1.2, X1 = W + 2.4, X2 = W + 6;              // disc front, grip front
  // turning disc in the body colour, with a ring of finger notches
  let s = cylX(X0, X1, hub[0], hub[1], 7.2, matOf(m.l), toneI, 1.2, 36);
  for (let i=0;i<10;i++){ const a = theta + (i + .5)/10*2*Math.PI;
    s += fill(pd(on(PX(X1 + .05), ellUV(hub[0] + 6.1*Math.cos(a), hub[1] + 6.1*Math.sin(a), .55, .55, 8))), mix(m.l, '#000000', .2)); }
  // grip bar: rounded ends, extruded out of the disc
  const g = rrUV(-8.2, -2.7, 8.2, 2.7, 2.7, 7).map(rot), gA = on(PX(X1), g), gB = on(PX(X2), g);
  s += loft(gA, gB, n => toneI(n, GRIP));
  s += fill(pd(gB), GRIP.l) + hullInk([...gA, ...gB], 1.4) + ink(pd(gB), .9);
  // finger grooves on the grip face + a glint
  for (const u of [-5.4, 5.4]) s += ink(pd([[X2 + .05, ...rot([u, -1.3])], [X2 + .05, ...rot([u, 1.3])]], false), .6);
  s += `<path d="${pd([[X2 + .06, ...rot([-3.6, 1.4])], [X2 + .06, ...rot([-1.4, 1.4])]], false)}" stroke="#ffffff" stroke-width="1" opacity=".9" stroke-linecap="round"/>`;
  // hub cap
  s += cylX(X2, X2 + .7, hub[0], hub[1], 1.6, METAL, toneI, .8, 14);
  return s;
}
function coinArt(){
  if (st.coinT == null) return '';
  const t = st.coinT, zc = (SLOT[1] + SLOT[3])/2;
  let x, z;
  if (t < .45){ const k = ease(t/.45); x = lerp(W + 12, W + 4, k); z = lerp(zc + 8, zc, k) + 3*Math.sin(Math.PI*k); }
  else { const k = ease((t-.45)/.55); x = lerp(W + 4, W - 2, k); z = zc; }
  const yf = facing([0,1,0]) ? 1 : -1;            // the coin face toward the viewer
  const A = on(PY(20 - .4*yf), ellUV(x, z, 2.3, 2.3, 18)), B = on(PY(20 + .4*yf), ellUV(x, z, 2.3, 2.3, 18));
  let s = loft(A, B, n => toneI(n, COIN)) + fill(pd(B), COIN.l) + ink(sp(hull([...A,...B].map(p => P(...p)))), .8) + ink(pd(on(PY(20 + .45*yf), ellUV(x, z, 1.4, 1.4, 14))), .45);
  return clipTo(on(PY(20), rectUV(W + 1.05, 0, W + 40, 120)), s);
}
function flapArt(){
  const ph = flapAngle(), d = [Math.sin(ph), 0, -Math.cos(ph)], n = [Math.cos(ph), 0, Math.sin(ph)], t = 1;
  const Q = (s, w, y) => [HINGE[0] + s*d[0] + w*n[0], y, HINGE[1] + s*d[2] + w*n[2]];
  const y0 = CH.y0 + .6, y1 = CH.y1 - .6, L = FLAP_L, MAT = { l:'#6a6460', m:'#4b4642', d:'#2e2b28' };
  let s = '';
  if (vis(d)) s += shape([Q(L,0,y0),Q(L,0,y1),Q(L,t,y1),Q(L,t,y0)], toneI(d, MAT), .9);
  s += fill(pd([Q(0,t,y0),Q(0,t,y1),Q(L,t,y1),Q(L,t,y0)]), MAT.m, 'fill-opacity=".42"') + ink(pd([Q(0,t,y0),Q(0,t,y1),Q(L,t,y1),Q(L,t,y0)]), 1.1);
  const ys = facing([0,1,0]) ? y1 : y0;            // the flap edge toward the viewer
  s += shape([Q(0,0,ys),Q(L,0,ys),Q(L,t,ys),Q(0,t,ys)], MAT.l, .7);
  s += fill(pd([Q(L*.2,t+.05,y0+2),Q(L*.2,t+.05,y0+5),Q(L*.85,t+.05,y0+10),Q(L*.85,t+.05,y0+7)]), '#ffffff', 'opacity=".3"');
  s += shape([Q(L-2.4,t+.05,16.5),Q(L-2.4,t+.05,23.5),Q(L-1,t+.05,23.5),Q(L-1,t+.05,16.5)], MAT.d, .6);
  s += cylX(W, W+1.8, CH.y0 + .2, CH.z1, .9, METAL, toneI, .7, 10) + cylX(W, W+1.8, CH.y1 - .2, CH.z1, .9, METAL, toneI, .7, 10);
  return s;
}

/* ---------- globe ---------- */
function globeLight(){   // screen direction toward the sun (follows the light slider; L is already in viewer space)
  const d = [(L[0]-L[1])*C, (L[0]+L[1])*S - L[2]], l = Math.hypot(...d); return [d[0]/l, d[1]/l];
}
function pileNow(){
  const T = st.turn;
  let list = st.pile.map(c => ({ ...c }));
  if (T){
    const t = T.t;
    if (t >= .5){ const k = ease(clamp((t - .5)/.45));
      list = T.next.map(c => { const o = st.pile.find(q => q.id === c.id); return { ...c, p:o.p.map((v,i) => lerp(v, c.p[i], k)) }; }); }
    const amp = .55*Math.sin(Math.PI*t);
    list.forEach(c => { const h = c.id*1.7; c.p = [c.p[0] + amp*Math.sin(t*23 + h), c.p[1] + amp*Math.cos(t*19 + h*1.3), c.p[2] + amp*.5*Math.abs(Math.sin(t*29 + h))]; });
  }
  return list;
}
function globeArt(){
  const [X, Y] = P(...G), R = GR*1.2247, l = globeLight();
  // the glass is a sphere cut off by the floor plane: its outline is the circle down to where it is tangent to the
  // ellipse of the glass foot, then the front arc of that ellipse (same on screen in every view)
  const h = G[2] - FLOOR, xt = Math.sqrt(2 - 3*(h/GR)**2)*C*GR, yt = 1.5*h;
  const ea = GLASS_R*1.2247, eb = GLASS_R*.7071, Yc = Y + h, th = Math.atan2(yt, xt);
  const tL = Math.atan2(yt - h, -xt), tR = Math.atan2(yt - h, xt);
  const circ = Array.from({length:61}, (_,i) => { const a = th - (Math.PI + 2*th)*i/60; return [X + R*Math.cos(a), Y + R*Math.sin(a)]; });
  const foot = Array.from({length:25}, (_,i) => { const t = Math.atan2(Math.sin(tL)/eb, Math.cos(tL)/ea) + (Math.atan2(Math.sin(tR)/eb, Math.cos(tR)/ea) - Math.atan2(Math.sin(tL)/eb, Math.cos(tL)/ea))*i/24; return [X + ea*Math.cos(t), Yc + eb*Math.sin(t)]; });
  const T = poly([...circ, ...foot]);
  let s = `<clipPath id="cGlobe"><path d="${T}"/></clipPath>`;
  let inn = C2([X,Y], R, '#c9e3ea', 'opacity=".6"');
  // far wall of the glass: a soft back rim
  inn += `<path d="M${f(X-R)} ${f(Y)}a${f(R)} ${f(R)} 0 1 0 ${f(2*R)} 0a${f(R)} ${f(R)} 0 1 0 ${f(-2*R)} 0Z M${f(X-R*.93)} ${f(Y+R*.03)}a${f(R*.93)} ${f(R*.93)} 0 1 0 ${f(2*R*.93)} 0a${f(R*.93)} ${f(R*.93)} 0 1 0 ${f(-2*R*.93)} 0Z" fill="#b6d4dc" fill-rule="evenodd" opacity=".35"/>`;
  const caps = pileNow().sort((a,b) => depthOf(a.p) - depthOf(b.p));
  for (const c of caps) inn += capsuleArt(c.p, c.r, c.k, c.col, .85);
  s += `<g clip-path="url(#cGlobe)">${inn}</g>`;
  // front glass: tint, shadow-side rim, big curved highlight + glint
  let gl = C2([X,Y], R, '#cfe9f0', 'opacity=".16"');
  const so = [X + l[0]*R*.16, Y + l[1]*R*.16];
  gl += `<path d="M${f(X-R)} ${f(Y)}a${f(R)} ${f(R)} 0 1 0 ${f(2*R)} 0a${f(R)} ${f(R)} 0 1 0 ${f(-2*R)} 0Z M${f(so[0]-R*.9)} ${f(so[1])}a${f(R*.9)} ${f(R*.9)} 0 1 0 ${f(2*R*.9)} 0a${f(R*.9)} ${f(R*.9)} 0 1 0 ${f(-2*R*.9)} 0Z" fill="#4f7d8a" fill-rule="evenodd" opacity=".3"/>`;
  // curved highlight: a band inside the rim on the lit side
  const ang = Math.atan2(l[1], l[0]), band = [];
  const arcBand = (a0, a1, r0, th) => { const b = [];
    for (let i=0;i<=24;i++){ const a = a0 + (a1-a0)*i/24; b.push([X + Math.cos(a)*R*r0, Y + Math.sin(a)*R*r0]); }
    for (let i=24;i>=0;i--){ const a = a0 + (a1-a0)*i/24, w = Math.pow(Math.sin(Math.PI*i/24), .7); b.push([X + Math.cos(a)*R*(r0 - th*w), Y + Math.sin(a)*R*(r0 - th*w)]); }
    return poly(b); };
  // a crisp curved highlight on the upper shoulder toward the sun (clear of the cap), a glint, a faint reflection opposite
  const sd = l[0] >= 0 ? 1 : -1, ac = (-90 + sd*50)*Math.PI/180;
  gl += fill(arcBand(ac - .62, ac + .5, .91, .15), '#ffffff', 'opacity=".9"');
  gl += fill(arcBand(ac + sd*.66, ac + sd*.86, .91, .07), '#ffffff', 'opacity=".75"');
  const g1 = [X + Math.cos(ac - sd*.05)*R*.62, Y + Math.sin(ac - sd*.05)*R*.62];
  gl += C2(g1, R*.055, '#ffffff', 'opacity=".9"');
  const ref = [];
  for (let i=0;i<=14;i++){ const a = ac + Math.PI - .5 + 1*i/14; ref.push([X + Math.cos(a)*R*.84, Y + Math.sin(a)*R*.84]); }
  gl += `<path d="${poly(ref, false)}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>`;
  s += act('globe', `<g pointer-events="none" clip-path="url(#cGlobe)">${gl}</g>` + fill(T, 'transparent'));
  s += ink(poly(foot, false), 1.2) + ink(poly(circ, false), 2.6);
  return s;
}

/* ---------- the dispensed capsule (rolling, resting or open) ---------- */
function groundCapsule(){
  if (st.roll){
    const { c, k } = rollPose(st.roll.t);
    return capsuleArt(c, CAP_R, k, st.roll.col, 1);
  }
  if (!st.out) return '';
  // the resting / opened capsule is shown the same way from every side (the prize faces whoever looks)
  return asSeen(REST, restCapsule);
}
function restCapsule(c){
  const o = st.out.open, col = st.out.col, cm = matOf(col), pale = mix(col, '#ffffff', .8);
  if (o <= 0) return act('capsule', capsuleArt(c, CAP_R, [0,0,-1], col, 1));
  const ph = 112*ease(clamp(o))*Math.PI/180, hd = norm([1,-1,0]);
  const p = add(scl([0,0,1], Math.cos(ph)), scl(hd, Math.sin(ph)));
  const h = add(c, scl(hd, CAP_R)), ctop = add(h, add(scl(hd, -CAP_R*Math.cos(ph)), [0,0,CAP_R*Math.sin(ph)]));
  const top = hemiArt(ctop, CAP_R, p, pale, mix(col, '#ffffff', .62), .9);
  const prizeZ = c[2] - 4.2 + 3.2*ease(clamp((o - .25)/.75));
  // bottom bowl: inside (rim ellipse), prize, then the outer front crescent over the prize's foot
  const { X, Y, R, mn, arc } = rimFrame(c, CAP_R, [0,0,-1]);
  const ell = poly(arc(0, 2*Math.PI, mn, 32));
  let bowl = fill(ell, mix(col, '#000000', .12)) + `<path d="${ell}" fill="none" stroke="${INK}" stroke-width=".7"/>`;
  bowl += prizeArt(st.out.prize, [c[0], c[1], prizeZ]);
  const cres = poly([...arc(0, Math.PI, R), ...arc(Math.PI, 0, mn)]);
  bowl += fill(cres, cm.l);
  bowl += sphereShade(X, Y, R, false).replace('opacity=".16"', 'opacity=".16" clip-path="url(#cBowl)"');
  bowl += `<clipPath id="cBowl"><path d="${cres}"/></clipPath>`;
  bowl += C2([X + L2[0]*R*.3 + R*.35, Y + R*.55], R*.11, '#ffffff', 'opacity=".75"');
  bowl += ink(cres, 1);
  return act('capsule', bowl + top);
}

/* ---------- the faces of the base ---------- */
// side stickers: a cream sticker that takes on the face's shade, so it stays readable on the dark side
function stickerOf(n, m){
  const t = tone(n, m), k = t === m.l ? .04 : t === m.m ? .18 : .3;
  return { face:t, stk:mix('#fff6e0', t, k), txt:mix(m.d, '#000000', .15), k };
}
// left side (+y): GACHA sticker with three capsules
function sideLeftArt(m){
  const { stk, txt, k } = stickerOf([0,1,0], m), on3 = uv => on(PY(D + .3), uv);
  let s = shape(on(PY(D + .15), rrUV(5, 7, W-5, 48, 5)), stk, 1.2);
  s += `<path d="${pd(on3(rrUV(6.9, 8.9, W-6.9, 46.1, 3.3)))}" fill="none" stroke="${mix(stk, '#000000', .28)}" stroke-width=".7" stroke-dasharray="1.6 1.3"/>`;
  s += txY(W/2, D + .35, 34.6, 'GACHA', 8.6, txt, 800);
  s += txY(W/2, D + .35, 29.4, 'CAPSULE · TOYS', 2.6, mix(txt, stk, .3), 700);
  for (const [x, col] of [[11.6, '#e2473a'], [20, '#f2c230'], [28.4, '#3e86d9']]){
    const z = 18.6, r = 3.3, c = mix(col, '#000000', k*.5);
    s += fill(pd(on3(ellUV(x, z, r, r, 22))), mix(c, '#ffffff', .72)) + fill(pd(on3(arcUV(x, z, r, 180, 360, 11))), c);
    s += fill(pd(on3(ellUV(x - 1.1, z + 1.4, .8, .55, 8))), '#ffffff', 'opacity=".8"');
    s += ink(pd(on3(ellUV(x, z, r, r, 22))), .8) + ink(pd(on3([[x-r, z], [x+r, z]]), false), .5);
  }
  s += txY(W/2, D + .35, 10.6, '1 PLAY 100¥', 2.4, mix(txt, stk, .3), 700);
  return s;
}
// right side (−y): the same sticker, a different doodle — a smiling capsule with sparkles
function sideRightArt(m){
  const { stk, txt, k } = stickerOf([0,-1,0], m), on3 = uv => on(PY(-.3), uv);
  let s = shape(on(PY(-.15), rrUV(5, 7, W-5, 48, 5)), stk, 1.2);
  s += `<path d="${pd(on3(rrUV(6.9, 8.9, W-6.9, 46.1, 3.3)))}" fill="none" stroke="${mix(stk, '#000000', .28)}" stroke-width=".7" stroke-dasharray="1.6 1.3"/>`;
  s += txR(W/2, -.35, 37.4, 'GACHA', 8.6, txt, 800);
  const cx = W/2, cz = 21, r = 7.4, col = mix('#38a565', '#000000', k*.5);
  s += fill(pd(on3(ellUV(cx, cz, r, r, 28))), mix(col, '#ffffff', .78));
  s += fill(pd(on3(arcUV(cx, cz, r, 180, 360, 14))), col);
  s += ink(pd(on3(ellUV(cx, cz, r, r, 28))), 1) + ink(pd(on3([[cx-r, cz], [cx+r, cz]]), false), .6);
  s += fill(pd(on3(arcUV(cx - 2.6, cz + 3.6, 1.6, 100, 170, 6).concat([[cx - 2.6, cz + 3.6]]))), '#ffffff', 'opacity=".75"');
  for (const sx of [-1, 1]){
    s += fill(pd(on3(ellUV(cx + sx*2.5, cz + 3.2, .75, .95, 10))), INK);
    s += fill(pd(on3(ellUV(cx + sx*4.5, cz + 1.4, 1.1, .7, 10))), '#f3a3a0');
  }
  s += ink(pd(on3(arcUV(cx, cz + 2.4, 1.5, 200, 340, 8)), false), .7);
  const star = (x, z, a, c) => { const p = []; for (let i=0;i<8;i++){ const ang = i*Math.PI/4, rr = i%2 ? a*.32 : a; p.push([x + rr*Math.cos(ang), z + rr*Math.sin(ang)]); } return shape(on3(p), c, .6); };
  s += star(9.5, 30, 2.6, '#f2c230') + star(31, 13.5, 2.1, '#3e86d9') + star(30.5, 29, 1.6, '#e2473a');
  s += fill(pd(on3(ellUV(10.5, 14, .7, .7, 8))), mix(stk, '#000000', .35)) + fill(pd(on3(ellUV(33, 22, .55, .55, 8))), mix(stk, '#000000', .35));
  return s;
}
// back (−x): service door with key lock + REFILL label, maker's sticker, coin-box hatch, corner screws
function backArt(m){
  const bf = tone([-1,0,0], m), X = x => PX(-x), dk = mix(bf, '#000000', .3);
  const screw = (y, z, r=.75) => shape(on(X(.25), ellUV(y, z, r, r, 10)), METAL.m, .6) + ink(pd(on(X(.3), [[y - r*.7, z], [y + r*.7, z]]), false), .45);
  let s = '';
  // service door
  s += shape(on(X(.15), rrUV(5, 17, 35, 48.5, 2.4)), mix(bf, '#ffffff', .06), 1.4);
  s += `<path d="${pd(on(X(.2), rrUV(6.3, 18.3, 33.7, 47.2, 1.6)))}" fill="none" stroke="${dk}" stroke-width=".7"/>`;
  for (const z of [21, 42.5]) s += shape(on(X(.3), rectUV(3.7, z, 6.3, z + 3.6)), METAL.m, .7) + ink(pd(on(X(.35), [[5, z], [5, z + 3.6]]), false), .45);
  // REFILL label
  s += shape(on(X(.3), rrUV(11, 39.6, 25, 45, 1.2)), '#fff4d6', .9);
  s += txB(-.45, 18, 41, 'REFILL', 3.4, m.d, 800);
  // key lock: a short metal barrel with a keyhole
  { const ly = 30, lz = 32, A = on(X(.1), ellUV(ly, lz, 2.2, 2.2, 18)), B = on(X(1.3), ellUV(ly, lz, 2.2, 2.2, 18));
    s += loft(A, B, n => toneI(n, METAL)) + fill(pd(B), toneI([-1,0,0], METAL)) + hullInk([...A, ...B], 1) + ink(pd(B), .7);
    s += ink(pd(on(X(1.35), ellUV(ly, lz, 1.5, 1.5, 16))), .4);
    s += fill(pd(on(X(1.4), ellUV(ly, lz + .45, .5, .5, 10))), '#26231f') + fill(pd(on(X(1.4), rectUV(ly - .25, lz - 1, ly + .25, lz + .45))), '#26231f'); }
  // maker's sticker
  s += shape(on(X(.3), rectUV(8.5, 21, 22.5, 29.5)), '#f7f3ea', .7);
  s += fill(pd(on(X(.35), rectUV(8.5, 27.6, 22.5, 29.5))), '#e2473a');
  s += txB(-.45, 15.5, 25.7, 'COLORFIG CO.', 1.7, INK, 800);
  s += txB(-.45, 15.5, 23.7, 'MODEL CG-07', 1.35, '#5b554a', 700);
  s += txB(-.45, 15.5, 21.9, 'No. 0723 · 100¥', 1.2, '#5b554a', 600);
  // coin-box hatch
  s += shape(on(X(.2), rrUV(9, 3.6, 31, 13.4, 1.4)), METAL.m, 1.1);
  s += ink(pd(on(X(.25), rrUV(10, 4.6, 30, 12.4, 1))), .45);
  s += shape(on(X(.3), rrUV(12.5, 7, 21.5, 9, 1)), '#26231f', .6);
  s += txB(-.4, 17, 10.3, 'COIN BOX', 1.6, '#4a4540', 800);
  s += shape(on(X(.3), ellUV(26.5, 8.5, 1.3, 1.3, 14)), METAL.l, .7) + fill(pd(on(X(.35), rectUV(26.3, 7.7, 26.7, 9.3))), '#26231f');
  for (const [y, z] of [[10.2, 5.1], [29.8, 5.1], [10.2, 11.9], [29.8, 11.9]]) s += screw(y, z, .45);
  // corner screws of the back panel
  for (const [y, z] of [[2.6, 2.6], [37.4, 2.6], [2.6, 49.4], [37.4, 49.4]]) s += screw(y, z);
  return s;
}

/* ---------- scene ---------- */
// a dome (hemisphere, pole up) standing on base centre c
function domeArt(c, r, mm){
  const { X, Y, R, mn, arc } = rimFrame(c, r, [0,0,1]);
  const out = poly([...arc(0, Math.PI, R, 20), ...arc(Math.PI, 2*Math.PI, mn, 20)]);
  return `<clipPath id="cDome"><path d="${out}"/></clipPath>` + fill(out, mm.l)
       + `<g clip-path="url(#cDome)">${sphereShade(X, Y, R, false)}</g>`
       + C2([X + L2[0]*R*.4, Y - R*.42], R*.15, '#ffffff', 'opacity=".85"') + ink(out, 1.2);
}
// is a free-standing point (outside the base's footprint) in front of the machine in this view?
const inFront = p => (p[0] > W && facing([1,0,0])) || (p[0] < 0 && facing([-1,0,0])) || (p[1] > D && facing([0,1,0])) || (p[1] < 0 && facing([0,-1,0]));
const ringA = (z, r, n=48) => on(PZ(z), ellUV(CX, CY, r, r, n));
const PRIZE_ICON = {
  duck: '<svg width="22" height="22" viewBox="0 0 22 22" style="vertical-align:middle;margin-left:3px" fill-rule="evenodd" stroke="#231e16" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M4 13c0-3 3-4 6-4 1-3 4-4 6-2 1 1 1 3 0 4l3 .5-3 1.5c0 3-3 5-7 5-3 0-5-2-5-5z" fill="#f2c230"/><circle cx="14" cy="8.5" r=".9" fill="#231e16" stroke="none"/></svg>',
  star: '<svg width="22" height="22" viewBox="0 0 22 22" style="vertical-align:middle;margin-left:3px" fill-rule="evenodd" stroke="#231e16" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M11 2.5l2.5 5.4 5.9.7-4.4 4 1.2 5.8L11 15.5l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z" fill="#f4b829"/></svg>',
  cat: '<svg width="22" height="22" viewBox="0 0 22 22" style="vertical-align:middle;margin-left:3px" fill-rule="evenodd" stroke="#231e16" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M4 18V8l2.5-4.5L9 7h4l2.5-3.5L18 8v10z" fill="#fbf7ea"/><circle cx="8.5" cy="11" r=".9" fill="#231e16" stroke="none"/><circle cx="13.5" cy="11" r=".9" fill="#231e16" stroke="none"/><path d="M10 14h2" fill="none"/></svg>',
  robot: '<svg width="22" height="22" viewBox="0 0 22 22" style="vertical-align:middle;margin-left:3px" fill-rule="evenodd" stroke="#231e16" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M11 2.5v3" fill="none"/><circle cx="11" cy="2.5" r="1.2" fill="#e2483d"/><rect x="4.5" y="5.5" width="13" height="10" rx="2" fill="#a9b1b4"/><rect x="7" y="8.5" width="8" height="3.5" rx="1" fill="#2b2523"/><path d="M7 15.5v3M15 15.5v3" fill="none"/></svg>',
  dino: '<svg width="22" height="22" viewBox="0 0 22 22" style="vertical-align:middle;margin-left:3px" fill-rule="evenodd" stroke="#231e16" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M3 17c1-4 4-6 8-6l1-4c1-2 4-3 6-1 1 1 0 3-2 3l-1 2c2 1 3 3 3 6h-3l-1-2h-4l-1 2z" fill="#5cb87a"/><circle cx="15.5" cy="6.8" r=".8" fill="#231e16" stroke="none"/></svg>' };   // small drawn icons for the collection list in the panel
function scene(st, m){
  let s = '';
  const sph = [];
  for (let i=0;i<16;i++){ const a = i/16*2*Math.PI; for (const zz of [-.6, 0, .6, .9]) { const rr = GR*Math.sqrt(1 - zz*zz); sph.push([G[0] + rr*Math.cos(a), G[1] + rr*Math.sin(a), G[2] + GR*zz]); } }
  s += castShadow([...on(PX(0), OUT), ...on(PX(W), OUT), ...ringA(FLOOR, FL_R, 24), ...sph, [CX, CY, Z_TOP]]);
  const cap = st.roll ? rollPose(st.roll.t).c : st.out ? REST : null;
  if (cap && (!st.roll || st.roll.t > .45)) s += castShadow(ellUV(cap[0], cap[1], CAP_R*.95, CAP_R*.95, 16).map(([x,y]) => [x, y, Math.max(0, cap[2] - CAP_R)]));

  const front = facing([1,0,0]), F = PX(W), fr = tone([1,0,0], m);
  const inChute = st.roll && rollPose(st.roll.t).c[0] < W - 1.2;
  const rc = st.roll && !inChute ? rollPose(st.roll.t).c : null;
  // the capsule resting on the ground, when it is behind the machine in this view
  const restFront = st.out && !st.roll && inFront(REST);
  if (st.out && !st.roll && !restFront) s += groundCapsule();

  // things mounted on the front: with the front turned away they go before the body so it hides them
  const panelArt = () => {
    // coin slot plate
    let sl = box(W, 15.4, 37.3, W + 1, 24.6, 43.7, METAL, toneI, .9);
    sl += shape(on(PX(W + 1.05), rrUV(...SLOT, .7)), '#26231f', .6);
    for (const y of [16.5, 23.5]) sl += fill(pd(on(PX(W + 1.05), ellUV(y, 40.3, .45, .45, 8))), METAL.d);
    // dial escutcheon with tick ring
    let pl = cylX(W, W + 1.2, DIAL.y, DIAL.z, DIAL.r, METAL, toneI, 1.3, 40);
    for (let i=0;i<16;i++){ const a = i/16*2*Math.PI, r0 = DIAL.r - .4, r1 = DIAL.r - 1.1;
      pl += ink(pd([[W + 1.25, DIAL.y + r0*Math.cos(a), DIAL.z + r0*Math.sin(a)], [W + 1.25, DIAL.y + r1*Math.cos(a), DIAL.z + r1*Math.sin(a)]], false), .45); }
    panelArt.slot = act('slot', sl) + coinArt();   // the coin slot plate is sorted with the crank (see frontStack)
    return pl;
  };
  const flapAndRoll = () => (rc && rc[0] < W + 9) ? groundCapsule() + act('flap', flapArt())
                                                 : act('flap', flapArt()) + (rc ? groundCapsule() : '');
  const lipArt = () => box(W, CH.y0 - 1.5, CH.z0 - 2, W + 5, CH.y1 + 1.5, CH.z0, METAL, toneI, 1);
  // coin slot plate (high), crank (middle) and chute flap (low) are stacked by height on the front, so they are sorted
  // with boxes: from above the slot plate covers the crank's top, and the crank covers the flap's hinge pins
  const frontStack = () => { const pl = panelArt();
    return pl + byDepth([
      { box:[[W, 15.4, 37.3], [W + 1.6, 24.6, 43.7]], svg: panelArt.slot },
      { box:[[W, DIAL.y - 10.5, DIAL.z - 8.9], [W + 8, DIAL.y + 10.5, DIAL.z + 8.9]], svg: act('crank', crankArt(st.crank)) },
      { box:[[W, CH.y0 - 2, 0], [W + 9, CH.y1 + 2, CH.z1 + .8]], svg: flapAndRoll() } ]); };
  if (!front) s += lipArt() + frontStack();

  // the base: ONE flush extrusion (body + lid), so its silhouette is exactly its convex hull
  const xr0 = s.length;   // the case starts here: in see-through it becomes a ghost over the working parts
  s += extrude(OUT, 0, W, m);
  if (front){
    // chute opening: cavity, jamb, floor, capsule inside — then the front face with the hole
    const jy = facing([0,1,0]) ? CH.y0 : CH.y1;
    let ch = fill(pd(on(PX(W-13), CHUTE)), mix(m.d, '#000000', .3));
    ch += face(pd([[W-13,jy,CH.z0],[W,jy,CH.z0],[W,jy,CH.z1],[W-13,jy,CH.z1]]), mix(m.d, '#000000', .45));
    ch += face(pd([[W-13,CH.y0,CH.z0],[W,CH.y0,CH.z0],[W,CH.y1,CH.z0],[W-13,CH.y1,CH.z0]]), mix(m.d, '#ffffff', .1));
    if (inChute) ch += groundCapsule();
    s += clipTo(on(PX(W), CHUTE), ch);
    s += `<path d="${pd(on(F, OUT))}${pd(on(F, CHUTE))}" fill="${fr}" fill-rule="evenodd"/>`;
  }
  if (facing([-1,0,0])) s += fill(pd(on(PX(0), OUT)), tone([-1,0,0], m));
  // lid seam on each visible face
  const seam = pts => line(pts, 1);
  if (front) s += seam([[W, 0, BH], [W, D, BH]]);
  if (facing([-1,0,0])) s += seam([[0, 0, BH], [0, D, BH]]);
  if (facing([0,1,0])) s += seam([[0, D, BH], [W, D, BH]]) + sideLeftArt(m);
  if (facing([0,-1,0])) s += seam([[0, 0, BH], [W, 0, BH]]) + sideRightArt(m);
  if (facing([-1,0,0])) s += backArt(m);
  // silhouette + face outlines (before anything that sticks out in front of them)
  s += hullInk([...on(PX(0), OUT), ...on(PX(W), OUT)], 2.8);
  if (front) s += ink(pd(on(F, OUT)), 2);
  { const k = ease(XR_OPTS.getSt().xr || 0); if (k > 0) s = s.slice(0, xr0) + xrGhost(s.slice(xr0), '', k, OUT, 0, W, m) + `<g opacity="${f(k)}">${XR_OPTS.mech(XR_OPTS.getSt(), k)}</g>`; }   // inside parts over the ghost; outside parts (dial, plate, flap) come after
  if (facing([-1,0,0])) s += `<g opacity="${f(1 - .8*ease(XR_OPTS.getSt().xr || 0))}">${ink(pd(on(PX(0), OUT)), 2)}</g>`;   // the back's outline fades with the case

  if (front){
    const dk = mix(fr, '#000000', .3);
    // inset panel groove
    s += `<path d="${pd(on(PX(W + .05), rrUV(2.6, 1.6, 37.4, BH - 2.2, 2.4)))}" fill="none" stroke="${dk}" stroke-width=".9"/>`;
    s += `<path d="${pd(on(PX(W + .05), rrUV(3.2, 2.2, 36.8, BH - 2.8, 1.9)))}" fill="none" stroke="#ffffff" stroke-width=".6" opacity=".35"/>`;
    // chute: metal bezel around the opening + the opening's ink
    s += `<path d="${pd(on(PX(W + .1), rrUV(CH.y0 - 1.5, CH.z0 - 1.5, CH.y1 + 1.5, CH.z1 + 1.5, 4.9)))}${pd(on(PX(W + .1), CHUTE))}" fill="${toneI([1,0,0], METAL)}" fill-rule="evenodd"/>`;
    s += ink(pd(on(PX(W + .1), rrUV(CH.y0 - 1.5, CH.z0 - 1.5, CH.y1 + 1.5, CH.z1 + 1.5, 4.9))), 1) + ink(pd(on(F, CHUTE)), 1.6);
    s += lipArt();
    // price label: lights up with a coin in
    const lit = st.coin;
    if (lit) s += fill(pd(on(PX(W + .2), rrUV(6.5, 42.6, 33.5, 52.6, 4))), '#ffe27a', 'opacity=".45"');
    s += shape(on(PX(W + .3), rrUV(9, 44.6, 31, 50.8, 1.6)), lit ? '#ffe58a' : '#fff4d6', 1.1);
    s += tx(W + .45, 20, 46.2, '100¥', 4.6, lit ? '#c8322a' : m.d, 800);
    s += shape(on(PX(W + .3), ellUV(5.4, 47.7, 1.25, 1.25, 12)), lit ? '#43c25c' : '#e2483d', .7);
    if (lit){ const [lx, ly] = P(W + .4, 5.4, 47.7); s += C2([lx, ly], 3.4, '#8af0ae', 'opacity=".35"'); }
    // turn arrow: clockwise, on the viewer-right side of the dial
    const AR = 11.4, arr = []; for (let i=0;i<=12;i++){ const a = (138 + 78*i/12)*Math.PI/180; arr.push([W + .3, DIAL.y + AR*Math.cos(a), DIAL.z + AR*Math.sin(a)]); }
    s += `<path d="${pd(arr, false)}" fill="none" stroke="${dk}" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="2 1.6"/>`;
    { const a = 222*Math.PI/180, b = 213*Math.PI/180, tip = [DIAL.y + AR*Math.cos(a), DIAL.z + AR*Math.sin(a)];
      s += fill(pd([[W + .3, ...tip], [W + .3, DIAL.y + (AR + 1.4)*Math.cos(b), DIAL.z + (AR + 1.4)*Math.sin(b)], [W + .3, DIAL.y + (AR - 1.4)*Math.cos(b), DIAL.z + (AR - 1.4)*Math.sin(b)]]), dk); }
    s += frontStack();
  }

  // collar (painted) + metal flange the glass sits on
  const tv = unrot([1,1,0]), a0 = Math.atan2(tv[1], tv[0]) - Math.PI/2;
  const half = (z, r, n=28) => Array.from({length:n+1}, (_,i) => { const a = a0 + Math.PI*i/n; return [CX + r*Math.cos(a), CY + r*Math.sin(a), z]; });
  const band = (z0, z1, r, mm, sh, w) => loft(ringA(z0, r), ringA(z1, r), n => sh(n, mm)) + ink(pd([...half(z0, r), ...half(z1, r).reverse()]), w);
  const collar = () => band(TOP, COLLAR_Z, COLLAR_R, m, tone, 1.5) + band(COLLAR_Z, FLOOR, FL_R, METAL, toneI, 1.3);
  const topM = toneI([0,0,1], METAL);
  s += collar();
  s += `<path d="${pd(ringA(FLOOR, FL_R))}${pd(ringA(FLOOR, GLASS_R))}" fill="${topM}" fill-rule="evenodd"/>` + ink(pd(ringA(FLOOR, FL_R)), 1.3);
  s += fill(pd(ringA(FLOOR, GLASS_R)), mix(tone([0,0,1], m), '#000000', .2)) + fill(pd(ringA(FLOOR + .05, 4.8, 24)), mix(m.d, '#000000', .3));

  // globe + capsules (its outline already stops at the glass foot, so nothing has to be drawn over it)
  s += globeArt();

  // cap on top of the globe: metal ring, painted dome, little knob
  s += cyl(CX, CY, CAP0, CAP0 + 1.8, CAP_RR, METAL, toneI, 1.2, 32);
  s += domeArt([CX, CY, CAP0 + 1.8], DOME_R, matOf(m.l));
  s += ball([CX, CY, CAP0 + 1.8 + DOME_R + 1.1], 1.5, METAL, .9);

  // dispensed capsule on the ground, in front of the machine
  if (restFront) s += groundCapsule();
  return s;
}
/* ---------- behaviour ---------- */
let UI;
const readout = st => {
  if (st.coinT != null) return 'Clink — coin going in…';
  if (st.turn){ const n = Math.min(4, Math.floor(st.turn.t*4 + .15)); return 'Turning — ' + (n ? Array(n).fill('click').join(' · ') : '…'); }
  if (st.roll) return st.roll.t < .3 ? 'Ka-chunk! Something is coming down the chute…' : 'A capsule rolls out…';
  if (st.out){
    if (st.out.open >= 1) return `You got: ${PRIZES[st.out.prize]}${st.out.prize === 'star' ? ' (rare!)' : ''} — click to clear`;
    if (st.out.open > 0) return 'Opening…';
    return 'A capsule! Click it to open';
  }
  if (!st.pile.length) return 'Sold out — refill the globe';
  return st.coin ? 'Coin in — the price lights up. Turn the crank' : `Insert a coin (100¥) — ${st.pile.length} capsules left`;
};
function kick(){
  if (st._run) return; st._run = true;
  UI.animate(dt => { const more = step(dt); if (!more) st._run = false; return more; });
}
function step(dt){
  let a = false;
  if (st.coinT != null){ st.coinT += dt/.75; a = true; if (st.coinT >= 1){ st.coinT = null; st.coin = true; } }
  if (st.jig){ st.jig.t += dt/.5; const t = st.jig.t; st.crank = .22*Math.sin(t*Math.PI*3)*(1-t); a = true; if (t >= 1){ st.jig = null; st.crank = 0; } }
  if (st.turn && !st.turn.frozen){
    st.turn.t += dt/2; a = true;
    const t = clamp(st.turn.t), q = Math.min(3.999, t*4);
    st.crank = (Math.floor(q) + ease(clamp((q % 1)/.6)))*Math.PI/2;
    if (t >= 1){ st.crank = 0; st.pile = st.turn.next; st.roll = { t:0, col:st.turn.drop.col }; st.turn = null; }
  }
  if (st.roll){ st.roll.t += dt/1.6; a = true;
    if (st.roll.t >= 1){ st.out = { col:st.roll.col, prize:PRIZE_KEYS[Math.floor(Math.random()*PRIZE_KEYS.length)], open:0 }; st.roll = null; st.coin = false; } }
  if (st.out && st.out.opening){ st.out.open = Math.min(1, st.out.open + dt/.8); a = true; if (st.out.open >= 1) st.out.opening = false; }
  return a;
}
const busy = () => st.coinT != null || (st.turn && !st.turn.frozen) || st.roll || st.jig;
function insertCoin(st, ui){
  if (busy()) return;
  if (st.coin) return ui.flash('There is already a coin in — turn the crank');
  if (!st.pile.length) return ui.flash('Sold out — refill first');
  if (st.out) return ui.flash('Take your capsule first');
  st.coinT = 0; kick();
}
function prepareTurn(seed){
  const pile = st.pile, low = pile.reduce((a,b) => (b.p[2] - .3*Math.hypot(b.p[0]-CX, b.p[1]-CY)) < (a.p[2] - .3*Math.hypot(a.p[0]-CX, a.p[1]-CY)) ? b : a);
  const rest = pile.filter(c => c !== low).sort((a,b) => a.p[2] - b.p[2]);
  return { t:0, drop:low, next:settle(rest, rng(seed)) };
}
function turnCrank(st, ui){
  if (st.turn && st.turn.frozen){ st.turn.frozen = false; kick(); return; }
  if (busy()) return;
  if (st.out) return ui.flash('Take your capsule first — click it');
  if (!st.coin){ ui.flash('Insert a coin first'); st.jig = { t:0 }; kick(); return; }
  if (!st.pile.length) return ui.flash('Sold out');
  st.turn = prepareTurn(st.served++ * 31 + 5); kick();
}
function clickCapsule(st, ui){
  if (!st.out || st.roll) return;
  if (st.out.open <= 0){ st.out.opening = true; kick(); return; }
  if (st.out.open >= 1){ const n = PRIZES[st.out.prize]; st.collected.push(st.out.prize); st.out = null; ui.flash(`${n} added to your collection`); }
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

/* ---------- see-through: how a real capsule machine works ----------
   Parts (each held by another; the coin and the capsule each have a real path):
   CRANK   dial (outside) . crank shaft through a bearing in the chassis plate . coin wheel on the shaft with a coin
           notch . lock pawl on a pivot screw with its spring and the dog that drops into the notch . small gear (pinion)
   CHASSIS plate behind the front wall on four standoffs . coin guide from the slot down to the coin wheel
   TURN    crown gear under the turntable (one crank turn = a quarter turn) . vertical shaft . bearing in the deck .
           deck plate with the drop hole . turntable with four capsule pockets . stirrer wire on top of the shaft
   CAPSULE drop chute (four walls) under the hole . ramp to the flat chute floor . the flap (outside)
   COINS   coin chute from under the coin wheel . coin box on the floor with its inlet */
const GBRASS = { l:'#f2d37a', m:'#d7af4a', d:'#9a7a2a' }, GSTEEL = { l:'#b4bcbf', m:'#848d91', d:'#555d61' }, GDARK = { l:'#5c6369', m:'#3b4146', d:'#24282c' };
const gBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - .8), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + .8)];
const SHAFT_Z = DIAL.z, CW = { x0:35.6, x1:37.4, r:6 }, PIN = { x0:23, x1:24.2, r:1.1 }, CROWN = { z0:SHAFT_Z + 1.1, z1:SHAFT_Z + 2.7, r:4.4 };
const DECK = { z0:46.6, z1:48 }, TT = { z0:48.5, z1:51, r:14, pr:10.5, hr:3.2 }, HOLE = [CX, CY - 10.5];
const DROPC = { x0:14, x1:26, y0:3.4, y1:15.4, z0:19, z1:DECK.z0 }, RAMP_X = 28, CPLATE = { x0:33.4, x1:34.4, y0:8, y1:32, z0:24, z1:44 };
const CBOX = [6, 31, 1, 30, 38, 11];
function gashMech(st){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const th = st.crank || 0, wa = th / 4;                       // crank angle; the turntable turns a quarter as far
  const turning = !!st.turn, locked = !st.coin && st.coinT == null;
  const glass = (pts, c = '#e9eef0') => `<g opacity=".4">${fill(pd(pts), c)}</g>` + ink(pd(pts), .6);
  // ---- chassis plate on four standoffs from the front wall; bearing for the crank shaft
  bx(CPLATE.x0, CPLATE.y0, CPLATE.z0, CPLATE.x1, CPLATE.y1, CPLATE.z1, GSTEEL, .8);
  for (const [y, z] of [[CPLATE.y0 + 1.5, CPLATE.z0 + 1.5], [CPLATE.y1 - 1.5, CPLATE.z0 + 1.5], [CPLATE.y0 + 1.5, CPLATE.z1 - 1.5], [CPLATE.y1 - 1.5, CPLATE.z1 - 1.5]])
    put([[CPLATE.x1, y - .6, z - .6], [W - .4, y + .6, z + .6]], rod([CPLATE.x1, y, z], [W - .4, y, z], .55, METAL, toneI, .5));
  put([[CPLATE.x0 - .8, DIAL.y - 2.2, SHAFT_Z - 2.2], [CPLATE.x1 + .8, DIAL.y + 2.2, SHAFT_Z + 2.2]], cylX(CPLATE.x0 - .8, CPLATE.x1 + .8, DIAL.y, SHAFT_Z, 2.2, GBRASS, toneI, .7, 18));
  // crank shaft from the dial back to the small gear
  put([[PIN.x1, DIAL.y - 1, SHAFT_Z - 1], [W, DIAL.y + 1, SHAFT_Z + 1]], rod([W, DIAL.y, SHAFT_Z], [PIN.x1, DIAL.y, SHAFT_Z], .9, METAL, toneI, .7));
  // coin wheel: a disc on the shaft with one notch; it turns with the crank
  let cw = cylX(CW.x0, CW.x1, DIAL.y, SHAFT_Z, CW.r, GBRASS, toneI, .8, 32);
  const nA = Math.PI/2 + th, nP = [DIAL.y + CW.r*Math.cos(nA), SHAFT_Z + CW.r*Math.sin(nA)];
  if (facing([1,0,0])){
    cw += shape(on(PX(CW.x1 + .05), ellUV(nP[0] - 1.2*Math.cos(nA), nP[1] - 1.2*Math.sin(nA), 1.6, 1.6, 12)), '#3a3226', .5);
    for (let i = 0; i < 12; i++){ const a = th + i/12*2*Math.PI; cw += line([[CW.x1 + .05, DIAL.y + 4.2*Math.cos(a), SHAFT_Z + 4.2*Math.sin(a)], [CW.x1 + .05, DIAL.y + 5.2*Math.cos(a), SHAFT_Z + 5.2*Math.sin(a)]], .3); }
  }
  const coinOnWheel = st.coin || (turning && th < Math.PI);
  if (coinOnWheel && facing([1,0,0])){ const r = CW.r - 1.4; cw += shape(on(PX(CW.x1 + .2), ellUV(DIAL.y + r*Math.cos(nA), SHAFT_Z + r*Math.sin(nA), 2.2, 2.2, 16)), COIN.m, .6); }
  put([[CW.x0, DIAL.y - CW.r, SHAFT_Z - CW.r], [CW.x1, DIAL.y + CW.r, SHAFT_Z + CW.r]], cw);
  // lock pawl: a bar on a pivot screw, pulled down by a spring; its dog sits in the notch until a coin lifts it
  const PV = [30, 40.5], lift = locked ? 0 : .22, a0 = Math.atan2(SHAFT_Z + CW.r*.72 - PV[1], DIAL.y + CW.r*.72 - PV[0]) + lift;
  const tip = [PV[0] + 8*Math.cos(a0), PV[1] + 8*Math.sin(a0)], px = (CPLATE.x1 + CW.x0)/2;
  const pawlM = locked ? matOf('#e2483d') : matOf('#38a565');
  put([[CPLATE.x1, Math.min(PV[0], tip[0]) - .9, Math.min(PV[1], tip[1]) - .9], [CW.x0, Math.max(PV[0], tip[0]) + .9, Math.max(PV[1], tip[1]) + .9]],
    rod([px, PV[0], PV[1]], [px, tip[0], tip[1]], .7, pawlM, toneI, .6) + cylX(CPLATE.x1, px + .9, PV[0], PV[1], 1, METAL, toneI, .5, 12)
    + rod([px, tip[0], tip[1]], [CW.x0 + 1, tip[0], tip[1]], .6, pawlM, toneI, .5));
  { const s0 = [PV[0] - 1.8, PV[1] - 1.8*Math.tan(a0) - .2], s1 = [CPLATE.y1 - 2, CPLATE.z0 + 6.5], sp = [];
    for (let i = 0; i <= 16; i++){ const t = i/16, o = (i % 2 ? .6 : -.6) * (i && i < 16 ? 1 : 0); sp.push([px, lerp(s0[0], s1[0], t) + o, lerp(s0[1], s1[1], t)]); }
    put([[px - .5, Math.min(s0[0], s1[0]) - 1, Math.min(s0[1], s1[1]) - 1], [px + .5, Math.max(s0[0], s1[0]) + 1, Math.max(s0[1], s1[1]) + 1]], line(sp, .5)); }
  // coin guide: a channel from the slot down to the top of the coin wheel
  const gpts = [[CW.x0 + .2, SLOT[0] - .3, SHAFT_Z + CW.r + .3], [W - .4, SLOT[0] - .3, SHAFT_Z + CW.r + .3], [W - .4, SLOT[0] - .3, SLOT[3]], [CW.x0 + .2, SLOT[0] - .3, SLOT[3]]];
  put([[CW.x0, SLOT[0] - .5, SHAFT_Z + CW.r], [W, SLOT[2] + .5, SLOT[3]]], glass(gpts, '#d8d2c2')
    + (st.coinT != null ? shape(on(PY(SLOT[0] + .8), ellUV(lerp(W - 2, CW.x0 + 1.4, Math.min(1, st.coinT*1.3)), lerp(SLOT[3] - 2.4, SHAFT_Z + CW.r + 1.8, Math.min(1, st.coinT*1.3)), 2.2, 2.2, 16)), COIN.m, .6) : ''));
  // small gear on the shaft's end, crown gear above it on the vertical shaft
  let pg = cylX(PIN.x0, PIN.x1, DIAL.y, SHAFT_Z, PIN.r, GBRASS, toneI, .6, 12);
  put([[PIN.x0, DIAL.y - PIN.r, SHAFT_Z - PIN.r], [PIN.x1, DIAL.y + PIN.r, SHAFT_Z + PIN.r]], pg);
  let cg = cyl(CX, CY, CROWN.z0, CROWN.z1, CROWN.r, GBRASS, toneI, .8, 32);
  for (let i = 0; i < 24; i++){ const a = wa + i/24*2*Math.PI, p = [CX + CROWN.r*Math.cos(a), CY + CROWN.r*Math.sin(a)];
    if (facing([Math.cos(a), Math.sin(a), 0])) cg += line([[p[0], p[1], CROWN.z0], [p[0], p[1], CROWN.z0 + .8]], .35); }
  put([[CX - CROWN.r, CY - CROWN.r, CROWN.z0], [CX + CROWN.r, CY + CROWN.r, CROWN.z1]], cg);
  put([[CX - .9, CY - .9, CROWN.z1], [CX + .9, CY + .9, TT.z0]], rod([CX, CY, CROWN.z1], [CX, CY, TT.z0], .8, METAL, toneI, .6));
  // deck plate with the drop hole and the shaft's bearing; turntable with four pockets above it
  const deck = [[2, 2, DECK.z1], [W - 2, 2, DECK.z1], [W - 2, D - 2, DECK.z1], [2, D - 2, DECK.z1]];
  put([[2, 2, DECK.z0], [W - 2, D - 2, DECK.z1]], glass(deck, '#d8d2c2') + shape(on(PZ(DECK.z1 + .05), ellUV(HOLE[0], HOLE[1], TT.hr + .3, TT.hr + .3, 18)), '#3a3632', .6)
    + cyl(CX, CY, DECK.z1, TT.z0, 1.8, GBRASS, toneI, .6, 14));
  let tt = cyl(CX, CY, TT.z0, TT.z1, TT.r, matOf('#e9e2c4'), toneI, .9, 40);
  for (let i = 0; i < 4; i++){ const a = -Math.PI*3/4 + wa + i*Math.PI/2, p = [CX + TT.pr*Math.cos(a), CY + TT.pr*Math.sin(a)];
    tt += shape(on(PZ(TT.z1 + .05), ellUV(p[0], p[1], TT.hr, TT.hr, 18)), '#5a5650', .6);
    const loaded = !(turning && st.turn.t > .5 && i === 0);
    if (loaded) tt += fill(pd(on(PZ(TT.z1 + .3), ellUV(p[0], p[1], TT.hr - .6, TT.hr - .6, 16))), CAP_COLS[i % CAP_COLS.length]) + ink(pd(on(PZ(TT.z1 + .3), ellUV(p[0], p[1], TT.hr - .6, TT.hr - .6, 16))), .5); }
  put([[CX - TT.r, CY - TT.r, TT.z0], [CX + TT.r, CY + TT.r, TT.z1]], tt);
  // stirrer: the shaft carries on up through the turntable to a bent wire just above the globe floor
  const sa = wa*2, arm = a => [CX + 9*Math.cos(a), CY + 9*Math.sin(a), FLOOR + 1.4];
  put([[CX - 9, CY - 9, TT.z1], [CX + 9, CY + 9, FLOOR + 3.4]], rod([CX, CY, TT.z1], [CX, CY, FLOOR + 1.4], .6, METAL, toneI, .6)
    + [sa, sa + Math.PI].map(a => rod([CX, CY, FLOOR + 1.4], arm(a), .45, METAL, toneI, .5) + rod(arm(a), [arm(a)[0], arm(a)[1], FLOOR + 3.4], .45, METAL, toneI, .5)).join(''));
  // capsule path: drop chute (four walls) under the hole, then a ramp to the flat floor of the exit
  const dc = DROPC, dw = [];
  for (const y of [dc.y0, dc.y1]) dw.push([[dc.x0, y, dc.z0], [dc.x1, y, dc.z0], [dc.x1, y, dc.z1], [dc.x0, y, dc.z1]]);
  for (const x of [dc.x0, dc.x1]) dw.push([[x, dc.y0, dc.z0], [x, dc.y1, dc.z0], [x, dc.y1, dc.z1], [x, dc.y0, dc.z1]]);
  put([[dc.x0, dc.y0, dc.z0], [dc.x1, dc.y1, dc.z1]], dw.map(p => glass(p)).join(''));
  const rampF = [[dc.x0, dc.y0, dc.z0 - 1], [dc.x0, dc.y1, dc.z0 - 1], [RAMP_X, CH.y1, CH.z0], [RAMP_X, CH.y0, CH.z0]];
  const floorF = [[RAMP_X, CH.y0, CH.z0], [RAMP_X, CH.y1, CH.z0], [W - .4, CH.y1, CH.z0], [W - .4, CH.y0, CH.z0]];
  put([[dc.x0, dc.y0, CH.z0], [W, CH.y1, dc.z0]], shape(rampF, mix(GSTEEL.l, '#f2efe7', .3), .7) + shape(floorF, mix(GSTEEL.l, '#f2efe7', .3), .7)
    + glass([[dc.x0, dc.y0, dc.z0 - 1], [RAMP_X, CH.y0, CH.z0], [RAMP_X, CH.y0, CH.z0 + 5], [dc.x0, dc.y0, dc.z0 + 4]])
    + glass([[dc.x0, dc.y1, dc.z0 - 1], [RAMP_X, CH.y1, CH.z0], [RAMP_X, CH.y1, CH.z0 + 5], [dc.x0, dc.y1, dc.z0 + 4]]));
  // the capsule falling through the hole and down the chute, before it reaches the flap
  if (st.roll && st.roll.t < .12){ const u = st.roll.t/.12, c = u < .55 ? [HOLE[0], HOLE[1], lerp(TT.z0 - CAP_R, dc.z0 + CAP_R, u/.55)] : [lerp(HOLE[0], W - 10, (u - .55)/.45), lerp(HOLE[1], 20, (u - .55)/.45), lerp(dc.z0 + CAP_R - 1, CH.z0 + CAP_R, (u - .55)/.45)];
    put([[c[0] - CAP_R, c[1] - CAP_R, c[2] - CAP_R], [c[0] + CAP_R, c[1] + CAP_R, c[2] + CAP_R]], capsuleArt(c, CAP_R, [0, 0, -1], st.roll.col, 1)); }
  // coins: a chute from under the coin wheel to the coin box on the floor
  const ct = [[CW.x0 + .9, DIAL.y + 1.8, SHAFT_Z - CW.r - .6], [33, 30, 18], [26, 34.5, CBOX[5]]];
  put(gBoxOf(ct), rod(ct[0], ct[1], .9, GSTEEL, toneI, .6) + rod(ct[1], ct[2], .9, GSTEEL, toneI, .6) + (turning && th > Math.PI && th < 1.4*Math.PI ? (() => { const t = (th - Math.PI)/(.4*Math.PI), p = t < .5 ? ct[0].map((v, i) => lerp(v, ct[1][i], t*2)) : ct[1].map((v, i) => lerp(v, ct[2][i], t*2 - 1)); return fill(pd(on(PX(p[0]), ellUV(p[1], p[2], 1.6, 1.6, 12))), COIN.m); })() : ''));
  put([[CBOX[0], CBOX[1], CBOX[2]], [CBOX[3], CBOX[4], CBOX[5]]], box(...CBOX, GDARK, toneI, .9) + shape(on(PZ(CBOX[5] + .05), ellUV(26, 34.5, 1.6, 1.6, 12)), '#111', .5)
    + [[CBOX[0] + 2, CBOX[1] + 2], [CBOX[3] - 2, CBOX[1] + 2], [CBOX[0] + 2, CBOX[4] - 2], [CBOX[3] - 2, CBOX[4] - 2]].map(([x, y]) => fill(pd(on(PZ(CBOX[5] + .05), ellUV(x, y, .45, .45, 8))), METAL.l)).join(''));
  return byDepth(parts);
}
const XR_OPTS = { getSt: () => { try { return UI.st; } catch (e) { return {}; } }, B: [0, W + 20, 0, D, 0, Z_TOP],
  mech: (st, k) => gashMech(st),
  inside: st => [ { at:[CW.x1, DIAL.y, SHAFT_Z + CW.r], text:'COIN WHEEL', on: st.coin || st.coinT != null },
    { at:[CPLATE.x1, 30, 40.5], text:'LOCK PAWL', on: !st.coin && !!st.jig },
    { at:[CX + CROWN.r, CY, CROWN.z1], text:'GEARS', on: !!st.turn },
    { at:[CX + TT.r, CY, TT.z1], text:'TURNTABLE', on: !!st.turn },
    { at:[CX + 9, CY, FLOOR + 3.4], text:'STIRRER', on: !!st.turn },
    { at:[DROPC.x0, DROPC.y0, 32], text:'DROP CHUTE', on: !!st.roll },
    { at:[(W + PIN.x1)/2, DIAL.y, SHAFT_Z + 1], text:'CRANK SHAFT', on: !!st.turn },
    { at:[CBOX[0], 34.5, CBOX[5]], text:'COIN BOX', on: false } ],
  surface: st => facing([1,0,0]) ? [ { at:[W + 1, DIAL.y, DIAL.z + DIAL.r], text:'CRANK', on: !!st.turn }, { at:[W + 1, 20, 42.7], text:'COIN SLOT', on: !!st.coin },
    { at:[W, 20, CH.z0], text:'CAPSULE FLAP', on: !!st.roll }, { at:[CX, CY - GR, G[2]], text:'GLOBE', on: false } ] : [{ at:[CX, CY - GR, G[2]], text:'GLOBE', on: false }] };
const XR_CAPTION = st => {
  if (st.coinT != null) return 'The coin runs down the guide into the notch of the coin wheel on the crank shaft, and pushes the lock pawl up out of the way.';
  if (st.jig) return 'No coin: the lock pawl’s dog sits in the coin wheel’s notch, so the crank only wiggles.';
  if (st.turn) return 'One turn of the crank turns the small gear, which turns the crown gear and the turntable a quarter turn. A loaded pocket passes over the drop hole, the stirrer keeps the capsules moving, and the coin falls off the wheel into the coin box.';
  if (st.roll) return 'The capsule drops through the hole, down the drop chute and the ramp, and pushes the flap open.';
  if (st.coin) return 'Coin in: the pawl is lifted clear of the coin wheel, so the crank is free to turn.';
  return 'Inside: the crank shaft carries a coin wheel and a small gear. The gear turns the turntable under the globe a quarter turn for each coin.';
};

XR_OPTS.inline = true;
scene = xrWrap(scene, XR_OPTS);
UI = mountFigure({
  fig:'12', turn:'full', title:'Capsule toy machine', hint:'insert a coin, turn the crank, open the capsule',
  idea:"Each turn of the crank lines up one capsule-sized hole, so exactly one capsule drops out for each coin.",
  size:[W, D, Z_TOP - (CX + CY)*S + 1], center:[CX, CY], views:true, palette:'blush', state:st,
  // size: the base's true footprint; H is set so the box's projected top meets the knob on the centred globe (tight framing)
  scene,
  readout,
  buttonsLabel:'Machine',
  buttons:[
    { label:'Insert coin', onClick:(st, ui) => insertCoin(st, ui) },
    { label:'Turn crank', onClick:(st, ui) => turnCrank(st, ui) },
    { label:'Open capsule', onClick:(st, ui) => !st.out ? ui.flash('No capsule yet') : st.out.open > 0 ? ui.flash('Already open') : clickCapsule(st, ui) },
    { label:'Put the prize away', onClick:(st, ui) => st.out && st.out.open >= 1 ? clickCapsule(st, ui) : ui.flash('Open a capsule first') },
    { label:'Refill', onClick:(st, ui) => { if (busy()) return; st.pile = freshPile(Math.floor(Math.random()*1e6)); ui.flash('Globe refilled'); } },
  ],
  next: st => busy() || (st.out && st.out.opening) ? -1 : st.out ? (st.out.open >= 1 ? 3 : 2) : !st.pile.length ? 4 : st.coin ? 1 : 0,
  stats: st => [ { label:'Credit', value: st.coin ? '100¥' : '0¥' }, { label:'Capsules left', value: st.pile.length, small:true },
    { label:`Collected · ${st.collected.length}`, value: st.collected.length ? `<span style="display:inline-flex;flex-wrap:wrap;justify-content:flex-end;max-width:150px;gap:2px">${st.collected.map(k => PRIZE_ICON[k]).join('')}</span>` : '—', small:true } ],
  acts:{
    slot:(st, el, ui) => insertCoin(st, ui),
    crank:(st, el, ui) => turnCrank(st, ui),
    capsule:(st, el, ui) => clickCapsule(st, ui),
    flap:(st, el, ui) => { if (!st.out && !st.roll) ui.flash(st.coin ? 'Turn the crank to get a capsule' : 'Empty — insert a coin and turn the crank'); },
    globe:(st, el, ui) => { if (!busy()) ui.flash(`${st.pile.length} capsules inside — what will you get?`); },
  },
  params:(st, q) => {
    if (q.get('coin') === '1') st.coin = true;
    if (q.has('crank')){ const t = clamp(+q.get('crank')); st.coin = true; st.turn = prepareTurn(5); st.turn.t = t; st.turn.frozen = true;
      const qq = Math.min(3.999, t*4); st.crank = (Math.floor(qq) + ease(clamp((qq % 1)/.6)))*Math.PI/2; }
    if (q.has('insert')) st.coinT = clamp(+q.get('insert'), 0, .99);
    if (q.has('roll')){ st.roll = { t:clamp(+q.get('roll')), col:'#e2473a' }; }
    const pz = q.get('prize');
    if (q.get('capsule') === 'out' || PRIZES[pz]) st.out = { col:q.get('col') || '#3e86d9', prize:PRIZES[pz] ? pz : 'duck', open:PRIZES[pz] ? clamp(q.has('open') ? +q.get('open') : 1) : 0 };
  },
});
xrMount(() => UI, XR_CAPTION);