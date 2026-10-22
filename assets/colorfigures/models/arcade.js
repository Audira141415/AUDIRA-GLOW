/* ============================================================
   Fig. 05 — Arcade cabinet.
   Body = side profile in the (x,z) plane, extruded along y:
   right cheek (y 0..T) · centre body (y T..D-T) · left cheek (y D-T..D).
   The centre body uses a profile with the screen recessed, so the
   cheeks frame an alcove around the tilted CRT.
   ============================================================ */
const W = 75, D = 65, H = 180, T = 2.5, XF = 56;      // XF = lower front plane
// outer silhouette (cheeks), CCW in (x,z)
const OUTER = [[0,0],[XF,0],[XF,86],[75,93],[75,99],[59,106],[58,108],[57,152],[60,154],[60,176],[56,180],[0,180]];
// centre body: same, but the screen sits back in an alcove
const INNER = [[0,0],[XF,0],[XF,86],[75,93],[75,99],[59,106],[55,108],[48,146],[60,154],[60,176],[56,180],[0,180]];
const I_FRONT = 1, I_PANEL = 4, I_SCREEN = 6, I_MARQ = 8, I_BACK = 11;

/* ---------- planes: tilted screen and control panel ---------- */
const S0 = [55,108], ST = norm([-7,0,38]), SN = norm([38,0,7]);          // screen: bottom edge, up-slope, normal
const S3 = (u,v,o=0) => [S0[0]+v*ST[0]+o*SN[0], u, S0[1]+v*ST[2]+o*SN[2]];  // u = y, v = distance up the glass
const K0 = [75,99], KT = norm([-16,0,7]), KN = norm([7,0,16]);           // panel: front lip, back-slope, normal
const K3 = (u,s,o=0) => [K0[0]+s*KT[0]+o*KN[0], u, K0[1]+s*KT[2]+o*KN[2]];
const onS = (uv,o=0) => uv.map(([u,v]) => S3(u,v,o));
const onK = (uv,o=0) => uv.map(([u,s]) => K3(u,s,o));
// text lying in any plane: U = reading direction, V = "down" on the page (both 3D, turn-aware via Dv)
const txPl = (p,U,V,str,size,col,weight=700,ls='.04em') =>
  `<text transform="${txM(P(...p), Dv(...U), Dv(...V))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing="${ls}">${str}</text>`;
// text lying in a tilted plane whose "up" is dir t (unit, in xz); reads along -y like the front
const txT = (p,t,str,size,col,weight=700,ls='.04em') => txPl(p, [0,-1,0], [-t[0],0,-t[2]], str, size, col, weight, ls);
// text on the back face (x = const), reading along +y as seen from behind
const txB = (y,z,str,size,col=INK,weight=800,x=-.45) => txPl([x,y,z], [0,1,0], [0,0,-1], str, size, col, weight);

/* ---------- extrusion of an (x,z) profile along y ---------- */
function strips(prof, y0, y1){
  return prof.map(([xa,za],i) => { const [xb,zb] = prof[(i+1)%prof.length];
    return { i, n: norm([zb-za,0,-(xb-xa)]), pts: [[xa,y0,za],[xb,y0,zb],[xb,y1,zb],[xa,y1,za]] }; });
}

/* ---------- the game on the CRT ---------- */
const GW = 32, GH = 21, GL = 53, GB = 4.2, CS = 43/GW;                 // grid, left edge (u), bottom (v), cell size
const GLASS = rrUV(GL-GW*CS-1.2, GB-1.2, GL+1.2, GB+GH*CS+1.2, 3);       // (u,v): u runs right→left on screen
const SPR = {
  ship: ['..#..','.###.','#####'],
  inv0: ['.###.','#.#.#','#####','#...#'],
  inv1: ['.###.','#.#.#','#####','.#.#.'],
  boom: ['#.#.#','.#.#.','#.#.#'],
  mini: ['.#.','###'],
};
const SCR = { bg:'#16201f', fg:'#8af0ae', dim:'#2f5a45', inv:'#ff8fb1', inv2:'#ffd166', shot:'#ffffff', boom:'#ffb347' };
const cellQuad = (i,j,k=.08) => { const u0 = GL-i*CS-k, u1 = GL-(i+1)*CS+k, v0 = GB+j*CS+k, v1 = GB+(j+1)*CS-k;
  return pd([S3(u0,v0,.15),S3(u1,v0,.15),S3(u1,v1,.15),S3(u0,v1,.15)]); };
function sprite(buf, rows, ci, jTop, col){
  const w = rows[0].length, i0 = Math.round(ci) - (w>>1);
  rows.forEach((r,ri) => { for (let c=0;c<w;c++) if (r[c]==='#'){ const i=i0+c, j=Math.round(jTop)-ri; if (i>=0&&i<GW&&j>=0&&j<GH) buf[col]=(buf[col]||'')+cellQuad(i,j); } });
}
// screen text: centred at cell column ci, baseline row j, size in cells
const stx = (ci,j,str,size,col=SCR.fg,anchor='middle') => txT(S3(GL-ci*CS, GB+j*CS, .2), ST, str, (size*CS).toFixed(2), col, 800, '.08em').replace('text-anchor="middle"', `text-anchor="${anchor}"`);
const pad = (n,k=4) => String(n).padStart(k,'0');

function crtSVG(st){
  const buf = {}, t = st.t; let txt = '';
  const blink = Math.floor(t*1.8) % 2 === 0;
  // a few twinkling stars in every mode
  for (let k=0;k<14;k++){ const i = (k*13+5)%GW, j = (k*7+3)%(GH-3)+1; if (((k*5 + Math.floor(t*2.5)) % 7) < 4) buf[SCR.dim] = (buf[SCR.dim]||'') + cellQuad(i,j,.32); }
  if (st.mode === 'play'){
    const g = st.g;
    for (let i=0;i<GW;i++) buf[SCR.dim] += cellQuad(i,0,.1);                                // ground
    for (const e of g.en) sprite(buf, Math.floor(t*3+e.x)%2 ? SPR.inv1 : SPR.inv0, e.x, Math.round(e.y)+3, e.c);
    for (const b of g.sh) { buf[SCR.shot] = (buf[SCR.shot]||'') + cellQuad(b.x, Math.round(b.y), .25) + cellQuad(b.x, Math.round(b.y)+1, .25); }
    for (const b of g.boom) sprite(buf, SPR.boom, b.x, Math.round(b.y)+2, SCR.boom);
    if (!(g.hitT > 0 && Math.floor(g.hitT*10)%2)) sprite(buf, SPR.ship, g.sx, 3, SCR.fg);
    txt += stx(.4, GH-1.25, 'SCORE '+pad(g.score), 1.25, '#ffffff', 'start') + stx(GW-.4, GH-1.25, 'HI '+pad(Math.max(st.hi,g.score)), 1.25, SCR.fg, 'end');
    for (let k=0;k<g.lives;k++) sprite(buf, SPR.mini, GW-2-k*4, 2, SCR.fg);
  } else if (st.mode === 'over'){
    txt += stx(GW/2, 12, 'GAME OVER', 2.6, SCR.inv) + stx(GW/2, 8, 'SCORE '+pad(st.g.score), 1.5, '#ffffff');
    if (st.g.score >= st.hi && st.g.score > 0) txt += stx(GW/2, 5, 'NEW HI-SCORE!', 1.3, SCR.inv2);
  } else {
    // attract: title, marching invaders, blinking prompt
    txt += stx(GW/2, GH-5.6, 'STAR BLASTER', 2.3, SCR.inv2);
    const off = Math.round(Math.sin(t*1.6)*4), fr = Math.floor(t*3)%2 ? SPR.inv1 : SPR.inv0;
    for (let k=0;k<4;k++) sprite(buf, fr, 7+k*6+off, 12, k%2 ? SCR.inv : SCR.inv2);
    sprite(buf, SPR.ship, GW/2 + Math.round(Math.sin(t*1.1+1)*12), 2, SCR.fg);
    if (st.mode === 'ready'){ if (blink) txt += stx(GW/2, 5.4, 'PUSH 1P START', 1.8, '#ffffff'); }
    else if (blink) txt += stx(GW/2, 5.4, 'INSERT COIN', 2.1, '#ffffff');
    txt += stx(GW-.4, GH-1.25, 'CREDIT '+st.credits, 1.25, SCR.fg, 'end') + stx(.4, GH-1.25, 'HI '+pad(st.hi), 1.25, '#ffffff', 'start');
  }
  let s = '';
  for (const [c,d] of Object.entries(buf)) if (d) s += `<path d="${d}" fill="${c}"/>`;
  return s + txt;
}

/* ---------- props ---------- */
const COIN = { l:'#f0d27a', m:'#d2ad4a', d:'#9a7a2a' };
const BTN = { red:'#e2483d', yellow:'#f2c230', blue:'#3e86d9' };
const BTNS = [ { k:'red', u:30.5, s:7.6, r:3 }, { k:'yellow', u:22.5, s:8.8, r:3 }, { k:'blue', u:14.5, s:10, r:3 } ];
const STICK = { u:50, s:8.4 }, START = { u:39.5, s:4 };
const ringK = (u,s,r,o,n=22) => Array.from({length:n}, (_,i) => { const a=i/n*2*Math.PI; return K3(u+r*Math.cos(a), s+r*Math.sin(a), o); });
function panelButton(u,s,r,col,down,label){
  const m = matOf(col), h = down ? .5 : 1.7;
  const collar = ringK(u,s,r+.9,.05), A = ringK(u,s,r,.05), B = ringK(u,s,r,h);
  let o = shape(collar, '#171412', 1) + loft(A,B,n=>toneI(n,m)) + fill(pd(B), m.l) + hullInk([...A,...B],1.1) + ink(pd(B),.8);
  o += fill(pd(onK(ellUV(u+r*.3,s+r*.25,r*.42,r*.28,12),h+.02)), '#ffffff', 'opacity=".55"');
  if (label) o += txT(K3(u, s-r-3.4, .05), KT, label, 2.3, '#f3eee0', 800);
  return o;
}
function startButton(u,s,label,down){
  const h = down ? .3 : 1, A = onK(rrUV(u-2,s-1.6,u+2,s+1.6,.8), .05), B = onK(rrUV(u-2,s-1.6,u+2,s+1.6,.8), h);
  return shape(onK(rrUV(u-2.8,s-2.4,u+2.8,s+2.4,1),.04), '#171412', .9) + loft(A,B,n=>toneI(n,CERAMIC)) + fill(pd(B), CERAMIC.l) + hullInk([...A,...B],1) + ink(pd(B),.7)
    + txT(K3(u, s-.6, h+.05), KT, label, 2, INK, 800);
}
function joystick(st){
  const dir = stickDir(st), th = dir * 26 * Math.PI/180;
  const b = K3(STICK.u, STICK.s, .1), L = 11.5;   // stick stands upright; left (dir -1) leans toward +y, the player's left
  const c = [b[0], b[1] - L*Math.sin(th), b[2] + L*Math.cos(th)];
  const pb = P(...b), pc = P(...c), R = 2.9 * 1.2247;
  let s = shape(ringK(STICK.u, STICK.s, 3.6, .04), '#171412', 1) + shape(ringK(STICK.u, STICK.s, 1.9, .3), METAL.m, .8);
  s += `<path d="M${f(pb[0])} ${f(pb[1])}L${f(pc[0])} ${f(pc[1])}" stroke="${INK}" stroke-width="3.1" stroke-linecap="round"/>`
     + `<path d="M${f(pb[0])} ${f(pb[1])}L${f(pc[0])} ${f(pc[1])}" stroke="${METAL.l}" stroke-width="1.3" stroke-linecap="round"/>`;
  s += `<circle cx="${f(pc[0])}" cy="${f(pc[1])}" r="${f(R)}" fill="${BTN.red}" stroke="${INK}" stroke-width="1.2"/>`
     + `<path d="M${f(pc[0]-R*.62)} ${f(pc[1]+R*.15)}A${f(R*.8)} ${f(R*.8)} 0 0 0 ${f(pc[0]+R*.55)} ${f(pc[1]+R*.62)}" fill="none" stroke="#8f2a22" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>`
     + `<ellipse cx="${f(pc[0]-R*.3)}" cy="${f(pc[1]-R*.38)}" rx="${f(R*.3)}" ry="${f(R*.2)}" fill="#fff" opacity=".7" transform="rotate(-25 ${f(pc[0]-R*.3)} ${f(pc[1]-R*.38)})"/>`;
  // hit zones: left / right halves around the stick, in screen space
  const mx = pb[0], top = pc[1]-R-4, bot = pb[1]+5;
  s += `<path data-act="stickL" d="${sp([[mx-13,top],[mx,top],[mx,bot],[mx-13,bot]])}" fill="transparent"/>`
     + `<path data-act="stickR" d="${sp([[mx,top],[mx+13,top],[mx+13,bot],[mx,bot]])}" fill="transparent"/>`;
  return s;
}
// a coin seen edge-on (disc in a y = const plane), clipped where it enters the slot (x < XF)
function coinDisc(x,y,z,r){
  let pts = ellUV(x,z,r,r,20), o = [];
  for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length], ia = a[0]>=XF+.3, ib = b[0]>=XF+.3;
    if (ia) o.push(a); if (ia!==ib){ const k=(XF+.3-a[0])/(b[0]-a[0]); o.push([XF+.3, a[1]+k*(b[1]-a[1])]); } }
  if (o.length < 3) return '';
  const inner = ellUV(x,z,r*.62,r*.62,14).filter(p => p[0] >= XF+.3);
  return shape(on(PY(y),o), COIN.l, 1) + (inner.length >= 3 ? shape(on(PY(y+.1),inner), COIN.m, .5) : '');
}

/* ---------- scene ---------- */
/* Painter's order at any camera angle. The body is (x,z) profiles swept along y, so:
   - the y-sections go far cheek → centre → near cheek (whichever cheek faces the viewer is the near one);
   - within a section, which strip covers which is a 2D question in the (x,z) plane, looking along the view direction
     projected into that plane: xzOrder sorts the visible strips (and the panel props, as one footprint) that way;
   - the outline is the true outer boundary of the projected body, computed from convex pieces of the profile. */
// sort items {poly:[[x,z],…], svg:()=>string} so nearer ones (seen along the view dir projected on xz) come later
function xzOrder(items){
  let v = [CAM_V[0], CAM_V[2]]; const L0 = Math.hypot(v[0], v[1]); if (L0 < 1e-6) return items.map(it => it.svg()).join('');
  v = [v[0]/L0, v[1]/L0]; const w = [-v[1], v[0]];
  const pr = items.map(it => it.poly.map(([x,z]) => [x*w[0]+z*w[1], x*v[0]+z*v[1]]));
  const at = (q, m) => { const ds = [];               // depth range of a projected polygon on the line w = m
    for (let i=0;i<q.length;i++){ const a=q[i], b=q[(i+1)%q.length]; if (q.length === 2 && i === 1) break;
      if ((a[0]-m)*(b[0]-m) <= 0 && a[0] !== b[0]) ds.push(a[1] + (m-a[0])/(b[0]-a[0])*(b[1]-a[1])); else if (a[0] === m) ds.push(a[1]); }
    return ds.length ? (Math.min(...ds)+Math.max(...ds))/2 : null; };
  const n = items.length, after = items.map(() => []), indeg = items.map(() => 0);
  for (let i=0;i<n;i++) for (let j=i+1;j<n;j++){
    const wi = pr[i].map(p=>p[0]), wj = pr[j].map(p=>p[0]);
    const lo = Math.max(Math.min(...wi), Math.min(...wj)), hi = Math.min(Math.max(...wi), Math.max(...wj));
    if (hi - lo < 1e-3) continue;
    const m = (lo+hi)/2, di = at(pr[i], m), dj = at(pr[j], m);
    if (di === null || dj === null || Math.abs(di-dj) < 1e-6) continue;
    const [far, near] = di < dj ? [i,j] : [j,i]; after[far].push(near); indeg[near]++;
  }
  const out = [], done = new Set(), mean = k => pr[k].reduce((s,p)=>s+p[1],0)/pr[k].length;
  while (out.length < n){
    let k = -1; for (let i=0;i<n;i++) if (!done.has(i) && indeg[i] === 0){ k = i; break; }
    if (k < 0){ let best = Infinity; for (let i=0;i<n;i++) if (!done.has(i) && mean(i) < best){ best = mean(i); k = i; } }   // cycle: fall back to mean depth
    done.add(k); out.push(k); for (const j of after[k]) indeg[j]--;
  }
  return out.map(k => items[k].svg()).join('');
}
const segOf = q => [[q.pts[0][0], q.pts[0][2]], [q.pts[1][0], q.pts[1][2]]];

function scene(st, m){
  let s = '';
  s += castShadow([...OUTER.map(([x,z]) => [x,0,z]), ...OUTER.map(([x,z]) => [x,D,z])]);
  const FR = facing([1,0,0]);            // the front (screen, marquee, coin door) is toward the viewer
  const LN = facing([0,1,0]);            // the +y (left) cheek is the near one
  // the mains cable lies behind the cabinet: when the front faces the viewer the body can only ever cover it
  if (FR) s += powerCord();
  const cheek = (y0,y1) => xzOrder(strips(OUTER, y0, y1).filter(q => vis(q.n)).map(q => ({ poly: segOf(q), svg: () => face(pd(q.pts), tone(q.n, m)) })));   // cheek edges in the body colour (black trim read as a heavy outline)
  const props = () => byDepth([
      ...BTNS.map(b => ({ at: K3(b.u, b.s, 1), svg: act('btn', panelButton(b.u, b.s, b.r, BTN[b.k], st.down === b.k, ''), `data-k="${b.k}"`) })),
      { at: K3(START.u, START.s, .5), svg: act('start', startButton(START.u, START.s, '1P', st.down === 'start')) },
      { at: K3(STICK.u, STICK.s, 3), svg: `<g id="stk">${joystick(st)}</g>` } ]);
  // the props' footprint in (x,z): a slab over the panel, as tall as the stick
  const PROPS_XZ = [K3(0,0,0), K3(0,17.5,0), K3(0,17.5,14), K3(0,0,14)].map(p => [p[0], p[2]]);

  // 1. far cheek: edge strips, then its inner face (only the alcove part survives)
  if (LN){ s += cheek(0, T);   s += shape(on(PY(T), OUTER),   mix(tone([0,1,0], m),'#000000',.12), 1); }
  else   { s += cheek(D-T, D); s += shape(on(PY(D-T), OUTER), mix(tone([0,-1,0], m),'#000000',.12), 1); }

  // 2. centre body, strip by strip (sorted), with each strip's details right after it; the panel props as one more item
  const items = [];
  for (const st_ of strips(INNER, T, D-T)){
    if (!vis(st_.n)) continue;
    const i = st_.i;
    items.push({ poly: segOf(st_), svg: () => {
      if (i === I_SCREEN) return shape(st_.pts, '#2a2624', 1.2) + screenDetail(st, m);
      let o = shape(st_.pts, tone(st_.n, m), 1.1);
      if (i === I_FRONT) o += frontDetail(st, m);
      if (i === I_PANEL) o += panelDetail(st, m);
      if (i === I_MARQ) o += marquee(st, m);
      if (i === I_BACK) o += backDetail(st, m);
      return o; } });
  }
  items.push({ poly: PROPS_XZ, svg: props });
  s += xzOrder(items);

  // 3. near cheek: edge strips + the big side face with the side art (mirrored on the −y side)
  const yS = LN ? D : 0, SP = PY(yS);
  s += LN ? cheek(D-T, D) : cheek(0, T);
  s += fill(pd(on(SP, OUTER)), tone([0, LN ? 1 : -1, 0], m));
  s += sideArt(m, LN ? D+.15 : -.15);
  s += ink(pd(on(SP, OUTER)), 2.2);

  // 4. silhouette, then (from behind) the mains cable lying on the floor behind (it crosses the back's bottom edge)
  s += silhouette();
  if (!FR) s += powerCord();
  return s;
}

// Body outline at any angle. The alcove is closed off by the cheeks and the centre body, so the outline is that of the
// OUTER profile swept over 0..D. That profile is cut into convex pieces; each piece swept along y projects to a convex
// polygon (hull of its two ends), and the outline is every piece edge whose outside is not inside another piece.
const SIL_PIECES = [
  [[0,0],[56,0],[56,180],[0,180]],
  [[56,86],[75,93],[75,99],[59,106],[56,106]],
  [[56,106],[59,106],[58,108],[56,108]],
  [[56,108],[58,108],[57,152],[56,152]],
  [[56,152],[57,152],[60,154],[60,176],[56,180]],
];
function silhouette(){
  const polys = SIL_PIECES.map(pc => hull([...pc.map(([x,z]) => P(x,0,z)), ...pc.map(([x,z]) => P(x,D,z))]));
  const area = q => q.reduce((a,p,i) => { const r = q[(i+1)%q.length]; return a + p[0]*r[1] - r[0]*p[1]; }, 0);
  const sg = polys.map(q => Math.sign(area(q)));
  const inside = (j, p) => { const q = polys[j]; for (let i=0;i<q.length;i++){ const a=q[i], b=q[(i+1)%q.length];
      if (sg[j]*((b[0]-a[0])*(p[1]-a[1]) - (b[1]-a[1])*(p[0]-a[0])) <= 1e-6) return false; } return true; };
  const hit = (a,b,c,d) => { const r=[b[0]-a[0],b[1]-a[1]], s2=[d[0]-c[0],d[1]-c[1]], den = r[0]*s2[1]-r[1]*s2[0];
    if (Math.abs(den) < 1e-12) return null; const t = ((c[0]-a[0])*s2[1]-(c[1]-a[1])*s2[0])/den, u = ((c[0]-a[0])*r[1]-(c[1]-a[1])*r[0])/den;
    return t > 0 && t < 1 && u >= 0 && u <= 1 ? t : null; };
  let d = '';
  polys.forEach((q, pi) => { for (let i=0;i<q.length;i++){
    const a = q[i], b = q[(i+1)%q.length], ts = [0,1];
    polys.forEach((o, oi) => { if (oi !== pi) for (let k=0;k<o.length;k++){ const t = hit(a,b,o[k],o[(k+1)%o.length]); if (t !== null) ts.push(t); } });
    ts.sort((x,y) => x-y);
    const L = Math.hypot(b[0]-a[0], b[1]-a[1]); if (L < 1e-9) continue;
    const nx = sg[pi]*(b[1]-a[1])/L, ny = -sg[pi]*(b[0]-a[0])/L;   // outward normal
    for (let k=0;k+1<ts.length;k++){ const t0 = ts[k], t1 = ts[k+1]; if (t1 - t0 < 1e-6) continue;
      const tm = (t0+t1)/2, mp = [a[0]+(b[0]-a[0])*tm + nx*.15, a[1]+(b[1]-a[1])*tm + ny*.15];
      if (polys.some((_, oi) => oi !== pi && inside(oi, mp))) continue;
      const p0 = [a[0]+(b[0]-a[0])*t0, a[1]+(b[1]-a[1])*t0], p1 = [a[0]+(b[0]-a[0])*t1, a[1]+(b[1]-a[1])*t1];
      d += `M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}`; } } });
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function screenDetail(st, m){
  let s = '';
  // printed bezel: frame line around the glass
  s += ink(pd(onS(rrUV(GL-GW*CS-4.2, GB-3.6, GL+4.2, GB+GH*CS+3.4, 4), .05)), .9).replace(INK, m.l);
  // CRT glass + live picture
  s += shape(onS(GLASS,.08), SCR.bg, 1.5);
  s += `<clipPath id="crtclip"><path d="${pd(onS(GLASS,.08))}"/></clipPath>`;
  s += act('screen', `<g clip-path="url(#crtclip)"><g id="crt">${crtSVG(st)}</g></g>`);
  // glass: a soft inner rim + two streaks
  s += `<g pointer-events="none">` + ink(pd(onS(rrUV(GL-GW*CS-.5, GB-.5, GL+.5, GB+GH*CS+.5, 2.4),.12)), .7).replace(INK,'#3c4f4a')
     + `</g>`;
  return s;
}

function frontDetail(st, m){
  const F = PX(XF+.2), F2 = PX(XF+.4);
  let s = '';
  // kick plate
  s += shape(on(F, rectUV(T+1, 1.5, D-T-1, 10.5)), tone([1,0,0], METAL), 1.1);
  for (const y of [8, D-8]) s += shape(on(F2, ellUV(y, 6, .7, .7, 8)), METAL.d, .5);
  // speaker grille under the panel
  s += shape(on(F, rrUV(18, 63, 47, 72, 2)), mix(m.d,'#000000',.2), 1.1);
  for (let k=0;k<4;k++) s += ink(pd(on(F2, [[20.5, 65+k*2.1],[44.5, 65+k*2.1]]), false), 1).replace(INK, mix(m.d,'#ffffff',.25));
  // coin door: metal plate, two coin mechs with lit 25¢ inserts, reject buttons, lock
  s += shape(on(F, rrUV(16, 17, 49, 59, 2)), tone([1,0,0], METAL), 1.5);
  s += ink(pd(on(F2, rrUV(18, 19, 47, 57, 1.4))), .7);
  for (const c of [39, 26]){
    const lit = st.coinGlow > 0 ? '#ffe08a' : '#ff8a5c';
    let g = shape(on(F2, rrUV(c-4.6, 38, c+4.6, 55, 1.2)), METAL.m, 1.1);
    g += shape(on(PX(XF+.6), rrUV(c-3.7, 48.5, c+3.7, 54, 1)), lit, .9);
    g += `<g opacity=".55">${fill(pd(on(PX(XF+.65), rrUV(c-3.1, 51.6, c+3.1, 53.4, .6))), '#ffffff')}</g>`;
    g += tx(XF+.7, c, 49.6, '25¢', 3.5, '#5a1d12', 800);
    g += shape(on(PX(XF+.6), rrUV(c-.6, 40.5, c+.6, 46.5, .5)), '#191614', .7);
    g += shape(on(PX(XF+.6), rrUV(c-3.2, 31, c+3.2, 35, 1)), METAL.l, 1);
    s += act('coin', g);
  }
  s += shape(on(F2, ellUV(32.5, 25, 1.7, 1.7, 14)), METAL.d, .9) + ink(pd(on(PX(XF+.6), [[32.5,24.2],[32.5,25.8]]), false), .9);
  if (st.coinT !== null){   // coin flying into the left slot
    const k = ease(Math.min(1, st.coinT)), x = XF + 13 - k*16, z = 43.5 + 3*(1-k);
    s += coinDisc(x, 39, z, 2.5);
  }
  return s;
}

function panelDetail(st, m){
  let s = shape(onK(rrUV(T+1.5, 1.2, D-T-1.5, 16.6, 2), .02), '#2b2725', 1);
  s += ink(pd(onK(rrUV(T+2.6, 2.2, D-T-2.6, 15.6, 1.6), .03)), .7).replace(INK, m.l);
  // little arrows either side of the stick
  s += fill(pd(onK([[STICK.u+6.8, STICK.s-1.4],[STICK.u+6.8, STICK.s+1.4],[STICK.u+8.8, STICK.s]], .04)), m.l);
  s += fill(pd(onK([[STICK.u-6.8, STICK.s-1.4],[STICK.u-6.8, STICK.s+1.4],[STICK.u-8.8, STICK.s]], .04)), m.l);
  return s;
}

function marquee(st, m){
  const F = PX(60.2);
  let s = shape(on(F, rrUV(3.6, 156, D-3.6, 174.4, 1.6)), '#fff3c8', 1.4);
  s += fill(pd(on(PX(60.3), rrUV(5, 157.4, D-5, 173, 1.2))), '#fffaea');
  const star = (u,v,r,col) => fill(pd(on(PX(60.4), Array.from({length:10},(_,i) => { const a=(i/10)*2*Math.PI+Math.PI/2, rr = i%2 ? r*.45 : r; return [u+rr*Math.cos(a), v+rr*Math.sin(a)]; }))), col) ;
  s += star(D-7.6, 165, 2.4, m.m) + star(7.6, 165, 2.4, m.m);
  s += tx(60.4, 32.2, 161.6, 'STAR BLASTER', 5.9, INK, 900) + tx(60.5, 32.5, 162.1, 'STAR BLASTER', 5.9, '#e2483d', 900);
  s += tx(60.5, 32.5, 158.3, '· ONE PLAYER · 25¢ ·', 2.2, m.d, 700);
  return s;
}

// side art on a cheek's outer face; the same (x,z) shapes on the −y face come out mirrored, like a real cabinet's
function sideArt(m, y){
  const SP = PY(y), side = tone([0, y > D/2 ? 1 : -1, 0], m), c = side === m.l ? m.m : m.l;   // art stays readable when the side is lit
  let s = shape(on(SP, [[10,168],[36,168],[26,130],[45,130],[15,40],[22,100],[5,100]]), c, 1.2);
  // speed stripes along the bottom
  for (const [z,len] of [[22,40],[16,46],[10,52]]) s += shape(on(SP, [[2,z],[len,z],[len+2,z+3],[4,z+3]]), c, .9);
  const star4 = (u,v,r) => shape(on(SP, [[u,v+r],[u+r*.25,v+r*.25],[u+r,v],[u+r*.25,v-r*.25],[u,v-r],[u-r*.25,v-r*.25],[u-r,v],[u-r*.25,v+r*.25]]), c, .8);
  s += star4(44, 160, 4) + star4(48, 112, 2.6) + star4(10, 66, 3.2);
  return s;
}

// back panel (x = 0, seen whenever the back faces the viewer): service door with lock, vents, warning sticker, lower panel, serial plate
function backDetail(st, m){
  const bt = tone([-1,0,0], m), B = PX(-.2), B2 = PX(-.4);
  const screw = (y,z) => shape(on(PX(-.45), ellUV(y, z, .75, .75, 8)), METAL.d, .5);
  let s = '';
  // upper service door (CRT access) with a bevel line and corner screws
  s += shape(on(B, rrUV(9, 92, D-9, 171, 1.6)), mix(bt,'#000000',.05), 1.6);
  s += ink(pd(on(B2, rrUV(11, 94, D-11, 169, 1.2))), .6).replace(INK, mix(bt,'#000000',.35));
  for (const [y,z] of [[12.5,95.5],[D-12.5,95.5],[12.5,167.5],[D-12.5,167.5]]) s += screw(y,z);
  // ventilation slots near the top of the door (the tube runs hot)
  for (let k=0;k<6;k++){ const z = 132 + k*3.7;
    s += shape(on(PX(-.45), rrUV(16, z, D-16, z+1.8, .9)), mix(m.d,'#000000',.25), .8); }
  // cam lock
  s += shape(on(PX(-.45), ellUV(D/2, 160.5, 2.6, 2.6, 18)), METAL.m, 1.1);
  s += shape(on(PX(-.6), ellUV(D/2, 160.5, 1.6, 1.6, 14)), METAL.l, .6);
  s += line([[-.7, D/2, 159.4], [-.7, D/2, 161.6]], 1);
  // warning sticker: DO NOT OPEN — HIGH VOLTAGE
  s += shape(on(PX(-.45), rrUV(14, 104, D-14, 123, 1.2)), '#f2c230', 1);
  s += ink(pd(on(PX(-.5), rrUV(15.3, 105.3, D-15.3, 121.7, .8))), .55);
  s += shape(on(PX(-.55), [[16.8,107.2],[26.6,107.2],[21.7,118.6]]), INK, .6);
  s += fill(pd(on(PX(-.6), [[22.6,116.2],[20.4,112.4],[22,112.4],[20.8,108.6],[23.2,113.2],[21.6,113.2]])), '#f2c230');
  s += txB(39.4, 115.2, 'DO NOT OPEN', 2.6, INK, 900) + txB(39.4, 109.8, 'HIGH VOLTAGE', 2.3, INK, 800);
  // serial / rating plate
  s += shape(on(PX(-.45), rrUV(36, 64, D-8, 81, 1)), METAL.l, .9);
  for (const [y,z] of [[37.6,79.4],[D-9.6,79.4],[37.6,65.6],[D-9.6,65.6]]) s += shape(on(PX(-.5), ellUV(y, z, .45, .45, 8)), METAL.d, .3);
  s += txB(46.5, 75.6, 'STAR BLASTER', 2.1, INK, 900) + txB(46.5, 72, 'MODEL SB-1', 1.8, INK, 700)
     + txB(46.5, 68.9, 'SER 04127', 1.8, INK, 700) + txB(46.5, 66.1, '120V~60Hz', 1.6, INK, 700);
  // lower access panel (coin box / PSU) with four screws
  s += shape(on(B, rrUV(9, 24, D-9, 58, 1.4)), mix(bt,'#000000',.05), 1.3);
  for (const [y,z] of [[12.5,27.5],[D-12.5,27.5],[12.5,54.5],[D-12.5,54.5]]) s += screw(y,z);
  s += shape(on(PX(-.45), rrUV(14, 46, 30, 51.5, .8)), mix(bt,'#000000',.22), .7);   // finger pull
  // cord grommet
  s += shape(on(PX(-.45), ellUV(46, 14, 2.6, 2.6, 14)), DARK.m, .9);
  return s;
}

// mains cable: out of the grommet, down to the floor, plug lying behind the cabinet.
// It stays inside the cabinet's outline in views 0 and 3 (floor points with 0 ≤ y ≤ D and x ≥ max(y−D, −y) are hidden),
// so it is only drawn from behind.
function powerCord(){
  const path = [[-.5,46,14],[-2.4,46,13.4],[-3.6,46,11],[-3.9,46,4.5],[-4.4,45.6,1.9],[-6,44.6,.9],[-10,41.4,.9],[-14,38.2,.9],[-17,36,.9]];
  const d = pd(path, false);
  let s = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`
        + `<path d="${d}" fill="none" stroke="${DARK.l}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += box(-18.5,34.2,0,-17,37.8,2.8,DARK,toneI,.8);                  // strain relief
  s += box(-24.5,33,0,-18.5,39,4.6,DARK,toneI,1);                       // plug body
  for (const y of [34.6,37.4]) s += line([[-24.5,y,2.3],[-28,y,2.3]], 1.5) + `<path d="${pd([[-24.5,y,2.3],[-28,y,2.3]],false)}" stroke="${METAL.l}" stroke-width=".55" stroke-linecap="round"/>`;
  return s;
}

/* ---------- state + game logic ---------- */
function stickDir(st){
  const k = (st.keyR?1:0) - (st.keyL?1:0) || st.hold || (st.nudgeT > 0 ? st.nudgeDir : 0);
  return k || st.stickParam;
}
const rnd = (() => { let a = 7; return () => (a = (a*16807) % 2147483647) / 2147483647; })();
function newGame(st){ st.g = { sx: GW/2, sh: [], en: [], boom: [], score: 0, lives: 3, spawn: .6, cool: 0, hitT: 0 }; st.mode = 'play'; st.frozen = false; }
function fire(st){
  const g = st.g; if (st.mode !== 'play') return;
  st.frozen = false;
  if (g.sh.length < 3 && g.cool <= 0){ g.sh.push({ x: Math.round(g.sx), y: 3.5 }); g.cool = .2; }
}
function stepGame(st, dt){
  const g = st.g, dir = stickDir(st);
  g.sx = Math.max(2, Math.min(GW-3, g.sx + dir*16*dt));
  g.cool -= dt; g.hitT = Math.max(0, g.hitT - dt);
  for (const b of g.sh) b.y += 30*dt;
  g.sh = g.sh.filter(b => b.y < GH-2);
  g.spawn -= dt;
  if (g.spawn <= 0){ g.spawn = Math.max(.55, 1.5 - g.score/500); g.en.push({ x: 3 + Math.floor(rnd()*(GW-6)), y: GH-6, c: rnd() < .5 ? SCR.inv : SCR.inv2 }); }
  const sp = 1.6 + g.score/320;
  for (const e of g.en) e.y -= sp*dt;
  for (const b of g.sh) for (const e of g.en) if (!e.dead && !b.dead && Math.abs(b.x - Math.round(e.x)) <= 2 && b.y+1 >= e.y && b.y <= e.y+3.5){
    e.dead = b.dead = true; g.score += 10; g.boom.push({ x: e.x, y: e.y, t: .35 }); }
  for (const e of g.en) if (!e.dead){
    if (e.y <= 3.5 && Math.abs(e.x - g.sx) <= 3.5 && g.hitT <= 0){ e.dead = true; g.lives--; g.hitT = 1.2; g.boom.push({ x: g.sx, y: 1, t: .5 }); }
    else if (e.y < .5){ e.dead = true; g.lives--; g.boom.push({ x: e.x, y: 0, t: .4 }); }
  }
  g.sh = g.sh.filter(b => !b.dead); g.en = g.en.filter(e => !e.dead);
  for (const b of g.boom) b.t -= dt; g.boom = g.boom.filter(b => b.t > 0);
  if (g.lives <= 0){ st.mode = 'over'; st.overT = 3; st.hi = Math.max(st.hi, g.score); return true; }
  return false;
}

const readout = st => {
  if (!facing([1,0,0]) && (st.mode === 'play' || st.mode === 'over')) return `${st.mode === 'over' ? 'Game over' : 'Playing'} · score ${st.g.score} — turn to the front to see the screen`;
  if (st.mode === 'play') return st.frozen ? `Paused mid-game · score ${st.g.score} — press ← → or fire to resume`
    : `Score ${st.g.score} · ships ${st.g.lives} · ← → or the joystick to steer, space / red button to fire`;
  if (st.mode === 'over') return `Game over · score ${st.g.score} · hi ${st.hi}` + (st.credits ? ' — press 1P start' : ' — insert coin');
  if (st.coinT !== null) return 'Coin in…';
  return st.credits ? `Credits ${st.credits} — press the white 1P START button (or Enter)` : 'Insert coin — click a 25¢ slot (or press 5)';
};

let ui = null, pressTimer = 0;
const press = k => { ui.st.down = k; clearTimeout(pressTimer); pressTimer = setTimeout(() => { ui.st.down = null; ui.render(); }, 150); };
function insertCoin(st){
  if (st.coinT !== null) return;
  if (st.credits >= 9) return ui.flash('Credits full (9)');
  st.coinT = 0;
  ui.animate(dt => { st.coinT += dt/.5; if (st.coinT < 1) return true;
    st.coinT = null; st.credits++; st.coinGlow = .6; if (st.mode === 'attract') st.mode = 'ready'; return false; });
}
function startGame(st){
  press('start');
  if (st.mode === 'play'){ ui.flash('Game already running'); return; }
  if (!st.credits){ ui.flash('Insert a coin first'); return; }
  st.credits--; newGame(st);
}
const nudge = (st, d) => { st.nudgeDir = d; st.nudgeT = .2; if (st.mode === 'play') st.frozen = false; };


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
    if (k > 0 && opts.under) s = xrUnder(opts.over ? s.replace('id="crt"', '').replace('id="stk"', '') : s, opts.mech(st, k), k) + (opts.over ? opts.over(st, k) : '');   // the whole drawing is the object; inside parts over it
    else if (k > 0 && !opts.inline) s = `<g opacity="${f(1 - .5*k)}">${s}</g><g opacity="${f(k)}">${opts.mech(st, k)}</g>`;   // inline: the figure ghosts its own case
    const items = k > .6 ? opts.inside(st) : opts.surface ? opts.surface(st) : [];
    return s + (items.length ? xrCallouts(items, opts.B) : '');
  };
}

/* ---------- see-through: how a real arcade cabinet is built ----------
   Parts (each sits on, or is held by, another part; cables run from a real port to a real port along walls):
   MONITOR  CRT faceplate behind the glass . tension band round its skirt . four mounting ears . funnel . anode cap and the
            thick anode lead down to the flyback . deflection yoke on the neck . neck . neck board on the tube's end .
            monitor frame screwed to both cheeks (top, bottom and two side bars)
   CHASSIS  two angle rails on the cheeks . tray . chassis board . flyback transformer . heatsink . filter capacitor .
            three adjustment pots . yoke, neck, video and mains connectors
   GAME     game PCB on four standoffs on the back wall (custom chip, CPU, ROMs, sound chip, edge fingers) .
            JAMMA edge connector the board's edge plugs into
   CONTROLS joystick: mounting plate, shaft through the panel, actuator, four microswitches .
            three fire buttons: housing, hex nut, microswitch with three terminals . 1P start button and its microswitch
   COINS    two coin mechs bolted to the coin door . a lamp behind each 25c insert . a coin chute under each mech .
            a coin switch with its wire lever on each chute . coin meter . service bracket (test, service, volume) . cash box
   POWER    mains cord in through the back grommet . power strip with its switch . switching power supply with terminal strip
   SOUND, LIGHT, AIR  speaker behind the front grille (basket, magnet) . marquee board, fixture channel, two sockets and the
            fluorescent tube behind the marquee . cooling fan on the back door's vents
   HARNESS  JAMMA harness: power up from the PSU, video and monitor mains up the back wall to the chassis, the controls lane
            along the right cheek into the panel, the coin branch down to the coin door, the speaker along the front wall;
            fan, marquee and monitor mains back to the power strip */
const AH = '#3a3632', AON = '#ffb347', APWR = '#c2300a';
const APCB = { l:'#4fa36a', m:'#2f8a4a', d:'#1d5f31' }, AGM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' }, ACOP = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' };
const AGLS = matOf('#4a5057'), APLAST = matOf('#e8e4da'), ALAMP = { l:'#fffbe8', m:'#fff1c2', d:'#e8d79a' }, ALIT = matOf('#ff9a3a'), ASW = matOf('#d8d2c2');
const aBB = (pts, e = 0) => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - e), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + e)];
const aBend = (pts, r = 2.5) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a cable as short depth-sortable pieces, terminal dots on its ends
const aLine = (pts, col, w = .55, ends = true) => { const q = aBend(pts), out = [], L = 7;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const e of [i === 0 && ends ? q[0] : null, j === q.length - 1 && ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.2" fill="${INK}"/>`; }
    out.push({ box: aBB(seg, 1), svg }); i = j; }
  return out; };
// convex six-faced solid from 8 corners (bottom 0-3, top 4-7): the faces turned to the viewer, shaded
function hexa(c, m, w = .7){
  const cen = avg(c); let s = '';
  for (const fc of [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
    const q = fc.map(i => c[i]); let n = norm(cross(sub(q[1], q[0]), sub(q[3], q[0])));
    if (dot(n, sub(avg(q), cen)) < 0) n = n.map(v => -v);
    if (vis(n)) s += shape(q, toneI(n, m), w); }
  return s; }
const kbC = (u0, u1, s0, s1, o0, o1) => [K3(u0,s0,o0), K3(u1,s0,o0), K3(u1,s1,o0), K3(u0,s1,o0), K3(u0,s0,o1), K3(u1,s0,o1), K3(u1,s1,o1), K3(u0,s1,o1)];
const sbC = (u0, u1, v0, v1, o0, o1) => [S3(u0,v0,o0), S3(u1,v0,o0), S3(u1,v1,o0), S3(u0,v1,o0), S3(u0,v0,o1), S3(u1,v0,o1), S3(u1,v1,o1), S3(u0,v1,o1)];
// the CRT's own frame: axis AX runs from the faceplate back to the neck, rings span y and the screen's up-slope
const AX = SN.map(v => -v), CRT_C = S3(31.5, 18.3, -.6);
const crtAt = d => CRT_C.map((v, i) => v + AX[i]*d);
const crtRing = (d, ru, rv, e = 1, n = 36) => { const c = crtAt(d);
  return Array.from({ length: n }, (_, i) => { const a = i/n*2*Math.PI, cu = Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**e, cv = Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**e;
    return [c[0] + ST[0]*rv*cv, c[1] + ru*cu, c[2] + ST[2]*rv*cv]; }); };
const CRT_PROF = [[0, 23, 15.6, .3], [4, 23, 15.6, .3], [7, 21.5, 14.8, .45], [12, 16, 12, .7], [17, 11, 9, .9], [21, 7, 6.4, 1], [24, 4.4, 4.4, 1], [26, 2.4, 2.4, 1]];
const PSU_B = [1, 6, 0, 17, 26, 11], STRIP = [3, 36, 0, 17, 56, 5], CASHB = [32, 16, 0, 54, 49, 17.5];
const MECH_Y = [26, 39], FIN = 55.4, LANE_Z = 88, COL = { x: 66, z: 91.2 };
const SPK = { y: 32.5, z: 67.5 }, BOARD = [8, 8, 97.2, 38, 59, 98], FLY = [28, 44, 98, 35, 52, 104];
function arcMech(st){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg }), t = performance.now()/1000;
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const hx = (c, m, w = .7) => put(aBB(c), hexa(c, m, w));
  const wires = (pts, col, w, ends) => parts.push(...aLine(pts, col, w, ends));
  const playing = st.mode === 'play', dir = stickDir(st);
  const coinFall = st.coinGlow > 0 ? 1 - st.coinGlow/.6 : -1, coinZ = 30.5 - 11*Math.max(0, coinFall)**2;
  const coinSw = coinFall >= 0 && coinFall < .5, coinOn = st.coinT != null || st.coinGlow > 0;
  const btnOn = k => st.down === k, stickOn = playing && dir !== 0, anyCtl = stickOn || ['red','yellow','blue','start'].some(btnOn);

  // ---- MONITOR: the CRT as one turned body, drawn far end first; the yoke and the tension band wrap it
  { const segs = CRT_PROF.slice(0, -1).map((p, i) => { const q = CRT_PROF[i + 1], A = crtRing(p[0], p[1], p[2], p[3]), B = crtRing(q[0], q[1], q[2], q[3]);
      return { d: p[0], svg: loft(A, B, n => toneI(n, AGLS)) + hullInk([...A, ...B], .9) }; });
    const neckIn = rod(crtAt(26), crtAt(28), 2.2, DARK, toneI, .8), neckOut = rod(crtAt(28), crtAt(40), 2.2, DARK, toneI, .8);
    const yA = crtRing(22, 6.2, 6.2), yB = crtRing(28, 5, 5);
    const yoke = loft(yA, yB, n => toneI(n, ACOP)) + (vis(SN) ? fill(pd(yA), ACOP.m) + ink(pd(yA), .7) : fill(pd(yB), ACOP.m) + ink(pd(yB), .7)) + hullInk([...yA, ...yB], .9)
      + [23.5, 25, 26.5].map(d => ink(pd(crtRing(d, 6.25 - (d - 22)*.2, 6.25 - (d - 22)*.2).filter(p => vis(sub(p, crtAt(d))) ), false), .35)).join('');
    const bA = crtRing(1, 23.5, 16.1, .3), bB = crtRing(3, 23.5, 16.1, .3);
    const band = loft(bA, bB, n => toneI(n, METAL)) + hullInk([...bA, ...bB], .7);
    const nb = sbC(31.5 - 4, 31.5 + 4, 18.3 - 4.2, 18.3 + 4.2, -.6 - 40, -.6 - 41.6);
    const neckBoard = hexa(nb, APCB, .7);
    const back = vis(AX);   // looking at the tube from behind: faceplate first, neck last
    const order = back ? [segs[0].svg, band, ...segs.slice(1, 5).map(s => s.svg), segs[5].svg, segs[6].svg, neckIn, yoke, neckOut, neckBoard]
                       : [neckBoard, neckOut, neckIn, segs[6].svg, segs[5].svg, yoke, ...segs.slice(1, 5).reverse().map(s => s.svg), segs[0].svg, band];
    // anode cap on the +y side of the funnel (drawn with the funnel, on the side it faces)
    const capC = crtAt(13), capP = [capC[0], capC[1] + 15.2, capC[2]];
    const cap = rod(capP, [capP[0], capP[1] + 1.3, capP[2]], 1.6, matOf('#c2300a'), toneI, .6);
    put(aBB([...crtRing(0, 23.5, 16.1, .3), crtAt(41.6).map((v, i) => v + (i === 2 ? 4.2 : 0)), crtAt(41.6).map((v, i) => v - (i === 2 ? 4.2 : 0))]),
      (vis([0,1,0]) ? '' : cap) + order.join('') + (vis([0,1,0]) ? cap : ''));
    // anode lead: cap down to the flyback dome
    wires([[capP[0], capP[1] + 1.3, capP[2]], [capP[0] - 1, 50.5, capP[2] - 4], [33.5, 50.5, 111], [31.5, 48, 107.2]], matOf('#c2300a').l, .75, false);
    // yoke and neck leads drop to their connectors on the chassis board
    const yb = crtAt(25); wires([[yb[0], yb[1] - 3, yb[2] - 5.4], [yb[0], 30, 104], [yb[0], 30, 99.5]], playing ? AON : AH, .5);
    const nbB = crtAt(40.8); wires([[nbB[0], 34, nbB[2] - 4.1], [nbB[0], 36, 104], [nbB[0], 37, 99.5]], playing ? AON : AH, .5);
  }
  // monitor frame: bars round the faceplate, screwed to both cheeks; four ears from the tension band
  hx(sbC(T, D - T, -.6, 2.2, -1.8, -3.2), AGM);
  hx(sbC(T, D - T, 34.4, 37.2, -1.8, -3.2), AGM);
  hx(sbC(T, 5.6, 2.2, 34.4, -1.8, -3.2), AGM);
  hx(sbC(D - 5.6, D - T, 2.2, 34.4, -1.8, -3.2), AGM);
  for (const [u0, u1, v0, v1] of [[5.6, 9.2, 2.2, 4.6], [53.8, 59.4, 2.2, 4.6], [5.6, 9.2, 32, 34.4], [53.8, 59.4, 32, 34.4]]) hx(sbC(u0, u1, v0, v1, -2, -3), METAL);
  // ---- CHASSIS: rails on the cheeks, tray, board and its parts
  bx(6, T, 95, 40, T + 2, 96.6, AGM); bx(6, D - T - 2, 95, 40, D - T, 96.6, AGM);
  bx(6, T, 96.6, 40, D - T, 97.2, METAL, .7);
  let brd = box(...BOARD, APCB, toneI, .7);
  put([BOARD.slice(0, 3), BOARD.slice(3)], brd);
  bx(...FLY, DARK, .8);
  put([[FLY[0] + .5, FLY[1] + .5, FLY[5]], [FLY[3] - .5, FLY[4] - .5, FLY[5] + 3]], cyl(31.5, 48, FLY[5], FLY[5] + 2.6, 2.8, DARK, toneI, .8, 18));
  { let hs = box(12, 11, 98, 24, 13.5, 106, METAL, toneI, .7); if (vis([0,1,0])) for (let x = 13.5; x < 24; x += 1.5) hs += line([[x, 13.55, 98.4], [x, 13.55, 105.6]], .35);
    put([[12, 11, 98], [24, 13.5, 106]], hs); }
  put([[16, 19.5, 98], [21, 24.5, 104]], cyl(18.5, 22, 98, 104, 2.5, matOf('#3e6fb0'), toneI, .7, 16));
  for (const y of [15, 19, 23]) put([[33, y - 1.2, 98], [35.4, y + 1.2, 99.6]], cyl(34.2, y, 98, 99.6, 1.1, matOf('#3e86d9'), toneI, .5, 12));
  for (const [y0, y1] of [[51.5, 55.5], [56.5, 59], [29, 32], [35.5, 38.5]]){ const x0 = y0 > 50 ? 8.5 : 9.5; bx(y0 > 50 ? 8.5 : (y0 < 33 ? 24 : 9.5), y0, 98, y0 > 50 ? 11.5 : (y0 < 33 ? 29 : 13), y1, 99.6, APLAST, .5); }
  // ---- GAME: board on standoffs on the back wall, edge connector under it
  for (const [y, z] of [[14, 66.5], [50, 66.5], [14, 90], [50, 90]]) bx(0, y - .7, z - .7, 1.5, y + .7, z + .7, METAL, .4);
  let pcb = box(1.5, 12, 64.5, 2.5, 52, 92, APCB, toneI, .8);
  if (vis([1,0,0])){
    for (const [y0, z0, y1, z1, m] of [[16, 76, 26, 86, DARK], [29, 78, 37, 84, DARK], [40, 80, 48, 87, DARK], [16, 68, 22, 72, DARK], [24, 68, 30, 72, DARK], [32, 68, 38, 72, DARK], [41, 69, 47, 75, DARK]])
      pcb += box(2.5, y0, z0, 3.2, y1, z1, m, toneI, .45);
    for (let y = 13; y < 51; y += 1.6) pcb += fill(pd(on(PX(2.55), rectUV(y, 64.6, y + .9, 66))), '#d2ad4a');
    pcb += fill(pd(on(PX(3.25), ellUV(44, 89.5, .6, .6, 10))), Math.sin(t*4) > 0 && playing ? '#7dff9a' : '#2a5a36');
  }
  put([[1.5, 12, 64.5], [3.2, 52, 92]], pcb);
  bx(.8, 14, 59, 4.2, 50, 64.5, DARK, .8);
  // ---- CONTROLS under the panel: joystick
  { const b = K3(STICK.u, STICK.s, .1), th = dir*26*Math.PI/180, p = tt => [b[0], b[1] + tt*Math.sin(th), b[2] - tt*Math.cos(th)];
    hx(kbC(44, 56, 2, 12.5, -1.2, -2.2), AGM, .7);                                                   // mounting plate under the panel
    put(aBB([p(.1), p(1.4)], .6), rod(p(.1), p(1.4), .55, METAL, toneI, .5));
    put(aBB([p(2.5), p(3.7)], .6), rod(p(2.5), p(3.7), .55, METAL, toneI, .5));
    put(aBB([p(3.7), p(4.6)], 1), rod(p(3.7), p(4.6), .95, matOf('#2a2622'), toneI, .6));          // actuator
    put(aBB([p(4.6), p(7.6)], .6), rod(p(4.6), p(7.6), .55, METAL, toneI, .5));
    const sw = [[2.7, 4.7, 5.3, 8.3, dir > 0], [-4.7, -2.7, 5.3, 8.3, dir < 0], [-1.5, 1.5, 9.5, 11.5, false], [-1.5, 1.5, 2.1, 4.1, false]];
    for (const [a0, a1, s0, s1, on] of sw){ const lit = on && playing;
      hx(kbC(STICK.u + a0, STICK.u + a1, s0, s1, -2.2, -5.2), lit ? ALIT : ASW, .6);
      const m = K3(STICK.u + (a0 + a1)/2, (s0 + s1)/2, -5.2);
      wires([m, [COL.x, m[1], COL.z]], lit ? AON : AH, .4, true); } }
  // fire buttons and 1P start: housing through the panel, hex nut, microswitch, terminals
  for (const b of [...BTNS.map(q => ({ u: q.u, s: q.s, k: q.k, r: 2.3 })), { u: START.u, s: START.s, k: 'start', r: 0 }]){
    const on = btnOn(b.k), sm = on ? ALIT : ASW, items = [];
    if (b.r){ items.push([K3(b.u, b.s, -2.2), K3(b.u, b.s, -4)].map(x => x), [K3(b.u, b.s, -1.2), K3(b.u, b.s, -2.2)], [K3(b.u, b.s, -.15), K3(b.u, b.s, -1.2)]);
      const [lo, nut, hi] = items, up = vis(KN);
      const svg = [rod(lo[0], lo[1], b.r, matOf('#2a2622'), toneI, .6), rod(nut[0], nut[1], b.r + 1, DARK, toneI, .6, b.r + 1, 6), rod(hi[0], hi[1], b.r, matOf('#2a2622'), toneI, .6)];
      put(aBB([K3(b.u - 3.3, b.s - 3.3, -.15), K3(b.u + 3.3, b.s + 3.3, -4)]), (up ? svg : svg.reverse()).join('')); }
    else hx(kbC(b.u - 2, b.u + 2, b.s - 1.6, b.s + 1.6, -.15, -3), matOf('#2a2622'));
    const o0 = b.r ? -4 : -3;
    hx(kbC(b.u - 1.8, b.u + 1.8, b.s - 1.3, b.s + 1.3, o0, o0 - 3), sm, .6);
    for (const du of [-1.1, 0, 1.1]) hx(kbC(b.u + du - .25, b.u + du + .25, b.s - .6, b.s + .6, o0 - 3, o0 - 4), METAL, .4);
    const m = K3(b.u, b.s, o0 - 4); wires([m, [COL.x, b.u, COL.z]], on ? AON : AH, .4, true);
  }
  // controls lane: collector under the panel, back along the right cheek, down the back wall to the JAMMA connector
  wires([[3, 14, 61], [2, 4, 61.5], [2, 4, LANE_Z], [56, 4, LANE_Z], [COL.x, 4, COL.z], [COL.x, 55, COL.z]], anyCtl || coinOn ? AON : AH, .9, true);
  // ---- COINS: two mechs on the door, lamps, chutes, coin switches, meter, service bracket, cash box
  for (const c of MECH_Y){
    let mech = box(48, c - 3.6, 33, FIN, c + 3.6, 48, AGM, toneI, .9);
    const sy = vis([0,1,0]) ? c + 3.65 : c - 3.65;
    mech += shape(on(PY(sy), ellUV(51, 42, 1.8, 1.8, 14)), '#2a2622', .5) + shape(on(PY(sy), rrUV(49, 35, 54, 37.5, .8)), AGM.d, .4);
    put([[48, c - 3.6, 33], [FIN, c + 3.6, 48]], mech);
    put([[50.5, c - 1.2, 49.8], [FIN, c + 1.2, 52.2]], rod([50.5, c, 51], [53, c, 51], 1.2, AGM, toneI, .5) + rod([53, c, 51], [FIN, c, 51], 1, ALAMP, toneI, .5));
    // chute: clear sheet so the falling coin shows; the coin first, the chute's walls over it
    let ch = '';
    if (c === 39 && coinFall >= 0) ch += shape(on(PY(c), ellUV(51, coinZ, 2.2, 2.2, 18)), COIN.l, .8) + ink(pd(on(PY(c), ellUV(51, coinZ, 1.4, 1.4, 14))), .4);
    ch += `<g opacity=".38">${box(48.5, c - 2, 17.5, 53.5, c + 2, 33, CLEAR, toneI, 0)}</g>` + `<g opacity=".8">${box(48.5, c - 2, 17.5, 53.5, c + 2, 33, CLEAR, () => 'none', .6)}</g>`;
    put([[48.5, c - 2, 17.5], [53.5, c + 2, 33]], ch);
    const lit = c === 39 && coinSw;
    bx(49, c + 2, 28, 53, c + 4.2, 32, lit ? ALIT : ASW, .6);
    put([[50.5, c - 1.4, 29], [51.5, c + 2, 31]], line([[51, c + 2, 29.6], [51, c - 1.2, lit ? 29 : 30.4]], .8));
    wires([[49, c + 3.1, 30], [46, c + 3.1, 30]], lit ? AON : AH, .4, false);
    wires([[50.5, c, 51], [46, c, 50], [46, c, 30]], AH, .4, false);
  }
  { let mt = box(50, 51, 24, FIN, 57, 30, DARK, toneI, .8);
    if (vis([0,0,1])){ mt += shape(on(PZ(30.05), rectUV(51, 52.2, 54.5, 55.8)), '#f2efe7', .4);
      for (let i = 0; i < 4; i++) mt += line([[51.4 + i*.85, 53, 30.1], [51.4 + i*.85, 55, 30.1]], .4); }
    put([[50, 51, 24], [FIN, 57, 30]], mt); }
  wires([[50, 54, 27], [46, 54, 30], [46, 4, 30], [46, 4, LANE_Z]], coinOn ? AON : AH, .55, false);
  { let sb = box(51, 44, 36, FIN, 48.5, 42, AGM, toneI, .7);
    if (vis([-1,0,0])) sb += [45.2, 47.3].map(y => shape(on(PX(50.95), ellUV(y, 40, .7, .7, 10)), '#e2483d', .4)).join('') + shape(on(PX(50.95), ellUV(46.2, 37.4, .9, .9, 12)), METAL.m, .4);
    put([[51, 44, 36], [FIN, 48.5, 42]], sb); }
  wires([[51, 46.2, 36.5], [46, 46.2, 33], [46, 46.2, 30]], AH, .4, false);
  { let cb = box(...CASHB, AGM, toneI, 1);
    if (vis([0,0,1])) for (const c of MECH_Y) cb += shape(on(PZ(CASHB[5] + .05), rectUV(49, c - 1.6, 53, c + 1.6)), '#1d1a16', .5);
    if (vis([-1,0,0])) cb += shape(on(PX(CASHB[0] - .05), rrUV(28, 7, 37, 10, 1.2)), METAL.l, .6);
    put([CASHB.slice(0, 3), CASHB.slice(3)], cb); }
  // ---- POWER: cord in at the back grommet, power strip, power supply with its terminal strip
  { let ps = box(...PSU_B, METAL, toneI, .9);
    if (vis([1,0,0])) for (let i = 0; i < 6; i++) ps += shape(on(PX(PSU_B[3] + .05), rrUV(8 + i*2.6, 2.5, 9.3 + i*2.6, 8.5, .5)), mix(METAL.d, '#000000', .3), .4);
    put([PSU_B.slice(0, 3), PSU_B.slice(3)], ps); }
  { let tb = box(3, 21.5, 11, 15, 25, 12.4, DARK, toneI, .6); if (vis([0,0,1])) for (let x = 4; x < 15; x += 1.6) tb += fill(pd(on(PZ(12.45), ellUV(x, 23.2, .45, .45, 8))), METAL.l);
    put([[3, 21.5, 11], [15, 25, 12.4]], tb); }
  { let sr = box(...STRIP, DARK, toneI, .8);
    if (vis([0,0,1])) for (const y of [44, 49, 54]) sr += shape(on(PZ(5.05), rrUV(6, y - 1.6, 10, y + 1.6, .6)), '#1d1a16', .4);
    put([STRIP.slice(0, 3), STRIP.slice(3)], sr); }
  bx(12.5, 37.5, 5, 15.5, 41.5, 6.4, matOf('#e2483d'), .5);                                             // power switch (lit rocker)
  put([[0, 44.4, 12.4], [1, 47.6, 15.6]], cylX(0, 1, 46, 14, 1.6, DARK, toneI, .6, 14));                    // grommet in the back panel
  wires([[1, 46, 14], [2.5, 46, 12], [5, 45, 5]], '#2a2622', .7, false);                                  // mains cord in
  wires([[9, STRIP[1], 2.5], [9, PSU_B[4], 2.5]], '#2a2622', .55);                                         // strip -> PSU mains
  wires([[4, 23.3, 12.4], [2, 20, 15], [2, 20, 59]], APWR, .6);                                             // PSU -> JAMMA power
  // ---- video and monitor mains up the back wall to the chassis
  wires([[3, 50, 61], [2, 53.5, 63], [2, 53.5, 99], [8.5, 53.5, 99]], playing ? AON : AH, .6);
  wires([[7, 53, 5], [2, 57.8, 9], [2, 57.8, 99], [8.5, 57.8, 99]], '#2a2622', .55);
  // ---- SOUND: speaker behind the grille; wire along the front wall to the lane
  put([[46.5, SPK.y - 2.4, SPK.z - 2.4], [49, SPK.y + 2.4, SPK.z + 2.4]], rod([46.5, SPK.y, SPK.z], [49, SPK.y, SPK.z], 2.4, DARK, toneI, .7));
  put([[49, SPK.y - 4.3, SPK.z - 4.3], [FIN, SPK.y + 4.3, SPK.z + 4.3]], rod([49, SPK.y, SPK.z], [FIN, SPK.y, SPK.z], 2.4, AGM, toneI, .7, 4.3, 22));
  wires([[50, SPK.y, SPK.z + 2.9], [50, SPK.y, 75], [54.6, SPK.y, 77], [54.6, 6, 77], [54.6, 4, LANE_Z - .5]], playing ? AON : AH, .45);
  // ---- LIGHT: marquee board, fixture channel, sockets, fluorescent tube
  bx(47, T, 156, 49, D - T, 176, matOf('#c9a77c'), .8);
  bx(49, 5.5, 161.5, 51, D - 5.5, 168.5, METAL, .7);
  for (const [y0, y1] of [[5.5, 8], [D - 8, D - 5.5]]) bx(51, y0, 162, 55.5, y1, 168, APLAST, .6);
  put([[52.7, 8, 163.7], [55.3, D - 8, 166.3]], rod([54, 8, 165], [54, D - 8, 165], 1.3, ALAMP, toneI, .7));
  wires([[50, D - 7, 168.5], [50, 61.5, 177.5], [2, 61.5, 177.5], [2, 61.5, 6], [20, 61.5, 2.5], [STRIP[3], 52, 2.5]], '#2a2622', .5);   // over the board, along the roof, down the back corner
  // ---- AIR: fan on the back door's vents
  { let fn = box(.5, 23, 132, 3, 42, 151, DARK, toneI, .8);
    if (vis([1,0,0])){ fn += shape(on(PX(3.05), ellUV(32.5, 141.5, 8.6, 8.6, 28)), '#1d1a16', .6);
      for (let i = 0; i < 5; i++){ const a = t*9 + i*2*Math.PI/5; fn += shape(on(PX(3.1), [[32.5 + 2*Math.cos(a), 141.5 + 2*Math.sin(a)], [32.5 + 8*Math.cos(a + .25), 141.5 + 8*Math.sin(a + .25)], [32.5 + 7.6*Math.cos(a + .75), 141.5 + 7.6*Math.sin(a + .75)]]), AGM.l, .4); }
      fn += shape(on(PX(3.15), ellUV(32.5, 141.5, 2.4, 2.4, 14)), AGM.m, .5); }
    put([[.5, 23, 132], [3, 42, 151]], fn); }
  wires([[2, 42, 133], [2, 59.5, 128], [2, 59.5, 6], [12, 59.5, 2.5], [12, STRIP[4], 2.5]], '#2a2622', .5);
  return byDepth(parts);
}
// outside parts drawn again over the inside when they face the viewer: the screen picture, the panel's buttons and stick
function arcOver(st, k){
  const FR = facing([1,0,0]);
  let s = arcMech(st);
  if (FR && vis(SN)) s += shape(onS(GLASS, .08), SCR.bg, 1.5) + `<clipPath id="crtclip2"><path d="${pd(onS(GLASS, .08))}"/></clipPath>`
    + act('screen', `<g clip-path="url(#crtclip2)"><g id="crt">${crtSVG(st)}</g></g>`);
  if (FR && vis(KN)) s += byDepth([
    ...BTNS.map(b => ({ at: K3(b.u, b.s, 1), svg: act('btn', panelButton(b.u, b.s, b.r, BTN[b.k], st.down === b.k, ''), `data-k="${b.k}"`) })),
    { at: K3(START.u, START.s, .5), svg: act('start', startButton(START.u, START.s, '1P', st.down === 'start')) },
    { at: K3(STICK.u, STICK.s, 3), svg: `<g id="stk">${joystick(st)}</g>` } ]);
  if (FR && st.coinT !== null){ const q = ease(Math.min(1, st.coinT)); s += coinDisc(XF + 13 - q*16, 39, 43.5 + 3*(1 - q), 2.5); }
  return `<g opacity="${f(k)}">${s}</g>`;
}
const XR_OPTS = { getSt: () => { try { return ui.st; } catch (e) { return {}; } }, B: [0, W, 0, D, 0, H],
  mech: () => '', over: arcOver,
  inside: st => { const playing = st.mode === 'play', dir = stickDir(st), coinOn = st.coinT != null || st.coinGlow > 0;
    return [ { at: crtAt(10).map((v, i) => i === 2 ? v + 11 : v), text:'CRT', on: playing },
      { at: [FLY[0], 48, FLY[5]], text:'MONITOR CHASSIS', on: playing },
      { at: [2.5, 20, 88], text:'GAME BOARD', on: playing },
      { at: [3, 30, 60], text:'JAMMA CONNECTOR', on: playing || coinOn },
      { at: K3(STICK.u + 3.7, 6.8, -5.2), text:'JOYSTICK SWITCHES', on: playing && dir !== 0 },
      { at: K3(22.5, 8.8, -7), text:'BUTTON SWITCHES', on: !!st.down },
      { at: [FIN, 39, 48], text:'COIN MECH', on: coinOn },
      { at: [50, 54, 30], text:'COIN METER', on: st.coinGlow > 0 },
      { at: [CASHB[3], 30, CASHB[5]], text:'CASH BOX', on: false },
      { at: [PSU_B[3], 16, PSU_B[5]], text:'POWER SUPPLY', on: false },
      { at: [54, 50, 166.3], text:'MARQUEE LAMP', on: true } ]; } };
const XR_CAPTION = st => {
  if (st.coinT != null || st.coinGlow > 0) return 'Coin in: the coin mech checks it and drops it down the chute past the coin switch’s wire lever. The switch tells the game board, which adds a credit and clicks the coin meter; the coin lands in the cash box.';
  if (st.mode === 'play') return 'Playing: the joystick’s actuator presses one of four microswitches and each button has its own. Their wires run to the JAMMA connector on the game board, which sends the picture up the back wall to the monitor chassis that drives the CRT.';
  if (st.mode === 'over') return 'Game over: the game board keeps sending pictures to the monitor chassis and waits for the next coin.';
  return 'Inside: mains comes in at the back to a power strip for the power supply, the monitor chassis, the marquee tube and the fan. One JAMMA harness on the game board carries the picture, the sound and every switch.';
};

XR_OPTS.under = true;
scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'26', turn:'full', title:'Arcade cabinet', hint:'insert a coin, press 1P start, then ← → and space',
  idea:"A joystick is just four little switches \u2014 leaning it presses one, and the game moves your ship.",
  size:[W,D,H], palette:'blush', views:true,
  state:{ mode:'attract', credits:0, hi:500, t:0, g:null, coinT:null, coinGlow:0, down:null,
          keyL:false, keyR:false, hold:0, nudgeT:0, nudgeDir:0, stickParam:0, frozen:false, overT:0, tFrozen:false },
  scene, readout,
  buttonsLabel:'Cabinet',
  buttons:[
    { label:'Insert 25¢', onClick:(st)=>insertCoin(st) },
    { label:'1P Start', onClick:(st)=>startGame(st) },
  ],
  next: st => st.mode === 'play' ? -1 : st.credits > 0 ? 1 : 0,   // in play, the keypad is the control
  stats: st => [ { label:'Credits', value: st.credits },
                 st.g && st.mode !== 'attract' && { label:'Score', value: st.g.score, small:true },
                 { label:'Hi-score', value: st.hi, small:true } ],
  acts:{},
  params(st, q){
    if (q.has('credit')){ st.credits = Math.max(0, Math.min(9, +q.get('credit')||0)); if (st.credits) st.mode = 'ready'; }
    const sk = q.get('stick'); if (sk === 'left') st.stickParam = -1; if (sk === 'right') st.stickParam = 1;
    if (q.has('t')){ st.t = +q.get('t'); st.tFrozen = true; }
    if (q.get('play') === '1'){
      newGame(st); st.frozen = true;
      Object.assign(st.g, { sx: 12, score: 340, lives: 2,
        en: [{x:6,y:13.6,c:SCR.inv},{x:16,y:10.2,c:SCR.inv2},{x:25,y:14.4,c:SCR.inv},{x:21,y:6.4,c:SCR.inv2}],
        sh: [{x:12,y:7},{x:16,y:5.6}], boom:[{x:9,y:11,t:.3}] });
      if (st.stickParam) st.g.sx = 12 + st.stickParam*3;
    }
    if (q.get('over') === '1'){ newGame(st); st.g.score = 620; st.hi = 620; st.mode = 'over'; st.overT = 1e9; }
  },
});

/* ---------- input ---------- */
const svg = document.getElementById('fig');
svg.addEventListener('pointerdown', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const st = ui.st, n = a.dataset.act;
  if (n === 'coin') insertCoin(st);
  else if (n === 'start') startGame(st);
  else if (n === 'btn'){ press(a.dataset.k); if (a.dataset.k === 'red') fire(st); else if (st.mode === 'play') fire(st); }
  else if (n === 'stickL' || n === 'stickR'){ st.hold = n === 'stickL' ? -1 : 1; nudge(st, st.hold); }
  else if (n === 'screen'){ if (st.mode === 'play') fire(st); else if (st.credits) startGame(st); else insertCoin(st); }
  ui.render();
});
window.addEventListener('pointerup', () => { ui.st.hold = 0; });
window.GAME_KEYS = true;   // the arrows and space play the game; they don't turn the camera here
window.addEventListener('keydown', e => {
  const st = ui.st;
  if (e.key === 'ArrowLeft'){ st.keyL = true; if (st.mode==='play') st.frozen = false; e.preventDefault(); }
  else if (e.key === 'ArrowRight'){ st.keyR = true; if (st.mode==='play') st.frozen = false; e.preventDefault(); }
  else if (e.key === ' ' ){ if (!e.repeat){ press('red'); fire(st); ui.render(); } e.preventDefault(); }
  else if (e.key === 'Enter' || e.key === '1'){ startGame(st); ui.render(); }
  else if (e.key === '5' || e.key === 'c'){ insertCoin(st); }
});
window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft') ui.st.keyL = false; if (e.key === 'ArrowRight') ui.st.keyR = false; });

/* ---------- main loop: game ticks; only the CRT and the stick are redrawn every frame ---------- */
let last = performance.now(), acc = 0, lastDir = 0;
function tick(now){
  const st = ui.st, dt = Math.min(.05, (now-last)/1000); last = now;
  if (!st.tFrozen) st.t += dt;
  st.nudgeT = Math.max(0, st.nudgeT - dt);
  let full = false;
  if (st.coinGlow > 0){ st.coinGlow -= dt; if (st.coinGlow <= 0 || st.xr > 0) full = true; }   // see-through: the coin falls down the chute
  if (st.mode === 'play' && !st.frozen && stepGame(st, dt)) full = true;
  if (st.mode === 'over' && (st.overT -= dt) <= 0){ st.mode = st.credits ? 'ready' : 'attract'; full = true; }
  acc += dt;
  const dir = stickDir(st);
  if (st.xr > 0 && dir !== lastDir) full = true;                     // see-through: the joystick switches follow the stick
  if (full){ ui.render(); acc = 0; }
  else if (acc >= (st.mode === 'play' ? 1/30 : 1/12) || dir !== lastDir){
    acc = 0;
    const crt = document.getElementById('crt'), stk = document.getElementById('stk');
    if (crt) crt.innerHTML = inkScale(crtSVG(st));
    if (ui && ui.drawStats) ui.drawStats();
    if (stk && dir !== lastDir) stk.innerHTML = inkScale(joystick(st));
    if (!ui._flash) document.getElementById('readout').textContent = readout(st);
  }
  lastDir = dir;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------- keypad: an inked control plate under the buttons; tap or hold its keys, or press the same keys on the keyboard ----------
   Each key just sends the keyboard event the figure already handles (arrows, space), so pad and keyboard behave alike;
   keys light while held, whichever way they are pressed. */
function mountKeypad(spec){
  const host = document.getElementById('btns'); if (!host) return;
  const css = document.createElement('style');
  css.textContent = `.kpad{display:flex;align-items:center;gap:16px;margin-top:6px;padding:10px 12px;border:1.5px solid var(--ink);border-radius:14px;
      background:var(--paper);box-shadow:0 3px 0 var(--ink);touch-action:none;user-select:none;-webkit-user-select:none}
    .kpad .dp{display:grid;grid-template-columns:repeat(3,34px);grid-template-rows:repeat(var(--rows),34px);gap:3px}
    .kpad .k{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:34px;height:34px;cursor:pointer;
      background:#fbf7ea;border:1.5px solid var(--ink);border-radius:7px;box-shadow:0 3px 0 var(--ink);color:var(--ink);font:700 13px ui-monospace,Menlo,monospace;
      transition:transform .05s,box-shadow .05s,background .05s}
    .kpad .hub{width:34px;height:34px;display:flex;align-items:center;justify-content:center}
    .kpad .hub i{width:12px;height:12px;border-radius:50%;border:1.5px solid var(--ink);background:#e6e0d1}
    .kpad .go{all:unset;box-sizing:border-box;width:62px;height:62px;border-radius:50%;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:#e2483d;border:1.5px solid var(--ink);box-shadow:0 4px 0 var(--ink),inset 0 -5px 0 rgba(0,0,0,.18);color:#fff;font:800 12px ui-monospace,Menlo,monospace;letter-spacing:.06em;
      transition:transform .05s,box-shadow .05s}
    .kpad .go small{font:700 8px ui-monospace,Menlo,monospace;opacity:.85;letter-spacing:.08em;margin-top:2px}
    .kpad .down{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
    .kpad .k.down{background:var(--accent,#f4b829)}
    .kpad .go.down{transform:translateY(3px);box-shadow:0 1px 0 var(--ink),inset 0 -3px 0 rgba(0,0,0,.18)}
    @media (max-width:560px){.kpad{gap:22px;padding:10px 16px}.kpad .dp{grid-template-columns:repeat(3,44px);grid-template-rows:repeat(var(--rows),44px)}
      .kpad .k,.kpad .hub{width:44px;height:44px;font-size:15px}.kpad .go{width:74px;height:74px}}`;
  document.head.appendChild(css);
  const pad = document.createElement('div'); pad.className = 'kpad'; pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', 'Keypad');
  const dp = document.createElement('div'); dp.className = 'dp'; dp.style.setProperty('--rows', spec.rows);
  const els = {};
  for (const k of spec.keys){
    const b = document.createElement('button'); b.className = 'k'; b.textContent = k.glyph; b.setAttribute('aria-label', k.name);
    b.style.gridColumn = k.at[0] + 1; b.style.gridRow = k.at[1] + 1; dp.appendChild(b); els[k.key] = b; }
  if (spec.hub){ const h = document.createElement('div'); h.className = 'hub'; h.innerHTML = '<i></i>'; h.style.gridColumn = spec.hub[0] + 1; h.style.gridRow = spec.hub[1] + 1; dp.appendChild(h); }
  const go = document.createElement('button'); go.className = 'go'; go.innerHTML = `${spec.action}<small>SPACE</small>`; go.setAttribute('aria-label', spec.action);
  els[' '] = go;
  pad.append(dp, go); host.appendChild(pad);
  const send = (type, key) => dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
  for (const [key, el] of Object.entries(els)){
    let held = null;
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (held != null) return; held = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch (_) {} send('keydown', key); });
    const release = e => { if (held == null || (e && e.pointerId !== held)) return; held = null; send('keyup', key); };
    el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release); el.addEventListener('lostpointercapture', release);
    el.addEventListener('click', e => e.preventDefault());
    el.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); send('keydown', key); setTimeout(() => send('keyup', key), 120); } });
  }
  // space belongs to the game: a button that still has the focus from a click must not be pressed by it too
  addEventListener('keydown', e => { if (e.key === ' ' && e.target && e.target.closest && e.target.closest('button')) e.preventDefault(); }, true);
  addEventListener('keyup', e => { if (e.key === ' ' && e.target && e.target.closest && e.target.closest('button')) e.preventDefault(); }, true);
  // light the keys for real key presses too (and for the pad's own, which arrive the same way)
  addEventListener('keydown', e => { const el = els[e.key]; if (el) el.classList.add('down'); });
  addEventListener('keyup', e => { const el = els[e.key]; if (el) el.classList.remove('down'); });
  addEventListener('blur', () => Object.values(els).forEach(el => el.classList.remove('down')));
}
mountKeypad({ rows: 1, hub: [1, 0], action: 'FIRE', keys: [
  { key:'ArrowLeft', glyph:'\u25c0', name:'Move left', at:[0, 0] }, { key:'ArrowRight', glyph:'\u25b6', name:'Move right', at:[2, 0] } ] });
xrMount(() => ui, XR_CAPTION);