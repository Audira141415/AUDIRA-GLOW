/* ---------- geometry (x = depth, y = length, z = up) ---------- */
const W = 90, D = 220, Z0 = 16, ZT = 112, R = 10;      // body: width (depth), length, floor, roof, corner radius
const BY = 50;                                          // box body starts here (cab is y 0..BY)
const CABH = 96, CABRAD = 26;                               // cab roof height, rounded windscreen corner
const HY0 = 76, HY1 = 166, HZ0 = 52, HZ1 = 100;         // serving hatch on the +x face
const HINGE = 110, ALEN = HINGE - HZ0; const AOPEN = 150;     // awning: top hinge, length, open angle (deg)
const LEDGE = 13;                                       // counter ledge sticks out this far
const WZ = 14, WR = 14, AR = 17.5, WHEELS = [28, 184];  // wheel centre height, tyre radius, arch radius, wheel y
const FLOOR = Z0 + 3, YP = BY + 4, WT = 4;              // interior floor, partition wall, wall thickness
const SLOTS = [96, 120, 144];                           // food spots on the counter ledge
const COOK = 2.6;                                       // seconds per order

const CREAM = matOf('#fbf1d8'), TYRE = { l:'#4a4642', m:'#353230', d:'#222020' };
const GLASS = '#a9d2dc', RED = '#e2483d', GREEN = '#43c25c';
const SHELL = matOf('#f3cf6a'), TORT = matOf('#efd9a6'), LETTUCE = '#5cb848', TOMATO = '#e2483d', CHEESE = '#f6b52c', MEAT = '#8a4b2a';
const FOOD = { taco:{ label:'Taco', price:3 }, burrito:{ label:'Burrito', price:7 }, nachos:{ label:'Nachos', price:5 } };
const WALL = { l:'#e9eeee', m:'#d4dcdc', d:'#aeb8b8' };

/* ---------- helpers ---------- */
// rounded rectangle with a radius per corner [bottom-right, top-right, top-left, bottom-left] (u = y, v = z)
function corners(u0,v0,u1,v1,r){
  const c = (cu,cv,rr,a0,a1) => rr > 0 ? arcUV(cu,cv,rr,a0,a1,7) : [[cu,cv]];
  return [...c(u1-r[0],v0+r[0],r[0],-90,0), ...c(u1-r[1],v1-r[1],r[1],0,90), ...c(u0+r[2],v1-r[2],r[2],90,180), ...c(u0+r[3],v0+r[3],r[3],180,270)];
}
const notch = yc => arcUV(yc, WZ, AR, 173, 7, 14);       // wheel arch cut into the bottom edge
const BOX = corners(BY, Z0, D, ZT, [6, R, R, 0]);
const CAB = corners(0, Z0, BY+2, CABH, [0, 0, CABRAD, 6]);   // overlaps the box by 2 (hidden seam when the cab is behind)
const CABF = corners(0, Z0, BY, CABH, [0, 0, CABRAD, 6]);    // same, ending flush with the box (used when the cab is in front)
const BOX_FACE = [...BOX, ...notch(WHEELS[1])];          // BL corner ends at (BY,Z0), then the arch, then back to BR
const cabFace = prof => [...prof, ...notch(WHEELS[0])];
const HATCH = rrUV(HY0, HZ0, HY1, HZ1, 2.5);
const ACC = () => st.pal === 'tomato' ? '#3fa69a' : '#e2533d';     // accent paint (stripes, awning, logo)
// text lying on a face with outward normal n; reads left-to-right as seen from outside (along n × z)
const txn = (p, n, str, size, col, anchor='middle', weight=800, extra='letter-spacing=".04em"') => { const o = P(...p);
  return `<text transform="${txM(o, Dv(n[1], -n[0], 0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="${anchor}" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" ${extra}>${str}</text>`; };
// text on the serving (+x) side
const txa = (x,y,z,str,size,col,anchor='middle',weight=800) => txn([x,y,z], [1,0,0], str, size, col, anchor, weight);
// small sphere (screen circle) with a light offset and highlight
function ball(x,y,z,r,col,w=.9){
  const [X,Y] = P(x,y,z), rr = r*1.2247, m = matOf(col);
  return `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(rr)}" fill="${m.m}"/><circle cx="${f(X-rr*.18)}" cy="${f(Y-rr*.2)}" r="${f(rr*.74)}" fill="${col}"/>`
    + `<circle cx="${f(X-rr*.38)}" cy="${f(Y-rr*.42)}" r="${f(rr*.22)}" fill="#fff" opacity=".7"/>`
    + `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(rr)}" fill="none" stroke="${INK}" stroke-width="${w}"/>`;
}
// seeded pseudo-random
const rnd = i => { const s = Math.sin(i*127.1 + 311.7)*43758.5453; return s - Math.floor(s); };
const streaks = (a, b, w=1.6) => `<path d="${a}${b}" stroke="#fff" stroke-opacity=".5" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;

/* ---------- state ---------- */
const st = { pal:'mustard', hatch:0, hatchT:0, orders:[], next:1, time:0, frozen:false };
const lit = () => st.hatch === 1 && st.hatchT === 1;

/* ---------- wheels (side = +1: serving side x = W, -1: far side x = 0) ---------- */
function wheel(yc, side=1){
  const X = d => side > 0 ? W - d : d, rng = (a,b) => [Math.min(X(a),X(b)), Math.max(X(a),X(b))];
  const tyre = cylX(...rng(13, 2), yc, WZ, WR, TYRE, toneI, 1.3, 30);
  if (!facing([side,0,0])) return tyre;                                  // far side: only the tyre peeks out below
  let s = fill(pd(on(PX(X(0)), notch(yc))), '#2b2724');                 // dark wheel well
  s += tyre;
  s += ink(pd(on(PX(X(1.9)), ellUV(yc, WZ, WR-3.2, WR-3.2, 28))), .8);   // sidewall ring
  s += cylX(...rng(2, -.6), yc, WZ, 7.4, METAL, toneI, 1.1, 24);
  s += fill(pd(on(PX(X(-.7)), ellUV(yc, WZ, 3, 3, 16))), METAL.d) + ink(pd(on(PX(X(-.7)), ellUV(yc, WZ, 3, 3, 16))), .7);
  for (let k=0;k<5;k++){ const a = k/5*Math.PI*2 + .3; s += fill(pd(on(PX(X(-.7)), ellUV(yc+5*Math.cos(a), WZ+5*Math.sin(a), .8, .8, 8))), INK); }
  return s;
}

/* ---------- chassis under the body: frame rails, the two axles, fuel tank behind the filler cap ---------- */
function chassis(){
  const parts = [], rails = [[4, WHEELS[0]-3], [WHEELS[0]+3, WHEELS[1]-3], [WHEELS[1]+3, D-2]];
  for (const [x0,x1] of [[22,28],[62,68]]) for (const [y0,y1] of rails)
    parts.push({ box:[[x0,y0,10],[x1,y1,Z0]], svg: box(x0, y0, 10, x1, y1, Z0, DARK, toneI, .9) });
  for (const yc of WHEELS) parts.push({ box:[[13,yc-2.2,WZ-2.2],[W-13,yc+2.2,WZ+2.2]], svg: cylX(13, W-13, yc, WZ, 2.2, DARK, toneI, .9, 14) });
  parts.push({ box:[[7,136,6],[20,164,Z0]], svg: box(7, 136, 6, 20, 164, Z0, matOf('#9aa2a5'), toneI, 1) });
  return parts;
}

/* ---------- cab ---------- */
const mirror = side => { const x = side > 0 ? W : 0;
  return line([[x,9,74],[x+6*side,6,76]], 1.6) + (side > 0 ? box(W+4, 1, 70, W+8, 9, 82, DARK, toneI, 1) : box(-8, 1, 70, -4, 9, 82, DARK, toneI, 1)); };
const bumperF = () => box(3, -2.5, 17, W-3, 0, 26, METAL, tone, 1.2);      // front bumper (sits proud of the cab nose)

// the cab door side: wheel in its arch, stripe, door + window, handle, marker, mirror
function cabSide(side, m, prof){
  const x = side > 0 ? W : 0, n = [side,0,0], F = PX(x + .2*side), FACE = cabFace(prof);
  let s = wheel(WHEELS[0], side);
  s += fill(pd(on(PX(x), FACE)), tone(n,m));
  s += fill(pd(on(F, rectUV(0, 34, BY, 39))), tone(n,CREAM));            // stripe
  const door = [[16,33],[47,33],[47,90],[30,90],...arcUV(30,76,14,90,180,6).slice(1),[16,62]];
  s += ink(pd(on(F, door)), 1.2);
  const win = [[19,63],[44,63],[44,86],[31,86],...arcUV(31,75,11,90,180,6).slice(1),[19,66]];
  s += fill(pd(on(F, win)), GLASS) + ink(pd(on(F, win)), 1.1);
  const G = PX(x + .3*side);
  s += streaks(pd(on(G,[[23,66],[33,84]]),false), pd(on(G,[[29,66],[38,82]]),false));
  s += shape(on(F, rrUV(38,55,45,57.5,1)), METAL.m, .8);                    // handle
  s += shape(on(F, rrUV(3,42,8,46,1.5)), '#f2a33a', .8);                      // side marker
  s += ink(pd(on(PX(x), FACE)), 2.2);
  return s + mirror(side);
}

// the cab nose (y = 0): wrap-around stripe, grille, headlights, indicators, bumper + number plate, wipers
function cabFront(m){
  const n = [0,-1,0], F = PY(-.2), F2 = PY(-.4);
  let s = fill(pd(on(F, rectUV(0, 34, W, 39))), tone(n, CREAM));
  s += shape(on(F, rrUV(29, 28.5, 61, 50, 3)), DARK.m, 1.2);                 // grille
  let sl = ''; for (let z = 32; z <= 47; z += 3.6) sl += pd(on(F2, [[31.5,z],[58.5,z]]), false);
  s += `<path d="${sl}" fill="none" stroke="${DARK.l}" stroke-width="1.5" stroke-linecap="round"/>`;
  s += shape(on(PY(-.6), ellUV(45, 39.2, 4.2, 4.2, 18)), tone(n, CREAM), .9);  // badge: a tiny taco
  s += fill(pd(on(PY(-.7), arcUV(45, 40, 3, 180, 360, 10))), SHELL.l) + fill(pd(on(PY(-.7), rectUV(42.4, 39.8, 47.6, 40.9))), LETTUCE);
  for (const xc of [13, 77]){
    s += shape(on(F, ellUV(xc, 42, 7.4, 7.4, 22)), METAL.m, 1.2);             // headlight bezel + lens
    s += shape(on(F2, ellUV(xc, 42, 5.3, 5.3, 20)), lit() ? '#fff3b0' : '#f3f0e2', .9);
    s += fill(pd(on(PY(-.6), ellUV(xc-1.8, 43.8, 1.7, 1.2, 10))), '#ffffff', 'opacity=".85"');
    s += shape(on(F, rrUV(xc-4, 29.4, xc+4, 32.6, 1.2)), '#f2a33a', .8);       // indicator
  }
  s += shape(on(F, rrUV(41, 58, 49, 61, 1)), METAL.m, .8);                   // bonnet catch
  // wipers resting on the bottom of the windscreen
  const ws = (x,a) => [x, CABRAD + (CABRAD+.4)*Math.cos(a*Math.PI/180), CABH-CABRAD + (CABRAD+.4)*Math.sin(a*Math.PI/180)];
  for (const x of [24, 58]) s += line([ws(x,174), ws(x-7,166), ws(x-14,158)], 1.3) + fill(pd(on(PY(-.3), ellUV(x, 70.6, 1.2, 1.2, 8))), INK);
  return s;
}

function cab(m){
  const front = facing([0,-1,0]), prof = front ? CABF : CAB;
  let s = loft(on(PX(0),prof), on(PX(W),prof), n=>tone(n,m));
  // curved windscreen on the visible part of the big front-top corner
  const arc = arcUV(CABRAD, CABH-CABRAD, CABRAD, 92, 178, 14);
  let gl = '';
  for (let i=0;i<arc.length-1;i++){
    const [a,b] = [arc[i], arc[i+1]];
    const nn = [0, ((a[0]+b[0])/2-CABRAD), ((a[1]+b[1])/2-(CABH-CABRAD))];
    if (!vis(nn)) continue;
    gl += face(pd([[6,a[0],a[1]],[W-6,a[0],a[1]],[W-6,b[0],b[1]],[6,b[0],b[1]]]), GLASS);
  }
  s += gl;
  const gEdge = arc.filter(p => vis([0,p[0]-CABRAD,p[1]-(CABH-CABRAD)]));
  if (gEdge.length > 1){
    s += ink(pd(gEdge.map(([u,v]) => [W-6,u,v]), false), 1) + ink(pd(gEdge.map(([u,v]) => [6,u,v]), false), 1);
    s += ink(pd([[6,...gEdge[0]],[W-6,...gEdge[0]]], false), 1);
    const gl1 = gEdge[gEdge.length-1];
    if (gl1 === arc[arc.length-1]) s += ink(pd([[6,...gl1],[W-6,...gl1]], false), 1);   // lower edge, seen from the front
    const g0 = gEdge[Math.floor(gEdge.length*.3)], g1 = gEdge[Math.floor(gEdge.length*.75)];
    s += streaks(pd([[30,...g0],[40,...g1]],false), pd([[48,...g0],[54,...g1]],false), 2);
  }
  if (facing([1,0,0])) s += cabSide(1, m, prof);
  if (facing([-1,0,0])) s += cabSide(-1, m, prof);
  if (front) s += cabFront(m);
  s += `<g clip-path="url(#noArch)">${hullInk([...on(PX(0),prof), ...on(PX(W),prof)], 2.8)}</g>`;
  if (front){   // bumper + number plate stand proud of the nose: after the silhouette
    s += bumperF() + shape(on(PY(-2.6), rrUV(34, 18.6, 56, 24.6, 1)), '#fbf6e6', .9);
    s += txn([45, -2.7, 20.3], [0,-1,0], 'TAC0 8', 4.2, INK, 'middle', 800, '');
  }
  return s;
}

/* ---------- interior, seen through the hatch (only from views where the hatch side faces) ---------- */
function interior(m){
  const v0 = facing([0,1,0]);                // view 0: viewer on the +y side, so the far end wall is the partition; else the back doors
  let s = '';
  // the walls you look at through the hatch: the inside of the far long wall (x = WT) and the far end wall
  // (the partition behind the cab in view 0, else the inside of the back doors), both tiled
  const YW = v0 ? YP : D - WT;
  const tiles = (pts, lines) => fill(pd(pts), WALL.m) + `<path d="${lines}" fill="none" stroke="${WALL.d}" stroke-width=".5"/>`;
  let tl = '';
  for (let z = FLOOR+8; z < ZT; z += 8) tl += pd([[WT,YP,z],[WT,D-WT,z]], false);
  for (let y = YP+8; y < D-WT; y += 8) tl += pd([[WT,y,FLOOR],[WT,y,ZT]], false);
  s += tiles([[WT,YP,FLOOR],[WT,D-WT,FLOOR],[WT,D-WT,ZT],[WT,YP,ZT]], tl);
  tl = '';
  for (let z = FLOOR+8; z < ZT; z += 8) tl += pd([[WT,YW,z],[W,YW,z]], false);
  for (let x = WT+8; x < W; x += 8) tl += pd([[x,YW,FLOOR],[x,YW,ZT]], false);
  s += tiles([[WT,YW,FLOOR],[W,YW,FLOOR],[W,YW,ZT],[WT,YW,ZT]], tl);
  s += ink(pd([[WT,YP,ZT],[WT,YP,FLOOR],[WT,D-WT,FLOOR],[WT,D-WT,ZT]], false), .9) + ink(pd([[WT,YW,FLOOR],[W,YW,FLOOR]], false), .9);
  // floor (checker)
  s += fill(pd([[WT,YP,FLOOR],[W,YP,FLOOR],[W,D,FLOOR],[WT,D,FLOOR]]), '#e9dfc5');
  let ch = '';
  for (let x = WT; x < W; x += 10) for (let y = YP; y < D; y += 10)
    if (((x-WT)/10 + (y-YP)/10) % 2 === 0) ch += pd([[x,y,FLOOR],[x+10,y,FLOOR],[x+10,y+10,FLOOR],[x,y+10,FLOOR]]);
  s += `<path d="${ch}" fill="#c9b994"/>`;
  s += ink(pd([[WT,YP,FLOOR],[WT,D-WT,FLOOR]], false), .9) + ink(pd([[WT,YW,FLOOR],[W,YW,FLOOR]], false), .9);

  // everything in the kitchen is always there; byDepth puts it in order for the current view
  const parts = [];
  // wall shelf with squeeze bottles (on the partition wall)
  let shelf = box(46, YP, 44, 76, YP+9, 46, METAL, toneI, .9);
  [[48,'#e98a2c'],[56,'#f2c230'],[64,'#5cb848'],[72,'#e2483d']].sort((a,b) => depthOf([a[0],0,0]) - depthOf([b[0],0,0])).forEach(([x,c]) => {
    const y = YP+4.5;
    shelf += cyl(x, y, 46, 55, 2.6, matOf(c), toneI, 1, 16) + cyl(x, y, 55, 58, 1.1, matOf('#f4f1e6'), toneI, .7, 10);
  });
  parts.push({ box:[[46,YP,44],[76,YP+9,58]], svg: shelf });
  // against the back doors: a tall fridge (door toward the cab) and a drinks crate on the floor
  { const y1 = D - WT, y0 = y1 - 22;
    let fr = box(14, y0, FLOOR, 44, y1, 96, METAL, toneI, 1.1);
    if (facing([0,-1,0])){
      fr += ink(pd(on(PY(y0-.1), [[15,62],[43,62]]), false), .9);
      fr += shape(on(PY(y0-.2), rrUV(37, 66, 40, 80, 1)), METAL.d, .7) + shape(on(PY(y0-.2), rrUV(37, 46, 40, 58, 1)), METAL.d, .7);
      fr += shape(on(PY(y0-.2), rrUV(18, 84, 30, 91, 1)), '#ffffff', .6);
    }
    parts.push({ box:[[14,y0,FLOOR],[44,y1,96]], svg: fr });
    let cr8 = box(48, y1-14, FLOOR, 66, y1, 30, matOf('#d94a3a'), toneI, 1);
    for (const x of [51, 56, 61].sort((a,b) => depthOf([a,0,0]) - depthOf([b,0,0]))) cr8 += cyl(x+1.5, y1-7, 30, 37, 1.8, matOf(x === 56 ? '#5cb848' : '#f2c230'), toneI, .8, 12);
    parts.push({ box:[[48,y1-14,FLOOR],[66,y1,37]], svg: cr8 });
  }

  const cooking = st.orders.find(o => o.state === 'cooking'), hot = st.orders.some(o => o.state === 'cooking');
  // griddle station
  const G = [48, 82, 74, 114];   // x0,y0,x1,y1
  let gr = box(G[0], G[1], FLOOR, G[2], G[3], 46, METAL, toneI, 1.1);
  gr += box(G[0], G[1], 46, G[2], G[3], 48, METAL, toneI, .9);
  const plate = [[G[0]+2,G[1]+2,48.1],[G[2]-2,G[1]+2,48.1],[G[2]-2,G[3]-2,48.1],[G[0]+2,G[3]-2,48.1]];
  gr += fill(pd(plate), hot ? '#3d3330' : '#4a4642') + ink(pd(plate), .8);
  for (const y of [88, 97, 106]) gr += shape(on(PX(G[2]+.1), ellUV(y, 41.5, 1.6, 1.6, 10)), INK, 0) + fill(pd(on(PX(G[2]+.2), ellUV(y, 41.5, 1, 1, 8))), hot ? '#ff7a3a' : METAL.d);
  if (cooking) gr += griddleFood(cooking, (G[0]+G[2])/2, (G[1]+G[3])/2);

  // the cook: body block, apron, arm with a spatula, round head, cap
  const cx0 = 56, cx1 = 66, cy0 = 117, cy1 = 129;
  const sw = cooking ? Math.sin(st.time*9)*2 : 0;
  let arm = line([[61, cy0+1, 44],[64, cy0-6+sw*.4, 48.5]], 3.4) + `<path d="${pd([[61,cy0+1,44],[64,cy0-6+sw*.4,48.5]],false)}" stroke="#e9b48a" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  arm += shape([[63,cy0-6+sw*.4,48.6],[68,cy0-9+sw,48.6],[68,cy0-14+sw,48.6],[63,cy0-11+sw*.4,48.6]], METAL.l, .8);
  let ck = box(cx0, cy0, FLOOR, cx1, cy1, 50, matOf('#3f7fc8'), toneI, 1.1);
  ck += shape(on(PX(cx1+.1), rrUV(cy0+2, 24, cy1-2, 47, 2)), '#fbfaf3', .9);
  ck += ball(61, 123, 57.5, 6.4, '#eab58b', 1.1);
  const [hx, hy] = P(61, 123, 57.5);
  // cap: dome over the top half + a brim pointing to the window
  const cr = 6.4*1.2247;
  ck += `<path d="M${f(hx-cr*1.02)} ${f(hy-cr*.15)} A${f(cr*1.02)} ${f(cr*1.02)} 0 0 1 ${f(hx+cr*1.02)} ${f(hy-cr*.15)} Z" fill="${RED}" stroke="${INK}" stroke-width="1"/>`;
  ck += shape(on(PZ(61.6), [[64,117.5],[68.5,118.5],[69.5,123],[68.5,127.5],[64,128.5]]), mix(RED,'#000000',.15), .9);
  for (const dy of [-2.4, 2.4]) ck += fill(pd(on(PX(67.2), ellUV(123+dy, 55.4, .8, .9, 8))), INK);
  ck += ink(pd(on(PX(67.3), arcUV(123, 54.2, 1.8, 200, 340, 6)), false), .8);
  ck += fill(pd(on(PX(67.2), ellUV(118.6, 54.6, 1.1, .8, 8))), '#f08f86', 'opacity=".7"') + fill(pd(on(PX(67.2), ellUV(127.4, 54.6, 1.1, .8, 8))), '#f08f86', 'opacity=".7"');

  // view 0: griddle, then the cook (arm first); otherwise the cook is behind the griddle and the arm reaches over it
  parts.push({ box:[[48,82,FLOOR],[74,129,64]], svg: v0 ? gr + arm + ck : ck + gr + arm });

  // inner counter (pass-through shelf, fixed to the wall under the hatch) + cash register on it
  parts.push({ box:[[74,HY0-4,46],[W-WT,HY1+8,52]], svg: box(74, HY0-4, 46, W-WT, HY1+8, 52, METAL, toneI, 1) });
  parts.push({ box:[[76,138,52],[87,154,63]], svg: register(m) });

  // ticket rail just inside the top of the hatch
  let tk = '';
  const tickets = st.orders.filter(o => o.state !== 'ready');
  tickets.forEach((o,i) => {
    const y = 90 + i*14, X = PX(W-5.3);
    tk += shape(on(X, [[y-5,89],[y+5,89],[y+5,79],[y+3.5,78],[y+2,79],[y,78],[y-2,79],[y-3.5,78],[y-5,79]]), o.state === 'cooking' ? '#fffbe8' : '#ffffff', .8);
    tk += txa(W-5.2, y, 84.4, '#'+o.n, 3.2, RED) + txa(W-5.2, y, 80.6, o.item.toUpperCase().slice(0,4), 2.3, INK);
  });
  tk += line([[W-5,84,89.4],[W-5,134,89.4]], 2.4) + `<path d="${pd([[W-5,84,89.4],[W-5,134,89.4]],false)}" stroke="${METAL.l}" stroke-width="1" fill="none"/>`;
  parts.push({ box:[[W-6,84,78],[W-4.5,134,90]], svg: tk });
  s += byDepth(parts);

  // steam
  if (cooking){
    let sm = '';
    for (let k=0;k<6;k++){
      const ph = (st.time*.55 + k/6) % 1, y = 88 + rnd(k)*22 + Math.sin(ph*6+k)*2, x = 54 + rnd(k+9)*16;
      const [X,Y] = P(x, y, 50 + ph*30), r = (2.4 + ph*5.5)*1.2;
      sm += `<circle cx="${f(X)}" cy="${f(Y)}" r="${f(r)}" fill="#ffffff" fill-opacity=".8" stroke="#9aa6a8" stroke-width=".7" opacity="${f(.9*Math.sin(ph*Math.PI))}"/>`;
    }
    s += `<g pointer-events="none">${sm}</g>`;
  }
  // light: dim when the lights are off, warm glow when on
  const area = pd(on(PX(W), HATCH));
  s += lit() ? fill(area, '#fff1b8', 'opacity=".14" pointer-events="none"') : fill(area, '#20203a', 'opacity=".42" pointer-events="none"');
  return s;
}

// food sizzling on the griddle (progress o.t)
function griddleFood(o, x, y){
  const t = o.t, z = 48.3;
  let s = '';
  if (o.item === 'nachos'){
    for (let k=0;k<7;k++){ const a = rnd(k+3)*6.28, px = x-6+rnd(k+1)*12, py = y-7+rnd(k+2)*14;
      s += shape([[px+3*Math.cos(a),py+3*Math.sin(a),z],[px+3*Math.cos(a+2.1),py+3*Math.sin(a+2.1),z],[px+3*Math.cos(a+4.2),py+3*Math.sin(a+4.2),z]], mix('#f2c14e','#c98a2a',t*.5), .6); }
    if (t > .4) s += fill(pd(on(PZ(z+.1), ellUV(x, y, 6*Math.min(1,(t-.4)*2.5), 4.5*Math.min(1,(t-.4)*2.5), 16))), CHEESE, 'opacity=".9"');
  } else {
    const tort = on(PZ(z), ellUV(x, y, 9, 9, 24));
    s += fill(pd(tort), mix(TORT.l, '#d9a85a', t*.6)) + ink(pd(tort), .8);
    for (let k=0;k<9;k++) if (t > k/12) s += fill(pd(on(PZ(z+.1), ellUV(x-5+rnd(k+20)*10, y-5+rnd(k+30)*10, 1.4, 1.4, 8))), MEAT);
  }
  // bubbles popping
  for (let k=0;k<8;k++){
    const ph = (st.time*1.7 + rnd(k+50)) % 1, r = .4 + ph*1.1;
    const b = on(PZ(z+.2), ellUV(x-10+rnd(k+60)*20, y-12+rnd(k+70)*24, r, r, 10));
    s += `<path d="${pd(b)}" fill="#fff" fill-opacity=".25" stroke="#fff" stroke-opacity="${f(.85*(1-ph))}" stroke-width=".5"/>`;
  }
  return s;
}

function register(m){
  const B = matOf('#56646c'), y0 = 138, y1 = 154;
  let s = box(76, y0, 52, 87, y1, 57, B, toneI, 1);
  s += shape([[79,y0+1,57],[86,y0+1,57],[86,y1-1,57],[79,y1-1,57]], B.d, 0);
  for (let i=0;i<3;i++) for (let j=0;j<4;j++) s += fill(pd(on(PZ(57.1), ellUV(80.5+i*2.2, y0+3+j*3.2, .7, .9, 8))), '#e9edee');
  s += box(76, y0+2, 57, 79, y1-2, 63, B, toneI, 1);
  s += shape(on(PX(79.1), rrUV(y0+3, 58.5, y1-3, 62, 1)), '#1d2a26', .7);
  const last = st.orders.length ? st.orders[st.orders.length-1] : null;
  s += txa(79.2, (y0+y1)/2, 59.3, last ? '$'+FOOD[last.item].price+'.00' : '0.00', 2.6, '#8af0ae', 'middle', 700);
  s += shape(on(PX(87.1), rrUV(y0+2, 53, y1-2, 55.5, .8)), B.m, .7);
  return s;
}

/* ---------- food served on the counter ledge ---------- */
function served(o){
  const y = SLOTS[o.slot], x0 = W+2, x1 = W+11, z = HZ0;
  let s = '';
  if (o.item === 'nachos'){
    s += box(x0, y-7.5, z, x1, y+7.5, z+2.4, matOf('#2f2b28'), toneI, 1);
    s += shape([[x0+1,y-6.5,z+2.5],[x1-1,y-6.5,z+2.5],[x1-1,y+6.5,z+2.5],[x0+1,y+6.5,z+2.5]], '#47423d', 0);
    const chips = [[3,-4,.3],[6,-1,2.2],[4,3,4.1],[7,4,1.1],[2.5,0,5.2],[6.5,-5,3.3],[5,1,.8]];
    for (const [dx,dy,a] of chips){ const cx = x0+dx, cy = y+dy, zz = z+2.7+(dx%2);
      s += shape([[cx+3*Math.cos(a),cy+3*Math.sin(a),zz],[cx+3*Math.cos(a+2.1),cy+3*Math.sin(a+2.1),zz+1.4],[cx+3*Math.cos(a+4.2),cy+3*Math.sin(a+4.2),zz]], '#f2c14e', .7); }
    s += fill(pd(on(PZ(z+4.6), [[x0+4,y-3],[x0+6.5,y-4],[x0+7,y-.5],[x0+6,y+3],[x0+3.5,y+2.5],[x0+3,y]])), CHEESE) + ink(pd(on(PZ(z+4.6), [[x0+4,y-3],[x0+6.5,y-4],[x0+7,y-.5],[x0+6,y+3],[x0+3.5,y+2.5],[x0+3,y]])), .6);
    s += fill(pd(on(PZ(z+4.7), ellUV(x0+5, y+1, .9, .9, 8))), '#4c8a3a') + fill(pd(on(PZ(z+4.7), ellUV(x0+4.4, y-2, .9, .9, 8))), TOMATO);
    return s;
  }
  // paper boat
  s += box(x0, y-7, z, x1, y+7, z+3, CREAM, toneI, 1);
  s += shape([[x0+1,y-6,z+3.05],[x1-1,y-6,z+3.05],[x1-1,y+6,z+3.05],[x0+1,y+6,z+3.05]], '#e6dcc2', 0);
  if (facing([1,0,0])) s += fill(pd(on(PX(x1+.1), rectUV(y-7, z+1, y+7, z+1.8))), RED);
  if (o.item === 'taco'){
    const xa = x0+3, xb = x1-2.5, cz = z+10, r = 6.4;
    const half = [...arcUV(y, cz, r, 180, 360, 14)];
    s += loft(on(PX(xa), half), on(PX(xb), half), n => n[2] > .9 ? MEAT : toneI(n, SHELL));
    s += fill(pd(on(PZ(cz+.05), rectUV(xa, y-r+.8, xb, y+r-.8))), MEAT);
    // the open end of the shell that faces the viewer (+x toward the street, or -x when seen from behind the truck)
    const tx_ = facing([1,0,0]) ? 1 : -1, xe = tx_ > 0 ? xb : xa;
    for (let k=0;k<6;k++) s += fill(pd(on(PX(xe-(.6+rnd(k)*2)*tx_), ellUV(y-5+k*2, cz+.6+rnd(k+4)*.8, 1.5, 1.3, 10))), k%3===1 ? TOMATO : LETTUCE);
    s += fill(pd(on(PZ(cz+1.2), ellUV(tx_ > 0 ? xa+2 : xb-2, y+1, 1.2, 3, 10))), CHEESE);
    s += fill(pd(on(PX(xe), half)), toneI([tx_,0,0], SHELL)) + ink(pd(on(PX(xe), half)), 1);
    for (let k=0;k<4;k++) s += fill(pd(on(PX(xe+.05*tx_), ellUV(y-3+k*2.2, cz-2-rnd(k+7)*3, .5, .5, 6))), '#c99a3c');
    s += hullInk([...on(PX(xa), half), ...on(PX(xb), half)], 1.1);
  } else {
    const cx = (x0+x1)/2, cz = z+3+3.6, r = 3.8, ya = y-6.5, yb = y+6.5, ym = y;
    const A = on(PY(ya), ellUV(cx, cz, r, r, 18)), M = on(PY(ym), ellUV(cx, cz, r, r, 18)), B = on(PY(yb), ellUV(cx, cz, r, r, 18));
    s += loft(A, M, n => toneI(n, METAL)) + loft(M, B, n => toneI(n, TORT));
    if (facing([0,1,0])){          // open tortilla end with the spiral
      s += fill(pd(B), toneI([0,1,0], TORT)) + ink(pd(B), .9);
      s += ink(pd(on(PY(yb+.05), arcUV(cx, cz, 2.2, 0, 300, 10)), false), .6) + ink(pd(on(PY(yb+.05), arcUV(cx+.3, cz, 1, 60, 330, 8)), false), .5);
    } else {                       // foil-wrapped end
      s += fill(pd(A), toneI([0,-1,0], METAL)) + ink(pd(A), .9);
      for (const a of [20, 95, 170, 250, 320]) s += line([[cx+1.2*Math.cos(a*Math.PI/180), ya-.05, cz+1.2*Math.sin(a*Math.PI/180)],[cx+3.2*Math.cos((a+12)*Math.PI/180), ya-.05, cz+3.2*Math.sin((a+12)*Math.PI/180)]], .4);
    }
    s += ink(sp(hull([...M].map(p => P(...p)))).replace(/Z$/,''), .5);
    const bx = facing([1,0,0]) ? 1 : -1;     // foil seam + crinkles on the side toward the viewer
    s += line([[cx+r*bx, ym, cz],[cx, ym, cz+r]], .8);
    for (const k of [0,1,2]) s += line([[cx+r*.8*bx, ya+1.5+k*1.6, cz+1.5],[cx+r*.3*bx, ya+2.5+k*1.6, cz+r*.9]], .4);
    s += hullInk([...A, ...B], 1.1);
  }
  return s;
}

// counter ledge with brackets, food waiting on it
function ledge(){
  let s = '';
  for (const y of [HY0+6, HY1-6]) s += shape([[W,y,HZ0-4],[W+LEDGE-3,y,HZ0-4],[W,y,HZ0-15]], METAL.m, 1);
  s += box(W, HY0-4, HZ0-4, W+LEDGE, HY1+4, HZ0, METAL, tone, 1.2);
  s += byDepth(st.orders.filter(o => o.state === 'ready').map(o => ({ at:[W+6, SLOTS[o.slot], HZ0], svg: act('take', served(o), `data-n="${o.n}"`) })));
  return s;
}

/* ---------- awning: hinged at the top, lifts up into a shade ---------- */
function awning(m){
  const p = ease(st.hatch), th = AOPEN * p * Math.PI/180;
  const y0 = HY0-4, y1 = HY1+4, len = ALEN, t = 2.4, hx = W+.6, hz = HINGE;
  const dn = [Math.sin(th), 0, -Math.cos(th)], out = [Math.cos(th), 0, Math.sin(th)];
  const Q = (sA, w, y) => [hx + sA*dn[0] + w*out[0], y, hz + sA*dn[2] + w*out[2]];
  const accent = ACC();
  const topSide = vis(out);                       // outer (painted) face seen, else the underside
  const n = topSide ? out : out.map(v=>-v), w = topSide ? t : 0, sg = topSide ? 1 : -1;
  let s = '', struts = '';
  if (p > .04) for (const y of [y0+5, y1-5]) struts += line([[W, y, HZ1-4], Q(len*.55, 0, y)], 2.2) + `<path d="${pd([[W,y,HZ1-4], Q(len*.55,0,y)],false)}" stroke="${METAL.l}" stroke-width=".9" fill="none"/>`;
  if (topSide) s += struts;
  const faces = [
    { n: dn,             p: [Q(len,0,y0),Q(len,0,y1),Q(len,t,y1),Q(len,t,y0)] },
    { n: dn.map(v=>-v),  p: [Q(0,0,y0),Q(0,0,y1),Q(0,t,y1),Q(0,t,y0)] },
    { n: [0,1,0],        p: [Q(0,0,y1),Q(len,0,y1),Q(len,t,y1),Q(0,t,y1)] },
    { n: [0,-1,0],       p: [Q(0,0,y0),Q(len,0,y0),Q(len,t,y0),Q(0,t,y0)] },
  ];
  for (const fc of faces) if (vis(fc.n)) s += shape(fc.p, tone(fc.n, CREAM), 1);
  // striped canvas on the visible big face
  const N = 9, sw = (y1-y0)/N;
  for (let i=0;i<N;i++){
    const ya = y0+i*sw, yb = ya+sw, col = i%2 ? CREAM : matOf(accent);
    s += face(pd([Q(0,w,ya),Q(0,w,yb),Q(len,w,yb),Q(len,w,ya)]), topSide ? tone(n, col) : toneI([0,0,1], col));
  }
  s += ink(pd([Q(0,w,y0),Q(0,w,y1),Q(len,w,y1),Q(len,w,y0)]), 1.6);
  s += ink(pd([Q(len-7,w,y0),Q(len-7,w,y1)], false), .9);
  if (!topSide) s += struts;
  // marquee bulbs along the free edge
  const on_ = lit();
  let bl = '';
  for (let y = y0+5; y <= y1-4; y += 9.4){
    const c = Q(len-3.5, w+sg*1.6, y), [X,Y] = P(...c);
    if (on_) bl += `<circle cx="${f(X)}" cy="${f(Y)}" r="4.6" fill="#ffe7a0" opacity=".45"/>`;
    bl += ball(...c, 1.5, on_ ? '#ffd84a' : '#ece6d4', .8);
  }
  s += `<g pointer-events="none">${bl}</g>`;
  s += ink(pd([[hx,y0-1,hz],[hx,y1+1,hz]],false), 1.8);   // hinge
  return act('awning', s);
}

/* ---------- OPEN / CLOSED plaque: flips with the hatch ---------- */
function plaque(){
  const k = Math.cos(Math.PI*st.hatch), sc = Math.max(.08, Math.abs(k)), open = st.hatch > .5;
  const yc = 62, zc = 80, hw = 8, hh = 6*sc, X = PX(W+.6);
  let s = line([[W+.4,yc,90],[W+.6,yc-hw+2,zc+hh]], .7) + line([[W+.4,yc,90],[W+.6,yc+hw-2,zc+hh]], .7);
  s += fill(pd(on(PX(W+.2), ellUV(yc, 90, .8, .8, 8))), INK);
  s += shape(on(X, rrUV(yc-hw, zc-hh, yc+hw, zc+hh, 1.5*sc)), open ? GREEN : RED, 1.1);
  if (sc > .5) s += `<g transform="translate(0 0)">${txa(W+.7, yc, zc-1.6*sc, open ? 'OPEN' : 'CLOSED', open ? 4.4 : 3.2, '#ffffff')}</g>`;
  return act('awning', s);
}

/* ---------- menu board on the side of the truck ---------- */
function menu(){
  const X = PX(W+.3), y0 = 172, y1 = 212;
  let s = shape(on(X, rrUV(y0, 44, y1, 100, 2.5)), '#8a5a35', 1.3);
  s += shape(on(PX(W+.4), rrUV(y0+2.5, 46.5, y1-2.5, 97.5, 1.5)), '#24302b', .9);
  s += txa(W+.5, (y0+y1)/2, 88.5, 'MENU', 6, '#f6e7b8');
  s += ink(pd(on(PX(W+.5), [[y0+8,86],[y1-8,86]]), false), .7).replace(INK, '#f6e7b8');
  const rows = [['taco',76],['burrito',65],['nachos',54]];
  for (const [k,z] of rows){
    let r = fill(pd(on(PX(W+.45), rectUV(y0+3.5, z-3, y1-3.5, z+5.5))), '#ffffff', 'opacity="0"');
    r += txa(W+.5, y1-5, z, FOOD[k].label.toUpperCase(), 4.4, '#ffffff', 'start') + txa(W+.5, y0+5, z, '$'+FOOD[k].price, 4.4, '#f6c445', 'end');
    s += act('order', r, `data-item="${k}"`);
  }
  s += txa(W+.5, (y0+y1)/2, 48.5, 'click to order', 2.6, '#9fb0a6', 'middle', 600);
  return s;
}

/* ---------- roof: sign + vents ---------- */
function roof(m){
  const sx = facing([1,0,0]) ? 1 : -1;            // which long side of the sign / taco faces the viewer
  // mushroom vent over the front
  const vent1 = cyl(26, 70, ZT, ZT+4, 4, METAL, toneI, 1, 18) + cyl(26, 70, ZT+4, ZT+6.5, 7, METAL, toneI, 1, 20);
  // sign board on two posts + a big taco on top
  let sg = byDepth([112, 168].map(y => ({ box:[[44,y-2,ZT],[48,y+2,118]], svg: box(44, y-2, ZT, 48, y+2, 118, METAL, toneI, 1) })));
  sg += box(43, 104, 118, 49, 176, 130, CREAM, toneI, 1.2);
  // the lettering stays inside its board face (seen steeply from above the face gets thin)
  if (facing([sx,0,0])) sg += clipTo(on(PX(sx > 0 ? 49 : 43), rectUV(104, 118, 176, 130)),
    sx > 0 ? txa(49.2, 140, 120.8, 'TACOS', 10.5, RED, 'middle', 900) : txn([42.8, 140, 120.8], [-1,0,0], 'TACOS', 10.5, RED, 'middle', 900));
  const yc = 140, zc = 151, r = 21, xa = 38, xb = 52, xf = sx > 0 ? xb : xa;
  const half = arcUV(yc, zc, r, 180, 360, 20);
  sg += loft(on(PX(xa), half), on(PX(xb), half), n => n[2] > .9 ? MEAT : tone(n, SHELL));
  // filling on top: lettuce, tomato, cheese
  let fl = '';
  for (let k=0;k<11;k++){ const y = yc-r+3+k*3.6, x = xa+2+rnd(k)*(xb-xa-4);
    fl += fill(pd(on(PZ(zc+.4), ellUV(x, y, 2.6, 2.2, 10))), k%4===2 ? CHEESE : LETTUCE); }
  sg += fl;
  let lf = '';
  for (let k=0;k<12;k++){ const y = yc-r+2+k*3.5, P_ = PX(xf - .8*sx); lf += fill(pd(on(P_, ellUV(y, zc+.8+rnd(k+3)*1.2, 2.3, 2, 10))), k%3===1 ? TOMATO : LETTUCE) + ink(pd(on(P_, arcUV(y, zc+.8+rnd(k+3)*1.2, 2.3, 10, 170, 5)), false), .6); }
  sg += lf;
  sg += fill(pd(on(PX(xf), half)), tone([sx,0,0], SHELL)) + ink(pd(on(PX(xf), half)), 1.3);
  for (let k=0;k<9;k++) sg += fill(pd(on(PX(xf+.1*sx), ellUV(yc-14+rnd(k+40)*28, zc-3-rnd(k+41)*14*(1-Math.abs(rnd(k+40)-.5)), .9, .7, 8))), '#cf9a3a');
  sg += hullInk([...on(PX(xa), half), ...on(PX(xb), half)], 1.6);
  // box vent near the back, louvres on its long side
  let vent2 = box(22, 190, ZT, 52, 208, ZT+5, METAL, tone, 1.1);
  for (const y of [194, 198, 202]) vent2 += line([[sx > 0 ? 52.1 : 21.9, y, ZT+1],[sx > 0 ? 52.1 : 21.9, y, ZT+4]], .8);
  return byDepth([{ box:[[19,63,ZT],[33,77,ZT+6.5]], svg:vent1 }, { box:[[38,104,ZT],[52,176,172]], svg:sg }, { box:[[22,190,ZT],[52,208,ZT+5]], svg:vent2 }]);
}

/* ---------- back of the truck (+y) ---------- */
const bumperR = () => box(8, D, 12, 82, D+5, 18, METAL, tone, 1.1);    // step bumper
function back(m){
  const Y = PY(D+.2);
  let s = '';
  s += ink(pd(on(Y, rectUV(16, 24, 74, 104))), 1.2) + ink(pd(on(Y, [[45,24],[45,104]]), false), 1.1);
  for (const [a,b] of [[20,41],[49,70]]) s += fill(pd(on(Y, rrUV(a, 80, b, 98, 2))), GLASS) + ink(pd(on(Y, rrUV(a, 80, b, 98, 2))), 1);
  s += shape(on(Y, rrUV(40, 56, 43.5, 64, 1)), METAL.m, .7) + shape(on(Y, rrUV(46.5, 56, 50, 64, 1)), METAL.m, .7);
  for (const xa of [4, 77]){
    s += shape(on(Y, rrUV(xa, 26, xa+9, 46, 2)), RED, 1);
    s += fill(pd(on(PY(D+.3), rrUV(xa+1.5, 38, xa+7.5, 44, 1.5))), '#ff9a8a', 'opacity=".8"');
    s += shape(on(Y, rrUV(xa, 48, xa+9, 53, 1.5)), '#f2a33a', .8);
  }
  s += shape(on(Y, rrUV(35, 28, 55, 37, 1)), '#fbf6e6', .9);
  s += txn([45, D+.3, 30.6], [0,1,0], 'TAC0 8', 4.2, INK, 'middle', 800, '');
  s += bumperR();
  return s;
}

/* ---------- the serving side (+x): rear wheel, hatch + interior, face, plaque, menu, ledge ---------- */
function hatchSide(m){
  let s = wheel(WHEELS[1], 1);
  s += clipTo(on(PX(W), HATCH), interior(m));
  // reveal of the opening: the side jamb that faces the viewer, then the sill
  s += facing([0,1,0]) ? face(pd([[W-WT,HY0,HZ0],[W,HY0,HZ0],[W,HY0,HZ1],[W-WT,HY0,HZ1]]), tone([0,1,0],m))
                       : face(pd([[W-WT,HY1,HZ0],[W,HY1,HZ0],[W,HY1,HZ1],[W-WT,HY1,HZ1]]), tone([0,-1,0],m));
  s += face(pd([[W-WT,HY0,HZ0],[W,HY0,HZ0],[W,HY1,HZ0],[W-WT,HY1,HZ0]]), METAL.l);
  const X = PX(W);
  s += `<path d="${pd(on(X, BOX_FACE))}${pd(on(X, HATCH))}" fill="${tone([1,0,0],m)}" fill-rule="evenodd"/>`;
  s += ink(pd(on(X, HATCH)), 1.8);
  const F = PX(W+.2);
  s += fill(pd(on(F, rectUV(BY, 34, D-2, 39))), tone([1,0,0],CREAM));
  s += fill(pd(on(F, rectUV(BY, 30.5, D-2, 32))), tone([1,0,0], matOf(ACC())));
  s += ink(pd(on(X, BOX_FACE)), 2.2);
  s += ink(pd([[W,BY,ZT-R],[W,BY,CABH]], false), 1.4);
  s += plaque();
  s += menu();
  return s;
}

/* ---------- the far side (−x): plain panel with the painted logo ---------- */
function farSide(m){
  const n = [-1,0,0], X = PX(0), F = PX(-.2), F2 = PX(-.4), acc = ACC();
  let s = facing(n) ? wheel(WHEELS[1], -1) : '';     // edge-on (looking straight at the nose or the back): drawn with the far wheels
  s += fill(pd(on(X, BOX_FACE)), tone(n,m));
  s += fill(pd(on(F, rectUV(BY, 34, D-2, 39))), tone(n,CREAM));
  s += fill(pd(on(F, rectUV(BY, 30.5, D-2, 32))), tone(n, matOf(acc)));
  // big painted TACOS logo with a drop shadow + tagline
  s += txn([-.3, 119, 56.8], n, 'TACOS', 34, mix(m.d, '#000000', .1), 'middle', 900);
  s += txn([-.4, 117.6, 58.2], n, 'TACOS', 34, acc, 'middle', 900, `letter-spacing=".04em" stroke="${CREAM.l}" stroke-width="1.2" paint-order="stroke"`);
  s += txn([-.4, 118, 47.5], n, '· FRESH OFF THE GRIDDLE ·', 5.2, tone(n,m) === m.l ? mix(m.l, '#000000', .55) : mix(tone(n,m), '#ffffff', .55), 'middle', 800);
  // painted emblem: a taco in a sun
  const ec = [193, 74];
  s += shape(on(F, ellUV(...ec, 15, 15, 32)), tone(n, CREAM), 1.2);
  s += fill(pd(on(F2, ellUV(...ec, 12.2, 12.2, 32))), acc);
  const sh = arcUV(ec[0], ec[1]+1.5, 9, 180, 360, 16);
  for (let k=0;k<9;k++) s += fill(pd(on(PX(-.5), ellUV(ec[0]-7.2+k*1.8, ec[1]+2.2+rnd(k)*1.2, 1.7, 1.5, 8))), k%3===1 ? TOMATO : LETTUCE);
  s += shape(on(PX(-.6), sh), SHELL.l, 1);
  for (let k=0;k<5;k++) s += fill(pd(on(PX(-.7), ellUV(ec[0]-5+rnd(k+40)*10, ec[1]-1-rnd(k+41)*5, .7, .6, 6))), '#cf9a3a');
  // generator louvre, fuel filler, marker lights
  s += shape(on(F, rrUV(183, 93, 205, 104, 1.5)), tone(n, METAL), 1);
  let lv = ''; for (let z = 95.5; z < 103; z += 2.4) lv += pd(on(F2, [[185.5,z],[202.5,z]]), false);
  s += ink(lv, .8);
  s += shape(on(F, ellUV(150, 25, 3.4, 3.4, 16)), METAL.m, 1) + ink(pd(on(F2, [[148,25],[152,25]]), false), .7);
  for (const y of [56, 212]) s += shape(on(F, rrUV(y-2.5, 42, y+2.5, 46, 1.5)), '#f2a33a', .8);
  s += ink(pd(on(X, BOX_FACE)), 2.2);
  s += ink(pd([[0,BY,ZT-R],[0,BY,CABH]], false), 1.4);
  return s;
}

/* ---------- the strip of the box above the cab (−y): clearance lights ---------- */
function boxFront(){
  let s = '';
  for (const x of [18, 45, 72]) s += shape(on(PY(BY-.2), rrUV(x-3.5, 97.5, x+3.5, 100.5, 1.2)), '#f2a33a', .8);
  return s;
}

/* ---------- scene ---------- */
function scene(st, m){
  let s = '';
  const fX = facing([1,0,0]), fY = facing([0,1,0]), fF = facing([0,-1,0]);
  // shadow
  const sh = [];
  for (const x of [0, W]) { for (const [y,z] of BOX) sh.push([x,y,z]); for (const [y,z] of CAB) sh.push([x,y,z]); }
  for (const [y,z] of [[104,118],[176,118],[119,151],[161,151],[140,130]]) sh.push([45,y,z]);
  const th = AOPEN*ease(st.hatch)*Math.PI/180;
  for (const y of [HY0-4, HY1+4]) sh.push([W+.6+ALEN*Math.sin(th), y, HINGE-ALEN*Math.cos(th)]);
  s += castShadow(sh);

  // silhouette clip that leaves the wheel arches open (on whichever long side faces the viewer)
  const AX = fX ? W : 0;
  let holes = '';
  for (const yc of WHEELS) holes += pd(on(PX(AX), [...arcUV(yc, WZ, AR+1.6, 180, 0, 14), [yc+AR+1.6, -10], [yc-AR-1.6, -10]]));
  s += `<clipPath id="noArch"><path clip-rule="evenodd" d="M-2000 -2000H4000V4000H-2000Z${holes}"/></clipPath>`;

  // underneath and on faces turned away: drawn first so the body hides them (whatever sticks out past it still shows):
  // the wheels of each side that is turned away, the chassis, the mirror on the far door, a bumper on a turned-away end
  const behind = [chassis()];
  for (const sd of [1, -1]) if (!facing([sd,0,0])){
    const x0 = sd > 0 ? W-13 : 2-.6, x1 = sd > 0 ? W+.6 : 13;
    for (const yc of WHEELS) behind.push({ box:[[x0, yc-WR, 0],[x1, yc+WR, 2*WR]], svg: wheel(yc, sd) });
    behind.push({ box: sd > 0 ? [[W,1,70],[W+8,9,82]] : [[-8,1,70],[0,9,82]], svg: mirror(sd) });
  }
  if (!fY) behind.push({ box:[[8,D,12],[82,D+5,18]], svg: bumperR() });
  if (!fF) behind.push({ box:[[3,-2.5,17],[W-3,0,26]], svg: bumperF() });
  s += byDepth(behind.flat());

  // box body: the serving side or the far side, the shell, the back, the strip above the cab, silhouette
  let bod = fX ? hatchSide(m) : farSide(m);
  bod += loft(on(PX(0),BOX), on(PX(W),BOX), n=>tone(n,m));
  if (fY) bod += back(m);
  if (fF) bod += boxFront();
  const kx = ease(st.xr || 0);
  bod += `<g clip-path="url(#noArch)">${hullInk([...on(PX(0),BOX), ...on(PX(W),BOX), ...(fY ? [[8,D+5,12],[82,D+5,12],[8,D+5,18]] : [])], 2.8)}</g>`;

  if (kx > 0) bod = xrGhost(bod, '', kx, BOX, 0, W, m);   // see-through: the body ghosts (its works are drawn over both ghosts below)
  // the big parts, each in its own box so they sort for any view: cab (nose at y = 0), box body, roof gear,
  // the counter ledge and the awning on the serving side (they sit outside x = W, so the body hides them from the far side)
  const th2 = AOPEN*ease(st.hatch)*Math.PI/180, aTop = Math.max(HINGE, HINGE - ALEN*Math.cos(th2)) + 4;
  const bodI = { box:[[0,BY,0],[W,D,ZT]], svg: bod }, cabI = { box:[[-8,-3,0],[W+8,BY,CABH]], svg: kx > 0 ? xrGhost(cab(m), '', kx, CAB, 0, W, m) : cab(m) };
  // see-through: both ghosts first, then the works of cab and body over them (sorted with the outside parts)
  const works = kx > 0 ? [{ box:[[0,-3,0],[W,D,ZT]], svg: `<g opacity="${f(kx)}">${byDepth([{ box:[[0,0,0],[W,BY,CABH]], svg: XR_OPTS.mechCab(st, kx) }, { box:[[0,BY,0],[W,D,ZT]], svg: XR_OPTS.mechBox(st, kx) }])}</g>` }] : [];
  if (kx > 0) s += byDepth([bodI, cabI]);
  s += byDepth([
    ...(kx > 0 ? works : [bodI, cabI]),
    { box:[[19,63,ZT],[52,208,172]], svg: roof(m) },
    { box:[[W,HY0-4,HZ0-15],[W+LEDGE,HY1+4,HZ0]], svg: kx > 0 ? `<g opacity="${f(1 - .8*kx)}">${ledge()}</g>` : ledge() },          // in see-through the ledge and
    { box:[[W,HY0-4,HZ0],[W+ALEN+2,HY1+4,aTop]], svg: kx > 0 ? `<g opacity="${f(1 - .8*kx)}">${awning(m)}</g>` : awning(m) },   // the awning cover the works: they ghost
  ]);
  return s;
}

/* ---------- behaviour ---------- */
let ui, running = false;
const freeSlot = () => [0,1,2].find(i => !st.orders.some(o => o.state === 'ready' && o.slot === i));
function step(dt){
  st.time += dt;
  let more = false;
  if (st.hatch !== st.hatchT){
    const sg = Math.sign(st.hatchT - st.hatch); st.hatch += sg*dt/1.1;
    if ((st.hatchT - st.hatch)*sg <= 0) st.hatch = st.hatchT;
    more = true;
  }
  const cur = st.orders.find(o => o.state !== 'ready');
  if (cur && lit()){
    cur.state = 'cooking'; cur.t += dt/COOK; more = true;
    if (cur.t >= 1){ cur.t = 1; cur.state = 'ready'; cur.slot = freeSlot(); ui.flash(`Order #${cur.n} is up · ${FOOD[cur.item].label.toLowerCase()} on the counter`, 1600); }
  }
  return more;
}
const kick = () => { if (running || st.frozen) return; running = true; ui.animate(dt => { const more = step(dt); if (!more) running = false; return more; }); };

function toggleHatch(){
  if (st.frozen) st.frozen = false;
  if (st.hatchT === 1){
    if (st.orders.some(o => o.state !== 'ready')) return ui.flash('Still cooking · wait for the orders');
    if (st.orders.length) return ui.flash('Hand out the food on the counter first');
  }
  st.hatchT = st.hatchT ? 0 : 1; kick();
}
function order(item){
  if (!lit()) return ui.flash(st.hatchT ? 'Opening up · one moment' : "We're closed · click the awning to open up");
  if (st.orders.length >= 3) return ui.flash('Queue is full · 3 orders max');
  st.frozen = false;
  st.orders.push({ n: st.next++, item, t: 0, state: 'queued' });
  kick();
}
function take(n){
  const i = st.orders.findIndex(o => o.n === n && o.state === 'ready');
  if (i < 0) return;
  st.orders.splice(i, 1);
  ui.flash(`Order #${n} · enjoy!`, 1800);
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

/* ---------- see-through: how a real food truck is built ----------
   The truck: the engine under the cab drives the rear wheels through the gearbox, the driveshaft and the differential;
   it burns diesel from the tank on the frame and breathes out through the exhaust and muffler. The kitchen: a propane
   tank under the floor feeds the griddle's burners and the fryer through a regulator; a generator under the floor makes
   the power for the lights, fridge, water pump and hood fan; a pump draws fresh water for the sink, which drains into
   the grey tank; the hood's fan pulls the smoke out through the roof vent.
   Parts (each held by another; fuel, gas, water, exhaust and wires each run from a real port to a real port):
   CAB     radiator with its top and bottom tanks . fan, hub and shroud . upper and lower hoses . engine block . oil pan .
           cylinder head . valve cover . exhaust manifold . crank, water-pump and alternator pulleys and the belt .
           alternator . starter . bellhousing . gearbox . battery on its tray . battery cables to the starter and frame
   DRIVE   frame rails . front and rear axles (from the chassis) . front and rear universal joints . driveshaft in two
           parts . centre bearing under its crossmember . differential
   FUEL    fuel tank (from the chassis) . filler neck to the cap . fuel line along the rail to the engine . generator fuel line
   EXHAUST down pipe . pipe along the frame . muffler . tailpipe
   GAS     propane tank . two straps and hangers . service valve . regulator . gas line up through the floor . griddle
           manifold . three valves behind the knobs . three burner tubes and their flames . fryer branch . fryer burners
   KITCHEN griddle plate on its frame . fryer: frame, vat, oil, basket . hood with filters . duct . hood fan under the
           roof vent . fridge . its condensing unit (compressor, coil, fan) behind the louvre . breaker panel . ceiling
           light strip
   WATER   sink cabinet frame . counter . basin . faucet . fresh tank . pump . supply pipe . drain with its trap . grey tank
           . dump valve
   POWER   generator under the floor . cable up the far wall and along the ceiling to the panel . panel to the lights,
           pump, fridge unit and hood fan */
const TCOP = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, TGM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' }, TSTEEL = { l:'#e3e8e9', m:'#c3cacb', d:'#8f989a' };
const ENG = matOf('#7f8c8d'), EXH = { l:'#c9a27a', m:'#a07850', d:'#6e4f30' }, PROP = matOf('#f1f1ec'), GASL = '#e2b13a', WATERC = '#7cc4ef';
const tBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - .6), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + .6)];
const tBend = (pts, r = 3) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a pipe, hose or cable as short depth-sortable pieces, flow dashes phased along the whole route
const tLine = (pts, col, w = .6, ends = false, flow = null) => { const q = tBend(pts), out = [], L = 12, t = performance.now()/1000;
  let s0 = 0;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false); let sl = 0; for (let n = 1; n < seg.length; n++) sl += Math.hypot(...seg[n].map((v, k) => v - seg[n-1][k]));
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (flow) svg += `<path d="${d}" fill="none" stroke="${flow}" stroke-width="${f(Math.max(.5, w*.7))}" stroke-linecap="round" stroke-dasharray="1.8 3.6" stroke-dashoffset="${f(s0*CAM_K - t*16)}"/>`;
    for (const e of [i === 0 && ends ? q[0] : null, j === q.length - 1 && ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.2" fill="${INK}"/>`; }
    out.push({ box: tBoxOf(seg), svg }); s0 += sl; i = j; }
  return out; };
const tPut = (L, b, svg) => L.push({ box: b, svg });
const tBx = (L, x0, y0, z0, x1, y1, z1, m, w = .8) => tPut(L, [[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
const tRod = (L, a, b, r, m, w = .7) => tPut(L, tBoxOf([a, b]).map((p, i) => p.map(v => v + (i ? r - .6 : .6 - r))), rod(a, b, r, m, toneI, w));
const tBall = (L, x, y, z, r, col, w = .8) => tPut(L, [[x - r, y - r, z - r], [x + r, y + r, z + r]], ball(x, y, z, r, col, w));
// frame posts and a bottom shelf: an open cabinet that shows what is in it
const tFrame = (L, x0, y0, z0, x1, y1, z1, m) => { for (const [x, y] of [[x0, y0], [x1 - 1.2, y0], [x0, y1 - 1.2], [x1 - 1.2, y1 - 1.2]]) tBx(L, x, y, z0, x + 1.2, y + 1.2, z1, m, .5);
  tBx(L, x0, y0, z0, x1, y1, z0 + 1, m, .5); };
const truckState = st => { const on = st.hatch === 1 && st.hatchT === 1, cooking = st.orders.some(o => o.state === 'cooking'); return { on, cooking }; };
// order parts for the current view: only pairs that overlap on screen are compared (separating axis, else depth), then a
// topological sort; a remaining loop is broken at its farthest part (LESSONS 28)
function tSort(parts){
  parts = parts.filter(Boolean); const n = parts.length;
  const sb = parts.map(p => { const b = p.box, xs = [], ys = [];
    for (const x of [b[0][0], b[1][0]]) for (const y of [b[0][1], b[1][1]]) for (const z of [b[0][2], b[1][2]]){ const q = P(x, y, z); xs.push(q[0]); ys.push(q[1]); }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });
  const dep = parts.map(p => depthOf(boxMid(p.box))), out = parts.map(() => []), indeg = parts.map(() => 0);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++){
    const a = sb[i], b = sb[j]; if (a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]) continue;
    const o = sepOrder(parts[i], parts[j]) || (dep[i] - dep[j] || 0);
    if (o < 0){ out[i].push(j); indeg[j]++; } else if (o > 0){ out[j].push(i); indeg[i]++; } }
  const done = parts.map(() => false), res = [];
  for (let c = 0; c < n; c++){
    let k = -1; for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (k < 0 || dep[i] < dep[k])) k = i;
    if (k < 0) for (let i = 0; i < n; i++) if (!done[i] && (k < 0 || dep[i] < dep[k])) k = i;
    done[k] = true; res.push(parts[k].svg); for (const j of out[k]) indeg[j]--; }
  return res.join('');
}
// a frame rail as short sections (so each sorts against what is beside it); ink only on its long edges and true ends
function railParts(x0, x1, ya, yb, z0 = 10, z1 = 16){
  const out = [], N = Math.max(1, Math.ceil((yb - ya)/18));
  for (let i = 0; i < N; i++){ const y0 = ya + (yb - ya)*i/N, y1 = ya + (yb - ya)*(i + 1)/N; let s = '';
    const F = [[[0,0,1], [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]], [[1,0,0], [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]]], [[-1,0,0], [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]]]];
    if (i === 0) F.push([[0,-1,0], [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]]); if (i === N - 1) F.push([[0,1,0], [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]]);
    for (const [nn, q] of F) if (vis(nn)){ s += face(pd(q), toneI(nn, DARK));
      if (nn[1]) s += ink(pd(q), .9); else s += line([q[0], q[1]], .9) + line([q[2], q[3]], .9); }
    out.push({ box: [[x0, y0, z0], [x1, y1, z1]], svg: s }); }
  return out;
}
function truckCabMech(st){
  const L = [], t = performance.now()/1000;
  // radiator behind the grille: core, top and bottom tanks
  { let rd = box(24, 2.5, 26, 66, 5.5, 52, TGM, toneI, .9);
    if (facing([0,-1,0])) for (let x = 26; x < 66; x += 1.6) rd += line([[x, 2.45, 26.5], [x, 2.45, 51.5]], .3);
    tPut(L, [[24, 2.5, 26], [66, 5.5, 52]], rd); }
  tBx(L, 24, 2, 52, 66, 6, 55, TGM, .7); tBx(L, 24, 2, 23, 66, 6, 26, TGM, .7);
  // fan and its hub on the water pump shaft, behind the radiator
  { const fa = .5; let fb = '';
    for (let i = 0; i < 6; i++){ const a = fa + i*Math.PI/3, R = (u, v) => [45 + u*Math.cos(a) - v*Math.sin(a), 36 + u*Math.sin(a) + v*Math.cos(a)];
      fb += shape(on(PY(7.2), [R(1.6, -.9), R(8, -2), R(8.3, 1.6), R(1.6, .9)]), '#cfd6d8', .5); }
    tPut(L, [[36.5, 6.8, 27.5], [53.5, 7.6, 44.5]], fb); }
  tRod(L, [45, 7.6, 36], [45, 10, 36], 1.6, TSTEEL, .6);
  // engine: oil pan, block, head, valve cover, exhaust manifold
  tBx(L, 36, 11, 14, 54, 24, 18, TGM, .8);
  { let bl = box(32, 10, 18, 58, 32, 40, ENG, toneI, 1.1);
    if (facing([1,0,0])) for (const y of [14, 19.5, 25]) bl += shape(on(PX(58.05), rrUV(y - 2, 21, y + 2, 37, 1)), mix(ENG.m, '#000000', .12), .4);   // cylinder bosses
    tPut(L, [[32, 10, 18], [58, 32, 40]], bl); }
  tBx(L, 33, 11, 40, 57, 31, 44, ENG, .9);
  { let vc = box(35, 12.5, 44, 55, 29.5, 47, matOf('#c2453a'), toneI, .9);
    if (facing([0,0,1])) for (const y of [15, 21, 27]) vc += fill(pd(on(PZ(47.05), ellUV(45, y, .8, .8, 8))), METAL.l);
    tPut(L, [[35, 12.5, 44], [55, 29.5, 47]], vc); }
  tBx(L, 58, 13, 30, 60.5, 29, 36, EXH, .7);
  // front of the engine: crank, water-pump and alternator pulleys, the belt, the alternator
  tRod(L, [45, 8, 22], [45, 10, 22], 3.4, TSTEEL, .6); tRod(L, [56, 8, 42], [56, 13, 42], 3, TSTEEL, .8); tRod(L, [56, 7.6, 42], [56, 8, 42], 1.8, TGM, .5);
  tPut(L, [[41.5, 8.4, 18.5], [58, 8.8, 44]], `<path d="${pd([[42.5, 8.6, 20], [45, 8.6, 18.6], [47.6, 8.6, 20.3], [57.6, 8.6, 41], [55.6, 8.6, 43.7], [43.4, 8.6, 37.6], [42.5, 8.6, 20]], true)}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`);
  // hoses: thermostat housing to the top tank, bottom tank to the water pump
  L.push(...tLine([[45, 10, 44], [45, 8.5, 48.5], [50, 5, 53]], '#3a3632', 1.1));
  L.push(...tLine([[30, 5, 24.5], [30, 8.5, 27], [34.5, 10, 30]], '#3a3632', 1.1));
  // bellhousing, gearbox, starter on the bellhousing
  tBx(L, 37, 32, 15, 53, 38, 34, ENG, .9); tBx(L, 40, 38, 12, 50, 47, 26, ENG, .9);
  tRod(L, [36, 32.5, 20], [36, 37.5, 20], 2, TGM, .6);
  // battery on its tray on the right rail, cables to the starter and to the frame
  { let bt = box(64, 38, 17, 76, 48, 27, DARK, toneI, 1);
    if (facing([0,0,1])) bt += fill(pd(on(PZ(27.05), ellUV(67, 41, 1, 1, 10))), '#e2483d') + fill(pd(on(PZ(27.05), ellUV(73, 41, 1, 1, 10))), METAL.m);
    tPut(L, [[64, 38, 16], [76, 48, 27]], bt + box(63, 37, 16, 77, 49, 17, TGM, toneI, .6)); }
  L.push(...tLine([[67, 41, 27], [67, 41, 33], [36, 41, 33], [36, 35, 22]], '#c2300a', .6, true));
  L.push(...tLine([[73, 41, 27], [73, 41, 30], [73, 50, 30], [69, 50, 14], [68, 50, 14]], '#3a3632', .6, true));
  // fuel line arrives along the left rail at the block
  L.push(...tLine([[21, 50, 9], [21, 34, 9], [26, 30, 19], [32, 28, 20]], '#3a3632', .45, true));
  // exhaust down pipe from the manifold, beside the gearbox
  L.push(...tLine([[60.5, 27, 33], [60, 34, 28], [57, 40, 14], [56, 46, 9], [56, 50, 9]], EXH.m, 1.1));
  return tSort(L);
}
function truckBoxMech(st){
  const L = [], t = performance.now()/1000, { on: live, cooking } = truckState(st);
  const H_ = '#3a3632', ON = '#ffb347';
  // ===== chassis redrawn so the drivetrain sorts with it: rails, axles, fuel tank; crossmember, driveshaft, joints, diff
  const rails = [[4, WHEELS[0]-3], [WHEELS[0]+3, WHEELS[1]-3], [WHEELS[1]+3, D-2]];
  for (const [x0, x1] of [[22, 28], [62, 68]]) for (const [y0, y1] of rails) L.push(...railParts(x0, x1, y0, y1));
  for (const p of chassis().slice(6)) L.push(p);                                          // the axles and the fuel tank
  tBx(L, 28, 110, 15, 62, 113, 16, TGM, .6);
  tBx(L, 42, 110.2, 11, 48, 112.8, 15, TGM, .6);
  tRod(L, [45, 49.5, 13], [45, 110.2, 13], 1.2, TSTEEL, .6); tRod(L, [45, 112.8, 13], [45, 177.5, 13.4], 1.2, TSTEEL, .6);
  tBall(L, 45, 48.3, 13, 1.7, '#7c8389', .6); tBall(L, 45, 178.3, 13.5, 1.7, '#7c8389', .6);
  tBall(L, 45, 184, 14, 5, '#6a6f73', 1);
  // ===== fuel: filler neck to the cap on the far side
  L.push(...tLine([[7, 150, 12], [1.2, 150, 12], [1.2, 150, 25], [0, 150, 25]], TGM.l, .9));
  // ===== exhaust: along the frame, muffler, tailpipe out at the back
  L.push(...tLine([[56, 50, 9], [56, 60, 9]], EXH.m, 1.1));
  tRod(L, [56, 60, 9], [56, 88, 9], 3.6, EXH, .9);
  for (const y of [63, 85]) L.push(...tLine([[56, y, 12.6], [56, y, 15], [62, y, 15]], TGM.m, .35));          // hangers to the rail
  L.push(...tLine([[56, 88, 9], [56, 214, 9], [56, 219, 6.5]], EXH.m, 1.1));
  // ===== propane: tank on straps outside the right rail, service valve, regulator, line up into the griddle
  tRod(L, [77, 100, 8], [77, 136, 8], 6, PROP, 1);
  for (const y of [100, 136]) tBall(L, 77, y, 8, 5.6, '#f1f1ec', .8);
  for (const y of [108, 128]){ tBx(L, 70.5, y - 1, 14, 83.5, y + 1, 14.8, TGM, .5); tBx(L, 68, y - 1, 13, 70.5, y + 1, 16, TGM, .5); }
  tRod(L, [77, 94.6, 8], [77, 91.5, 8], .9, METAL, .5);
  tBx(L, 74, 87.5, 5.5, 80, 91.5, 11, matOf('#7d8a8e'), .7);
  const gasOn = cooking ? '#fff4c2' : null;
  L.push(...tLine([[77, 89.5, 11], [77, 89.5, 14], [71, 92, 14], [71, 92, 41.5]], GASL, .6, false, live ? gasOn : null));
  // ===== griddle: frame, plate, manifold, three valves to the knobs, three burner tubes, flames while cooking
  tFrame(L, 48, 82, FLOOR, 74, 114, 46, TSTEEL);
  { let pl = box(48, 82, 46, 74, 114, 48, TGM, toneI, .9);
    if (facing([0,0,1])) pl += fill(pd([[50, 84, 48.1], [72, 84, 48.1], [72, 112, 48.1], [50, 112, 48.1]]), cooking ? '#3d3330' : '#4a4642');
    tPut(L, [[48, 82, 46], [74, 114, 48]], pl); }
  L.push(...tLine([[71, 85, 41.5], [71, 111, 41.5]], GASL, .6, false, cooking ? gasOn : null));
  for (const y of [88, 97, 106]){
    tRod(L, [71, y, 41.5], [74, y, 41.5], .5, METAL, .4);
    L.push(...tLine([[71, y + 1.4, 41.5], [70, y + 1.4, 43], [50, y + 1.4, 43]], TSTEEL.m, .7));
    if (cooking){ let fl = ''; for (let x = 52; x < 69; x += 2.4){ const h = 1.2 + .5*Math.sin(t*20 + x); fl += pd([[x - .6, y + 1.4, 43.7], [x, y + 1.4, 43.7 + h], [x + .6, y + 1.4, 43.7]]); }
      tPut(L, [[50, y + .8, 43.6], [70, y + 2, 45.6]], `<path d="${fl}" fill="#5aa8ff" stroke="#2f6fd0" stroke-width=".3"/>`); }
  }
  // ===== fryer: frame, vat, oil, basket, two burner tubes fed by a branch off the gas line
  tFrame(L, 50, 64, FLOOR, 72, 80, 46, TSTEEL);
  { let vt = box(52, 66, 32, 70, 78, 46, TSTEEL, toneI, .9);
    if (facing([0,0,1])) vt += fill(pd([[53, 67, 46.05], [69, 67, 46.05], [69, 77, 46.05], [53, 77, 46.05]]), '#d9a43a') + ink(pd([[53, 67, 46.05], [69, 67, 46.05], [69, 77, 46.05], [53, 77, 46.05]]), .5);
    tPut(L, [[52, 66, 32], [70, 78, 46]], vt); }
  tBx(L, 55, 68, 44, 66, 76, 47.5, matOf('#b9bfc0'), .5);
  tRod(L, [66, 72, 47], [73, 72, 49], .5, DARK, .5);
  for (const y of [69, 75]) L.push(...tLine([[70.5, y, 30.5], [54, y, 30.5]], TSTEEL.m, .6));
  L.push(...tLine([[71, 92, 30], [71, 72, 30], [70.5, 72, 30.5]], GASL, .55, false, live ? gasOn : null));
  L.push(...tLine([[70.5, 69, 30.5], [70.5, 75, 30.5]], GASL, .55));
  // ===== hood over the fryer and griddle, filters, duct, fan under the roof vent
  { const hd = [[42, 60, 88], [82, 60, 88], [82, 118, 88], [42, 118, 88]], tp = [[46, 62, 100], [78, 62, 100], [78, 116, 100], [46, 116, 100]];
    let h = '';
    const sides = [[hd[0], hd[1], tp[1], tp[0]], [hd[1], hd[2], tp[2], tp[1]], [hd[2], hd[3], tp[3], tp[2]], [hd[3], hd[0], tp[0], tp[3]]];
    for (const q of sides) h += fill(pd(q), '#dfe5e6', 'opacity=".38"') + ink(pd(q), .7);
    h += fill(pd(tp), '#dfe5e6', 'opacity=".38"') + ink(pd(tp), .7);
    for (let y = 66; y < 114; y += 5) h += line([[45, y, 91], [45, y + 3.5, 97]], .4);
    tPut(L, [[42, 60, 88], [82, 118, 100]], h); }
  L.push(...tLine([[46, 70, 100], [46, 70, 104], [31, 70, 104]], TSTEEL.l, 2.2));
  { let fh = cyl(26, 70, 101, 110.5, 5, TSTEEL, toneI, .9, 20); const fa = live ? t*8 : .3;
    if (facing([0,0,1])) for (let i = 0; i < 4; i++){ const a = fa + i*Math.PI/2; fh += line([[26, 70, 110.55], [26 + 4.2*Math.cos(a), 70 + 4.2*Math.sin(a), 110.55]], 1); }
    tPut(L, [[21, 65, 101], [31, 75, 110.5]], fh); }
  // ===== fridge against the back doors, its condensing unit above it behind the far-side louvre
  { let fr = box(14, 194, FLOOR, 44, 216, 96, METAL, toneI, 1);
    if (facing([0,-1,0])) fr += ink(pd(on(PY(193.9), [[15, 62], [43, 62]]), false), .7) + shape(on(PY(193.8), rrUV(37, 66, 40, 80, 1)), METAL.d, .6);
    tPut(L, [[14, 194, FLOOR], [44, 216, 96]], fr); }
  tBx(L, 4, 186, 96, 34, 210, 97, TGM, .5);
  { let cu = box(5, 188, 97, 9, 208, 106, TCOP, toneI, .7);
    if (facing([1,0,0])) for (let y = 189.5; y < 207; y += 1.5) cu += line([[9.05, y, 97.5], [9.05, y, 105.5]], .3);
    tPut(L, [[5, 188, 97], [9, 208, 106]], cu); }
  tPut(L, [[9, 193, 97], [11, 203, 106]], cylX(9.2, 10.6, 198, 101.5, 4, TGM, toneI, .6, 18));
  tPut(L, [[20, 196, 97], [28, 204, 104]], cyl(24, 200, 97, 103, 3.5, DARK, toneI, .8, 16) + cyl(24, 200, 103, 104, 2.2, DARK, toneI, .6, 12));
  // ===== breaker panel on the partition, light strip on the ceiling
  { let pn = box(8, YP, 64, 22, YP + 3, 88, matOf('#d8d2c2'), toneI, .8);
    if (facing([0,1,0])) for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) pn += shape(on(PY(YP + 3.05), rrUV(9.5 + c*3.1, 67 + r*5, 11.5 + c*3.1, 70 + r*5, .3)), live ? '#2f3438' : '#55504a', .3);
    tPut(L, [[8, YP, 64], [22, YP + 3, 88]], pn); }
  tBx(L, 43, 60, 110, 47, 210, 111.5, live ? { l:'#fffbe8', m:'#fff1c2', d:'#e8d79a' } : matOf('#e8e4da'), .5);
  // ===== sink cabinet: frame, counter with its basin, faucet; fresh tank, pump, supply, drain, grey tank below the floor
  tFrame(L, 4, 96, FLOOR, 26, 136, 48, TSTEEL);
  { let ct = box(4, 96, 48, 26, 136, 50, TSTEEL, toneI, .8);
    if (facing([0,0,1])) ct += shape([[8, 116, 50.05], [22, 116, 50.05], [22, 134, 50.05], [8, 134, 50.05]], '#8f989a', .6) + fill(pd(on(PZ(50.1), ellUV(16, 128, .9, .9, 10))), '#2f3438');
    tPut(L, [[4, 96, 48], [26, 136, 50]], ct); }
  tBx(L, 8, 116, 40, 22, 134, 48, TSTEEL, .6);
  tRod(L, [6, 121, 50], [6, 121, 58], .7, METAL, .6); tRod(L, [6, 121, 58], [14, 121, 56], .55, METAL, .5);
  { let ft = `<g opacity=".55">${box(7, 98, 20, 24, 114, 38, matOf('#dff1fa'), toneI, .8)}</g>` + `<path d="${pd([[24.05, 98.5, 20.5], [24.05, 113.5, 20.5], [24.05, 113.5, 31], [24.05, 98.5, 31]])}" fill="${WATERC}" opacity="${facing([1,0,0]) ? .7 : 0}"/>`;
    tPut(L, [[7, 98, 20], [24, 114, 38]], ft); }
  tBx(L, 8, 118, 20, 16, 124, 25, matOf('#3f7fc8'), .7);
  tPut(L, [[9, 119, 25], [15, 123, 28]], cyl(12, 121, 25, 28, 2, live ? matOf('#ff9a3a') : TGM, toneI, .6, 14));
  L.push(...tLine([[12, 114, 22], [12, 118, 22]], '#cfe9f5', .5));
  L.push(...tLine([[12, 121, 28], [12, 121, 31], [6.4, 121, 31], [6.4, 121, 50]], '#cfe9f5', .5));
  L.push(...tLine([[16, 128, 40], [16, 128, 33], [16, 131, 30.5], [16, 128, 28], [16, 128, 15]], '#d5dcdc', .9));
  { let gt = box(6, 96, 4, 20, 130, 15, matOf('#9aa39a'), toneI, .9);
    if (facing([1,0,0])) gt += `<path d="${pd([[20.05, 96.5, 4.5], [20.05, 129.5, 4.5], [20.05, 129.5, 8], [20.05, 96.5, 8]])}" fill="#7c8a72" opacity=".8"/>`;
    tPut(L, [[6, 96, 4], [20, 130, 15]], gt); }
  tRod(L, [13, 99, 4], [13, 99, 1.6], .7, TGM, .5);
  // ===== generator under the floor behind the rear axle, its fuel line, the cable up the far wall to the panel and on
  { let gn = box(29, 192, 3, 52, 214, 15, matOf('#d9b23c'), toneI, 1);
    if (facing([1,0,0])) for (let z = 5; z < 14; z += 2) gn += line([[52.05, 195, z], [52.05, 211, z]], .5);
    tPut(L, [[29, 192, 3], [52, 214, 15]], gn); }
  L.push(...tLine([[14, 164, 7], [16, 168, 7], [16, 196, 7], [29, 198, 7]], '#3a3632', .45, true));
  L.push(...tLine([[29, 206, 8], [6, 206, 8], [6, 206, 19], [5, 206, 22], [5, 206, 109], [5, 56, 109], [5, 56, 84], [8, 56, 84]], live ? ON : H_, .55, true));
  L.push(...tLine([[18, YP + 3, 88], [18, 57, 110], [45, 57, 110], [45, 60, 110.6]], live ? ON : H_, .4));
  L.push(...tLine([[15, YP + 3, 88], [15, 58, 104], [15, 70, 104], [21, 70, 104]], live ? ON : H_, .4));
  L.push(...tLine([[12, YP + 3, 88], [12, 57, 108], [8, 60, 108], [8, 190, 108], [8, 190, 106]], live ? ON : H_, .4));
  L.push(...tLine([[10, YP + 3, 64], [5, 58, 60], [5, 58, 21.5], [5, 121, 21.5], [8, 121, 22.5]], live ? ON : H_, .4));
  return tSort(L);
}
const TRUCK_INSIDE = st => [
  { at:[45, 21, 47], text:'ENGINE', on: false },
  { at:[50, 42, 26], text:'GEARBOX', on: false },
  { at:[45, 140, 13], text:'DRIVESHAFT', on: false },
  { at:[7, 150, 10], text:'FUEL TANK', on: false },
  { at:[70, 43, 27], text:'BATTERY', on: false },
  { at:[83, 118, 8], text:'PROPANE TANK', on: truckState(st).on },
  { at:[50, 97, 43], text:'BURNERS', on: truckState(st).cooking },
  { at:[61, 72, 46], text:'FRYER', on: truckState(st).on },
  { at:[40, 203, 15], text:'GENERATOR', on: truckState(st).on },
  { at:[26, 70, 110.5], text:'HOOD FAN', on: truckState(st).on },
  { at:[24, 106, 38], text:'WATER TANKS', on: false } ];
const XR_CAPTION = st => { const { on, cooking } = truckState(st);
  if (cooking) return 'Cooking: propane runs from the tank through the regulator to the griddle’s burners and the fryer, and the hood fan pulls the smoke out through the roof vent.';
  if (on) return 'Open: the generator under the floor powers the lights, fridge, water pump and hood fan. The pump draws fresh water for the sink, which drains into the grey tank.';
  return 'Parked: the engine under the cab drives the rear wheels through the gearbox, the driveshaft and the differential, on diesel from the tank on the frame.';
};
const XR_OPTS = { getSt: () => { try { return ui.st; } catch (e) { return {}; } }, B: [0, W + 30, 0, D, 0, 158],
  mechCab: (st, k) => truckCabMech(st),
  mechBox: (st, k) => truckBoxMech(st),
  mech: () => '',
  inside: TRUCK_INSIDE,
  surface: st => facing([1,0,0]) ? [ { at:[W, (HY0 + HY1)/2, HZ1], text:'SERVING HATCH', on: false }, { at:[W + LEDGE, SLOTS[1], HZ0], text:'COUNTER', on: false },
    { at:[W, WHEELS[0], WZ + WR], text:'WHEEL', on: false }, { at:[W, 25, CABH - 10], text:'CAB', on: false } ] : [] };

XR_OPTS.inline = true;
scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'13', title:'Food truck', hint:'lift the awning, order from the menu board, grab your food',
  idea:"A whole little kitchen fits in a van because everything is in one line: grill, counter, window.",
  size:[W+30, D+5, 158], palette:'mustard', state:st, views:true, turn:'full',
  scene: (st, m) => scene(st, m),
  readout: st => {
    if (st.hatch !== st.hatchT) return st.hatchT ? 'Opening up…' : 'Closing up…';
    if (st.hatch === 0) return 'Closed · click the awning to open the hatch';
    const c = st.orders.find(o => o.state === 'cooking'), q = st.orders.filter(o => o.state === 'queued').length;
    const r = st.orders.filter(o => o.state === 'ready');
    if (c) return `Cooking order #${c.n} · ${FOOD[c.item].label.toLowerCase()} ${Math.round(c.t*100)}%` + (q ? ` · ${q} waiting` : '') + (r.length ? ` · #${r[0].n} ready` : '');
    if (r.length) return `Order #${r[0].n} ready · click the ${FOOD[r[0].item].label.toLowerCase()} on the counter`;
    return '● Open · pick a dish from the menu board';
  },
  buttonsLabel:'Truck',
  buttons:[
    { label:'Open the hatch', onClick: () => st.hatchT ? ui.flash("We're open · place an order") : toggleHatch() },
    { label:'Order food', choices: () => [['taco','Taco $3'],['burrito','Burrito $7'],['nachos','Nachos $5']].map(([k,l]) => ({ label:l, disabled: !lit() || st.orders.length >= 3, onClick: () => order(k) })) },
    { label:'Take your food', onClick: () => { const o = st.orders.find(o => o.state === 'ready'); o ? take(o.n) : ui.flash(st.orders.length ? 'Still cooking…' : 'Order something first'); } },
    { label:'Close the hatch', onClick: () => st.hatchT ? toggleHatch() : ui.flash('Already closed') },
  ],
  next: st => st.hatch !== st.hatchT ? -1 : !st.hatchT ? 0 : st.orders.some(o => o.state === 'ready') ? 2 : st.orders.length ? -1 : 1,
  acts:{ awning: toggleHatch, order: (st, a) => order(a.dataset.item), take: (st, a) => take(+a.dataset.n) },
  params:(st, q) => {
    const items = k => (q.get(k) || '').split(',').filter(v => FOOD[v]);
    const ready = items('ready'), cooking = items('order');
    if (q.get('open') === '1' || ready.length || cooking.length) st.hatch = st.hatchT = 1;
    ready.slice(0,3).forEach((item, i) => st.orders.push({ n: st.next++, item, t: 1, state: 'ready', slot: i }));
    cooking.slice(0, 3 - st.orders.length).forEach(item => st.orders.push({ n: st.next++, item, t: 0, state: 'queued' }));
    if (q.has('hatch') && !st.orders.length) st.hatch = st.hatchT = Math.min(1, Math.max(0, +q.get('hatch')));
    const first = st.orders.find(o => o.state === 'queued');
    if (first && q.has('t')){ first.state = 'cooking'; first.t = Math.min(.99, Math.max(0, +q.get('t'))); st.frozen = true; st.time = 1.3; }
  },
});
kick();

xrMount(() => ui, XR_CAPTION);