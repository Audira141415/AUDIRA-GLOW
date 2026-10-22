/* ---------- geometry (x = depth, y = width, z = up) ---------- */
const BASE = [3, 3, 37, 37, 10], BH = 3.4, BT = 5;        // base plan x0,y0,x1,y1,corner r; side height; top height
const PIV = [20, 20, 33];                                  // tilt/swing joint at the top of the stem
const QA = 10, R = 19;                                     // motor axis height above the joint, cage radius
const BLADE_S = 6.2, RIM0 = 3.2, RIM1 = 4.4, DOME = 7;     // blade plane, cage rim band, dome bulge
const PSI0 = 18 * Math.PI/180, SWING = 32 * Math.PI/180;   // head faces 18° round from the front; swings ±32°
const TILTS = { Up: 16, Level: 0, Down: -12 };
const SPEEDS = [0, 9, 16, 26];                             // blade spin (rad/s, drawn) for off, 1, 2, 3
const MOTOR = { l:'#f7f6f1', m:'#dcdad0', d:'#a8a597' };
const WIRE = '#4f5558', BLADE_C = '#fbfaf3';
const RIBBONS = [['#e2483d', -64], ['#f2c230', -90], ['#fbf7ea', -116]];   // colour, angle on the grille (deg)

/* ---------- the head's own frame: a = forward along the motor axis, u = sideways (+y when facing +x), v = up ---------- */
let FR;
function setFrame(st){
  const ps = PSI0 + SWING * Math.sin(st.th), ph = st.phi * Math.PI/180;
  FR = { a:[Math.cos(ph)*Math.cos(ps), Math.cos(ph)*Math.sin(ps), Math.sin(ph)], u:[-Math.sin(ps), Math.cos(ps), 0],
         v:[-Math.sin(ph)*Math.cos(ps), -Math.sin(ph)*Math.sin(ps), Math.cos(ph)], a0:[Math.cos(ps), Math.sin(ps), 0] };
}
const hv = (s,p,q) => [0,1,2].map(i => s*FR.a[i] + p*FR.u[i] + q*FR.v[i]);
const Hp = (s,p,q) => { const d = hv(s,p,q); return [PIV[0]+d[0], PIV[1]+d[1], PIV[2]+d[2]]; };
const hring = (s, r, n=36, qc=QA) => Array.from({length:n}, (_,i) => { const t = i/n*2*Math.PI; return Hp(s, r*Math.cos(t), qc + r*Math.sin(t)); });
const neg = x => x.map(t => -t);
// body of revolution about the motor axis: profile [[s, r], ...]
function revolve(prof, m, shade=tone, n=36, qc=QA){
  let s = '';
  for (let i = 0; i < prof.length-1; i++) s += loft(hring(prof[i][0], prof[i][1], n, qc), hring(prof[i+1][0], prof[i+1][1], n, qc), nr => shade(nr, m));
  return s;
}
// the part of a ring on the housing that faces the viewer, as an open polyline (seams that wrap round the back)
function visArc(s, r, qc=QA, n=72){
  const out = []; let cur = [];
  for (let i = 0; i <= n; i++){ const t = i/n*2*Math.PI, nr = hv(0, Math.cos(t), Math.sin(t));
    if (vis(nr)) cur.push(Hp(s, r*Math.cos(t), qc + r*Math.sin(t))); else if (cur.length){ out.push(cur); cur = []; } }
  if (cur.length) out.push(cur);
  return out.filter(c => c.length > 1).map(c => pd(c, false)).join('');
}
// box in the head frame
function hbox(s0,s1,p0,p1,q0,q1,m,w=1){
  const c = Hp, { a, u, v } = FR;
  const F = [
    [a,      [c(s1,p0,q0),c(s1,p1,q0),c(s1,p1,q1),c(s1,p0,q1)]], [neg(a), [c(s0,p0,q0),c(s0,p1,q0),c(s0,p1,q1),c(s0,p0,q1)]],
    [u,      [c(s0,p1,q0),c(s1,p1,q0),c(s1,p1,q1),c(s0,p1,q1)]], [neg(u), [c(s0,p0,q0),c(s1,p0,q0),c(s1,p0,q1),c(s0,p0,q1)]],
    [v,      [c(s0,p0,q1),c(s1,p0,q1),c(s1,p1,q1),c(s0,p1,q1)]], [neg(v), [c(s0,p0,q0),c(s1,p0,q0),c(s1,p1,q0),c(s0,p1,q0)]] ];
  return F.filter(([n]) => vis(n)).map(([n,q]) => shape(q, tone(n,m), w)).join('');
}
// cylinder on any axis: centre c, axis ax, e1/e2 span the cross-section, from h0 to h1 along ax
function gCyl(c, ax, e1, e2, r, h0, h1, m, shade=toneI, w=1, n=24){
  const ring = h => Array.from({length:n}, (_,i) => { const t = i/n*2*Math.PI; return [0,1,2].map(k => c[k] + h*ax[k] + r*(Math.cos(t)*e1[k] + Math.sin(t)*e2[k])); });
  const A = ring(h0), B = ring(h1), capB = vis(ax), cap = capB ? B : A, cn = capB ? ax : neg(ax);
  return loft(A, B, nr => shade(nr, m)) + fill(pd(cap), shade(cn, m)) + hullInk([...A, ...B], w) + ink(pd(cap), w*.8);
}
// text lying on the base top (reads left to right, letters' feet toward the viewer)
const txZ = (x,y,z,str,size,col=INK,weight=800) => `<text transform="${txM(P(x,y,z), Dv(0,-1,0), Dv(1,0,0))}" font-size="${size}" fill="${col}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="${weight}">${str}</text>`;

/* ---------- base with the speed keys ---------- */
const baseRing = (z, ins) => on(PZ(z), rrUV(BASE[0]+ins, BASE[1]+ins, BASE[2]-ins, BASE[3]-ins, BASE[4]-ins));
const KEYS = [[0, 29], [1, 24.5], [2, 20], [3, 15.5]];    // speed, y (viewer-left to right)
function base(st, m){
  const b0 = baseRing(0, 0), b1 = baseRing(BH, 0), b2 = baseRing(BT, 1.6);
  let s = loft(b0, b1, n => tone(n, m)) + loft(b1, b2, n => tone(n, m));
  s += fill(pd(b2), tone([0,0,1], m)) + ink(pd(b2), 1.1);
  s += hullInk([...b0, ...b2], 2.6);
  s += tx(BASE[2] + .05, 20, .9, 'BREEZE', 2.2, mix(tone([1,0,0], m), '#000000', .5), 800);
  // key well and the numbers printed beside it (flat on the base top)
  s += shape(on(PZ(BT + .02), rrUV(22.6, 12.6, 31.4, 31.9, 1.2)), mix(tone([0,0,1], m), '#000000', .45), 1);
  for (const [sp, y] of KEYS) s += txZ(33.7, y, BT + .02, sp ? String(sp) : '0', 2.6, mix(tone([0,0,1], m), '#000000', .55));
  return s;
}
// the speed keys stand up from the base, so they are sorted against each other (and, in scene, against the pole)
function keys(st, m){
  return byDepth(KEYS.map(([sp, y]) => { const down = st.speed === sp, top = down ? BT + .6 : BT + 1.8;
    const km = down ? (sp ? matOf('#43c25c') : matOf('#e2483d')) : CERAMIC;
    return { at: [27, y, BT + 1], svg: act('key', box(23.4, y - 1.8, BT, 30.6, y + 1.8, top, km, toneI, 1), `data-k="${sp}"`) }; }));
}

/* ---------- head ---------- */
const HOUSING = [[-12.5, 3.6], [-12, 5.6], [-10.6, 7], [-8, 7.6], [-2, 7.6], [0, 7], [1.2, 5.6]];
function housing(st, m){
  let s = revolve(HOUSING, m);
  const [r0, r1] = [HOUSING[0], HOUSING[HOUSING.length - 1]];
  s += vis(FR.a) ? fill(pd(hring(r1[0], r1[1])), tone(FR.a, m)) : fill(pd(hring(r0[0], r0[1])), tone(neg(FR.a), m)) + ink(pd(hring(r0[0], r0[1])), .9);
  // seam + rear vents
  s += `<path d="${visArc(-3, 7.65)}" fill="none" stroke="${INK}" stroke-width=".9" stroke-linecap="round"/>`;
  let vents = ''; for (const sv of [-10.2, -9.2, -8.2]) vents += visArc(sv, 7.62 - (sv < -9.5 ? .3 : 0));
  s += `<path d="${vents}" fill="none" stroke="${mix(m.d, '#000000', .2)}" stroke-width="1" stroke-linecap="round" stroke-dasharray="1.6 1.4"/>`;
  s += hullInk(HOUSING.flatMap(([sv, r]) => hring(sv, r, 24)), 1.9);
  // push-pull swing knob on top
  const kz = st.osc ? 8.3 : 9.8;
  s += act('osc', gCyl(Hp(-7.5, 0, QA), FR.v, FR.a, FR.u, 1.5, 7.2, kz, DARK, toneI, 1, 18));
  return s;
}
function joint(st, m){
  const { a0, u } = FR, z = [0,0,1];
  const body = gCyl(PIV, u, a0, z, 2.6, -3.2, 3.2, METAL, toneI, 1.1, 20);
  const knob = gCyl(PIV, u, a0, z, 3.2, 3.2, 4.4, DARK, toneI, 1.1, 20);      // tilt knob on the +u end
  return vis(u) ? body + knob : knob + body;
}
function neck(m){ return hbox(-4.5, 1.5, -2.2, 2.2, 1.2, QA - 6.5, m, 1); }

const domeS = r => RIM1 + DOME * (1 - (r/R)**2);
const rearS = r => RIM0 - 2.6 * (1 - (r/R)**2);
function rearCage(){
  let d = '';
  for (let k = 0; k < 12; k++){ const t = k/12*2*Math.PI, pts = [];
    for (let r = 7.4; r <= R + .01; r += (R-7.4)/6) pts.push(Hp(rearS(r), r*Math.cos(t), QA + r*Math.sin(t)));
    d += pd(pts, false); }
  for (const r of [13]) d += pd(hring(rearS(r), r, 48));
  return `<path d="${d}" fill="none" stroke="${WIRE}" stroke-width=".5" stroke-linecap="round" opacity=".45"/>`;
}
const BLADE = [[3,-1.6],[6,-4.2],[10,-5.8],[14,-5.6],[16,-3.4],[16.4,0],[15,3],[11,4.4],[7,3.8],[3,1.6]];
function blade(ang, col, op=1, w=.9){
  const c = Math.cos(ang), sn = Math.sin(ang);
  const pts = BLADE.map(([r, t]) => { const p = r*c - t*sn, q = r*sn + t*c; return Hp(BLADE_S + t*.08, p, QA + q); });
  const s = fill(pd(pts), col) + (w ? ink(pd(pts), w) : '');
  return op < 1 ? `<g opacity="${f(op)}">${s}</g>` : s;
}
// motor shaft between the housing's front cap and the hub
const shaft = () => gCyl(Hp(0, 0, QA), FR.a, FR.u, FR.v, .9, 1.1, 3.6, METAL, toneI, .8, 14);
function rotor(st, m){
  const om = Math.abs(st.omega), fast = om > 11;
  let s = '';
  if (fast) s += fill(pd(hring(BLADE_S, 16.4, 48)), BLADE_C, `opacity="${f(Math.min(.45, (om-11)/30 + .15))}"`);
  for (let k = 0; k < 3; k++){
    const a = st.ang + k * 2*Math.PI/3;
    if (fast) for (let g = 3; g >= 1; g--) s += blade(a - g*.22, BLADE_C, .22, 0);
    s += blade(a, BLADE_C, fast ? .75 : 1, .9);
  }
  // hub (its back face shows from behind the fan)
  if (!vis(FR.a)) s += fill(pd(hring(3.5, 3.4, 24)), toneI(neg(FR.a), MOTOR)) + ink(pd(hring(3.5, 3.4, 24)), .8);
  s += revolve([[3.5, 3.4], [6.8, 3.4], [7.8, 2.7], [8.4, 1.4]], MOTOR, toneI, 24);
  s += fill(pd(hring(8.4, 1.4, 16)), MOTOR.l) + hullInk([...hring(3.5, 3.4, 16), ...hring(6.8, 3.4, 16), ...hring(8.4, 1.4, 16)], 1);
  return s;
}
// the rim band goes all round the blades: its far half (seen from inside) is behind them, its near half in front
const rimFar  = () => loft(hring(RIM0, R, 48), hring(RIM1, R, 48), n => toneI(n, METAL), true);
const rimNear = () => loft(hring(RIM0, R, 48), hring(RIM1, R, 48), n => toneI(n, METAL)) + hullInk([...hring(RIM0, R, 48), ...hring(RIM1, R, 48)], 1.8);
function frontCage(m){
  let s = '', d = '';
  for (let k = 0; k < 18; k++){ const t = k/18*2*Math.PI, pts = [];
    for (let r = 4.4; r <= R + .01; r += (R-4.4)/8) pts.push(Hp(domeS(r), r*Math.cos(t), QA + r*Math.sin(t)));
    d += pd(pts, false); }
  for (const r of [8.5, 13.5]) d += pd(hring(domeS(r), r, 56));
  s += `<path d="${d}" fill="none" stroke="${WIRE}" stroke-width=".55" stroke-linecap="round" opacity=".85"/>`;
  // centre badge
  const bd = hring(domeS(0) + .1, 4.4, 28);
  s += fill(pd(bd), m.l) + ink(pd(bd), 1.1) + fill(pd(hring(domeS(0) + .15, 2.2, 20)), m.d);
  return s;
}
// ribbons tied to the bottom of the grille: hang when still, stream out and flutter in the wind
function ribbon(st, col, deg, i){
  const t0 = deg * Math.PI/180, r0 = R * .9, k = Math.min(1, Math.abs(st.omega) / SPEEDS[3]);
  let p = Hp(domeS(r0) + .3, r0*Math.cos(t0), QA + r0*Math.sin(t0));
  const pts = [p], N = 8, seg = 1.15, mat = matOf(col);
  for (let j = 0; j < N; j++){
    const fl = Math.sin(st.t * (9 + 4*k) - j*.75 + i*2.1) * .55 * k * (j + 1) / N + .18 * (1-k) * Math.sin(j*.9 + i);
    const th = k * (1.62 + .14*Math.sin(st.t*3 + i)) * Math.min(1, .8 + j*.06) + fl;     // 0 = hanging, ~pi/2 = straight out
    const side = .25 * fl + (1-k) * .3 * Math.sin(j*1.1 + i*1.7);
    const dir = norm([0,1,2].map(c => Math.cos(th) * [0,0,-1][c] + Math.sin(th) * FR.a[c] + FR.u[c] * side));
    p = p.map((v, c) => v + dir[c] * seg); pts.push(p);
  }
  const hw = .75, U = FR.u, L = pts.map(q => q.map((v, c) => v - U[c]*hw)), Rr = pts.map(q => q.map((v, c) => v + U[c]*hw));
  let s = '';
  for (let j = 0; j < N; j++){
    let nr = norm(cross(sub(pts[j+1], pts[j]), U)); if (!vis(nr)) nr = neg(nr);
    s += face(pd([L[j], Rr[j], Rr[j+1], L[j+1]]), toneI(nr, mat));
  }
  return s + ink(pd([...L, ...Rr.slice().reverse()]), .8);
}

// air: a few wavy streaks pushed out along the axis, faster and stronger with the speed
const STREAKS = [[0, 9], [70, 13], [150, 6], [215, 14], [290, 11]];
function wind(st){
  const k = Math.min(1, Math.abs(st.omega) / SPEEDS[3]); if (k < .08) return '';
  let s = '';
  STREAKS.forEach(([deg, r], i) => {
    const t0 = deg * Math.PI/180, pts = [];
    for (let j = 0; j <= 14; j++){ const sv = domeS(r) + 3 + j * (1 + k*.9), w = Math.sin(j*.6 - st.t*7 + i) * .9;
      pts.push(Hp(sv, (r + w*.3)*Math.cos(t0) + w*Math.sin(t0)*.6, QA + (r + w*.3)*Math.sin(t0) - w*Math.cos(t0)*.6)); }
    s += `<path d="${pd(pts, false)}" fill="none" stroke="#4a96c4" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 4 1.2 4" stroke-dashoffset="${f(-st.t * 40 * k - i*5)}" opacity="${f(.35 + .6*k)}" pointer-events="none"/>`;
  });
  return s;
}

/* ---------- scene ---------- */
function scene(st, m){
  setFrame(st);
  let s = '';
  // cast shadow: the base only. The head is a thin vertical disc, so its shadow is a sliver that turns the whole
  // shadow into a wedge; a plain shadow under the base reads cleaner.
  s += castShadow([...baseRing(0, 0), ...baseRing(BT, 1.6)]);

  s += base(st, m);
  // the head is drawn from the far end to the near end: motor, shaft, rear wires, rim, blades, front dome when the fan
  // faces the viewer; the other way round when it faces away. The rim band (s 3.2-4.4) lies wholly behind the blade
  // plane (s ~6), so the whole rim is behind the blades from the front and in front of them from behind.
  const toward = vis(FR.a);
  const motorEnd = joint(st, m) + neck(m) + housing(st, m), ribbons = RIBBONS.map(([c, d], i) => ribbon(st, c, d, i)).join('');
  const rim = rimFar() + rimNear(), air = wind(st);
  const cage = toward ? shaft() + rearCage() + rim + rotor(st, m) + frontCage(m) + ribbons + air
                      : air + ribbons + frontCage(m) + rotor(st, m) + rim + rearCage() + shaft();
  // the pole stands under the joint: when the cage hangs on the far side of it (head turned away) the cage, ribbons
  // and wind go first and the pole over them; the joint always caps the pole. Keys and pole are separated along x.
  const pole = cyl(PIV[0], PIV[1], BT - .2, PIV[2], 1.8, METAL, toneI, 1.1, 18), kz = keys(st, m);
  const keysNear = CAM_V[0] >= 0, cageFar = !toward && dot(FR.a0, [CAM_V[0], CAM_V[1], 0]) < 0;
  if (cageFar) s += (keysNear ? cage + pole + kz : kz + cage + pole) + motorEnd;
  else         s += (keysNear ? pole + kz : kz + pole) + (toward ? motorEnd + cage : cage + motorEnd);
  return s;
}

/* ---------- behaviour ---------- */
let ui;
const st = { speed:0, omega:0, ang:.3, osc:false, th:0, phi:0, phiT:0, t:0, loop:false };
function kick(){
  if (st.loop) return; st.loop = true;
  ui.animate(dt => {
    const tgt = SPEEDS[st.speed], d = tgt - st.omega;
    st.omega += Math.max(-dt*6, Math.min(dt*10, d));
    st.ang += st.omega * dt; st.t += dt;
    if (st.osc && st.omega > 2) st.th += dt * .55 * Math.min(1, st.omega / 9);
    const dp = st.phiT - st.phi; st.phi += Math.sign(dp) * Math.min(Math.abs(dp), dt * 30);
    const busy = st.omega > .01 || tgt > 0 || Math.abs(st.phiT - st.phi) > 1e-3;
    if (!busy){ st.omega = 0; st.loop = false; }
    return busy;
  });
}
function setSpeed(sp, ui){
  if (sp === 0 && st.speed === 0) return ui.flash(st.omega > .5 ? 'already off — the blades are coasting to a stop' : 'the fan is already off');
  st.speed = sp; kick();
}
function toggleOsc(ui){
  st.osc = !st.osc;
  if (st.osc && st.speed === 0){ st.speed = 1; ui.flash('switched on at speed 1 — the swing is driven by the motor'); }
  else ui.flash(st.osc ? 'swinging side to side' : 'swing off — the head stays where it is', 1300);
  kick();
}
function setTilt(name, ui){
  if (st.phiT === TILTS[name]) return ui.flash('the head is already tilted ' + name.toLowerCase());
  st.phiT = TILTS[name]; kick();
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
    if (k > 0 && opts.under) s = xrUnder(s, opts.mech(st, k), k) + (opts.over ? opts.over(st, k) : '');   // the whole drawing is the object; inside parts over it
    else if (k > 0 && !opts.inline) s = `<g opacity="${f(1 - .5*k)}">${s}</g><g opacity="${f(k)}">${opts.mech(st, k)}</g>`;   // inline: the figure ghosts its own case
    const items = k > .6 ? opts.inside(st) : opts.surface ? opts.surface(st) : [];
    return s + (items.length ? xrCallouts(items, opts.B) : '');
  };
}

/* ---------- see-through: how a real oscillating desk fan is built ----------
   Truth: mains comes in through a grommet and cord grip in the base. The piano keys push plungers into a latching switch
   block: each key connects the live to one tap of the motor winding (more turns in circuit = slower). A run capacitor
   in a strap feeds the motor's second winding so it starts and turns one way (a PSC motor). The harness runs up inside
   the pole, out round the back of the tilt joint and through the neck to a terminal block under the stator. The stator
   (laminations with copper windings at both ends) turns the rotor (aluminium bars in a steel core) on a shaft held in
   two sleeve bearings in the end brackets. The front of the shaft carries the blade hub, held by a spinner nut. The rear
   of the shaft is a worm; it turns a worm gear on a plate, whose output shaft comes out under the housing to a crank.
   A link from the crank to a lug fixed on the pole pushes the head back and forth. Pushing the knob on top lowers a
   clutch pin into the worm gear; pulling it lifts the pin, the gear freewheels and the head stays put.
   Parts (each sits on, or is held by, another part):
   BASE   cord grommet . cord sheath . cord grip strap and two screws . live and neutral cores . switch block . four plungers .
          latch bar . four contact tabs . four tap wires . harness junction . run capacitor . its strap and two screws . two leads
   STAND  harness up the pole . pole collar . lug arm . lug pin
   HEAD   terminal block . harness through the neck . rear and front end brackets . two sleeve bearings . rear and front
          windings . stator laminations . rotor core . rotor end rings . rotor bars . shaft (four visible pieces) . worm .
          gear plate . worm gear . output shaft . crank . crank pin . link rod . knob plunger . clutch lever . clutch pin . pull knob
   FRONT  spinner nut */
const FM = { cu: matOf('#d08a52'), lam: matOf('#8d949a'), alu: matOf('#d4d8da'), bake: matOf('#4a4440'), brass: matOf('#d8b25a'),
  bronze: matOf('#c9965a'), cap: matOf('#3d6fb0'), rub: DARK };
const fBox = (pts, e = .05) => [[0,1,2].map(i => Math.min(...pts.map(p => p[i])) - e), [0,1,2].map(i => Math.max(...pts.map(p => p[i])) + e)];
const fBend = (pts, r = 1.2) => { if (pts.length < 3) return pts; const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){ const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const la = Math.hypot(...a.map((v, k) => v - b[k])), lc = Math.hypot(...c.map((v, k) => v - b[k])), d = Math.min(r, la/2.2, lc/2.2);
    if (d < 1e-3){ out.push(b); continue; }
    const p = a.map((v, k) => b[k] + (v - b[k]) * d/la), q = c.map((v, k) => b[k] + (v - b[k]) * d/lc);
    for (let j = 0; j <= 4; j++){ const t = j/4; out.push([0,1,2].map(k => (1-t)*(1-t)*p[k] + 2*(1-t)*t*b[k] + t*t*q[k])); } }
  out.push(pts[pts.length - 1]); return out; };
// a cable cut into short pieces with their own boxes, so byDepth sorts each piece against the solids it passes
const fWire = (pts, col, w = .3, ends = true, L = 3) => { const q = fBend(pts), out = [];
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j - 1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    let svg = `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f(2*w + .9)}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(2*w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ends && i === 0){ const [X, Y] = P(...q[0]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".8" fill="${INK}"/>`; }
    if (ends && j === q.length - 1){ const [X, Y] = P(...q[j]); svg += `<circle cx="${f(X)}" cy="${f(Y)}" r=".8" fill="${INK}"/>`; }
    out.push({ box: fBox(seg, w), svg }); i = j; }
  return out; };
const N0 = [Math.cos(PSI0), Math.sin(PSI0), 0];                  // the head's middle heading: the pole lug points the other way
const SW = [23.8, 13.4, 1.0, 30.2, 31.2, 4.2], JUN = [22.4, 20.4, 2.2];
const LUG = [PIV[0] - 4*N0[0], PIV[1] - 4*N0[1], PIV[2] - 5.5];
const GEAR = { s: -10.8, p: 2.5, r: 1.6 }, CRANK = 1.6;
const aHead = (s0, s1, r, M, w = .7, n = 20, qc = QA, p = 0) => gCyl(Hp(0, p, qc), FR.a, FR.u, FR.v, r, s0, s1, M, toneI, w, n);
function fanMech(st){
  setFrame(st);
  const lit = st.speed > 0, H = '#3a3632', Hon = '#ffb347', base = [], low = [], ax = [], top = [];
  const into = (L, b, svg) => L.push({ box: b, svg });
  const bx = (L, x0, y0, z0, x1, y1, z1, M, w = .7, extra = '') => into(L, [[x0, y0, z0], [x1, y1, z1]], box(x0, y0, z0, x1, y1, z1, M, toneI, w) + extra);
  const vc = (L, x, y, z0, z1, r, M, w = .7, n = 16) => into(L, [[x - r, y - r, z0], [x + r, y + r, z1]], cyl(x, y, z0, z1, r, M, toneI, w, n));
  const rd = (L, a, b, r, M, w = .6, n = 10) => into(L, fBox([a, b], r), rod(a, b, r, M, toneI, w, r, n));
  // ---- base: cord, grip, switch block with plungers and tabs, capacitor in its strap, wires to the harness junction
  rd(base, [2.6, 21, 2.2], [4.2, 21, 2.2], .9, FM.rub, .6, 14);
  base.push(...fWire([[4.2, 21, 2.0], [8.5, 21, 2.0], [10, 21, 2.0]], DARK.l, .6, false));
  rd(base, [7, 19.9, 2.95], [7, 22.1, 2.95], .3, METAL, .5, 8);
  for (const y of [19.6, 22.4]) vc(base, 7, y, .8, 3.2, .4, METAL, .4, 10);
  base.push(...fWire([[10, 20.85, 2.0], [20, 20.85, 2.0], [SW[0], 22, 2.4]], '#9a5a2c', .22, false));               // live to the switch's common
  base.push(...fWire([[10, 21.2, 2.0], [JUN[0], 21.2, 2.0], JUN], '#3c6fb4', .22, false));                         // neutral straight to the motor
  bx(base, ...SW, matOf('#8a7d6e'), .8);
  bx(base, SW[0] + .3, SW[1] + .4, SW[5], SW[0] + .9, SW[4] - .4, SW[5] + .35, METAL, .5);                         // latch bar
  for (const [sp, y] of KEYS){ const on = st.speed === sp;
    vc(base, 27, y, SW[5], BT, .5, METAL, .5, 10);
    if (sp) { bx(base, SW[0] - .4, y - .5, 2.2, SW[0], y + .5, 3.0, on ? matOf('#ff9a3a') : FM.brass, .5);
      base.push(...fWire([[SW[0] - .4, y, 2.6], [SW[0] - 1, y, 2.4], [JUN[0], JUN[1] + (y - 22)*.08, JUN[2]]], on ? Hon : H, .18, false, 2)); } }
  into(base, [[10.4, 9, .8], [13.6, 16, 4.0]], cylY(9, 16, 12, 2.4, 1.6, FM.cap));
  bx(base, 10.2, 12.2, .8, 13.8, 12.8, 4.1, METAL, .5);
  for (const x of [9.7, 14.3]) bx(base, x - .5, 12.2, .8, x + .5, 12.8, 1.1, METAL, .4);
  for (const dx of [-.4, .4]) base.push(...fWire([[12 + dx, 16, 2.4], [12 + dx, 19.4 + dx, 2.0], [JUN[0], 19.4 + dx, 2.0], JUN], H, .18, false, 2));
  // ---- stand: harness up the pole and out round the back of the joint; collar and lug the swing link pushes against
  const a0 = FR.a0, pc = [PIV[0] - .6*N0[0], PIV[1] - .6*N0[1]];
  const ex = d => [PIV[0] - d*a0[0], PIV[1] - d*a0[1]];
  low.push(...fWire([JUN, [pc[0], pc[1], JUN[2]], [pc[0], pc[1], PIV[2] - 3.6], [...ex(2.2), PIV[2] - 3.6], [...ex(3.6), PIV[2] - 1.6],
    Hp(-3.6, 0, 1.2), Hp(-3.6, 0, 3.6), Hp(-5.2, 0, QA - 5.6)], lit ? Hon : H, .45, false, 3));
  vc(low, PIV[0], PIV[1], PIV[2] - 6, PIV[2] - 5, 2.4, METAL, .7, 18);
  rd(low, [PIV[0] - 2.2*N0[0], PIV[1] - 2.2*N0[1], PIV[2] - 5.5], LUG, .45, METAL, .5);
  vc(low, LUG[0], LUG[1], LUG[2] - .8, LUG[2] + .6, .45, METAL, .5, 10);
  // ---- head, under the axis: terminal block, output shaft, crank, link to the lug
  into(low, fBox([Hp(-6, -1, QA - 5.7), Hp(-4.4, 1, QA - 5.2)]), hbox(-6, -4.4, -1, 1, QA - 5.7, QA - 5.2, FM.bake, .6));
  const gc = q => Hp(GEAR.s, GEAR.p, q), cp = Hp(GEAR.s + CRANK*Math.cos(st.th), GEAR.p + CRANK*Math.sin(st.th), 2.0);
  into(low, fBox([gc(2), gc(QA - .35)], .35), gCyl(gc(0), FR.v, FR.a, FR.u, .35, 2, QA - .35, METAL, toneI, .5, 10));
  rd(low, gc(2), cp, .35, METAL, .5);
  into(low, fBox([cp, Hp(GEAR.s + CRANK*Math.cos(st.th), GEAR.p + CRANK*Math.sin(st.th), 1.4)], .35),
    gCyl(cp, FR.v, FR.a, FR.u, .35, -.6, 0, METAL, toneI, .5, 10));
  rd(low, Hp(GEAR.s + CRANK*Math.cos(st.th), GEAR.p + CRANK*Math.sin(st.th), 1.6), [LUG[0], LUG[1], LUG[2] + .3], .3, METAL, .5);
  // ---- head, along the axis (rear to front): gearbox, rear bracket, windings, stator over the rotor, front bracket, nut
  const grp = (s, svg) => ax.push({ s, svg });
  { const g = [], gin = (pt, svg) => g.push({ at: pt, svg });
    gin(Hp(-10.8, 2.5, QA - 1.35), hbox(-12, -9.6, .6, 4.4, QA - 1.6, QA - 1.1, METAL, .6));
    let worm = aHead(-11.6, -10, .9, METAL, .6, 16);
    for (let k = 0; k < 6; k++){ const s0 = -11.4 + k*.28, pts = [];
      for (let j = 0; j <= 12; j++){ const t = st.ang + j/12*2*Math.PI, nr = hv(0, Math.cos(t), Math.sin(t)); if (vis(nr)) pts.push(Hp(s0 + j/12*.28, .92*Math.cos(t), QA + .92*Math.sin(t))); }
      if (pts.length > 1) worm += line(pts, .35); }
    gin(Hp(-10.8, 0, QA), aHead(-11.8, -11.6, .6, METAL, .5, 10) + worm);
    let gear = gCyl(gc(0), FR.v, FR.a, FR.u, GEAR.r, QA - .35, QA + .35, FM.bronze, toneI, .7, 24);
    if (vis(FR.v)) for (let k = 0; k < 16; k++){ const t = st.th*6 + k/16*2*Math.PI;
      gear += line([Hp(GEAR.s + 1.25*Math.cos(t), GEAR.p + 1.25*Math.sin(t), QA + .36), Hp(GEAR.s + GEAR.r*Math.cos(t), GEAR.p + GEAR.r*Math.sin(t), QA + .36)], .3); }
    gin(gc(QA), gear);
    grp(-10.8, byDepth(g)); }
  grp(-9.8, aHead(-10, -9.4, .6, METAL, .5, 10));
  const bracket = s => hbox(s - .2, s + .2, -.7, .7, QA - 6.6, QA + 6.6, METAL, .6) + aHead(s - .4, s + .4, 1.1, FM.bronze, .6, 16);
  grp(-9.2, bracket(-9.2));
  grp(-8.65, aHead(-8.9, -8.4, .6, METAL, .5, 10));
  const coil = (s0, s1) => { let c = aHead(s0, s1, 4.8, FM.cu, .8, 32), d = '';
    for (let k = 1; k < 4; k++) d += visArc(s0 + (s1 - s0)*k/4, 4.82);
    return c + `<path d="${d}" fill="none" stroke="${FM.cu.d}" stroke-width=".5"/>`; };
  grp(-8, coil(-8.4, -7.6));
  { let rot = aHead(-7.6, -7.4, 3.0, FM.alu, .6, 24) + aHead(-7.4, -3.2, 2.8, FM.lam, .7, 24) + aHead(-3.2, -3.0, 3.0, FM.alu, .6, 24);
    const bars = [];
    for (let k = 0; k < 14; k++){ const t = st.ang + k/14*2*Math.PI, t1 = t + .35;
      if (vis(hv(0, Math.cos((t + t1)/2), Math.sin((t + t1)/2)))) bars.push(pd([Hp(-7.4, 2.82*Math.cos(t), QA + 2.82*Math.sin(t)), Hp(-3.2, 2.82*Math.cos(t1), QA + 2.82*Math.sin(t1))], false)); }
    rot += `<path d="${bars.join('')}" fill="none" stroke="${FM.alu.l}" stroke-width=".9" stroke-linecap="round"/>`;
    let lam = '';
    for (let k = 1; k < 9; k++) lam += visArc(-7.6 + k*4.6/9, 5.22);
    const stator = `<g opacity=".5">${aHead(-7.6, -3.0, 5.2, FM.lam, .9, 36)}<path d="${lam}" fill="none" stroke="${FM.lam.d}" stroke-width=".45"/></g>`;
    grp(-5.3, rot + stator); }
  grp(-2.6, coil(-3.0, -2.2));
  grp(-2.0, aHead(-2.2, -1.8, .6, METAL, .5, 10));
  grp(-1.4, bracket(-1.4));
  grp(0, aHead(-1.0, 1.1, .6, METAL, .5, 10));
  grp(9.3, revolve([[8.4, 1.55], [9.3, 1.55], [9.9, 1.0], [10.2, .3]], METAL, toneI, 16)
    + (vis(FR.a) ? fill(pd(hring(10.2, .3, 10)), METAL.l) : fill(pd(hring(8.4, 1.55, 16)), METAL.m))
    + hullInk([...hring(8.4, 1.55, 16), ...hring(9.3, 1.55, 16), ...hring(10.2, .3, 8)], .9));
  // ---- above the axis: knob plunger, clutch lever, clutch pin (engaged when the knob is pushed in), the pull knob
  const lb = QA + 5.5 + (st.osc ? 0 : .9), kz = st.osc ? 8.3 : 9.8;
  top.push(gCyl(Hp(-7.5, 0, 0), FR.v, FR.a, FR.u, .45, lb, QA + 7.2, METAL, toneI, .5, 10));
  top.push(rod(Hp(-7.5, 0, lb), Hp(GEAR.s, GEAR.p, lb), .3, METAL, toneI, .5, .3, 8));
  top.push(gCyl(gc(0), FR.v, FR.a, FR.u, .35, lb - 5.15, lb, METAL, toneI, .5, 10));
  if (vis(FR.v)) top.push(act('osc', gCyl(Hp(-7.5, 0, QA), FR.v, FR.a, FR.u, 1.5, 7.2, kz, DARK, toneI, 1, 18)));
  const toward = vis(FR.a), axs = ax.sort((p, q) => toward ? p.s - q.s : q.s - p.s).map(p => p.svg).join('');
  return byDepth(base) + byDepth(low) + axs + top.join('');
}
// cylinder lying along y (the run capacitor), with the cap on whichever end faces the viewer
function cylY(y0, y1, x, z, r, m, w = .8, n = 18){
  const A = on(PY(y0), ellUV(x, z, r, r, n)), B = on(PY(y1), ellUV(x, z, r, r, n)), capB = vis([0,1,0]), cap = capB ? B : A, cn = capB ? [0,1,0] : [0,-1,0];
  return loft(A, B, nr => toneI(nr, m)) + fill(pd(cap), toneI(cn, m)) + hullInk([...A, ...B], w) + ink(pd(cap), w*.8);
}
const XR_OPTS = { getSt: () => { try { return ui.st; } catch (e) { return {}; } }, B: [0, 40, 0, 40, 0, 56],
  mech: () => '', over: (st, k) => `<g opacity="${f(k)}">${fanMech(st)}</g>`,
  inside: st => { setFrame(st); const lit = st.speed > 0, swing = !!st.osc && lit;
    return [ { at: Hp(-5.3, 0, QA - 5.2), text:'STATOR', on: lit },
      { at: Hp(-8, 0, QA - 4.8), text:'WINDINGS', on: lit },
      { at: Hp(-1.4, 0, QA - 1.1), text:'BEARING', on: lit },
      { at: Hp(GEAR.s, GEAR.p, QA + .4), text:'WORM GEAR', on: swing },
      { at: Hp(GEAR.s + CRANK*Math.cos(st.th), GEAR.p + CRANK*Math.sin(st.th), 1.6), text:'CRANK LINK', on: swing },
      { at: Hp(GEAR.s, GEAR.p, QA + 2), text:'CLUTCH', on: !!st.osc },
      { at: Hp(10.2, 0, QA), text:'SPINNER NUT', on: false },
      { at:[PIV[0], PIV[1], 20], text:'WIRING', on: lit },
      { at:[SW[3], 22, SW[5]], text:'SPEED SWITCH', on: lit },
      { at:[13.6, 12.5, 4], text:'CAPACITOR', on: lit } ]; } };
const XR_CAPTION = st => {
  if (st.speed > 0 && st.osc) return 'Swinging: the worm on the back of the motor shaft turns the worm gear, the clutch pin locks it to its output shaft, and the crank under the housing pushes the link against the lug on the pole, so the head swings back and forth.';
  if (st.speed > 0) return `Speed ${st.speed}: the key pushes its plunger into the switch block, which connects the live to one tap of the windings. The capacitor feeds the second winding; the stator’s field turns the rotor and shaft in its two sleeve bearings, and the spinner nut holds the blade hub on the shaft.`;
  if (st.osc) return 'The knob is pushed in: the clutch pin is down in the worm gear, so the head will swing as soon as the motor runs.';
  return 'Off: no key is down, so the switch block in the base is open. The harness runs up inside the pole, round the back of the tilt joint and through the neck to the motor. Pull the knob up and the clutch pin lifts out of the worm gear, which then freewheels.';
};

XR_OPTS.under = true;
scene = xrWrap(scene, XR_OPTS);
ui = mountFigure({
  fig:'17', title:'Desk fan', hint:'pick a speed, let it swing, tilt the head',
  size:[34, 34, 54], palette:'mint', state:st, turn:'full',
  scene,
  readout: st => st.speed ? `speed ${st.speed}${st.osc ? ' · swinging' : ''}` : 'off',
  stats: st => [ { label:'Speed', value: st.speed ? String(st.speed) : 'OFF' },
                 { label:'RPM', value: String(Math.round(Math.abs(st.omega) / SPEEDS[3] * 1450 / 10) * 10), small:true } ],
  buttonsLabel:'Fan',
  buttons:[
    { label:'Speed', choices: st => [1,2,3].map(sp => ({ label: sp + ' · ' + ['low','medium','high'][sp-1], current: st.speed === sp, onClick:(st,ui) => setSpeed(sp, ui) })) },
    { label:'Swing on / off', onClick:(st,ui) => toggleOsc(ui) },
    { label:'Tilt', choices: st => Object.keys(TILTS).map(k => ({ label:k, current: st.phiT === TILTS[k], onClick:(st,ui) => setTilt(k, ui) })) },
    { label:'Off', onClick:(st,ui) => setSpeed(0, ui) },
  ],
  acts:{
    key:(st, el, ui) => { const sp = +el.dataset.k; if (sp === st.speed) return; setSpeed(sp, ui); },
    osc:(st, el, ui) => toggleOsc(ui),
  },
  params:(st, q) => {
    if (q.has('speed')){ st.speed = Math.max(0, Math.min(3, +q.get('speed') || 0)); st.omega = SPEEDS[st.speed]; }
    if (q.get('osc') === '1') st.osc = true;
    if (q.has('th')) st.th = +q.get('th');
    if (q.has('tilt') && TILTS[q.get('tilt')] != null) st.phi = st.phiT = TILTS[q.get('tilt')];
    if (q.has('t')) st.t = +q.get('t');
  },
});
if (st.omega > 0) kick();
xrMount(() => ui, XR_CAPTION);