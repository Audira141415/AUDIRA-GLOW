/* ---------- geometry (x = depth, y = width, z = up) ---------- */
const W = 70, D = 75, H = 170;      // overall: depth incl. doors, width, height
const CW = 63, DT = 7, T = 5;        // cabinet front plane, door thickness, wall thickness
const DOOR_MAX = 110, FZ_MAX = 105;  // max swing (degrees)
// rounded rect with separate top / bottom corner radii (Smeg-style: big top, small bottom)
const rrT = (u0,v0,u1,v1,rt,rb,n=8) => [...arcUV(u1-rb,v0+rb,rb,-90,0,n), ...arcUV(u1-rt,v1-rt,rt,0,90,n), ...arcUV(u0+rt,v1-rt,rt,90,180,n), ...arcUV(u0+rb,v0+rb,rb,180,270,n)];
const OUT    = rrT(0,4,D,H,20,3);            // body profile in (y,z)
const FDOOR  = rrT(0,7,D,123,2,2);           // fridge door
const ZDOOR  = rrT(0,124.5,D,H,20,2);        // freezer door
const F_OPEN = rrUV(T,14,D-T,119,3);         // fridge compartment opening on x = CW
const Z_OPEN = rrT(T,128,D-T,H-6,14,3);      // freezer compartment opening
const SHELVES = [35,59,84];                  // glass shelf heights (lowest covers the crisper)

/* ---------- materials ---------- */
const LINER = { l:'#f8f8f3', m:'#e6e8e3', d:'#c9cdc8' };
const FROST = { l:'#eef7fb', m:'#d5e8f0', d:'#adc9d6' };
const GASKET = '#c3c5bf';
const GLASS = { l:'#e2f1f3', m:'#c8e0e4', d:'#9fbfc5' };
const MILK = { l:'#fdfdf8', m:'#eceee6', d:'#c9ccc2' };
const PLATE = { l:'#fcfbf5', m:'#e5e2d6', d:'#bdb9aa' };
const CARD = matOf('#d9c7a4');
const EGG = matOf('#f4e2c4');

/* ---------- small helpers ---------- */
// view-aware sort key (in view 0 exactly x+y+z, so the old hand order is kept)
const dk = (x,y,z=0) => { const r = rotV([x,y,z]); return r[0]+r[1]+r[2]; };
const byDk = (list, at) => list.slice().sort((p,q) => dk(...at(p)) - dk(...at(q)));
// glint offset: toward the screen-right edge of a round thing, in model coordinates (default view: +x −y)
const GO = r => [r*Math.SQRT2*CAM_R[0], r*Math.SQRT2*CAM_R[1]];
// text on the back plane x = const (reads +y) and on the right side plane y = const (reads −x)
const txB = (x,y,z,str,size,col=INK,weight=700) => { const o=P(x,y,z);
  return `<text transform="${txM(o, Dv(0,1,0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".04em">${str}</text>`; };
const txR = (x,y,z,str,size,col=INK,weight=700,ls='.04em') => { const o=P(x,y,z);
  return `<text transform="${txM(o, Dv(-1,0,0), Dv(0,0,-1))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing="${ls}">${str}</text>`; };
const zRing = (x,y,z,r,n=20) => on(PZ(z), ellUV(x,y,r,r,n));
// lathe: vertical body of revolution; prof = [[r,h],[r,h,mat],...] (mat colours the segment below that ring)
function lathe(x,y,z,prof,w=1.1,n=20){
  const rings = prof.map(([r,h]) => zRing(x,y,z+h,Math.max(r,.05),n)); let s = '';
  for (let i=1;i<rings.length;i++){ const mt = prof[i][2]; s += loft(rings[i-1],rings[i],nr=>toneI(nr,mt)); }
  const last = rings[rings.length-1], lm = prof[prof.length-1][2];
  return s + fill(pd(last), toneI([0,0,1],lm)) + ink(pd(last), w*.65) + hullInk(rings.flat(), w);
}
// the half of a horizontal ring that faces the viewer (seam lines on lathes)
const seam = (x,y,z,r,w=.6) => line(arcUV(x,y,r,...nearHalf(),10).map(([u,v])=>[u,v,z]), w);
const R3 = 1.2247;                                  // iso scale of a sphere's radius on screen
function ball(x,y,z,r,mt,w=.8,sy=1){
  const [cx,cy] = P(x,y,z), rr = r*R3;
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr)}" ry="${f(rr*sy)}" fill="${mt.m}"/>`
    + `<ellipse cx="${f(cx-rr*.16)}" cy="${f(cy-rr*.2*sy)}" rx="${f(rr*.7)}" ry="${f(rr*.7*sy)}" fill="${mt.l}"/>`
    + `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr)}" ry="${f(rr*sy)}" fill="none" stroke="${INK}" stroke-width="${w}"/>`;
}
const glint = (a,b,o=.55,w=1.2) => `<path d="${pd([a,b],false)}" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
// a tube between two 3D points (handles, posts)
function tube(a,b,r,mt,w=1,n=12){
  const ax = norm(sub(b,a)), u = norm(Math.abs(ax[2])<.9 ? cross(ax,[0,0,1]) : cross(ax,[1,0,0])), v = cross(ax,u);
  const ring = p => Array.from({length:n},(_,i)=>{ const t=i/n*2*Math.PI, c=Math.cos(t)*r, s=Math.sin(t)*r; return [p[0]+u[0]*c+v[0]*s, p[1]+u[1]*c+v[1]*s, p[2]+u[2]*c+v[2]*s]; });
  const A = ring(a), B = ring(b); let s = loft(A,B,nr=>toneI(nr,mt));
  if (vis(ax)) s += fill(pd(B), toneI(ax,mt)); else s += fill(pd(A), toneI(ax.map(q=>-q),mt));
  return s + hullInk([...A,...B], w);
}
// a frame maps local (t, y, z) to world. ID = the unrotated world; doorFrame = rotated about the hinge.
const ID = { R:(t,y,z)=>[t,y,z], nT:[1,0,0], nY:[0,1,0] };
function doorFrame(deg){
  const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
  // hinge axis: vertical line at (x = CW, y = 0) — the right-hand edge on screen
  return { R:(t,y,z)=>[CW + t*c + y*s, -t*s + y*c, z], nT:[c,-s,0], nY:[s,c,0] };
}
const PD = (fr,t) => ([u,v]) => fr.R(t,u,v);
const neg = n => n.map(v=>-v);
// box in a frame: t0..t1 (local depth), y0..y1, z0..z1
function rbox(fr,t0,t1,y0,y1,z0,z1,mt,w=1,op=1,top=true){
  const R = fr.R, e = op<1 ? `fill-opacity="${op}"` : '';
  const F = [
    { n:fr.nT,       p:[R(t1,y0,z0),R(t1,y1,z0),R(t1,y1,z1),R(t1,y0,z1)] },
    { n:neg(fr.nT),  p:[R(t0,y0,z0),R(t0,y1,z0),R(t0,y1,z1),R(t0,y0,z1)] },
    { n:fr.nY,       p:[R(t0,y1,z0),R(t1,y1,z0),R(t1,y1,z1),R(t0,y1,z1)] },
    { n:neg(fr.nY),  p:[R(t0,y0,z0),R(t1,y0,z0),R(t1,y0,z1),R(t0,y0,z1)] },
    { n:[0,0,1],     p:[R(t0,y0,z1),R(t1,y0,z1),R(t1,y1,z1),R(t0,y1,z1)] } ];
  if (!top) F.pop();
  let s = ''; for (const q of F) if (vis(q.n)) s += fill(pd(q.p), toneI(q.n,mt), e) + ink(pd(q.p), w);
  return s;
}
// carton with a gable top (ridge along local y)
function carton(fr,t,y,z,col,band){
  const m = matOf(col), a = 2.8, h = 15, R = fr.R;
  let s = rbox(fr,t-a,t+a,y-a,y+a,z,z+h,m,1);
  s += rbox(fr,t-a-.05,t+a+.05,y-a-.05,y+a+.05,z+4,z+8,matOf(band),.6,1,false);
  const top = [
    { n:norm([fr.nT[0]*1+0,fr.nT[1],1]), p:[R(t+a,y-a,z+h),R(t+a,y+a,z+h),R(t,y+a,z+h+3),R(t,y-a,z+h+3)] },
    { n:norm([-fr.nT[0],-fr.nT[1],1]),   p:[R(t-a,y-a,z+h),R(t-a,y+a,z+h),R(t,y+a,z+h+3),R(t,y-a,z+h+3)] },
    { n:fr.nY,      p:[R(t-a,y+a,z+h),R(t+a,y+a,z+h),R(t,y+a,z+h+3)] },
    { n:neg(fr.nY), p:[R(t-a,y-a,z+h),R(t+a,y-a,z+h),R(t,y-a,z+h+3)] } ];
  for (const q of top) if (vis(q.n)) s += fill(pd(q.p), toneI(q.n,m)) + ink(pd(q.p),.9);
  s += rbox(fr,t-.4,t+.4,y-a,y+a,z+h+3,z+h+4.3,m,.8);           // the fin
  return s;
}
// text lying on a door face (plane of local y,z at depth t)
function txF(fr,t,y,z,str,size,col=INK,weight=800,inner=false){
  const o = P(...fr.R(t,y,z)), d = Dv(...(inner ? fr.nY : neg(fr.nY)));
  return `<text transform="matrix(${d[0].toFixed(4)} ${d[1].toFixed(4)} 0 1 ${f(o[0])} ${f(o[1])})" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}" letter-spacing=".12em">${str}</text>`;
}

/* ---------- food ---------- */
const FOOD = {
  cake(x,y,z){
    let s = lathe(x,y,z,[[9.5,0],[10.5,1,PLATE]],1);
    s += lathe(x,y,z+1,[[7.8,0],[7.8,2.6,matOf('#c98a5a')],[7.8,3.4,matOf('#fbeedd')],[7.8,6,matOf('#c98a5a')],[7.8,7.6,matOf('#f6b6c8')]],1.2);
    s += seam(x,y,z+3.6,7.9) + seam(x,y,z+4.4,7.9);
    const berries = byDk([0,72,144,216,288].map(a=>{ const r=a*Math.PI/180; return [x+5*Math.cos(r), y+5*Math.sin(r)]; }), p=>p);
    for (const [bx,by] of berries) s += ball(bx,by,z+9.6,1.5,matOf('#e2483d'),.7);
    s += ball(x,y,z+10.2,1.8,matOf('#c92a3e'),.7);
    return s;
  },
  eggs(x,y,z){
    let s = box(x-5,y-7.5,z,x+5,y+7.5,z+3.5,CARD,toneI,1);
    const pts = []; for (const dx of [-2.5,2.5]) for (let j=0;j<3;j++) pts.push([x+dx, y-5+5*j]);
    for (const [ex,ey] of byDk(pts, p=>p)) s += ball(ex,ey,z+5.3,2.1,EGG,.75,1.2);
    return s;
  },
  milk(x,y,z){
    const blue = matOf('#3f7fd6');
    let s = lathe(x,y,z,[[3.2,0],[3.6,.8,MILK],[3.6,5,MILK],[3.6,9,blue],[3.6,12,MILK],[2.1,16,MILK],[1.9,18,MILK],[2.1,18.1,blue],[2.1,19.6,blue]],1.2);
    const [gx,gy] = GO(2.6);
    s += glint([x+gx,y+gy,z+2],[x+gx,y+gy,z+14]);
    return s;
  },
  jam(x,y,z){
    const jam = matOf('#b8283e'), lab = matOf('#fff3d9'), lid = matOf('#e2483d');
    let s = lathe(x,y,z,[[3.8,0],[4.2,.7,jam],[4.2,2.6,jam],[4.2,5.8,lab],[4.2,7,jam],[3.5,8,jam],[3.8,8.1,lid],[3.8,10,lid]],1.1);
    s += ball(x+1.8,y-1.2,z+10.3,.6,{l:'#ffffff',m:'#ffffff'},0) + ball(x-.6,y+1.6,z+10.3,.6,{l:'#ffffff',m:'#ffffff'},0);
    const [gx,gy] = GO(3);
    return s + glint([x+gx,y+gy,z+1.2],[x+gx,y+gy,z+6.6],.5,1);
  },
  pickles(x,y,z){
    const g = matOf('#7ea33c'), lid = matOf('#d9b23a');
    let s = lathe(x,y,z,[[3.9,0],[4.3,.7,g],[4.3,11,g],[3.6,12,g],[3.9,12.1,lid],[3.9,14,lid]],1.1);
    s += seam(x,y,z+4,4.35,.5) + seam(x,y,z+8,4.35,.5);
    const [gx,gy] = GO(3);
    return s + glint([x+gx,y+gy,z+1.2],[x+gx,y+gy,z+10],.5,1);
  },
  cheese(x,y,z){
    const c = matOf('#f6cf55'), A = [[x-5,y-5,z],[x+5,y-5,z],[x+5,y+5,z]], B = A.map(([a,b])=>[a,b,z+5]);
    let s = loft(A,B,nr=>toneI(nr,c)) + fill(pd(B),c.l) + ink(pd(B),.9) + hullInk([...A,...B],1.1);
    for (const [hx,hy,r] of [[3,-3,.9],[0,-3.5,.6],[3.5,0,.7]]) s += fill(pd(on(PZ(z+5.05),ellUV(x+hx,y+hy,r,r,10))), c.d);
    if (facing([1,0,0])) for (const [hy,hz,r] of [[-2,2,.8],[2.5,3,.6]]) s += fill(pd(on(PX(x+5.05),ellUV(y+hy,z+hz,r,r,10))), c.d);
    return s;
  },
  melon(x,y,z){
    let s = lathe(x,y,z,[[7,0],[8,.8,PLATE]],1);
    const prof = arcUV(y,z+.8,8,0,180,14), A = on(PX(x-2),prof), B = on(PX(x+2),prof), X = x+2.05;
    s += loft(A,B,nr=>toneI(nr,matOf('#3f8f45')));
    s += fill(pd(B),'#2f7a3b') + fill(pd(on(PX(X),arcUV(y,z+.8,7.2,0,180,14))),'#e8f3c4') + fill(pd(on(PX(X),arcUV(y,z+.8,6.4,0,180,14))),'#ef5257');
    for (const [a,r] of [[30,4],[60,4.4],[90,4],[120,4.4],[150,4],[45,2],[90,1.8],[135,2]]){
      const t=a*Math.PI/180; s += fill(pd(on(PX(X+.05),ellUV(y+r*Math.cos(t),z+.8+r*Math.sin(t),.45,.7,8))),'#2a1f1a');
    }
    return s + ink(pd(B),1) + hullInk([...A,...B],1.2);
  },
  cola(x,y,z){ return canX(x,y,z,'#d8322f'); },
  lemonade(x,y,z){ return canX(x,y,z,'#f2d12e'); },
  leftovers(x,y,z){
    let s = box(x-4.5,y-5,z,x+4.5,y+5,z+5,GLASS,toneI,1);
    s += fill(pd(on(PX(x+4.6),rectUV(y-4,z+.8,y+4,z+3.5))),'#e08a3c','opacity=".75"');
    s += box(x-4.9,y-5.4,z+5,x+4.9,y+5.4,z+6.6,matOf('#4c8ad8'),toneI,1);
    return s;
  },
};
function canX(x,y,z,col){
  let s = lathe(x,y,z,[[2.7,0],[3.2,.8,METAL],[3.2,10.4,matOf(col)],[2.7,11.4,METAL]],1.1);
  s += line([[x+.4,y+.6,z+11.45],[x+1.6,y+1.6,z+11.45]],.7) + fill(pd(on(PX(x+3.25),rectUV(y-1.3,z+3.5,y+1.3,z+7))),'#ffffff','opacity=".6"');
  return s;
}
// door goods (positions in the door's local frame)
const DOORFOOD = {
  water(fr,y,z){ const [x,yy] = fr.R(-5.2,y,z), b = matOf('#bfe3f2'), cap = matOf('#3f7fd6');
    return lathe(x,yy,z,[[2.8,0],[3.1,.6,b],[3.1,8,b],[3.1,12,matOf('#5aa0e8')],[3.1,16,b],[1.4,21,b],[1.5,21.1,cap],[1.5,23,cap]],1.1) + glint([x+GO(2.3)[0],yy+GO(2.3)[1],z+1.5],[x+GO(2.3)[0],yy+GO(2.3)[1],z+14],.6); },
  juice(fr,y,z){ const [x,yy] = fr.R(-5.2,y,z), o = matOf('#f39a2b'), cap = matOf('#3a9a4a');
    return lathe(x,yy,z,[[2.9,0],[3.2,.6,o],[3.2,6,o],[3.2,11,matOf('#fff3d9')],[3.2,14,o],[1.6,18,o],[1.7,18.1,cap],[1.7,20,cap]],1.1); },
  ketchup(fr,y,z){ const [x,yy] = fr.R(-5.2,y,z), r = matOf('#d8322f'), cap = MILK;
    return lathe(x,yy,z,[[2.6,0],[2.6,2.2,cap],[2.9,2.4,r],[3.2,9,r],[3.2,12,matOf('#fff3d9')],[2.6,14.5,r]],1.1); },
  wine(fr,y,z){ const [x,yy] = fr.R(-5.2,y,z), g = matOf('#2f5b3a'), foil = matOf('#9c2235');
    return lathe(x,yy,z,[[2.9,0],[3.2,.6,g],[3.2,9,g],[3.2,13,matOf('#efe6cf')],[3.2,15,g],[1.3,20,g],[1.3,22,g],[1.4,22.1,foil],[1.4,26,foil]],1.1) + glint([x+GO(2.4)[0],yy+GO(2.4)[1],z+1.5],[x+GO(2.4)[0],yy+GO(2.4)[1],z+12],.45); },
  oatmilk(fr,y,z){ return carton(fr,-5.2,y,z,'#f1eadb','#4c8ad8'); },
  oj(fr,y,z){ return carton(fr,-5.2,y,z,'#f6b13b','#3a9a4a'); },
};
const NAMES = { cake:'the cake', eggs:'the eggs', milk:'the milk', jam:'the jam', pickles:'the pickles', cheese:'the cheese',
  melon:'the watermelon slice', cola:'a can of cola', lemonade:'a can of lemonade', leftovers:'the leftovers',
  water:'the water', juice:'the orange juice', ketchup:'the ketchup', wine:'the wine', oatmilk:'the oat milk', oj:'the OJ carton' };
// spread across the compartment (opening y 5-70): they all sat at y 12-41, leaving the far side empty seen head-on
const ITEMS = [
  { k:'cake',      sh:0, x:38, y:26.2 },
  { k:'eggs',      sh:0, x:45, y:53.2 },
  { k:'pickles',   sh:1, x:37, y:42.8 },
  { k:'milk',      sh:1, x:46, y:15.8 },
  { k:'jam',       sh:1, x:45, y:33.8 },
  { k:'cheese',    sh:1, x:46, y:56.2 },
  { k:'lemonade',  sh:2, x:38, y:48.8 },
  { k:'melon',     sh:2, x:43, y:23.2 },
  { k:'cola',      sh:2, x:46, y:44.2 },
  { k:'leftovers', sh:2, x:46, y:59.2 },
];
const BINS = [   // fridge door bins (local y range 8..67)
  { z:17,  h:7, goods:[['water',15],['juice',28],['ketchup',41],['wine',55]] },
  { z:52,  h:6, goods:[['oatmilk',30],['oj',45]] },   // centred in the bin (local y 8..67)
  { z:84,  h:4, eggs:true },
];

/* ---------- interiors ---------- */
const take = (k, svg) => act('take', svg, `data-k="${k}"`);
function fridgeInside(st){
  const lit = lightLevel(st), ring0 = on(PX(T),F_OPEN), ring1 = on(PX(CW),F_OPEN);
  let s = fill(pd(ring0), LINER.m);
  s += loft(ring0, ring1, n => n[2]>.7 ? '#e3e7e3' : n[1]>.7 ? LINER.l : LINER.m, true);
  // shelf rails moulded into whichever side wall is seen (the y = T wall from the front, the y = D−T wall from the right)
  const wy = facing([0,1,0]) ? T+.1 : D-T-.1;
  for (const z of [...SHELVES, 72, 47]) s += line([[T+3,wy,z-1.5],[CW-6,wy,z-1.5]],.6);
  // lamp housing on the y = T wall, near the top (that wall is turned away in the right-side view)
  if (facing([0,1,0])) s += shape(on(PY(T+.15),rrUV(30,106,50,113,2)), lit>.5 ? '#fffbe2' : '#d3d6cf', 1);
  // crisper drawer: veggies behind a frosted front
  const lettuce = [30,20,15], veg = [{ at:lettuce, svg: lathe(...lettuce,[[0,0],[5,1.5,matOf('#7cc15a')],[6.5,4.5,matOf('#7cc15a')],[6,8,matOf('#8fd16a')],[3.5,10,matOf('#8fd16a')],[.5,10.6,matOf('#a6e07c')]],1.1) }];
  for (const [vx,vy,c] of [[38,34,'#e2483d'],[44,28,'#e2483d'],[42,40,'#f2d12e'],[47,35,'#e2483d']]) veg.push({ at:[vx,vy,15], svg: ball(vx,vy,18.2,3,matOf(c),.8) });
  s += byDepth(veg);
  s += fill(pd(on(PX(54),rrUV(6,15,69,33.5,2))),'#e8f4f5','opacity=".62"') + ink(pd(on(PX(54),rrUV(6,15,69,33.5,2))),1.1);
  s += shape(on(PX(54.1),rrUV(28,28.5,48,31,1.2)),'#b9c4c5',.8);
  // shelves bottom-up, each with its items back-to-front
  SHELVES.forEach((z,i) => {
    const top = [[T,T,z],[54,T,z],[54,D-T,z],[T,D-T,z]];
    s += fill(pd(top), GLASS.l, 'opacity=".5"') + ink(pd(top),.7);
    s += shape([[54,T,z-1.6],[54,D-T,z-1.6],[54,D-T,z],[54,T,z]], '#eef4f4', .9);
    const items = byDk(ITEMS.filter(o => o.sh===i && !st.taken.includes(o.k)), o => [o.x,o.y]);
    for (const o of items) s += take(o.k, FOOD[o.k](o.x,o.y,z+.6));
  });
  // light: glow when on, darkness when off
  if (lit > 0) s += `<g pointer-events="none"><ellipse cx="${f(P(40,T,110)[0])}" cy="${f(P(40,T,110)[1])}" rx="34" ry="26" fill="#fffbe0" opacity="${(.28*lit).toFixed(2)}"/>`
     + `<ellipse cx="${f(P(40,T,110)[0])}" cy="${f(P(40,T,110)[1])}" rx="14" ry="10" fill="#ffffff" opacity="${(.5*lit).toFixed(2)}"/></g>`;
  s += fill(pd(ring1), '#18222a', `opacity="${((1-lit)*.74).toFixed(2)}" pointer-events="none"`);
  return clipTo(ring1, s);
}
function freezerInside(){
  const ring0 = on(PX(T),Z_OPEN), ring1 = on(PX(CW),Z_OPEN);
  let s = fill(pd(ring0), FROST.m);
  s += loft(ring0, ring1, n => n[2]>.7 ? '#dcecf3' : n[1]>.7 ? FROST.l : FROST.m, true);
  // frost patches
  const fy = facing([0,1,0]) ? T+.1 : D-T-.1;
  for (const [x,z,rx,rz] of [[30,150,9,4],[48,138,6,3],[20,140,7,3]]) s += fill(pd(on(PY(fy),ellUV(x,z,rx,rz,16))),'#ffffff','opacity=".85"');
  s += fill(pd(on(PZ(128.1),ellUV(28,30,10,6,16))),'#ffffff','opacity=".7"');
  // ice-cream tub (back), ice tray (front)
  const tub = lathe(38,36,128,[[5,0],[5.6,7,matOf('#f6d9e2')],[5.9,7.1,matOf('#d8608a')],[5.9,9,matOf('#d8608a')]],1.1);
  let tray = fill(pd(on(PX(43.7),rectUV(33,130,39,134))),'#7a4a2f','opacity=".0"') + box(40,9,128,56,27,131.2,matOf('#cfe5f1'),toneI,1);
  const cubes = []; for (let i=0;i<2;i++) for (let j=0;j<4;j++) cubes.push([44+i*7, 12.2+j*4.2]);
  for (const [cx,cy] of byDk(cubes, p=>p)) tray += box(cx-2.4,cy-1.6,131.2,cx+1.4,cy+1.6,133.4,{l:'#ffffff',m:'#e3f1f7',d:'#b9d4e0'},toneI,.6);
  const peas = box(44,44,128,55,56,130.4,matOf('#5cae4f'),toneI,1) + tx(55.1,50,128.7,'PEAS',2.2,'#ffffff');   // bag of peas
  // ice-cream tub (back), ice tray (front), peas; in the right-side view the peas are furthest
  s += byDepth([{ box:[[32.1,30.1,128],[43.9,41.9,137]], svg:tub }, { box:[[40,9,128],[56,27,133.4]], svg:tray }, { box:[[44,44,128],[55,56,130.4]], svg:peas }]);
  return clipTo(ring1, s);
}

/* ---------- doors ---------- */
const GASKET_M = { l:'#d3d5cf', m:GASKET, d:'#a2a59e' };
function gasketAndLiner(fr, outerUV, innerUV, linerUV, lm=LINER){
  // the gasket is a soft bead standing 1 off the door: its walls (inner wall seen across the ring), then its face
  const g0 = on(PD(fr,0),outerUV), g1 = on(PD(fr,-1),outerUV), h0 = on(PD(fr,0),innerUV), h1 = on(PD(fr,-1),innerUV);
  let s = loft(h0,h1,nr=>toneI(nr,GASKET_M),true) + loft(g0,g1,nr=>toneI(nr,GASKET_M));
  s += `<path d="${pd(g1)}${pd(h1)}" fill="${GASKET}" fill-rule="evenodd"/>` + ink(pd(h1),.7);
  const a = on(PD(fr,-.3),linerUV), b = on(PD(fr,-2),linerUV);
  s += loft(a,b,nr=>toneI(nr,lm)) + fill(pd(b), toneI(neg(fr.nT),lm)) + ink(pd(b),.9);
  return s;
}
function bin(fr,y0,y1,z0,h,contents){
  const R = fr.R, t0 = -9.5, t1 = -2; let s = '';
  s += shape([R(t0,y0,z0),R(t1,y0,z0),R(t1,y1,z0),R(t0,y1,z0)], '#e4ecec', .8);                   // floor
  // the two end walls: which one is far depends on the door angle and the view
  const yf = vis(fr.nY) ? y0 : y1, yn = yf===y0 ? y1 : y0;
  s += shape([R(t0,yf,z0),R(t1,yf,z0),R(t1,yf,z0+h+3),R(t0,yf,z0+h)], '#d9e3e4', .8);             // far end (inside)
  s += contents;
  const lip = [R(t0,y0,z0),R(t0,y1,z0),R(t0,y1,z0+h),R(t0,y0,z0+h)];
  if (vis(neg(fr.nT))) s += fill(pd(lip), '#cfe9f0', 'opacity=".72"') + ink(pd(lip),1)
      + fill(pd([R(t0-.05,y0+3,z0+1.5),R(t0-.05,y0+7,z0+1.5),R(t0-.05,y0+12,z0+h-1),R(t0-.05,y0+8,z0+h-1)]),'#ffffff','opacity=".45"');
  s += shape([R(t0,yn,z0),R(t1,yn,z0),R(t1,yn,z0+h+3),R(t0,yn,z0+h)], '#e9f3f4', .9);            // near end
  s += line([R(t0,y0,z0+h),R(t0,y1,z0+h)],1.3);
  return s;
}
function fridgeDoorInner(fr, st){
  let s = gasketAndLiner(fr, rrUV(1.4,8.4,D-1.4,121.6,2), rrUV(3.6,10.6,D-3.6,119.4,2), rrUV(4.4,11.4,D-4.4,118.6,2));
  for (const b of BINS){
    let c = '';
    if (b.goods){
      const g = b.goods.filter(([k])=>!st.taken.includes(k)).map(([k,y])=>({k,y,d:(([x,yy])=>dk(x,yy))(fr.R(-5.2,y,b.z))})).sort((p,q)=>p.d-q.d);
      for (const o of g) c += take(o.k, DOORFOOD[o.k](fr,o.y,b.z+.2));
    }
    if (b.eggs){
      const e = byDk([14,22,30,38,46,54,62].map(y=>fr.R(-5.6,y,b.z+2.4)), p=>[p[0],p[1]]);
      for (const p of e) c += ball(p[0],p[1],p[2],2.2,EGG,.75,1.22);
    }
    s += bin(fr,8,67,b.z,b.h,c);
  }
  // dairy compartment with a flip lid
  s += rbox(fr,-8.5,-2,10,46,103,111,LINER,1);
  s += rbox(fr,-8.9,-2,9.6,46.4,111,112.4,matOf('#dfe9ea'),1);
  if (vis(neg(fr.nT))) s += txF(fr,-8.6,28,106,'DAIRY',3,'#7d8b8c',800,true);
  return s;
}
function freezerDoorInner(fr){
  let s = gasketAndLiner(fr, rrT(1.4,126,D-1.4,H-1.4,18.6,2), rrT(3.6,128.2,D-3.6,H-3.6,16.4,2), rrT(4.4,129,D-4.4,H-4.4,15.6,2), FROST);
  const R = fr.R, z0 = 131;
  let c = '';
  for (const [y,col] of byDk([[20,'#e2483d'],[30,'#f2d12e'],[40,'#4c8ad8']], ([y]) => { const p = fr.R(-5.75,y,z0); return [p[0],p[1]]; })) c += rbox(fr,-8,-3.5,y-3.5,y+3.5,z0,z0+9,matOf(col),.9);
  s += bin(fr,10,62,z0,4,c);
  return s;
}
function handleBar(fr, y, za, zb){
  let s = '', posts = [tube(fr.R(DT,y,za+1.5),fr.R(DT+3.2,y,za+1.5),.9,METAL,.9), tube(fr.R(DT,y,zb-1.5),fr.R(DT+3.2,y,zb-1.5),.9,METAL,.9)];
  const bar = tube(fr.R(DT+3.3,y,za),fr.R(DT+3.3,y,zb),1.35,METAL,1.1) + glint(fr.R(DT+4.3,y-.8,za+1.5),fr.R(DT+4.3,y-.8,zb-1.5),.85,.9);
  return vis(fr.nT) ? posts.join('') + bar : bar + posts.join('');
}
// The door's inner side (gasket, liner, bins) reaches 9.5 behind the door, so while the door is near shut part of it is
// still inside the cabinet, where it can only be seen through the opening. Whatever has swung out in front of the
// cabinet's front plane (x > CW) is never hidden by the cabinet. So, until every bin is out (or whenever the front is
// turned away), clip the inner side to: outside the cabinet's outline + the opening + the screen area of the part of the
// door's inner volume that lies in front of the front plane.
function innerClip(kind, deg, inner, fr){
  const front = facing([1,0,0]), a = deg*Math.PI/180;
  if (front && -9.5*Math.cos(a) + 8*Math.sin(a) >= 0) return inner;
  // one path, nonzero winding (browsers may merge a clip's children into one path): the regions we keep wind one way,
  // the cabinet's outline is cut out by winding it the other way
  const area = q => q.reduce((s,p,i) => { const n = q[(i+1)%q.length]; return s + p[0]*n[1] - n[0]*p[1]; }, 0);
  const ring = (q, sign=1) => sp(area(q)*sign >= 0 ? q : q.slice().reverse());
  const sh = hull([...on(PX(0),OUT), ...on(PX(CW),OUT)].map(p => P(...p))), bx = sh.map(p => p[0]), by = sh.map(p => p[1]);
  const x0 = Math.min(...bx) - 400, x1 = Math.max(...bx) + 400, y0 = Math.min(...by) - 400, y1 = Math.max(...by) + 400;
  let d = ring([[x0,y0],[x1,y0],[x1,y1],[x0,y1]]) + ring(sh, -1);
  if (front){
    d += ring(on(PX(CW), kind==='door' ? F_OPEN : Z_OPEN).map(p => P(...p)));
    // the door's inner volume (its profile, t −9.5..0) cut by the plane x = CW, kept on the front side:
    // at each profile point the kept depths are t from max(−9.5, the plane) to 0
    const c = Math.cos(a), sn = Math.sin(a), pts = [];
    for (const [y,z] of (kind==='door' ? FDOOR : ZDOOR)){
      const tm = c > 1e-9 ? Math.max(-9.5, -y*sn/c) : -9.5;
      if (tm <= 0) pts.push(P(...fr.R(tm,y,z)), P(...fr.R(0,y,z)));
    }
    if (pts.length > 2) d += ring(hull(pts));
  }
  return `<clipPath id="dclip-${kind}"><path d="${d}"/></clipPath><g clip-path="url(#dclip-${kind})">${inner}</g>`;
}
function drawDoor(kind, deg, m, st){
  const fr = doorFrame(deg), prof = kind==='door' ? FDOOR : ZDOOR;
  const A = on(PD(fr,0),prof), B = on(PD(fr,DT),prof), nF = fr.nT, nB = neg(fr.nT);
  const slab = loft(A,B,n=>tone(n,m));
  const inner = innerClip(kind, deg, kind==='door' ? fridgeDoorInner(fr,st) : freezerDoorInner(fr), fr);
  const handle = kind==='door' ? handleBar(fr, D-6, 98, 117) : handleBar(fr, D-6, 128, 143);
  let s = '';
  if (vis(nB)){
    s += handle + slab + fill(pd(A), tone(nB,m)) + hullInk([...A,...B],2.2) + inner;
  } else {
    s += inner + slab + fill(pd(B), tone(nF,m));
    const Q = PD(fr,DT+.05);
    // glossy streaks
    const zz = kind==='door' ? [12,118] : [128,160];
    s += fill(pd(on(Q,[[D-16,zz[0]],[D-11,zz[0]],[D-26,zz[1]],[D-31,zz[1]]])),'#ffffff','opacity=".2" pointer-events="none"');
    s += fill(pd(on(Q,[[D-34,zz[0]],[D-32,zz[0]],[D-47,zz[1]],[D-49,zz[1]]])),'#ffffff','opacity=".16" pointer-events="none"');
    s += hullInk([...A,...B],2.2) + ink(pd(B),1.6);
    if (kind==='door'){   // badge
      s += shape(on(Q,rrUV(25,110.5,50,116.5,3)), METAL.l, 1.1);
      s += txF(fr,DT+.15,37.5,112.3,'FRIGO',3.6,INK);
    }
    s += handle;
  }
  return act(kind==='door' ? 'door' : 'fz', s);
}

/* ---------- light, puff, beep ---------- */
function lightLevel(st){
  if (st.door <= .002) return 0;
  if (!st.beep) return 1;
  const t = st.flick, v = Math.sin(t*31) + Math.sin(t*13.7) + Math.sin(t*5.3);
  return v > .9 ? .12 : v > -.2 ? .5 : 1;
}
function puff(p){
  // cold air spills over the freezer's bottom lip and sinks, spreading and fading
  let s = '';
  const BL = [[12,0,0,5],[24,2,.04,5.5],[36,-1,.02,6],[48,1,.08,5.5],[60,0,.12,5],[18,-3,.16,4.5],[42,-4,.2,5],[54,-2,.26,4.5],[30,-6,.3,4]];
  for (const [y,dz,ph,r0] of BL){
    const q = Math.max(0, Math.min(1,(p-ph)/(1-ph))); if (q<=0 || q>=1) continue;
    const e = 1-Math.pow(1-q,2), [cx,cy] = P(CW-1+e*22, y+e*5, 131+dz-e*e*24), r = (r0+e*8)*R3, o = .92*Math.pow(1-q,.8);
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#ffffff" opacity="${o.toFixed(2)}"/>`;
    s += `<circle cx="${f(cx-r*.25)}" cy="${f(cy-r*.3)}" r="${f(r*.55)}" fill="#f4fbfe" opacity="${o.toFixed(2)}"/>`;
  }
  return `<filter id="mist" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.3"/></filter><g pointer-events="none" filter="url(#mist)">${s}</g>`;
}

/* ---------- the two faces never seen from the front ---------- */
const COIL = '#2b2825';
// what lies flat on the back cap (x = 0): drawn only when the back faces the viewer
function backPanel(m){
  const B = on(PX(0),OUT), nb = [-1,0,0];
  let s = fill(pd(B), tone(nb,m)) + ink(pd(B),2.2);
  // rating label + a little warning triangle
  s += shape(on(PX(-.1),rectUV(25,144,51,157.5)), '#f6f4ec', .9);
  s += txB(-.15,38,153.4,'FRIGO · MOD F-170',1.75,INK,800);
  s += txB(-.15,38,150.6,'220-240V~ 50Hz 1.1A',1.35,'#4a453c',600);
  s += txB(-.15,38,148.2,'R600a 38g · CLASS N-ST',1.35,'#4a453c',600);
  for (let i=0;i<14;i++){ const y = 27.5+i*.9+(i%3)*.15; s += line([[-.15,y,145],[-.15,y,146.8]], i%4 ? .35 : .6); }
  s += shape(on(PX(-.1),[[54,145],[60,145],[57,150.5]]), '#f2c230', .8) + txB(-.15,57,145.7,'!',2.6,INK,900);
  // soft shadow of the condenser on the back panel
  s += fill(pd(on(PX(-.05),rectUV(13.5,30,64.5,138))), mix(tone(nb,m),'#000000',.18), 'opacity=".55"');
  // power-cord grommet and the screws holding the back panel
  s += fill(pd(on(PX(-.1),ellUV(58,24,1.5,1.5,12))), DARK.d) + ink(pd(on(PX(-.1),ellUV(58,24,1.5,1.5,12))),.6);
  for (const [y,z] of [[6,10],[69,10],[6,140],[69,140],[37.5,162]]) s += fill(pd(on(PX(-.1),ellUV(y,z,.75,.75,10))), METAL.m) + ink(pd(on(PX(-.1),ellUV(y,z,.75,.75,10))),.5);
  return s;
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

/* ---------- see-through: how a real frost-free fridge works ----------
   The compressor pumps hot refrigerant gas up the condenser on the back, where it gives off its heat and turns liquid.
   The filter-drier cleans it, the thin capillary tube meters it into the evaporator behind the freezer, where it boils
   and soaks up heat; the suction line carries the gas back down to the compressor. A fan blows air over the evaporator
   into the freezer and, through a duct and damper, into the fridge. Every so often the defrost heater melts the frost;
   the water drains down the back wall into a pan on the compressor, whose heat dries it.
   Parts (each held by another; refrigerant, water, air and wires each run from a real port to a real port):
   LOOP    compressor (dome) on its bracket . four rubber grommets with bolts . terminal cover . start relay . process
           tube . discharge line . condenser coil with its wires, straps and standoffs . filter-drier . capillary tube
           through a grommet in the back wall, up inside the foam to the evaporator inlet . evaporator: finned block,
           four tube rows, U-bends, two brackets on the liner . accumulator on the outlet . suction line up into the
           wall, down inside the foam, out through a grommet to the compressor
   AIR     evaporator fan motor on its bracket . shaft . hub . four blades . duct through the divider . air damper with
           its louvres in the fridge ceiling
   DEFROST defrost heater (glass tube, end caps, two clips) under the evaporator . defrost thermostat on the coil .
           drain trough . drain tube through the divider and down the back wall . drip pan on legs over the compressor
   CONTROL control housing in the fridge ceiling . thermostat knob . thermostat sensing tube and bulb on the back
           liner . defrost timer . lamp socket and bulb on the side wall . door switch in the divider with its plunger
   WIRES   relay up the back wall to the control housing (grommet) . housing to fan, heater, defrost thermostat (lanes
           along the ceiling, up the back wall) . housing to the lamp, the door switch and the timer
   CABINET inner liners of both compartments . foam insulation in the walls (front frame, back wall) . door gaskets
           with their magnet strips */
let MECH_LABELS = '';
const FCOP = { l:'#f0b07a', m:'#d08a52', d:'#9a5a2c' }, FGM = { l:'#7c8389', m:'#5c6369', d:'#3b4146' };
const FFIN = { l:'#eef6f8', m:'#cfdfe5', d:'#9cb3bc' }, FPLAST = matOf('#e8e4da'), FOAM = '#f3e3a2';
const EVAP = { x0:6.5, x1:12.5, y0:23, y1:63, z0:133, z1:155 }, ROWS_Z = [136, 141, 146, 151], TX_ = 9.5;
const FAN = { y:13.5, z:148, r:4.6 }, ACCU = { y:66.5, z0:148.5, z1:154.5, r:1.6 }, HEAT_Z = 132.4, HX = 14;
const DRIER = { x:-2.6, y:66.5, z0:121, z1:130 }, PAN = [-11.5, 29, 17, -1, 40, 19.5];
const CTRL = [26, 26, 113, 46, 50, 119], DAMP = [14, 49, 114.5, 22, 59, 119], DUCT = [14, 50, 119, 20, 58, 128];
const SWB = [57, 50, 120.5, 63, 55, 124.5], TIMER = [18, 34, 115, 24, 42, 119];
// refrigerant phase: cooling most of the time, a defrost now and then, then a rest (doors open keep it cooling)
const fridgePhase = st => { if (st.door > 0 || st.fz > 0) return 'open';
  const c = ((performance.now()/1000) % 40)/40; return c < .62 ? 'cool' : c < .8 ? 'defrost' : 'idle'; };
const fBoxOf = pts => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - .6), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + .6)];
const fBend = (pts, r = 2) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i-1], pts[i], pts[i+1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    const p = a.map((v, k) => b[k] + (v - b[k])*d/la), q = c.map((v, k) => b[k] + (v - b[k])*d/lc);
    for (let j = 0; j <= 5; j++){ const t = j/5; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a pipe or cable as short depth-sortable pieces; ends = terminal dots; flow = moving dashes phased along the whole route
const fLine = (pts, col, w = .6, ends = true, flow = null) => { const q = fBend(pts), out = [], L = 9, t = performance.now()/1000;
  let s0 = 0;
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j-1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false); let sl = 0; for (let n = 1; n < seg.length; n++) sl += Math.hypot(...seg[n].map((v, k) => v - seg[n-1][k]));
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + 1.1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (flow) svg += `<path d="${d}" fill="none" stroke="${flow}" stroke-width="${f(Math.max(.5, w*.8))}" stroke-linecap="round" stroke-dasharray="1.6 3.4" stroke-dashoffset="${f(s0*CAM_K - t*16)}" opacity=".9"/>`;
    for (const e of [i === 0 && ends ? q[0] : null, j === q.length - 1 && ends ? q[j] : null]) if (e){ const [X, Y] = P(...e); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r="1.1" fill="${INK}"/>`; }
    out.push({ box: fBoxOf(seg), svg }); s0 += sl; i = j; }
  return out; };
// door gasket: a soft bead on the door's inner face (t 0..−1), its magnet strip down the middle of the face
function gasketXR(fr, outer, inner, mid){
  const g0 = on(PD(fr,0),outer), g1 = on(PD(fr,-1),outer), h0 = on(PD(fr,0),inner), h1 = on(PD(fr,-1),inner);
  const inside = vis(neg(fr.nT)), fo = inside ? g1 : g0, fi = inside ? h1 : h0;
  let s = loft(h0,h1,nr=>toneI(nr,GASKET_M),true) + loft(g0,g1,nr=>toneI(nr,GASKET_M));
  s += `<path d="${pd(fo)}${pd(fi)}" fill="${GASKET}" fill-rule="evenodd"/>` + ink(pd(fo),.8) + ink(pd(fi),.7);
  s += `<path d="${pd(on(PD(fr, inside ? -1.05 : .05), mid))}" fill="none" stroke="#5c6369" stroke-width=".9"/>`;
  return { box: fBoxOf([...g0, ...g1]), svg: s };
}
function fridgeMech(st, k){
  const t = performance.now()/1000, ph = fridgePhase(st), run = ph === 'cool' || ph === 'open', defrost = ph === 'defrost';
  const fanOn = run && st.door <= 0, lit = lightLevel(st) > 0, back = facing([-1,0,0]);
  const inner = [], outer = [], put = (b, svg, L = inner) => L.push({ box: b, svg });
  const bx = (x0, y0, z0, x1, y1, z1, m, w = .7, L = inner) => put([[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, m, toneI, w), L);
  const live = on => on ? matOf('#ff9a3a') : FGM;
  const H_ = '#3a3632', ON = '#ffb347', cold = run ? '#bfe6f5' : null, hot = run ? '#fff1d6' : null;
  // ===== cabinet: liners (far faces only), foam in the front frame and the back wall
  let bg = '';
  for (const op of [F_OPEN, Z_OPEN]){ const r0 = on(PX(T), op), r1 = on(PX(CW - .6), op);
    bg += `<g opacity=".2">${loft(r0, r1, n => toneI(n, LINER), true)}${facing([1,0,0]) ? fill(pd(r0), LINER.m) : ''}</g>` + `<g opacity=".5">${ink(pd(r0), .6)}</g>`; }
  const foamAt = x => `<path d="${pd(on(PX(x), OUT))}${pd(on(PX(x), F_OPEN))}${pd(on(PX(x), Z_OPEN))}" fill="${FOAM}" fill-rule="evenodd" opacity=".55"/>`;
  const bubbles = x => { let b = ''; for (let z = 7; z < H - 3; z += 3.1) for (let y = 1.2; y < D - 1; y += 2.9){ const yy = y + ((z*7.3) % 1.7), zz = z + ((y*3.1) % 1.4);
      const inFrame = yy < 4.2 || yy > 70.8 || (zz > 120 && zz < 127) || zz < 13 || zz > 165.5; if (!inFrame || zz > H - 2 - Math.max(0, 20 - Math.min(yy, D - yy))*.9) continue;
      b += pd(on(PX(x), ellUV(yy, zz, .45, .45, 6))); } return `<path d="${b}" fill="none" stroke="#c9a94a" stroke-width=".35" opacity=".8"/>`; };
  if (facing([1,0,0])) bg += foamAt(CW - .3) + bubbles(CW - .25) + `<g opacity=".7">${ink(pd(on(PX(CW - .3), F_OPEN)), .6)}${ink(pd(on(PX(CW - .3), Z_OPEN)), .6)}</g>`;
  // ===== compressor outside the back: grommets, terminal cover, process tube, drip pan on legs, filter-drier
  for (const [x, y] of [[-10.8, 18.2], [-1.6, 18.2], [-10.8, 29.8], [-1.6, 29.8]])
    put([[x - 1.1, y - 1.1, 5.4], [x + 1.1, y + 1.1, 7.2]], cyl(x, y, 5.4, 6.5, 1.1, DARK, toneI, .6, 12) + cyl(x, y, 6.5, 7.2, .5, METAL, toneI, .4, 8), outer);
  bx(-7.6, 29.4, 7, -4.8, 31.4, 10.6, DARK, .6, outer);                                                   // terminal cover on the dome
  put([[-6.6, 24.8, 15.4], [-5.8, 25.6, 18.6]], rod([-6.2, 25.2, 15.4], [-6.2, 25.2, 18.6], .35, FCOP, toneI, .4), outer);   // process tube, crimped
  for (const [x, y] of [[-10.8, 30.5], [-1.6, 30.5], [-10.8, 35.4], [-1.6, 35.4]])                       // pan legs on the bracket
    put([[x - .4, y - .4, 5.4], [x + .4, y + .4, PAN[2]]], rod([x, y, 5.4], [x, y, PAN[2]], .35, FGM, toneI, .4), outer);
  { let pan = box(...PAN, FGM, toneI, .8);
    const top = on(PZ(PAN[5] + .05), rrUV(PAN[0] + .7, PAN[1] + .7, PAN[3] - .7, PAN[4] - .7, .6));
    pan += shape(top, '#2f3438', .5) + `<path d="${pd(on(PZ(PAN[5] - .3), rrUV(PAN[0] + 1.4, PAN[1] + 1.4, PAN[3] - 1.4, PAN[4] - 1.4, .6)))}" fill="#8fc6dc" opacity="${defrost ? .9 : .55}"/>`;
    put([[PAN[0], PAN[1], PAN[2]], [PAN[3], PAN[4], PAN[5]]], pan, outer); }
  put([[DRIER.x - 1.3, DRIER.y - 1.3, DRIER.z0], [DRIER.x + 1.3, DRIER.y + 1.3, DRIER.z1]], cyl(DRIER.x, DRIER.y, DRIER.z0, DRIER.z1, 1.3, FCOP, toneI, .7, 14)
    + [DRIER.z0 + 1.2, DRIER.z1 - 1.2].map(z => line(arcUV(DRIER.x, DRIER.y, 1.3, ...nearHalf(), 8).map(([u, v]) => [u, v, z]), .4)).join(''), outer);
  for (const [y, z] of [[64.3, 117], [26, 28.5], [34, 24], [43, 16]])                                       // rubber grommets in the back panel
    put([[-.6, y - 1.2, z - 1.2], [0, y + 1.2, z + 1.2]], `<path d="${pd(on(PX(-.05), ellUV(y, z, 1.2, 1.2, 12)))}" fill="#2f3438"/>` + ink(pd(on(PX(-.05), ellUV(y, z, 1.2, 1.2, 12))), .5), outer);
  // outside legs of the lines: condenser outlet -> drier, drier -> capillary grommet, suction, drain, relay wires
  outer.push(...fLine([[-2.6, 61, 132], [-2.6, 66.5, 132], [-2.6, 66.5, DRIER.z1]], FCOP.m, .55, false, hot));
  outer.push(...fLine([[DRIER.x, DRIER.y, DRIER.z0], [-2.6, 66.5, 117], [-2.6, 64.3, 117], [0, 64.3, 117]], FCOP.l, .3, false, hot));
  outer.push(...fLine([[0, 26, 28.5], [-1.6, 26, 28.5], [-2.6, 26, 30.4]], FCOP.m, .7, false, cold));
  outer.push(...fLine([[0, 34, 24], [-1.8, 34, 24], [-1.8, 34, 20.8]], '#dfe9ea', .55, false));
  outer.push(...fLine([[-2.4, 43, 12], [-2.4, 43, 16], [0, 43, 16]], run ? ON : H_, .5, false));
  outer.push(...fLine([[-3, 38, 8.5], [-3, 33.5, 8.5], [-6.2, 33.5, 8.5], [-6.2, 31.4, 8.5]], run ? ON : H_, .45, false));
  if (defrost){ const u = (t*1.6) % 1; put([[-2.4, 33.4, 19.5], [-1.2, 34.6, 21]], `<ellipse cx="${f(P(-1.8, 34, 20.6 - u*1.2)[0])}" cy="${f(P(-1.8, 34, 20.6 - u*1.2)[1])}" rx=".7" ry="1" fill="#8fc6dc" stroke="${INK}" stroke-width=".3"/>`, outer); }
  // ===== evaporator behind the freezer: finned block, tube rows, U-bends, brackets, frost, accumulator
  for (const y of [EVAP.y0 + 1, EVAP.y1 - 1]) bx(T, y - 1, EVAP.z0 + 4, EVAP.x0, y + 1, EVAP.z1 - 4, FGM, .5);
  { let ev = box(EVAP.x0, EVAP.y0, EVAP.z0, EVAP.x1, EVAP.y1, EVAP.z1, FFIN, toneI, .9);
    if (facing([1,0,0])){ for (let y = EVAP.y0 + 1.6; y < EVAP.y1; y += 1.6) ev += line([[EVAP.x1 + .05, y, EVAP.z0 + .3], [EVAP.x1 + .05, y, EVAP.z1 - .3]], .3);
      for (const z of ROWS_Z) ev += fill(pd(on(PX(EVAP.x1 + .1), ellUV(EVAP.y0 + 4, z, .9, .9, 10))), FCOP.m) + fill(pd(on(PX(EVAP.x1 + .1), ellUV(EVAP.y1 - 4, z, .9, .9, 10))), FCOP.m);
      if (ph !== 'defrost') ev += `<path d="${pd(on(PX(EVAP.x1 + .12), rrUV(EVAP.y0 + 2, EVAP.z0 + 6, EVAP.y1 - 3, EVAP.z1 - 2, 3)))}" fill="#ffffff" opacity="${ph === 'idle' ? .35 : .5}"/>`; }
    if (facing([0,0,1])) for (let y = EVAP.y0 + 1.6; y < EVAP.y1; y += 1.6) ev += line([[EVAP.x0 + .3, y, EVAP.z1 + .05], [EVAP.x1 - .3, y, EVAP.z1 + .05]], .3);
    put([[EVAP.x0, EVAP.y0, EVAP.z0], [EVAP.x1, EVAP.y1, EVAP.z1]], ev); }
  const ubend = (y, za, zb, dir) => { const zc = (za + zb)/2, r = (zb - za)/2, pts = [];
    for (let i = 0; i <= 10; i++){ const a = -Math.PI/2 + i/10*Math.PI; pts.push([TX_, y + dir*r*Math.cos(a)*.9, zc + r*Math.sin(a)]); } return pts; };
  inner.push(...fLine(ubend(EVAP.y0, 136, 141, -1), FCOP.m, .55, false), ...fLine(ubend(EVAP.y0, 146, 151, -1), FCOP.m, .55, false), ...fLine(ubend(EVAP.y1, 141, 146, 1), FCOP.m, .55, false));
  inner.push(...fLine([[TX_, EVAP.y1, 136], [TX_, 64.5, 136]], FCOP.m, .55, false), ...fLine([[TX_, EVAP.y1, 151], [TX_, ACCU.y - ACCU.r, 151]], FCOP.m, .55, false));
  put([[TX_ - ACCU.r, ACCU.y - ACCU.r, ACCU.z0], [TX_ + ACCU.r, ACCU.y + ACCU.r, ACCU.z1]], cyl(TX_, ACCU.y, ACCU.z0, ACCU.z1, ACCU.r, FCOP, toneI, .7, 14));
  // ===== the loop inside the walls: capillary up to the inlet, suction from the accumulator down and out
  inner.push(...fLine([[0, 64.3, 117], [3.4, 64.3, 117], [3.4, 64.3, 136], [TX_, 64.3, 136], [TX_, 64.5, 136]], FCOP.l, .3, false, hot));
  inner.push(...fLine([[TX_, ACCU.y, ACCU.z1], [TX_, ACCU.y, 157], [2.2, ACCU.y, 157], [2.2, ACCU.y, 28.5], [2.2, 26, 28.5], [0, 26, 28.5]], FCOP.m, .7, false, cold));
  // ===== evaporator fan: bracket on the liner, motor, shaft, hub, four blades turning when it runs
  bx(T, FAN.y - 2.5, FAN.z - 3.6, 6, FAN.y + 2.5, FAN.z + 3.6, FGM, .6);
  put([[6, FAN.y - 2.6, FAN.z - 2.6], [9.6, FAN.y + 2.6, FAN.z + 2.6]], cylX(6, 9.6, FAN.y, FAN.z, 2.6, live(fanOn), toneI, .8, 18));
  put([[9.6, FAN.y - .4, FAN.z - .4], [10.8, FAN.y + .4, FAN.z + .4]], cylX(9.6, 10.8, FAN.y, FAN.z, .35, METAL, toneI, .4, 8));
  { const fa = fanOn ? t*9 : .4; let bl = '';
    for (let i = 0; i < 4; i++){ const a = fa + i*Math.PI/2, ca = Math.cos(a), sa = Math.sin(a), R = (u, v) => [FAN.y + u*ca - v*sa, FAN.z + u*sa + v*ca];
      bl += shape(on(PX(11.3), [R(1, -.5), R(FAN.r*.55, -1.5), R(FAN.r, -1), R(FAN.r, 1.1), R(FAN.r*.55, 1.4), R(1, .6)]), '#cfd6d8', .6); }
    const hub = cylX(10.8, 11.9, FAN.y, FAN.z, 1.2, FGM, toneI, .6, 12);
    put([[10.8, FAN.y - FAN.r, FAN.z - FAN.r], [11.9, FAN.y + FAN.r, FAN.z + FAN.r]], facing([1,0,0]) ? bl + hub : hub + bl); }
  // ===== defrost: heater with end caps and clips, defrost thermostat, drain trough, drain tube
  const hm = defrost ? { l:'#ffb07a', m:'#ff6a3a', d:'#c2380a' } : { l:'#eef4f4', m:'#cfdcdc', d:'#98a9aa' };
  put([[HX - .8, 24, HEAT_Z - .8], [HX + .8, 62, HEAT_Z + .8]], rod([HX, 24, HEAT_Z], [HX, 62, HEAT_Z], .75, hm, toneI, .6));
  for (const [y0, y1] of [[22.8, 24], [62, 63.2]]) put([[HX - 1.1, y0, HEAT_Z - 1.1], [HX + 1.1, y1, HEAT_Z + 1.1]], rod([HX, y0, HEAT_Z], [HX, y1, HEAT_Z], 1.1, DARK, toneI, .6));
  for (const y of [35, 50]) bx(EVAP.x1, y - .6, HEAT_Z + .4, HX, y + .6, HEAT_Z + 1.2, METAL, .4);   // clips: heater to the coil's front face
  bx(EVAP.x1, 25, 149.5, EVAP.x1 + 1.4, 28, 152.5, defrost ? matOf('#ff9a3a') : FPLAST, .5);           // defrost thermostat
  { let tr = box(6, 22, 128.2, 15.5, 64, 129.6, FGM, toneI, .7);
    if (facing([0,0,1])) tr += shape(on(PZ(129.65), rrUV(6.6, 22.6, 14.9, 63.4, .4)), '#4a5257', .4) + fill(pd(on(PZ(129.7), ellUV(7, 34, .7, .7, 10))), '#1d1a16');
    put([[6, 22, 128.2], [15.5, 64, 129.6]], tr); }
  inner.push(...fLine([[7, 34, 128.2], [7, 34, 125], [2.5, 34, 125], [2.5, 34, 24], [0, 34, 24]], '#dfe9ea', .55, false));
  if (defrost){ const u = (t*1.3) % 1, dz = 125 + (1 - u)*3; put([[6.5, 33.5, 124], [7.5, 34.5, 128]], `<circle cx="${f(P(7, 34, dz)[0])}" cy="${f(P(7, 34, dz)[1])}" r=".7" fill="#8fc6dc"/>`); }
  // ===== air: duct through the divider, damper with louvres in the fridge ceiling
  put([[DUCT[0], DUCT[1], DUCT[2]], [DUCT[3], DUCT[4], DUCT[5]]], `<g opacity=".55">${box(...DUCT, matOf('#dfe3e2'), toneI, .6)}</g>`
    + (facing([0,0,1]) ? [0, 1, 2, 3].map(i => line([[DUCT[0] + .8, DUCT[1] + 1.5 + i*1.7, DUCT[5] + .05], [DUCT[3] - .8, DUCT[1] + 1.5 + i*1.7, DUCT[5] + .05]], .4)).join('') : ''));
  { let dp = box(...DAMP, FPLAST, toneI, .7);
    if (facing([1,0,0])) for (let i = 0; i < 4; i++){ const z = DAMP[2] + .8 + i*1.0; dp += line([[DAMP[3] + .05, DAMP[1] + 1, z], [DAMP[3] + .05, DAMP[4] - 1, z + (fanOn ? .5 : 0)]], .45); }
    put([[DAMP[0], DAMP[1], DAMP[2]], [DAMP[3], DAMP[4], DAMP[5]]], dp); }
  // ===== control housing in the ceiling: thermostat knob, defrost timer beside it, sensing tube down the back liner
  { let ch = box(...CTRL, FPLAST, toneI, .9);
    if (facing([1,0,0])) ch += shape(on(PX(CTRL[3] + .05), rrUV(CTRL[1] + 2, CTRL[2] + 1.2, CTRL[1] + 12, CTRL[5] - 1, .6)), '#d8d2c2', .4);
    put([[CTRL[0], CTRL[1], CTRL[2]], [CTRL[3], CTRL[4], CTRL[5]]], ch); }
  put([[CTRL[3], 41, 114], [CTRL[3] + 2, 47, 118]], cylX(CTRL[3], CTRL[3] + 1.8, 44, 116, 2, matOf('#f2efe6'), toneI, .7, 16)
    + (facing([1,0,0]) ? line([[CTRL[3] + 1.85, 44 - 1.4*Math.cos(.7), 116 - 1.4*Math.sin(.7)], [CTRL[3] + 1.85, 44 + 1.4*Math.cos(.7), 116 + 1.4*Math.sin(.7)]], .7) : ''));
  bx(...TIMER, run ? FPLAST : FPLAST, .6);
  inner.push(...fLine([[TIMER[3], 38, 117], [CTRL[0], 38, 117]], H_, .35, false));
  inner.push(...fLine([[CTRL[0], 46, 115], [6, 46, 115], [6, 46, 94]], '#a7b0b3', .3, false));
  put([[5, 45.2, 89.5], [6.8, 46.8, 94]], cyl(6, 46, 89.5, 94, .8, METAL, toneI, .4, 10));                    // sensing bulb, clipped to the back liner
  bx(T, 44.8, 92.5, 6.2, 47.2, 93.3, FGM, .3);
  // ===== lamp on the side wall, door switch in the divider with its plunger
  bx(37, T, 107, 43, 7, 112, FPLAST, .6);
  put([[38, 6.8, 107.4], [42, 11, 111.6]], ball(40, 8.8, 109.5, 1.9, lit ? { l:'#fffbe2', m:'#ffe680', d:'#e0c040' } : { l:'#f4f2ea', m:'#dcd8cc', d:'#b0aa9a' }, .6));
  bx(...SWB, FPLAST, .6);
  { const ext = st.door > .02 ? 1.6 : .25; put([[CW, 51.8, 121.7], [CW + ext, 53.2, 123.1]], cylX(CW, CW + ext, 52.5, 122.4, .7, st.door > .02 ? matOf('#ff9a3a') : FGM, toneI, .5, 10)); }
  // ===== wires: relay up the back wall to the housing; housing to fan, heater, defrost thermostat, lamp, door switch
  inner.push(...fLine([[0, 43, 16], [2.5, 43, 16], [2.5, 43, 121.5], [36, 43, 121.5], [36, 43, CTRL[5]]], run ? ON : H_, .5, false));
  inner.push(...fLine([[CTRL[0], 30, 118.2], [2.5, 30, 118.2], [2.5, 30, 160], [2.5, 17, 160], [8, 17, 160], [8, FAN.y, FAN.z + 2.6]], fanOn ? ON : H_, .4));
  inner.push(...fLine([[CTRL[0], 28, 117.2], [3.4, 28, 117.2], [3.4, 28, HEAT_Z], [3.4, 21, HEAT_Z], [HX, 21, HEAT_Z], [HX, 22.8, HEAT_Z]], defrost ? ON : H_, .4));
  inner.push(...fLine([[CTRL[0], 26.5, 116.2], [1.8, 26.5, 116.2], [1.8, 26.5, 157.5], [EVAP.x1 + .7, 26.5, 157.5], [EVAP.x1 + .7, 26.5, 152.5]], defrost ? ON : H_, .35));
  inner.push(...fLine([[40, CTRL[1], 117.5], [40, 9, 117.5], [40, 6, 117.5], [40, 6, 112]], lit ? ON : H_, .35));
  inner.push(...fLine([[44, 48, CTRL[5]], [44, 48, 122], [55, 48, 122], [55, 52.5, 122], [SWB[0], 52.5, 122]], st.door > .02 ? ON : H_, .35));
  // ===== door gaskets (they ride on their doors)
  inner.push(gasketXR(doorFrame(st.door*DOOR_MAX), rrUV(1.4,8.4,D-1.4,121.6,2), rrUV(3.6,10.6,D-3.6,119.4,2), rrUV(2.5,9.5,D-2.5,120.5,2)));
  inner.push(gasketXR(doorFrame(st.fz*FZ_MAX), rrT(1.4,126,D-1.4,H-1.4,18.6,2), rrT(3.6,128.2,D-3.6,H-3.6,16.4,2), rrT(2.5,127.1,D-2.5,H-2.5,17.5,2)));
  // the back assembly (compressor, condenser, cord) sits behind x = 0: before the inside from the front, after it from behind
  const out = backParts() + byDepth(outer), ins = byDepth(inner);
  MECH_LABELS = k <= .6 ? '' : xrCallouts([
    { at: [-6.2, 24, 12], text: 'COMPRESSOR', on: run },
    { at: [-2.6, 40, 100], text: 'CONDENSER', on: run },
    { at: [3.4, 64.3, 126], text: 'CAPILLARY TUBE', on: run },
    { at: [EVAP.x1, 44, EVAP.z1], text: 'EVAPORATOR', on: run },
    { at: [11.3, FAN.y, FAN.z + FAN.r], text: 'EVAPORATOR FAN', on: fanOn },
    { at: [HX, 44, HEAT_Z], text: 'DEFROST HEATER', on: defrost },
    { at: [-6, PAN[4], PAN[5]], text: 'DRIP PAN', on: defrost },
    { at: [36, 30, CTRL[5]], text: 'THERMOSTAT', on: run },
    { at: [CW + 1, 52.5, 122.4], text: 'DOOR SWITCH', on: st.door > .02 },
    { at: doorFrame(st.door*DOOR_MAX).R(-.5, D - 2.5, 70), text: 'DOOR GASKET', on: false },
    { at: [CW - .3, D - 2, 40], text: 'INSULATION', on: false } ], [-14, W, 0, D, 0, H]);
  return (back ? '' : out) + bg + ins + (back ? out : '');
}
function fridgeSurface(st, front, back){
  const L = [];
  if (front) L.push({ at:[CW + DT, 20, 70], text:'FRIDGE DOOR', on: st.door > 0 }, { at:[CW + DT, 20, 150], text:'FREEZER DOOR', on: st.fz > 0 }, { at:[CW + .1, D/2, 6], text:'KICK GRILLE', on: false });
  if (back) L.push({ at:[-2.6, 37, 90], text:'CONDENSER COIL', on: false }, { at:[-6.2, 24, 12], text:'COMPRESSOR', on: false });
  return L;
}
const fridgeCaption = st => { const ph = fridgePhase(st);
  if (st.door > 0) return 'Door open: the door switch’s plunger springs out, so the lamp comes on and the evaporator fan stops. The magnet strip in the gasket pulls the door shut again.';
  if (ph === 'open') return 'Freezer open: cold air spills out and warm air gets in, so the thermostat keeps the compressor running to pull the heat back out.';
  if (ph === 'defrost') return 'Defrost: the timer stops the compressor and the heater melts the evaporator’s frost. It drains down the back wall into the drip pan, where the compressor’s warmth dries it.';
  if (ph === 'idle') return 'Resting: the bulb on the back liner tells the thermostat the fridge is cold enough, so the compressor and fan wait while the foam in the walls keeps the heat out.';
  return 'Cooling: the compressor pumps hot gas through the condenser, where it sheds heat and turns liquid. The capillary tube feeds it to the evaporator, where it boils; the fan blows that cold air into both compartments.';
};

// what stands off the back (bumpers, condenser grid, compressor, cord): seen past the cabinet's edge from the sides too
function backParts(){
  let s = '';
  // spacer bumpers at the top corners keep the coil off the wall
  for (const y of [12,63]) s += tube([0,y,157],[-3.2,y,157],1.7,matOf('#7d817c'),.9);
  // the condenser grid (standing off ~2.5)
  const cx = -2.6, y0 = 12, y1 = 63, zb = 32, zt = 140;
  // mounting straps with screws, each end screwed to a little standoff block on the back panel
  for (const z of [zb, zt]) for (const y of [y0-1.5, y1+1.5]) s += box(cx+.3,y-1.1,z-1.3,0,y+1.1,z+1.3,DARK,toneI,.7);
  for (const z of [zb, zt]) s += shape(on(PX(cx+.3),rrUV(y0-3,z-1.4,y1+3,z+1.4,.6)), DARK.l, .8)
    + [y0-1.5, y1+1.5].map(y => fill(pd(on(PX(cx-.1),ellUV(y,z,.7,.7,10))), METAL.m) + ink(pd(on(PX(cx-.1),ellUV(y,z,.7,.7,10))),.5)).join('');
  // serpentine tube: straight runs joined by U-bends at alternating ends
  const runs = []; for (let z = zb+4; z <= zt-4; z += 6) runs.push(z);
  let path = [];
  runs.forEach((z,i) => {
    const l2r = i%2===0, ya = l2r ? y0+2 : y1-2, yb = l2r ? y1-2 : y0+2;
    path.push([cx,ya,z],[cx,yb,z]);
    if (i < runs.length-1) arcUV(yb, z+3, 3, l2r ? -90 : 270, l2r ? 90 : 90, 8).forEach(([u,v]) => path.push([cx,u,v]));
  });
  s += `<path d="${pd(path,false)}" fill="none" stroke="${COIL}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>`;
  // thin vertical wires welded across the outside of the tube
  for (let y = y0+3.5; y <= y1-3; y += 3.6) s += `<path d="${pd([[cx-.6,y,zb+1.5],[cx-.6,y,zt-1.5]],false)}" fill="none" stroke="${COIL}" stroke-width=".6"/>`;
  // compressor bump at the bottom: a black dome on a bracket, copper pipes up into the coil, a relay box
  s += box(-12,14,4,0,36,5.4,DARK,toneI,.9);
  const comp = [-6.2,24,5.4];
  const relay = box(-4.5,38,5,-.2,45,12,DARK,toneI,.9) + shape(on(PX(-4.6),rectUV(39.5,8,43.5,10.5)), '#e2483d', .5);
  const pipes = tube([-6.2,22,14],[cx,y0+2,zb+4],.55,matOf('#c97c48'),.7) + tube([-5,27,13.5],[cx,26,zb-1],.55,matOf('#c97c48'),.7);
  const dome = lathe(...comp,[[5.6,0],[6,.6,DARK],[6,6,DARK],[5,8.6,DARK],[3,10,DARK],[.4,10.4,DARK]],1.1)
    + `<ellipse cx="${f(P(-6.2+GO(2.2)[0],24+GO(2.2)[1],11)[0])}" cy="${f(P(-6.2,24,11)[1])}" rx="1.1" ry="2.4" fill="#ffffff" opacity=".22"/>`;
  s += byDepth([{ at:comp, svg:dome }, { at:[-2.4,41.5,5], svg:relay }]) + pipes;
  // power cord: out of a grommet low on the back, down to the floor, ending in a plug
  const cord = [[-.2,58,24],[-1.8,58.2,22.6],[-3,58.6,19],[-3.8,59.2,12],[-4.6,60,5],[-5.6,60.6,1.4],[-7.4,61,.7],[-10,60,.7],[-12.2,57,.7],[-13.4,53.4,.7]];
  const cordSvg = `<path d="${pd(cord,false)}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`
    + `<path d="${pd(cord,false)}" fill="none" stroke="#4a4540" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>`;
  const plug = box(-15.6,47.6,0,-11.4,53.4,3.4,DARK,toneI,.9);
  const prongs = [-14.3,-12.7].map(x => tube([x,47.6,1.7],[x,45,1.7],.35,METAL,.6)).join('');
  s += byDepth([{ at:[-6,59,6], svg:cordSvg }, { at:[-13.5,50.5,1.7], svg:plug }, { at:[-13.5,45.2,1.7], svg:prongs }]);
  return s;
}
// the right-hand side (−y): matching gloss stripes, a chrome trim at the door split and a chrome badge
function rightSide(m, lm){
  const n = [0,-1,0], Q = PY(-.15);
  let s = fill(pd(on(Q,[[CW-15,10],[CW-10,10],[CW-10,150],[CW-15,150]])), tone(n,lm), 'opacity=".55"');
  s += fill(pd(on(Q,[[CW-22,10],[CW-20,10],[CW-20,150],[CW-22,150]])), tone(n,lm), 'opacity=".45"');
  const R2 = PY(-.3);
  s += shape(on(R2,rrUV(6,123.1,CW-3,124.9,.9)), METAL.l, .8) + glint([CW-8,-.45,124.3],[12,-.45,124.3],.8,.6);
  s += shape(on(R2,rrUV(19,129,43,137,4)), METAL.l, 1.1) + ink(pd(on(PY(-.35),rrUV(20.2,130.2,41.8,135.8,2.8))),.5);
  s += txR(31,-.4,131.9,'FRIGO',3.6,INK,800,'.12em');
  return s;
}

/* ---------- scene ---------- */
function scene(st, m){
  const dDeg = st.door*DOOR_MAX, zDeg = st.fz*FZ_MAX;
  const fD = doorFrame(dDeg), fZ = doorFrame(zDeg);
  const front = facing([1,0,0]), back = facing([-1,0,0]);
  let s = '';
  // 1. shadows: cabinet + each door slab
  s += castShadow([...on(PX(0),OUT), ...on(PX(CW),OUT)]);
  s += castShadow([...on(PD(fD,0),FDOOR), ...on(PD(fD,DT),FDOOR)]);
  s += castShadow([...on(PD(fZ,0),ZDOOR), ...on(PD(fZ,DT),ZDOOR)]);
  // 2. the cabinet: chrome feet, shell, side / back details, and (from the front) the openings
  let cab = '';
  const feet = [[6,6],[6,D-6],[CW-5,6],[CW-5,D-6]];
  for (const [x,y] of byDk(feet, p=>p)) cab += cyl(x,y,0,4.2,2.2,METAL,toneI,1);
  cab += extrude(OUT, 0, CW, m);
  const lm = { l:mix(m.l,'#ffffff',.18), m:mix(m.m,'#ffffff',.14), d:mix(m.d,'#ffffff',.08) };
  if (facing([0,1,0])){
    cab += fill(pd(on(PY(D+.15),[[CW-15,10],[CW-10,10],[CW-10,150],[CW-15,150]])), tone([0,1,0],lm), 'opacity=".55"');
    cab += fill(pd(on(PY(D+.15),[[CW-22,10],[CW-20,10],[CW-20,150],[CW-22,150]])), tone([0,1,0],lm), 'opacity=".45"');
  }
  if (facing([0,-1,0])) cab += rightSide(m, lm);
  if (back) cab += backPanel(m) + backParts();
  if (front){
    // 3. what is seen through the openings
    if (st.door > 0) cab += fridgeInside(st);
    if (st.fz > 0) cab += freezerInside();
    // 4. cabinet front face with the two openings
    const X = PX(CW);
    cab += `<path d="${pd(on(X,OUT))}${pd(on(X,F_OPEN))}${pd(on(X,Z_OPEN))}" fill="${tone([1,0,0],m)}" fill-rule="evenodd"/>`;
    cab += ink(pd(on(X,F_OPEN)),1.7) + ink(pd(on(X,Z_OPEN)),1.7) + ink(pd(on(X,OUT)),2.2);
    // kick grille in the recess under the door
    cab += shape(on(PX(CW+.1),rrUV(8,5,D-8,6.8,.8)), DARK.m, .8);
  }
  // 5. silhouette of the shell (doors draw their own outline)
  cab += hullInk([...on(PX(0),OUT), ...on(PX(CW),OUT)], 2.8);
  const k = ease(st.xr || 0);
  if (k > 0) cab = xrGhost(cab, '', k, OUT, 0, CW, m);
  const dg = svg => k > 0 ? `<g opacity="${f(1 - .8*k)}">${svg}</g>` : svg;   // see-through: the doors cover the mechanism, so they ghost too
  // 6. doors: fridge, then the middle hinge, then freezer (higher things can cover lower ones, never the reverse).
  // A door up to 90° lies in front of the plane x = CW, past 90° beside the plane y = 0: it draws after the
  // cabinet when that side of the plane faces the viewer, otherwise before it (the cabinet then hides it).
  const ahead = deg => front || (deg > 90 && facing([0,-1,0]));
  // Hinge brackets: one under the fridge door, one between the doors (the freezer's top pivot is hidden in its rounded
  // top). Each is a leaf on the cabinet front (y 0..2.5) plus a knuckle standing out past the side (y −1.6..0). From
  // behind, the leaf is hidden by the cabinet, but the knuckle still shows from the hinge side.
  const hinge = (z0,z1) => front ? box(CW,-1.6,z0,CW+DT,2.5,z1,METAL,toneI,.9) : box(CW,-1.6,z0,CW+DT,0,z1,METAL,toneI,.9);
  const hingeAhead = front || facing([0,-1,0]);
  const parts = [
    { ahead: hingeAhead,  svg: hinge(4.6,6.9) },
    { ahead: ahead(dDeg), svg: drawDoor('door', dDeg, m, st) },
    { ahead: hingeAhead,  svg: hinge(122.6,124.9) },
    { ahead: ahead(zDeg), svg: drawDoor('fz', zDeg, m, st) } ];
  const mist = st.puff != null ? puff(st.puff) : '';
  // seen from the front or a side, the parts standing off the back sit behind the cabinet: draw them first (only their
  // ends past the cabinet's edge stay in view)
  if (!back) s += backParts();
  s += dg(parts.filter(p => !p.ahead).map(p => p.svg).join('')) + (front ? '' : mist) + cab + dg(parts.filter(p => p.ahead).map(p => p.svg).join(''));
  if (st.door===0 && st.fz===0) s += dg(hullInk([...on(PX(0),OUT), ...on(PX(W),OUT)], 2.8));
  // see-through: the working parts over the ghosted case and doors; the handles (outside, facing the viewer) over them
  if (k > 0){ s += `<g opacity="${f(k)}">${fridgeMech(st, k)}</g>`;
    for (const [fr, za, zb] of [[fD, 98, 117], [fZ, 128, 143]]) if (vis(fr.nT)) s += `<g opacity="${f(k)}">${handleBar(fr, D-6, za, zb)}</g>`; }
  s += k > .6 ? MECH_LABELS : xrCallouts(fridgeSurface(st, front, back), [-14, W, 0, D, 0, H]);
  // 7. cold air + beeping (the BEEP floats beside whichever long side faces the viewer)
  if (front) s += mist;
  if (st.beep){
    const on1 = Math.sin(st.flick*9) > -.3;
    if (on1){
      // The call-out floats beside the cabinet, laid out exactly as in the default view (where it hangs in the plane
      // y = D+30), measured from the cabinet's outline; it moves to the other side, mirrored, when the doors would be under
      // it. Kept in screen space so it never lands on a face, whatever the angle.
      const cab3 = [...on(PX(0),OUT), ...on(PX(CW),OUT)], pts = cab3.map(p => P(...p)), q0 = cab3.map(p => P0(...p)), a0 = P0(14, D+30, 146);
      const dx = a0[0] - Math.min(...q0.map(p => p[0])), dy = a0[1] - Math.min(...q0.map(p => p[1]));
      const left = Math.sin(YAW*Math.PI/180) >= 0, k = left ? 1 : -1;   // the doors (front, +x) are on screen-right when sin(yaw) > 0
      const ax = left ? Math.min(...pts.map(p => p[0])) + dx : Math.max(...pts.map(p => p[0])) - dx, ay = Math.min(...pts.map(p => p[1])) + dy;
      s += `<text transform="matrix(${C.toFixed(4)} ${(k*S).toFixed(4)} 0 1 ${f(ax)} ${f(ay)})" font-size="8" fill="#e2483d" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" letter-spacing=".04em">BEEP!</text>`;
      for (const r of [4,8]) s += ink('M' + arcUV(30,152,r,-50,50,6).map(([u,v]) => f(ax + k*(u-14)*C) + ' ' + f(ay + (u-14)*S - (v-146))).join('L'), 1.4);
    }
  }
  return s;
}

/* ---------- behaviour ---------- */
let UI = null, beepTimer = 0;
function loop(st){
  if (st._run) return; st._run = true;
  UI.animate(dt => {
    let more = false;
    for (const k of ['door','fz']){
      const a = st.anim[k]; if (!a) continue;
      a.t = Math.min(1, a.t + dt/a.dur); st[k] = a.from + (a.to-a.from)*ease(a.t);
      if (a.t >= 1){ st[k] = a.to; st.anim[k] = null; } else more = true;
    }
    if (st.puff != null){ st.puff += dt/1.7; if (st.puff >= 1) st.puff = null; else more = true; }
    if (st.beep){ st.flick += dt; st.openFor += dt; more = true; }
    if (!more) st._run = false;
    return more;
  });
}
function armBeep(st){
  clearTimeout(beepTimer);
  beepTimer = setTimeout(() => { if (st.doorTo > 0){ st.beep = true; st.openFor = 6; loop(st); } }, 6000);
}
function swing(st, k, to){
  if (k==='door'){ st.doorTo = to; if (to > 0) armBeep(st); else { clearTimeout(beepTimer); st.beep = false; } }
  else { st.fzTo = to; if (to > 0 && st.fz < .2) st.puff = 0; }
  const from = st[k], dist = Math.abs(to-from); if (!dist) return;
  st.anim[k] = { from, to, t:0, dur: (k==='door' ? 1.0 : .75) * Math.max(.35, dist) };
  loop(st);
}
const toggle = (st,k) => swing(st, k, (k==='door' ? st.doorTo : st.fzTo) > 0 ? 0 : 1);

UI = mountFigure({
  fig:'10', turn:'full', title:'Fridge', hint:'open the doors · take a snack · don’t leave it open',
  idea:"A fridge doesn't make cold \u2014 it carries heat out of the box and lets it go from the coil on the back. Turn it around to see.",
  size:[W,D,H], palette:'mustard', views:true,
  state:{ door:0, fz:0, doorTo:0, fzTo:0, anim:{}, taken:[], beep:false, flick:0, openFor:0, puff:null },
  scene,
  readout: st => {
    const left = ITEMS.filter(o=>!st.taken.includes(o.k)).length;
    if (st.beep) return 'BEEP BEEP — close the door! The light is flickering';
    if (st.anim.door) return st.doorTo > 0 ? 'Opening the fridge… click lights on' : 'Closing the fridge…';
    if (st.door > 0 && st.fz > 0) return `Both doors open · ${left} things on the shelves — click one to take it`;
    if (st.door > 0) return (st.door < 1 ? 'Door ajar · ' : 'Light on · ') + (left ? `${left} things on the shelves — click one to take it out` : 'shelves are empty — hit Restock');
    if (st.fz > 0) return 'Freezer open — brrr. Ice tray, peas, a tub of ice cream';
    return 'Click the big door to open the fridge — or the top door for the freezer';
  },
  buttonsLabel:'Fridge',
  buttons:[
    { label:'Open the fridge', onClick: (st,ui) => st.doorTo ? ui.flash('The fridge is open') : toggle(st,'door') },
    { label:'Take a snack', choices: st => [...ITEMS.map(i => i.k), ...BINS.flatMap(b => (b.goods || []).map(g => g[0]))].map(k => ({
        label: NAMES[k].replace(/^the /,''), disabled: !st.doorTo || st.taken.includes(k),
        onClick: (st,ui) => { st.taken.push(k); st.snacked = true; ui.flash('Took ' + NAMES[k]); } })) },
    { label:'Close the fridge', onClick: (st,ui) => st.doorTo ? toggle(st,'door') : ui.flash('Already closed') },
    { label:'Open the freezer', onClick: (st,ui) => { if (st.fzTo) return ui.flash('The freezer is open'); st.froze = true; toggle(st,'fz'); } },
    { label:'Close the freezer', onClick: (st,ui) => st.fzTo ? toggle(st,'fz') : ui.flash('Already closed') },
    { label:'Restock', onClick: (st,ui) => { const n = st.taken.length; st.taken = []; st.snacked = st.froze = false; ui.flash(n ? `Restocked ${n} item${n>1?'s':''}` : 'Already full'); } },
  ],
  next: st => st.fzTo ? 4 : st.doorTo ? (st.snacked ? 2 : 1) : !st.snacked ? 0 : !st.froze ? 3 : st.taken.length ? 5 : 0,
  acts:{
    door: st => toggle(st,'door'),
    fz:   st => { st.froze = true; toggle(st,'fz'); },
    take: (st, el, ui) => { const k = el.dataset.k; if (st.taken.includes(k)) return; st.taken.push(k); st.snacked = true; ui.flash('Took ' + NAMES[k]); },
  },
  params(st, q){
    const amt = v => v==null ? null : v==='open' ? 1 : v==='closed' ? 0 : Math.max(0, Math.min(1, +v || 0));
    const d = amt(q.get('door')), z = amt(q.get('freezer'));
    if (d != null) st.door = st.doorTo = d;
    if (z != null) st.fz = st.fzTo = z;
    if (q.get('taken')) st.taken = q.get('taken').split(',').filter(k => NAMES[k]);
    if (q.get('beep') === '1' && st.door > 0){ st.beep = true; st.openFor = 6; }
    if (q.has('puff')) st.puff = Math.max(0, Math.min(.99, +q.get('puff')));
  },
});
if (UI.st.doorTo > 0) armBeep(UI.st);
if (UI.st.beep) loop(UI.st);
xrMount(() => UI, fridgeCaption);