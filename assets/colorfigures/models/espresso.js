/* ============================================================
   Fig. 06 — Espresso machine (retro prosumer, E61-style group)
   Units ≈ 0.37 cm. Body x 0..78 (depth), y 0..120 (width), z 4..110.
   ============================================================ */
const BX = 78, BY = 120, BZ = 110, BR = 10;
const OUT = rrUV(0, 4, BY, BZ, BR);
const TRAY = { x0:BX, x1:104, y0:4, y1:118, z0:4, z1:14 };   // nearly full width: the jug under the wand stands on it too
const CUP = { x:86, y:60, z:TRAY.z1, r:6.8, h:9.6 };          // the cup under the group
const GY = 60, GX = 86;                                        // group head axis
const SPOUT_Z = 40.5, SPOUTS = [57.5, 62.5];
const WAND_TIP = [91.3, 110.2, 34];
const COFFEE = '#4a2b18', CREMA = '#c8894b', CREMA_D = '#8a5328';
const GREEN = '#43c25c', RED = '#e2483d';
const clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
const hash = k => { const s = Math.sin(k*12.9898 + 78.233)*43758.5453; return s - Math.floor(s); };

/* ---------- shot model: t in 0..1 = a 25 s shot compressed to 4 s ---------- */
const SHOT_S = 25, SHOT_DUR = 4;
const fillOf = t => clamp((t - .14) / .82);
const pumpOf = t => t == null ? 0 : t < .08 ? 9*ease(t/.08) : t < .95 ? 9 + .3*Math.sin(t*47) : 9*(1 - (t-.95)/.05);
const flowing = t => t != null && t > .14 && t < .985;

/* ---------- small 3D helpers ---------- */
function ring(c, d, r, n=16){
  const a = Math.abs(d[2]) < .9 ? [0,0,1] : [1,0,0], u = norm(cross(d,a)), v = cross(d,u);
  return Array.from({length:n}, (_,i) => { const t=i/n*2*Math.PI, cs=Math.cos(t), sn=Math.sin(t);
    return [c[0]+r*(cs*u[0]+sn*v[0]), c[1]+r*(cs*u[1]+sn*v[1]), c[2]+r*(cs*u[2]+sn*v[2])]; });
}
// tube through a path of 3D points with per-point radii (toneI shaded), capped at the visible end(s)
function tube(pts, rs, m, w=1.1, n=16){
  const dirs = pts.map((p,i) => norm(sub(pts[Math.min(i+1,pts.length-1)], pts[Math.max(i-1,0)])));
  const R = pts.map((p,i) => ring(p, dirs[i], rs[i], n));
  let s = '';
  for (let i=0;i<R.length-1;i++) s += loft(R[i], R[i+1], nr => toneI(nr, m));
  const d1 = dirs[dirs.length-1], d0 = dirs[0].map(v=>-v);
  if (vis(d0) && rs[0] > .2) s += fill(pd(R[0]), toneI(d0,m)) + ink(pd(R[0]), w*.7);
  if (vis(d1) && rs[rs.length-1] > .2) s += fill(pd(R[R.length-1]), toneI(d1,m)) + ink(pd(R[R.length-1]), w*.7);
  return s + hullInk(R.flat(), w);
}
// a ball (orthographic sphere = circle of r·√1.5 on screen)
function ball(c, r, m, w=1){
  const [X,Y] = P(...c), R = r*1.2247;
  return `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(R)}" fill="${m.m}" stroke="${INK}" stroke-width="${w}"/>`
       + `<circle cx="${f(X-R*.28)}" cy="${f(Y-R*.3)}" r="${f(R*.42)}" fill="${m.l}"/>`;
}
// a thin bent metal pipe: thick ink stroke + metal core + highlight
function pipe(pts, wIn=3, col=METAL){
  const o = unrot([.45,0,.45]), d = pd(pts,false), hi = pd(pts.map(p => [p[0]+o[0], p[1]+o[1], p[2]+o[2]]), false);
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${wIn+1.8}" stroke-linecap="round" stroke-linejoin="round"/>`
       + `<path d="${d}" fill="none" stroke="${col.m}" stroke-width="${wIn}" stroke-linecap="round" stroke-linejoin="round"/>`
       + `<path d="${hi}" fill="none" stroke="${col.l}" stroke-width="${wIn*.32}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const zRing = (x,y,z,r,n=24) => on(PZ(z), ellUV(x,y,r,r,n));

/* ---------- turning helpers (VIEW 0..3) ---------- */
// model vector that shows up as v in the current view (inverse of rotV): keeps screen-relative offsets fixed
// (camera-relative: a highlight offset that sits up-right of a pipe in the front view stays there from every side)
const unrot = v => { const r = dot(v, CAM_B0.R), u = dot(v, CAM_B0.U), w = dot(v, CAM_B0.V); return [0,1,2].map(i => CAM_R[i]*r + CAM_U[i]*u + CAM_V[i]*w); };
// a vertical cylinder whose back is sunk into the front face (x < BX is inside the body): the rings are cut flat at x = BX
function cylCut(x, y, z0, z1, r, m, w=1.2, n=28){
  const cut = ([u,v]) => [Math.max(BX, u), v], A = on(PZ(z0), ellUV(x,y,r,r,n).map(cut)), B = on(PZ(z1), ellUV(x,y,r,r,n).map(cut));
  return loft(A, B, nr => toneI(nr, m)) + fill(pd(B), toneI([0,0,1], m)) + hullInk([...A, ...B], w) + ink(pd(B), w*.8);
}
// byDepth with a proper order: a pair of parts whose boxes are apart is a hard rule (the one on the viewer's side goes later);
// everything else goes far-to-near by centre depth. (A sort with mixed rules can break the hard ones; this cannot.)
function depthSort(parts){
  parts = parts.filter(Boolean);
  const n = parts.length, dep = parts.map(p => depthOf(p.at || boxMid(p.box))), before = parts.map(() => new Set()), left = new Set(parts.map((_, i) => i));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && sepOrder(parts[i], parts[j]) < 0) before[j].add(i);
  let out = '';
  while (left.size){
    let pick = -1;
    for (const i of left) if ([...before[i]].every(k => !left.has(k)) && (pick < 0 || dep[i] < dep[pick])) pick = i;
    if (pick < 0) for (const i of left) if (pick < 0 || dep[i] < dep[pick]) pick = i;   // (a loop of rules: nearest-last)
    left.delete(pick); out += parts[pick].svg;
  }
  return out;
}
// bounding box of a list of 3D points, for byDepth
const bbox = (pts, pad=0) => [[0,1,2].map(k => Math.min(...pts.map(p => p[k])) - pad), [0,1,2].map(k => Math.max(...pts.map(p => p[k])) + pad)];
// text lying on any vertical face: U = reading direction (model), up is +z
const txOn = (p, U, str, size, col=INK, weight=700) =>
  `<text transform="${txM(P(...p), Dv(...U), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".04em">${str}</text>`;

/* ---------- a ceramic espresso cup; level: 0..1 of coffee, or null for an empty cup ---------- */
function cupArt(cx, cy, z0, r, h, level, latte=0){
  const rAt = k => r*(.62 + .38*Math.sqrt(clamp(k)));           // tulip profile
  const ks = [0, .08, .3, .6, 1], rings = ks.map(k => zRing(cx, cy, z0+h*k, k===0 ? r*.56 : rAt(k)));
  let s = '';
  // handle (on the -y side, behind the bowl)
  const hp = [[cx, cy-r*.9, z0+h*.8],[cx, cy-r-3.2, z0+h*.86],[cx, cy-r-4.1, z0+h*.6],[cx, cy-r-3, z0+h*.3],[cx, cy-r*.72, z0+h*.24]];
  const handle = pts => `<path d="${pd(pts,false)}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
     + `<path d="${pd(pts,false)}" fill="none" stroke="${CERAMIC.m}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  const hFront = depthOf([cx, cy-r-3, z0+h*.5]) > depthOf([cx, cy, z0+h*.5]);
  if (!hFront) s += handle(hp);
  for (let i=0;i<rings.length-1;i++) s += loft(rings[i], rings[i+1], n => toneI(n, CERAMIC));
  s += hullInk(rings.flat(), 1.2);
  // handle toward the viewer: drawn over the bowl, its ends on the outer wall
  if (hFront) s += handle([[cx, cy-rAt(.8), z0+h*.8], hp[1], hp[2], hp[3], [cx, cy-rAt(.24), z0+h*.24]]);
  // rim + interior
  const top = rings[rings.length-1], inner = zRing(cx, cy, z0+h, r-.8);
  s += fill(pd(top), CERAMIC.l);
  let inside = fill(pd(inner), CERAMIC.d);
  const zf = z0 + 1.2;
  inside += fill(pd(zRing(cx, cy, zf, rAt(.1)-.8)), CERAMIC.m);
  if (level != null && level > 0){
    const zl = zf + level*(h - 3.2), rl = rAt((zl - z0)/h) - .8;
    inside += fill(pd(zRing(cx, cy, zl, rl)), COFFEE);
    const cr = rl * (.45 + .45*clamp(level*1.4));
    inside += fill(pd(on(PZ(zl+.01), ellUV(cx-.3, cy+.2, cr, cr*.94, 24))), CREMA);
    inside += ink(pd(on(PZ(zl+.02), ellUV(cx-.3, cy+.2, cr, cr*.94, 24))), .5).replace(INK, CREMA_D);
    if (latte > 0){   // milk foam: a pale ring that spreads, with a white heart poured into it
      const k = rl*clamp(latte*1.25), Z = PZ(zl+.03);
      inside += fill(pd(on(Z, ellUV(cx, cy, rl*(.35+.6*clamp(latte*1.5)), rl*(.35+.6*clamp(latte*1.5))*.96, 24))), '#e9c9a0');
      if (latte > .25){ const h = k*.95;
        const heart = [...arcUV(cx-h*.28, cy+h*.3, h*.38, 90, 270, 8), [cx+h*.62, cy], ...arcUV(cx-h*.28, cy-h*.3, h*.38, 90, 270, 8).reverse()];
        inside += fill(pd(on(Z, heart.map(([u,v]) => [u,v]))), '#fbf6ec'); }
    }
  }
  s += clipTo(inner, inside);
  s += ink(pd(top), 1) + ink(pd(inner), .6);
  return s;
}

/* ---------- milk jug: steel pitcher, local origin at its base centre; spout toward -y, handle toward +y ---------- */
const MILK = '#fbf8f0';
const JUG_REST = { x:92, y:88, z:TRAY.z1, tilt:0 };
const JUG_WAND = { x:WAND_TIP[0], y:WAND_TIP[1], z:TRAY.z1, tilt:0 };
const JUG_POUR = { x:CUP.x, y:CUP.y+21, z:CUP.z+CUP.h+3, tilt:58 };
const JUG_H = 22, JUG_PROFILE = [[0,5.4],[1.2,6.1],[8,6.7],[16,6.1],[JUG_H,5.6]];
const jugR = z => { for (let i=1;i<JUG_PROFILE.length;i++){ const [z0,r0]=JUG_PROFILE[i-1],[z1,r1]=JUG_PROFILE[i]; if (z<=z1) return r0+(r1-r0)*(z-z0)/(z1-z0); } return 5.6; };
const lerpPose = (a,b,t) => ({ x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, z:a.z+(b.z-a.z)*t + 7*Math.sin(Math.PI*t), tilt:a.tilt+(b.tilt-a.tilt)*t });
function jugPose(st){
  const at = st.jug === 'wand' ? JUG_WAND : JUG_REST;
  if (st.jugAnim){ const { from, to, t } = st.jugAnim; return lerpPose(from, to, ease(clamp(t))); }
  if (st.pour != null){ const t = st.pour;
    if (t < .22) return lerpPose(st.pourFrom, JUG_POUR, ease(t/.22));
    if (t > .8)  return lerpPose(JUG_POUR, JUG_REST, ease((t-.8)/.2));
    return JUG_POUR; }
  return at;
}
function jugXf(pose){
  const a = pose.tilt*Math.PI/180, c = Math.cos(a), sn = Math.sin(a);
  return ([x,y,z]) => [pose.x + x, pose.y + y*c - z*sn, pose.z + y*sn + z*c];
}
// surface sits ~5 below the rim (so it shows through the mouth) and froths up to the rim; drops as it pours
const milkLevel = st => JUG_H - 5 + 4*st.foam - (1 - st.milk/.5)*12;
function jugArt(st, pose){
  const T = jugXf(pose), ringAt = (z,r,n=24) => ellUV(0,0,r,r,n).map(([x,y]) => T([x,y,z]));
  const rings = JUG_PROFILE.map(([z,r]) => ringAt(z,r));
  let s = '';
  // spout lip (behind the body when upright)
  const lip = [[-2.4,-5.3,JUG_H-.4],[0,-8.8,JUG_H+1.6],[2.4,-5.3,JUG_H-.4]].map(T);
  const lipFront = depthOf(avg(lip)) > depthOf(T([0,0,JUG_H-.4]));
  // handle on the +y side
  const hp = [[0,5.8,19.5],[0,10.2,18.6],[0,11.2,12.5],[0,10,6.6],[0,6.2,4.6]].map(T);
  const hFront = depthOf(T([0,10.5,12.5])) > depthOf(T([0,0,12.5]));
  const handle = `<path d="${pd(hp,false)}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`
     + `<path d="${pd(hp,false)}" fill="none" stroke="${METAL.m}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (!hFront) s += handle;
  if (!lipFront) s += shape(lip, METAL.l, .9);
  // it is a real open pitcher: tipped toward the viewer, its mouth shows the floor and the inner wall, not the room behind
  const top = rings[rings.length-1], nTop = T([0,0,1]).map((v,i) => v - T([0,0,0])[i]);
  if (vis(nTop)){ s += fill(pd(rings[0]), METAL.d); for (let i=0;i<rings.length-1;i++) s += loft(rings[i], rings[i+1], n => toneI(n, METAL), true); }
  for (let i=0;i<rings.length-1;i++) s += loft(rings[i], rings[i+1], n => toneI(n, METAL));
  if (!vis(nTop)) s += shape(rings[0], toneI(nTop.map(v => -v), METAL), .9);     // its base, when tipped away
  s += hullInk(rings.flat(), 1.2);
  const u = unrot([1,0,0]), lineH = [[u[0],u[1],6],[u[0],u[1],15]].map(T);
  s += `<path d="${pd(lineH,false)}" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>`;
  // opening + milk (only while the mouth faces the viewer)
  if (vis(nTop) && pose.tilt < 20){
    let inside = fill(pd(top), METAL.m) + fill(pd(ringAt(JUG_H-3.5, jugR(JUG_H-3.5)-.4)), METAL.d);
    if (st.milk > 0){
      const zl = milkLevel(st), r = jugR(zl) - .3, surf = ringAt(zl, r);
      inside += fill(pd(surf), st.foam > .05 ? mix(MILK, '#efe6d6', .35*(1-st.foam)) : MILK);
      const n = Math.round(st.foam*16), seed = st.steam && st.jug === 'wand' ? Math.floor(st.time*9) : 0;
      let bub = '';
      for (let i=0;i<n;i++){ const a = hash(i*3.1+seed)*2*Math.PI, d = Math.sqrt(hash(i*7.7+seed))*r*.8, br = .35 + .55*hash(i+.5+seed);
        bub += pd(on(PZ(zl+.05), ellUV(Math.cos(a)*d, Math.sin(a)*d, br, br, 8)).map(T));
      }
      if (bub) inside += `<path d="${bub}" fill="#ffffff" stroke="#b9b0a0" stroke-width=".35"/>`;
      if (st.steam && st.jug === 'wand' && !st.jugAnim){   // the wand tip dips into the milk
        inside += `<path d="${pd([[WAND_TIP[0]-.2,WAND_TIP[1],WAND_TIP[2]+3],[WAND_TIP[0],WAND_TIP[1],zl+pose.z]],false)}" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>`
                + `<path d="${pd([[WAND_TIP[0]-.2,WAND_TIP[1],WAND_TIP[2]+3],[WAND_TIP[0],WAND_TIP[1],zl+pose.z]],false)}" fill="none" stroke="${METAL.m}" stroke-width="2.4" stroke-linecap="round"/>`;
      }
    }
    s += clipTo(top, inside);
    s += ink(pd(top), 1);
  }
  if (lipFront) s += shape(lip, METAL.l, .9);
  if (hFront) s += handle;
  return s;
}

/* ---------- gauges: a 270° dial on the front plane ---------- */
function gauge(yc, zc, t, zones, label){
  const R = 9.4, X = BX + 2.6;
  let s = cylX(BX, X - .1, yc, zc, R + 1.3, METAL, toneI, 1.3, 30);
  if (!facing([1,0,0])) return s;                 // seen from behind: only the bezel can peek out
  const face = on(PX(X), ellUV(yc, zc, R, R, 36));
  s += fill(pd(face), '#fbfaf3') + ink(pd(face), .9);
  const pt = (tt, r, dx=.05) => { const a = (225 - 270*tt)*Math.PI/180; return [X+dx, yc - r*Math.cos(a), zc + r*Math.sin(a)]; };
  for (const zn of zones){
    const arc = []; for (let i=0;i<=10;i++) arc.push(pt(zn[0] + (zn[1]-zn[0])*i/10, R - 2.4));
    s += `<path d="${pd(arc,false)}" fill="none" stroke="${zn[2]}" stroke-width="1.9"/>`;
  }
  for (let i=0;i<=20;i++){ const major = i%5===0, tt = i/20;
    s += ink(pd([pt(tt, R-.9), pt(tt, major ? R-3.6 : R-2.3)], false), major ? .75 : .4); }
  s += tx(X+.1, yc, zc - 6, label, 2.1, INK, 700);
  // needle
  const a = (225 - 270*clamp(t))*Math.PI/180, du = -Math.cos(a), dv = Math.sin(a);
  const c = [X+.15, yc, zc], at = (k, side) => [X+.15, yc + du*k - dv*side, zc + dv*k + du*side];
  s += fill(pd([at(R-2.2, 0), at(0, .7), at(-2.2, 0), at(0, -.7)]), '#c8322a') + ink(pd([at(R-2.2, 0), at(0, .7), at(-2.2, 0), at(0, -.7)]), .4);
  s += shape(on(PX(X+.2), ellUV(yc, zc, 1.1, 1.1, 12)), INK, 0);
  // glass glints
  s += `<g pointer-events="none">` + fill(pd(on(PX(X+.25), [[yc+5.5,zc+2],[yc+3.6,zc+6.6],[yc+2,zc+7.2],[yc+4.2,zc+2.4]])), '#ffffff', 'opacity=".5"') + `</g>`;
  return s;
}

/* ---------- the scene ---------- */
const WATER = { l:'#c4e8f4', m:'#93cde4', d:'#64a3c0' };
// clear water reservoir on the back, sized like a real one (about 2 L): nearly the full height of the machine, almost half
// its width and about a quarter of its depth, standing on a steel ledge low on the back panel
const RES = { x0:-20, y0:60, y1:113, z0:12, z1:101, wl:80 };

// the back (-x): removable clear water tank with a lid, power cord + plug on the floor
function backParts(st, m){
  // the tank, the cord and the plug are separate things beside each other on the back, so each is built on its own
  // and they are sorted with boxes (a fixed order drew the cord over the tank once the tank was made bigger)
  let s = '';
  const { x0, y0, y1, z0, z1, wl } = RES;
  // the tank stands on a small steel ledge screwed to the back panel (it hooks in at the top under the lid)
  s += box(x0-1.2, y0-1, z0-3, 0, y1+1, z0, METAL, toneI, 1);
  if (facing([-1,0,0])) for (const y of [y0+5, y1-5]) s += shape(on(PX(x0-1.3), ellUV(y, z0-1.5, .7, .7, 8)), METAL.d, .3);
  // water seen through the clear walls
  s += box(x0+.7, y0+.7, z0+.7, -.4, y1-.7, wl, WATER, toneI, 0);
  // clear walls: whichever faces the viewer, tinted + inked
  const walls = [
    [[0,1,0],  [[x0,y1,z0],[0,y1,z0],[0,y1,z1],[x0,y1,z1]]],
    [[0,-1,0], [[x0,y0,z0],[0,y0,z0],[0,y0,z1],[x0,y0,z1]]],
    [[-1,0,0], [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]]]];
  for (const [n, pts] of walls) if (facing(n)) s += fill(pd(pts), CLEAR.l, 'opacity=".38"') + ink(pd(pts), 1.1);
  if (facing([-1,0,0])){
    const X = x0 - .1;
    s += ink(pd([[X,y0+.8,wl],[X,y1-.8,wl]], false), .7).replace(INK, WATER.d);
    s += txOn([X-.05, (y0+y1)/2, z1-7.5], [0,1,0], 'WATER', 3.4, INK, 800);
    for (const [z, t] of [[z1-12,'MAX'],[z0+12,'MIN']]){
      s += ink(pd([[X,y0+3,z],[X,y0+8,z]], false), .8);
      s += txOn([X-.05, y0+13.5, z-1.1], [0,1,0], t, 2.6, INK, 800); }
    for (let z = z0+17; z < z1-12; z += 5) s += ink(pd([[X,y0+3,z],[X,y0+5.5,z]], false), .5);
    s += `<g pointer-events="none">` + fill(pd(on(PX(X-.05), [[y1-14,z0+8],[y1-6,z0+34],[y1-3.5,z0+34],[y1-11.5,z0+8]])), '#ffffff', 'opacity=".38"')
       + fill(pd(on(PX(X-.05), [[y1-9,z0+44],[y1-5.5,z0+56],[y1-4.4,z0+56],[y1-7.9,z0+44]])), '#ffffff', 'opacity=".38"') + `</g>`;
  }
  // flip lid on top of the tank, with a finger tab
  s += box(x0-.7, y0-.9, z1, 0, y1+.9, z1+3.2, DARK, toneI, 1.1);
  s += box(x0-2.6, (y0+y1)/2-5, z1+.7, x0-.7, (y0+y1)/2+5, z1+2.5, DARK, toneI, .9);
  const tank = s; s = '';
  // power cord: strain relief -> droops to the floor -> plug lying behind the machine
  s += cylX(-3, 0, 34, 14, 2.2, DARK, toneI, 1, 16);
  s += pipe([[-3,34,14],[-5.6,34.4,11],[-7.2,35.4,5.6],[-8.8,38,1.6],[-11,45,1.1],[-13.4,52.5,1.3],[-15,56,3.3]], 2.2, DARK);   // (a bent tube's hull would draw a chord across the bend)
  const cord = s; s = '';
  const pins = [54.3, 57.7].map(y => tube([[-22,y,3.3],[-25.2,y,3.3]], [.5,.5], METAL, .7, 8)).join('');
  const pinsFront = facing([-1,0,0]);
  if (!pinsFront) s += pins;
  s += cylX(-22, -15, 56, 3.3, 3.3, DARK, toneI, 1.1, 20);
  if (facing([1,0,0])) s += ink(pd(on(PX(-14.9), ellUV(56, 3.3, 1.3, 1.3, 10))), .6);
  else s += ink(pd([[-22.1,52.6,3.3],[-22.1,59.4,3.3]], false), .5);
  if (pinsFront) s += pins;
  return byDepth([
    { box:[[x0-2.6, y0-.6, z0-3], [0, y1+1, z1+3.2]], svg: tank },
    { box:[[-15.5, 31.5, 0], [0, 57, 16.5]], svg: cord },
    { box:[[-25.5, 52.6, 0], [-15, 59.3, 6.7]], svg: s } ]);
}

// flat details on the back panel (x = 0)
function backFace(m){
  const tB = tone([-1,0,0], m), lab = tB === m.d ? mix(m.l, '#ffffff', .25) : mix(tB, '#000000', .55);
  const B = PX(-.2);
  let s = shape(on(PX(0), OUT), tB, 0);
  s += shape(on(B, rectUV(1.5, 22, BY-1.5, 26)), toneI([-1,0,0], METAL), .9);            // chrome band wraps round
  let vents = ''; for (const z of [84,88,92,96]) vents += pd([[-.2,14,z],[-.2,54,z]], false);
  s += `<path d="${vents}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  // model / rating plate with rivets
  s += shape(on(B, rrUV(14, 46, 54, 72, 1.5)), toneI([-1,0,0], METAL), 1);
  for (const [y,z] of [[16.2,69.8],[51.8,69.8],[16.2,48.2],[51.8,48.2]]) s += shape(on(PX(-.3), ellUV(y, z, .6, .6, 8)), METAL.d, .3);
  s += txOn([-.3, 34, 65.6], [0,1,0], 'CAFFÈ · MOD. 06', 2.7, INK, 800);
  s += txOn([-.3, 34, 60.4], [0,1,0], '230V~ 50Hz 1400W', 2.2, INK, 700);
  s += txOn([-.3, 34, 55.6], [0,1,0], 'BOILER 1.8 L · 12 BAR', 2.2, INK, 700);
  s += txOn([-.3, 34, 50.8], [0,1,0], 'S/N 06-0611', 2.2, INK, 700);
  // hot-surface warning sticker
  s += shape(on(B, [[14,30],[26,30],[20,40.4]]), '#f4c430', .9);
  s += txOn([-.3, 20, 31.3], [0,1,0], '!', 6, INK, 800);
  s += txOn([-.3, 40, 34], [0,1,0], 'HOT', 3, lab, 800);
  // corner screws
  for (const [y,z] of [[9,103],[111,103],[9,15],[111,15]]){
    s += shape(on(PX(-.3), ellUV(y, z, 1.4, 1.4, 12)), toneI([-1,0,0], METAL), .6);
    s += ink(pd([[-.35,y-.9,z+.5],[-.35,y+.9,z-.5]], false), .45); }
  s += ink(pd(on(PX(0), OUT)), 2.2);
  return s;
}

// a +y or -y side panel: chrome band, CAFFÈ badge, vents (sgn = +1 for y = BY, -1 for y = 0)
function sidePanel(m, sgn){
  const n = [0,sgn,0], Y = sgn > 0 ? BY : 0, o = d => Y + sgn*d, Pl = PY(o(.2)), sideM = tone(n, m);
  let s = '';
  s += shape(on(Pl, rectUV(1.5, 22, BX-1.5, 26)), toneI(n, METAL), .9);
  s += shape(on(Pl, rrUV(16, 56, 62, 76, 10)), mix(sideM, '#ffffff', .12), 1.2);
  s += shape(on(PY(o(.3)), rrUV(19, 59, 59, 73, 7)), 'none', .6);
  s += txOn([39, o(.4), 63.4], [sgn,0,0], 'CAFFÈ', 7.6, mix(sideM, '#000000', .35), 800);
  let vents = ''; for (const z of [36,40,44]) vents += pd([[14,o(.2),z],[BX-14,o(.2),z]], false);
  s += `<path d="${vents}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  return s;
}

// cup-warmer tray on top: plate, rail (far half / cups / near half), cups
function warmer(st){
  let s = '';
  const PT = PZ(BZ + .1);
  s += shape(on(PT, rectUV(4, 8, 74, 112)), METAL.l, 1.2);
  let ribs = ''; for (let y=16; y<=104; y+=8) ribs += pd([[7,y,BZ+.15],[71,y,BZ+.15]], false);
  s += `<path d="${ribs}" fill="none" stroke="${METAL.d}" stroke-width=".8" stroke-linecap="round"/>`;
  const post = (x,y) => tube([[x,y,BZ],[x,y,BZ+7]], [1.1,1.1], METAL, .8, 10);
  const RZ = BZ + 7, CR = [[4,8],[74,8],[74,112],[4,112]];
  let k = 0; for (let i=1;i<4;i++) if (depthOf([...CR[i],RZ]) < depthOf([...CR[k],RZ])) k = i;
  const c = i => CR[(k+i+4)%4], R = i => [...c(i), RZ];
  s += post(...c(0));                                         // farthest corner
  s += pipe([R(-1), R(0), R(1)], 1.6);
  s += post(...c(1)) + post(...c(-1));
  s += byDepth([
    { at:[22,88,BZ], svg:cupArt(22, 88, BZ+.1, 6.6, 9.5, null) },
    { at:[34,66,BZ], svg:cupArt(34, 66, BZ+.1, 6.6, 9.5, null) },
    { at:[48,92,BZ], svg:act('warmcup', cupArt(48, 92, BZ+.1, 6.6, 9.5, null)) }]);
  s += pipe([R(-1), R(2), R(1)], 1.6);
  s += post(...c(2));                                         // nearest corner
  return s;
}

// things mounted on the front face (gauges, switch, lamp, knob, valve). Flat parts only when the front faces us.
// flat = printed on the face itself (drawn under everything); parts = things that stick out, sorted with the props
function frontMounted(st, m, boiler, pump){
  const fF = facing([1,0,0]);
  let s = '';
  const parts = [];
  const tf = tone([1,0,0], m), lab = tf === m.d ? mix(m.l, '#ffffff', .25) : mix(tf, '#000000', .55);
  if (fF){ s += tx(BX+.3, 12, 102, 'POWER', 2.9, lab, 800); s += tx(BX+.3, 108, 102, 'STEAM', 2.9, lab, 800); }
  // gauges
  parts.push({ at:[BX+1.3, 75, 95], box:[[BX, 64.3, 84.3],[BX+2.8, 85.7, 105.7]], svg:gauge(75, 95, boiler/2.5, [[.4,.6,GREEN],[.8,1,RED]], 'BOILER') });
  parts.push({ at:[BX+1.3, 45, 95], box:[[BX, 34.3, 84.3],[BX+2.8, 55.7, 105.7]], svg:gauge(45, 95, pump/16, [[.5,.69,GREEN],[.75,1,RED]], 'PUMP') });
  // power switch + lamp
  let pw = fF ? shape(on(PX(BX+.2), rrUV(6.5, 84, 17.5, 100, 2.5)), toneI([1,0,0], METAL), 1.1) : '';
  pw += cylX(BX, BX+1.6, 12, 92, 2.6, METAL, toneI, .9, 16);
  const lvTip = [BX+7.5, 12, 92 + (st.on ? 4.2 : -4.2)];
  pw += tube([[BX+1.6,12,92], lvTip], [1.05,.75], METAL, .9, 12) + ball(lvTip, 1.5, METAL, .8);
  if (fF) pw += tx(BX+.3, 12, 81, st.on ? 'I' : 'O', 3, lab, 800);
  pw += cylX(BX, BX+1.6, 12, 72, 4, METAL, toneI, 1, 20);
  const lamp = st.on ? matOf('#ffa22e') : matOf('#9a7a5a');
  pw += cylX(BX+1.6, BX+2.6, 12, 72, 2.9, lamp, toneI, .9, 20);
  if (fF){
    if (st.on){ const [lx,ly] = P(BX+2.7, 12, 72);
      pw += `<circle cx="${f(lx)}" cy="${f(ly)}" r="7" fill="#ffb347" opacity=".35"/><circle cx="${f(lx)}" cy="${f(ly)}" r="4.2" fill="#ffd27a" opacity=".45"/>`; }
    pw += fill(pd(on(PX(BX+2.7), ellUV(12.9, 73.1, .9, .7, 10))), '#ffffff', 'opacity=".75"');
  }
  parts.push({ at:[BX+3, 12, 84], box:[[BX, 6.5, 68],[BX+9.2, 17.5, 100]], svg:act('power', pw) });
  // steam knob + valve
  let sk = cylX(BX, BX+1.6, 108, 92, 6.2, METAL, toneI, 1.1, 24);
  sk += cylX(BX+1.6, BX+6.5, 108, 92, 4.8, DARK, toneI, 1.1, 24);
  if (fF){
    const ka = (st.steam ? -90 : 0)*Math.PI/180, kx = BX+6.6;
    sk += ink(pd([[kx, 108, 92],[kx, 108 - 3.8*Math.sin(ka), 92 + 3.8*Math.cos(ka)]], false), 1.3).replace(INK, '#e9e3d3');
    for (const a of [0, -90]){ const r=a*Math.PI/180; sk += shape(on(PX(BX+.3), ellUV(108 - 7.8*Math.sin(r), 92 + 7.8*Math.cos(r), .7, .7, 8)), a===0 ? INK : '#e9e3d3', .4); }
  }
  parts.push({ at:[BX+3, 108, 92], box:[[BX, 101.8, 85.8],[BX+6.6, 114.2, 98.2]], svg:act('steam', sk) });
  return { flat:s, parts };
}

// free-standing things in front of the machine: drip tray first (everything stands on it), the rest by depth
function frontProps(st, m){
  // drip tray with grate + shot timer
  let tr = box(TRAY.x0, TRAY.y0, TRAY.z0, TRAY.x1, TRAY.y1, TRAY.z1, METAL, toneI, 1.4);
  tr += shape(on(PZ(TRAY.z1+.05), rectUV(TRAY.x0+2.5, TRAY.y0+3, TRAY.x1-2.5, TRAY.y1-3)), METAL.m, .9);
  let slots = ''; for (let y = TRAY.y0+6; y <= TRAY.y1-6; y += 4.4) slots += pd([[TRAY.x0+4.5,y,TRAY.z1+.1],[TRAY.x1-4.5,y,TRAY.z1+.1]], false);
  tr += `<path d="${slots}" fill="none" stroke="${DARK.d}" stroke-width="1.5" stroke-linecap="round"/>`;
  if (facing([1,0,0])){
    tr += ink(pd([[TRAY.x1,TRAY.y0,TRAY.z1-2.2],[TRAY.x1,TRAY.y1,TRAY.z1-2.2]], false), .7);
    tr += shape(on(PX(TRAY.x1+.1), rrUV(14, 6, 34, 13, 1.3)), '#1d2a26', 1);
    if (st.on) tr += tx(TRAY.x1+.2, 24, 7.8, timerText(st), 4.4, '#8af0ae', 700);
  }
  const parts = [];

  // the cup under the group (slides out / drops in)
  if (st.cup !== 'none' || st.cupAnim){
    let dx = 0, dz = 0, op = 1;
    if (st.cupAnim){ const t = st.cupAnim.t;
      if (st.cupAnim.kind === 'out'){ dx = 14*ease(clamp(t/.55)); dz = 10*ease(clamp((t-.45)/.55)); op = 1 - clamp((t-.55)/.45); }
      else { dz = 12*(1 - ease(t)); op = clamp(t*2); } }
    let c = '';
    if (dz < .5) c += fill(pd(on(PZ(CUP.z+.15), ellUV(CUP.x+dx+.6, CUP.y+.4, CUP.r*.78, CUP.r*.78, 20))), '#000000', 'opacity=".22"');
    c += cupArt(CUP.x+dx, CUP.y, CUP.z+dz, CUP.r, CUP.h, st.fill > 0 ? st.fill : null, st.latte);
    parts.push({ at:[CUP.x+dx, CUP.y, CUP.z+dz], box:[[CUP.x+dx-CUP.r, CUP.y-CUP.r-4.2, CUP.z+dz],[CUP.x+dx+CUP.r, CUP.y+CUP.r, CUP.z+dz+CUP.h]],
      svg:act('cup', `<g opacity="${op.toFixed(2)}">${c}</g>`) });
  }
  const rimZ = CUP.z + CUP.h;

  // coffee streams: spouts -> cup surface (lower part seen only through the rim); they sit above the cup, under the group
  if (flowing(st.shot) && st.cup === 'cup' && !st.cupAnim){
    const zf = CUP.z + 1.2, zl = zf + st.fill*(CUP.h - 3.2);
    const tail = st.shot > .93, dash = tail ? '1.2 3.2' : '4 1.3', off = f(-st.time*38);
    const strm = (z0, z1, y) => `<path d="${pd([[GX,y,z0],[GX,y,z1]],false)}" fill="none" stroke="${COFFEE}" stroke-width="${tail ? 1 : 1.35}" stroke-linecap="round" stroke-dasharray="${dash}" stroke-dashoffset="${off}"/>`;
    let up = '', low = '';
    for (const y of SPOUTS){ up += strm(SPOUT_Z, rimZ, y); low += strm(rimZ, zl, y); }
    parts.push({ at:[GX, GY, 30], box:[[GX-1, SPOUTS[0]-1, rimZ],[GX+1, SPOUTS[1]+1, SPOUT_Z]], svg: up + clipTo(zRing(CUP.x, CUP.y, rimZ, CUP.r-.8), low) });
  }

  // group head + portafilter (click to pull). The round parts are half sunk into the front face, so they are cut flat at x = BX.
  let g = '';
  const ear = box(GX-1.5, GY+9.6, 53.6, GX+1.5, GY+11.4, 56, METAL, toneI, .8);
  const earFront = depthOf([GX, GY+10.5, 55]) > depthOf([GX, GY, 55]);
  if (!earFront) g += ear;
  for (const y of SPOUTS) g += tube([[GX,y,SPOUT_Z],[GX,y,43.6]], [1.05,1.05], METAL, .8, 12);
  g += cyl(GX, GY, 43.4, 46.2, 3.8, METAL, toneI, 1);
  g += cylCut(GX, GY, 46, 53.6, 9, METAL, 1.3);
  g += cylCut(GX, GY, 53.4, 56.2, 10.2, METAL, 1.2);
  if (earFront) g += ear;                      // ear of the portafilter
  g += cylCut(GX, GY, 56, 57.8, 9.8, DARK, 1);
  g += cylCut(GX, GY, 57.6, 63.2, 10.6, METAL, 1.3);
  const prof = rrUV(GY-11, 63, GY+11, 81, 4);
  g += extrude(prof, BX, 93, METAL, toneI) + (facing([1,0,0]) ? shape(on(PX(93), prof), toneI([1,0,0], METAL), 1.2) : '') + hullInk([...on(PX(BX), prof), ...on(PX(93), prof)], 1.5);
  g += cylX(93, 94.2, GY, 72, 3.4, METAL, toneI, .9, 18);
  if (facing([1,0,0])) g += shape(on(PX(94.3), ellUV(GY, 72, 1.6, 1.6, 12)), METAL.d, .6);
  // handle: steel neck + bakelite grip, tilting slightly down toward the viewer; seen from behind it is beyond the group
  const hz = x => 50.6 - (x - 95)*.14;
  let hd = tube([[94.5,GY,hz(94.5)],[100,GY,hz(100)]], [2.1,1.8], METAL, 1, 16);
  const hx = [100, 101, 110, 119, 122.6, 124.2, 125.1];
  hd += tube(hx.map(x => [x, GY, hz(x)]), [2.5, 2.9, 3.1, 3.5, 3.3, 2.5, 1.2], DARK, 1.3, 18);
  const hl = unrot([0,0,1]), hlo = [hl[0]*3.1, hl[1]*3.1, hl[2]*3.1];   // grip highlight on the lit (screen-top) side
  hd += ink(pd([[106+hlo[0],GY+hlo[1],hz(106)+hlo[2]],[118+hlo[0],GY+hlo[1],hz(118)+hlo[2]]], false), .9).replace(INK, DARK.l);
  g = CAM_V[0] >= 0 ? g + hd : hd + g;
  parts.push({ at:[GX, GY, 46], box:[[GX-10.6, GY-11, SPOUT_Z],[125.5, GY+11.4, 81]], svg:act('pull', g) });
  // E61 lever on top of the group: swings forward while brewing
  const la = (st.lever != null ? st.lever : -14) * Math.PI/180, piv = [GX, GY, 81];
  let lv = cyl(GX, GY, 81, 83, 2.6, METAL, toneI, .9, 16);
  const tip = [piv[0] + 10*Math.sin(la), GY, piv[2] + 2 + 10*Math.cos(la)];
  lv += tube([[GX, GY, 83], tip], [1.2, .9], METAL, .9, 12) + ball(tip, 2.4, DARK, 1);
  parts.push({ at:[GX, GY, 88], box:[[GX-5, GY-2.6, 81],[GX+12.5, GY+2.6, 98]], svg:act('pull', lv) });

  // milk jug: under the wand it is drawn with the wand (the nozzle dips into it); elsewhere it sorts on its own
  const jp = jugPose(st);
  const nearWand = st.pour != null ? Math.hypot(jp.x - JUG_WAND.x, jp.y - JUG_WAND.y) < 8
    : st.jug === 'wand' ? !(st.jugAnim && st.jugAnim.t < .5) : !!(st.jugAnim && st.jugAnim.t >= .5);
  const JT = jugXf(jp), jBox = bbox([...[0, JUG_H].flatMap(z => ellUV(0,0,6.7,6.7,8).map(([x,y]) => JT([x,y,z]))), JT([0,-8.8,JUG_H+1.6]), JT([0,11.2,12.5])]);
  const ju = act('jug', jugArt(st, jp));
  if (st.pour != null && st.pour > .3 && st.pour < .78 && st.cup === 'cup'){   // milk stream from the spout into the cup (after the cup: it goes into it)
    const sp0 = JT([0,-8.6,JUG_H+1.4]), zl = CUP.z + 1.2 + st.fill*(CUP.h-3.2);
    const top = [sp0, [CUP.x, CUP.y-.5, rimZ]], low = [[CUP.x, CUP.y-.5, rimZ], [CUP.x, CUP.y-.5, zl]], off = f(-st.time*30);
    const strm = pts => `<path d="${pd(pts,false)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="${pd(pts,false)}" fill="none" stroke="${MILK}" stroke-width="1.9" stroke-linecap="round" stroke-dasharray="5 1.2" stroke-dashoffset="${off}"/>`;
    parts.push({ at:avg([sp0, [CUP.x, CUP.y, rimZ]]), box:bbox([sp0, [CUP.x, CUP.y-.5, rimZ]], .8), svg:strm(top) + clipTo(zRing(CUP.x, CUP.y, rimZ, CUP.r-.8), strm(low)) });
  }
  if (!nearWand) parts.push({ at:[jp.x, jp.y, jp.z + 11], box:jBox, svg:ju });

  // steam wand: valve -> ball joint -> bent pipe -> nozzle, then the jug on it
  const wand = [[BX+4,108,74],[84.6,108,74],[86.6,108.2,73.3],[88,108.5,71.6],[88.6,108.8,69.4],[WAND_TIP[0]-.2,WAND_TIP[1],WAND_TIP[2]+3]];
  const nozzle = `<path d="${pd([[WAND_TIP[0]-.2,WAND_TIP[1],WAND_TIP[2]+3],WAND_TIP],false)}" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>`
    + `<path d="${pd([[WAND_TIP[0]-.2,WAND_TIP[1],WAND_TIP[2]+3],WAND_TIP],false)}" fill="none" stroke="${DARK.l}" stroke-width="2.4" stroke-linecap="round"/>`;
  const valve = cylX(BX, BX+4, 108, 74, 3, METAL, toneI, 1, 16), arm = pipe(wand, 2.9) + ball([BX+4.4,108,74], 2.6, METAL, .9);
  let w, wBox = [[BX, 104.5, WAND_TIP[2]-.5],[BX+16, 112, 77.2]];
  if (nearWand){
    // the wand comes down from above into the jug: the jug goes first, the wand's arm over it (it is above the rim and in
    // front of the far inner wall), and the nozzle, which dips below the rim, only where it shows through the opening
    const mouth = ellUV(0, 0, jugR(JUG_H) - .2, jugR(JUG_H) - .2, 24).map(([x,y]) => JT([x, y, JUG_H]));
    w = valve + ju + act('steam', arm + clipTo(mouth, nozzle));
    wBox = bbox([...wBox, ...jBox]);
  } else w = valve + act('steam', arm + nozzle);
  parts.push({ at:[88, 108, 30], box:wBox, svg:w });
  // the steam floats in front of the machine: its own part, so it sorts against the knob and the group
  const puffs = steamPuffs(st);
  if (puffs) parts.push({ at:[100, 111, 60], box:[[WAND_TIP[0]-1, 100, WAND_TIP[2]-4],[WAND_TIP[0]+24, 122, 105]], svg:puffs });

  return { tray:act('tray', tr), parts };
}

// steam puffs (analytic: puff k is born at k·0.09 s and lives 1.5 s); into the milk only small wisps escape
function steamPuffs(st){
  const frothing = st.jug === 'wand' && !st.jugAnim && st.milk > 0;
  if (st.steamT > 0 && frothing && st.steam){
    let w = '';
    for (let k=0;k<5;k++){ const u = ((st.time*.9 + k/5) % 1), r = 1.2 + 3.2*u, a = k*1.3;
      const [X,Y] = P(WAND_TIP[0] + 2*Math.cos(a), WAND_TIP[1] + 2*Math.sin(a), JUG_WAND.z + JUG_H + 1 + 14*u);
      w += `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="#ffffff" opacity="${f((1-u)*.8)}"/>`; }
    return `<g pointer-events="none">${w}</g>`;
  }
  if (!(st.steamT > 0)) return '';
  const LIFE = 1.5, EVERY = .09, stop = st.steamStop == null ? Infinity : st.steamStop;
  let puffs = '', rims = '';
  const k1 = Math.floor(Math.min(st.steamT, stop) / EVERY), k0 = Math.max(0, Math.ceil((st.steamT - LIFE) / EVERY));
  for (let k = k0; k <= k1; k++){
    const age = st.steamT - k*EVERY; if (age < 0 || age > LIFE) continue;
    const u = age / LIFE, h1 = hash(k), h2 = hash(k+.37), h3 = hash(k+.71);
    const z = WAND_TIP[2] - 3.5*Math.sin(Math.min(u,.18)/.18*Math.PI/2) + 58*Math.pow(u, 1.15);
    const x = WAND_TIP[0] + 4 + 16*u*(h1+.2), y = WAND_TIP[1] + 14*u*(h2-.4);
    const r = (1.8 + 10.5*Math.pow(u,.7)*(.7+.5*h3)) * (u > .65 ? Math.max(0, 1 - (u-.65)/.35) : 1);
    if (r < .3) continue;
    const [X,Y] = P(x,y,z);
    rims += `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r+.8)}"/>`;
    puffs += `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}"/>`;
  }
  // one merged cloud: an ink rim under a white fill, so overlapping puffs read as a single billow
  return `<g pointer-events="none" opacity=".95"><g fill="${INK}" opacity=".75">${rims}</g><g fill="#ffffff">${puffs}</g></g>`;
}

function scene(st, m){
  let s = '';
  const heatT = ease(st.heat), boiler = 1.25*heatT - (steaming(st) ? .07 : 0);
  const pump = pumpOf(st.shot);
  const fF = facing([1,0,0]), fB = facing([-1,0,0]);

  // cast shadow: body + drip tray + rail
  s += castShadow([...on(PX(0),OUT), ...on(PX(BX),OUT),
    [TRAY.x1,TRAY.y0,TRAY.z0],[TRAY.x1,TRAY.y1,TRAY.z0],[TRAY.x1,TRAY.y0,TRAY.z1],[TRAY.x1,TRAY.y1,TRAY.z1],
    [4,8,117],[74,8,117],[74,112,117],[4,112,117],
    ...[[RES.x0,RES.y0],[RES.x0,RES.y1],[0,RES.y0],[0,RES.y1]].map(([x,y]) => [x, y, RES.z1+3])]);

  // feet
  s += byDepth([[8,8],[8,112],[70,112],[70,8]].map(([x,y]) => ({ at:[x,y,0], svg: cyl(x, y, 0, 4.5, 3.4, DARK, toneI, 1) })));

  // whatever hangs off a face turned away is drawn before the body: the body hides it, protruding bits peek out.
  // Everything on / in front of the front face is one depth-sorted set: the tray first (all of it stands on it), then
  // knobs, gauges, group, cup, jug, wand and steam by their boxes.
  const back = backParts(st, m), fm = frontMounted(st, m, boiler, pump), fp = frontProps(st, m);
  const front = fm.flat + fp.tray + depthSort([...fm.parts, ...fp.parts]);
  if (!fB) s += back;
  if (!fF) s += front;

  // body shell + its visible faces
  let body = extrude(OUT, 0, BX, m);
  if (facing([0,1,0])) body += sidePanel(m, 1);
  if (facing([0,-1,0])) body += sidePanel(m, -1);
  if (fF){
    const F = PX(BX);
    body += shape(on(F, OUT), tone([1,0,0], m), 0);
    body += shape(on(PX(BX+.15), rrUV(34, 14, 86, 57, 3)), mix(tone([1,0,0], m), '#000000', .12), 1);   // splash panel behind the cup
    body += shape(on(PX(BX+.2), rectUV(1.5, 22, 32, 26)), toneI([1,0,0], METAL), .9) + shape(on(PX(BX+.2), rectUV(88, 22, BY-1.5, 26)), toneI([1,0,0], METAL), .9);
    body += ink(pd(on(F, OUT)), 2.2);
  }
  if (fB) body += backFace(m);
  body += hullInk([...on(PX(0),OUT), ...on(PX(BX),OUT)], 2.8);
  // see-through: the far walls faintly, the working parts, then the case as a ghost over them
  const k = ease(st.xr || 0);
  if (k > 0){
    const far = `<g opacity="${f(.5*k)}">` + loft(on(PX(0), OUT), on(PX(BX), OUT), n => mix(toneI(n.map(v => -v), m), '#f2efe7', .55), true)
      + (fF ? fill(pd(on(PX(0), OUT)), mix(m.d, '#f2efe7', .5)) : '') + (fB ? fill(pd(on(PX(BX), OUT)), mix(m.d, '#f2efe7', .5)) : '') + `</g>`;
    body = far + `<g opacity="${f(1 - .8*k)}">${body}</g>` + `<g opacity="${f(.6*k)}">` + hullInk([...on(PX(0), OUT), ...on(PX(BX), OUT)], 2.8) + `</g>` + `<g opacity="${f(k)}">${mechanism(st, k)}</g>`;   // inside parts over the ghost; the tank (from behind) and the front parts come after
  } else MECH_LABELS = '';
  s += body;

  if (fB) s += back;
  s += k > 0 ? `<g opacity="${f(1 - .75*k)}">${warmer(st)}</g>` : warmer(st);   // the cup warmer covers the top of the mechanism: it fades with the case
  if (fF) s += front;
  s += k > .6 ? MECH_LABELS : callouts(surfaceLabels(st, fF, fB));
  return s;
}

const steaming = st => st.steam;
const pad2 = n => String(n).padStart(2, '0');
const shotSecs = st => st.shot != null ? Math.floor(st.shot*SHOT_S) : st.lastShot;
function timerText(st){ const v = shotSecs(st); return v == null ? '--' : pad2(v) + 's'; }

// pills in two columns either side of the machine, sorted top to bottom so leaders never cross
function callouts(items){
  const pts = []; for (const x of [RES.x0, TRAY.x1]) for (const y of [0, BY]) for (const z of [0, BZ]) pts.push(P(x, y, z));
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

/* ---------- see-through: the working parts inside, behind a ghost of the case ----------
   Real single-boiler machine plumbing: tank -> inlet tube -> vibration pump -> boiler (heater at its base) -> group
   head; a steam pipe from the boiler top to the steam valve and wand. Driven by the same state as the outside. */
const COPPER = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, BRASS = { l:'#f2d37a', m:'#d7af4a', d:'#9a7a2a' }, PUMPM = { l:'#8a8f95', m:'#6a7077', d:'#454a50' };
const BOIL = { x:44, y:58, r:14, z0:30, z1:72 };
const PMP = { x0:18, x1:38, y:90, z:16, r:5 };
const FLOWM = [4, 86, 12.5, 10, 91, 17.5];                      // flow meter on the inlet line
const P_IN = [[RES.x0 + 6, 88, RES.z0 + 1.5], [-2, 88, RES.z0 + 1.5], [FLOWM[0], 88.5, 15]];
const P_IN2 = [[FLOWM[3], 88.5, 15], [PMP.x0, PMP.y, PMP.z]];
const P_UP = [[42, PMP.y, PMP.z], [43.5, 86, 18], [44, 74, 24], [BOIL.x, BOIL.y + 4, BOIL.z0]];   // from the OPV's tee at the pump outlet
const P_RET = [[40.25, PMP.y, 21], [40.25, 96, 24], [4, 96, 24], [1.6, 96, 24]];                  // OPV return to the tank
const SOL = [63, 57, 61, 69, 63, 67];                             // 3-way solenoid valve on the group feed
const P_GRP = [[BOIL.x + BOIL.r - 1, BOIL.y + 2, 64], [SOL[0], 60, 64]];
const P_GRP2 = [[SOL[3], 60, 64], [73, 60, 66], [BX, GY, 70]];
const P_EXH = [[66, 60, SOL[2]], [66, 60, 20], [72, 60, 16], [BX - .1, 60, 16]];                 // solenoid exhaust to the drip tray
const STV = [70, 104, 88, BX - .1, 112, 96];                       // steam valve body behind the knob
const P_STM = [[BOIL.x, BOIL.y + 4, BOIL.z1], [BOIL.x, BOIL.y + 6, 80], [52, 92, 86], [64, 106, 90], [STV[0], 108, 92]];
const pipeArt = (pts, r, col) => { const d = pd(pts, false);
  return `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:${f(2*r + 1.4)}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${col.m}" style="stroke-width:${f(2*r)}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${col.l}" style="stroke-width:${f(r*.6)}" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`; };
const flowArt = (pts, on, col, t) => !on ? '' : `<path d="${pd(pts, false)}" fill="none" stroke="${col}" style="stroke-width:1.2" stroke-dasharray="2.4 2.6" stroke-dashoffset="${f(-t*24)}" stroke-linecap="round"/>`;
const boxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - 1.5), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + 1.5)];
let MECH_LABELS = '';
function mechanism(st, k){
  const t = st.time || 0, pumping = flowing(st.shot), heating = st.on && st.heat < 1, steamOn = !!st.steam;
  const parts = [];
  // pump: a coil-wound tube lying along x, on a rubber mount; it hums (a pulsing ring) while it runs
  let pm = box(PMP.x0 + 3, PMP.y - 4, 4, PMP.x1 - 3, PMP.y + 4, PMP.z - PMP.r + .3, DARK, toneI, .8);
  pm += cylX(PMP.x0, PMP.x1, PMP.y, PMP.z, PMP.r, PUMPM, toneI, 1.2, 20);
  for (let x = PMP.x0 + 3; x < PMP.x1 - 2; x += 2.2) pm += ink(pd(arcUV(PMP.y, PMP.z, PMP.r + .05, 20, 200, 8).map(([y, z]) => [x, y, z]), false), .5).replace(INK, pumping ? '#ff9a3a' : INK);
  if (pumping){ const rr = PMP.r + 1.5*Math.abs(Math.sin(t*60)); pm += `<g opacity=".5">${ink(pd(on(PX(PMP.x1 + .1), ellUV(PMP.y, PMP.z, rr, rr, 16))), .8)}</g>`; }
  parts.push({ box: [[PMP.x0, PMP.y - PMP.r, 4], [PMP.x1, PMP.y + PMP.r, PMP.z + PMP.r]], svg: pm });
  // boiler: a copper cylinder, its heater band glowing at the base while it heats, a small pressurestat on its side
  const hb = heating ? 1 : steamOn ? .7 : 0;
  // the pressurestat sits on the boiler's -y side: in front of the boiler only when that side faces the viewer
  const pstat = box(BOIL.x - 4, BOIL.y - BOIL.r - 5, 58, BOIL.x + 4, BOIL.y - BOIL.r, 66, BRASS, toneI, .9), pNear = vis([0, -1, 0]);
  let bl = (pNear ? '' : pstat) + cyl(BOIL.x, BOIL.y, BOIL.z0, BOIL.z1, BOIL.r, COPPER, toneI, 1.4, 32);
  const band = { l: mix('#c96a3a', '#ff6a1f', hb), m: mix('#a8552c', '#ff4d1a', hb), d: mix('#6e3418', '#c2300a', hb) };
  bl += loft(on(PZ(BOIL.z0 + 2), ellUV(BOIL.x, BOIL.y, BOIL.r + .2, BOIL.r + .2, 32)), on(PZ(BOIL.z0 + 6), ellUV(BOIL.x, BOIL.y, BOIL.r + .2, BOIL.r + .2, 32)), n => toneI(n, band));
  if (pNear) bl += pstat;
  parts.push({ box: [[BOIL.x - BOIL.r, BOIL.y - BOIL.r - 5, BOIL.z0], [BOIL.x + BOIL.r, BOIL.y + BOIL.r, BOIL.z1]], svg: bl });
  // pipes, and what flows in them (water blue, coffee brown, steam white)
  for (const [pts, r, col, live, fc] of [[P_IN, 1.1, matOf('#dfe6e8'), pumping, '#4f9fdc'], [P_IN2, 1.1, matOf('#dfe6e8'), pumping, '#4f9fdc'], [P_UP, 1.2, COPPER, pumping, '#4f9fdc'],
                                         [P_GRP, 1.4, COPPER, pumping, '#4f9fdc'], [P_GRP2, 1.4, COPPER, pumping, '#4f9fdc'], [P_STM, 1.3, COPPER, steamOn, '#ffffff'],
                                         [P_RET, .9, matOf('#dfe6e8'), pumping, '#4f9fdc'], [P_EXH, .8, COPPER, false, '#4f9fdc']])
    parts.push({ box: boxOf(pts), svg: pipeArt(pts, r, col) + flowArt(pts, live, fc, t) });
  parts.push(...espExtra(st, t, { pumping, heating, steamOn, hb }));
  const s = byDepth(parts);
  MECH_LABELS = k <= .6 ? '' : callouts([
    { at: [RES.x0 + 2, 104, 80], text: 'WATER TANK', on: pumping },
    { at: [FLOWM[3], 88.5, FLOWM[5]], text: 'FLOW METER', on: pumping },
    { at: [(PMP.x0 + PMP.x1)/2, PMP.y + PMP.r, PMP.z + 2], text: 'PUMP', on: pumping },
    { at: [40.25, PMP.y, 21], text: 'OPV', on: pumping },
    { at: [BOIL.x, BOIL.y + BOIL.r, 60], text: 'BOILER', on: st.on },
    { at: [40, 54 + 5, 28], text: 'HEATER', on: hb > 0 },
    { at: [BOIL.x, BOIL.y - BOIL.r - 5, 64], text: 'PRESSURESTAT', on: heating },
    { at: [66, 60, SOL[5] + 5], text: 'SOLENOID VALVE', on: pumping },
    { at: [STV[0], 112, 96], text: 'STEAM VALVE', on: steamOn },
    { at: [37, 52, 77], text: 'SAFETY VALVE', on: false },
    { at: [34, EBRD[4], EBRD[5]], text: 'CONTROL BOARD', on: !!st.on } ]);
  return s;
}
// what can be seen from outside, when see-through is off
function surfaceLabels(st, fF, fB){
  const L = [];
  if (fF) L.push(
    { at: [BX + 15, GY, 51], text: 'PORTAFILTER', on: flowing(st.shot) },
    { at: [BX + 2.8, 75, 95], text: 'BOILER GAUGE', on: st.on },
    { at: [BX + 2.8, 45, 95], text: 'PUMP GAUGE', on: flowing(st.shot) },
    { at: [BX + 6, 12, 92], text: 'POWER', on: st.on },
    { at: [WAND_TIP[0], WAND_TIP[1], WAND_TIP[2] + 6], text: 'STEAM WAND', on: !!st.steam },
    { at: [TRAY.x1, 20, TRAY.z1], text: 'DRIP TRAY', on: false });
  if (fB) L.push({ at: [RES.x0, 86, 70], text: 'WATER TANK', on: false }, { at: [-3, 34, 14], text: 'POWER CORD', on: false });
  L.push({ at: [40, 60, BZ + 6], text: 'CUP WARMER', on: false });
  return L;
}
/* ---------- the rest of a real single-boiler machine, added to the parts above ----------
   Parts (each held by another part; pipes and wires run port to port along the walls, floor and brackets):
   WATER     tank . inlet tube . flow meter (impeller in a clear body, pulse wire) . vibration pump on its rubber mount .
             OPV (over-pressure valve) on a tee at the pump outlet, adjusting screw, return line back through the panel to the tank
   BOILER    copper boiler . two flat brackets to the side walls . heating element through a bottom flange, two terminals .
             pressurestat on the boiler's side . safety valve on the boiler top . steam pipe . steam valve body behind the knob
   GROUP     feed pipe . 3-way solenoid valve (body and coil) . exhaust pipe down to the drip tray . group head
   POWER     cord in through the back . power switch body and lamp body behind the front . control board on the side wall
             (relay, triac on a heatsink, capacitor, edge connectors)
   HARNESS   mains up the back corner to the board . board -> power switch, lamp, solenoid along the side and front walls .
             board -> pump and flow meter down the side wall and along the floor . pressurestat -> heater terminals down the
             boiler's side . pressurestat and heater return along the bracket to the board */
const EBRD = [14, 1.4, 62, 54, 2.5, 88], EAH = '#3a3632', EAON = '#ffb347', ELIT = matOf('#ff9a3a');
const eBend = (pts, r = 2.2) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a wire as short depth-sortable pieces, terminal dots on its ends
const eWire = (pts, col, w = .45, ends = true) => { const q = eBend(pts), out = [], L = 7;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const e of [i === 0 && ends ? q[0] : null, j === q.length - 1 && ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.1" fill="${INK}"/>`; }
    out.push({ box: bbox(seg, .8), svg }); i = j; }
  return out; };
function espExtra(st, t, o){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const wire = (pts, on, w, ends) => parts.push(...eWire(pts, on ? EAON : EAH, w, ends));
  const pwr = !!st.on;
  // boiler brackets to both side walls (they carry it)
  bx(42, 3, 44, 46, BOIL.y - BOIL.r, 45, METAL, .6);
  bx(42, BOIL.y + BOIL.r, 44, 46, BY - 3, 45, METAL, .6);
  // heating element flange under the boiler, its two terminals
  put([[35, 49, 27.5], [45, 59, 30]], cyl(40, 54, 27.5, 30, 5, METAL, toneI, .9, 24));
  for (const x of [37.5, 42.5]) put([[x - .9, 53.1, 24.6], [x + .9, 54.9, 27.5]], cyl(x, 54, 24.6, 27.5, .7, BRASS, toneI, .6, 10) + cyl(x, 54, 26, 26.8, 1.2, METAL, toneI, .5, 6));
  // safety valve on the boiler top
  put([[35, 50, BOIL.z1], [39, 54, BOIL.z1 + 5]], cyl(37, 52, BOIL.z1, BOIL.z1 + 3, 1.9, BRASS, toneI, .8, 14) + cyl(37, 52, BOIL.z1 + 3, BOIL.z1 + 5, 1.2, BRASS, toneI, .7, 12));
  // flow meter on the inlet: clear body with its impeller
  put([FLOWM.slice(0, 3), FLOWM.slice(3)], box(...FLOWM, matOf('#e8e4da'), toneI, .8)
    + (vis([0,0,1]) ? shape(on(PZ(FLOWM[5] + .05), ellUV(7, 88.5, 1.8, 1.8, 14)), CLEAR.m, .5)
      + [0, 1, 2].map(i => { const a = (o.pumping ? t*20 : 0) + i*2*Math.PI/3; return line([[7, 88.5, FLOWM[5] + .1], [7 + 1.5*Math.cos(a), 88.5 + 1.5*Math.sin(a), FLOWM[5] + .1]], .5); }).join('') : ''));
  // OPV on the pump outlet tee, its adjusting screw on top
  put([[38.3, PMP.y - 2, PMP.z - 2], [42, PMP.y + 2, PMP.z + 2]], cylX(38.3, 42, PMP.y, PMP.z, 2, BRASS, toneI, .8, 14));
  put([[39, PMP.y - 1.3, PMP.z + 1.8], [41.5, PMP.y + 1.3, 21]], cyl(40.25, PMP.y, PMP.z + 1.8, 21, 1.3, BRASS, toneI, .7, 12));
  put([[0, 94.4, 22.4], [1.6, 97.6, 25.6]], cylX(0, 1.6, 96, 24, 1.6, matOf('#e8e4da'), toneI, .6, 12));            // return fitting on the back panel
  // pump terminal block
  bx(26, PMP.y - PMP.r - 1.2, 14, 30, PMP.y - PMP.r + .2, 18, matOf('#e8e4da'), .6);
  // group: 3-way solenoid valve body and its coil
  put([SOL.slice(0, 3), SOL.slice(3)], box(...SOL, BRASS, toneI, .9));
  put([[63.4, 57.4, SOL[5]], [68.6, 62.6, SOL[5] + 5]], cyl(66, 60, SOL[5], SOL[5] + 5, 2.6, o.pumping ? ELIT : DARK, toneI, .8, 16));
  // steam valve body behind the knob
  put([STV.slice(0, 3), STV.slice(3)], box(...STV, BRASS, toneI, .9));
  // switch and lamp bodies behind the front panel
  bx(72, 9, 89, BX - .1, 15, 95, DARK, .7);
  bx(74, 9.5, 69.5, BX - .1, 14.5, 74.5, DARK, .7);
  // control board on the side wall: standoffs, board, parts, edge connectors
  for (const [x, z] of [[16, 64], [52, 64], [16, 86], [52, 86]]) bx(x - .6, 0, z - .6, x + .6, EBRD[1], z + .6, METAL, .4);
  let brd = box(...EBRD, { l:'#4fa36a', m:'#2f8a4a', d:'#1d5f31' }, toneI, .7);
  if (vis([0,1,0])) brd += box(22, EBRD[4], 72, 30, EBRD[4] + 2.4, 80, matOf('#3e6fb0'), toneI, .5) + box(34, EBRD[4], 70, 40, EBRD[4] + 3, 82, METAL, toneI, .5)
    + box(35, EBRD[4] + 3, 74, 39, EBRD[4] + 3.6, 78, DARK, toneI, .4) + fill(pd(on(PY(EBRD[4] + .05), ellUV(46, 84, .6, .6, 8))), pwr ? '#7dff9a' : '#2a5a36');
  put([[EBRD[0], 0, EBRD[2]], [EBRD[3], EBRD[4] + 3.6, EBRD[5]]], brd);
  put([[44, EBRD[4], 64], [49, EBRD[4] + 3.4, 69]], cyl(46.5, EBRD[4] + 1.7, 64, 69, 1.7, DARK, toneI, .6, 12));
  for (const [x0, z0, x1, z1] of [[14, 68, 17, 72], [15, 62, 19, 64.5], [26, 62, 30, 64.5], [40, 62, 47, 64.5], [51, 72, 54, 88]])
    bx(x0, EBRD[4], z0, x1, EBRD[4] + 2, z1, matOf('#e8e4da'), .5);
  // harness
  wire([[.3, 34, 14], [3, 30, 14], [3, 4, 16], [3, 4, 70], [14, 3.5, 70]], pwr, .6);                           // mains cord in, up the back corner
  wire([[54, 3.5, 86], [64, 3.5, 92], [70, 9, 92], [72, 12, 92]], pwr, .45);                                   // board -> power switch
  wire([[54, 3.5, 74], [66, 3.5, 72], [72, 9, 72], [74, 12, 72]], pwr, .45);                                   // board -> lamp
  wire([[66, 60, SOL[5] + 5], [70, 60, 76], [76, 58, 80], [76, 4, 80], [54, 3.5, 80]], o.pumping, .45);      // board -> solenoid coil, along the front wall
  wire([[28, PMP.y - PMP.r - 1.2, 15], [28, 80, 8], [28, 76, 5], [28, 4, 5], [28, 3.5, 62]], o.pumping, .45);  // pump, along the floor and up the side wall
  wire([[7, 86, 15], [7, 82, 6], [7, 78, 5], [7, 6, 5], [16.5, 4, 8], [16.5, 3.5, 62]], o.pumping, .4);      // flow meter pulses
  wire([[42.5, 54, 24.6], [46, 48, 24.6], [48.5, 43.2, 28], [48.5, 43.2, 57], [47.5, 42.2, 58]], o.heating || o.hb > 0, .45);   // heater -> pressurestat, up the boiler's side
  wire([[37.5, 54, 24.6], [38, 47, 24.6], [38, 44, 28], [38, 44, 43], [42.6, 42, 45.3], [42.6, 6, 45.3], [42.6, 3.5, 50], [42.6, 3.5, 62]], o.heating || o.hb > 0, .45);   // heater return, along the bracket
  wire([[45.2, 41, 58], [45.2, 41, 45.3], [45.2, 6, 45.3], [45.2, 3.5, 50], [45.2, 3.5, 62]], o.heating, .45);        // pressurestat -> board, along the bracket
  return parts;
}
const CAPS_X = {
  off: 'Inside: tank, flow meter, pump, boiler and group, with the control board on the side wall. Press Power on.',
  heat: 'Heating: the element at the bottom of the boiler warms the water. The pressurestat cuts it off once the boiler is up to pressure; the safety valve is there in case it fails.',
  ready: 'Ready: the boiler is hot. Pull a shot to start the pump.',
  shot: 'Shot: the pump draws water through the flow meter and pushes it into the boiler; the OPV sends any excess back to the tank. The solenoid valve opens and water reaches the coffee at about 9 bar.',
  steam: 'Steam: the steam valve opens and steam from the top of the boiler rushes down the pipe and out of the wand into the milk.' };

/* ---------- behaviour ---------- */
let UI = null;
function kick(){ const st = UI.st; if (st._run) return; st._run = true; UI.animate(dt => { const more = step(st, dt); if (!more) st._run = false; return more; }); }
function step(st, dt){
  let a = false; st.time += dt;
  if (st.on && st.heat < 1){ st.heat = Math.min(1, st.heat + dt/2); a = true; if (st.heat >= 1) UI.flash('Up to temperature — pull a shot', 1600); }
  if (!st.on && st.heat > 0){ st.heat = Math.max(0, st.heat - dt/1.5); a = true; }
  if (st.shot != null && !st.frozen){
    st.shot += dt/SHOT_DUR;
    if (st.shot >= 1){ st.shot = null; st.fill = 1; st.lastShot = SHOT_S; UI.flash('Shot done — 25 s, about 36 g', 1800); }
    else st.fill = fillOf(st.shot);
    a = true;
  }
  // lever eases toward its target angle
  const lt = st.shot != null ? 72 : -14;
  if (st.lever == null) st.lever = -14;
  if (Math.abs(st.lever - lt) > .5){ st.lever += (lt - st.lever)*Math.min(1, dt*12); a = true; } else st.lever = lt;
  if (st.cupAnim){
    st.cupAnim.t += dt / (st.cupAnim.kind === 'out' ? 1 : .5);
    if (st.cupAnim.t >= 1){ if (st.cupAnim.kind === 'out'){ st.cup = 'none'; st.fill = 0; st.lastShot = null; st.latte = 0; } st.cupAnim = null; }
    a = true;
  }
  if (st.jugAnim){ st.jugAnim.t += dt/.6; if (st.jugAnim.t >= 1){ st.jug = st.jugAnim.dest; st.jugAnim = null; } a = true; }
  if (st.pour != null){
    st.pour += dt/3.2;
    if (st.pour > .3 && st.pour < .78){ st.latte = clamp((st.pour-.3)/.48); st.milk = Math.max(0, .5*(1 - (st.pour-.3)/.48)); }
    if (st.pour >= 1){ st.pour = null; st.jug = 'rest'; st.milk = 0; st.foam = 0; st.latte = 1; UI.flash('Latte ready — click the cup to take it', 2000); }
    a = true;
  }
  if (st.steam && st.jug === 'wand' && !st.jugAnim && st.milk > 0 && st.foam < 1){
    st.foam = Math.min(1, st.foam + dt/3.5);
    if (st.foam >= 1){ stopSteam(st); UI.flash('Milk is silky — click the jug to pour it on your shot', 2200); }
  }
  if (st.steam || (st.steamStop != null && st.steamT < st.steamStop + 1.6)){ st.steamT += dt; a = true; }
  else if (!st.steam && st.steamStop != null){ st.steamT = 0; st.steamStop = null; }
  return a;
}
function power(st){
  st.on = !st.on;
  if (!st.on){ if (st.steam) stopSteam(st); st.shot = null; st.frozen = false; }
  kick();
}
function pull(st, ui){
  if (st.shot != null){ if (st.frozen){ st.frozen = false; kick(); } return; }
  if (!st.on) return ui.flash('Switch the machine on first (power, right)');
  if (st.heat < 1) return ui.flash('Still heating — wait for the green zone');
  if (st.cup !== 'cup' || st.cupAnim) return ui.flash('No cup — click the drip tray to place one');
  if (st.fill > .02) return ui.flash('That cup is full — click it to take it');
  st.shot = 0; st.fill = 0; st.lastShot = null; kick();
}
function stopSteam(st){ st.steam = false; st.steamStop = st.steamT; }
function steam(st, ui){
  if (st.steam){ stopSteam(st); kick(); return; }
  if (!st.on) return ui.flash('Switch the machine on first');
  if (st.heat < .6) return ui.flash('Not enough steam pressure yet');
  st.steam = true; st.steamT = 0; st.steamStop = null; kick();
}
function moveJug(st, dest){ st.jugAnim = { from: jugPose(st), to: dest === 'wand' ? JUG_WAND : JUG_REST, dest, t:0 }; kick(); }
function jug(st, ui){
  if (st.jugAnim || st.pour != null) return;
  if (st.steam && st.jug === 'wand'){ stopSteam(st); kick(); return; }
  if (st.milk <= 0){ st.milk = .5; st.foam = 0; ui.flash('Fresh cold milk in the jug'); if (st.jug !== 'rest') moveJug(st, 'rest'); return; }
  if (st.foam >= .6){
    if (st.cup === 'cup' && !st.cupAnim && st.fill > .5 && st.latte === 0){ st.pourFrom = jugPose(st); st.pour = 0; kick(); return; }
    if (st.latte > 0) return ui.flash('This one already has milk — take the cup first');
    if (st.jug === 'wand') moveJug(st, 'rest');
    return ui.flash('Milk is ready — pull a shot to pour it on');
  }
  moveJug(st, st.jug === 'rest' ? 'wand' : 'rest');
  if (st.jug === 'rest') ui.flash('Jug under the wand — open the steam knob to froth', 1800);
}
function takeCup(st, ui){
  if (st.cupAnim) return;
  if (st.pour != null) return ui.flash('Pouring…');
  if (st.shot != null) return ui.flash('Wait for the shot to finish');
  ui.flash(st.fill > .5 ? 'Enjoy! — click the drip tray for a fresh cup' : 'Cup removed — click the drip tray for a fresh one', 1800);
  st.cupAnim = { kind:'out', t:0 }; kick();
}
function placeCup(st, ui){
  if (st.cupAnim) return;
  if (st.cup !== 'none') return st.fill > .5 ? takeCup(st, ui) : ui.flash('There is already a cup under the group');
  st.cup = 'cup'; st.fill = 0; st.latte = 0; st.lastShot = null; st.cupAnim = { kind:'in', t:0 }; kick();
}

UI = mountFigure({
  fig:'02', turn:'full', title:'Espresso machine', hint:'power on, pull a shot, froth milk under the wand, pour a latte',
  idea:"Hot water is squeezed through tightly packed coffee at about 9 times the push of the air around us.",
  size:[126, BY, 118], palette:'tomato', views:true,
  state:{ on:false, heat:0, shot:null, frozen:false, fill:0, cup:'cup', cupAnim:null, steam:false, steamT:0, steamStop:null, lastShot:null, lever:-14, time:0,
          jug:'rest', jugAnim:null, milk:.5, foam:0, pour:null, pourFrom:null, latte:0 },
  scene,
  readout: st => {
    const bar = (1.25*ease(st.heat)).toFixed(1);
    let r;
    if (st.pour != null) return 'Pouring the milk… latte art incoming';
    if (st.steam && st.jug === 'wand' && !st.jugAnim && st.milk > 0) return `Frothing milk · ${Math.round(st.foam*100)}% — click the jug to stop`;
    if (st.shot != null) r = `Pulling shot · ${pumpOf(st.shot).toFixed(1)} bar · ${pad2(shotSecs(st))} s / ${SHOT_S} s`;
    else if (!st.on) r = st.heat > 0 ? 'Cooling down' : 'Off — flip the power switch to heat up';
    else if (st.heat < 1) r = `Heating… boiler ${bar} bar`;
    else if (st.cup === 'none') r = `Ready · ${bar} bar — click the drip tray to place a cup`;
    else if (st.latte >= 1) r = 'Latte ready — click the cup to take it';
    else if (st.fill > .5 && st.foam >= .6) r = 'Shot + frothed milk — click the jug to pour';
    else if (st.jug === 'wand' && st.foam < .6) r = 'Jug under the wand — open the steam knob to froth the milk';
    else if (st.fill > .5) r = `Shot ready${st.lastShot ? ' (' + st.lastShot + ' s)' : ''} — now froth some milk for a latte`;
    else r = `Ready · boiler ${bar} bar — click the portafilter to pull a shot`;
    return r + (st.steam ? ' · steaming' : '');
  },
  buttonsLabel:'Machine',
  buttons:[
    { label:'Power on', onClick:(st, ui) => st.on ? ui.flash('Already on') : power(st) },
    { label:'Pull a shot', onClick:pull },
    { label:'Milk jug under wand', onClick:(st, ui) => { if (st.jug === 'wand' || st.foam >= .6) return ui.flash('Jug is ready at the wand');
        if (st.milk <= 0){ st.milk = .5; st.foam = 0; } jug(st, ui); } },
    { label:'Steam the milk', onClick:(st, ui) => st.jug !== 'wand' && !st.steam ? ui.flash('Put the milk jug under the wand first') : steam(st, ui) },
    { label:'Pour milk', onClick:(st, ui) => st.foam < .6 ? ui.flash('Froth the milk first') : jug(st, ui) },
    { label:'Take your cup', onClick:(st, ui) => st.cup === 'none' ? ui.flash('No cup to take') : takeCup(st, ui) },
    { label:'New cup', onClick:(st, ui) => st.cup === 'none' ? placeCup(st, ui) : ui.flash('There is already a cup') },
    { label:'Power off', onClick:(st) => st.on && power(st) },
  ],
  next: st => {
    if (!st.on) return 0;
    if (st.heat < 1 || st.shot != null || st.pour != null || st.jugAnim || st.cupAnim) return -1;
    if (st.cup === 'none') return 6;
    if (st.latte >= 1) return 5;
    if (st.fill < .5) return 1;
    if (st.steam) return -1;   // frothing: wait for it
    if (st.foam >= .6) return 4;
    return st.jug === 'wand' ? 3 : 2;
  },
  acts:{
    power:(st) => power(st),
    pull:(st, el, ui) => pull(st, ui),
    steam:(st, el, ui) => steam(st, ui),
    jug:(st, el, ui) => jug(st, ui),
    cup:(st, el, ui) => takeCup(st, ui),
    tray:(st, el, ui) => placeCup(st, ui),
    warmcup:(st, el, ui) => st.cup === 'none' ? placeCup(st, ui) : ui.flash('Cups warming on top — take the cup under the group first'),
  },
  params(st, q){
    const hot = () => { st.on = true; st.heat = 1; };
    if (q.get('on') === '1') hot();
    if (q.has('heat')){ st.on = true; st.heat = clamp(+q.get('heat')); }
    const c = q.get('cup');
    if (c === 'none') st.cup = 'none';
    if (c === 'full'){ st.cup = 'cup'; st.fill = 1; st.lastShot = SHOT_S; }
    if (q.has('fill')) st.fill = clamp(+q.get('fill'));
    if (q.has('shot')){ const t = clamp(+q.get('shot')); hot(); st.cup = 'cup';
      if (t >= 1){ st.fill = 1; st.lastShot = SHOT_S; } else { st.shot = t; st.frozen = true; st.fill = fillOf(t); st.lever = 72; st.time = .37; } }
    if (q.get('steam') === '1'){ hot(); st.steam = true; st.steamT = 1.7; }
    if (q.get('jug') === 'wand') st.jug = 'wand';
    if (q.has('foam')) st.foam = clamp(+q.get('foam'));
    if (q.has('latte')){ hot(); st.cup = 'cup'; st.fill = 1; st.lastShot = SHOT_S; st.latte = clamp(+q.get('latte')); }
    if (q.has('pour')){ hot(); st.cup = 'cup'; st.fill = 1; st.foam = 1; st.pourFrom = JUG_REST; st.pour = clamp(+q.get('pour')); st.time = .4;
      if (st.pour > .3 && st.pour < .78){ st.latte = clamp((st.pour-.3)/.48); st.milk = .5*(1-st.latte); } st._frozenPour = true; }
  },
});
if (UI.st.steam || (UI.st.on && UI.st.heat < 1)) kick();
// view set, top right: see-through and labels, independent (labels start off unless ?labels=1)
{ const q = new URLSearchParams(location.search), html = document.documentElement;
  if (q.get('labels') !== '1') html.classList.add('nolabels');
  if (q.get('xr') === '1') UI.st.xr = UI.st.xrT = 1;
  const vset = document.createElement('div'); vset.className = 'vset';
  vset.innerHTML = '<div class="vrow"><button class="act" id="xrb" aria-pressed="false">See-through</button><button class="act" id="lblb" aria-pressed="false">Labels</button></div>';
  document.querySelector('.stage').appendChild(vset);
  const xrb = document.getElementById('xrb'), lblb = document.getElementById('lblb');
  const sync = () => { xrb.setAttribute('aria-pressed', !!UI.st.xrT); lblb.setAttribute('aria-pressed', !html.classList.contains('nolabels')); };
  if (UI.st.xr == null){ UI.st.xr = 0; UI.st.xrT = 0; }
  xrb.onclick = () => { const st = UI.st; st.xr = st.xr || 0; st.xrT = st.xrT ? 0 : 1; sync();
    UI.animate(dt => { const g = Math.sign(st.xrT - st.xr); st.xr = Math.min(1, Math.max(0, st.xr + g*dt/.7)); return st.xr !== st.xrT; }); };
  lblb.onclick = () => { html.classList.toggle('nolabels'); sync(); };
  sync();
  const cap = document.createElement('p'); cap.className = 'mcap'; document.querySelector('.stage').after(cap);
  const css = document.createElement('style');
  css.textContent = '.vset{position:absolute;top:4px;right:0;z-index:2}.vrow{display:flex;gap:6px}.vset .act[aria-pressed=true]{background:var(--ink);color:var(--paper)}'
    + 'html.nolabels #fig .tag{display:none}.mcap{width:100%;max-width:760px;min-height:3em;margin:0 0 14px;font-size:12.5px;line-height:1.5;text-align:center;transition:opacity .3s}'
    + '@media (max-width:560px){.vset{position:static;margin:4px 0}}';
  document.head.appendChild(css);
  const r0 = UI.render; UI.render = () => { r0(); const st = UI.st; cap.style.opacity = st.xr > .5 ? 1 : 0;
    cap.textContent = CAPS_X[!st.on ? 'off' : st.steam ? 'steam' : flowing(st.shot) ? 'shot' : st.heat < 1 ? 'heat' : 'ready']; };
  UI.render(); }