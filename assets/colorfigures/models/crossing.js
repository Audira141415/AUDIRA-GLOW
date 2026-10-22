/* Pedestrian crossing, ported from Colorfigures 2.0 (kids/crossing.js) to the 1.0 engine with the free camera.
   Road runs along x; cars drive toward -x in the near lane (we see their backs and brake lights from the default view).
   Sidewalk at low y with yellow tactile tiles where people wait; far kerb at high y.
   The pole stands at the corner: car light faces +x (STOP / SLOW DOWN / GO sign), walk signal faces +y (WAIT / WALK),
   WAIT button box on the pole facing +x. */
const RX = 170, Y0 = 50, Y1 = 130, RZ = 3;                         // road: x 0..170, y 50..130, top at z 3
const POLE_X = 88, POLE_Y = 40, POLE_H = 164;                      // the pole
const LAMP = { r:['#ff3b2b','#5a2622'], a:['#ffb21f','#5a4620'], g:['#35d866','#1f3f29'] };   // [lit, dark]
const CARSIGN = { g:['GO','#2fb457'], a:['SLOW DOWN','#e89a12'], r:['STOP','#e0392b'], ra:['STOP','#e0392b'] };
const PLATE = { l:'#ddd8ca', m:'#cbc5b7', d:'#b9b3a4' }, ASPH = { l:'#46413c', m:'#38342f', d:'#2a2724' };
const HOUSING = { l:'#46413c', m:'#38342f', d:'#2a2724' };
const POLE_M = { l:'#8a9095', m:'#7b8186', d:'#5b6064' }, POLE_D = { l:'#55595d', m:'#474b4f', d:'#35383b' };
const TIRE = { l:'#3a3330', m:'#2b2523', d:'#1e1918' };
const MONO = 'ui-monospace,Menlo,monospace';

/* ---------- helpers ---------- */
// a box with its own colour: top a little lighter, sides shaded by the light (every face only when it faces the viewer)
function blk(x0,y0,z0,x1,y1,z1,col,w=.9,sil=1.3){
  const m = { l:col, m:mix(col,'#000000',.12), d:mix(col,'#000000',.24) }, top = mix(col,'#ffffff',.3);
  const F = [
    [[0,1,0],  [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]],
    [[1,0,0],  [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]]],
    [[0,-1,0], [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]],
    [[-1,0,0], [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]]],
    [[0,0,1],  [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]] ];
  return F.filter(([n]) => vis(n)).map(([n,q]) => shape(q, n[2] ? top : tone(n,m), w)).join('') + hullInk(corners(x0,y0,z0,x1,y1,z1), sil);
}
const corners = (x0,y0,z0,x1,y1,z1) => [x0,x1].flatMap(a => [y0,y1].flatMap(b => [z0,z1].map(c => [a,b,c])));
const slab = (x0,y0,z0,x1,y1,z1,m,w=2.2) => box(x0,y0,z0,x1,y1,z1,m,tone,.9) + hullInk(corners(x0,y0,z0,x1,y1,z1), w);
// a face plane as (u,v) -> 3D, u to the right and v down as seen from outside the face (like the 2.0 SIDE / FRONT planes)
const carF  = (u,v) => [103.3, 53 - u, 160 - v];                  // +x face of the car light
const walkF = (u,v) => [80 + u, 55.3, 102 - v];                   // +y face of the walk signal
const btnF  = (u,v) => [79.9, 43.5 - u, 26 - v];                  // -x face of the button box (faces the waiting people), read from that side
const onF = (F, uv) => uv.map(([u,v]) => F(u,v));
const circF = (F, u, v, r, n=24) => onF(F, ellUV(u, v, r, r, n));
const txF = (F, u, v, str, size, col, weight=800) => { const o = F(u,v), a = F(u+1,v), b = F(u,v+1);
  return `<text transform="${txM(P(...o), Dv(...sub(a,o)), Dv(...sub(b,o)))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="${MONO}" font-weight="${weight}" letter-spacing=".02em">${str}</text>`; };
const segsF = (F, segs, tf, col, w) => segs.map(s => `<path d="${pd(s.map(([a,b]) => F(...tf(a,b))), false)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');

// Painter's order for the current camera: every pair of parts whose boxes are split by an axis plane is ordered by
// which side of that plane the viewer is on (a separating plane is always right); the rest fall back to depth.
// Break a drawing-order loop properly: find the groups of parts that order each other in a circle (strongly connected
// components of the remaining graph), take a group nothing else still has to come before, and draw its farthest part.
// (Picking the farthest part of everything left pulled a low button box out before the pole it sits in front of.)
function breakLoop(done, after, dep){
  const n = done.length, idx = new Array(n).fill(-1), low = new Array(n).fill(0), on = new Array(n).fill(false), comp = new Array(n).fill(-1), stack = [];
  let t = 0, c = 0;
  const visit = v => { idx[v] = low[v] = t++; stack.push(v); on[v] = true;
    for (const w of after[v]){ if (done[w]) continue; if (idx[w] < 0){ visit(w); low[v] = Math.min(low[v], low[w]); } else if (on[w]) low[v] = Math.min(low[v], idx[w]); }
    if (low[v] === idx[v]){ let w; do { w = stack.pop(); on[w] = false; comp[w] = c; } while (w !== v); c++; } };
  for (let v = 0; v < n; v++) if (!done[v] && idx[v] < 0) visit(v);
  const fed = new Array(c).fill(false);
  for (let v = 0; v < n; v++) if (!done[v]) for (const w of after[v]) if (!done[w] && comp[w] !== comp[v]) fed[comp[w]] = true;
  let best = -1;
  for (let v = 0; v < n; v++) if (!done[v] && !fed[comp[v]] && (best < 0 || dep[v] < dep[best])) best = v;
  return best;
}
function sortParts(parts){
  parts = parts.filter(Boolean);
  const V = [depthOf([1,0,0]), depthOf([0,1,0]), depthOf([0,0,1])], n = parts.length, E = .01;
  const after = Array.from({length:n}, () => []), indeg = new Array(n).fill(0);
  const rel = (A, B) => { for (let i = 0; i < 3; i++){ if (Math.abs(V[i]) < 1e-6) continue;
      if (A.b[i+3] <= B.b[i] + E) return V[i] > 0 ? 1 : -1;        // B is on the + side of A along axis i
      if (B.b[i+3] <= A.b[i] + E) return V[i] > 0 ? -1 : 1; }
    return 0; };
  // only parts that overlap on screen are ordered against each other: an order between parts that don't touch on
  // screen is meaningless and creates loops (pole < WAIT box < walk signal < pole), which the fallback then breaks wrongly
  const scr = parts.map(p => { const xs = [], ys = []; for (const x of [p.b[0], p.b[3]]) for (const y of [p.b[1], p.b[4]]) for (const z of [p.b[2], p.b[5]]){ const q = P(x, y, z); xs.push(q[0]); ys.push(q[1]); }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });
  const touch = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++){ if (!touch(scr[i], scr[j])) continue; const r = rel(parts[i], parts[j]);
    if (r > 0){ after[i].push(j); indeg[j]++; } else if (r < 0){ after[j].push(i); indeg[i]++; } }
  const dep = parts.map(p => depthOf([(p.b[0]+p.b[3])/2, (p.b[1]+p.b[4])/2, (p.b[2]+p.b[5])/2]));
  const done = new Array(n).fill(false), out = [];
  for (let k = 0; k < n; k++){
    let best = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (best < 0 || dep[i] < dep[best])) best = i;
    if (best < 0) best = breakLoop(done, after, dep);   // a loop: break it inside the loop only
    done[best] = true; out.push(parts[best].svg); for (const j of after[best]) indeg[j]--;
  }
  return out.join('');
}

/* ---------- ground: sidewalk, road, far kerb, tactile tiles, paint ---------- */
function tiles(x0, x1, y0, y1){
  let s = shape([[x0,y0,6],[x1,y0,6],[x1,y1,6],[x0,y1,6]], '#f2c230', .9);
  for (let x = x0 + 2.5; x <= x1 - 2; x += 4) for (let y = y0 + 2; y <= y1 - 2; y += 3.5)
    s += shape([[x,y,6],[x+1.2,y,6],[x+1.2,y+1.2,6],[x,y+1.2,6]], mix('#f2c230','#ffffff',.32), .5);
  return s;
}
const paint = pts => shape(pts, '#f6f2e6', .6);
function groundParts(){
  let road = slab(0,Y0,0, RX,Y1,RZ, ASPH);
  for (let y = 53; y < 126; y += 16) road += paint([[48,y,RZ],[84,y,RZ],[84,y+9,RZ],[48,y+9,RZ]]);       // zebra
  road += paint([[91,92,RZ],[93.5,92,RZ],[93.5,127,RZ],[91,127,RZ]]);                                     // stop line
  for (const x of [100, 122, 144, 4, 26]) road += paint([[x,89,RZ],[x+12,89,RZ],[x+12,91,RZ],[x,91,RZ]]); // lane dashes
  return [
    { b:[0,0,0, RX,Y0,6], svg: slab(0,0,0, RX,Y0,6, PLATE) + tiles(50, 84, 37, 49) },       // sidewalk (kerb 3 above the road)
    { b:[0,Y0,0, RX,Y1,RZ], svg: road },
    { b:[0,Y1,0, RX,Y1+14,6], svg: slab(0,Y1,0, RX,Y1+14,6, PLATE) + tiles(50, 84, 131, 136) },   // far kerb
  ];
}

/* ---------- the pole, its signals and the WAIT button ---------- */
const STAND = [[[8,6.4],[8,10.2]], [[8,7.2],[6.1,9.6]], [[8,7.2],[9.9,9.6]], [[8,10.2],[6.8,13.2]], [[8,10.2],[9.2,13.2]]];
const WALK  = [[[8.4,6.2],[7.6,9.8]], [[8.2,7.1],[10.4,8.9]], [[8.2,7.1],[5.9,8.5]], [[7.6,9.8],[10.2,13.2]], [[7.6,9.8],[5.4,12.9]]];
function manPict(segs, head, col, dv){                              // a pictogram in a 16x16 lens, scaled 1.3 about its centre
  const tf = (a,b) => [8 + (a-8)*1.3, 8.4 + (b-8.6)*1.3 + dv];
  const h = tf(...head);
  return fill(pd(circF(walkF, h[0], h[1], 1.5*1.3, 14)), col) + segsF(walkF, segs, tf, col, 1.25);
}
function poleParts(st, m){
  const parts = [];
  // pole: three sections (beside the button / beside the walk signal / beside the car signal). A 160-unit pole sorted
  // as one box is compared with everything at every height, which makes loops (box < walk signal < car signal < pole);
  // each section is only compared with the parts actually beside it.
  const shaft = (z0, z1) => { const A = on(PZ(z0), ellUV(POLE_X, POLE_Y, 2.6, 2.6, 24)), B = on(PZ(z1), ellUV(POLE_X, POLE_Y, 2.6, 2.6, 24));
    const t = YAW * Math.PI / 180, rx = 2.6 * Math.sin(t), ry = -2.6 * Math.cos(t);   // the shaft's left and right edges on screen
    return loft(A, B, n => tone(n, POLE_M)) + ink(pd([[POLE_X + rx, POLE_Y + ry, z0], [POLE_X + rx, POLE_Y + ry, z1]], false), 1.4)
                                            + ink(pd([[POLE_X - rx, POLE_Y - ry, z0], [POLE_X - rx, POLE_Y - ry, z1]], false), 1.4); };
  parts.push({ b:[POLE_X-4.2,POLE_Y-4.2,6, POLE_X+4.2,POLE_Y+4.2,11], svg: cyl(POLE_X,POLE_Y,6,11,4.2,POLE_D,tone,1.2) });   // base collar, below the button
  parts.push({ b:[POLE_X-2.6,POLE_Y-2.6,11, POLE_X+2.6,POLE_Y+2.6,40], svg: shaft(11, 40) });
  parts.push({ b:[POLE_X-2.6,POLE_Y-2.6,40, POLE_X+2.6,POLE_Y+2.6,104], svg: shaft(40, 104) });
  parts.push({ b:[POLE_X-2.6,POLE_Y-2.6,104, POLE_X+2.6,POLE_Y+2.6,166], svg: shaft(104, POLE_H) + cyl(POLE_X,POLE_Y,POLE_H,POLE_H+1.5,3.4,POLE_D,tone,1.1) });

  // WAIT button box: strapped to the pole at hand height (button ~1.1 m; a person here is ~19 units = 1.7 m), on the
  // side facing the people waiting at the kerb (-x), so they can reach it
  const bm = { l:m.m, m:mix(m.m,m.d,.22), d:mix(m.m,m.d,.45) };
  let bs = box(80.2,36.5,14, 85.4,43.5,26, bm, tone, .9) + hullInk(corners(80.2,36.5,14, 85.4,43.5,26), 1.4);
  if (vis([-1,0,0])){
    const pressed = performance.now() - st.pressT < 260;
    bs += shape(onF(btnF, rrUV(.8,1.1,6.2,4.6,.8)), st.wait ? '#ffc23a' : '#3a3532', .7);
    bs += txF(btnF, 3.5, 3.6, 'WAIT', 1.8, st.wait ? INK : '#6b625a', 800);
    bs += txF(btnF, 3.5, 11.2, 'PUSH', 1.5, INK, 800);
    bs += pressed ? cylX(79.8, 80.2, 40, 18.6, 1.85, matOf('#ff8a3a'), tone, .9) : cylX(79.1, 80.2, 40, 18.6, 1.85, matOf('#e2473a'), tone, .9);
  }
  parts.push({ b:[79.1,36.5,14, 85.4,43.5,26], svg: act('wait', bs) });

  // walk signal facing +y (x 80..96, y 43..55, z 64..102)
  parts.push({ b:[86,POLE_Y+2.6,84, 89,43,87], svg: blk(86,39.8,84, 89,43,87,'#55595d',.7,1) });
  let ws = box(80,43,64, 96,55,102, HOUSING, tone, .9) + hullInk(corners(80,43,64, 96,55,102), 2);
  if (vis([0,1,0])){
    const redOn = st.man === 'r', grnOn = st.man === 'g' && st.blinkOn;
    const pedSign = st.man === 'g' ? ['WALK', '#2fb457'] : ['WAIT', '#e0392b'];
    if (redOn) ws += fill(pd(circF(walkF, 8, 8, 13)), 'url(#cx-hl-r)');
    if (grnOn) ws += fill(pd(circF(walkF, 8, 23, 13)), 'url(#cx-hl-g)');
    ws += shape(onF(walkF, rrUV(1,1,15,15,1.6)), '#1d1a18', .9) + manPict(STAND, [8,4.6], redOn ? '#ff4a3a' : '#55251f', 0);
    ws += shape(onF(walkF, rrUV(1,16,15,30,1.6)), '#1d1a18', .9) + manPict(WALK, [8.7,4.4], grnOn ? '#46e06e' : '#1f3a27', 15);
    ws += shape(onF(walkF, rrUV(1,31,15,37,1.2)), pedSign[1], .8) + txF(walkF, 8, 35.4, pedSign[0], 3.8, '#ffffff', 900);
  }
  parts.push({ b:[80,43,64, 96,55,102], svg: ws });

  // car light facing +x (x 92..103, y 27..53, z 104..160): three big lamps + a sign
  parts.push({ b:[POLE_X+2.6,38,138, 92,42,141], svg: blk(89.8,38,138, 92,42,141,'#55595d',.7,1) });
  let cs = box(92,27,104, 103,53,160, HOUSING, tone, .9) + hullInk(corners(92,27,104, 103,53,160), 2.2);
  if (vis([1,0,0])){
    const lit = c => st.car === c || (st.car === 'ra' && (c === 'r' || c === 'a')), sg = CARSIGN[st.car];
    ['r','a','g'].forEach((c, i) => { const cy = 9 + i*15.5, on = lit(c);
      if (on) cs += fill(pd(circF(carF, 13, cy, 14)), `url(#cx-hl-${c})`);
      cs += shape(circF(carF, 13, cy, 6.6), LAMP[c][on ? 0 : 1], 1);
      if (on) cs += fill(pd(circF(carF, 13, cy, 3.2, 16)), '#ffffff', 'opacity=".45"');
      const arc = Array.from({length:7}, (_,k) => { const a = (-143 + 65*k/6)*Math.PI/180; return [13 + 4.8*Math.cos(a), cy + 4.8*Math.sin(a)]; });
      cs += `<path d="${pd(onF(carF, arc), false)}" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity="${on ? .8 : .3}"/>`;
    });
    cs += shape(onF(carF, rrUV(1.2,48,24.8,54.6,1.3)), sg[1], .8);
    cs += txF(carF, 13, 52.9, sg[0], sg[0].length > 4 ? 3.6 : 4.4, '#ffffff', 900);
  }
  parts.push({ b:[92,27,104, 103,53,160], svg: cs });
  return parts;
}

/* ---------- cars ---------- */
const CL = 24, CAR_Y0 = 101, CAR_Y1 = 117;
// a little car, front at x = c.x, driving toward -x; its back (x-max) has the brake lights
function carSvg(c){
  const cx = c.x, y0 = CAR_Y0, y1 = CAR_Y1, z = RZ, wz = z + 3.6, nearY = vis([0,1,0]);
  const wheel = (y, ya, yb, out) => [cx+5, cx+19].map(wx => rod([wx,ya,wz],[wx,yb,wz],3.6,TIRE,tone,1)
    + (vis([0,out,0]) ? shape(on(PY(out > 0 ? yb + .02 : ya - .02), ellUV(wx, wz, 1.9, 1.9, 14)), '#c9cdcf', .6) : '')).join('');
  const farW = wheel(0, y0-1.4, y0, -1), nearW = wheel(0, y1, y1+1.5, 1);
  let s = nearY ? farW : nearW;
  s += blk(cx, y0, z+2.5, cx+CL, y1, z+10, c.col, .9, 1.6);
  s += blk(cx+5, y0+1.5, z+10, cx+18, y1-1.5, z+16.5, c.col, .9, 1.3);
  const winY = (y, a, b) => shape([[a,y,z+11.2],[b,y,z+11.2],[b,y,z+15.4],[a,y,z+15.4]], '#e3eaec', .8);
  if (vis([0,1,0])) s += winY(y1-1.4, cx+6.5, cx+11) + winY(y1-1.4, cx+12, cx+16.6);
  if (vis([0,-1,0])) s += winY(y0+1.4, cx+6.5, cx+11) + winY(y0+1.4, cx+12, cx+16.6);
  const winX = x => shape([[x,y0+2.5,z+11],[x,y1-2.5,z+11],[x,y1-2.5,z+15.4],[x,y0+2.5,z+15.4]], '#e3eaec', .8);
  if (vis([1,0,0])){
    s += winX(cx+18.1);                                                       // rear window
    const tl = c.brake ? '#ff2a1a' : '#7a2620';
    for (const [a, b] of [[y0+1.2, y0+4.4], [y1-4.4, y1-1.2]]){
      if (c.brake){ const q = P(cx+CL, (a+b)/2, z+7.2); s += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="4.2" fill="#ff3a22" opacity=".35"/>`; }
      s += shape([[cx+CL+.1,a,z+6],[cx+CL+.1,b,z+6],[cx+CL+.1,b,z+8.5],[cx+CL+.1,a,z+8.5]], tl, .7);
    }
  }
  if (vis([-1,0,0])){
    s += winX(cx+4.9);                                                        // windscreen
    for (const [a, b] of [[y0+1.2, y0+4.4], [y1-4.4, y1-1.2]])
      s += shape([[cx-.1,a,z+6],[cx-.1,b,z+6],[cx-.1,b,z+8.5],[cx-.1,a,z+8.5]], '#fff4c8', .7);
  }
  s += nearY ? nearW : farW;
  const op = Math.max(0, Math.min(1, (cx + CL + 4) / 22, (192 - cx) / 22));
  return op < 1 ? `<g opacity="${op.toFixed(2)}">${s}</g>` : s;
}

/* ---------- people ---------- */
const groundZ = y => y < Y0 - 1 ? 6 : y > Y1 + 1 ? 6 : y < Y0 + 1 ? 6 - 1.5*(y - Y0 + 1) : y > Y1 - 1 ? RZ + 1.5*(y - Y1 + 1) : RZ;
// a little person: legs (two poses), body block, arms, round faceless head
function personSvg(p){
  const z = groundZ(p.y) + (p.walking ? 0.8 * Math.abs(Math.sin(p.dist * Math.PI / 3.2)) : 0);
  const sw = p.walking ? (Math.floor(p.dist / 3.2) % 2 ? 1.9 : -1.9) : 0, [dx, dy] = p.dir;
  const strk = (pts, col, w) => `<path d="${pd(pts, false)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const leg = (o, k) => strk([[p.x + o, p.y, z+6], [p.x + o + dx*sw*k, p.y + dy*sw*k, z+.4]], '#3a322d', 1.5);
  const arm = sgn => strk([[p.x + 2.6*sgn, p.y, z+11.5], [p.x + 2.8*sgn + sgn*dx*sw*.7, p.y + sgn*dy*sw*.7, z+7.5]], p.col, 1.3);
  const nearX = depthOf([1,0,0]) > 0 ? 1 : -1;
  let s = leg(-1.1, 1) + leg(1.1, -1) + arm(-nearX);
  s += blk(p.x-2.2, p.y-1.6, z+5.6, p.x+2.2, p.y+1.6, z+12.6, p.col, .7, 1);
  s += arm(nearX);
  const h = P(p.x, p.y, z + 15.6);
  s += `<circle cx="${f(h[0])}" cy="${f(h[1])}" r="3.1" fill="${p.skin}" stroke="${INK}" stroke-width=".9"/>`;
  const op = Math.max(0, Math.min(1, (p.x + 12) / 18));
  return { b:[p.x-3.6, p.y-2.4, z, p.x+3.6, p.y+2.4, z+18.7], svg: op < 1 ? `<g opacity="${op.toFixed(2)}">${s}</g>` : s };
}

/* ---------- state + simulation ---------- */
const STOPX = 95, GAP = 4, VMAX = 46, BRAKE = 21, ACC = 26;
const cars = [ { x:24, col:'#3e86d9' }, { x:98, col:'#8b62d1' }, { x:172, col:'#22a58a' } ].map(c => ({ ...c, v:VMAX, go:false, brake:false }));
const SKIN = ['#f1c7a1', '#c98f62', '#8a5a3c'], SHIRT = ['#ef6f9a', '#4a9be0', '#f08a3c'];
const HOME = [[53,42],[62.5,45],[71,40.5]];   // waiting on the tactile paving, a step back from the WAIT box (its face is at x 79)
let people = HOME.map((h, i) => ({ x:h[0], y:h[1], col:SHIRT[i], skin:SKIN[i], path:[], spd:0, dist:i*1.3, walking:false, dir:[0,1], gone:false }));

function simulate(st, dt){
  const green = st.car === 'g';
  for (const c of cars){
    if (green) c.go = false;
    let room = Infinity;
    if (!green && !c.go && c.x > STOPX - .5){
      const d = c.x - STOPX, need = c.v * c.v / (2 * Math.max(d, .01));
      if (st.car === 'a' && need > 60 && d < 30) c.go = true;     // too close to stop safely on amber: carry on
      else room = d;
    }
    const ahead = cars.filter(o => o !== c && o.x < c.x).sort((a, b) => b.x - a.x)[0];
    if (ahead) room = Math.min(room, c.x - (ahead.x + CL + GAP));
    const want = Math.min(VMAX, Math.sqrt(2 * BRAKE * Math.max(0, room - .3)));
    const v0 = c.v;
    c.v = c.v > want ? Math.max(want, c.v - 90 * dt) : Math.min(want, c.v + ACC * dt);
    c.brake = c.v < v0 - .05 || (c.v < 1 && room < 8);           // brake lights only while slowing or standing
    c.x -= c.v * dt;
    if (c.x < -CL - 14){                                           // drove off: come back at the far end
      const back = Math.max(...cars.filter(o => o !== c).map(o => o.x));
      c.x = Math.max(196, back + CL + 30); c.go = false;
    }
  }
  for (const p of people){
    if (!p.path.length){ p.walking = false; continue; }
    const [tx, ty] = p.path[0], ddx = tx - p.x, ddy = ty - p.y, Ln = Math.hypot(ddx, ddy), step = p.spd * dt;
    p.walking = true; if (Ln > .01) p.dir = [ddx / Ln, ddy / Ln];
    if (Ln <= step){ p.x = tx; p.y = ty; p.path.shift(); p.dist += Ln; if (!p.path.length){ p.walking = false; if (p.x < -10) p.gone = true; } }
    else { p.x += p.dir[0] * step; p.y += p.dir[1] * step; p.dist += step; }
  }
  people = people.filter(p => !p.gone);
}

/* ---------- the cycle ---------- */
let au = null;
function getAudio(){
  if (au) return au;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const ctx = new AC(), out = ctx.createGain(); out.gain.value = 1; out.connect(ctx.destination);
  return au = { ctx, out };
}
function beep(fq = 1050, ms = 60, vol = .05){
  if (!au) return; const { ctx, out } = au, t = ctx.currentTime, d = ms / 1000;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = fq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.setValueAtTime(vol, t + d); g.gain.linearRampToValueAtTime(0, t + d + .012);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .03);
}
const after = (ms, fn) => setTimeout(fn, ms);
function press(st, user){
  if (user){ st.pressT = performance.now(); try { getAudio(); if (au && au.ctx.state === 'suspended') au.ctx.resume(); } catch (e) { au = null; } }
  if (st.busy) return;                                           // already got a turn: the lights keep their order
  st.busy = true; st.wait = true; beep(700, 50);
  after(1200, () => { st.car = 'a'; });                          // amber: slow down
  after(4200, () => { st.car = 'r'; });                          // red: stop at the line
  after(5900, () => { st.man = 'g'; st.wait = false;             // green man: walk
    people.forEach((p, i) => after(i * 280, () => { p.spd = 21 + i * 1.5; p.path = [[p.x, 137 - i * .8], [-16, 138 + i * 1.5]]; })); });
  for (let b = 0; b < 9; b++) after(5900 + b * 560, () => beep(b % 2 ? 1050 : 1250));
  for (let b = 0; b < 10; b++) after(10900 + b * 260, () => { st.blinkOn = b % 2 === 1; if (st.blinkOn) beep(1250, 40); });   // hurry
  after(13500, () => { st.man = 'r'; st.blinkOn = true;          // red man; new people stroll up to the kerb
    HOME.forEach((h, i) => after(i * 700, () => people.push({ x:-14, y:h[1] - 3, col:SHIRT[(i + 1) % 3], skin:SKIN[(i + 2) % 3],
      path:[[h[0] - 4, h[1] - 3], [h[0], h[1]]], spd:20, dist:0, walking:false, dir:[1,0], gone:false }))); });
  after(14600, () => { st.car = 'ra'; });                         // red + amber: get ready
  after(15700, () => { st.car = 'g'; st.busy = false;             // green: go
    if (st.auto) after(4500, () => { if (st.auto) press(st, false); }); });
}
function toggleAuto(st){
  st.auto = !st.auto;
  const b = [...document.querySelectorAll('.act')].find(x => /^Auto/.test(x.textContent));
  if (b) b.textContent = `Auto cycle: ${st.auto ? 'on' : 'off'}`;
  if (st.auto && !st.busy) press(st, false);
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
function xrMount(getUI, caption, opt = {}){   // opt.labelsOnly: only the Labels switch, no see-through
  const ui = getUI(), q = new URLSearchParams(location.search), html = document.documentElement;
  if (q.get('labels') !== '1') html.classList.add('nolabels');
  if (ui.st.xr == null){ ui.st.xr = 0; ui.st.xrT = 0; }
  if (q.get('xr') === '1' && !opt.labelsOnly) ui.st.xr = ui.st.xrT = 1;
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
  const cap = document.createElement('p'); cap.className = 'mcap'; if (!opt.labelsOnly) document.querySelector('.stage').after(cap);
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

/* ---------- labels (this figure has no see-through: the Labels switch only) ---------- */
function streetLabels(st){
  return xrCallouts([
    { at: [103, 40, 150], text: 'CAR SIGNAL', on: false }, { at: [96, 49, 90], text: 'WALK SIGNAL', on: st.man === 'g' },
    { at: [80, 40, 20], text: 'WAIT BUTTON', on: !!st.wait }, { at: [92, 110, RZ], text: 'STOP LINE', on: false },
    { at: [66, 90, RZ], text: 'ZEBRA CROSSING', on: st.man === 'g' }, { at: [67, 43, 6], text: 'TACTILE PAVING', on: false } ], [0, RX, 0, Y1 + 14, 0, POLE_H]);
}
/* ---------- scene ---------- */
function scene(st, m){
  const defs = `<defs>${['r','a','g'].map(c => `<radialGradient id="cx-hl-${c}"><stop offset="0" stop-color="${LAMP[c][0]}" stop-opacity=".75"/><stop offset=".45" stop-color="${LAMP[c][0]}" stop-opacity=".35"/><stop offset="1" stop-color="${LAMP[c][0]}" stop-opacity="0"/></radialGradient>`).join('')}</defs>`;
  const ground = groundParts();
  return defs + sortParts([
    ...ground,
    ...poleParts(st, m),
    ...cars.map(c => ({ b:[c.x, CAR_Y0-1.4, RZ, c.x+CL+.1, CAR_Y1+1.5, RZ+16.5], svg: carSvg(c) })),
    ...people.map(personSvg),
  ]) + streetLabels(st);
}

const ui = mountFigure({
  fig:'08', turn:'full', title:'Traffic light', hint:'Press WAIT (or space) to cross',
  idea:'Red means stop, amber means slow down, green means go — and the green walking man means it is safe to cross.',
  size:[RX, Y1 + 14, 108], palette:'mustard',
  state:{ car:'g', man:'r', blinkOn:true, pressT:-1e9, wait:false, busy:false, auto:false },
  scene,
  readout: st => ({ g: st.wait ? 'WAIT pressed · your turn is coming' : 'green · cars go · people wait', a:'amber · cars slow down',
    r: st.man === 'g' ? 'green man · walk across!' : 'red · cars stop at the line', ra:'red + amber · cars get ready' })[st.car],
  buttons:[
    { label:'Press WAIT', onClick:(st) => press(st, true) },
    { label:'Auto cycle: off', onClick:(st) => toggleAuto(st) },
  ],
  acts:{ wait:(st) => press(st, true) },
  params:(st, q) => {                                             // screenshot states: ?car=r&man=g
    if (CARSIGN[q.get('car')]) st.car = q.get('car');
    if (q.get('man') === 'g' || q.get('man') === 'r') st.man = q.get('man');
    if (q.get('wait') === '1') st.wait = true;
  },
});
// the street keeps moving: one simulation step per frame, on its own clock
{ let last = performance.now();
  ui.animate(() => { const n = performance.now(), dt = Math.min(.1, Math.max(0, (n - last) / 1000)); last = n; simulate(ui.st, dt); return true; }); }
addEventListener('keydown', e => {
  if (/input|textarea|button/i.test(e.target.tagName) && (e.key === ' ' || e.key === 'Enter')) return;
  const k = e.key.toLowerCase();
  if (e.key === ' ' || e.key === 'Enter' || k === 'w'){ e.preventDefault(); press(ui.st, true); ui.render(); }
  else if (k === 'a'){ toggleAuto(ui.st); ui.render(); }
});
xrMount(() => ui, () => '', { labelsOnly: true });