const TILE = { back:'#efe7cc', floor:'#f5efdb', side:'#e0d7b8', grout:'#aba283' };

/* ---------- geometry: booth dims (x = depth, y = length, z = height) ---------- */
const W = 115, D = 200, H = 215, R = 28, T = 7;   // shell
const FW = W - 6, WT = 3;                            // recessed front wall plane, wall thickness
const DA = 114, DT = 170;                            // doorway: y from DA to D-T, top at DT
const DW = 80, DOOR_SHUT = 112, DOOR_OPEN = 34;      // door width + slide positions
const TY = 72;                                       // toilet centre (y)


// vertical solid from two horizontal rings: sides + top cap + ink
function solid(A, B, m, shade){
  return loft(A, B, n=>shade(n,m)) + fill(pd(B), shade([0,0,1],m)) + hullInk(A.concat(B),1.5) + ink(pd(B),1.1);
}

// text on the back plane (x = const, seen from -x) and on the right side (y = const, seen from -y): reads left-to-right
const txB  = (x,y,z,str,size,col=INK,weight=700) => `<text transform="${txM(P(x,y,z), Dv(0,1,0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".04em">${str}</text>`;
const txNY = (x,y,z,str,size,col=INK,weight=700) => `<text transform="${txM(P(x,y,z), Dv(-1,0,0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".04em">${str}</text>`;
// a pipe lying along x (from x0 to x1) centred (y,z); caps only where they face the viewer
function pipeX(x0,x1,y,z,r,mat,w=1.1){
  const A=on(PX(x0),ellUV(y,z,r,r,16)), B=on(PX(x1),ellUV(y,z,r,r,16));
  let s = loft(A,B,n=>toneI(n,mat));
  for (const [ring,nx] of [[A,Math.sign(x0-x1)],[B,Math.sign(x1-x0)]]) if (facing([nx,0,0])) s += fill(pd(ring),toneI([nx,0,0],mat)) + ink(pd(ring),w*.8);
  return s + hullInk([...A,...B],w);
}

// a cylinder between two points (the tap's spout and lever)
function rodB(a, b, r, m, shade=toneI, w=1, r1=r, n=16){
  const d = norm(sub(b, a)), u = norm(cross(d, Math.abs(d[2]) < .9 ? [0,0,1] : [1,0,0])), v = cross(d, u);
  const ring = (p, rr) => Array.from({length:n}, (_,i) => { const t = i/n*2*Math.PI, c = Math.cos(t)*rr, s2 = Math.sin(t)*rr;
    return [p[0] + u[0]*c + v[0]*s2, p[1] + u[1]*c + v[1]*s2, p[2] + u[2]*c + v[2]*s2]; });
  const A = ring(a, r), B = ring(b, r1), capB = vis(d), cap = capB ? B : A, cn = capB ? d : d.map(x => -x);
  return loft(A, B, nr => shade(nr, m)) + (Math.max(r, r1) > 0 ? fill(pd(cap), shade(cn, m)) + ink(pd(cap), w*.8) : '') + hullInk([...A, ...B], w);
}

/* ---------- state ---------- */
const st = { pal:'mustard', door:0, doorTarget:0, flush:0, tap:0 };

/* ---------- scene ---------- */
const OUT = rrUV(0,0,D,H,R), IN = rrUV(T,T,D-T,H-T,R-T);

function scene(){
  const m = PALS[st.pal];
  const dy = DOOR_OPEN + (DOOR_SHUT-DOOR_OPEN)*ease(st.door);
  const shut = st.door === 1;
  const lamp = shut ? '#e2483d' : '#43c25c';
  let s = '';

  // 1. cast shadow: every outer point pushed along the light onto the floor
  s += castShadow([...on(PX(0),OUT), ...on(PX(W),OUT)]);
  const front = facing([1,0,0]), back = facing([-1,0,0]), left = facing([0,1,0]), right = facing([0,-1,0]);
  if (front) s += frontScene(m, dy, lamp);

  // 7. outer shell + side details
  s += loft(on(PX(0),OUT), on(PX(W),OUT), n=>tone(n,m));
  if (left){                                    // left (+y) side: window slot
    const Y = PY(D+.2);
    s += fill(pd(on(Y,rrUV(26,158,88,181,7))), '#d8d2bd') + ink(pd(on(Y,rrUV(26,158,88,181,7))),1.4);
    s += fill(pd(on(Y,rrUV(30,162,84,177,4.5))), '#f4f5ef') + ink(pd(on(Y,rrUV(30,162,84,177,4.5))),1);
  }
  if (right) s += rightSide(m, lamp, shut);
  if (back) s += backScene(m);

  // 8. silhouette + front / back panel edge
  if (front) s += ink(pd(on(PX(W),OUT)),2.2);
  s += hullInk([...on(PX(0),OUT), ...on(PX(W),OUT)], 2.8);
  return s;
}

/* ---------- the open front: interior through the doorway, recessed wall, panel, sliding door, rim ---------- */
function frontScene(m, dy, lamp){
  let s = '';
  // clip regions
  const doorway = [[DA,T],[DA,DT],[D-T,DT], ...arcUV(D-R,R,R-T,0,-90)];
  s += `<clipPath id="cDoor"><path d="${pd(on(PX(FW),doorway))}"/></clipPath>`;
  s += `<clipPath id="cBack"><path d="${pd(on(PX(T),IN))}"/></clipPath>`;

  // 2. interior, seen through the doorway
  let it = '';
  it += fill(pd(on(PX(T),IN)), TILE.back);
  let tl = '';
  for (let u=T; u<=D-T; u+=12) tl += pd([[T,u,T],[T,u,H-T]], false);
  for (let v=T; v<=H-T; v+=12) tl += pd([[T,T,v],[T,D-T,v]], false);
  it += `<g clip-path="url(#cBack)"><path d="${tl}" fill="none" stroke="${TILE.grout}" stroke-width=".6"/></g>`;
  it += loft(on(PX(T),IN), on(PX(FW-WT),IN), n => n[2]>.7 ? TILE.floor : TILE.side, true);
  let fl = '';
  for (let x=T; x<=FW-WT; x+=12) fl += pd([[x,R,T],[x,D-R,T]], false);
  for (let y=T+12*2; y<=D-R; y+=12) fl += pd([[T,y,T],[FW-WT,y,T]], false);
  it += `<path d="${fl}" fill="none" stroke="${TILE.grout}" stroke-width=".6"/>`;
  if (facing([0,-1,0])){                        // turned so the far (+y) inner wall shows through the doorway: tile it too
    let sw = '';
    for (let x=T+10; x<=FW-WT; x+=12) sw += pd([[x,D-T,R],[x,D-T,H-R]], false);
    for (let z=R; z<=H-R; z+=12) sw += pd([[T,D-T,z],[FW-WT,D-T,z]], false);
    it += `<path d="${sw}" fill="none" stroke="${TILE.grout}" stroke-width=".6"/>`;
  }
  it += ink(pd(on(PX(T),IN)), 1.1);
  // grab rail
  let wl = '';
  const rail = pd([[T,TY-30,60],[T+5,TY-30,60],[T+5,TY-18,60],[T,TY-18,60]], false);   // short grab rail between the toilet and the basin

  // toilet: lid against the wall, pedestal, bowl, seat + water
  const lid = on(PX(T+2), ellUV(TY,68,13,22));
  wl += fill(pd(lid), toneI([1,0,0],CERAMIC)) + ink(pd(lid),1.3);
  it += wl;                                     // rail + lid sit on the back wall: always farthest
  const ring = (cx,rx,ry,z) => on(PZ(z), ellUV(cx,TY,rx,ry));
  let wc = solid(ring(T+16,9,7,T), ring(T+18,11,8,24), CERAMIC, toneI);
  wc += solid(ring(T+19,14,10,24), ring(T+22,21,14,44), CERAMIC, toneI);
  const hole = ring(T+24,13,8.5,44.2), swirl = ring(T+24,8,5,44.3);
  wc += fill(pd(hole), st.flush>0 ? '#8fbcc9' : '#a9c9d1') + ink(pd(hole),1);
  if (st.flush>0) wc += `<path d="${pd(swirl)}" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="7 5" stroke-dashoffset="${f((1-st.flush)*90)}" opacity="${f(Math.sin(st.flush*Math.PI)*.95)}"/>`;
  const parts = [{ at:[T+22,TY,24], svg:`<g data-act="flush">${wc}</g>` }];
  // vanity cabinet against the far wall, near the door
  const cx0=66, cx1=104, cy0=168, cy1=D-T, cz=78;
  let cb = '';
  if (facing([0,-1,0])) cb += face(pd([[cx0,cy0,T],[cx1,cy0,T],[cx1,cy0,cz],[cx0,cy0,cz]]), toneI([0,-1,0],m)) + ink(pd([[cx0,cy0,T],[cx0,cy0,cz]],false),1.1);
  cb += face(pd([[cx1,cy0,T],[cx1,cy1,T],[cx1,cy1,cz],[cx1,cy0,cz]]), toneI([1,0,0],m));
  cb += face(pd([[cx0,cy0,cz],[cx1,cy0,cz],[cx1,cy1,cz],[cx0,cy1,cz]]), toneI([0,0,1],m));
  cb += ink(pd([[cx1,cy0,T],[cx1,cy0,cz],[cx0,cy0,cz]],false),1.3) + ink(pd([[cx1,cy0,cz],[cx1,cy1,cz]],false),1.1);
  cb += ink(pd([[cx1,(cy0+cy1)/2,T+5],[cx1,(cy0+cy1)/2,cz-6]],false),1);
  // small hand basin on the back wall beside the toilet (the part of the back wall seen through the doorway), with the
  // tap coming out of the wall above it
  const by = 36, bz = 56, bx0 = T;
  const cut = pts => pts.map(p => [Math.max(bx0, p[0]), p[1], p[2]]);   // flat where it meets the wall
  const bRim = cut(on(PZ(bz), ellUV(bx0 + 10, by, 13, 12, 28))), bBot = cut(on(PZ(bz - 9), ellUV(bx0 + 6, by, 7, 7, 24)));
  let wb = loft(bBot, bRim, n => toneI(n, CERAMIC)) + fill(pd(bRim), CERAMIC.l) + hullInk([...bBot, ...bRim], 1.3) + ink(pd(bRim), 1.1);
  const bowlIn = cut(on(PZ(bz + .1), ellUV(bx0 + 11, by, 9.5, 9, 24)));
  wb += fill(pd(bowlIn), st.tap > 0 ? '#9cc7d4' : CERAMIC.d) + ink(pd(bowlIn), .7);
  let tp = '';
  const sp = [bx0 + 12, by, bz + 10];
  tp += fill(pd(on(PX(T + .2), ellUV(by, bz + 13, 3.6, 3.6, 16))), METAL.m) + ink(pd(on(PX(T + .2), ellUV(by, bz + 13, 3.6, 3.6, 16))), .9);   // wall plate
  tp += rodB([T, by, bz + 13], [bx0 + 12, by, bz + 13], 1.5, METAL, toneI, 1) + rodB([bx0 + 12, by, bz + 13], sp, 1.4, METAL, toneI, 1);
  const la = st.tap > 0 ? .6 : 0;   // the lever on top lifts while the water runs
  tp += rodB([T + 5, by, bz + 14.4], [T + 5 + 6*Math.cos(la), by, bz + 14.4 + 6*Math.sin(la) + 2], .8, METAL, toneI, .9);
  if (st.tap > 0){
    const on2 = Math.min(1, st.tap*6, (1 - st.tap)*6 + .2), d = pd([sp, [sp[0], sp[1], bz - 1]], false);
    tp += `<path d="${d}" fill="none" stroke="#7cc4ef" stroke-width="${f(2.6*on2)}" stroke-linecap="round" opacity=".9"/>`
        + `<path d="${d}" fill="none" stroke="#ffffff" stroke-width=".55" stroke-dasharray="2 3" stroke-dashoffset="${f(-st.tap*60)}" opacity=".85"/>`;
  }
  parts.push({ at:[T + 6, by, bz], svg:`<g data-act="tap">${wb}${tp}</g>` });
  parts.push({ at:[(cx0+cx1)/2,(cy0+cy1)/2,cz/2], svg:cb });
  it += byDepth(parts);
  s += `<g clip-path="url(#cDoor)">${it}</g>`;

  // 3. doorway jamb, recess lip, recessed front wall
  if (facing([0,1,0])) s += face(pd([[FW-WT,DA,T],[FW,DA,T],[FW,DA,DT],[FW-WT,DA,DT]]), tone([0,1,0],m));
  s += loft(on(PX(FW),IN), on(PX(W),IN), n=>tone(n,m), true);
  const wall = [[DA,T],[DA,DT],[D-T,DT], ...arcUV(D-R,H-R,R-T,0,90), ...arcUV(R,H-R,R-T,90,180), ...arcUV(R,R,R-T,180,270)];
  s += fill(pd(on(PX(FW),wall)), tone([1,0,0],m));
  s += ink(pd(on(PX(FW),IN)),1.1) + ink(pd([[FW,DA,T],[FW,DA,DT],[FW,D-T,DT]],false),1.6);

  // 4. capsule recess + call panel
  const X = PX(FW+.3);
  s += fill(pd(on(X,rrUV(13,20,31,100,9))), m.d) + fill(pd(on(X,rrUV(13,20,28,95,8))), m.m) + ink(pd(on(X,rrUV(13,20,31,100,9))),1.3);
  s += fill(pd(on(X,rrUV(13,112,31,178,6))), '#cde9e6') + ink(pd(on(X,rrUV(13,112,31,178,6))),1.4);
  for (const v of [163,146]){
    s += fill(pd(on(X,ellUV(22,v,5.5,5.5))), '#fff') + ink(pd(on(X,ellUV(22,v,5.5,5.5))),1);
    s += ink(pd(on(X,ellUV(22,v+2.6,1.1,1.1))),1) + ink(pd(on(X,[[22,v+1.2],[22,v-3]]),false),1) + ink(pd(on(X,[[20,v],[24,v]]),false),.9);
  }
  s += `<g data-act="door">${fill(pd(on(X,ellUV(22,126,5,5))), lamp)}${fill(pd(on(X,ellUV(23.5,127.5,1.6,1.6))),'#fff','opacity=".7"')}${ink(pd(on(X,ellUV(22,126,5,5))),1.3)}</g>`;

  // 5. sliding door (front face has the booth's rounded bottom corner)
  const dz = 174, x0 = FW+.5, x1 = FW+4;
  const dshape = [[dy,T],[dy,dz],[dy+DW,dz], ...arcUV(dy+DW-(R-T),R,R-T,0,-90)];
  let dr = '';
  dr += face(pd([[x0,dy,dz],[x0,dy+DW,dz],[x1,dy+DW,dz],[x1,dy,dz]]), tone([0,0,1],m));
  if (facing([0,1,0])){                        // the visible end of the door slab: +y end (rounded foot) or the straight -y end
    dr += face(pd([[x0,dy+DW,R],[x0,dy+DW,dz],[x1,dy+DW,dz],[x1,dy+DW,R]]), tone([0,1,0],m));
    dr += ink(pd([[x0,dy+DW,dz],[x0,dy+DW,R]],false),1) + ink(pd([[x0,dy,dz],[x0,dy+DW,dz],[x1,dy+DW,dz]],false),1);
  } else {
    dr += face(pd([[x0,dy,T],[x0,dy,dz],[x1,dy,dz],[x1,dy,T]]), tone([0,-1,0],m));
    dr += ink(pd([[x0,dy,dz],[x0,dy,T]],false),1) + ink(pd([[x0,dy+DW,dz],[x0,dy,dz],[x1,dy,dz]],false),1);
  }
  dr += fill(pd(on(PX(x1),dshape)), tone([1,0,0],m)) + ink(pd(on(PX(x1),dshape)),1.8);
  const Xd = PX(x1+.2);
  dr += fill(pd(on(Xd,rrUV(dy+10,149,dy+70,161,3))), '#a9bdc0') + ink(pd(on(Xd,rrUV(dy+10,149,dy+70,161,3))),1.2);
  dr += `<path d="${pd(on(Xd,[[dy+18,151.5],[dy+62,158.5]]),false)}" stroke="#e8f0f0" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
  dr += fill(pd(on(Xd,rrUV(dy+6,84,dy+15,106,1.5))), m.m) + ink(pd(on(Xd,rrUV(dy+6,84,dy+15,106,1.5))),1.1);
  dr += fill(pd(on(Xd,rrUV(dy+8,96,dy+13,102,1))), lamp) + ink(pd(on(Xd,rrUV(dy+8,96,dy+13,102,1))),.8);
  s += `<g data-act="door">${dr}</g>`;

  // 6. front rim
  s += `<path d="${pd(on(PX(W),OUT))}${pd(on(PX(W),IN))}" fill="${tone([1,0,0],m)}" fill-rule="evenodd"/>`;
  s += ink(pd(on(PX(W),IN)),1.8);

  return s;
}


/* ---------- right (-y) side: second window slot, occupancy sign, low air intake ---------- */
function rightSide(m, lamp, shut){
  const Y = PY(-.2); let s = '';
  s += fill(pd(on(Y,rrUV(26,158,88,181,7))), '#d8d2bd') + ink(pd(on(Y,rrUV(26,158,88,181,7))),1.4);
  s += fill(pd(on(Y,rrUV(30,162,84,177,4.5))), '#f4f5ef') + ink(pd(on(Y,rrUV(30,162,84,177,4.5))),1);
  // occupancy sign near the front edge (front = x W is on the left when this side faces you)
  s += fill(pd(on(Y,rrUV(66,118,108,136,3))), '#1d2a26') + ink(pd(on(Y,rrUV(66,118,108,136,3))),1.3);
  s += fill(pd(on(Y,ellUV(101,127,3.2,3.2))), lamp) + ink(pd(on(Y,ellUV(101,127,3.2,3.2))),.9);
  s += txNY(82,-.3,124.6, shut ? 'IN USE' : 'VACANT', 6, shut ? '#ff8a7e' : '#8af0ae', 800);
  // low air intake with louvres
  s += fill(pd(on(Y,rrUV(30,34,86,50,5))), m.d) + ink(pd(on(Y,rrUV(30,34,86,50,5))),1.3);
  let lv = ''; for (const z of [39,45]) lv += pd(on(Y,[[34,z],[82,z]]),false);
  s += `<path d="${lv}" fill="none" stroke="${m.m}" stroke-width="2" stroke-linecap="round"/>` + ink(lv,.6);
  return s;
}

/* ---------- back (-x): panel, vent grille, WC sign, service hatch, rating plate, drain pipe ---------- */
function backScene(m){
  const B = PX(-.3), bt = tone([-1,0,0],m); let s = '';
  s += shape(on(PX(0),OUT), bt, 0) + ink(pd(on(PX(0),OUT)),2.2);
  // vent grille near the top
  s += fill(pd(on(B,rrUV(112,176,174,197,5))), m.d) + ink(pd(on(B,rrUV(112,176,174,197,5))),1.3);
  let gr = ''; for (let z=180; z<=193; z+=4.3) gr += pd(on(B,[[116,z],[170,z]]),false);
  s += `<path d="${gr}" fill="none" stroke="${m.m}" stroke-width="2.2" stroke-linecap="round"/>`;
  // WC sign: letters + two pictograms
  s += fill(pd(on(B,rrUV(28,148,96,177,4))), '#f4f5ef') + ink(pd(on(B,rrUV(28,148,96,177,4))),1.3);
  s += txB(-.4,46,156.5,'WC',15,INK,800);
  s += ink(pd(on(B,[[73,152],[73,173]]),false),.8);
  s += fill(pd(on(B,ellUV(80,169.5,2.3,2.3))), INK) + fill(pd(on(B,rrUV(77.6,152,82.4,166,1.2))), INK);
  s += fill(pd(on(B,ellUV(89,169.5,2.3,2.3))), INK) + fill(pd(on(B,[[84.5,157],[93.5,157],[89,166.5]])), INK);
  s += ink(pd(on(B,[[87.5,157],[87.5,152]]),false),1.1) + ink(pd(on(B,[[90.5,157],[90.5,152]]),false),1.1);
  // accessibility plate
  s += fill(pd(on(B,rrUV(28,124,46,142,2.5))), '#3d6fb6') + ink(pd(on(B,rrUV(28,124,46,142,2.5))),1.1);
  s += fill(pd(on(B,ellUV(37.5,138.6,1.5,1.5))), '#fff');
  s += `<path d="${pd(on(B,ellUV(36,131,4.3,4.3,18)))}${pd(on(B,[[37,136],[36.6,131.5],[40.5,131.5],[42,127.5]]),false)}${pd(on(B,[[36.8,134],[40,134]]),false)}" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  // rating plate
  s += fill(pd(on(B,rrUV(54,124,96,142,1.5))), METAL.l) + ink(pd(on(B,rrUV(54,124,96,142,1.5))),1);
  s += txB(-.4,75,135.5,'WC-200 · 09',4.6,INK,700);
  s += ink(pd(on(B,[[58,131],[92,131]]),false),.6) + ink(pd(on(B,[[58,128],[84,128]]),false),.6);
  // service hatch with four screws and a latch
  s += fill(pd(on(B,rrUV(110,46,172,140,6))), bt) + ink(pd(on(B,rrUV(110,46,172,140,6))),1.5) + ink(pd(on(B,rrUV(113,49,169,137,4))),.6);
  for (const [u,v] of [[115,54],[167,54],[115,132],[167,132]])
    s += fill(pd(on(B,ellUV(u,v,1.9,1.9,12))), METAL.l) + ink(pd(on(B,ellUV(u,v,1.9,1.9,12))),.8) + ink(pd(on(B,[[u-1.1,v-.6],[u+1.1,v+.6]]),false),.6);
  s += fill(pd(on(B,rrUV(160,84,166,102,1.5))), m.d) + ink(pd(on(B,rrUV(160,84,166,102,1.5))),1) + fill(pd(on(B,ellUV(163,95,1.1,1.1,10))), METAL.l);
  s += txB(-.4,141,124,'SERVICE',6.5,bt===m.d?m.m:m.d,800);
  // water / drain pipe: wall flange, elbow stub, down-pipe with clamps into a floor collar
  const py = 20, px = -7, pr = 3.2;
  s += fill(pd(on(B,ellUV(py,96,6,6,16))), METAL.m) + ink(pd(on(B,ellUV(py,96,6,6,16))),1);
  s += pipeX(0, px, py, 96, pr, METAL);
  s += fill(pd(on(PZ(.2),ellUV(px,py,7,7,18))), METAL.d) + ink(pd(on(PZ(.2),ellUV(px,py,7,7,18))),1);
  s += cyl(px,py,0,99.2,pr,METAL,toneI,1.1,16);
  for (const z of [30,62]) s += cyl(px,py,z,z+3,pr+.9,METAL,toneI,.9,16);
  return s;
}

/* ---------- see-through + labels kit ---------- */
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

/* ---------- see-through: how a real modular public toilet works ----------
   Its walls, floor and roof are hollow panels (T thick); everything runs inside them, the controller sits in the vanity.
   WATER   supply riser into the back wall . stop valve . filter . tee . instant water heater . tap solenoid valve . tap line
           to the wall plate . concealed flush valve (flushometer) with its solenoid . flush pipe down to the bowl's rim inlet
   DRAINS  bowl outlet through the floor . basin waste into the wall and down . floor drain and its pipe . main drain under
           the floor . sewer outlet with its collar
   DOOR    track in the front wall's header . hanger carriage with two rollers . bracket down to the door . gearmotor and its
           pulley . idler pulley . toothed belt and the clamp that ties it to the carriage . electric lock in the jamb and
           its bolt . safety beam across the doorway (emitter, receiver)
   POWER   mains gland at the back . controller and power supply in the vanity . loom up the corner and through the ceiling to
           the light, the motion sensor, the exhaust fan behind the back grille, the door motor, the call panel, the lock,
           the flush and tap valves */
const BCOP = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, BGM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' }, BPVC = { l:'#e9ecee', m:'#c9cfd2', d:'#9aa2a6' };
const PX_ = 4.6, CX_ = 1.8;                                    // pipes and cables in the back wall's cavity, never crossing
const bBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - 1.2), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + 1.2)];
const bBend = (pts, r = 4) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a pipe or cable as short depth-sortable pieces; flow dashes while it runs; terminal dots on cable ends
const bLine = (pts, col, w, opt = {}) => { const q = bBend(pts, opt.r || 4), out = [], L = 16;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (opt.flow) svg += `<path d="${d}" fill="none" stroke="${opt.flow}" stroke-width="${f(Math.max(.6, w*.7))}" stroke-dasharray="2 2.4" stroke-dashoffset="${f(-(performance.now()/1000)*30)}" stroke-linecap="round"/>`;
    for (const e of [i === 0 && opt.ends ? q[0] : null, j === q.length - 1 && opt.ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.3" fill="${INK}"/>`; }
    out.push({ box: bBoxOf(seg), svg }); i = j; }
  return out; };
function boothMech(){
  const parts = [], put = (b, svg) => parts.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .8) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w));
  const flushing = st.flush > 0, tapping = st.tap > 0, moving = st.door !== st.doorTarget, shut = st.door === 1;
  const dy = DOOR_OPEN + (DOOR_SHUT - DOOR_OPEN)*ease(st.door), t = performance.now()/1000;
  const H_ = '#3a3632', ON = '#ffb347', WATER = '#4f9fdc', live = c => c ? matOf('#ff9a3a') : BGM;
  // ---- water: riser in through the back wall, stop valve, filter, tee
  parts.push(...bLine([[0, 20, 96], [PX_, 20, 96], [PX_, 36, 96]], BCOP.m, 1, { flow: flushing || tapping ? WATER : 0 }));
  put([[PX_ - 1.6, 24, 94.4], [PX_ + 1.6, 28, 100]], rod([PX_, 24, 96], [PX_, 28, 96], 1.6, matOf('#d7af4a'), toneI, .6) + rod([PX_, 26, 97.4], [PX_, 26, 100], .5, METAL, toneI, .4) + rod([PX_ - 1.2, 26, 100], [PX_ + 1.2, 26, 100], .6, matOf('#e2483d'), toneI, .4));
  put([[PX_ - 2, 30, 94], [PX_ + 2, 34, 98]], rod([PX_, 30, 96], [PX_, 34, 96], 2, BPVC, toneI, .6));
  put([[PX_ - 1.6, 34.4, 94.4], [PX_ + 1.6, 37.6, 97.6]], cyl(PX_, 36, 94.4, 97.6, 1.6, BCOP, toneI, .5, 12));
  // tap branch: through the instant heater, the tap solenoid valve, out to the wall plate
  parts.push(...bLine([[PX_, 36, 96], [PX_, 44, 96], [PX_, 44, 94]], BCOP.m, .8, { flow: tapping ? WATER : 0 }));
  bx(PX_ - 1.8, 41, 76, PX_ + 1.8, 55, 94, tapping ? matOf('#ff9a3a') : matOf('#e8e4da'), .8);
  parts.push(...bLine([[PX_, 52, 76], [PX_, 52, 72], [PX_, 41, 72]], BCOP.m, .8, { flow: tapping ? '#ff8a5a' : 0 }));
  bx(PX_ - 1.8, 37, 70, PX_ + 1.8, 41, 74, live(tapping), .6);
  parts.push(...bLine([[PX_, 37, 72], [PX_, 36, 69], [T, 36, 69]], BCOP.m, .8, { flow: tapping ? '#ff8a5a' : 0 }));
  // flush branch: concealed flush valve with its solenoid, flush pipe down to the bowl's rim inlet
  parts.push(...bLine([[PX_, 36, 96], [PX_, 70, 96], [PX_, 70, 98]], BCOP.m, 1, { flow: flushing ? WATER : 0 }));
  put([[PX_ - 2.4, TY - 2.4, 88], [PX_ + 2.4, TY + 2.4, 104]], cyl(PX_, TY, 88, 104, 2.4, METAL, toneI, .8, 16) + cyl(PX_, TY, 104, 106, 1.6, METAL, toneI, .6, 12));
  bx(PX_ - 1.8, TY - 2, 106, PX_ + 1.8, TY + 2, 112, live(flushing), .6);
  parts.push(...bLine([[PX_, TY, 88], [PX_, TY, 48], [T + 2, TY, 42]], BCOP.m, 1.2, { flow: flushing ? WATER : 0 }));
  // ---- drains under the floor: bowl outlet, basin waste, floor drain, main, sewer outlet
  const DZ = 3.5;
  parts.push(...bLine([[T + 16, TY, T], [T + 16, TY, DZ], [40, TY, DZ], [40, 100, DZ]], BPVC.m, 2.4, { flow: flushing ? '#7aa9b8' : 0 }));
  parts.push(...bLine([[T + 6, 36, 47], [PX_, 36, 44], [PX_, 36, DZ], [T + 16, 50, DZ], [T + 16, TY - 3, DZ]], BPVC.m, 1.3, { flow: tapping ? '#7aa9b8' : 0 }));
  put([[56, 136, T - .4], [64, 144, T + .1]], shape(on(PZ(T + .08), ellUV(60, 140, 4, 4, 18)), METAL.l, .7) + [-2, 0, 2].map(o => line([[58 + o*.0, 140 + o, T + .1], [62, 140 + o, T + .1]], .4)).join(''));
  parts.push(...bLine([[60, 140, T], [60, 140, DZ], [40, 140, DZ], [40, 104, DZ]], BPVC.m, 1.6));
  put([[35, 95, -3], [45, 105, DZ + 2.4]], cyl(40, 100, -3, DZ + 1, 3.2, BPVC, toneI, .8, 16) + cyl(40, 100, -1.5, 0, 4.4, BGM, toneI, .6, 16));
  // ---- door: track and carriage in the front wall's header, bracket to the door, motor, pulleys, belt, clamp
  const HX = 107.5, TZ = 192;
  bx(HX - 1, 24, TZ - 1, HX + 1, 197, TZ + 1, METAL, .6);
  bx(HX - 1.4, dy + 6, TZ - 6, HX + 1.4, dy + 74, TZ - 1, BGM, .7);
  for (const yy of [dy + 14, dy + 66]) put([[HX - 1.6, yy - 2.2, TZ - 1.2], [HX + 1.6, yy + 2.2, TZ + 3.2]], cylX(HX - 1.6, HX + 1.6, yy, TZ + 1, 2.2, matOf('#3a3632'), toneI, .5, 14));
  put([[HX, dy + 38, 174], [113, dy + 42, TZ - 5]], rod([HX + 1.4, dy + 40, TZ - 5], [111, dy + 40, 174.5], .9, METAL, toneI, .6));
  const BZ0 = TZ + 5, BZ1 = TZ + 9;
  bx(HX - 1.5, 14, BZ0 - 3, HX + 1.5, 21, BZ1 + 4, live(moving), .8);
  for (const yy of [23, 194]) put([[HX - 1, yy - 2.2, BZ0 - .2], [HX + 1, yy + 2.2, BZ1 + .2]], cylX(HX - 1, HX + 1, yy, (BZ0 + BZ1)/2, 2.2, METAL, toneI, .5, 14));
  let belt = line([[HX, 23, BZ0], [HX, 194, BZ0]], 1.1) + line([[HX, 23, BZ1], [HX, 194, BZ1]], 1.1);
  if (moving) belt += `<path d="${pd([[HX, 23, BZ1], [HX, 194, BZ1]], false)}" stroke="${ON}" stroke-width=".9" stroke-dasharray="2 3" stroke-dashoffset="${f(-t*40*(st.doorTarget ? 1 : -1))}"/>`;
  put([[HX - .6, 21, BZ0 - .6], [HX + .6, 196, BZ1 + .6]], belt);
  bx(HX - 1.2, dy + 38, TZ - 1, HX + 1.2, dy + 42, BZ0 + .3, BGM, .5);
  // electric lock in the jamb: its bolt is out while the door is shut
  bx(106, 194, 88, 110, 199, 102, shut ? matOf('#e2483d') : matOf('#43c25c'), .8);
  if (shut) put([[110, 189, 93.6], [112, 194, 96.4]], rod([111, 194, 95], [111, 190, 95], 1.3, METAL, toneI, .6));
  // safety beam across the doorway: emitter and receiver in the jambs
  bx(106.5, DA - .5, 27, 109, DA + 2, 33, BGM, .5); bx(106.5, D - T - 2, 27, 109, D - T + .5, 33, BGM, .5);
  put([[107.5, DA + 2, 29.5], [108, D - T - 2, 30.5]], `<path d="${pd([[107.8, DA + 2, 30], [107.8, D - T - 2, 30]], false)}" stroke="#e2483d" stroke-width="${moving ? 1.3 : .7}" stroke-dasharray="2 2" opacity="${moving ? 1 : .55}"/>`);
  // ---- power and control: gland, controller and supply in the vanity, ceiling light, motion sensor, exhaust fan
  put([[0, 28, 28], [2.5, 32, 32]], cylX(0, 2.5, 30, 30, 1.8, BGM, toneI, .5, 12));
  put([[70, 172, 20], [100.8, 190, 60]], box(70, 172, 20, 100, 190, 60, BGM, toneI, .9)
    + (facing([1,0,0]) ? box(100, 175, 44, 100.8, 187, 56, matOf('#2f8a4a'), toneI, .5) + fill(pd(on(PX(100.85), ellUV(181, 30, 1, 1, 10))), Math.sin(t*4) > 0 ? '#7dff9a' : '#2a5a36') : ''));
  bx(72, 174, 62, 92, 188, 74, METAL, .7);
  put([[40, 70, H - T - 1.2], [80, 130, H - T]], box(40, 70, H - T - 1.2, 80, 130, H - T, { l:'#fffbe8', m:'#fff1c2', d:'#e8d79a' }, toneI, .6));
  put([[83, 58, H - T - 3], [87, 62, H - T]], cyl(85, 60, H - T - 2.5, H - T, 2, matOf('#f3efe4'), toneI, .5, 14) + fill(pd(on(PZ(H - T - 2.55), ellUV(85, 60, 1.1, 1.1, 10))), shut ? '#ff9a3a' : '#3a3632'));
  const fa = shut ? t*10 : 0;
  let fan = cylX(1.5, 5.5, 143, 186, 9, BPVC, toneI, .8, 24);
  if (facing([1,0,0])) for (let i = 0; i < 4; i++){ const a = fa + i*Math.PI/2; fan += ink(pd([[5.6, 143, 186], [5.6, 143 + 7.5*Math.cos(a), 186 + 7.5*Math.sin(a)]], false), 1.2); }
  put([[1.5, 134, 177], [5.5, 152, 195]], fan);
  // the loom: mains in along the floor to the vanity; up the corner to the ceiling void; branches to every load
  // the loom is thin and grey so its long runs along the ceiling and floor don't read as the box's edges
  const CZ = H - T + 3.5, cab = (pts, on, w = .55) => parts.push(...bLine(pts, on ? ON : '#8a847c', w*.6, { ends: true }));
  cab([[2.5, 30, 30], [CX_, 30, DZ], [CX_, 196, DZ], [85, 196, DZ], [85, 190, 20]], false, .7);
  cab([[85, 190, 60], [100, 196, 70], [104, 196, CZ], [60, 196, CZ], [60, 130, CZ], [60, 130, H - T]], shut);
  cab([[60, 196, CZ], [CX_, 196, CZ], [CX_, 143, CZ], [CX_, 143, 195]], shut, .45);
  cab([[60, 130, CZ], [85, 70, CZ], [85, 60, H - T - .2]], shut, .45);
  cab([[104, 196, CZ], [HX, 196, CZ], [HX, 18, CZ], [HX, 18, BZ1 + 4]], moving, .5);
  cab([[HX, 22, CZ], [HX - 1, 22, CZ - 4], [HX - 1, 22, 180]], false, .45);
  cab([[104, 196, CZ - 1], [108, 196.5, CZ - 6], [108, 196.5, 102]], shut, .45);
  cab([[CX_, 143, CZ], [CX_, TY, CZ], [CX_, TY, 112], [PX_ - 1.8, TY, 110]], flushing, .45);
  cab([[CX_, TY, CZ - 1], [CX_, 39, CZ - 1], [CX_, 39, 74], [PX_ - 1.8, 39, 72]], tapping, .45);
  cab([[CX_, 39, 96], [CX_, 48, 94], [PX_ - 1.8, 48, 90]], tapping, .45);
  return byDepth(parts);
}
const BOOTH_B = [0, W, 0, D, 0, H];
const boothInside = () => [
  { at:[PX_, TY, 104], text:'FLUSH VALVE', on: st.flush > 0 },
  { at:[PX_, 26, 100], text:'STOP VALVE', on: false },
  { at:[PX_ + 1.8, 48, 94], text:'WATER HEATER', on: st.tap > 0 },
  { at:[PX_ + 1.8, 39, 74], text:'TAP VALVE', on: st.tap > 0 },
  { at:[40, 100, -3], text:'DRAIN', on: st.flush > 0 },
  { at:[107.5, 17, 205], text:'DOOR MOTOR', on: st.door !== st.doorTarget },
  { at:[108, 194, 102], text:'DOOR LOCK', on: st.door === 1 },
  { at:[108, 150, 30], text:'SAFETY BEAM', on: st.door !== st.doorTarget },
  { at:[100, 181, 60], text:'CONTROLLER', on: true },
  { at:[5.5, 143, 195], text:'EXHAUST FAN', on: st.door === 1 },
  { at:[85, 60, H - T - 3], text:'MOTION SENSOR', on: st.door === 1 } ];
const boothSurface = () => facing([1,0,0]) ? [
  { at:[FW + .3, 22, 178], text:'CALL PANEL', on: false }, { at:[FW + 4, DOOR_OPEN + (DOOR_SHUT - DOOR_OPEN)*ease(st.door) + 40, 174], text:'SLIDING DOOR', on: st.door !== st.doorTarget },
  { at:[T + 22, TY, 44], text:'TOILET', on: st.flush > 0 }, { at:[T + 10, 36, 56], text:'BASIN', on: st.tap > 0 } ]
  : facing([-1,0,0]) ? [ { at:[0, 141, 140], text:'SERVICE HATCH', on: false }, { at:[0, 143, 197], text:'VENT', on: false }, { at:[-7, 20, 60], text:'WATER PIPE', on: false } ] : [];
function boothScene(){
  const k = ease(st.xr || 0), s = scene();
  if (k > 0) return `<g opacity="${f(1 - .72*k)}">${s}</g><g opacity="${f(k)}">${boothMech()}</g>` + (k > .6 ? xrCallouts(boothInside(), BOOTH_B) : '');
  return s + xrCallouts(boothSurface(), BOOTH_B);
}
const BOOTH_CAPTION = () => '';

/* ---------- behaviour ---------- */
let ui;
let running=false, last=0;
function loop(now){
  const dt = Math.min(50, now-last)/1000; last = now; let more = false;
  if (st.door !== st.doorTarget){ const sg=Math.sign(st.doorTarget-st.door); st.door += sg*dt/0.8; if ((st.doorTarget-st.door)*sg <= 0) st.door = st.doorTarget; more = true; }
  if (st.flush > 0){ st.flush = Math.max(0, st.flush - dt/1.8); more = true; }
  if (st.tap > 0){ st.tap = Math.max(0, st.tap - dt/2.5); more = true; }
  ui.render();
  if (more) requestAnimationFrame(loop); else running = false;
}
const kick = () => { if (!running){ running = true; last = performance.now(); requestAnimationFrame(loop); } };
const toggleDoor = () => { st.doorTarget = st.doorTarget ? 0 : 1; kick(); };
const flush = () => { st.flush = 1; kick(); };
const washHands = () => { if (st.tap > 0) return ui.flash('The tap is running'); st.tap = 1; kick(); };

ui = mountFigure({
  fig:'21', turn:'full', title:'Toilet booth', hint:'click the door, light or bowl',
  idea:"Locking the door also flips the sign outside to IN USE, so everyone knows to wait.",
  size:[W,D,H], palette:'mustard', state:st, views:true,
  scene: () => boothScene(),
  readout: st => {
    const moving = st.door !== st.doorTarget, shut = st.door === 1;
    return st.tap>0 ? 'Washing hands…' : st.flush>0 ? 'Flushing…' : moving ? (st.doorTarget ? 'Closing…' : 'Opening…') : shut ? '● Occupied · locked' : '● Vacant · door open';
  },
  buttonsLabel:'Booth',
  buttons:[
    { label:'Close & lock door', onClick: () => st.doorTarget ? ui.flash('Already locked') : (st.flushed = false, toggleDoor()) },
    { label:'Flush', onClick: () => { flush(); st.flushed = true; } },
    { label:'Wash hands', onClick: () => washHands() },
    { label:'Unlock & open door', onClick: () => st.doorTarget ? toggleDoor() : ui.flash('The door is already open') },
  ],
  next: st => st.door !== st.doorTarget || st.flush > 0 ? -1 : !st.doorTarget ? 0 : st.flushed ? 2 : 1,
  acts:{ door: toggleDoor, flush: () => { flush(); st.flushed = true; }, tap: () => washHands() },
  params:(st,q) => { if (q.get('door') === '1') st.door = st.doorTarget = 1; },
});
xrMount(() => ui, BOOTH_CAPTION);