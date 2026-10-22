/* ---------- geometry (x = depth, y = width, z = height) ---------- */
const W = 90, D = 130, H = 232, R = 8, T = 6;
const WIN = [40,62,122,196];          // glass window on the front: y0,z0,y1,z1
const TRAY = [44,16,118,42];          // pickup opening
const CUP = [12,64,30,80];            // coin-return cup under the return button
const SHELF_X = 82;                   // front edge of the shelves
const ITEM_X = 70, ITEM_STEP = 16;    // front item depth, spacing of the items queued behind it
const COL_Y = [111,91,71,51];         // columns 1-4, left to right on screen: centred in the window (WIN y 40-122), so all four show head-on
const ROWS = [
  { code:'A', s:148, kind:'can',    price:1.5, cols:['#e2473a','#2f6fd6','#f2c230','#38a565'] },
  { code:'B', s:116, kind:'can',    price:1.5, cols:['#8c4bd1','#f08a2b','#ece6d6','#33302c'] },
  { code:'C', s:84,  kind:'bottle', price:2.0, cols:['#f07b2a','#5cc0e8','#d94f86','#9ccc3c'] },
  { code:'D', s:52,  kind:'snack',  price:1.0, cols:['#f2c230','#e2473a','#3e86d9','#8a5a3c'] },
];


/* ---------- turn-aware helpers ---------- */
// axis-aligned box drawing only the faces toward the viewer (core box() always draws +y/+x/top)
function boxV(x0,y0,z0,x1,y1,z1,m,shade=toneI,w=1){
  const F = [
    [[0,1,0],  [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]],
    [[1,0,0],  [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]]],
    [[0,0,1],  [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]],
    [[0,-1,0], [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]],
    [[-1,0,0], [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]]],
  ];
  return F.filter(([n]) => facing(n)).map(([n,p]) => shape(p, shade(n,m), w)).join('');
}
// text lying on any vertical face: U = reading direction in 3D (along the face, left-to-right as seen from outside)
const txOn = (x,y,z,U,str,size,col=INK,weight=700,extra='letter-spacing=".04em"') => { const o=P(x,y,z);
  return `<text transform="${txM(o, Dv(...U), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" ${extra}>${str}</text>`; };
const txBack  = (y,z,str,size,col,weight) => txOn(-.4,y,z,[0,1,0],str,size,col,weight);     // back face x = 0
const txRight = (x,z,str,size,col,weight) => txOn(x,-.4,z,[-1,0,0],str,size,col,weight);    // right side y = 0

/* ---------- products ---------- */
const zRing = (x,y,z,r) => on(PZ(z), ellUV(x,y,r,r));
function can(x,y,z,col){
  const m=matOf(col), a=zRing(x,y,z,5.6), b=zRing(x,y,z+2,6.5), c=zRing(x,y,z+17,6.5), d=zRing(x,y,z+20,5.6);
  return loft(a,b,n=>toneI(n,METAL)) + loft(b,c,n=>toneI(n,m)) + loft(c,d,n=>toneI(n,METAL))
    + fill(pd(d),METAL.l) + ink(pd(d),.9) + ink(pd(zRing(x+1.5,y,z+20.1,1.6)),.7)
    + `<path d="${pd([[x+5.5,y-2.5,z+4],[x+5.5,y-2.5,z+15]],false)}" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>`
    + hullInk([...a,...b,...c,...d],1.2);
}
function bottle(x,y,z,col){
  const m=matOf(col), cap=matOf(mix(col,'#000000',.25));
  const r0=zRing(x,y,z,6), r1=zRing(x,y,z+15,6), r2=zRing(x,y,z+20,2.6), r3=zRing(x,y,z+23,2.6), r4=zRing(x,y,z+23,3), r5=zRing(x,y,z+26,3);
  return loft(r0,r1,n=>toneI(n,m)) + loft(r1,r2,n=>toneI(n,CLEAR)) + loft(r2,r3,n=>toneI(n,CLEAR))
    + loft(r4,r5,n=>toneI(n,cap)) + fill(pd(r5),cap.l) + ink(pd(r5),.8)
    + ink(pd([[x+6,y-3,z+4],[x+6,y-3,z+12]],false),.5).replace(INK,'#ffffff')
    + hullInk([...r0,...r1,...r2,...r3],1.2) + ink(sp(hull([...r4,...r5].map(p=>P(...p)))),.9);
}
function snack(x,y,z,col){
  const m=matOf(col);
  return boxV(x-3.5,y-7,z,x+3.5,y+7,z+21,m,toneI,1.1)
    + shape(on(PX(x+3.6),rectUV(y-5.5,z+7,y+5.5,z+13)),'#fbf7ea',.8);
}
const ITEM = { can, bottle, snack };
// the same products lying in the pickup tray
function lying(kind,col){
  const m=matOf(col), x=W-9;
  if (kind === 'snack') return boxV(W-15,60,14,W-4,82,18,m,toneI,1.1);
  const r = kind==='can' ? 6.5 : 6, y0 = kind==='can' ? 66 : 60, y1 = kind==='can' ? 86 : 88, z = 14+r;
  const A=on(PY(y0),ellUV(x,z,r,r)), B=on(PY(y1),ellUV(x,z,r,r));
  const capM = kind==='can' ? METAL : matOf(mix(col,'#000000',.25));
  const [E, n] = facing([0,1,0]) ? [B,[0,1,0]] : [A,[0,-1,0]];       // the end cap toward the viewer
  return loft(A,B,n=>toneI(n,m)) + fill(pd(E),toneI(n,capM)) + ink(pd(E),1) + hullInk([...A,...B],1.2);
}


/* ---------- state ---------- */
const st = { pal:'tomato', jam:false, credit:0, returned:0, sel:'', msg:'', drop:null, tray:null, press:null, flap:0, flapTarget:0,
             stock: ROWS.map(() => COL_Y.map(() => 3)) };


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

/* ---------- see-through: what is inside a vending machine ---------- */
const STEELD = { l:'#c9cfd2', m:'#a7b0b3', d:'#7f878a' }, PCB = { l:'#4fb06a', m:'#2f8a4a', d:'#1e5a30' };
// the products and shelves on their own, whole (not clipped to the window), for the see-through view
// an item caught on the end of its coil tips forward over the shelf edge: rotated on screen about the edge, toward
// wherever +x (out of the machine) points in the current view
function vendHang(svg, y, z){
  if (!st.drop || !st.drop.hang) return svg;
  const [px, py] = P(SHELF_X, y, z), [fx, fy] = P(SHELF_X + 1, y, z), [ux, uy] = P(SHELF_X, y, z + 1);
  const a = 28 * Math.sign((ux - px)*(fy - py) - (uy - py)*(fx - px));
  return `<g transform="rotate(${f(a)} ${f(px)} ${f(py)})">${svg}</g>`;
}
function vendStock(){
  let it = '';
  for (let r = ROWS.length-1; r >= 0; r--){
    const row = ROWS[r], z = row.s;
    it += shape([[SHELF_X0,PART_Y+1.5,z],[SHELF_X,PART_Y+1.5,z],[SHELF_X,D-T,z],[SHELF_X0,D-T,z]], '#cfd6d8', 0);
    const items = [];
    COL_Y.forEach((y,c) => { for (let k = st.stock[r][c]-1; k >= 0; k--) items.push({ x:ITEM_X-k*ITEM_STEP, y, c }); });
    items.sort((a,b) => depthOf([a.x,a.y,0]) - depthOf([b.x,b.y,0]));
    // spirals: a wire coil along each column; its far half behind the products, its near half in front
    const coils = COL_Y.map(y => helix(y, z));
    it += coils.map(c => c.far).join('');
    for (const o of items) it += ITEM[row.kind](o.x,o.y,z,row.cols[o.c]);
    it += coils.map(c => c.near).join('');
    it += shape([[SHELF_X,PART_Y+1.5,z-3],[SHELF_X,D-T,z-3],[SHELF_X,D-T,z],[SHELF_X,PART_Y+1.5,z]], '#a9b1b4', 1);
  }
  // the item pushed off the shelf drops down the gap in front of the shelves and lands in the pickup bin (its floor at
  // z 16), never further: in see-through nothing clips it, so a free fall would go through the floor and the front
  if (st.drop){ const { r, c } = st.drop, t = st.drop.t, row = ROWS[r];
    const slide = Math.min(1, t/.25) * 10, u = t > .25 ? Math.pow((t-.25)/.75, 2) : 0, fall = (row.s - 17) * u ;
    const binY = Math.max(TRAY[0] + 8, Math.min(TRAY[2] - 8, COL_Y[c]));
    it += vendHang(ITEM[row.kind](ITEM_X + slide + 4*u, COL_Y[c] + (binY - COL_Y[c])*u, row.s - fall, row.cols[c]), COL_Y[c], row.s); }
  return it;
}
function helix(y, z){
  const R = 7.5, z0 = z + R + .5, x0 = 18, x1 = SHELF_X - 2, turns = 5, n = turns*16;
  let far = '', near = '', run = [], side = null;
  const flush = () => { if (run.length > 1){ const d = pd(run, false), seg = `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:1.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${STEELD.l}" style="stroke-width:.6" stroke-linecap="round"/>`; if (side) near += seg; else far += seg; } };
  for (let i = 0; i <= n; i++){ const t = i/n, a = t*turns*2*Math.PI, p = [x0 + (x1-x0)*t, y + R*Math.cos(a), z0 + R*Math.sin(a)];
    const s = (Math.cos(a)*CAM_V[1] + Math.sin(a)*CAM_V[2]) > 0;   // this bit of wire is on the viewer's side of the coil
    if (side === null) side = s;
    if (s !== side){ run.push(p); flush(); run = [p]; side = s; } else run.push(p); }
  flush();
  return { far, near };
}
let MECH_LABELS = '';
/* ---------- see-through: how a real spiral vending machine works ----------
   Parts (each held by another; cables, coins and refrigerant each run port to port):
   CABINET partition between the product cabinet and the service column . shelf side rails
   VEND    16 spiral gearmotors on the motor tray at the back of each shelf . a coupling into each spiral . a home switch on
           each motor . the spirals and products (vendStock) . drop sensor: emitter and receiver bars over the pickup bin
   COINS   coin validator behind the slot . three change tubes . cash box . coin return chute and payout chute to the cup
   CONTROL control board behind the keypad . display module behind the screen . keypad board . power supply . harness:
           trunk down the back corner with a branch along each motor tray, over the partition to the board, and to the coin
           mech, display, keypad, drop sensor and power supply
   COLD    compressor . condenser coil on the back wall . condenser fan . copper lines up the back corner . evaporator coil
           and its fan at the top back of the cabinet . thermostat probe . LED strip behind the top of the window */
const VCOP = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, VGM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' };
const PART_Y = 36, SHELF_X0 = 16, MZ = 3.5;                              // partition; shelves start behind the spirals
const vBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - 1), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + 1)];
const vBend = (pts, r = 4) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a cable or line as short depth-sortable pieces, terminal dots on its ends
const vLine = (pts, col, w = .7, ends = true) => { const q = vBend(pts), out = [], L = 14;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const e of [i === 0 && ends ? q[0] : null, j === q.length - 1 && ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.3" fill="${INK}"/>`; }
    out.push({ box: vBoxOf(seg), svg }); i = j; }
  return out; };
function vendMech(k){
  const now = performance.now(), coinOn = now - (st.coinFx || -1e9) < 900, vending = !!st.drop, t = now/1000;
  const parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const glass = (pts, c = '#e9eef0', o = .3) => `<g opacity="${o}">${fill(pd(pts), c)}</g>` + ink(pd(pts), .6);
  const H_ = '#3a3632', ON = '#ffb347';
  // ---- partition between the product cabinet and the service column
  put([[T, PART_Y, 44], [W - 4, PART_Y + 1.5, H - T]], glass([[T, PART_Y + .75, 44], [W - 4, PART_Y + .75, 44], [W - 4, PART_Y + .75, H - T], [T, PART_Y + .75, H - T]], '#dfe3e2', .35));
  // ---- vend: a gearmotor behind every spiral (on the motor tray), coupling, home switch; side rails under each shelf
  ROWS.forEach((row, r) => {
    for (const [y0, y1] of [[PART_Y + 1.5, PART_Y + 3], [D - T - 1.5, D - T]]) bx(SHELF_X0, y0, row.s - 3, SHELF_X, y1, row.s - 1, STEELD, .6);
    bx(T, PART_Y + 1.5, row.s - 1, SHELF_X0, D - T, row.s, VGM, .6);                                    // motor tray
    COL_Y.forEach((y, c) => { const on = vending && !st.drop.hang && st.drop.r === r && st.drop.c === c, az = row.s + 8;
      bx(T + 1, y - 4, az - 4.5, T + 9, y + 4, az + 4.5, on ? matOf('#ff9a3a') : DARK, .8);
      put([[T + 9, y - 1, az - 1], [18, y + 1, az + 1]], rod([T + 9, y, az], [18, y, az], .9, METAL, toneI, .6));
      bx(T + 3, y - 1.5, az + 4.5, T + 6, y + 1.5, az + 6, matOf('#d8d2c2'), .5); });
  });
  // the products, spirals and shelves as one block (from the motor tray forward to the drop gap)
  put([[SHELF_X0, PART_Y + 1.5, ROWS[ROWS.length - 1].s - 3], [W - 4, D - T, ROWS[0].s + 30]], vendStock());
  // drop sensor over the pickup bin: two bars, a beam between them that breaks as the item falls through
  const tripped = vending && st.drop.t > .55 && st.drop.t < .85;
  bx(SHELF_X + 1, PART_Y + 3, 44, W - 3, PART_Y + 6, 47, DARK, .6);
  bx(SHELF_X + 1, D - T - 3, 44, W - 3, D - T, 47, DARK, .6);
  let beams = ''; for (const x of [SHELF_X + 2.5, SHELF_X + 4.5, SHELF_X + 6.5]) beams += `<path d="${pd([[x, PART_Y + 6, 45.5], [x, D - T - 3, 45.5]], false)}" stroke="${tripped ? '#ff3a2a' : '#e2483d'}" stroke-width="${tripped ? 1.4 : .7}" stroke-dasharray="2 2" opacity="${tripped ? 1 : .6}"/>`;
  put([[SHELF_X + 1, PART_Y + 6, 45], [W - 3, D - T - 3, 46]], beams);
  // ---- coins: validator behind the slot, change tubes, cash box, return and payout chutes to the cup
  bx(60, 10, 96, 84, 32, 120, coinOn ? matOf('#ffd46a') : STEELD, 1.1);
  put([[64, 12, 68], [80, 30, 96]], [14.5, 21, 27.5].map(y => cyl(72, y, 68, 96, 2.8, matOf('#e9e2c4'), toneI, .9, 14)
    + [...Array(4)].map((_, i) => fill(pd(on(PZ(70 + i*1.2 + .1), ellUV(72, y, 2.5, 2.5, 12).filter(p => facing([p[0] - 72, p[1] - y, 0])))), '#d2ad4a')).join('')).join(''));
  bx(58, 10, 24, 84, 32, 58, DARK, 1.1);
  parts.push(...vLine([[82, 13, 96], [86, 13, 86], [88, 16, 80]], STEELD.l, 1, false));                  // reject -> return cup
  parts.push(...vLine([[72, 21, 67.5], [80, 21, 70], [88, 21, 79]], STEELD.l, 1, false));                // payout -> return cup
  parts.push(...vLine([[62, 14, 96], [62, 14, 58]], STEELD.l, 1, false));                                // full tubes -> cash box
  // ---- control: board, display and keypad modules, power supply
  put([[54, 8, 130], [56.8, 34, 192]], box(54, 8, 130, 56, 34, 192, PCB, toneI, .9)
    + (facing([1,0,0]) ? [[12, 140, 20, 150], [22, 140, 30, 146], [12, 158, 24, 170], [26, 160, 32, 168], [14, 176, 28, 186]].map(([y0, z0, y1, z1]) => box(56, y0, z0, 56.8, y1, z1, DARK, toneI, .5)).join('')
       + fill(pd(on(PX(56.1), ellUV(30, 134, .9, .9, 10))), Math.sin(t*4) > 0 ? '#7dff9a' : '#2a5a36') : ''));
  bx(86, 10, 166, 88.5, 32, 184, VGM, .7);                                                              // display module
  bx(86.5, 11, 126, 88.5, 31, 150, PCB, .7);                                                            // keypad board
  bx(62, 10, 6, 82, 32, 20, METAL, .9);                                                                 // power supply
  if (facing([1,0,0])) put([[82, 12, 8], [82.2, 30, 18]], [...Array(5)].map((_, i) => shape(on(PX(82.05), rrUV(13 + i*3.4, 9, 14.6 + i*3.4, 17, .5)), mix(METAL.d, '#000000', .3), .4)).join(''));
  // harness: a trunk down the back corner by the partition, a branch along each motor tray, over to the board
  const TX = T + 2, TY = PART_Y + 3.5;
  ROWS.forEach((row, r) => { const on = vending && st.drop.r === r;
    parts.push(...vLine([[TX, TY, row.s + 15], [TX, COL_Y[0] + 3, row.s + 15]], on ? ON : H_, .6, false)); });
  parts.push(...vLine([[TX, TY, ROWS[ROWS.length - 1].s + 15], [TX, TY, H - 14], [55, TY - 2, H - 14], [55, 30, 193]], vending ? ON : H_, .8));
  parts.push(...vLine([[56.8, 30, 140], [60, 30, 128], [66, 28, 120]], coinOn ? ON : H_, .55));         // board -> coin mech
  parts.push(...vLine([[56.8, 14, 178], [86, 14, 178]], H_, .5));                                        // board -> display
  parts.push(...vLine([[56.8, 26, 138], [86.5, 26, 138]], H_, .5));                                      // board -> keypad
  parts.push(...vLine([[72, 31, 20], [72, 33, 70], [55, 33, 128]], '#c2300a', .6));                        // power supply -> board
  parts.push(...vLine([[SHELF_X + 3, PART_Y + 3, 45.5], [SHELF_X + 3, PART_Y - 1, 52], [55, 33, 129]], tripped ? ON : H_, .5));   // drop sensor
  // ---- cold: compressor, condenser coil and fan, copper lines up the back corner, evaporator and its fan, thermostat
  put([[12, 78, 4], [30, 96, 22]], cyl(21, 87, 4, 18, 8, DARK, toneI, 1.2, 22) + cyl(21, 87, 18, 21, 5, DARK, toneI, 1, 18));
  let cz = ''; for (let z = 10; z <= 42; z += 4) cz += pd([[T + 1, 40, z], [T + 1, 120, z]], false);
  for (const y of [40, 120]) cz += pd([[T + 1, y, 10], [T + 1, y, 42]], false);
  put([[T, 38, 8], [T + 2, 122, 44]], `<path d="${cz}" fill="none" stroke="${INK}" stroke-width="2.4"/><path d="${cz}" fill="none" stroke="${VCOP.m}" stroke-width="1.2"/>`);
  const fa = t*14;
  let fan = cylX(34, 37, 58, 28, 10, STEELD, toneI, 1, 24);
  for (let i = 0; i < 4; i++){ const a = fa + i*Math.PI/2; fan += ink(pd([[37.1, 58, 28], [37.1, 58 + 8*Math.cos(a), 28 + 8*Math.sin(a)]], false), 1.4); }
  put([[34, 48, 18], [37, 68, 38]], fan);
  parts.push(...vLine([[21, 92, 21], [21, 104, 30], [T + 1, 112, 42]], VCOP.m, .8));                    // compressor -> condenser
  parts.push(...vLine([[T + 1, 121, 44], [T + 3, D - T - 2, 60], [T + 3, D - T - 2, 200], [T + 6, 118, 206]], VCOP.m, .8));   // liquid line up to the evaporator
  parts.push(...vLine([[T + 8, 116, 206], [T + 7, D - T - 4, 196], [T + 7, D - T - 4, 60], [16, 96, 21]], VCOP.l, 1.1));     // suction line back down
  let ev = box(T + 1, 40, 200, T + 9, 120, 222, STEELD, toneI, .9);
  if (facing([1,0,0])) for (let y = 43; y < 120; y += 3) ev += line([[T + 9.05, y, 201], [T + 9.05, y, 221]], .35);
  put([[T + 1, 40, 200], [T + 9, 120, 222]], ev);
  let ef = cylX(T + 9, T + 12, 80, 211, 8, STEELD, toneI, .9, 22);
  for (let i = 0; i < 4; i++){ const a = fa*1.4 + i*Math.PI/2; ef += ink(pd([[T + 12.1, 80, 211], [T + 12.1, 80 + 6.5*Math.cos(a), 211 + 6.5*Math.sin(a)]], false), 1.2); }
  put([[T + 9, 72, 203], [T + 12, 88, 219]], ef);
  bx(T + 9, 100, 196, T + 12, 104, 199, matOf('#d8d2c2'), .5);                                           // thermostat probe
  bx(W - 4, 42, 197, W - 2, 120, 199, { l:'#fffbe8', m:'#fff1c2', d:'#e8d79a' }, .6);                    // LED strip
  const s = byDepth(parts);
  MECH_LABELS = k <= .6 ? '' : xrCallouts([
    { at: [40, COL_Y[0], ROWS[0].s + 15], text: 'SPIRALS', on: vending && !st.drop.hang },
    { at: [T + 9, COL_Y[3], ROWS[1].s + 8], text: 'SPIRAL MOTORS', on: vending && !st.drop.hang },
    { at: [W - 3, D - T - 2, 47], text: 'DROP SENSOR', on: tripped || (vending && st.drop.hang) },
    { at: [84, 21, 112], text: 'COIN MECH', on: coinOn },
    { at: [72, 27.5, 80], text: 'CHANGE TUBES', on: coinOn },
    { at: [84, 21, 40], text: 'CASH BOX', on: false },
    { at: [56, 21, 170], text: 'CONTROL BOARD', on: vending || coinOn },
    { at: [82, 21, 14], text: 'POWER SUPPLY', on: false },
    { at: [T + 9, 60, 222], text: 'EVAPORATOR', on: true },
    { at: [21, 95, 12], text: 'COMPRESSOR', on: true },
    { at: [T + 2, 110, 30], text: 'CONDENSER', on: true } ], [0, W, 0, D, 0, H]);
  return s;
}
function vendSurface(FF, BF){
  const L = [];
  if (FF) L.push({ at:[W+.4, 21, 175], text:'SCREEN', on: !!st.credit }, { at:[W+.5, 21, 136], text:'KEYPAD', on: !!st.press },
                 { at:[W+.5, 21, 106], text:'COIN SLOT', on: false }, { at:[W+.5, 21, 92], text:'RETURN', on: false },
                 { at:[W, 81, 29], text:'PICKUP DOOR', on: !!st.tray }, { at:[W, 81, 130], text:'WINDOW', on: false });
  if (BF) L.push({ at:[0, 30, 30], text:'POWER CORD', on: false });
  return L;
}
const vendCaption = st => st.drop ? 'Vend: the gearmotor behind that column turns its spiral one turn, until its home switch clicks, and the front item is pushed off the shelf. It falls through the drop sensor’s beams, which tells the board it really came out.'
  : st.credit > 0 ? 'Credit: the coin mechanism checked the coin and dropped it into a change tube (full tubes overflow into the cash box). Press a letter and a number to choose.'
  : 'Cooling: the compressor pumps refrigerant through the condenser on the back wall (its fan carries the heat away) and up to the evaporator at the top, which chills the air its fan blows over the drinks. Insert a coin to start.';

/* ---------- coins in the return cup ---------- */
const COIN = { l:'#f0d27a', m:'#d2ad4a', d:'#9a7a2a' };
const COIN_SPOTS = [[-3.4,21],[-4.6,16.5],[-4.2,25.6],[-2.2,17.8],[-2.4,24.4],[-5.6,20.8]];
function coins(n){
  const pts = [];
  for (let i=0; i<Math.min(n,18); i++){ const [dx,y] = COIN_SPOTS[i % 6]; pts.push([W+dx, y, CUP[1] + .1 + Math.floor(i/6)*1.1]); }
  pts.sort((a,b) => (a[2]-b[2]) || (depthOf([a[0],a[1],0])-depthOf([b[0],b[1],0])));
  let s = '';
  for (const [x,y,z] of pts){
    const A = on(PZ(z), ellUV(x,y,2.6,2.6,16)), B = on(PZ(z+.9), ellUV(x,y,2.6,2.6,16));
    s += loft(A,B,n=>toneI(n,COIN)) + fill(pd(B),COIN.l) + ink(sp(hull([...A,...B].map(p=>P(...p)))),.7) + ink(pd(on(PZ(z+.95),ellUV(x,y,1.5,1.5,12))),.4);
  }
  return s;
}

/* ---------- pickup door: a slab hinged along its bottom edge, drops open toward the viewer ---------- */
const DOOR_MAT = { l:'#55504a', m:'#3d3935', d:'#272421' };   // smoked acrylic: faces see-through, edges solid
const DOOR_MAX = 84;                           // degrees when fully open (almost flat)
function pickupDoor(){
  const th = ease(st.flap) * DOOR_MAX * Math.PI/180;
  const y0 = TRAY[0]+1, y1 = TRAY[2]-1, len = TRAY[3]-TRAY[1]-1.5, t = 2, hx = W-.5, hz = TRAY[1];
  const up = [Math.sin(th),0,Math.cos(th)], out = [Math.cos(th),0,-Math.sin(th)];   // along the door (hinge -> top edge), outward normal
  const Q = (sAlong, w, y) => [hx + sAlong*up[0] - w*out[0], y, hz + sAlong*up[2] - w*out[2]];
  const faces = [
    { n: out,            p: [Q(0,0,y0),Q(0,0,y1),Q(len,0,y1),Q(len,0,y0)], clear: true },
    { n: out.map(v=>-v), p: [Q(0,t,y0),Q(0,t,y1),Q(len,t,y1),Q(len,t,y0)], clear: true },
    { n: up,             p: [Q(len,0,y0),Q(len,0,y1),Q(len,t,y1),Q(len,t,y0)] },
    { n: up.map(v=>-v),  p: [Q(0,0,y0),Q(0,0,y1),Q(0,t,y1),Q(0,t,y0)] },
    { n: [0,1,0],        p: [Q(0,0,y1),Q(len,0,y1),Q(len,t,y1),Q(0,t,y1)] },
    { n: [0,-1,0],       p: [Q(0,0,y0),Q(len,0,y0),Q(len,t,y0),Q(0,t,y0)] },   // the other end edge (seen from the right side)
  ];
  let s = '';
  for (const fc of faces) if (vis(fc.n))
    s += fc.clear ? fill(pd(fc.p), tone(fc.n, DOOR_MAT), 'fill-opacity=".34"') + ink(pd(fc.p),1.1) : shape(fc.p, tone(fc.n, DOOR_MAT), 1.1);
  if (vis(out)){
    s += fill(pd([Q(len*.15,-.1,y0+10),Q(len*.15,-.1,y0+18),Q(len*.85,-.1,y0+34),Q(len*.85,-.1,y0+26)]), '#ffffff', 'opacity=".28"');   // glint
    const yc = (y0+y1)/2;
    s += shape([Q(len-3.2,-.1,yc-16),Q(len-3.2,-.1,yc+16),Q(len-1.3,-.1,yc+16),Q(len-1.3,-.1,yc-16)], DOOR_MAT.d, .9);   // finger grip
    const o = P(...Q(len*.66,-.15,yc));
    s += `<text transform="${txM(o, Dv(0,-1,0), Dv(-up[0],0,-up[2]))}" font-size="4.6" fill="#e9e3d3" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" letter-spacing=".25em">PULL</text>`;
  }
  s += ink(pd([[hx,y0-1,hz],[hx,y1+1,hz]],false),1.8);   // hinge
  return `<g data-act="flap">${s}</g>`;
}

/* ---------- scene ---------- */
const OUT = rrUV(0,0,D,H,R), IN = rrUV(T,T,D-T,H-T,R-T);
const money = v => '$' + v.toFixed(2);

function screenLines(){
  if (st.msg) return st.msg.split('|');
  if (st.drop) return st.drop.hang ? ['NO DROP', st.drop.code] : ['VENDING', st.drop.code];
  if (st.tray) return ['TAKE', 'ITEM'];
  if (st.sel) return ['SELECT', st.sel + '_'];
  return st.credit > 0 ? ['CREDIT', money(st.credit)] : ['INSERT', 'COIN'];
}

function scene(){
  const m = PALS[st.pal];
  // which faces of the cabinet are toward the viewer in the current turn
  const FF = facing([1,0,0]), BF = facing([-1,0,0]), LF = facing([0,1,0]), RF = facing([0,-1,0]);
  let s = '';

  // cast shadow
  s += castShadow([...on(PX(0),OUT), ...on(PX(W),OUT)]);

  // parts on hidden faces that stick out past the body go first, so the body covers them
  if (!FF) s += pickupDoor();
  if (!BF) s += powerCord();

  // front: openings, front face, everything mounted on it (only when the front is toward the viewer)
  let body = FF ? frontAssembly(m) : '';

  // outer shell + side details
  body += loft(on(PX(0),OUT), on(PX(W),OUT), n=>tone(n,m));
  if (LF) body += leftSide(m);
  if (RF) body += rightSide(m);
  if (BF) body += backPanel(m);

  // silhouette
  if (FF) body += ink(pd(on(PX(W),OUT)),2.2);
  if (BF) body += ink(pd(on(PX(0),OUT)),2.2);
  body += hullInk([...on(PX(0),OUT), ...on(PX(W),OUT)], 2.8);
  // see-through: the working parts inside, behind a ghost of the case
  const k = ease(st.xr || 0);
  s += k > 0 ? xrGhost(body, vendMech(k), k, OUT, 0, W, m) : body;
  if (BF) s += powerCord();            // the cord lies on the viewer's side of the back panel
  s += k > .6 ? MECH_LABELS : xrCallouts(vendSurface(FF, BF), [0, W, 0, D, 0, H]);
  return s;
}

function frontAssembly(m){
  let s = '';
  const LW = facing([0,1,0]);          // which side wall of an opening we look at: y0-wall (view 0) or y1-wall (view 3)
  const win = rectUV(WIN[0],WIN[1],WIN[2],WIN[3]), tray = rectUV(TRAY[0],TRAY[1],TRAY[2],TRAY[3]);
  s += `<clipPath id="cWin"><path d="${pd(on(PX(W),win))}"/></clipPath><clipPath id="cTray"><path d="${pd(on(PX(W),tray))}"/></clipPath>`;

  // interior behind the glass: lit cabinet, shelves bottom-up, products back-to-front
  let it = fill(pd(on(PX(T),IN)), '#e8eef0');
  it += loft(on(PX(T),IN), on(PX(W-3),IN), n => n[2]>.7 ? '#d3dbde' : '#dfe7e9', true);
  it += fill(pd(on(PY(LW ? T+.2 : D-T-.2),rectUV(T+10,60,W-10,206))), '#ffffff', 'opacity=".8"');   // light strip on the visible side wall
  for (let r = ROWS.length-1; r >= 0; r--){
    const row = ROWS[r], z = row.s;
    it += shape([[T,T,z],[SHELF_X,T,z],[SHELF_X,D-T,z],[T,D-T,z]], '#cfd6d8', 0);
    const items = [];
    COL_Y.forEach((y,c) => { for (let k = st.stock[r][c]-1; k >= 0; k--) items.push({ x:ITEM_X-k*ITEM_STEP, y, c }); });
    items.sort((a,b) => depthOf([a.x,a.y,0]) - depthOf([b.x,b.y,0]));
    for (const o of items) it += `<g data-act="item" data-r="${r}" data-c="${o.c}">${ITEM[row.kind](o.x,o.y,z,row.cols[o.c])}</g>`;
    it += shape([[SHELF_X,T,z-3],[SHELF_X,D-T,z-3],[SHELF_X,D-T,z],[SHELF_X,T,z]], '#a9b1b4', 1);
    COL_Y.forEach((y,c) => {
      it += shape(on(PX(SHELF_X+.2),rectUV(y-5,z-2.7,y+5,z-.3)), st.stock[r][c] ? '#fffdf5' : '#f3c6bd', .6);
      it += tx(SHELF_X+.3, y, z-.9, row.code+(c+1), 2.1, INK);
    });
  }
  if (st.drop){
    const { r, c } = st.drop, t = st.drop.t, row = ROWS[r];
    const slide = Math.min(1, t/.25) * 10, fall = (t > .25 ? 260*Math.pow((t-.25)/.75, 2) : 0) ;
    it += vendHang(ITEM[row.kind](ITEM_X+slide, COL_Y[c], row.s-fall, row.cols[c]), COL_Y[c], row.s);
  }
  s += `<g clip-path="url(#cWin)">${it}</g>`;

  // glass: tint, streaks, window reveal
  const GX = PX(W-2.9), wy = LW ? WIN[0] : WIN[2];
  s += `<g pointer-events="none">${fill(pd(on(GX,win)),'#cfe9f0','opacity=".2"')}`
     + fill(pd(on(GX,[[52,62],[66,62],[102,196],[88,196]])),'#ffffff','opacity=".38"')
     + fill(pd(on(GX,[[72,62],[77,62],[113,196],[108,196]])),'#ffffff','opacity=".38"') + `</g>`;
  s += face(pd([[W-3,wy,WIN[1]],[W,wy,WIN[1]],[W,wy,WIN[3]],[W-3,wy,WIN[3]]]), tone([0,LW?1:-1,0],m));
  s += face(pd([[W-3,WIN[0],WIN[1]],[W,WIN[0],WIN[1]],[W,WIN[2],WIN[1]],[W-3,WIN[2],WIN[1]]]), tone([0,0,1],m));

  // pickup tray: dark cavity + product (the door is drawn after the front face)
  const tb = W-18, ty = LW ? TRAY[0] : TRAY[2];
  let tr = shape(on(PX(tb),rectUV(TRAY[0],14,TRAY[2],TRAY[3])), m.d, 0);
  tr += face(pd([[tb,ty,14],[W,ty,14],[W,ty,TRAY[3]],[tb,ty,TRAY[3]]]), mix(m.d,'#000000',.25));
  tr += face(pd([[tb,TRAY[0],14],[W,TRAY[0],14],[W,TRAY[2],14],[tb,TRAY[2],14]]), mix(m.d,'#ffffff',.12));
  if (st.tray) tr += lying(st.tray.kind, st.tray.col);
  s += `<g clip-path="url(#cTray)" data-act="tray">${fill(pd(on(PX(W),tray)),'transparent')}${tr}</g>`;

  // coin-return cup: small cavity with the refunded coins lying in it
  const cup = rectUV(CUP[0],CUP[1],CUP[2],CUP[3]), cb = W-8, cy = LW ? CUP[0] : CUP[2];
  s += `<clipPath id="cCup"><path d="${pd(on(PX(W),cup))}"/></clipPath>`;
  let cp = shape(on(PX(cb),cup), mix(METAL.d,'#000000',.45), 0);
  cp += face(pd([[cb,cy,CUP[1]],[W,cy,CUP[1]],[W,cy,CUP[3]],[cb,cy,CUP[3]]]), mix(METAL.d,'#000000',.3));
  cp += face(pd([[cb,CUP[0],CUP[1]],[W,CUP[0],CUP[1]],[W,CUP[2],CUP[1]],[cb,CUP[2],CUP[1]]]), METAL.m);
  cp += coins(Math.round(st.returned / .5));
  s += `<g clip-path="url(#cCup)" data-act="cup">${fill(pd(on(PX(W),cup)),'transparent')}${cp}</g>`;

  // front face with its openings
  const X = PX(W);
  s += `<path d="${pd(on(X,OUT))}${pd(on(X,win))}${pd(on(X,tray))}${pd(on(X,cup))}" fill="${tone([1,0,0],m)}" fill-rule="evenodd"/>`;
  s += ink(pd(on(X,win)),1.8) + ink(pd(on(X,tray)),1.6) + ink(pd(on(X,cup)),1.4);
  s += shape(on(PX(W+.3),rrUV(10,62,32,82,3)), 'none', 1);   // metal bezel line
  s += ink(pd([[W,36,8],[W,36,200]],false),1) + ink(pd([[W,36,200],[W,124,200]],false),1);
  s += pickupDoor();

  // header sign
  const F = PX(W+.3);
  s += shape(on(F,rrUV(8,204,122,224,4)), '#fff4d6', 1.4);
  s += tx(W+.4, 65, 211, 'DRINKS · SNACKS', 8.4, m.d, 800);

  // control column: screen, keypad, coin slot, return
  s += shape(on(F,rrUV(9,164,33,186,2.5)), '#1d2a26', 1.3);
  const [l1,l2] = screenLines();
  s += tx(W+.4, 21, 177.5, l1, 3.9, '#8af0ae', 700) + tx(W+.4, 21, 169.5, l2, 3.9, '#8af0ae', 700);
  const keys = [];
  ['A','B','C','D'].forEach((k,i) => keys.push({ k, y:26.5, z:152-i*11 }));
  ['1','2','3','4'].forEach((k,i) => keys.push({ k, y:15.5, z:152-i*11 }));
  for (const key of keys){
    const down = st.press === key.k;
    let b = shape(on(F,rrUV(key.y-4.6,key.z,key.y+4.6,key.z+8,2)), down ? METAL.d : METAL.l, 1.1);
    b += tx(W+.5, key.y, key.z+2.4, key.k, 4.4, INK, 700);
    s += `<g data-act="key" data-k="${key.k}">${b}</g>`;
  }
  s += `<g data-act="coin">${shape(on(F,rrUV(11,100,31,112,2.5)), METAL.m, 1.2)}${shape(on(PX(W+.5),rrUV(20,102,22.4,110,1)), '#26231f', .6)}${tx(W+.5, 26.5, 103.5, '¢', 4, INK)}</g>`;
  s += `<g data-act="ret">${shape(on(F,ellUV(21,92,3.6,3.6)), METAL.l, 1.1)}${tx(W+.5, 21, 90.6, '↩', 3.6, INK)}</g>`;
  return s;
}

// a lighter take on the body palette for the side decals
const decalPal = m => ({ l:mix(m.l,'#ffffff',.15), m:mix(m.m,'#ffffff',.12), d:mix(m.d,'#ffffff',.1) });
// decal lettering takes the face colour; on a sunlit face that would vanish into the lighter panel, so go a step darker
const decalInk = (n,m) => { const c = tone(n,m); return c === m.l ? mix(m.m,'#000000',.12) : c; };

// +y side (viewer-left in the front view): low vents and the COLD decal
function leftSide(m){
  let s = '', v = '';
  for (const z of [14,19,24,29]) v += pd([[18,D+.2,z],[W-18,D+.2,z]],false);
  s += `<path d="${v}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`;
  s += shape(on(PY(D+.2),rrUV(20,150,W-20,200,6)), tone([0,1,0],decalPal(m)), 1.2);
  s += `<text transform="${txM(P(W/2,D+.3,170), Dv(1,0,0), Dv(0,0,-1))}" font-size="12" fill="${decalInk([0,1,0],m)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">COLD</text>`;
  return s;
}

// −y side: matching vents, a SNACKS decal, a round 24h badge and an asset tag
function rightSide(m){
  const n = [0,-1,0], Y = PY(-.2);
  let s = '', v = '';
  for (const z of [14,19,24,29]) v += pd([[18,-.2,z],[W-18,-.2,z]],false);
  s += `<path d="${v}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`;
  s += shape(on(Y,rrUV(20,150,W-20,200,6)), tone(n,decalPal(m)), 1.2);
  s += `<text transform="${txM(P(W/2,-.3,170), Dv(-1,0,0), Dv(0,0,-1))}" font-size="10.5" fill="${decalInk(n,m)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800">SNACKS</text>`;
  s += shape(on(Y,ellUV(W/2,118,11,11,28)), '#fff4d6', 1.2);
  s += ink(pd(on(PY(-.3),ellUV(W/2,118,8.6,8.6,28))), .7);
  s += txRight(W/2, 117.5, '24h', 6.4, m.d, 800) + txRight(W/2, 112.2, 'OPEN', 2.6, m.d, 800);
  s += shape(on(Y,rrUV(58,62,76,71,1)), METAL.l, .9) + txRight(67, 65.4, 'No. 117', 2.6, INK, 700);
  return s;
}

// back (−x): service panel with screws, fan grille, louvre, warning sticker, rating plate, cord grommet
function backPanel(m){
  const n = [-1,0,0], B = PX(-.3), bt = tone(n,m);
  let s = shape(on(PX(0),OUT), bt, 0);
  s += ink(pd(on(B,rrUV(12,16,118,220,4))), 1.1);                                  // service panel seam
  for (const [y,z] of [[17,21],[65,21],[113,21],[17,118],[113,118],[17,215],[65,215],[113,215]])
    s += shape(on(PX(-.4),ellUV(y,z,1.7,1.7,12)), METAL.l, .8) + line([[-.5,y-1.1,z+.5],[-.5,y+1.1,z-.5]], .6);
  // round fan grille near the top (the compressor exhausts here)
  const fc = [65,176];
  s += shape(on(B,ellUV(...fc,23,23,32)), mix(m.d,'#000000',.35), 1.4);
  let g = '';
  for (const r of [19,14.5,10]) g += pd(on(PX(-.5),ellUV(...fc,r,r,32)));
  for (const a of [45,135,225,315]){ const c = Math.cos(a*Math.PI/180), d = Math.sin(a*Math.PI/180);
    g += pd([[-.5,fc[0]+5*c,fc[1]+5*d],[-.5,fc[0]+22*c,fc[1]+22*d]],false); }
  s += `<path d="${g}" fill="none" stroke="${METAL.m}" stroke-width="1.3" stroke-linecap="round"/>`;
  s += shape(on(PX(-.6),ellUV(...fc,4.4,4.4,16)), METAL.l, .9);
  // louvred intake low down
  s += shape(on(B,rectUV(28,36,102,66)), mix(m.d,'#000000',.35), 0);
  for (let z = 39; z < 64; z += 5) s += shape(on(PX(-.4),rectUV(29,z,101,z+2.4)), mix(bt,'#ffffff',.06), .6);
  s += ink(pd(on(B,rectUV(28,36,102,66))), 1.2);
  // warning sticker + rating plate
  s += shape(on(PX(-.4),rrUV(20,112,72,142,2)), '#f6d64a', 1);
  s += ink(pd(on(PX(-.45),rrUV(22,114,70,140,1.4))), .6);
  s += txBack(46, 131.2, 'KEEP 10 cm', 4.4, INK, 800) + txBack(46, 124.6, 'FROM WALL', 4.4, INK, 800) + txBack(46, 118.2, '↔ VENTILATION', 2.5, INK, 700);
  s += shape(on(PX(-.4),rrUV(80,110,114,142,1.5)), METAL.l, .9);
  s += txBack(97, 135.5, 'CF-01 VENDO', 3.1, INK, 800) + txBack(97, 129.5, 'SN 0423-1187', 2.4, INK, 700)
     + txBack(97, 124.5, '230V~ 50Hz', 2.4, INK, 700) + txBack(97, 119.5, '4.2 A · R600a', 2.4, INK, 700)
     + line([[-.45,82,127.8],[-.45,112,127.8]], .4);
  // cord grommet
  s += shape(on(PX(-.4),ellUV(92,30,3.4,3.4,14)), DARK.m, .9);
  return s;
}

// mains cable: out of the grommet on the back, down to the floor, plug lying on the ground behind the machine
function powerCord(){
  const path = [[-.5,92,30],[-2.6,92,29],[-3.8,92,26],[-4,92,8],[-4.6,91.6,2.4],[-6.5,90.6,.9],[-11,88.6,.9],[-17,85.4,.9],[-22,82,.9],[-25,80,.9]];
  const d = pd(path,false);
  let s = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>`
        + `<path d="${d}" fill="none" stroke="${DARK.l}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += boxV(-26.5,77.5,0,-25,82.5,3.4,DARK,toneI,.8);                 // strain relief
  s += boxV(-34,76,0,-26.5,84,5.6,DARK,toneI,1);                      // plug body
  for (const y of [78.2,81.8]) s += line([[-34,y,2.8],[-38.5,y,2.8]], 1.6) + `<path d="${pd([[-34,y,2.8],[-38.5,y,2.8]],false)}" stroke="${METAL.l}" stroke-width=".6" stroke-linecap="round"/>`;
  return s;
}


/* ---------- behaviour ---------- */
let ui;
const render = () => ui.render();
const readoutText = st => st.drop ? `Vending ${st.drop.code}…` : st.tray ? (st.flap === 1 ? `${st.tray.code} is in the tray — click it to collect` : `${st.tray.code} is in the tray — open the pickup door`)
    : st.returned > 0 ? `${money(st.returned)} in the coin return — click the cup to collect`
    : st.credit > 0 ? 'Choose a drink — keypad, the glass, or step 2' : 'Insert coins to start';
let msgTimer = 0, pressTimer = 0;
const flash = (text, ms=1400) => { st.msg = text; clearTimeout(msgTimer); msgTimer = setTimeout(() => { st.msg=''; render(); }, ms); render(); };
const press = k => { st.press = k; clearTimeout(pressTimer); pressTimer = setTimeout(() => { st.press=null; render(); }, 160); };

function vend(r, c){
  const row = ROWS[r], code = row.code + (c+1);
  if (st.drop) return st.drop.hang ? ui.flash('Something is stuck: shake the machine first') : undefined;
  if (st.tray) return flash('TAKE|ITEM');
  if (!st.stock[r][c]) return flash('SOLD|OUT');
  if (st.credit < row.price - 1e-9) return flash('INSERT|' + money(row.price - st.credit));
  st.credit -= row.price; st.stock[r][c]--; st.sel = '';
  const d = st.drop = { r, c, code, t:0, jam: st.jam || Math.random() < 1/3, hang: false };
  let last = performance.now();
  const step = now => {
    const dt = (now-last)/1000; last = now;
    if (d.hang){ render(); requestAnimationFrame(step); return; }
    d.t = Math.min(1, d.t + dt/1.1);
    if (d.jam && d.t >= .2){ d.t = .2; d.jam = false; d.hang = true;
      ui.flash('It caught on the spiral: the drop sensor saw nothing fall. Shake the machine', 2600); }
    if (st.drop.t >= 1){ st.tray = { kind:row.kind, col:row.cols[c], code }; st.drop = null; render(); return; }
    render(); requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function key(k){
  press(k);
  if (/[A-D]/.test(k)){ st.sel = k; render(); return; }
  if (!st.sel){ flash('PICK|A–D'); return; }
  const r = 'ABCD'.indexOf(st.sel); st.sel = ''; vend(r, +k-1); render();
}
const coin = () => { if (st.credit >= 5) return flash('MAX|$5.00'); st.credit += .5; st.coinFx = performance.now(); render(); setTimeout(render, 950); };
const refund = () => {
  st.sel = '';
  if (st.credit <= 0) return render();
  st.returned += st.credit; st.credit = 0; flash('COINS|BELOW');
};
const takeCoins = () => { if (st.returned <= 0) return; const amt = st.returned; st.returned = 0; flash('THANK|YOU'); ui.flash(`Collected ${money(amt)}`); };
let flapTimer = 0;
function swing(target){
  clearTimeout(flapTimer);
  if (st.flapTarget === target) return;
  st.flapTarget = target;
  let last = performance.now();
  const step = now => {
    const sg = Math.sign(st.flapTarget - st.flap); if (!sg) return;
    st.flap += sg * (now-last)/1000/.55; last = now;
    if ((st.flapTarget - st.flap)*sg <= 0) st.flap = st.flapTarget;
    render(); if (st.flap !== st.flapTarget) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const toggleFlap = () => swing(st.flapTarget ? 0 : 1);
// shake: the cabinet rocks on its front-bottom edge for a moment; an item caught on its coil shakes loose halfway and
// carries on falling (through the drop sensor, into the bin)
let shaking = false;
function shake(){
  if (shaking) return; shaking = true;
  const art = document.getElementById('art'), t0 = performance.now(), d = st.drop, loose = d && d.hang;
  if (!loose) ui.flash(st.drop ? 'Shaking…' : 'Nothing is stuck');
  const step = now => { const t = (now - t0)/900, [px, py] = P(W, D/2, 0);
    if (t >= 1){ art.removeAttribute('transform'); shaking = false; return; }
    art.setAttribute('transform', `rotate(${f(3.2*Math.sin(t*Math.PI*7)*(1 - t))} ${f(px)} ${f(py)})`);
    if (loose && t > .45 && d.hang){ d.hang = false; ui.flash('Shaken loose!'); }
    requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const collect = () => {
  if (!st.tray || st.flap < 1) return;
  const code = st.tray.code; st.tray = null; flash('ENJOY|' + code);
  flapTimer = setTimeout(() => swing(0), 900);          // door falls shut on its own
};


ui = mountFigure({
  fig:'03', title:'Vending machine', hint:'insert a coin, punch a code or tap a product',
  idea:"The machine counts your coins; when there is enough, it pushes your drink off the shelf and it drops into the tray.",
  size:[W,D,H], palette:'tomato', state:st, views:true, turn:'full',
  scene: () => scene(),
  readout: readoutText,
  stats: st => [ { label:'Credit', value: money(st.credit) }, st.returned > 0 && { label:'Change in the cup', value: money(st.returned), small:true } ],
  buttonsLabel:'Machine',
  buttons:[
    { label:'Insert 50¢', onClick: coin },
    { label:'Choose a drink', choices: st => ROWS.flatMap((row,r) => COL_Y.map((_,c) => ({
        label:`${row.code}${c+1} ${money(row.price)}`, disabled: !st.stock[r][c] || st.credit < row.price - 1e-9, onClick: () => vend(r,c) }))) },
    { label:'Open pickup door', onClick: () => { if (st.flapTarget) return ui.flash('The door is already open'); swing(1); } },
    { label:'Take your drink', onClick: () => st.tray ? (st.flap < 1 ? ui.flash('Open the pickup door first') : collect()) : ui.flash('Nothing in the tray yet') },
    { label:'Return change', onClick: refund },
    { label:'Take coins', onClick: () => st.returned > 0 ? takeCoins() : ui.flash('The coin cup is empty') },
    { label:'Shake the machine', onClick: shake },
  ],
  next: st => st.drop || st.flap !== st.flapTarget ? -1 : st.tray ? (st.flap < 1 ? 2 : 3) : st.returned > 0 ? 5
    : ROWS.some((row,r) => row.price <= st.credit + 1e-9 && st.stock[r].some(n => n)) ? 1 : 0,
  acts:{
    key:  (st,a) => key(a.dataset.k),
    item: (st,a) => vend(+a.dataset.r, +a.dataset.c),
    coin, ret: refund, tray: collect, flap: toggleFlap, cup: takeCoins,
  },
  params:(st,q) => {
    if (q.get('jam') === '1') st.jam = true;
    if (q.has('credit')) st.credit = +q.get('credit');
    if (q.get('flap') === '1') st.flap = st.flapTarget = 1;
    if (q.has('returned')) st.returned = +q.get('returned');
    const tq = /^([A-D])([1-4])$/.exec(q.get('tray') || '');
    if (tq){ const r = 'ABCD'.indexOf(tq[1]), row = ROWS[r]; st.tray = { kind:row.kind, col:row.cols[+tq[2]-1], code:tq[0] }; }
  },
});
xrMount(() => ui, vendCaption);