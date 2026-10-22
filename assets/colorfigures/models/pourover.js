/* ============================================================
   Filter coffee set: burr grinder, gooseneck kettle on its heating base, cone dripper with a paper filter
   on a glass server, a cup on a saucer and a rest saucer, all on a wooden board.

   THE REAL PROCESS (where every material is after each step)
   start  beans in the grinder hopper · grinder bin empty · dry paper filter in the dripper, dripper on the server ·
          server empty · kettle full of cold water (20 C) on its base · cup empty
   1 Heat water   the base heats the kettle: water 20 -> 93 C, still in the kettle (steam at the spout)
   2 Grind beans  beans: hopper -> burrs -> chute -> grounds in the bin (hopper keeps the rest of the beans)
   3 Add grounds  bin pulled out, carried over the dripper, tipped: grounds -> paper filter; bin back, empty
   4 Pour water   kettle lifted over the dripper: bloom pour (wets the bed), wait, spiral pour; water: kettle -> slurry
                  in the filter -> coffee drips through the paper -> server; kettle back on its base; drawdown leaves the
                  spent, wet bed in the filter
   5 Serve        dripper (spent grounds) lifted off the server -> rest saucer; server tipped: coffee -> cup; server back, empty
   Out of order: a step whose inputs are missing runs the missing steps first (and says so); repeats say why not.
   ============================================================ */

/* ---------- layout (x = depth toward viewer-right, y = toward viewer-left, z = up; ~2 units per cm) ---------- */
const BH = 4, BRD = [0, 0, 84, 156];
const GY = 16;                                   // the grinder unit sits this far to the left of where it was drawn (air between the objects)
const BTOP = boardTop(BRD[0], BRD[1], BRD[2], BRD[3], BH, 6);
const DEG = Math.PI / 180;

const K_REST = [30, 18, BH + 6];                 // kettle bottom centre, standing on its base
const S_REST = [40, 76, BH];                     // server bottom centre
const D_ON = [40, 76, BH + 24];                  // dripper bottom centre when sitting on the server
const ZTOP = D_ON[2] + 20.6;                     // top of the paper filter (where streams enter)
const CUPC = [68, 62];                           // cup + saucer
const D_REST = [70, 108, BH + 1.2];              // dripper on the rest saucer
const B_REST = [42, 116 + GY, BH], B_SLIDE = [53, 116 + GY, BH + 2];   // grounds bin under the chute, pulled out
const B_LIP = [0, -6, 9], B_TILT = 105 * DEG;
const S_TARGET = [65.5, 62, BH + 1.2 + 13 + 7.5];              // where the server's spout goes when pouring
const S_T0 = 50 * DEG, S_T1 = 96 * DEG, SERVER_FULL = .55;
const K_TILT = 22 * DEG;

/* ---------- materials ---------- */
const GM = { l:'#ebe7dd', m:'#c9c3b5', d:'#8a8476' };         // grinder body
const PAPER = { l:'#fbf8ef', m:'#ebe4d2', d:'#cfc6af' };
const GLASS = '#cfe9f0', WATER = '#bfe4f2', COFFEE = '#4a2914', COFFEE_TOP = '#6d4224', CREMA = '#a36b3c';
const DRY = '#946238', WET = '#4a2c18', BEAN = '#5e371d', BEAN_L = '#8a5732';
const GREEN = '#43c25c', RED = '#e2483d';

/* ---------- small helpers ---------- */
const rotX = (p, a) => [p[0], p[1]*Math.cos(a) + p[2]*Math.sin(a), -p[1]*Math.sin(a) + p[2]*Math.cos(a)];   // a > 0: top leans toward +y
const rotY = (p, a) => [p[0]*Math.cos(a) + p[2]*Math.sin(a), p[1], -p[0]*Math.sin(a) + p[2]*Math.cos(a)];   // a > 0: top leans toward +x
const add3 = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp01 = t => Math.max(0, Math.min(1, t));
const sstep = (a, b, t) => { const k = clamp01((t - a) / (b - a)); return k*k*(3 - 2*k); };
const place = (base, rot = p => p) => ({ p: q => add3(base, rot(q)), n: rot, base });
const ringL = (T, h, r, n = 28) => ellUV(0, 0, r, r, n).map(([u, v]) => T.p([u, v, h]));
function lathe(T, spec, m, shade = tone, n = 28){
  const rings = spec.map(([h, r]) => ringL(T, h, r, n));
  let s = '';
  for (let i = 0; i < rings.length - 1; i++) s += loft(rings[i], rings[i+1], nr => shade(nr, m));
  return { s, rings, top: rings[rings.length-1], pts: rings.flat() };
}
const capTop = (T, ring, m, shade = tone) => { const nr = T.n([0,0,1]); return vis(nr) ? fill(pd(ring), shade(nr, m)) : ''; };
// visible front half of a horizontal ring (a seam line round a round body)
// toward-viewer amount of a direction, and the local angle (deg) of a round part that points at the viewer
const towardV = n => { const r = rotV(n); return r[0] + r[1] + r[2]; };
const viewAng = T => Math.atan2(towardV(T.n([0,1,0])), towardV(T.n([1,0,0]))) / DEG;
const facesV = (T, n) => towardV(T.n(n)) > 0;
// the half of a horizontal ring that faces the viewer (follows the camera; -45..135 in the default view)
const frontArc = (T, h, r, w = .8) => { const c = viewAng(T), o = []; for (let a = c - 90; a <= c + 90.01; a += 7.5) o.push(T.p([r*Math.cos(a*DEG), r*Math.sin(a*DEG), h])); return ink(pd(o, false), w); };
let CLIPS = 0;
const clipS = (pts2, inner) => { const id = 'cs' + (++CLIPS); return `<clipPath id="${id}"><path d="${sp(pts2)}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };
const screenHull = pts3 => hull(pts3.map(p => P(...p)));
// pseudo-random but fixed
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// soft tube (spout, handles): smoothed 3D polyline drawn as ink + colour strokes (widths in model units)
function smooth3(pts, it = 3){
  for (let k = 0; k < it; k++){ const o = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i+1];
      o.push(a.map((v, j) => v*.75 + b[j]*.25), a.map((v, j) => v*.25 + b[j]*.75)); }
    o.push(pts[pts.length-1]); pts = o; }
  return pts;
}
function tube(pts, r, m){
  const q = smooth3(pts), d = pd(q, false), sw = w => `style="stroke-width:${f(w)}"`, cap = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const hl = 'M' + q.map(p => { const [X, Y] = P(...p); return f(X - r*.3) + ' ' + f(Y - r*.35); }).join('L');
  return `<path d="${d}" ${cap} stroke="${INK}" ${sw(2*r + 2.2*INK_K)}/>` + `<path d="${d}" ${cap} stroke="${m.m}" ${sw(2*r)}/>`
    + `<path d="${hl}" ${cap} stroke="${m.l}" ${sw(r*.6)} opacity=".9"/>`;
}
// falling stream: starts along `dir` from a, curves down to b
function arcPts(a, dir, b, n = 14){
  const c = [a[0] + dir[0]*3, a[1] + dir[1]*3, a[2]], o = [];
  for (let i = 0; i <= n; i++){ const t = i/n; o.push([0,1,2].map(j => (1-t)*(1-t)*a[j] + 2*(1-t)*t*c[j] + t*t*b[j])); }
  return o;
}
// split a falling polyline at height z: [part above, part below]
function splitZ(pts, z){
  const up = [], dn = [];
  pts.forEach((p, i) => {
    if (p[2] >= z){ up.push(p); return; }
    if (i > 0 && pts[i-1][2] >= z){ const q = pts[i-1], c = lerp3(q, p, (q[2] - z) / (q[2] - p[2])); up.push(c); dn.push(c); }
    dn.push(p);
  });
  return [up, dn];
}
const streamSvg = (pts, col, w = 1.5) => { if (!pts || pts.length < 2) return ''; const d = pd(pts, false);
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 1.4}" stroke-linecap="round" stroke-linejoin="round"/>`
       + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; };
const grainSvg = (pts, clock) => { if (!pts || pts.length < 2) return ''; const d = pd(pts, false);
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-dasharray="1.4 1.2" stroke-dashoffset="${f(-clock*30)}" stroke-linecap="round" opacity=".55"/>`
       + `<path d="${d}" fill="none" stroke="${DRY}" stroke-width="1.8" stroke-dasharray="1.4 1.2" stroke-dashoffset="${f(-clock*30)}" stroke-linecap="round"/>`; };

// liquid that stays level inside a (possibly tilted) round container. spec = interior profile [[h, r]...]
// returns screen hulls of the liquid body and its top surface
function liquid(T, spec, frac){
  if (frac < .004) return null;
  const h0 = spec[0][0], h1 = spec[spec.length-1][0];
  const rAt = h => { for (let i = 0; i < spec.length - 1; i++){ const [ha, ra] = spec[i], [hb, rb] = spec[i+1];
    if (h <= hb || i === spec.length - 2) return ra + (rb - ra) * clamp01((h - ha) / ((hb - ha) || 1)); } };
  const NH = 20, dh = (h1 - h0) / NH, smp = [];
  for (let i = 0; i < NH; i++){ const h = h0 + (i + .5)*dh, R = rAt(h);
    for (const k of [.3, .65, .92]) for (let j = 0; j < 8; j++){ const a = (j + k*3) / 8 * 2*Math.PI;
      smp.push([T.p([k*R*Math.cos(a), k*R*Math.sin(a), h])[2], k*R*R]); } }
  const e = Math.max(dh / 2, 1.2), tot = smp.reduce((s, q) => s + q[1], 0);
  const vol = z => smp.reduce((s, [zi, w]) => s + w * clamp01((z - zi + e) / (2*e)), 0);
  let lo = Math.min(...smp.map(q => q[0])) - e, hi = Math.max(...smp.map(q => q[0])) + e;
  for (let it = 0; it < 26; it++){ const mid = (lo + hi) / 2; if (vol(mid) < frac * tot) lo = mid; else hi = mid; }
  const zl = (lo + hi) / 2, body = [], surf = [];
  const NL = 12;
  for (let j = 0; j < 24; j++){ const a = j / 24 * 2*Math.PI;
    let prev = null;
    for (let i = 0; i <= NL; i++){ const h = h0 + i/NL*(h1 - h0), R = rAt(h), q = T.p([R*Math.cos(a), R*Math.sin(a), h]);
      if (q[2] <= zl) body.push(q);
      if (prev && (prev[2] - zl) * (q[2] - zl) < 0){ const c = lerp3(prev, q, (zl - prev[2]) / (q[2] - prev[2])); body.push(c); surf.push(c); }
      prev = q; } }
  if (body.length < 3) return null;
  return { body: screenHull(body), surf: surf.length > 2 ? screenHull(surf) : null, zl };
}

/* ---------- kettle (gooseneck, on a heating base) ---------- */
const K_BODY = [[0,10.6],[1,11.6],[17,11.6],[19.5,10.4],[21,8.6]];
const SPOUT = [[0,10.6,3.5],[0,13.2,4.6],[0,14.8,8.5],[0,15.4,13.5],[0,16,18.5],[0,17.4,22],[0,19.8,23.4],[0,22.2,22.8],[0,23.4,21.6]];
const K_HANDLE = [[0,-10.8,19.5],[0,-14.5,20.5],[0,-16.8,17],[0,-16.6,9],[0,-14.5,6],[0,-11.2,5.5]];
const KTIP = SPOUT[SPOUT.length-1];
function kettleT(st){
  const a = K_TILT * st.kTilt;
  const target = [40 + st.kSx, 74.5 + st.kSy, ZTOP + 11];   // the spout tip stays well above the dripper's rim (at +5 it dipped inside it)
  const pour = add3(target, rotX(KTIP, a).map(v => -v));
  const base = lerp3(K_REST, pour, st.kP);
  base[2] += 6 * Math.sin(Math.PI * st.kP);      // lift up before swinging over
  return place(base, p => rotX(p, a));
}
const kettlePts = T => [...ringL(T, 0, 11.6, 12), ...ringL(T, 21, 8.6, 12), T.p([0,0,24]), ...SPOUT.map(T.p), ...K_HANDLE.map(T.p)];
function heaterBase(st){
  let s = box(16, 4, BH, 44, 32, BH + 6, DARK, tone, 1.2);
  if (vis([1,0,0])){
  s += act('heat', shape(on(PX(44.1), rrUV(8.5, 5.4, 21.5, 9.2, 1)), '#1d2a26', .8)
     + tx(44.2, 15, 6.3, `${Math.round(st.temp)}C`, 2.8, '#8af0ae', 800));
  s += fill(pd(on(PX(44.15), ellUV(26.5, 7.3, 1.1, 1.1, 12))), st.heating ? RED : st.temp >= 90 ? GREEN : '#8c867a') + ink(pd(on(PX(44.15), ellUV(26.5, 7.3, 1.1, 1.1, 12))), .6);
  }
  return s;
}
function kettleBody(st, T, m, spout = ''){
  const hdl = tube(K_HANDLE.map(T.p), 1.5, DARK), hF = facesV(T, [0,-1,0]), sF = facesV(T, [0,1,0]);
  let s = (hF ? '' : hdl) + (sF ? '' : spout);                   // handle (-y) / spout (+y) behind the body
  const b = lathe(T, K_BODY, m);
  s += b.s + capTop(T, b.top, m);
  s += ink(pd(ringL(T, 21.02, 7)), .8);                           // lid seam
  const kn = lathe(T, [[21,1.9],[23,1.9],[24,1.2]], DARK, toneI, 16);
  s += kn.s + capTop(T, kn.top, DARK, toneI) + hullInk(kn.pts, .9);
  s += frontArc(T, 17, 11.62, .8);
  s += hullInk(b.pts, 2.4);
  s += (hF ? hdl : '') + (sF ? spout : '');                      // ... or in front of it
  return s;
}
const kettleSpoutTube = (T, m) => tube(SPOUT.map(T.p), 1.1, m);
function kettleSpout(st, T, m, withTube = true){
  let s = withTube ? kettleSpoutTube(T, m) : '';
  // steam from the spout once the water is hot (not while pouring)
  if (st.temp > 70 && st.kP === 0){
    const tip = T.p(KTIP), op = clamp01((st.temp - 70) / 20) * .75;
    for (let k = 0; k < 3; k++){ const o = [];
      for (let i = 0; i < 9; i++) o.push([tip[0] - k*1.2, tip[1] + 1 + k*1.6 + Math.sin(i*.8 + st.clock*3 + k*2) * 1.3, tip[2] + 1.5 + i*2.1 + k*.8]);
      s += `<path d="${pd(o, false)}" fill="none" stroke="#a9bcc4" stroke-width="1.6" stroke-linecap="round" opacity="${f(op * (1 - k*.2))}"/>`; }
  }
  return s;
}

/* ---------- glass server ---------- */
const SRV = [[0,8.2],[1.2,9.2],[9,9.8],[17,9.2],[21,8],[23,8],[24,8.6]];
const SRV_IN = [[.9,7.8],[1.8,8.6],[9,9.2],[17,8.6],[21,7.4],[23.4,7.4]];
const S_TIP = [11.2, 0, 24.8];
const S_HANDLE = [[-9.2,0,19.5],[-13.2,0,18.8],[-14.4,0,13],[-13.4,0,7],[-9.4,0,5]];
function serverT(st){
  const a = st.sTilt, pour = add3(S_TARGET, rotY(S_TIP, a).map(v => -v));
  const base = lerp3(S_REST, pour, st.sP);
  base[2] += 8 * Math.sin(Math.PI * st.sP);
  return place(base, p => rotY(p, a));
}
const serverPts = T => [...ringL(T, 0, 8.2, 12), ...ringL(T, 9, 9.8, 12), ...ringL(T, 24, 8.6, 12), ...S_HANDLE.map(T.p)];
function server(st, T, dripOn){
  const hdl = tube(S_HANDLE.map(T.p), 1.3, DARK), hF = facesV(T, [-1,0,0]);
  let s = hF ? '' : hdl;                                          // handle behind the glass
  const rings = SRV.map(([h, r]) => ringL(T, h, r)), all = rings.flat();
  // far wall of the glass (banded), then the coffee, then a light tint over the whole body
  let bands = ''; for (let i = 0; i < rings.length - 1; i++) bands += loft(rings[i], rings[i+1], nr => toneI(nr, CLEAR));
  s += `<g opacity=".3">${bands}</g>`;
  const liq = liquid(T, SRV_IN, st.server);
  if (liq){ s += fill(sp(liq.body), COFFEE); if (liq.surf) s += fill(sp(liq.surf), COFFEE_TOP) + ink(sp(liq.surf), .5); }
  // drips from the dripper's hole into the server
  if (dripOn && st.drip){
    const top = [D_ON[0], D_ON[1], D_ON[2] - .2], zb = liq ? liq.zl : BH + 1;
    s += `<path d="${pd([top, [top[0], top[1], zb]], false)}" fill="none" stroke="${COFFEE}" stroke-width="1.1" stroke-dasharray="2.2 1.6" stroke-dashoffset="${f(-st.clock*40)}" stroke-linecap="round"/>`;
  }
  s += fill(sp(hull(all.map(p => P(...p)))), GLASS, 'opacity=".2"');
  const streak = (a0, a1, h0, h1, r) => fill(pd([T.p([r*Math.cos(a0*DEG), r*Math.sin(a0*DEG), h0]), T.p([r*Math.cos(a1*DEG), r*Math.sin(a1*DEG), h0]),
    T.p([r*Math.cos((a1+6)*DEG), r*Math.sin((a1+6)*DEG), h1]), T.p([r*Math.cos((a0+6)*DEG), r*Math.sin((a0+6)*DEG), h1])]), '#ffffff', 'opacity=".42"');
  const c = viewAng(T);                                           // glints stay on the side facing the viewer
  s += streak(c - 35, c - 27, 3, 16, 9.85) + streak(c - 21, c - 18, 4, 15, 9.85);
  // spout lip + rims
  s += shape([T.p([7.8,-2.6,24]), T.p([11.2,0,24.8]), T.p([7.8,2.6,24])], CLEAR.l, .8);
  if (!dripOn) s += ink(pd(rings[rings.length-1]), 1.1);
  s += frontArc(T, 0, 8.2, .8) + frontArc(T, 21, 8, .7);
  s += hullInk(all, 2.2);
  if (hF) s += hdl;                                               // handle in front of the glass
  return s;
}

/* ---------- dripper (cone, paper filter) ---------- */
const rPaper = h => h <= 18.4 ? 3.6 + (h - 3.2) / 15.2 * 7.4 : 11 + (h - 18.4) / 2.2 * .8;
const BED_H = 12, SLURRY_H = 18;
function dripT(st){
  const base = lerp3(D_ON, D_REST, st.dP);
  base[2] += 16 * Math.sin(Math.PI * st.dP);
  return place(base);
}
const dripPts = T => [...ringL(T, 0, 10, 12), ...ringL(T, 18.4, 12, 12), ...ringL(T, 20.6, 11.8, 12)];
const bedH = st => 3.2 + (BED_H - 3.2) * st.bedG;
const slurryH = st => bedH(st) + (SLURRY_H - bedH(st)) * st.slurry;
function dripper(st, T, m, inner = ''){
  let s = '';
  const fl = lathe(T, [[0,10],[1.4,10]], m);
  s += fl.s + capTop(T, fl.top, m) + ink(pd(fl.top), .8) + hullInk(fl.pts, 1.6);   // flange outline now, before the cone covers its back half
  const nk = lathe(T, [[1.4,4.6],[2.4,4.6]], m);
  const cn = lathe(T, [[2.4,5.4],[18.4,12]], m, (nr, mm) => tone([nr[0], nr[1], 0], mm));   // shade the cone like an upright wall
  s += nk.s + cn.s;
  s += `<path d="${pd(ringL(T, 18.4, 12))}${pd(ringL(T, 18.4, 11))}" fill="${tone([0,0,1], m)}" fill-rule="evenodd"/>` + ink(pd(ringL(T, 18.4, 12)), 1);
  // inside, seen through the top of the paper
  const ptop = ringL(T, 20.6, 11.8);
  let inn = fill(pd(ringL(T, 3.2, 3.6)), toneI([0,0,1], PAPER)) + loft(ringL(T, 3.2, 3.6), ringL(T, 18.4, 11), nr => toneI(nr, PAPER), true) + loft(ringL(T, 18.4, 11), ptop, nr => toneI(nr, PAPER), true);
  if (st.bedG > .01){
    const hb = bedH(st), col = mix(DRY, WET, st.wet);
    inn += fill(pd(ringL(T, hb, rPaper(hb))), col);
    let dots = '';
    for (let i = 0; i < 26; i++){ const a = rnd(i) * 2*Math.PI, r = Math.sqrt(rnd(i + 50)) * rPaper(hb) * .85;
      dots += pd(on(PZ(0), ellUV(0, 0, .35, .35, 6)).map(([u, v]) => T.p([u + r*Math.cos(a), v + r*Math.sin(a), hb + .05]))); }
    inn += `<path d="${dots}" fill="${st.wet > .5 ? '#2e1b0e' : '#b88456'}"/>`;
  }
  if (st.slurry > .01){
    const hs = slurryH(st), ring = ringL(T, hs, rPaper(hs));
    inn += fill(pd(ring), CREMA) + ink(pd(ring), .5);
    let bub = '';
    for (let i = 0; i < 14; i++){ const a = rnd(i + 7) * 2*Math.PI + st.clock*.6, r = Math.sqrt(rnd(i + 90)) * rPaper(hs) * .8, rr = .35 + rnd(i + 3)*.4;
      bub += pd(on(PZ(0), ellUV(0, 0, rr, rr, 8)).map(([u, v]) => T.p([u + r*Math.cos(a), v + r*Math.sin(a), hs + .05]))); }
    inn += `<path d="${bub}" fill="#d9ad7c" opacity=".8"/>`;
  }
  inn += inner;
  s += clipTo(ptop, inn);
  s += loft(ringL(T, 18.4, 11), ptop, nr => toneI(nr, PAPER));    // paper standing above the rim
  s += ink(pd(ptop), 1) + frontArc(T, 2.4, 5.4, .8);
  s += hullInk([...cn.pts, ...ptop], 2.2);   // cone + paper outline (the flange's was drawn with the flange)
  return s;
}

/* ---------- cup on a saucer, rest saucer ---------- */
const CUP_OUT = [[0,4.6],[1,5.4],[12,7],[13,7.2]];
const CUP_HANDLE = [[0,6.9,10.6],[0,10.2,10.2],[0,11.5,7],[0,10,4],[0,6.2,3.2]];
const cupT = place([CUPC[0], CUPC[1], BH + 1.2]);
const saucerT = place([CUPC[0], CUPC[1], BH]);
const restT = place([D_REST[0], D_REST[1], BH]);
const rIn = h => 4.6 + (h - 1.6) / 11.4 * 1.9;
const cupH = st => 1.6 + 9.6 * st.cup;
function saucer(T){
  const sc = lathe(T, [[0,8.6],[1.2,10]], CERAMIC, toneI);
  return sc.s + capTop(T, sc.top, CERAMIC, toneI) + ink(pd(ringL(T, 1.22, 6.2)), .6) + hullInk(sc.pts, 1.6);
}
function cup(st, m, inner = ''){
  const T = cupT;
  let s = saucer(saucerT);
  const b = lathe(T, CUP_OUT, m), hdl = tube(CUP_HANDLE.map(T.p), 1, m), hF = facesV(T, [0,1,0]);
  if (!hF) s += hdl;                                                // handle (+y) behind the cup
  s += b.s;
  s += `<path d="${pd(ringL(T, 13, 7.2))}${pd(ringL(T, 13, 6.5))}" fill="${CERAMIC.l}" fill-rule="evenodd"/>`;
  let inn = loft(ringL(T, 1.6, 4.6), ringL(T, 13, 6.5), nr => toneI(nr, CERAMIC), true) + fill(pd(ringL(T, 1.6, 4.6)), CERAMIC.m);
  if (st.cup > .01){ const h = cupH(st), ring = ringL(T, h, rIn(h));
    inn += fill(pd(ring), COFFEE_TOP) + ink(pd(ring), .5) + fill(pd(ringL(place(add3(T.base, [-1.2, 1.2, 0])), h + .05, rIn(h)*.45)), CREMA, 'opacity=".55"'); }
  inn += inner;
  s += clipTo(ringL(T, 13, 6.5), inn);
  s += ink(pd(ringL(T, 13, 6.5)), .9) + hullInk(b.pts, 2.2);
  if (hF) s += hdl;                                                 // handle in front of the cup
  return s;
}
const cupPts = () => [...ringL(saucerT, 0, 8.6, 12), ...ringL(saucerT, 1.2, 10, 12), ...ringL(cupT, 13, 7.2, 12), ...CUP_HANDLE.map(cupT.p)];

/* ---------- grinder (burr grinder with a clear hopper and a clear grounds bin) ---------- */
const GOUT = rrUV(104, BH, 128, 44, 3);
const HB = [17, 107, 33, 125, 44], HT = [15, 105, 35, 127, 58];
const hq = t => HB.map((v, i) => lerp(v, HT[i], t));
const rectZ = ([x0, y0, x1, y1, z], ins = 0) => [[x0+ins, y0+ins, z], [x1-ins, y0+ins, z], [x1-ins, y1-ins, z], [x0+ins, y1-ins, z]];
const grinderPts = () => [].map.call([], x => x).concat(grinderPts0()).map(([x, y, z]) => [x, y + GY, z]);
const grinderPts0 = () => [...on(PX(14), GOUT), ...on(PX(36), GOUT), ...rectZ(HT), ...rectZ([14.5, 104.5, 35.5, 127.5, 60.5])];
const grinder = st => { const d = Dv(0, GY, 0); return `<g transform="translate(${d[0].toFixed(2)} ${d[1].toFixed(2)})">${grinderAt(st)}</g>`; };
function grinderAt(st){
  const jx = st.grinding ? .25*Math.sin(st.clock*90) : 0, jy = st.grinding ? .2*Math.sin(st.clock*130 + 1) : 0;
  OX += jx; OY += jy;
  try {
    let s = extrude(GOUT, 14, 36, GM);
    const FX = vis([1,0,0]), SY = vis([0,1,0]);                  // front (+x) / dial side (+y) toward the viewer
    s += FX ? shape(on(PX(36), GOUT), tone([1,0,0], GM), 0) + ink(pd(on(PX(36), GOUT)), 2)
            : shape(on(PX(14), GOUT), tone([-1,0,0], GM), 0) + ink(pd(on(PX(14), GOUT)), 2);
    // side: grind-size dial set to FILTER
    const sd = tone([0,1,0], GM);
    if (SY){
    s += shape(on(PY(128.15), ellUV(25, 31, 4.6, 4.6, 24)), METAL.l, 1);
    for (let k = 0; k < 7; k++){ const a = (150 - k*30)*DEG; s += ink(pd([[25 + 5.6*Math.cos(a), 128.2, 31 + 5.6*Math.sin(a)], [25 + 6.6*Math.cos(a), 128.2, 31 + 6.6*Math.sin(a)]], false), .6); }
    s += ink(pd([[25, 128.25, 31], [25 + 3.6*Math.cos(60*DEG), 128.25, 31 + 3.6*Math.sin(60*DEG)]], false), 1.2);
    s += txY(25, 128.2, 21.5, 'FILTER', 2.6, mix(sd, '#000000', .45), 800);
    }
    // front: grind button with a ring light, label, chute
    if (FX){
    const lit = st.grinding ? GREEN : '#a39d90';
    s += act('grind', fill(pd(on(PX(36.1), ellUV(116, 34, 3.7, 3.7, 24))), lit) + ink(pd(on(PX(36.1), ellUV(116, 34, 3.7, 3.7, 24))), .8)
       + cylX(36.1, st.grinding ? 36.8 : 37.7, 116, 34, 2.7, METAL, toneI, 1, 22));
    s += tx(36.15, 116, 27.8, 'GRIND', 2.4, GM.d, 800);
    s += shape(on(PX(36.05), rrUV(114.2, 20.2, 117.8, 23.6, .8)), '#2a2724', 1.1)          // grounds outlet
       + ink(pd(on(PX(36.06), [[114.2, 23.8], [117.8, 23.8]]), false), .8);
    }
    s += hullInk([...on(PX(14), GOUT), ...on(PX(36), GOUT)], 2.6);
    // hopper: far walls, beans, near walls, lid
    const b = hq(0), t = hq(1);
    const wall = (n, pts) => ({ n, pts });
    const walls = [
      wall([-1,0,.14], [[b[0],b[1],b[4]],[b[0],b[3],b[4]],[t[0],t[3],t[4]],[t[0],t[1],t[4]]]),
      wall([0,-1,.14], [[b[0],b[1],b[4]],[b[2],b[1],b[4]],[t[2],t[1],t[4]],[t[0],t[1],t[4]]]),
      wall([1,0,.14],  [[b[2],b[1],b[4]],[b[2],b[3],b[4]],[t[2],t[3],t[4]],[t[2],t[1],t[4]]]),
      wall([0,1,.14],  [[b[0],b[3],b[4]],[b[2],b[3],b[4]],[t[2],t[3],t[4]],[t[0],t[3],t[4]]]) ];
    for (const w of walls) if (!vis(w.n)) s += fill(pd(w.pts), GLASS, 'opacity=".35"') + ink(pd(w.pts), .6);
    if (st.beans > .01){
      const lv = .05 + .85 * st.beans, top = rectZ(hq(lv), .5), bot = rectZ(hq(.02), .5);
      const hullB = screenHull([...top, ...bot]);
      let bn = fill(sp(hullB), BEAN) + fill(pd(top), BEAN_L);
      let beans = '', seams = '', i = 0;
      const bean = (pl, u, v, k) => { const ru = k ? 1.25 : .85, rv = k ? .85 : 1.25;
        beans += pd(on(pl, ellUV(u, v, ru, rv, 10)));
        seams += pd(on(pl, k ? [[u - ru*.7, v], [u + ru*.7, v]] : [[u, v - rv*.7], [u, v + rv*.7]]), false); };
      for (let z = 45.4; z < top[0][2] + 1; z += 2.1) for (let y = 108; y < 125; y += 2.4){ i++;   // front wall
        const tz = (z - 44) / 14; bean(PX(FX ? lerp(33, 35, tz) - .3 : lerp(17, 15, tz) + .3), y + rnd(i)*1.2, z + rnd(i + 9)*.6, i % 2); }
      for (let z = 45.4; z < top[0][2] + 1; z += 2.1) for (let x = 18; x < 33; x += 2.4){ i++;      // left wall
        const tz = (z - 44) / 14; bean(PY(SY ? lerp(125, 127, tz) - .3 : lerp(107, 105, tz) + .3), x + rnd(i)*1.2, z + rnd(i + 9)*.6, i % 2); }
      const tp = hq(lv);
      for (let x = tp[0] + 1.5; x < tp[2] - 1; x += 2.6) for (let y = tp[1] + 1.5; y < tp[3] - 1; y += 2.6){ i++;   // top of the pile
        bean(PZ(tp[4] + .1), x + rnd(i), y + rnd(i + 4), i % 2); }
      bn += `<path d="${beans}" fill="${BEAN_L}" stroke="${INK}" stroke-width=".45"/>` + `<path d="${seams}" fill="none" stroke="${INK}" stroke-width=".45"/>`;
      s += clipS(hullB, bn);
    }
    for (const w of walls) if (vis(w.n)) s += fill(pd(w.pts), GLASS, 'opacity=".3"') + ink(pd(w.pts), 1);
    s += fill(pd([[t[2]+.1, 110, 47], [t[2]+.1, 112.5, 47], [t[2]+.1, 118, 57], [t[2]+.1, 115.5, 57]].map(([x, y, z]) => [FX ? lerp(33, 35, (z - 44)/14) + .1 : lerp(17, 15, (z - 44)/14) - .1, y, z])), '#ffffff', 'opacity=".45"');
    s += box(14.5, 104.5, 58, 35.5, 127.5, 60.5, DARK, tone, 1.1);
    const kn = lathe(place([25, 116, 60.5]), [[0,3],[1.8,3],[2.4,2.4]], DARK, toneI, 20);
    s += kn.s + capTop(place([25, 116, 60.5]), kn.top, DARK, toneI) + hullInk(kn.pts, .9);
    return s;
  } finally { OX -= jx; OY -= jy; }
}

/* ---------- grounds bin ---------- */
function binT(st){
  const a = -B_TILT * st.bT;
  let base;
  if (st.bP <= 1) base = lerp3(B_REST, B_SLIDE, st.bP);
  else { const e = st.bP - 1, pour = add3([40, 77.5, ZTOP + 4.5], rotX(B_LIP, -B_TILT).map(v => -v));
    base = lerp3(B_SLIDE, pour, e); base[2] += 10 * Math.sin(Math.PI * e); }
  return place(base, p => rotX(p, a));
}
const BX = [-5, 5], BY = [-6, 6], BZ = 9;
const binPts = T => { const o = []; for (const x of BX) for (const y of BY) for (const z of [0, BZ]) o.push(T.p([x, y, z])); return o; };
function bin(st, T, streamOut = ''){
  const [x0, x1] = BX, [y0, y1] = BY, h = BZ;
  const F = [
    [[1,0,0],  [[x1,y0,0],[x1,y1,0],[x1,y1,h],[x1,y0,h]]],
    [[-1,0,0], [[x0,y0,0],[x0,y1,0],[x0,y1,h],[x0,y0,h]]],
    [[0,1,0],  [[x0,y1,0],[x1,y1,0],[x1,y1,h],[x0,y1,h]]],
    [[0,-1,0], [[x0,y0,0],[x1,y0,0],[x1,y0,h],[x0,y0,h]]],
    [[0,0,-1], [[x0,y0,0],[x1,y0,0],[x1,y1,0],[x0,y1,0]]] ];
  let s = '';
  for (const [n, q] of F) if (!vis(T.n(n))) s += fill(pd(q.map(T.p)), GLASS, 'opacity=".35"') + ink(pd(q.map(T.p)), .6);
  if (st.binG > .01){
    const zt = .6 + 7 * st.binG, c = [];
    for (const x of [-4.4, 4.4]) for (const y of [-5.4, 5.4]) for (const z of [.6, zt]) c.push(T.p([x, y, z]));
    s += fill(sp(screenHull(c)), '#7a4a28');
    const topF = [[-4.4,-5.4,zt],[4.4,-5.4,zt],[4.4,5.4,zt],[-4.4,5.4,zt]].map(T.p);
    if (vis(T.n([0,0,1]))) s += fill(pd(topF), DRY);
    let d = ''; for (let i = 0; i < 22; i++) d += pd(on(PX(vis(T.n([1,0,0])) ? 4.42 : -4.42), ellUV(-5 + rnd(i)*10, .9 + rnd(i + 30)*(zt - 1.2), .28, .28, 6)).map(T.p));
    s += `<path d="${d}" fill="#3b2312"/>`;
  }
  // grounds falling from the chute into the bin while grinding
  if (st.grindFlow){ const zt = BH + .6 + 7 * st.binG; s += grainSvg([[36.6, 116 + GY, 20.6], [39, 116 + GY, (20.6 + zt)/2], [41.5, 116 + GY, zt]], st.clock); }
  s += streamOut;                                                   // grounds pouring out (behind the near walls)
  for (const [n, q] of F) if (vis(T.n(n))) s += fill(pd(q.map(T.p)), GLASS, 'opacity=".32"') + ink(pd(q.map(T.p)), .9);
  s += ink(pd([[x0,y0,h],[x1,y0,h],[x1,y1,h],[x0,y1,h]].map(T.p)), 1.1);
  s += hullInk(binPts(T), 1.8);
  return s;
}

// see-through sorter: orders only the pairs that overlap on screen (box-separated pairs by their gap, the rest by
// centre depth), then a topological pass; a loop is broken at its farthest part (LESSONS 27-28)
function mSortP(parts){
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
/* ---------- see-through: the three pieces with working insides ----------
   The dripper, paper, server, cup and saucer are passive and already visible; the kettle, its heating base and the
   grinder have hidden parts. Each is ghosted on its own and its parts are drawn over it, in its own depth slot.
   Parts (each held by another; current and grounds each run from a real port to a real port):
   KETTLE   stainless base plate (the floor) . sheathed element in a C under it . two cold leads to the plug .
            NTC temperature sensor clipped under the plate, its leads . dry-boil cutout (bimetal disc), its leads .
            360-degree connector plug in the bottom recess . the water
   BASE     360-degree socket with three ring contacts . control board on four standoffs . display module behind the
            window . status LED . relay . capacitor . chip . cord grommet in the back wall . live and neutral to the
            board . three wires from the board to the socket
   GRINDER  hopper throat (funnel) . burr carrier (outer conical burr) . inner conical burr with its cutting ridges .
            feed worm on top . crown ring under the carrier . grind-size dial shaft through the side wall and its pinion
            on the crown ring . drive shaft . shaft bushing . big reduction gear . motor pinion . gear plate on four posts
            . DC motor . cooling fan under it . grounds chute from the burr chamber to the front outlet . grind
            microswitch behind the button . control board on the back wall . cord grommet . wires board-switch,
            board-motor, cord-board */
const PO_COP = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, PO_GM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' }, PO_PCB = { l:'#4fa36a', m:'#2f8a4a', d:'#1d5f31' };
const PO_LIT = matOf('#ff9a3a'), PO_HOT = matOf('#ff5a2a'), PO_STEEL = matOf('#aeb6ba'), PO_RUB = { l:'#5a5752', m:'#403d39', d:'#2a2825' };
const pBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - .2), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + .2)];
function pWire(pts, col, r = .3, ends = true){
  const out = [], L = 3, n = pts.length, sw = w => `style="stroke-width:${f(w)}"`;
  const q = []; for (let i = 0; i < n - 1; i++){ const a = pts[i], b = pts[i + 1], k = Math.max(1, Math.ceil(Math.hypot(...a.map((v, j) => v - b[j])) / L)); for (let t = 0; t < k; t++) q.push(a.map((v, j) => v + (b[j] - v)*t/k)); } q.push(pts[n - 1]);
  for (let i = 0; i < q.length - 1; i++){ const seg = [q[i], q[i + 1]], d = pd(seg, false), cap = i === 0 || i === q.length - 2 ? 'round' : 'butt';
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-linecap="${cap}" ${sw(2*r + .5)}/><path d="${d}" fill="none" stroke="${col}" stroke-linecap="${cap}" ${sw(2*r)}/>`;
    if (ends && i === 0){ const [X, Y] = P(...q[0]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".4" fill="${INK}"/>`; }
    if (ends && i === q.length - 2){ const [X, Y] = P(...q[i + 1]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".4" fill="${INK}"/>`; }
    out.push({ box: pBoxOf(seg), svg }); }
  return out;
}
const pBox = (put, x0, y0, z0, x1, y1, z1, m, w = .5) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
const pCyl = (put, x, y, z0, z1, r, m, w = .5, n = 18) => put([[x - r, y - r, z0], [x + r, y + r, z1]], cyl(x, y, z0, z1, r, m, toneI, w, n));
// ---- heater base
function baseMech(st){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg }), on = st.heating;
  for (const [x, y] of [[34.6, 6.6], [42, 6.6], [34.6, 29.4], [42, 29.4]]) pCyl(put, x, y, BH + .2, BH + 1, .45, PO_GM, .3, 10);
  pBox(put, 34.2, 6, BH + 1, 42.6, 30, BH + 1.5, PO_PCB, .5);
  pBox(put, 42.6, 8.5, BH + 1.5, 43.4, 21.5, BH + 5.2, matOf('#1d2a26'), .4);                     // display module
  pBox(put, 42.6, 26, BH + 2.9, 43.4, 27, BH + 3.7, on ? matOf(RED) : matOf('#8c867a'), .3);       // LED
  pBox(put, 35, 22.6, BH + 1.5, 38, 27, BH + 3.8, matOf('#3e6fb0'), .4);                           // relay
  pCyl(put, 36.4, 10, BH + 1.5, BH + 4, .9, matOf('#2f5a8a'), .4, 14);                             // capacitor
  pBox(put, 38.6, 12, BH + 1.5, 40.6, 16, BH + 2.1, DARK, .3);                                     // chip
  // the socket: a round tower under the kettle, its top flush with the base, three ring contacts
  { let sk = cyl(30, 18, BH + 2.4, BH + 6, 3, PO_RUB, toneI, .6, 22);
    if (vis([0,0,1])) for (const r of [.7, 1.5, 2.3]) sk += `<path d="${pd(on2(PZ(BH + 6.02), ellUV(30, 18, r, r, 20)))}" fill="none" stroke="${on ? '#ffb347' : METAL.l}" stroke-width=".5"/>`;
    put([[27, 15, BH + 2.4], [33, 21, BH + 6]], sk); }
  pBox(put, 16, 25, BH + 1.6, 17.4, 27.6, BH + 3.6, PO_RUB, .4);                                   // cord grommet
  const L = on ? '#ffb347' : '#8a3a24', N = '#3a5a9a';
  parts.push(...pWire([[17.4, 25.8, BH + 2.6], [24, 25.8, BH + 1.6], [34.6, 25.8, BH + 1.55]], '#8a3a24'));
  parts.push(...pWire([[17.4, 26.8, BH + 2.6], [24, 27.4, BH + 1.6], [34.6, 28.4, BH + 1.55]], N));
  for (const [i, y] of [17, 18, 19].entries()){ const xs = 30 + Math.sqrt(9 - (y - 18)**2);
    parts.push(...pWire([[35, y, BH + 1.55], [34, y, BH + 3], [xs, y, BH + 3.6]], i === 0 ? L : i === 1 ? N : '#4a8a4a', .25)); }
  return mSortP(parts);
}
const on2 = (pl, uv) => uv.map(pl);
// ---- the kettle (in its own frame, so it follows the lift and tilt)
function kettleMech(st, T){
  const parts = [], put = (b, svg) => parts.push({ box: pBoxOf(b.map(T.p)), svg }), heat = st.heating;
  const lring = (h, r, n = 28) => ringL(T, h, r, n), lc = (h0, h1, r, m, w = .5, n = 20) => { const A = lring(h0, r, n), B = lring(h1, r, n), up = T.n([0,0,1]);
    return loft(A, B, nr => toneI(nr, m)) + (vis(up) ? fill(pd(B), toneI(up, m)) + ink(pd(B), w*.7) : fill(pd(A), toneI(up.map(v => -v), m)) + ink(pd(A), w*.7)) + hullInk([...A, ...B], w); };
  const box8 = (x0, y0, z0, x1, y1, z1) => [[x0,y0,z0],[x1,y1,z1],[x0,y1,z0],[x1,y0,z1]];
  // connector plug in the bottom recess
  put(box8(-2.6, -2.6, 0, 2.6, 2.6, 1), lc(0, 1, 2.6, PO_RUB, .6));
  // element: a C of sheathed tube under the plate, split near/far by the view so the plug sorts between
  const elM = heat ? PO_HOT : PO_COP, elPts = []; for (let a = 20; a <= 340; a += 10) elPts.push([6.5*Math.cos(a*DEG), 6.5*Math.sin(a*DEG), .95]);
  { const far = [], near = []; let cur = null;   // two continuous runs: the half turned away, the half toward the viewer
    for (const q of elPts){ const nf = towardV(T.n([q[0], q[1], 0])) > 0; (nf ? near : far).push(q); }
    for (const run of [far, near]) if (run.length > 1){ run.sort((u, v) => Math.atan2(u[1], u[0]) - Math.atan2(v[1], v[0]));
      const segs = []; let sg = [run[0]]; for (let i = 1; i < run.length; i++){ if (Math.hypot(run[i][0] - run[i-1][0], run[i][1] - run[i-1][1]) > 1.3){ segs.push(sg); sg = []; } sg.push(run[i]); } segs.push(sg);
      for (const sgm of segs) if (sgm.length > 1){ const d = pd(sgm.map(T.p), false);
        put(sgm.map(v => v).concat(sgm.map(v => [v[0], v[1], v[2] + .6])), `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${elM.m}" style="stroke-width:1" stroke-linecap="round" stroke-linejoin="round"/>`); } } }
  // cold leads from both element ends to the plug, sensor and cutout with their leads
  const lead = (a, b, col) => { const d = pd([a, b].map(T.p), false); put([a, b], `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:.8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" style="stroke-width:.45" stroke-linecap="round"/><circle cx="${f(P(...T.p(b))[0])}" cy="${f(P(...T.p(b))[1])}" r=".35" fill="${INK}"/>`); };
  for (const s of [-1, 1]) lead([6.5*Math.cos(20*DEG), s*6.5*Math.sin(20*DEG), .95], [2.6, s*.9, .7], heat ? '#ffb347' : '#8a3a24');
  put(box8(-4.8, -.7, .95, -3.4, .7, 1.4), (() => { const q = (x0, y0, z0, x1, y1, z1) => [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    return shape(q(-4.8, -.7, .95, -3.4, .7, 1.4).map(T.p), '#2a2622', .4) + shape([[-4.8,.7,.95],[-3.4,.7,.95],[-3.4,.7,1.4],[-4.8,.7,1.4]].map(T.p), '#3a3632', .4); })());
  lead([-3.4, 0, 1.1], [-2.6, 0, .7], '#c9cfd2');
  put(box8(-1.1, -5.3, .7, 1.1, -3.1, 1.4), lc(.7, 1.4, 1.1, PO_STEEL, .5, 16));
  lead([0, -3.1, 1], [0, -2.6, .7], '#c9cfd2');
  // the base plate (the kettle's floor) over them, faint so they show through, then the water above it
  const plate = `<g opacity=".35">${lc(1.4, 1.8, 10.5, PO_STEEL, .6, 32)}</g>`;
  put(box8(-10.5, -10.5, 1.4, 10.5, 10.5, 1.8), plate);
  const h = 15 - 8*clamp01(st.wet), zL = T.p([0, 0, h])[2], below = [], surf = [];
  for (let i = 0; i < 32; i++){ const a = i/32*2*Math.PI, A = T.p([11.2*Math.cos(a), 11.2*Math.sin(a), 1.8]), B = T.p([11.2*Math.cos(a), 11.2*Math.sin(a), 17]);
    if (A[2] >= zL) continue; below.push(A); const t = Math.min(1, (zL - A[2]) / (B[2] - A[2])), C = lerp3(A, B, t); below.push(C); surf.push(C); }
  if (surf.length > 2){ const sil = hull(below.map(p => P(...p)));
    put([[-11, -11, 1.8], [11, 11, h]], fill(sp(sil), WATER, 'opacity=".42"') + fill(pd(surf), '#dff2f8', 'opacity=".55"') + ink(pd(surf), .4)); }
  return mSortP(parts);
}
// ---- the grinder (drawn in its own coordinates, shifted GY like the body)
function grinderMech(st){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg }), g = st.grinding, cx = 25, cy = 116;
  const spin = g ? st.clock*14 : 0, live = g ? '#ffb347' : '#3a3632';
  const vring = (z, r, n = 28) => on2(PZ(z), ellUV(cx, cy, r, r, n));
  // throat: funnel from the hopper floor down into the burr carrier
  put([[cx - 4, cy - 4, 38.6], [cx + 4, cy + 4, 44]], `<g opacity=".8">${loft(vring(38.6, 2.6), vring(44, 4), n => toneI(n, CLEAR))}</g>` + ink(pd(vring(44, 4)), .5) + hullInk([...vring(38.6, 2.6), ...vring(44, 4)], .7));
  // burr carrier (outer burr): clear-cut so the inner burr shows; crown ring under it with teeth
  { const inner = (() => { let s = loft(vring(33, 3.6, 24), vring(37.6, 1.6, 24), n => toneI(n, PO_STEEL)), rid = '';
      for (let i = 0; i < 10; i++){ const a = spin + i/10*2*Math.PI, a2 = a + .6, n = [Math.cos(a + .3), Math.sin(a + .3), 0]; if (!vis(n)) continue;
        rid += pd([[cx + 3.6*Math.cos(a), cy + 3.6*Math.sin(a), 33], [cx + 1.6*Math.cos(a2), cy + 1.6*Math.sin(a2), 37.6]], false); }
      s += `<path d="${rid}" fill="none" stroke="${PO_STEEL.d}" stroke-width=".45"/>` + hullInk([...vring(33, 3.6, 24), ...vring(37.6, 1.6, 24)], .6);
      const wm = []; for (let i = 0; i <= 40; i++){ const t = i/40, a = spin + t*4*Math.PI; wm.push([cx + .9*Math.cos(a), cy + .9*Math.sin(a), 37.6 + 1.6*t]); }
      return s + cyl(cx, cy, 37.6, 39.2, .7, PO_STEEL, toneI, .4, 12) + `<path d="${pd(wm.filter((p, i) => vis([Math.cos(spin + i/40*4*Math.PI), Math.sin(spin + i/40*4*Math.PI), 0])), false)}" fill="none" stroke="${INK}" stroke-width=".4"/>`; })();
    const A = vring(32.4, 5.4), B = vring(38.6, 5.4);
    let c = loft(A, B, n => toneI(n, PO_GM), true) + inner + `<g opacity=".38">${loft(A, B, n => toneI(n, PO_GM))}</g>` + ink(pd(B), .6) + hullInk([...A, ...B], 1);
    put([[cx - 5.4, cy - 5.4, 32.4], [cx + 5.4, cy + 5.4, 38.6]], c);
    let cr = cyl(cx, cy, 31.4, 32.4, 5.8, PO_GM, toneI, .7, 32), t = '';
    for (let i = 0; i < 36; i++){ const a = i/36*2*Math.PI, n = [Math.cos(a), Math.sin(a), 0]; if (!vis(n)) continue; t += pd([[cx + 5.82*n[0], cy + 5.82*n[1], 31.4], [cx + 5.82*n[0], cy + 5.82*n[1], 32.0]], false); }
    put([[cx - 5.8, cy - 5.8, 31.4], [cx + 5.8, cy + 5.8, 32.4]], cr + `<path d="${t}" fill="none" stroke="${INK}" stroke-width=".35"/>`); }
  // grind-size dial: shaft in from the side wall, pinion under the crown ring
  put([[cx - .5, 121.6, 30.4], [cx + .5, 128, 31.4]], rod([cx, 128, 30.9], [cx, 121.6, 30.9], .5, METAL, toneI, .4, .5, 12));
  put([[cx - 1.4, 120.6, 29.5], [cx + 1.4, 121.6, 32.3]], rod([cx, 121.6, 30.9], [cx, 120.6, 30.9], 1.4, PO_STEEL, toneI, .5, 1.4, 16));
  // drive shaft, bushing, big gear, motor pinion, plate on posts
  pCyl(put, cx, cy, 23.6, 31.4, .6, METAL, .4, 12);
  pCyl(put, cx, cy, 22.3, 23.1, 1.3, PO_COP, .4, 14);
  { let gr = cyl(cx, cy, 23.1, 24.3, 5.3, PO_STEEL, toneI, .7, 36), t = '';
    for (let i = 0; i < 40; i++){ const a = spin*.25 + i/40*2*Math.PI, n = [Math.cos(a), Math.sin(a), 0]; if (!vis(n)) continue; t += pd([[cx + 5.32*n[0], cy + 5.32*n[1], 23.1], [cx + 5.32*n[0], cy + 5.32*n[1], 24.3]], false); }
    put([[cx - 5.3, cy - 5.3, 23.1], [cx + 5.3, cy + 5.3, 24.3]], gr + `<path d="${t}" fill="none" stroke="${PO_STEEL.d}" stroke-width=".35"/>`); }
  pCyl(put, cx, cy - 6.5, 23.1, 24.3, 1.2, PO_STEEL, .5, 12);
  pBox(put, 17.6, 105.4, 21.5, 32.4, 124.6, 22.3, PO_GM, .5);
  for (const [x, y] of [[18.6, 106.4], [31.4, 106.4], [18.6, 123.6], [31.4, 123.6]]) pCyl(put, x, y, BH + .6, 21.5, .5, PO_GM, .4, 10);
  // motor (hangs under the plate, its pinion above it) and its cooling fan
  pCyl(put, cx, cy - 6.5, 9, 21.5, 4, g ? PO_LIT : METAL, .7, 24);
  pCyl(put, cx, cy - 6.5, 21.5, 23.1, .45, METAL, .3, 10);
  { let fn = cyl(cx, cy - 6.5, 7.2, 7.8, 3.6, PO_GM, toneI, .5, 22), t = '';
    if (vis([0,0,1])) for (let i = 0; i < 6; i++){ const a = spin + i/6*2*Math.PI; t += pd([[cx, cy - 6.5, 7.82], [cx + 3.4*Math.cos(a), cy - 6.5 + 3.4*Math.sin(a), 7.82]], false); }
    put([[cx - 3.6, cy - 10.1, 7.2], [cx + 3.6, cy - 2.9, 7.8]], fn + `<path d="${t}" fill="none" stroke="${INK}" stroke-width=".4"/>` + cyl(cx, cy - 6.5, 7.8, 9, .45, METAL, toneI, .3, 10)); }
  // grounds chute from the burr chamber's outlet to the front opening, with grounds in it while grinding
  { const ch = [[cx + 5.4, cy, 33.4], [32.6, cy, 30], [35.8, cy, 23]], d = pd(ch, false);
    let s = `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:3.8" stroke-linecap="butt" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#d8d2c2" style="stroke-width:3" stroke-linecap="butt" stroke-linejoin="round"/>`;
    if (st.grindFlow){ let gd = ''; for (let i = 0; i < 9; i++){ const t = ((st.clock*1.6 + i/9) % 1), p = t < .5 ? lerp3(ch[0], ch[1], t*2) : lerp3(ch[1], ch[2], (t - .5)*2), [X, Y] = P(p[0], p[1] + (rnd(i) - .5), p[2] + .4); gd += `<circle cx="${f(X)}" cy="${f(Y)}" r=".45" fill="${DRY}"/>`; } s += gd; }
    put([[cx + 5.4, cy - 1.6, 22], [36, cy + 1.6, 34]], s); }
  // grind microswitch behind the button
  pBox(put, 34.2, 114.8, 32.8, 35.6, 117.2, 35.2, g ? PO_LIT : matOf('#3a3632'), .4);
  // control board on the back wall, cord grommet, wiring
  { let bd = box(14.8, 108, 10, 15.4, 124, 19, PO_PCB, toneI, .5);
    if (vis([1,0,0])) bd += box(15.4, 112, 12, 16.2, 115, 14.5, DARK, toneI, .3) + box(15.4, 117, 15, 16.6, 120, 17.4, matOf('#3e6fb0'), toneI, .3);
    put([[14.8, 108, 10], [16.6, 124, 19]], bd); }
  pBox(put, 14, 119.4, 6.4, 15.4, 121.8, 8.6, PO_RUB, .4);
  parts.push(...pWire([[15.4, 120.6, 7.5], [16, 120.6, 9], [15.4, 120.6, 10.4]], '#8a3a24', .3, false));
  parts.push(...pWire([[15.4, 108.6, 18.4], [15.6, 107.5, 28.6], [34.4, 107.5, 28.6], [34.9, 114.8, 33.6]], live));   // up the back wall, along the far side, to the switch
  parts.push(...pWire([[15.4, 110, 14.4], [18.2, 110, 14.4], [21.1, 110, 14.4]], live));
  return mSortP(parts);
}
const grinderMechAt = st => { const jx = st.grinding ? .25*Math.sin(st.clock*90) : 0, jy = st.grinding ? .2*Math.sin(st.clock*130 + 1) : 0, d = Dv(0, GY, 0);
  OX += jx; OY += jy; try { return `<g transform="translate(${d[0].toFixed(2)} ${d[1].toFixed(2)})">${grinderMech(st)}</g>`; } finally { OX -= jx; OY -= jy; } };

/* ---------- scene ---------- */
function scene(st, m){
  CLIPS = 0;
  const kT = kettleT(st), sT = serverT(st), dT = dripT(st), bT = binT(st);
  const dripOn = st.dP === 0;

  // streams: [above the receiving rim, inside it]
  let waterIn = '', waterOut = '', grainIn = '', grainOut = '', coffeeIn = '', coffeeOut = '';
  if (st.waterFlow){
    const tip = kT.p(KTIP), dir = norm(sub(tip, kT.p(SPOUT[SPOUT.length-2])));
    const tgt = [40 + st.kSx*.6, 76 + st.kSy*.6, D_ON[2] + (st.slurry > .01 ? slurryH(st) : bedH(st))];
    const [up, dn] = splitZ(arcPts(tip, dir, tgt), ZTOP);
    waterOut = streamSvg(up, WATER, 1.5); waterIn = streamSvg(dn, WATER, 1.5);
  }
  if (st.groundsFlow){
    const lip = bT.p(B_LIP), tgt = [40, 76.5, D_ON[2] + bedH(st)];
    const [up, dn] = splitZ(arcPts(lip, [0, -.4, 0], tgt), ZTOP);
    grainOut = grainSvg(up, st.clock); grainIn = grainSvg(dn, st.clock);
  }
  if (st.coffeeFlow){
    const tip = sT.p(S_TIP), dir = norm(sub(sT.p(S_TIP), sT.p([0, 0, 24])));
    const tgt = [CUPC[0] - .5, CUPC[1], BH + 1.2 + cupH(st)];
    const [up, dn] = splitZ(arcPts(tip, dir, tgt), BH + 1.2 + 13);
    coffeeOut = streamSvg(up, COFFEE, 1.5); coffeeIn = streamSvg(dn, COFFEE, 1.5);
  }

  let s = board(BRD[0], BRD[1], BRD[2], BRD[3], BH, 6, WOOD);
  // cast shadows, each object its own, all on the board
  let sh = castShadow([[16,4,BH],[44,4,BH],[44,32,BH],[16,32,BH],[16,4,BH+6],[44,4,BH+6],[44,32,BH+6],[16,32,BH+6]], BH);
  // a part held up in the air casts a softer shadow (it is off its stand for a moment)
  const air = (svg, up) => up ? `<g opacity=".5">${svg}</g>` : svg;
  sh += air(castShadow(kettlePts(kT), BH), st.kP > 0);
  sh += st.dP === 0 ? castShadow([...dripPts(dT), ...serverPts(sT)], BH)          // dripper on the server: one shadow for both
     : air(castShadow(dripPts(dT), BH), st.dP > 0 && st.dP < 1);
  sh += castShadow(grinderPts(), BH);
  sh += castShadow(cupPts(), BH);
  sh += castShadow([...ringL(restT, 0, 8.6, 12), ...ringL(restT, 1.2, 10, 12)], BH);
  // see-through glass (server, bin) casts a lighter shadow
  s += clipTo(BTOP, `<g opacity=".45">${(st.dP === 0 ? '' : castShadow(serverPts(sT), BH)) + castShadow(binPts(bT), BH)}</g>` + sh);

  const parts = [
    { at: [30, 18, 3], svg: heaterBase(st) },
    st.kP === 0 ? { at: kT.p([0, 0, 0]), svg: kettleBody(st, kT, m, kettleSpoutTube(kT, m)) + kettleSpout(st, kT, m, false) }
                : { at: kT.p([0, 0, 0]), svg: kettleBody(st, kT, m) },
    st.kP > 0 && { at: kT.p(KTIP), svg: kettleSpout(st, kT, m) },
    { at: sT.p([0, 0, 24]), svg: server(st, sT, dripOn) + (dripOn ? dripper(st, dT, m, waterIn + grainIn) : '') },
    !dripOn && { at: dT.p([0, 0, 8]), svg: dripper(st, dT, m, waterIn + grainIn) },
    { at: [25, 116 + GY, 4], svg: grinder(st) },
    { at: bT.p([0, 0, 4]), svg: bin(st, bT, grainOut) },
    { at: [CUPC[0], CUPC[1], 6], svg: cup(st, m, coffeeIn) },
    { at: [D_REST[0], D_REST[1], 1], svg: saucer(restT) },
  ];
  // objects resting on the board get their footprint box, so they are ordered by which side the viewer is on
  // (a centre point alone put the carafe's handle over the grinder and the kettle behind the dripper at some angles)
  const rest = { heater: [[18,6,0],[42,30,10]], kettle: st.kP === 0 && [[16,0,10],[44,38,42]], server: st.sP === 0 && [[25,60,0],[55,92,52]],
    dripper: st.dP === 1 && [[60,98,4],[80,118,32]], grinder: [[12,118,0],[36,146,72]], bin: st.bP === 0 && st.bT === 0 && [[36,124,0],[52,140,14]],
    cup: [[57,51,0],[79,75,18]], saucer: [[60,98,0],[80,118,4]] };
  const keys = ['heater', 'kettle', null, 'server', 'dripper', 'grinder', 'bin', 'cup', 'saucer'];
  parts.forEach((q, i) => { if (q && keys[i] && rest[keys[i]]) q.box = rest[keys[i]]; });
  // see-through: the kettle, its base and the grinder fade, each with its working parts drawn over it in its own slot
  const kx = ease(st.xr || 0);
  if (kx > 0){
    const gh = svg => `<g opacity="${f(1 - .62*kx)}">${svg}</g>`, ov = svg => `<g opacity="${f(kx)}">${svg}</g>`;
    parts[0].svg = gh(parts[0].svg) + ov(baseMech(st));
    parts[1].svg = gh(parts[1].svg) + ov(kettleMech(st, kT));
    if (parts[2]) parts[2].svg = gh(parts[2].svg);
    parts[5].svg = gh(parts[5].svg) + ov(grinderMechAt(st));
  }
  // every object on the board can be clicked for its own step (the small buttons inside keep their own action)
  const clickAs = { heater:'heat', kettle:'pour', server:'serve', dripper:'add', grinder:'grind', bin:'add', cup:'serve' };
  parts.forEach((q, i) => { if (q && keys[i] && clickAs[keys[i]]) q.svg = act(clickAs[keys[i]], q.svg); });
  s += byDepth(parts);
  s += waterOut + coffeeOut;
  return s;
}

/* ---------- behaviour ---------- */
let ui, GEN = 0;
const fresh = () => ({ temp:20, heating:false, beans:1, binG:0, bedG:0, wet:0, slurry:0, server:0, cup:0,
  kP:0, kTilt:0, kSx:0, kSy:0, bP:0, bT:0, dP:0, sP:0, sTilt:0,
  grinding:false, grindFlow:false, groundsFlow:false, waterFlow:false, coffeeFlow:false, drip:false,
  brewed:false, busy:false, clock:0 });
// run timed phases [{d seconds, s() start hook, f(k 0..1)}], then done(); a reset (GEN++) cancels it
function play(st, phases, done){
  const g = GEN; let i = 0, t = 0;
  if (phases[0].s) phases[0].s();
  ui.animate(dt => {
    if (g !== GEN) return false;
    st.clock += dt; t += dt;
    while (i < phases.length && t >= phases[i].d){ phases[i].f(1); t -= phases[i].d; i++; if (i < phases.length && phases[i].s) phases[i].s(); }
    if (i >= phases.length){ if (done) done(); return false; }
    phases[i].f(t / phases[i].d);
    return true;
  });
}
function doHeat(st, next){
  if (st.temp >= 90) return next();
  const t0 = st.temp;
  play(st, [{ d:2.4, s:() => { st.heating = true; }, f:k => { st.temp = lerp(t0, 93, ease(k)); } }],
    () => { st.heating = false; st.temp = 93; next(); });
}
function doGrind(st, next){
  if (st.binG > 0 || st.bedG > 0) return next();
  const b0 = st.beans;
  play(st, [
    { d:.3, s:() => { st.grinding = true; }, f:() => {} },
    { d:2.2, s:() => { st.grindFlow = true; }, f:k => { st.beans = lerp(b0, b0 - .6, k); st.binG = sstep(.04, 1, k); } },
    { d:.3, s:() => { st.grindFlow = false; }, f:() => {} } ],
    () => { st.grinding = false; st.grindFlow = false; st.binG = 1; next(); });
}
function doAdd(st, next){
  if (st.bedG > 0) return next();
  doGrind(st, () => play(st, [
    { d:.5, f:k => { st.bP = ease(k); } },
    { d:1.0, f:k => { st.bP = 1 + ease(k); st.bT = sstep(.35, 1, k); } },
    { d:1.1, s:() => { st.groundsFlow = true; }, f:k => { st.binG = 1 - k; st.bedG = sstep(.05, .95, k); } },
    { d:1.0, s:() => { st.groundsFlow = false; }, f:k => { st.bP = 2 - ease(k); st.bT = 1 - sstep(0, .6, k); } },
    { d:.5, f:k => { st.bP = 1 - ease(k); } } ],
    () => { st.bP = 0; st.bT = 0; st.binG = 0; st.bedG = 1; next(); }));
}
function doPour(st, next){
  if (st.brewed) return next();
  doHeat(st, () => doAdd(st, () => play(st, [
    { d:.9, f:k => { st.kP = ease(k); st.kTilt = sstep(.45, 1, k); } },
    { d:.9, s:() => { st.waterFlow = true; }, f:k => { st.wet = k; st.slurry = .3*k; } },                   // bloom
    { d:.8, s:() => { st.waterFlow = false; }, f:k => { st.kTilt = 1 - .45*Math.sin(Math.PI*k); st.slurry = .3 - .1*k; st.drip = k > .4; st.server = .02*k; } },
    { d:2.2, s:() => { st.waterFlow = true; st.drip = true; }, f:k => { const a = k*Math.PI*4, r = 2.4*Math.sin(Math.PI*k);   // spiral pour
        st.kSx = r*Math.cos(a); st.kSy = r*Math.sin(a); st.slurry = lerp(.2, .95, sstep(0, .8, k)); st.server = lerp(.02, .22, k); } },
    { d:.9, s:() => { st.waterFlow = false; st.kSx = st.kSy = 0; }, f:k => { st.kP = 1 - ease(k); st.kTilt = 1 - sstep(0, .6, k); st.slurry = lerp(.95, .6, k); st.server = lerp(.22, .34, k); } },
    { d:1.6, f:k => { st.slurry = .6*(1 - ease(k)); st.server = lerp(.34, SERVER_FULL, ease(k)); } } ],      // drawdown
    () => { st.kP = 0; st.kTilt = 0; st.slurry = 0; st.drip = false; st.server = SERVER_FULL; st.brewed = true; next(); })));
}
function doServe(st, next){
  play(st, [
    { d:1.2, s:() => { st.drip = false; }, f:k => { st.dP = ease(k); } },
    { d:.9, f:k => { st.sP = ease(k); st.sTilt = S_T0 * sstep(.25, 1, k); } },
    { d:2.0, s:() => { st.coffeeFlow = true; }, f:k => { st.sTilt = lerp(S_T0, S_T1, k); st.server = SERVER_FULL*(1 - k); st.cup = k; } },
    { d:.9, s:() => { st.coffeeFlow = false; }, f:k => { st.sP = 1 - ease(k); st.sTilt = S_T1*(1 - sstep(0, .7, k)); } } ],
    () => { st.sP = 0; st.sTilt = 0; st.server = 0; st.cup = 1; next(); });
}
function start(st, ui, fn){
  if (st.busy) return ui.flash('one step at a time');
  st.busy = true;
  fn(st, () => { st.busy = false; ui.render(); });
}
const BTN = {
  heat: (st, ui) => st.temp >= 90 ? ui.flash('the water is already hot') : start(st, ui, doHeat),
  grind: (st, ui) => {
    if (st.busy) return ui.flash('one step at a time');
    if (st.bedG > 0) return ui.flash('the grounds are in the filter already');
    if (st.binG > 0) return ui.flash('ground already - add the grounds');
    start(st, ui, doGrind);
  },
  add: (st, ui) => {
    if (st.busy) return ui.flash('one step at a time');
    if (st.bedG > 0) return ui.flash('the grounds are in the filter already');
    if (st.binG === 0) ui.flash('grinding the beans first', 2200);
    start(st, ui, doAdd);
  },
  pour: (st, ui) => {
    if (st.busy) return ui.flash('one step at a time');
    if (st.brewed) return ui.flash(st.cup > 0 ? 'brewed and served - start again' : 'brewed - now serve it');
    const miss = [st.temp < 90 && 'heating the water', st.bedG === 0 && (st.binG === 0 ? 'grinding' : 'adding the grounds')].filter(Boolean);
    if (miss.length) ui.flash(miss.join(', then ') + ' first', 2600);
    start(st, ui, doPour);
  },
  serve: (st, ui) => {
    if (st.busy) return ui.flash('one step at a time');
    if (st.cup > 0) return ui.flash('the cup is full - start again');
    if (!st.brewed) return ui.flash('nothing brewed yet - pour the water first');
    start(st, ui, doServe);
  },
};


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

const XR_OPTS = { getSt: () => { try { return ui.st; } catch (e) { return {}; } }, B: [0, BRD[2], 0, BRD[3], 0, 70], mech: () => '',
  inside: st => { const T = kettleT(st), on = st.heating, g = st.grinding;
    return [ { at: T.p([0, 6.5, .95]), text:'HEATING ELEMENT', on },
      { at: T.p([-4.1, 0, 1.4]), text:'TEMP SENSOR', on },
      { at: [33, 18, BH + 5], text:'POWER CONNECTOR', on },
      { at: [42.6, 27, BH + 1.5], text:'CONTROL BOARD', on },
      { at: [30.4, 116 + GY, 36], text:'CONICAL BURRS', on: g },
      { at: [25, 121.6 + GY, 32.4], text:'GRIND ADJUSTER', on: false },
      { at: [30.3, 116 + GY, 24.3], text:'GEARBOX', on: g },
      { at: [29, 109.5 + GY, 15], text:'MOTOR', on: g },
      { at: [35.6, 116 + GY, 35.2], text:'GRIND SWITCH', on: g },
      { at: [34.4, 116 + GY, 27], text:'GROUNDS CHUTE', on: !!st.grindFlow } ]; },
  surface: st => [ { at:[K_REST[0], K_REST[1], K_REST[2] + 30], text:'GOOSENECK KETTLE', on: false }, { at:[30, 18, BH + 6], text:'HEATER BASE', on: false },
    { at:[D_ON[0], D_ON[1], ZTOP], text:'DRIPPER', on: false }, { at:[S_REST[0], S_REST[1], BH + 20], text:'CARAFE', on: false },
    { at:[25, 116 + GY, 70], text:'GRINDER', on: false }, { at:[CUPC[0], CUPC[1], BH + 12], text:'CUP', on: false } ] };
const XR_CAPTION = st => st.heating
    ? 'Heating: the base’s board closes its relay and current runs up through the round connector into the kettle, through the element under its steel floor. The sensor clipped beside it reports the temperature, and the board switches off at 93 C; the bimetal cutout opens if the kettle ever boils dry.'
  : st.grinding
    ? 'Grinding: the button closes the switch, the board runs the motor, and its pinion turns the big gear slowly with more force. The shaft spins the inner conical burr inside the fixed outer burr; the worm on top feeds beans down, and the grounds leave by the chute into the bin. The dial turns the crown ring, which moves the outer burr up or down to set the grind size.'
  : 'Only the kettle, its base and the grinder have working insides; the dripper, paper, server and cup are what you see. Kettle: an element under the steel floor, a sensor, a dry-boil cutout and a round connector plug. Grinder: a motor and gearbox turning a conical burr under the hopper.';

XR_OPTS.inline = true;   // the scene ghosts only the kettle, its base and the grinder itself
scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'14', turn:'full', title:'Pour-over coffee set', hint:'heat, grind, add the grounds, pour, serve',
  size:[84, 156, 72], palette:'mint',
  state: fresh(),
  scene,
  readout: st => st.cup > 0 ? 'a cup of filter coffee' : st.brewed ? 'brewed - serve it' : st.bedG ? 'grounds in the filter - pour' : st.binG ? 'ground - add to the filter' : st.temp >= 90 ? 'water hot - grind' : 'heat the water',
  stats: st => [ { label:'Kettle', value: Math.round(st.temp) + '°C' },
                 { label:'Coffee', value: Math.round(450 * (st.server + st.cup * SERVER_FULL)) + ' ml', small:true } ],
  buttonsLabel:'Brew',
  buttons:[
    { label:'Heat water', onClick: BTN.heat },
    { label:'Grind beans', onClick: BTN.grind },
    { label:'Add grounds', onClick: BTN.add },
    { label:'Pour water', onClick: BTN.pour },
    { label:'Serve', onClick: BTN.serve },
    { label:'Start again', onClick: (st, ui) => { GEN++; Object.assign(st, fresh()); ui.flash('fresh beans, cold water'); } },
  ],
  acts:{ heat: (st, el, ui) => BTN.heat(st, ui), grind: (st, el, ui) => BTN.grind(st, ui), add: (st, el, ui) => BTN.add(st, ui),
          pour: (st, el, ui) => BTN.pour(st, ui), serve: (st, el, ui) => BTN.serve(st, ui) },
  // ?at=1..5: the state after that step (1 heat, 2 grind, 3 add, 4 pour, 5 serve)
  params:(st, q) => {
    const n = +(q.get('at') || 0);
    if (n >= 1) st.temp = 93;
    if (n >= 2){ st.beans = .4; st.binG = 1; }
    if (n >= 3){ st.binG = 0; st.bedG = 1; }
    if (n >= 4){ st.wet = 1; st.server = SERVER_FULL; st.brewed = true; }
    if (n >= 5){ st.dP = 1; st.server = 0; st.cup = 1; }
  },
});
xrMount(() => ui, XR_CAPTION);