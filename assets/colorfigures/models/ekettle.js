/* ---------- geometry (x = depth, y = width, z = up) ---------- */
const W = 60, D = 80, H = 80;
const KX = 30, KY = 34;                         // kettle axis
const BASE_R = 27, BASE_H = 5;                  // power base
const Z_G0 = 16, Z_G1 = 50, Z_TOP = 57;         // glass from Z_G0 to Z_G1, top collar to Z_TOP
const rG = z => 23.2 - (z - Z_G0) / (Z_G1 - Z_G0) * 1.8;   // glass radius (slight taper)
const CAP = 1.7, Z_MAX = 46;                    // litres at the MAX line
const levelZ = v => Z_G0 + .3 + v / CAP * (Z_MAX - Z_G0 - .3);
const HX0 = 24, HX1 = 36;                       // handle thickness (x)
const LID_HY = KY + 19, LID_MAX = 35 * Math.PI / 180;
const XW = HX1 + .06;
const SX = KX + 7, SY = KY - 15;               // where the filling stream comes down (in the part of the opening the lid leaves clear)                           // plane of the cutaway window

const GLASS_IN = '#dbeef2', WATER = '#3f8fd0', WATER_TOP = '#a9d8f2', WATER_INK = '#2f6d92';
const COPPER = { l:'#f0a35e', m:'#d0803d', d:'#8a4a1e' };
const GLOW = '#ff6a1f', AMBER = '#ffb347';

const zr = (z, r, n=36) => on(PZ(z), ellUV(KX, KY, r, r, n));
const arcZ = (z, r, a0, a1, n=24) => Array.from({length:n+1}, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [KX + r*Math.cos(a), KY + r*Math.sin(a), z]; });
const frac = v => v - Math.floor(v);
const circ = (p, r, fillC, extra='') => { const [X, Y] = P(...p); return `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="${fillC}" ${extra}/>`; };

// a prism: any (y,z) polygon (convex or not) swept along x from x0 to x1, with its own normals, the cap on whichever
// end faces the viewer, and silhouette ink. A concave outline can show two strips that overlap, so they go far to near.
function prism(R, x0, x1, m){
  const n = R.length; let A = 0;
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i+1)%n]; A += a[0]*b[1] - b[0]*a[1]; }
  const sg = A > 0 ? 1 : -1, vs = [], strips = [], capF = vis([1,0,0]), xn = capF ? x1 : x0, xb = capF ? x0 : x1;
  for (let i = 0; i < n; i++){
    const a = R[i], b = R[(i+1)%n], nr = norm([0, sg*(b[1]-a[1]), -sg*(b[0]-a[0])]);
    vs.push(vis(nr));
    if (vs[i]) strips.push({ at: [(x0+x1)/2, (a[0]+b[0])/2, (a[1]+b[1])/2], svg: face(pd([[x0,a[0],a[1]],[x1,a[0],a[1]],[x1,b[0],b[1]],[x0,b[0],b[1]]]), tone(nr, m)) });
  }
  let s = byDepth(strips), sil = '';
  for (let i = 0; i < n; i++){
    const a = R[i], b = R[(i+1)%n];
    if (vs[i]) sil += pd([[xb,a[0],a[1]],[xb,b[0],b[1]]], false);              // far edge of a visible strip
    if (vs[i] !== vs[(i+n-1)%n]) sil += pd([[x0,a[0],a[1]],[x1,a[0],a[1]]], false);   // fold between seen and unseen strips
  }
  s += fill(pd(on(PX(xn), R)), tone(capF ? [1,0,0] : [-1,0,0], m));
  s += `<path d="${sil}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += ink(pd(on(PX(xn), R)), 2);
  return s;
}

/* ---------- handle: one C-shaped piece (top arm, grip, bottom arm) ----------
   A concave outline drawn strip by strip can't be ordered right from every side (the C's inner faces showed over the
   grip), so it is filled as three convex pieces sorted against each other, then inked once along the C's real outline. */
const HPIECES = [
  [[63,25],[75.93,25],[74.28,49],[63,49]],                                                        // grip
  [[57,5.5],[73,5.5],[74.04,5.64],[75,6.04],[75.83,6.67],[76.46,7.5],[76.86,8.46],[77,9.5],[75.93,25],[63,25],[57,25]],   // bottom arm
  [[55,49],[63,49],[74.28,49],[74,53],[73.83,54.29],[73.33,55.5],[72.54,56.54],[71.5,57.33],[70.29,57.83],[69,58],[55,58]] ];   // top arm
// the joins between pieces (grip on the bottom arm at z 25, top arm on the grip at z 49) are not edges: no ink there
const seamEdge = (a, b) => (Math.abs(a[1] - b[1]) < 1e-6) && (Math.abs(a[1] - 25) < 1e-6 || Math.abs(a[1] - 49) < 1e-6) && Math.min(a[0], b[0]) >= 63 - 1e-6;
function convexStrips(R, x0, x1, m){
  const n = R.length; let A = 0;
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i+1)%n]; A += a[0]*b[1] - b[0]*a[1]; }
  const sg = A > 0 ? 1 : -1, capF = vis([1,0,0]), xn = capF ? x1 : x0, xb = capF ? x0 : x1;
  const vs = R.map((a, i) => { const b = R[(i+1)%n]; return !seamEdge(a, b) && vis(norm([0, sg*(b[1]-a[1]), -sg*(b[0]-a[0])])); });
  let s = '', ln = '';
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i+1)%n], nr = norm([0, sg*(b[1]-a[1]), -sg*(b[0]-a[0])]);
    if (vs[i]) s += face(pd([[x0,a[0],a[1]],[x1,a[0],a[1]],[x1,b[0],b[1]],[x0,b[0],b[1]]]), tone(nr, m)); }
  s += face(pd(on(PX(xn), R)), tone(capF ? [1,0,0] : [-1,0,0], m));
  // ink with the piece, so a piece drawn later covers it: far edges of visible strips, folds, the end face's outline (no joins)
  for (let i = 0; i < n; i++){ const a = R[i], b = R[(i+1)%n];
    if (vs[i]) ln += pd([[xb,a[0],a[1]],[xb,b[0],b[1]]], false);
    if (vs[i] !== vs[(i+n-1)%n] && !seamEdge(R[(i+n-1)%n], a) && !seamEdge(a, b)) ln += pd([[x0,a[0],a[1]],[x1,a[0],a[1]]], false);
    if (!seamEdge(a, b)) ln += pd([[xn,a[0],a[1]],[xn,b[0],b[1]]], false); }
  return s + `<path d="${ln}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function handleSolid(m){
  const bx = R => { const ys = R.map(p => p[0]), zs = R.map(p => p[1]); return [[HX0, Math.min(...ys), Math.min(...zs)], [HX1, Math.max(...ys), Math.max(...zs)]]; };
  return byDepth(HPIECES.map(R => ({ box: bx(R), svg: convexStrips(R, HX0, HX1, m) })));
}
const HANDLE = [
  [57,25], ...arcUV(61,27,2,-90,0,4), ...arcUV(61,47,2,0,90,4), [55,49], [55,58],
  ...arcUV(69,53,5,90,0,6), ...arcUV(73,9.5,4,0,-90,6), [57,5.5] ];
// the cutaway window on the front of the handle
const WIN = [[56,56],[71.6,56],[71.6,24],[75.4,24],[75.4,7.4],[58.6,7.4],[58.6,24],[64.4,24],[64.4,52],[56,52]];
const TUBE = [[56,54],[68,54],[68,22.6]];
const TUBE_LEN = 12 + (54 - 22.6);
const DISC_Y = 67, DISC_Z = 18, DISC_HW = 6.8;
const PIV = [76.2, 12];   // lever pivot (y, z): just inside the grip's outer face, so the rocker is seated in it
const levAng = st => (-20 * st.leverV + 20 * (1 - st.leverV)) * Math.PI / 180;   // + = tip up (off)
const ROD = 18 + 1.6 - .75 - (12 + 10*Math.tan(20*Math.PI/180));   // rod just touches the arm when cold and on                         // lever pivot (y, z) on the outside of the grip

function tubeAt(s){                             // point on the tube at fraction s of its length
  let d = s * TUBE_LEN;
  for (let i = 0; i < TUBE.length - 1; i++){
    const a = TUBE[i], b = TUBE[i+1], l = Math.hypot(b[0]-a[0], b[1]-a[1]);
    if (d <= l) return [a[0] + (b[0]-a[0])*d/l, a[1] + (b[1]-a[1])*d/l];
    d -= l;
  }
  return TUBE[TUBE.length-1];
}

function cutaway(st, m){
  const Wp = PX(XW), bow = 1.6 * (1 - 2*ease(st.snapV));
  let s = fill(pd(on(Wp, WIN)), mix(m.d, '#000000', .35));
  // inner wall shading along the top and left of the cut (the reveal)
  s += fill(pd(on(Wp, [[56,56],[71.6,56],[71.6,55.2],[56,55.2]])), mix(m.d, '#000000', .1));
  s += fill(pd(on(Wp, [[64.4,52],[65.2,52],[65.2,24],[64.4,24]])), mix(m.d, '#000000', .1));
  // steam tube
  const td = pd(on(Wp, TUBE), false);
  s += `<path d="${td}" fill="none" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>`;
  s += `<path d="${td}" fill="none" stroke="${METAL.m}" stroke-width="7.2" stroke-linejoin="round"/>`;
  s += `<path d="${td}" fill="none" stroke="#5a6266" stroke-width="4" stroke-linejoin="round"/>`;
  // steam travelling down the tube
  if (st.steam > .02) for (let i = 0; i < 8; i++){
    const [y, z] = tubeAt(frac(i/8 + st.t*1.1));
    s += circ([XW+.05, y, z], .75 + .25*Math.sin(i*2.1 + st.t*6), '#ffffff', `opacity="${f(.95*st.steam)}"`);
  }
  // disc mounts
  for (const y of [DISC_Y - DISC_HW - .4, DISC_Y + DISC_HW + .4])
    s += shape(on(Wp, [[y-.8,DISC_Z-1.4],[y+.8,DISC_Z-1.4],[y+.8,DISC_Z+1.4],[y-.8,DISC_Z+1.4]]), METAL.d, .8);
  // the bimetal disc, seen edge-on: copper on top, steel below; domed up when cold, dished down when hot
  const top = [], mid = [], bot = [];
  for (let i = 0; i <= 16; i++){
    const u = -1 + i/8, y = DISC_Y + u*DISC_HW, z = DISC_Z + bow*(1 - u*u);
    top.push([y, z + .75]); mid.push([y, z]); bot.push([y, z - .75]);
  }
  const hot = Math.max(0, Math.min(1, (st.disc - 40) / 50));
  s += fill(pd(on(Wp, [...top, ...mid.slice().reverse()])), mix(COPPER.l, GLOW, hot*.55));
  s += fill(pd(on(Wp, [...mid, ...bot.slice().reverse()])), METAL.l);
  s += ink(pd(on(Wp, [...top, ...bot.slice().reverse()])), .9);
  // push rod hanging from the disc centre, resting on the inner arm of the switch lever (a seesaw through the wall)
  const zc = DISC_Z + bow - .75, rodBot = zc - ROD;
  s += shape(on(Wp, [[DISC_Y-.8,rodBot],[DISC_Y+.8,rodBot],[DISC_Y+.8,zc],[DISC_Y-.8,zc]]), METAL.m, .8);
  const th = levAng(st), arm = [-1, -12].map(u => [PIV[0] + u*Math.cos(th), PIV[1] + u*Math.sin(th)]);
  s += `<path d="${pd(on(Wp, arm), false)}" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>`
     + `<path d="${pd(on(Wp, arm), false)}" fill="none" stroke="${CERAMIC.m}" stroke-width="2.6" stroke-linecap="round"/>`;
  // harness along the arm's floor to the microswitch; the lever's peg over its plunger; the neon behind the rocker
  for (const [dz, col] of [[-.5, st.heat ? AMBER : '#3a3632'], [0, st.heat ? AMBER : '#3a3632'], [.5, '#3a3632']]){
    const hp = pd(on(Wp, [[58.6, 6.8 + dz], [69.6, 6.8 + dz]]), false);
    s += `<path d="${hp}" fill="none" stroke="${INK}" stroke-width="1.5"/><path d="${hp}" fill="none" stroke="${col}" stroke-width=".7"/>`; }
  s += shape(on(Wp, [[69.6, 6.1], [73.4, 6.1], [73.4, 9.2], [69.6, 9.2]]), '#4a4440', .8);
  const pegZ = armZ(st, 71.5);
  s += shape(on(Wp, [[71.1, 9.2], [71.9, 9.2], [71.9, Math.min(10.4, pegZ - .45)], [71.1, Math.min(10.4, pegZ - .45)]]), '#d8d2c2', .6);
  s += circ([XW + .05, 71.5, pegZ], .9, METAL.m, `stroke="${INK}" stroke-width=".8"`);
  s += shape(on(Wp, [[73.9, 8.9], [75.3, 8.9], [75.3, 10.3], [73.9, 10.3]]), st.heat ? '#ff8a3a' : '#e2c9a8', .6);
  // steam puffing out of the tube onto the disc
  if (st.steam > .02) for (let i = 0; i < 4; i++){
    const k = frac(i/4 + st.t*1.4), y = 68 - k*4 + (i%2 ? 1.6 : -1.6)*k, z = 22.4 - k*1.6;
    s += circ([XW+.05, y, z], .6 + k*.7, '#ffffff', `opacity="${f(.8*st.steam*(1-k*.6))}"`);
  }
  s += ink(pd(on(Wp, WIN)), 1.5);
  return s;
}

// switch lever on the outside of the grip, turning about an axis along x at PIV
// a dark boss on the grip's outer face where the switch rocker comes out
// the switch sits on the grip's outer face (the slanted edge from y 77 at z 9.5 to y 75.93 at z 25): it can only be seen
// when that face turns toward the viewer, otherwise the handle hides it
const gripOut = () => vis(norm([0, 15.5, 1.07]));
function switchBoss(m){ return box(25.8, 75.6, PIV[1] - 5.4, 34.2, 76.9, PIV[1] + 5.4, { l: m.d, m: mix(m.d, '#000000', .2), d: mix(m.d, '#000000', .4) }, toneI, .9); }   // the dark slot the rocker sits in
function lever(st){
  // a small rocker set into the bottom of the grip: it stands out ~1.5 units and tilts a few degrees on its pivot
  const th = levAng(st) * .5, c = Math.cos(th), sn = Math.sin(th), U = [0, c, sn], V = [0, -sn, c];
  const Q = (x, u, v) => [x, PIV[0] + u*c - v*sn, PIV[1] + u*sn + v*c];
  const x0 = 26.5, x1 = 33.5, u1 = 1.8, v0 = -4.5, v1 = 4.5;
  const F = [
    [U,               [Q(x0,u1,v0),Q(x1,u1,v0),Q(x1,u1,v1),Q(x0,u1,v1)]],
    [V,               [Q(x0,0,v1),Q(x1,0,v1),Q(x1,u1,v1),Q(x0,u1,v1)]],
    [V.map(t => -t),  [Q(x0,0,v0),Q(x1,0,v0),Q(x1,u1,v0),Q(x0,u1,v0)]],
    [[1,0,0],         [Q(x1,0,v0),Q(x1,u1,v0),Q(x1,u1,v1),Q(x1,0,v1)]],
    [[-1,0,0],        [Q(x0,0,v0),Q(x0,u1,v0),Q(x0,u1,v1),Q(x0,0,v1)]] ];
  let s = '';
  for (const [n, q] of F) if (vis(n)) s += shape(q, toneI(n, CERAMIC), 1);
  if (vis(U)) s += ink(pd([Q(30, u1 + .05, 1), Q(30, u1 + .05, 3.6)], false), 1.4).replace(INK, st.leverV > .5 ? AMBER : '#8d857a');   // the lit stripe
  return s;
}

/* ---------- lid (hinged at the handle side, tilts back to open) ---------- */
function lidPt(p, a){
  const dy = p[1] - LID_HY, dz = p[2] - Z_TOP, c = Math.cos(a), sn = Math.sin(a);
  return [p[0], LID_HY + dy*c + dz*sn, Z_TOP - dy*sn + dz*c];
}
const lidN = (n, a) => { const c = Math.cos(a), sn = Math.sin(a); return [n[0], n[1]*c + n[2]*sn, -n[1]*sn + n[2]*c]; };
function lid(st, m){
  const a = ease(st.lid) * LID_MAX, R = rings => rings.map(p => lidPt(p, a));
  const r0 = R(zr(Z_TOP, 19)), r1 = R(zr(Z_TOP + 2, 17.6)), r2 = R(zr(Z_TOP + 3.4, 12)), k0 = R(zr(Z_TOP + 3.3, 3.4, 16)), k1 = R(zr(Z_TOP + 6.2, 3, 16));
  const sh = n => tone(n, m);
  let s = '';
  s += loft(r0, r1, sh) + loft(r1, r2, sh) + fill(pd(r2), tone(lidN([0,0,1], a), m));
  s += hullInk([...r0, ...r1, ...r2], 1.8) + ink(pd(r2), .9);
  s += loft(k0, k1, n => tone(n, DARK)) + fill(pd(k1), tone(lidN([0,0,1], a), DARK)) + hullInk([...k0, ...k1], 1.2) + ink(pd(k1), .8);
  return s;
}

/* ---------- bubbles, steam ---------- */
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const BUBS = Array.from({length: 34}, () => ({ a: rnd()*Math.PI*2, rr: Math.sqrt(rnd())*.85, ph: rnd(), sp: .55 + rnd()*.6, sz: .5 + rnd()*.6 }));

function water(st){
  if (st.vol < .02) return '';
  const zw = levelZ(st.vol), b = st.bub, amp = .7 * b;
  const surf = Array.from({length: 36}, (_, i) => { const a = i/36*2*Math.PI, r = rG(zw) - .35;
    return [KX + r*Math.cos(a), KY + r*Math.sin(a), zw + amp*Math.sin(3*a + st.t*9) * Math.sin(2*a - st.t*5)]; });
  let s = fill(sp(hull([...zr(Z_G0 + .3, rG(Z_G0) - .35), ...surf].map(p => P(...p)))), WATER, 'opacity=".5"');
  s += fill(pd(surf), WATER_TOP, 'opacity=".75"') + `<path d="${pd(surf)}" fill="none" stroke="${WATER_INK}" stroke-width=".9"/>`;
  // bubbles: a few tiny ones on the floor when warm, a rolling column when boiling
  const n = Math.round(BUBS.length * b), parts = [];
  for (let i = 0; i < n; i++){
    const o = BUBS[i], k = frac(o.ph + st.t * o.sp * (0.6 + b)), r = (rG(Z_G0) - 3) * o.rr;
    const p = [KX + r*Math.cos(o.a), KY + r*Math.sin(o.a), Z_G0 + .8 + k * (zw - Z_G0 - 1.2)];
    parts.push({ at: p, svg: circ(p, (.35 + o.sz*b*.9) * (.6 + k*.6), '#ffffff', `fill-opacity=".8" stroke="${WATER_INK}" stroke-width=".7"`) });
  }
  s += byDepth(parts);
  // ripples where the filling stream lands
  if (st.pour > .02) for (let i = 0; i < 2; i++){ const k = frac(st.t*1.6 + i/2);
    s += `<path d="${pd(on(PZ(zw + .1), ellUV(SX, SY, 1.5 + k*5, 1.5 + k*5, 20)))}" fill="none" stroke="#ffffff" stroke-width="1.1" opacity="${f(1-k)}"/>`; }
  return s;
}
function stream(st, z0, z1){
  if (st.pour < .02) return '';
  const x = SX, y = SY, w = 1.6 * st.pour;
  return fill(pd([[x, y - w, z1], [x, y + w, z1], [x, y + w, z0], [x, y - w, z0]]), WATER, 'opacity=".75"')
       + `<path d="${pd([[x, y + w*.3, z1], [x, y + w*.3, z0]], false)}" stroke="#ffffff" stroke-width="1" opacity=".7"/>`;
}
function insideSteam(st){
  if (st.bub < .3 || st.vol < .02) return '';
  const zw = levelZ(st.vol); let s = '';
  for (let i = 0; i < 7; i++){ const k = frac(i/7 + st.t*.7), a = i*2.4;
    s += circ([KX + 8*Math.cos(a)*(1-k*.4), KY + 8*Math.sin(a)*(1-k*.4), zw + k*(Z_G1 - zw)], 1 + k*2.2, '#ffffff', `opacity="${f((st.bub - .3) * (1 - k) * .9)}"`); }
  return s;
}
function spoutSteam(st){
  if (st.steam < .02) return '';
  let s = '';
  for (let i = 0; i < 7; i++){ const k = frac(i/7 + st.t*.55);
    const p = [KX - k*4 + Math.sin(i*1.7 + st.t*2)*k*2, 3.2 - k*10, 60.5 + k*15];
    s += circ(p, 1.3 + k*4.8, '#ffffff', `opacity="${f(st.steam*(1-k)*.9)}" stroke="#a9b6bc" stroke-width=".8"`); }
  return s;
}

/* ---------- scene ---------- */
function scene(st, m){
  const zw = levelZ(st.vol);
  const lidUp = ease(st.lid) * LID_MAX;
  let s = '';
  // 1. cast shadow
  s += castShadow([...zr(0, BASE_R), ...zr(Z_TOP, 21), ...zr(Z_TOP + 4, 17),
    ...[6, 58].flatMap(z => [[HX0, 77, z], [HX1, 77, z]]), [KX, 3, 59], [KX, 3, 62]]);
  // 2. mains cord, then the power base with its light
  const cord = pd([[7.5, 47.5, 2.4], [4, 53, 1.1], [1.5, 62, .9], [.8, 72, .9]], false);
  s += `<path d="${cord}" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>`
     + `<path d="${cord}" fill="none" stroke="${DARK.l}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += loft(zr(0, BASE_R), zr(BASE_H, BASE_R - .8), n => tone(n, DARK)) + fill(pd(zr(BASE_H, BASE_R - .8)), tone([0,0,1], DARK));
  s += hullInk([...zr(0, BASE_R), ...zr(BASE_H, BASE_R - .8)], 2.6);
  s += ink(pd(arcZ(BASE_H, BASE_R - .8, YAW - 90, YAW + 90), false), 1.2);
  const lamp = on(PX(KX + BASE_R - .2), ellUV(KY, 2.5, 2.4, 1.1, 16));
  if (st.heat) s += fill(pd(on(PX(KX + BASE_R), ellUV(KY, 2.5, 4, 2.2, 16))), AMBER, 'opacity=".35"');
  s += shape(lamp, st.heat ? AMBER : '#6d665d', .8);
  // 3. spout (on the -y side) and handle (on the +y side): each goes behind the body when its side faces away
  const sA = on(PY(KY - 19), ellUV(KX, 53.5, 3.4, 3.4, 18)), sB = on(PY(4), ellUV(KX, 59.5, 2.2, 2.2, 18));
  const sAx = norm(sub(avg(sB), avg(sA)));   // the spout's axis, out toward its tip
  let spout = loft(sA, sB, n => tone(n, m));
  if (vis(sAx)) spout += fill(pd(sB), mix(m.d, '#000000', .45)) + fill(pd(on(PY(4.05), ellUV(KX, 59.5, 1.3, 1.3, 14))), '#1a1714');   // looking into the open end: rim and the dark bore
  spout += hullInk([...sA, ...sB], 1.8) + (vis(sAx) ? ink(pd(sB), 1) : '');
  const spoutNear = vis([0,-1,0]), handleNear = vis([0,1,0]);
  // the cutaway window is on the handle's +x face, so it shows only when that face does
  const kx = ease(st.xr || 0), winSeen = vis([1,0,0]) && kx > 0;   // the cut-open handle (steam tube, disc) only in see-through
  // drawn over the ghosted shell (see XR_OPTS.over), so the inside stays solid while the case fades
  KWIN = winSeen ? `<g opacity="${f(kx)}">${clipTo(on(PX(XW), WIN), cutaway(st, m))}</g>` : '';
  const handle = handleSolid(m) + (gripOut() ? switchBoss(m) + lever(st) : '');
  if (!spoutNear) s += spout;
  if (!handleNear) s += handle;
  // 4. bottom collar
  s += loft(zr(BASE_H, 23.6), zr(Z_G0, 23.3), n => tone(n, m));
  // 5. inside the glass: far wall, floor and heater ring, water, bubbles, steam, the filling stream
  let g = `<g opacity=".45">${loft(zr(Z_G0, 23.2), zr(Z_G1, rG(Z_G1)), () => GLASS_IN, true)}</g>`;
  g += ink(pd(arcZ(Z_G1, rG(Z_G1), YAW + 90, YAW + 270), false), .7) + ink(pd(arcZ(Z_G0, 23.2, YAW + 90, YAW + 270), false), .7);
  g += fill(pd(zr(Z_G0 + .2, 23)), METAL.m) + ink(pd(zr(Z_G0 + .2, 23)), .6);
  const ring = pd(zr(Z_G0 + .25, 14, 40));
  if (st.heatV > .01) g += `<path d="${ring}" fill="none" stroke="${AMBER}" stroke-width="7" opacity="${f(.45*st.heatV)}"/>`;
  g += `<path d="${ring}" fill="none" stroke="${st.heatV > .01 ? mix(METAL.d, GLOW, st.heatV) : METAL.d}" stroke-width="2.4"/>`;
  g += fill(pd(zr(Z_G0 + .3, 3)), METAL.l) + ink(pd(zr(Z_G0 + .3, 3)), .6);
  g += stream(st, zw, Z_G1 + 1);
  g += water(st) + insideSteam(st);
  s += g;
  // glass: tint, streaks, level marks
  s += `<g pointer-events="none">` + fill(sp(hull([...zr(Z_G0, 23.2), ...zr(Z_G1, rG(Z_G1))].map(p => P(...p)))), '#cfe9f0', 'opacity=".18"');
  for (const [a0, a1] of [[62, 74], [80, 84]]){
    const A = arcZ(Z_G0 + 3, rG(Z_G0 + 3) + .1, a0, a1, 3), B = arcZ(Z_G1 - 3, rG(Z_G1 - 3) + .1, a0, a1, 3);
    s += fill(pd([...A, ...B.reverse()]), '#ffffff', 'opacity=".42"');
  }
  s += `</g>`;
  const ma = 50 * Math.PI / 180;
  if (vis([Math.cos(ma), Math.sin(ma), 0])) for (const [z, lab] of [[Z_MAX, 'MAX'], [levelZ(.5), 'MIN']]){   // printed on one spot of the glass: hidden when that spot is on the far side
    const r = rG(z) + .1, p = [KX + r*Math.cos(ma), KY + r*Math.sin(ma), z];
    s += ink(pd(arcZ(z, r, 43, 57, 4), false), 1);
    s += `<text transform="${txM(P(p[0], p[1], z + .9), Dv(Math.sin(ma), -Math.cos(ma), 0), Dv(0,0,-1))}" font-size="2.6" fill="${INK}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">${lab}</text>`;
  }
  // 6. top collar + rim
  s += loft(zr(Z_G1, rG(Z_G1)), zr(Z_TOP, 20.8), n => tone(n, m));
  s += fill(pd(zr(Z_TOP, 20.8)), tone([0,0,1], m));
  s += ink(pd(arcZ(Z_G0, 23.3, YAW - 90, YAW + 90), false), 1.3) + ink(pd(arcZ(Z_G1, rG(Z_G1), YAW - 90, YAW + 90), false), 1.3);
  s += hullInk([...zr(BASE_H, 23.6), ...zr(Z_TOP, 20.8)], 2.8);
  s += ink(pd(zr(Z_TOP, 20.8)), 1.4);
  // 7. lid: closed it sits on the rim; open it shows the hole and the stream coming in
  if (st.lid > .01){
    s += fill(pd(zr(Z_TOP + .05, 19)), mix(m.d, '#000000', .3)) + ink(pd(zr(Z_TOP + .05, 19)), 1.2);
    s += clipTo(zr(Z_TOP + .05, 19), stream(st, Z_G1, Z_TOP + 1));
    s += stream(st, Z_TOP, H - 4);
    s += `<g opacity=".55">${stream(st, H - 4, H + 1)}</g><g opacity=".25">${stream(st, H + 1, H + 5)}</g>`;
  }
  s += lid(st, m);
  // 8. handle (with the cutaway and lever) and spout when they are on the near side
  if (handleNear) s += handle;
  if (spoutNear) s += spout;
  // 9. steam leaving the spout
  s += spoutSteam(st);
  // 10. the click
  if (st.click > 0){
    const [X, Y] = P(30, 90, 11), k = 1 + .25 * Math.max(0, st.click - .75) * 4;
    s += `<text x="${f(X)}" y="${f(Y)}" font-size="${f(5.6*k)}" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-weight="900" fill="${INK}" stroke="#f2efe7" stroke-width="3" paint-order="stroke" opacity="${f(Math.min(1, st.click*3))}">CLICK!</text>`;
  }
  // 11. labels
  // in see-through these four go in the callout columns with the inside labels (XR_OPTS.inside), so none collide
  if (kx === 0){ s += tag([KX + 14, KY - 1, Z_G0 + .3], 80, 40, 'HEATER', st.heat);
    if (gripOut()) s += tag([30, PIV[0] + 1.9, PIV[1]], 6, 62, 'SWITCH', st.click > 0 || st.bounce > 0); }
  return s;
}

/* ---------- behaviour ---------- */
const st = { pal:'cobalt', vol:.8, temp:18, disc:22, heat:false, heatV:0, bub:0, steam:0,
             snapped:false, snapV:0, leverV:0, bounce:0, click:0, lid:0, lidT:0, fillTo:null, pour:0, t:0, loop:false };
let ui;
function step(dt){
  st.t += dt;
  const app = (v, target, rate) => v + Math.max(-rate*dt, Math.min(rate*dt, target - v));
  // heating and cooling
  if (st.heat){
    const rate = 80 / (2.4 + 3.6 * st.vol / CAP);
    st.temp = Math.min(100, st.temp + rate * dt);
  } else st.temp -= (st.temp - 20) * .012 * dt;
  st.heatV = app(st.heatV, st.heat ? 1 : 0, 3);
  st.bub = app(st.bub, st.heat ? Math.max(0, Math.min(1, (st.temp - 62) / 38)) : 0, st.heat ? 1.5 : .8);
  st.steam = app(st.steam, st.heat && st.temp >= 99.9 ? 1 : 0, st.heat ? 1.6 : .9);
  // the disc follows the steam that reaches it (and warms a little from the body)
  const dT = st.steam > .05 ? 100 : 22 + (st.temp - 20) * .15;
  st.disc += (dT - st.disc) * (dT > st.disc ? 1.7 * Math.max(st.steam, .2) : .45) * dt;
  if (!st.snapped && st.disc >= 90){
    st.snapped = true;
    if (st.heat){ st.heat = false; st.click = 1; ui.flash('click! the steam-hot disc snapped', 2400); }
  }
  if (st.snapped && st.disc < 60) st.snapped = false;
  st.snapV = app(st.snapV, st.snapped ? 1 : 0, 1/.16);
  st.bounce = Math.max(0, st.bounce - dt);
  st.leverV = app(st.leverV, st.heat || st.bounce > .25 ? 1 : 0, 1/.13);
  st.click = Math.max(0, st.click - dt);
  // filling: lid opens, water runs in, lid closes
  if (st.fillTo != null){
    st.lidT = 1;
    if (st.lid >= 1){
      const dv = Math.min(.75 * dt, st.fillTo - st.vol);
      st.temp = (st.temp * st.vol + 15 * dv) / (st.vol + dv); st.vol += dv;
      if (st.fillTo - st.vol < 1e-4){ st.vol = st.fillTo; st.fillTo = null; st.lidT = 0; }
    }
  }
  st.pour = app(st.pour, st.fillTo != null && st.lid >= 1 ? 1 : 0, 4);
  st.lid = app(st.lid, st.lidT, 1/.45);
  const busy = st.heat || st.heatV > 0 || st.bub > 0 || st.steam > 0 || st.click > 0 || st.bounce > 0 || st.fillTo != null || st.pour > 0
    || st.lid !== st.lidT || Math.abs(st.snapV - (st.snapped ? 1 : 0)) > 1e-3 || Math.abs(st.leverV - (st.heat || st.bounce > .25 ? 1 : 0)) > 1e-3
    || st.temp > 20.6 || st.disc > 23;
  if (!busy) st.loop = false;
  return busy;
}
function run(){ if (st.loop) return; st.loop = true; ui.animate(step); }

function switchOn(st, ui){
  if (st.heat) return ui.flash('it is already on');
  if (st.fillTo != null || st.lid > 0) return ui.flash('wait for the lid to close');
  if (st.vol < .5) return ui.flash('too little water: fill it past MIN first');
  if (st.snapped){ st.bounce = .55; ui.flash('the disc is still hot, so the switch springs back up. wait a moment'); return run(); }
  st.heat = true; run();
}
function switchOff(st, ui){
  if (!st.heat) return ui.flash('it is already off');
  st.heat = false; run();
}
function fillTo(v){
  return (st, ui) => {
    if (st.heat) return ui.flash('switch it off before filling');
    if (st.fillTo != null) return ui.flash('already filling');
    if (st.vol >= v - .02) return ui.flash(`it already holds ${st.vol.toFixed(1)} L`);
    st.fillTo = v; run();
  };
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
    if (k > 0 && opts.under) s = xrUnder(s, opts.mech(st, k), k) + (opts.over ? opts.over(st) : '');   // the whole drawing is the object
    else if (k > 0 && !opts.inline) s = `<g opacity="${f(1 - .5*k)}">${s}</g><g opacity="${f(k)}">${opts.mech(st, k)}</g>`;   // inline: the figure ghosts its own case
    const items = k > .6 ? opts.inside(st) : opts.surface ? opts.surface(st) : [];
    return s + (items.length ? xrCallouts(items, opts.B) : '');
  };
}

/* ---------- see-through: how a real cordless kettle is built ----------
   Truth: mains enters the power base through a grommet and a cord grip; live, neutral and earth cores go to the stepped
   base pin. The kettle sits on the pin with its 360° socket, so it can face any way. Above the socket a control unit
   carries the element's two cold tails and two boil-dry cutouts pressed against the spreader plate. The element is a
   sheathed horseshoe brazed under an aluminium spreader plate glued to the steel floor, so no coil touches the water.
   A three-wire harness leaves the control unit, passes a grommet in the collar wall and runs along the handle's bottom
   arm to a microswitch; the neon behind the rocker lights while it is closed. When the water boils, steam under the lid
   enters the steam tube, runs down the handle and blows on the bimetal disc; the disc snaps down, its push rod knocks the
   lever's inner arm down, a peg on the arm presses the microswitch plunger, the contacts open and the rocker flips off.
   Parts (each sits on, or is held by, another part):
   BASE     cord grommet . cord sheath . grip strap and two screws . brown, blue and green-yellow cores . three crimp tabs .
            pin boss . earth collar . neutral ring . base lamp and its two leads
   FLOOR    spreader plate . element: horseshoe and two cold tails . control unit . 360° socket sleeve . two boil-dry cutouts .
            harness (three wires) . collar grommet
   HANDLE   steam tube and inlet under the lid . bimetal disc . two disc posts and their clips . push rod . lever inner arm .
            pivot pin . peg . microswitch body . plunger . neon . two neon leads . three harness ends */
const KM = { bake: matOf('#4a4440'), alu: matOf('#d4d8da'), brass: matOf('#d8b25a'), rub: DARK, copper: COPPER, lamp: matOf('#c9c2b0') };
const kBox = (pts, e = .05) => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - e), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + e)];
const kBend = (pts, r = 1.4) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    if (d < 1e-3){ out.push(b); continue; }
    const p = a.map((v, k) => b[k] + (v - b[k]) * d/la), q = c.map((v, k) => b[k] + (v - b[k]) * d/lc);
    for (let j = 0; j <= 4; j++){ const t = j/4; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a cable or tube cut into short pieces with their own boxes, so byDepth sorts each piece against the solids it passes
const kWire = (pts, col, w = .3, ends = true, L = 4) => { const q = kBend(pts), out = [];
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j - 1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + .9)}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ends && i === 0){ const [X, Y] = P(...q[0]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".9" fill="${INK}"/>`; }
    if (ends && j === q.length - 1){ const [X, Y] = P(...q[j]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".9" fill="${INK}"/>`; }
    out.push({ box: kBox(seg, w), svg }); i = j; }
  return out; };
const CORD_D = norm([7.5 - KX, 47.5 - KY, 0]), CORD_T = [-CORD_D[1], CORD_D[0], 0];
const cAt = (r, z, t = 0) => [KX + r*CORD_D[0] + t*CORD_T[0], KY + r*CORD_D[1] + t*CORD_T[1], z];
const kPol = (r, a, z) => [KX + r*Math.cos(a*Math.PI/180), KY + r*Math.sin(a*Math.PI/180), z];
const CU = { r: 7, z0: 9.5, z1: 12.8 }, PLATE = { r: 20, z0: 14.6, z1: 15.8 }, EL = { r: 13, z: 13.7, w: .9 };
const DISC = { x: 30, r: 4.6 }, POSTS = [24.8, 35.2], MS = [31.6, 69.6, 6.1, 34.2, 73.4, 9.2], PEG_Y = 71.5, NEON = [26.4, 28.8, 74.6, 9.6];
const armZ = (st, y) => PIV[1] + (y - PIV[0]) * Math.tan(levAng(st));
const HARN = dx => [[KX + dx, KY + CU.r, 11], [KX + dx, 50, 11], [32.8 + dx, 55, 10.5], [32.8 + dx, 58.5, 8.5], [32.8 + dx, 60, 6.8], [32.8 + dx, 68.6, 6.8], [32.8 + dx, MS[1], 7.6]];
function kettleMech(st){
  const parts = [], lit = !!st.heat, H = '#3a3632', Hon = '#ffb347', put = (b, svg) => parts.push({ box: b, svg });
  const vc = (x, y, z0, z1, r, M, w = .8, n = 20, extra = '') => put([[x - r, y - r, z0], [x + r, y + r, z1]], cyl(x, y, z0, z1, r, M, toneI, w, n) + extra);
  const rd = (a, b, r, M, w = .7, n = 12) => put(kBox([a, b], r), rod(a, b, r, M, toneI, w, r, n));
  const bx = (x0, y0, z0, x1, y1, z1, M, w = .7) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, M, toneI, w));
  const winSeen = vis([1,0,0]);
  // ---- power base: grommet, cord, grip, cores to the pin's tabs; the pin; the base lamp
  rd(cAt(25.6, 2.4), cAt(26.9, 2.4), 1.1, KM.rub, .7, 14);
  parts.push(...kWire([cAt(25.6, 2.4), cAt(22.5, 1.8), cAt(18.6, 1.7)], DARK.l, .85, false));
  rd(cAt(21, 2.95, -1.5), cAt(21, 2.95, 1.5), .35, METAL, .6, 8);
  for (const t of [-1.9, 1.9]){ const p = cAt(21, 0, t); vc(p[0], p[1], .7, 3.2, .5, METAL, .5, 10); }
  const tabs = [[-12, '#9a5a2c'], [0, '#3c6fb4'], [12, '#7fae3e']], ca = Math.atan2(CORD_D[1], CORD_D[0]) * 180/Math.PI;
  tabs.forEach(([da, col], i) => { const a = ca + da, tab = kPol(5.1, a, 2.5);
    parts.push(...kWire([cAt(18.6, 1.7, (i - 1)*.55), kPol(9, a, 2.0), tab], col, .28, false));
    put(kBox([kPol(4.6, a, 1.6), kPol(5.6, a, 3.4)]), box(tab[0] - .45, tab[1] - .45, 1.6, tab[0] + .45, tab[1] + .45, 3.4, KM.brass, toneI, .5)); });
  vc(KX, KY, .7, 4.4, 4.6, KM.bake, .8, 24);                                           // pin boss
  vc(KX, KY, 4.4, 6.4, 3.6, METAL, .8, 24);                                            // earth collar, up through the base top
  vc(KX, KY, 6.4, 7.6, 2.6, KM.copper, .7, 20);                                        // neutral ring; the live pin is inside the socket
  put([[51.5, 32.8, 1.3], [56.4, 35.2, 3.7]], cylX(51.5, 56.4, KY, 2.5, 1.2, lit ? matOf(AMBER) : KM.lamp, toneI, .7, 14));
  for (const dy of [-.5, .5]) parts.push(...kWire([[51.5, KY + dy, 2.5 + dy*.6], [40, KY + dy, 2.5 + dy*.6], [KX + 4.7, KY + dy, 2.5 + dy*.6]], H, .22, false));
  // ---- under the floor: socket sleeve, control unit, boil-dry cutouts, element, spreader plate, harness
  vc(KX, KY, 7.6, CU.z0, 4.2, KM.bake, .8, 24, fill(pd(on(PZ(7.6), ellUV(KX, KY, 2.2, 2.2, 14))), '#1d1a16'));
  vc(KX, KY, CU.z0, CU.z1, CU.r, KM.bake, .9, 32);
  for (const [x, y] of [[28, 31], [32.5, 30.5]]) vc(x, y, CU.z1, PLATE.z0, 1.7, METAL, .6, 16, fill(pd(on(PZ(PLATE.z0 - .02), ellUV(x, y, 1.1, 1.1, 12))), mix(COPPER.l, '#ffffff', .2)));
  const elC = st.heatV > .01 ? mix(METAL.d, GLOW, st.heatV) : METAL.d, arc = [];
  for (let a = 118; a <= 422; a += 8) arc.push(kPol(EL.r, a, EL.z));
  arc[arc.length - 1] = kPol(EL.r, 422, EL.z);
  parts.push(...kWire([kPol(5.5, 118, CU.z1 + .05), kPol(7.5, 118, EL.z), ...arc, kPol(7.5, 62, EL.z), kPol(5.5, 62, CU.z1 + .05)], elC, EL.w, true, 5));
  put([[KX - PLATE.r, KY - PLATE.r, PLATE.z0], [KX + PLATE.r, KY + PLATE.r, PLATE.z1]], `<g opacity=".5">${cyl(KX, KY, PLATE.z0, PLATE.z1, PLATE.r, KM.alu, toneI, .9, 40)}</g>`);
  const wc = lit ? Hon : H;
  for (const [dx, col] of [[-.6, wc], [0, wc], [.6, H]]) parts.push(...kWire(winSeen ? HARN(dx).slice(0, 5) : HARN(dx), col, .26, false, 3));
  rd([33.4, 56.9, 9.4], [33.4, 58, 9.4], 1.4, KM.rub, .6, 14);                          // grommet in the collar wall
  // ---- steam tube: inlet under the lid, along the top arm, down the grip to above the disc
  if (winSeen) parts.push(...kWire([[30, 53.2, 54], [30, 56, 54]], METAL.m, 1.2, false));
  else {
    parts.push(...kWire([[30, 53.2, 54], ...TUBE.map(([y, z]) => [30, y, z])], METAL.m, 1.2, false, 5));
    if (st.steam > .02) for (let i = 0; i < 8; i++){ const [y, z] = tubeAt(frac(i/8 + st.t*1.1)), p = [30, y, z];
      put(kBox([p], .2), circ(p, .7, '#ffffff', `opacity="${f(.95*st.steam)}"`)); }
    // bimetal disc on two posts, the push rod down to the lever's inner arm
    const bow = 1.6 * (1 - 2*ease(st.snapV)), hot = Math.max(0, Math.min(1, (st.disc - 40) / 50)), dc = matOf(mix(COPPER.l, GLOW, hot*.55));
    for (const x of POSTS){ vc(x, DISC_Y, 6.1, DISC_Z + 1.2, .6, METAL, .6, 10);
      bx(Math.min(x, x + (DISC.x - x)*.22), DISC_Y - .5, DISC_Z + .45, Math.max(x, x + (DISC.x - x)*.22), DISC_Y + .5, DISC_Z + 1.1, METAL); }
    vc(DISC.x, DISC_Y, DISC_Z - .4, DISC_Z + .4, DISC.r, dc, .8, 28,
      fill(pd(on(PZ(DISC_Z + .45), ellUV(DISC.x, DISC_Y, 2.6, 2.6, 18))), bow > 0 ? mix(dc.l, '#ffffff', .35) : dc.d));
    const zc = DISC_Z + bow - .75;
    vc(DISC.x, DISC_Y, zc - ROD, Math.min(zc, DISC_Z - .4), .6, METAL, .5, 10);
    // lever: pivot pin, inner arm, peg over the microswitch plunger
    const th = levAng(st), aP = u => [30, PIV[0] + u*Math.cos(th), PIV[1] + u*Math.sin(th)];
    put([[26.5, PIV[0] - .6, PIV[1] - .6], [33.5, PIV[0] + .6, PIV[1] + .6]], cylX(26.5, 33.5, PIV[0], PIV[1], .5, METAL, toneI, .5, 10));
    rd(aP(-1), aP(-12), .8, CERAMIC, .7, 12);
    const pz = armZ(st, PEG_Y);
    put([[30.8, PEG_Y - .45, pz - .45], [32.6, PEG_Y + .45, pz + .45]], cylX(30.8, 32.6, PEG_Y, pz, .45, METAL, toneI, .5, 10));
    bx(...MS, KM.bake);
    vc(32.2, PEG_Y, MS[5], Math.min(MS[5] + 1.2, pz - .45), .4, matOf('#d8d2c2'), .5, 10);
    put([[NEON[0], NEON[2] - .7, NEON[3] - .7], [NEON[1], NEON[2] + .7, NEON[3] + .7]], cylX(NEON[0], NEON[1], NEON[2], NEON[3], .7, lit ? matOf('#ff8a3a') : matOf('#e2c9a8'), toneI, .6, 12));
    for (const [x, y] of [[32.2, 74.2], [33.2, 74.9]]) parts.push(...kWire([[x, MS[4], 7.4], [x, y, 7.0], [29.6, y, 7.0], [NEON[1], NEON[2], NEON[3] - .3]], lit ? Hon : H, .2, false, 3));
  }
  // the camera always looks down: the base's insides first, then the kettle's
  const lay = p => p.box[1][2] <= BASE_H + .05 ? 0 : 1;
  return [0, 1].map(i => byDepth(parts.filter(p => lay(p) === i))).join('');
}
const XR_OPTS = { getSt: () => { try { return ui.st; } catch (e) { return {}; } }, B: [0, W, 0, D, 0, H],
  mech: () => '',
  inside: st => { const lit = !!st.heat, win = vis([1,0,0]);
    return [ { at:[KX, KY - 4.2, 8.6], text:'360° SOCKET', on: lit },
      { at:[KX - CU.r, KY, 11], text:'CONTROL UNIT', on: lit },
      { at:[32.5, 30.5, 13.7], text:'BOIL-DRY CUTOUT', on: false },
      { at:[KX + PLATE.r*.7, KY - PLATE.r*.7, PLATE.z1], text:'SPREADER PLATE', on: st.heatV > .3 },
      { at: cAt(21, 2.95), text:'CORD GRIP', on: false },
      { at:[KX + EL.r*Math.cos(-.6), KY + EL.r*Math.sin(-.6), EL.z], text:'HEATER', on: lit },
      { at:[win ? XW : 30, 68, 40], text:'STEAM TUBE', on: st.steam > .2 },
      { at:[win ? XW : DISC.x, DISC_Y - (win ? 3.5 : 0), DISC_Z + .4], text:'BIMETAL DISC', on: st.disc > 75 },
      { at:[win ? XW : MS[3], 71.5, MS[5]], text:'MICROSWITCH', on: lit },
      ...(gripOut() ? [ { at:[30, PIV[0] + 1.9, PIV[1]], text:'SWITCH', on: st.click > 0 || st.bounce > 0 } ] : []) ]; } };
const XR_CAPTION = st => {
  if (st.heat && st.steam > .2) return 'Boiling: steam under the lid runs down the steam tube in the handle and blows on the bimetal disc. When it reaches about 90°C the disc snaps down, its push rod knocks the lever’s inner arm down, a peg on the arm presses the microswitch plunger and the contacts open.';
  if (st.heat) return 'Heating: the base pin’s rings meet the 360° socket, the control unit sends live through the harness to the closed microswitch in the handle and back to the element brazed under the spreader plate. The neon behind the rocker glows.';
  if (st.snapped) return 'Switched off: the hot disc has snapped down and its push rod holds the lever arm on the microswitch. The kettle can’t be switched on again until the disc cools and snaps back up.';
  return 'Off: the lever’s peg holds the microswitch in the handle open. Under the floor the element is brazed to an aluminium spreader plate; two boil-dry cutouts on the control unit press on it and cut the power if the kettle boils dry. Mains enters the base through the cord grip to the base pin.';
};

let KWIN = '';
XR_OPTS.under = true; XR_OPTS.over = st => `<g opacity="${f(ease(st.xr || 0))}">${kettleMech(st)}</g>` + KWIN;   // inside parts over the ghost, then the handle cutaway
scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'16', turn:'full', title:'Electric kettle', hint:'switch it on and watch what switches it off',
  idea:'Boiling water makes steam; a tube carries it to a bimetal disc that snaps when hot and trips the switch.',
  size:[W, D, H], palette:'cobalt', state:st,
  scene,
  readout: st => st.heat ? (st.steam > .2 ? 'boiling: steam is heating the disc' : 'heating') : 'off',
  stats: st => [
    { label:'Water', value: Math.round(st.temp) + '°C' },
    { label:'Steam at the disc', value: Math.round(st.disc) + '°C', small:true },
    { label:'In the kettle', value: st.vol.toFixed(1) + ' L', small:true } ],
  buttonsLabel:'Kettle',
  buttons:[
    { label:'Fill water', choices: st => [
        { label:'Half, 0.8 L', onClick: fillTo(.8), disabled: st.vol >= .78 },
        { label:'Full, 1.7 L', onClick: fillTo(CAP), disabled: st.vol >= CAP - .02 } ] },
    { label:'Switch on', onClick: switchOn },
    { label:'Switch off', onClick: switchOff },
  ],
  params:(st, q) => {
    if (q.has('vol')) st.vol = Math.max(0, Math.min(CAP, +q.get('vol')));
    if (q.has('temp')) st.temp = +q.get('temp');
    if (q.has('disc')) st.disc = +q.get('disc');
    if (q.get('on') === '1'){ st.heat = true; st.heatV = 1; st.leverV = 1; st.bub = Math.max(0, Math.min(1, (st.temp - 62) / 38)); }
    if (q.has('steam')) st.steam = +q.get('steam');
    if (q.get('snap') === '1'){ st.snapped = true; st.snapV = 1; }
    if (q.has('lid')) st.lid = st.lidT = +q.get('lid');
    if (q.has('pour')) st.pour = +q.get('pour');
    if (q.has('fill')){ st.fillTo = Math.min(CAP, +q.get('fill')); st.lidT = st.lid = 1; st.pour = 1; }
    if (q.has('t')) st.t = +q.get('t');
  },
});
if (st.heat || st.temp > 20.6 || st.fillTo != null) run();
xrMount(() => ui, XR_CAPTION);