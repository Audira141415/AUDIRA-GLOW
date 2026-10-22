/* Toilet flush: a toilet with a see-through cistern (port of the Colorfigures 2.0 kids figure to the free-camera engine).
   x = depth (the tank's glass front is its x-max face), y = width, z = up.
   Geometry is written in the 2.0 figure's coordinates; tkG() shifts it so the board starts at the origin. */
const TW = 20, TD = 64, TZ = 54, TH = 62, TT = TZ + TH;              // tank: x 0..20, y 0..64, z 54..116
const LF = 88, LE = 60, FLOOR = 56, GX = TW - .4;                     // full / empty water level, tank floor, glass plane
const DXo = 8, DYo = 8, DZo = 4;                                      // 2.0 coords -> board at the origin, 4 thick
const tkG = (x,y,z) => [x + DXo, y + DYo, z + DZo];
const tkGS = pts => pts.map(p => tkG(p[0], p[1], p[2]));
const gpd = (pts, close=true) => pd(tkGS(pts), close);
const ringG = (cx,cy,z,rx,ry,n=32) => ellUV(cx,cy,rx,ry,n).map(([x,y]) => tkG(x,y,z));
const arcG = (cx,cy,z,rx,ry,a0,a1,n=14) => Array.from({length:n+1}, (_,i) => { const a = (a0 + (a1-a0)*i/n)*Math.PI/180; return tkG(cx + rx*Math.cos(a), cy + ry*Math.sin(a), z); });
const cylG = (x,y,z0,z1,r,m,w=1) => cyl(x+DXo, y+DYo, z0+DZo, z1+DZo, r, m, toneI, w, 22);
const faceAmt = n => { const r = rotV(n); return (r[0]+r[1]+r[2]) / Math.sqrt(3); };   // cosine between a face normal and the view

const TANKM = { l:'#fbfbf6', m:'#e3e8e6', d:'#c8d0ce' };              // white ceramic
const TUBEM = { l:'#f1f3f3', m:'#d3d8d9', d:'#a9b1b2' };
const TAPM  = { l:'#eef0f0', m:'#d9dddd', d:'#aab2b2' };
const TAPON = { l:'#bfe3f8', m:'#7cc4ef', d:'#4b97c9' };
const PLUGM = matOf('#e2473a');
const WIN = on(PX(TW), rrUV(3, 57, TD-3, TT-3, 2));                   // the window in the front face (u = y, v = z)

/* ---------- the mechanism, as a function of time since the flush (null = at rest, full) ---------- */
const ramp = (t,a,b) => Math.max(0, Math.min(1, (t-a)/(b-a)));
const PIV = [12, 45, 90], ARM = 20, MAXA = 50*Math.PI/180;            // float arm pivots on the tap head
const angleFor = lv => Math.min(MAXA, Math.asin(Math.min(1, Math.max(0, (PIV[2] - (lv + 1.5)) / ARM))));
const HANG = PIV[2] - ARM*Math.sin(MAXA) - 1.5;                       // water level where the float starts lifting
function stateAt(t){
  if (t == null) return { L:LF, lev:0, flap:0, open:false, swirl:0, phase:'rest' };
  const lev = ease(ramp(t,0,220)) * (1 - ease(ramp(t,1700,2000)));
  const flap = 72 * ease(ramp(t,100,450)) * (1 - ease(ramp(t,1750,2150)));
  let L0 = LF;
  if (t >= 300 && t < 1800) L0 = LF - (LF-LE)*ease(ramp(t,300,1800));
  else if (t >= 1800 && t < 2300) L0 = LE;
  else if (t >= 2300 && t < 5800) L0 = LE + (LF-LE)*(1 - (1 - ramp(t,2300,5800))**1.7);
  const open = t >= 2300 && t < 5800;
  const swirl = ramp(t,350,700) * (1 - ramp(t,3000,4200));
  const phase = t < 1750 ? 'drain' : t >= 5800 ? 'full' : L0 < HANG ? 'fill' : 'float';
  return { L:L0, lev, flap, open, swirl, phase };
}
const ballAt = lv => { const a = angleFor(lv); return [PIV[0], PIV[1] - ARM*Math.cos(a), PIV[2] - ARM*Math.sin(a)]; };
// the plug turns about its hinge line (y = 10, z = FLOOR), on the overflow-tube side
const plugRot = ([x,y,z], fa) => { const dy = y - 10, dz = z - FLOOR, c = Math.cos(fa), sn = Math.sin(fa); return [x, 10 + dy*c - dz*sn, FLOOR + dy*sn + dz*c]; };

/* ---------- small drawing helpers ---------- */
// a thin rod drawn as ink + a light core (view independent)
const rodLine = (pts3, w=2.4) => { const d = gpd(pts3, false);
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
       + `<path d="${d}" fill="none" stroke="#c3cacb" stroke-width="${w/2}" stroke-linecap="round" stroke-linejoin="round"/>`; };
// an upright cylinder split at the water level: the whole thing goes under the water tint, the part above it is drawn again on top
function splitCyl(x,y,z0,z1,r,m,lv,w=1){
  return { under: z0 < lv ? cylG(x,y,z0,z1,r,m,w) : '', over: z1 > lv ? cylG(x,y,Math.max(z0,lv),z1,r,m,w) : '' };
}
// a flat plate given as a (y,z) outline, from x0 to x1
function slab(q, x0, x1, m, w=1){
  const A = q.map(([y,z]) => tkG(x0,y,z)), B = q.map(([y,z]) => tkG(x1,y,z));
  let s = loft(A, B, n => tone(n, m));
  if (vis([1,0,0])) s += shape(B, tone([1,0,0], m), w); else if (vis([-1,0,0])) s += shape(A, tone([-1,0,0], m), w);
  return s + hullInk([...A, ...B], 1.3);
}

/* ---------- the inside of the tank, seen through the glass ---------- */
function interior(s, st){
  const lv = s.L, now = st.clk*1000;
  let g = '';
  // cavity: back wall, whichever side wall faces us, floor, the drain hole
  g += shape(tkGS([[2,2,FLOOR],[2,TD-2,FLOOR],[2,TD-2,TT],[2,2,TT]]), '#e9f0ef', .8);
  if (vis([0,1,0]))  g += shape(tkGS([[2,2,FLOOR],[TW,2,FLOOR],[TW,2,TT],[2,2,TT]]), '#cfd8d6', .8);
  if (vis([0,-1,0])) g += shape(tkGS([[2,TD-2,FLOOR],[TW,TD-2,FLOOR],[TW,TD-2,TT],[2,TD-2,TT]]), '#cfd8d6', .8);
  g += shape(tkGS([[2,2,FLOOR],[TW,2,FLOOR],[TW,TD-2,FLOOR],[2,TD-2,FLOOR]]), '#dce4e2', .8);
  g += fill(pd(ringG(13,16,FLOOR+.05,6.4,6.4)), '#3a3431');

  const under = [], over = [];
  // overflow tube (open at the top)
  const tube = splitCyl(12, 6, FLOOR, 94, 2.8, TUBEM, lv, 1);
  const hole = fill(pd(ringG(12,6,94.05,1.9,1.9,20)), '#46413c');
  under.push({ at: tkG(12,6,FLOOR), svg: tube.under });
  over.push({ at: tkG(12,6,FLOOR), svg: tube.over + hole });
  // the plug (flapper)
  const fa = s.flap*Math.PI/180, rt = p => plugRot(p, fa);
  const lo = ellUV(13,16,6.2,6.2,28).map(([x,y]) => rt([x,y,FLOOR+.2])), hi = ellUV(13,16,6.2,6.2,28).map(([x,y]) => rt([x,y,FLOOR+2.2]));
  const nT = [0, -Math.sin(fa), Math.cos(fa)];
  let plug = loft(tkGS(lo), tkGS(hi), n => toneI(n, PLUGM));
  if (vis(nT)) plug += shape(tkGS(hi), mix(PLUGM.l, '#ffffff', .25), .8);
  else plug += shape(tkGS(lo), toneI(nT.map(v => -v), PLUGM), .8);
  plug += hullInk(tkGS([...lo, ...hi]), 1.1);
  under.push({ at: tkG(13,16,FLOOR), svg: plug });
  // water rushing into the drain while the plug is up
  if (s.flap > 15 && lv > LE + .5){
    let wh = '';
    for (let i = 0; i < 3; i++){ const a0 = now*.5 + i*120;
      wh += pd(arcG(13,16,Math.min(lv, FLOOR + 4 + i*3), 9 - i*2, 9 - i*2, a0, a0 + 200, 14), false); }
    under.push({ at: tkG(13,16,FLOOR+1), svg: `<path d="${wh}" fill="none" stroke="#2f8fd8" stroke-width=".9" stroke-linecap="round"/>` });
  }
  // the chain from the lever end down to the plug
  const levZ = 103 + 5*s.lev, chA = [15,18,levZ], chB = rt([13,20,FLOOR+2.4]);
  const chain = pts => `<path d="${gpd(pts, false)}" fill="none" stroke="#5b5852" stroke-width=".9" stroke-dasharray="1 .8"/>`;
  under.push({ at: tkG(14,19,FLOOR), svg: chain([chA, chB]) });
  const chK = (levZ - lv) / (levZ - chB[2]), chC = chB[2] < lv ? chA.map((v,i) => v + (chB[i]-v)*chK) : chB;
  // the tap (fill valve): post + head, blue while it runs
  const post = splitCyl(12, 48, FLOOR, 84, 2.4, TAPM, lv, 1), head = splitCyl(12, 48, 84, 90, 3.8, s.open ? TAPON : TAPM, lv, 1);
  under.push({ at: tkG(12,48,FLOOR), svg: post.under + head.under });
  let spray = '';
  if (s.open){ const off = -(now*.03 % 3.8);
    [[13.5,44.5],[14.5,46.5],[13,42.5]].forEach(([x,y], i) =>
      spray += `<path d="${gpd([[12,45.5,85.5],[x,y,83],[x+.5,y-.6,lv]], false)}" fill="none" stroke="#2f8fd8" stroke-width=".9" stroke-dasharray="1.6 2.2" stroke-dashoffset="${f(off + i)}" stroke-linecap="round"/>`); }
  // the float: a ball on an arm hinged on the tap head
  const ball = ballAt(lv), bc = P(...tkG(...ball)), R = 4.5*1.2247, k = R/5.5;
  const fl = rodLine([PIV, ball]) + `<circle cx="${f(bc[0])}" cy="${f(bc[1])}" r="${f(R)}" fill="#f39a2e" stroke="${INK}" stroke-width="1.1"/>`
    + `<path d="M${f(bc[0]-5.2*k)} ${f(bc[1]+1.5*k)}A${f(R)} ${f(R)} 0 0 0 ${f(bc[0]+3.5*k)} ${f(bc[1]+4.2*k)}A${f(6*k)} ${f(6*k)} 0 0 1 ${f(bc[0]-5.2*k)} ${f(bc[1]+1.5*k)}Z" fill="#000" opacity=".18"/>`
    + `<circle cx="${f(bc[0]+1.8*k)}" cy="${f(bc[1]-2*k)}" r="${f(1.4*k)}" fill="#fff" opacity=".7"/>`;
  over.push({ at: tkG(12,48,FLOOR), svg: post.over + head.over + spray });
  over.push({ at: tkG(ball[0], ball[1], FLOOR), svg: fl });

  g += byDepth(under);
  // the water: its top surface and its face against the glass tint everything under it
  g += `<path d="${gpd([[2,2,lv],[GX,2,lv],[GX,TD-2,lv],[2,TD-2,lv]])}" fill="#8fd0f7" fill-opacity=".5" stroke="#2b78b5" stroke-width="1"/>`;
  g += fill(gpd([[GX,2,FLOOR],[GX,TD-2,FLOOR],[GX,TD-2,lv],[GX,2,lv]]), '#3d9be0', 'opacity=".24"');
  g += `<path d="${gpd([[GX,2,lv],[GX,TD-2,lv]], false)}" fill="none" stroke="#2b78b5" stroke-width="1.5"/>`;
  // everything above the water, then the chain's top and the lever (highest of all)
  g += byDepth(over);
  g += chain([chA, chC]);
  g += rodLine([[TW-.5,60,104],[15,59,103],[15,18,levZ]]);
  return g;
}

/* ---------- parts ---------- */
const tankPts = () => tkGS([0,TW].flatMap(x => [0,TD].flatMap(y => [TZ,TT].map(z => [x,y,z]))));
function tankShell(){
  const x0 = 0, x1 = TW, y0 = 0, y1 = TD, z0 = TZ, z1 = TT;
  const F = [
    [[-1,0,0], [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]]],
    [[0,1,0],  [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]],
    [[0,-1,0], [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]] ];
  return F.filter(([n]) => vis(n)).map(([n,q]) => shape(tkGS(q), tone(n, TANKM), 1.2)).join('');
}
function glassAndFront(s){
  const win = tkGS(WIN);
  let g = fill(pd(win), '#cfe9f0', 'opacity=".22" pointer-events="none"');
  const st1 = [[20,57],[8,113],[4,113],[16,57]].map(([y,z]) => tkG(TW,y,z)), st2 = [[14,57],[3,108],[3,102],[11,57]].map(([y,z]) => tkG(TW,y,z));
  g += clipTo(win, fill(pd(st1), '#ffffff', 'opacity=".38"') + fill(pd(st2), '#ffffff', 'opacity=".38"'));
  g += `<path d="${gpd([[TW,3,LF],[TW,TD-3,LF]], false)}" fill="none" stroke="#2b78b5" stroke-width="1" stroke-dasharray="3 3" opacity=".8"/>`;
  const outer = gpd([[TW,0,TZ],[TW,TD,TZ],[TW,TD,TT],[TW,0,TT]]);
  g += `<path d="${outer}${pd(win)}" fill="${tone([1,0,0], TANKM)}" fill-rule="evenodd"/>` + ink(outer, 1.2) + ink(pd(win), 1.6);
  return g;
}
function lid(m){
  const pr = rrUV(-1.5, -1.5, TW+1.5, TD+1.5, 2, 4), A = on(PZ(TT), pr).map(p => tkG(...p)), B = on(PZ(TT+5), pr).map(p => tkG(...p));
  return loft(A, B, n => tone(n, m)) + fill(pd(B), tone([0,0,1], m)) + ink(pd(B), 1.2) + hullInk([...A, ...B], 2.6);
}
function handle(m, s){
  const dn = 4*s.lev;
  let h = cylX(TW+DXo, TW+2.4+DXo, 60+DYo, 104+DZo, 3, m, tone, 1.1, 20);
  h += slab([[60,105.6],[50,104.8-dn],[50,102.6-dn],[60,102.4]], TW+2.4, TW+3.4, m);
  return act('handle', h);
}
function block(m){                                                     // the back of the toilet the tank sits on
  const pr = rrUV(2, 14, 28, 50, 5, 5), A = on(PZ(0), pr).map(p => tkG(...p)), B = on(PZ(TZ), pr).map(p => tkG(...p));
  return loft(A, B, n => tone(n, m)) + fill(pd(B), TANKM.l) + ink(pd(B), 1) + hullInk([...A, ...B], 2.6);
}
// a cone-ish ceramic shell: shade by the horizontal part of the normal so a widening bowl isn't all in shade
const flatTone = mm => n => tone(norm([n[0], n[1], 0]), mm);
function bowl(m, s, st){
  const now = st.clk*1000;
  const p0 = ringG(46,32,0,15,12), p1 = ringG(46,32,24,11,9);
  const b0 = ringG(47,32,20,14,11), b1 = ringG(47,32,44,26,19);
  const s0 = ringG(47,32,44,25,18), s1 = ringG(47,32,47,25,18), hole = ringG(48.5,32,47.02,17,11.5);
  let o = loft(p0, p1, flatTone(TANKM)) + hullInk([...p0, ...p1], 2);
  o += loft(b0, b1, flatTone(TANKM)) + fill(pd(b1), TANKM.l) + ink(pd(b1), 1);
  o += loft(s0, s1, n => tone(n, m));
  // through the seat: the inside of the bowl and its water, swirling while the flush rushes in
  const bz = 36 + 2.5*s.swirl;
  let w = fill(pd(hole), '#c8d0ce') + shape(ringG(49.5,32,bz,14,10), '#7cc4ef', 0);
  w += `<path d="${pd(ringG(49.5,32,bz,14,10))}" fill="none" stroke="#2b78b5" stroke-width="1"/>`;
  if (s.swirl > .02){ let sw = '';
    for (let i = 0; i < 3; i++){ const a0 = -now*.45 + i*120, kk = .35 + i*.22; sw += pd(arcG(49.5,32,bz,14*kk,10*kk,a0,a0+150,12), false); }
    w += `<path d="${sw}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="${f(.9*s.swirl)}"/>`; }
  o += clipTo(hole, w);
  o += `<path d="${pd(s1)}${pd(hole)}" fill="${tone([0,0,1], m)}" fill-rule="evenodd"/>` + ink(pd(hole), 1.4) + ink(pd(s1), 1.1);
  o += hullInk([...b0, ...b1, ...s1], 2.6);
  return o;
}

/* ---------- labels: pills beside the tank, on whichever side the part is ---------- */
function labels(s){
  if (faceAmt([1,0,0]) < .25) return '';
  const ball = ballAt(s.L);
  const L0 = [
    { t:'TAP',      p:[12,48,76],        side: 1, on: s.open },
    { t:'FLOAT',    p:ball,              side: 1, on: s.phase === 'float' || s.phase === 'full' },
    { t:'OVERFLOW', p:[12,6,94],         side:-1, on: false },
    { t:'FULL',     p:[TW,8,LF],         side:-1, on: s.L >= LF - .2 },
    { t:'PLUG',     p:[13,16,FLOOR+1.2], side:-1, on: s.phase === 'drain' },
  ];
  const pts = tankPts().map(p => P(...p)), xs = pts.map(q => q[0]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), ySgn = Math.sign(Dv(0,1,0)[0]) || 1;
  const fs = 8.6*INK_K, hh = fs*1.8, gap = 7*INK_K;
  const items = L0.map(o => { const a = P(...tkG(...o.p)), w = o.t.length*fs*.62 + fs*1.5, sx = o.side*ySgn;
    return { ...o, a, sx, x: sx < 0 ? minX - gap - w/2 : maxX + gap + w/2, y: a[1] }; });
  let out = '';
  for (const sd of [-1, 1]){
    const col = items.filter(o => o.sx === sd).sort((a,b) => a.y - b.y);
    for (let i = 1; i < col.length; i++) col[i].y = Math.max(col[i].y, col[i-1].y + hh*1.35);
    for (const o of col) out += tag(tkG(...o.p), (o.x - o.a[0]) / INK_K, (o.y - o.a[1]) / INK_K, o.t, o.on);
  }
  return out;
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
function xrMount(getUI, caption){
  const ui = getUI(), q = new URLSearchParams(location.search), html = document.documentElement;
  if (q.get('labels') !== '1') html.classList.add('nolabels');
  if (ui.st.xr == null){ ui.st.xr = 0; ui.st.xrT = 0; }
  if (q.get('xr') === '1') ui.st.xr = ui.st.xrT = 1;
  const old = document.getElementById('lblctl'); if (old) old.style.display = 'none';
  const vset = document.createElement('div'); vset.className = 'vset';
  vset.innerHTML = '<div class="vrow"><button class="act" id="xrb" aria-pressed="false">See-through</button><button class="act" id="lblb" aria-pressed="false">Labels</button></div>';
  document.querySelector('.stage').appendChild(vset);
  // pages with a stats panel in the top right: the switches go just under it
  const place = () => { const sp = document.getElementById('stats'); vset.style.top = sp ? (sp.offsetTop + sp.offsetHeight + 10) + 'px' : ''; };
  place(); new ResizeObserver(place).observe(document.getElementById('stats') || vset);
  const xrb = document.getElementById('xrb'), lblb = document.getElementById('lblb');
  const sync = () => { xrb.setAttribute('aria-pressed', !!getUI().st.xrT); lblb.setAttribute('aria-pressed', !html.classList.contains('nolabels')); };
  xrb.onclick = () => { const u = getUI(), st = u.st; st.xr = st.xr || 0; st.xrT = st.xrT ? 0 : 1; sync();
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

/* ---------- see-through: how a real flush works (all positions in the 2.0 coordinates, shifted by tkG) ----------
   Pressing the handle turns its shaft; the trip lever on the shaft lifts the chain, the chain lifts the flapper off the
   flush valve's seat and the tank empties into the bowl: round the rim channel and out of the rim holes, and through the
   siphon jet into the trapway, which fills, siphons the bowl out over the weir and down to the floor outlet. The flapper
   drops back on its seat; the float has fallen with the water and opened the fill valve, which refills the tank, while
   its refill tube tops the bowl up through the overflow tube. The rising float closes the valve.
   Parts (each held by another; water runs from a real port to a real port):
   SUPPLY  shut-off valve and supply pipe (outside) . coupling nut under the tank . fill valve shank through the floor .
           washer . fill valve post . valve head (blue while it runs) . head cap . float arm pivot . float arm . float
           ball . refill nipple . refill tube . clip on the overflow tube's rim
   FLUSH   flush handle (outside) . handle shaft through the front wall . locknut . trip lever (bar with holes) . chain
           and clip . flapper with its two hinge ears and chain ear . hinge pins on the overflow tube's base . flush valve
           seat ring . bridge to the overflow tube . overflow tube (open top) . flush valve shank under the tank . big
           locknut . spud gasket
   TANK    cavity floor . water . two tank bolts with heads, washers, nuts
   BOWL    inlet passage from the spud . tee . rim channel inside the rim . rim holes . siphon jet to the bowl's bottom .
           bowl water . trapway: up to the weir, over it and down . outlet horn . wax ring . floor flange */
const CW_ = { x0:2, x1:18, y0:2, y1:62 }, FV = { x:12, y:56 }, PIV2 = [12, 52.4, 90], FLV = { x:11, y:16, r:7, z:57.4 }, OVF = { x:11, y:6, r:2.8 };
const BWL = 36;                                                                  // the bowl's water level = the weir's inner crest
const cBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - .6), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + .6)];
const cBend = (pts, r = 2.5) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a pipe, tube or cast passage as short depth-sortable pieces (points in 2.0 coordinates). col(piece-mid) may pick the colour.
const cLine = (pts, col, w = .6, ends = false, flow = null, now = 0) => { const q = cBend(pts).map(p => tkG(...p)), out = [], L = 8;
  let s0 = 0;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false), mid = seg[Math.floor(seg.length/2)].map((v, k) => v - [DXo, DYo, DZo][k]);
    let sl = 0; for (let n = 1; n < seg.length; n++) sl += Math.hypot(...seg[n].map((v, k) => v - seg[n-1][k]));
    const c = typeof col === 'function' ? col(mid) : col;
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (flow) svg += `<path d="${d}" fill="none" stroke="${flow}" stroke-width="${f(Math.max(.5, w*.55))}" stroke-linecap="round" stroke-dasharray="1.6 3" stroke-dashoffset="${f(s0*CAM_K - now*.02)}"/>`;
    for (const e of [i === 0 && ends ? q[0] : null, j === q.length - 1 && ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.1" fill="${INK}"/>`; }
    out.push({ box: cBoxOf(seg), svg }); s0 += sl; i = j; }
  return out; };
const ballAt2 = lv => { const a = angleFor(lv); return [PIV2[0], PIV2[1] - ARM*Math.cos(a), PIV2[2] - ARM*Math.sin(a)]; };
const flapRot = ([x,y,z], fa) => { const dy = y - 10, dz = z - FLV.z, c = Math.cos(fa), sn = Math.sin(fa); return [x, 10 + dy*c - dz*sn, FLV.z + dy*sn + dz*c]; };
function cisternMech(s, st){
  const lv = s.L, now = st.clk*1000, flushing = s.phase === 'drain', fa = s.flap*Math.PI/180, rt = p => flapRot(p, fa);
  const under = [], over = [], low = [];                                   // in the tank below / above the water; under the tank and in the bowl
  const gb = (x0, y0, z0, x1, y1, z1) => [tkG(x0, y0, z0), tkG(x1, y1, z1)];
  const putC = (L, x, y, z0, z1, r, m, w = .8, n = 22) => L.push({ box: gb(x - r, y - r, z0, x + r, y + r, z1), svg: cylG(x, y, z0, z1, r, m, w) });
  const tankCyl = (x, y, z0, z1, r, m, w = .8) => { if (z0 < lv) putC(under, x, y, z0, z1, r, m, w); if (z1 > lv) putC(over, x, y, Math.max(z0, lv), z1, r, m, w); };
  const boxG = (L, x0, y0, z0, x1, y1, z1, m, w = .6) => L.push({ box: gb(x0, y0, z0, x1, y1, z1), svg: box(...tkG(x0, y0, z0), ...tkG(x1, y1, z1), m, toneI, w) });
  const rodG = (L, a, b, r, m, w = .6) => L.push({ box: cBoxOf([tkG(...a), tkG(...b)]), svg: rod(tkG(...a), tkG(...b), r, m, toneI, w) });
  const live = matOf('#ff9a3a'), RUB = { l:'#5a5550', m:'#3d3935', d:'#272421' }, NUT = { l:'#d9dddd', m:'#b4bbbb', d:'#848c8c' };
  const WATER = '#7cc4ef', EMPTY = '#e4e9e8', H2O = '#2f8fd8';
  // ===== the tank: cavity floor, water, then everything standing in it
  let floor = shape(tkGS([[CW_.x0, CW_.y0, FLOOR], [CW_.x1, CW_.y0, FLOOR], [CW_.x1, CW_.y1, FLOOR], [CW_.x0, CW_.y1, FLOOR]]), '#e3eae8', .6);
  // fill valve: washer on the floor, post, head (blue while open), cap; refill nipple
  putC(under, FV.x, FV.y, FLOOR, FLOOR + .8, 3, RUB, .5);
  tankCyl(FV.x, FV.y, FLOOR + .8, 84, 2.2, TAPM);
  tankCyl(FV.x, FV.y, 84, 90, 3.8, s.open ? TAPON : TAPM, 1);
  tankCyl(FV.x, FV.y, 90, 91.2, 2.8, TAPM, .7);
  rodG(over, [8.4, FV.y, 88.5], [7.4, FV.y, 88.5], .55, TAPM, .5);
  // float arm and ball, hinged on the side of the head
  const bl = ballAt2(lv);
  rodG(over, PIV2, bl, .45, matOf('#cfd6d8'), .5);
  rodG(over, [PIV2[0] - 1.2, PIV2[1], PIV2[2]], [PIV2[0] + 1.2, PIV2[1], PIV2[2]], .55, NUT, .5);   // pivot pin
  { const bc = P(...tkG(...bl)), R = 4.5*1.2247, kk = R/5.5;
    over.push({ box: gb(bl[0] - 4.5, bl[1] - 4.5, bl[2] - 4.5, bl[0] + 4.5, bl[1] + 4.5, bl[2] + 4.5),
      svg: `<circle cx="${f(bc[0])}" cy="${f(bc[1])}" r="${f(R)}" fill="#f39a2e" stroke="${INK}" stroke-width="1.1"/>`
        + `<path d="M${f(bc[0]-5.2*kk)} ${f(bc[1]+1.5*kk)}A${f(R)} ${f(R)} 0 0 0 ${f(bc[0]+3.5*kk)} ${f(bc[1]+4.2*kk)}A${f(6*kk)} ${f(6*kk)} 0 0 1 ${f(bc[0]-5.2*kk)} ${f(bc[1]+1.5*kk)}Z" fill="#000" opacity=".18"/>`
        + `<circle cx="${f(bc[0]+1.8*kk)}" cy="${f(bc[1]-2*kk)}" r="${f(1.4*kk)}" fill="#fff" opacity=".7"/>` }); }
  // the valve's outflow while it is open
  if (s.open){ const off = -(now*.03 % 3.8); let sp = '';
    [[9, 54], [10, 52.6], [11, 52.2]].forEach(([x, y], i) => sp += `<path d="${gpd([[x + 1.2, y + 1.4, 84.5], [x, y, 82], [x - .4, y - .6, lv]], false)}" fill="none" stroke="${H2O}" stroke-width=".9" stroke-dasharray="1.6 2.2" stroke-dashoffset="${f(off + i)}" stroke-linecap="round"/>`);
    over.push({ box: gb(8, 51, lv, 12, 56, 85), svg: sp }); }
  // refill tube: from the nipple, up and along to a clip on the overflow tube's rim, its end over the open top
  boxG(over, 7.6, 5, 92.5, 8.4, 7, 96, RUB, .5);
  over.push(...cLine([[7.4, FV.y, 88.5], [5.5, FV.y, 88.5], [5.5, FV.y, 97], [5.5, 7.5, 97], [8, 6, 97], [10.2, 6, 97], [10.2, 6, 95.2]], '#3a3632', .55, false, s.open ? '#bfe3f8' : null, now));
  // overflow tube (open top), bridge to the flush valve seat, hinge pins
  tankCyl(OVF.x, OVF.y, FLOOR, 94, OVF.r, TUBEM, 1);
  over.push({ box: gb(OVF.x - 2, OVF.y - 2, 94, OVF.x + 2, OVF.y + 2, 94.2), svg: fill(pd(ringG(OVF.x, OVF.y, 94.05, 1.9, 1.9, 20)), '#46413c') });
  boxG(under, 9.6, 8.6, FLOOR, 12.4, 9.6, FLV.z, TUBEM, .5);
  rodG(under, [7.6, 9.3, FLV.z + .3], [14.4, 9.3, FLV.z + .3], .45, NUT, .45);
  // flush valve seat ring, the hole dark while the flapper is up
  putC(under, FLV.x, FLV.y, FLOOR, FLV.z, FLV.r, TUBEM, .8);
  if (s.flap > 4) under.push({ box: gb(FLV.x - 5, FLV.y - 5, FLV.z, FLV.x + 5, FLV.y + 5, FLV.z + .1), svg: fill(pd(ringG(FLV.x, FLV.y, FLV.z + .05, 5.2, 5.2, 24)), '#3a3431') });
  // the flapper: a rubber disc turning about the hinge pins, two hinge ears, the chain ear on its far edge
  { const lo = ellUV(FLV.x, FLV.y, 6.2, 6.2, 28).map(([x, y]) => rt([x, y, FLV.z + .1])), hi = ellUV(FLV.x, FLV.y, 6.2, 6.2, 28).map(([x, y]) => rt([x, y, FLV.z + 2.1]));
    const nT = [0, -Math.sin(fa), Math.cos(fa)];
    let fl = loft(tkGS(lo), tkGS(hi), n => toneI(n, PLUGM));
    fl += vis(nT) ? shape(tkGS(hi), mix(PLUGM.l, '#ffffff', .25), .8) : shape(tkGS(lo), toneI(nT.map(v => -v), PLUGM), .8);
    fl += hullInk(tkGS([...lo, ...hi]), 1.1);
    under.push({ box: cBoxOf(tkGS([...lo, ...hi])), svg: fl }); }
  for (const x of [8.4, 13.6]) rodG(under, rt([x, 9.3, FLV.z + .3]), rt([x, 11.6, FLV.z + 1.1]), .5, PLUGM, .45);
  const ear = rt([FLV.x, 21.6, FLV.z + 3.2]);
  rodG(under, rt([FLV.x, 21.6, FLV.z + 2.1]), ear, .4, PLUGM, .4);
  if (s.flap > 15 && lv > LE + .5){ let wh = '';                                // water swirling down into the valve
    for (let i = 0; i < 3; i++){ const a0 = now*.5 + i*120; wh += pd(arcG(FLV.x, FLV.y, Math.min(lv, FLV.z + 3 + i*3), 9 - i*2, 9 - i*2, a0, a0 + 200, 14), false); }
    under.push({ box: gb(FLV.x - 9, FLV.y - 9, FLV.z, FLV.x + 9, FLV.y + 9, FLV.z + 10), svg: `<path d="${wh}" fill="none" stroke="${H2O}" stroke-width=".9" stroke-linecap="round"/>` }); }
  // tank bolts: head and washer on the floor (the nut and the shank are under the tank)
  for (const y of [28, 40]){ putC(under, FLV.x, y, FLOOR, FLOOR + .4, 2.2, RUB, .5); putC(under, FLV.x, y, FLOOR + .4, FLOOR + 1.6, 1.5, NUT, .6); }
  // handle shaft through the front wall, its locknut, the trip lever and the chain
  const levZ = 103 + 5*s.lev, lever = s.lev > .02 ? live : matOf('#cfd6d8');
  rodG(over, [TW, 60, 104], [15.4, 60, 104], .9, NUT, .6);
  over.push({ box: gb(16.6, 58, 102, 18, 62, 106), svg: cylX(16.6 + DXo, 18 + DXo, 60 + DYo, 104 + DZo, 2, NUT, toneI, .6, 6) });                // locknut, hex
  rodG(over, [15.4, 60, 104], [13, 57, 104 + .1*s.lev], .75, lever, .6);
  rodG(over, [13, 57, 104 + .1*s.lev], [FLV.x, 21.6, levZ], .75, lever, .6);
  if (facing([1,0,0])){ const pts = [26, 34, 42, 50].map(y => { const u = (y - 21.6)/(57 - 21.6); return [FLV.x + 2*u + .8, y, levZ + (104 - levZ)*u]; });   // holes for the chain clip
    over.push({ box: cBoxOf(pts.map(p => tkG(...p))), svg: pts.map(p => fill(pd(on(PX(p[0] + DXo), ellUV(p[1] + DYo, p[2] + DZo, .35, .35, 8))), INK)).join('') }); }
  { const top = [FLV.x, 21.6, levZ - .7], chain = d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray=".2 1.1"/><path d="${d}" fill="none" stroke="#b9bdbd" stroke-width=".7" stroke-linecap="round" stroke-dasharray=".2 1.1"/>`;
    const zc = Math.max(ear[2], Math.min(top[2], lv)), mid = [FLV.x, ear[1] + (top[1] - ear[1])*(zc - ear[2])/Math.max(.1, top[2] - ear[2]), zc];
    under.push({ box: cBoxOf([tkG(...ear), tkG(...mid)]), svg: chain(gpd([ear, mid], false)) });
    over.push({ box: cBoxOf([tkG(...mid), tkG(...top)]), svg: chain(gpd([mid, top], false)) + fill(pd(on(PX(top[0] + DXo), ellUV(top[1] + DYo, top[2] + DZo, .6, .6, 8))), '#7b7f80') }); }
  // ===== under the tank: fill valve shank, flush valve shank, big locknut, spud gasket, bolt shanks and nuts
  putC(low, FLV.x, FLV.y, 49.2, 50.4, 5.8, RUB, .6);
  putC(low, FLV.x, FLV.y, 50.4, 54, 4.6, TUBEM, .7);
  putC(low, FLV.x, FLV.y, 51, 53.2, 6.6, NUT, .8);
  for (const y of [28, 40]){ rodG(low, [FLV.x, y, 46], [FLV.x, y, 54], .55, NUT, .4); putC(low, FLV.x, y, 49.6, 51, 1.5, NUT, .5); }
  // ===== the bowl: inlet passage, tee, siphon jet, rim channel and its holes, bowl water, trapway, outlet
  const fl2 = flushing ? WATER : EMPTY, fFlow = flushing ? '#ffffff' : null;
  low.push(...cLine([[FLV.x, FLV.y, 49.2], [FLV.x, FLV.y, 46.5], [14, 24, 46.5], [16, 32, 46.5], [22.6, 32, 43.4]], fl2, 2.3, false, fFlow, now));
  low.push({ box: gb(11.2, 21.2, 43.7, 16.8, 26.8, 49.3), svg: (() => { const c = P(...tkG(14, 24, 46.5)), r = 2.8*1.2247; return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${flushing ? '#9fd4f3' : '#eef1f0'}" stroke="${INK}" stroke-width=".9"/>`; })() });
  low.push(...cLine([[14, 24, 46.5], [22, 25, 40], [28, 25, 26], [35, 26, 21]], fl2, 1.6, false, fFlow, now));
  { const ring = []; for (let i = 0; i <= 40; i++){ const a = i/40*2*Math.PI; ring.push([47 + 24*Math.cos(a), 32 + 17.2*Math.sin(a), 42.5]); }
    low.push(...cLine(ring, fl2, 1.5, false, fFlow, now)); }
  { let holes = '', jets = '';
    for (let i = 0; i < 18; i++){ const a = i/18*2*Math.PI, x = 47 + 22.8*Math.cos(a), y = 32 + 16.2*Math.sin(a);
      holes += pd(ringG(x, y, 41, .55, .55, 8));
      if (s.swirl > .05) jets += pd([tkG(x, y, 41), tkG(47 + 20.5*Math.cos(a + .25), 32 + 14.4*Math.sin(a + .25), 37.5)], false); }
    low.push({ box: gb(23, 15, 40.9, 71, 49, 41.1), svg: `<path d="${holes}" fill="#3a3431"/>` + (jets ? `<path d="${jets}" fill="none" stroke="${H2O}" stroke-width=".8" stroke-linecap="round" opacity="${f(s.swirl)}"/>` : '') }); }
  { const bz = BWL + 2.5*s.swirl, rx = 14 + 12*(bz - 20)/24 - .6, ry = 11 + 8*(bz - 20)/24 - .6;        // water fills the cone at its level
    low.push({ box: gb(47 - rx, 32 - ry, bz - .1, 47 + rx, 32 + ry, bz + .1),
      svg: `<path d="${pd(ringG(47, 32, bz, rx, ry))}" fill="${WATER}" fill-opacity=".55" stroke="#2b78b5" stroke-width="1"/>` }); }
  // the bowl's throat at the bottom of the cone: the siphon jet and the trapway both open into it
  low.push({ box: gb(33, 21, 19.6, 61, 43, 20.4), svg: `<path d="${pd(ringG(47, 32, 20, 14, 11))}" fill="${flushing ? '#9fd4f3' : '#c9d6d4'}" fill-opacity=".7" stroke="${INK}" stroke-width=".9"/>` });
  // trapway: down out of the throat, back and up to the weir (its inner crest at the bowl's water level), over and down
  const UP = [[43, 32, 19.6], [43, 32, 15.5], [36, 32, 13.5], [28, 32, 17], [22, 32, 29], [19, 32, 36.5], [16.5, 32, 39]];
  const DOWN = [[16.5, 32, 39], [14, 32, 36], [13.5, 32, 26], [13.5, 32, 10], [17, 32, 5], [22, 32, 4.6], [24, 32, 4.6], [24, 32, 1.7]];
  low.push(...cLine(UP, WATER, 2.6, false, flushing ? '#ffffff' : null, now), ...cLine(DOWN, flushing ? WATER : EMPTY, 2.6, false, flushing ? '#ffffff' : null, now));
  putC(low, 24, 32, 0, .8, 5, RUB, .6);                                     // floor flange
  putC(low, 24, 32, .8, 1.7, 4, matOf('#e8c66a'), .6);                       // wax ring
  // ===== order: under the tank and the bowl, the tank floor, below the water, the water, above it
  const water = (() => { const x0 = CW_.x0, x1 = CW_.x1, y0 = CW_.y0, y1 = CW_.y1, z0 = FLOOR, z1 = lv; let w = '';
    for (const [n, q] of [[[1,0,0], [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]]], [[-1,0,0], [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]]],
      [[0,1,0], [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]], [[0,-1,0], [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]]]) if (vis(n)) w += fill(gpd(q), '#3d9be0', 'opacity=".2"');
    return w + `<path d="${gpd([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]])}" fill="#8fd0f7" fill-opacity=".45" stroke="#2b78b5" stroke-width="1"/>`; })();
  return byDepth(low) + floor + byDepth(under) + water + byDepth(over);
}
const XR_ITEMS = (s, st) => { const bl = ballAt2(s.L), levZ = 103 + 5*s.lev;
  return [ { at: tkG(FV.x, FV.y + 3.8, 87), text: 'FILL VALVE', on: s.open },
    { at: tkG(...bl), text: 'FLOAT', on: s.phase === 'float' || s.phase === 'full' },
    { at: tkG(5.5, 30, 97), text: 'REFILL TUBE', on: s.open },
    { at: tkG(OVF.x, OVF.y - OVF.r, 80), text: 'OVERFLOW TUBE', on: false },
    { at: tkG(FLV.x, FLV.y - 6, FLV.z + 2), text: 'FLAPPER', on: s.phase === 'drain' },
    { at: tkG(FLV.x, 21.6, (levZ + FLV.z)/2), text: 'CHAIN', on: s.lev > .02 },
    { at: tkG(13.5, 42, (104 + levZ)/2), text: 'TRIP LEVER', on: s.lev > .02 },
    { at: tkG(12, 56, 12), text: 'SHUT-OFF VALVE', on: false },
    { at: tkG(71, 32, 42.5), text: 'RIM CHANNEL', on: s.phase === 'drain' },
    { at: tkG(16.5, 32, 41.6), text: 'TRAPWAY', on: s.swirl > .05 },
    { at: tkG(28, 25, 26), text: 'SIPHON JET', on: s.phase === 'drain' } ]; };
const flushCaption = st => { const s = stateAt(st.t);
  if (s.phase === 'drain') return 'Flush: the trip lever pulls the chain and lifts the flapper. The tank empties round the rim channel and through the siphon jet, which fills the trapway so it siphons the bowl out.';
  if (s.phase === 'fill') return 'Refill: the flapper has dropped back on its seat. The float fell with the water and opened the fill valve; the refill tube tops the bowl up through the overflow tube.';
  if (s.phase === 'float') return 'Nearly full: the rising float slowly closes the fill valve. If the valve ever stuck open, the water would spill down the overflow tube instead of over the top.';
  return 'Full: the float holds the fill valve shut and the water presses the flapper onto its seat. The bowl’s water stands at the height of the trapway’s weir.';
};

/* ---------- scene ---------- */
function scene(st, m){
  const s = stateAt(st.t), FRONT = vis([1,0,0]);
  const bt = boardTop(0, 0, 92, 82, 4, 6);
  let o = board(0, 0, 92, 82, 4, 6);
  o += castShadow([...tankPts(), ...on(PZ(TT+5), rrUV(-1.5,-1.5,TW+1.5,TD+1.5,2,2)).map(p => tkG(...p)), ...on(PZ(0), rrUV(2,14,28,50,5,3)).map(p => tkG(...p))], 4, bt);
  o += castShadow([...ringG(46,32,0,15,12,20), ...ringG(47,32,47,25,18,20)], 4, bt);
  // the block and the bowl stand side by side on the board; the tank sits higher than both, so it always comes after them
  // water supply: from a shut-off valve near the floor up to the fill valve's tail under the tank (beside the block)
  const supply = cylG(12, 56, 0, 9, 1.1, TAPM, .8) + cylG(12, 56, 9, 15, 2.4, TAPM, .9) + cylG(12, 56, 15, TZ, 1.1, TAPM, .8) + cylG(12, 56, TZ - 3, TZ, 2.6, TAPM, .9)
    + box(12 + DXo - 1, 56 + DYo + 2.2, 11 + DZo, 12 + DXo + 1, 56 + DYo + 5.5, 13 + DZo, TAPM, toneI, .7);   // valve handle
  // a solid ceramic tank; in See-through the tank, its lid and the toilet's ceramic ghost, and the works are drawn over them
  const k = ease(st.xr || 0), dg = svg => k > 0 ? `<g opacity="${f(1 - .8*k)}">${svg}</g>` : svg;
  o += byDepth([{ at: tkG(15,32,27), svg: dg(block(m)) }, { at: tkG(47,32,24), svg: dg(bowl(m, s, st)) }, { at: tkG(12,56,30), svg: supply }]);
  let tank = tankShell();
  if (FRONT){
    const solidFront = gpd([[TW,0,TZ],[TW,TD,TZ],[TW,TD,TT],[TW,0,TT]]);
    tank += `<g opacity="1.0">${fill(solidFront, tone([1,0,0], TANKM))}${ink(solidFront, 1.2)}</g>`;
  }
  tank += hullInk(tankPts(), 2.6);
  const hd = handle(m, s);
  if (k === 0) o += (FRONT ? tank + hd : hd + tank) + lid(m);
  else {
    o += dg((FRONT ? tank : hd + tank) + lid(m)) + `<g opacity="${f(k)}">${cisternMech(s, st)}</g>` + (FRONT ? hd : '');   // the handle faces us: over the works
    if (k > .6) o += xrCallouts(XR_ITEMS(s, st), [0, 92, 0, 82, 0, TT + 9]);
  }
  return o;
}

function flush(st, ui){
  if (st.t != null && st.t < 6000) return ui.flash('Flushing already, wait for the tank to refill');
  st.t = 0;
  ui.animate(dt => { st.t = Math.min(6000, st.t + dt*1000); st.clk += dt; return st.t < 6000; });
}
const ui = mountFigure({
  fig: '11', turn:'full', title: 'Toilet flush',
  hint: 'Click the handle or Flush (or press space)',
  idea: 'A float rises with the water and shuts the tap off when the tank is full, so it never overflows.',
  size: [92, 82, 126], palette: 'mint',
  state: { t: null, clk: 0 },
  scene,
  readout: st => { const s = stateAt(st.t), pct = Math.round(100*(s.L-LE)/(LF-LE));
    return { rest:'tank full · click the handle to flush', drain:`whoosh! plug up · tank ${pct}%`,
      fill:`plug shut · tap open · filling ${pct}%`, float:`float rising · tap closing · ${pct}%`, full:'full! the float shut the tap' }[s.phase]; },
  buttons: [{ label: 'Flush', onClick: flush }],
  acts: { handle: (st, el, ui) => flush(st, ui) },
  params(st, q){ if (q.has('t')) st.t = +q.get('t'); },
});
addEventListener('keydown', e => {
  if (/input|textarea|button/i.test(e.target.tagName)) return;
  if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'f'){ e.preventDefault(); flush(ui.st, ui); ui.render(); }
});
xrMount(() => ui, flushCaption);