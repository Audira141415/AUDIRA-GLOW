// The skeleton as data: [joint, parent, rest position (world, metres)]. y up, facing +z, left side +x.
const CAT_RIG = {
 "about": "The robot cat's skeleton (refs/cat-bot.webp): the page builds its joints from it. Metres, y up, the cat faces +z, its left side is +x. pos = the joint's rest position (world).",
 "joints": [
  [
   "Hips",
   null,
   [
    0,
    0.5,
    -0.26
   ]
  ],
  [
   "Spine",
   "Hips",
   [
    0,
    0.51,
    -0.02
   ]
  ],
  [
   "Chest",
   "Spine",
   [
    0,
    0.52,
    0.2
   ]
  ],
  [
   "Neck",
   "Chest",
   [
    0,
    0.62,
    0.31
   ]
  ],
  [
   "Head",
   "Neck",
   [
    0,
    0.84,
    0.38
   ]
  ],
  [
   "LeftEar",
   "Head",
   [
    0.085,
    0.97,
    0.35
   ]
  ],
  [
   "RightEar",
   "Head",
   [
    -0.085,
    0.97,
    0.35
   ]
  ],
  [
   "LeftUpperArm",
   "Chest",
   [
    0.115,
    0.46,
    0.24
   ]
  ],
  [
   "LeftForeArm",
   "LeftUpperArm",
   [
    0.115,
    0.27,
    0.2
   ]
  ],
  [
   "LeftHand",
   "LeftForeArm",
   [
    0.115,
    0.09,
    0.23
   ]
  ],
  [
   "LeftFinger",
   "LeftHand",
   [
    0.115,
    0.025,
    0.29
   ]
  ],
  [
   "RightUpperArm",
   "Chest",
   [
    -0.115,
    0.46,
    0.24
   ]
  ],
  [
   "RightForeArm",
   "RightUpperArm",
   [
    -0.115,
    0.27,
    0.2
   ]
  ],
  [
   "RightHand",
   "RightForeArm",
   [
    -0.115,
    0.09,
    0.23
   ]
  ],
  [
   "RightFinger",
   "RightHand",
   [
    -0.115,
    0.025,
    0.29
   ]
  ],
  [
   "LeftUpLeg",
   "Hips",
   [
    0.115,
    0.45,
    -0.3
   ]
  ],
  [
   "LeftLeg",
   "LeftUpLeg",
   [
    0.115,
    0.29,
    -0.2
   ]
  ],
  [
   "LeftFoot",
   "LeftLeg",
   [
    0.115,
    0.13,
    -0.33
   ]
  ],
  [
   "LeftToe",
   "LeftFoot",
   [
    0.115,
    0.025,
    -0.28
   ]
  ],
  [
   "RightUpLeg",
   "Hips",
   [
    -0.115,
    0.45,
    -0.3
   ]
  ],
  [
   "RightLeg",
   "RightUpLeg",
   [
    -0.115,
    0.29,
    -0.2
   ]
  ],
  [
   "RightFoot",
   "RightLeg",
   [
    -0.115,
    0.13,
    -0.33
   ]
  ],
  [
   "RightToe",
   "RightFoot",
   [
    -0.115,
    0.025,
    -0.28
   ]
  ],
  [
   "Tail1",
   "Hips",
   [
    0,
    0.55,
    -0.4
   ]
  ],
  [
   "Tail2",
   "Tail1",
   [
    0,
    0.62,
    -0.5
   ]
  ],
  [
   "Tail3",
   "Tail2",
   [
    0,
    0.72,
    -0.56
   ]
  ],
  [
   "Tail4",
   "Tail3",
   [
    0,
    0.84,
    -0.58
   ]
  ],
  [
   "Tail5",
   "Tail4",
   [
    0,
    0.96,
    -0.55
   ]
  ],
  [
   "Tail6",
   "Tail5",
   [
    0,
    1.06,
    -0.48
   ]
  ],
  [
   "Tail7",
   "Tail6",
   [
    0,
    1.12,
    -0.39
   ]
  ]
 ]
};

// The robot cat (refs/cat-bot.webp), built from parts on a skeleton (CAT_RIG, from cat-rig.json), with motion computed live:
// a four-legged gait (walk → gallop by speed) with two-joint IK, so each paw plants on the floor and lifts in an arc; the body
// bobs and pitches, the head stays level, the tail is a springy chain. Its moves (sit, stretch, pounce, jump, lie down, tail
// swish) are poses fed through the same solver, baked to clips. Metres, y up, facing +z, left side +x.
const CAT = (() => {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const R0 = {}; CAT_RIG.joints.forEach(([n, p, pos]) => R0[n] = { parent: p, pos: V3(...pos) });   // rest positions (world)

  // joints as groups, rest rotation identity, each placed relative to its parent
  function skeleton() {
    const root = new THREE.Group(); root.name = 'CatRoot'; const J = {};
    CAT_RIG.joints.forEach(([n, p]) => { const g = new THREE.Group(); g.name = n; g.position.copy(R0[n].pos).sub(p ? R0[p].pos : V3(0, 0, 0)); (p ? J[p] : root).add(g); J[n] = g; });
    return { root, J };
  }

  // a capsule that tapers from r1 to r2 over length L, along +y from the origin (a lathe: round both ends)
  function taper(r1, r2, L, seg = 20) {
    const pts = [];
    for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(a)), r1 * Math.sin(a))); }
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, r2 * Math.cos(a)), L + r2 * Math.sin(a))); }
    return new THREE.LatheGeometry(pts, seg);
  }

  // the body: every part in its own holder on a joint (contact lines pair holders on the same joint)
  function body(J) {
    const holder = (name, jn) => { const h = new THREE.Group(); h.name = name + '_h'; J[jn].add(h); return h; };
    const local = (jn, w) => V3(...w).sub(R0[jn].pos);
    const part = (name, jn, geo, w, rot = [0, 0, 0], scale = [1, 1, 1]) => {
      const h = holder(name, jn); h.position.copy(local(jn, w)); h.rotation.set(...rot); h.scale.set(...scale);
      const m = new THREE.Mesh(geo); m.name = name; h.add(m); return m; };
    // a limb from joint a toward joint b (or any world point), tapering r1 → r2
    const limb = (name, a, b, r1, r2, along = null) => {
      const A = R0[a].pos, B = along || R0[b].pos, d = B.clone().sub(A), h = holder(name, a);
      h.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
      const m = new THREE.Mesh(taper(r1, r2, d.length())); m.name = name; h.add(m); return m; };
    // a joint disc: a ring with a flat hub, facing sideways (the cyan rings of the drawing; they light up)
    const disc = (name, jn, w, r, side = 1) => {
      part(name + 'Ring', jn, new THREE.TorusGeometry(r, r * 0.2, 10, 28), w, [0, Math.PI / 2, 0]);
      part(name + 'Hub', jn, new THREE.CylinderGeometry(r * 0.72, r * 0.72, r * 0.35, 24), w, [0, 0, Math.PI / 2]); };
    const sphere = r => new THREE.SphereGeometry(r, 28, 18);

    // torso: hip and chest shells on a belly, so the spine can flex
    part('HipShell', 'Hips', sphere(1), [0, 0.505, -0.27], [0.08, 0, 0], [0.135, 0.13, 0.185]);
    limb('Belly', 'Hips', 'Spine', 0.095, 0.1);
    limb('Belly2', 'Spine', 'Chest', 0.1, 0.11);
    part('ChestShell', 'Chest', sphere(1), [0, 0.53, 0.19], [-0.15, 0, 0], [0.135, 0.155, 0.16]);
    [1, -1].forEach(s => disc((s > 0 ? 'L' : 'R') + 'Shoulder', 'Chest', [s * 0.14, 0.47, 0.23], 0.05, s));
    // neck and head
    limb('Neck', 'Neck', 'Head', 0.06, 0.05);
    part('Collar', 'Chest', new THREE.TorusGeometry(0.07, 0.016, 10, 28), [0, 0.6, 0.29], [Math.PI / 2 - 0.35, 0, 0]);
    part('HeadShell', 'Head', sphere(1), [0, 0.865, 0.4], [0, 0, 0], [0.125, 0.115, 0.12]);
    part('Muzzle', 'Head', sphere(1), [0, 0.825, 0.495], [0, 0, 0], [0.06, 0.045, 0.05]);
    part('Nose', 'Head', sphere(0.014), [0, 0.845, 0.54]);
    [1, -1].forEach(s => {
      const S = s > 0 ? 'L' : 'R';
      part('Eye' + S, 'Head', sphere(0.03), [s * 0.055, 0.885, 0.497], [0, 0, 0], [1, 1, 0.6]);
      part(S + 'JawRing', 'Head', new THREE.TorusGeometry(0.028, 0.007, 8, 22), [s * 0.115, 0.83, 0.405], [0, Math.PI / 2, 0]);
      // ears: a cone with a lit inner face, on its own joint so it can twitch
      const ear = S === 'L' ? 'LeftEar' : 'RightEar';
      part('Ear' + S, ear, new THREE.ConeGeometry(0.05, 0.14, 4, 1), [s * 0.1, 1.035, 0.35], [-0.12, Math.PI / 4, -s * 0.28]);
      part('EarIn' + S, ear, new THREE.ConeGeometry(0.03, 0.095, 4, 1), [s * 0.098, 1.02, 0.368], [-0.12, Math.PI / 4, -s * 0.28]);
    });
    // whiskers: drawn hairlines, not solids
    { const w = []; [1, -1].forEach(s => [[0.02, 0.4], [0, 0.2], [-0.02, 0]].forEach(([dy, dz]) => {
        const a = V3(s * 0.04, 0.825 + dy * 0.4, 0.52).sub(R0.Head.pos), b = V3(s * 0.2, 0.84 + dy * 2, 0.5 + dz * 0.15).sub(R0.Head.pos); w.push(...a.toArray(), ...b.toArray()); }));
      J.Head.add(fat(w, majorMat)); }

    // legs: front (shoulder → elbow → wrist → paw) and hind (haunch → knee → hock → paw), each joint with its ring
    [['Left', 1], ['Right', -1]].forEach(([S, s]) => {
      const x = s * 0.115;
      limb(S + 'UpperArmM', S + 'UpperArm', S + 'ForeArm', 0.05, 0.04);
      disc(S + 'Elbow', S + 'ForeArm', [x + s * 0.035, 0.27, 0.2], 0.035, s);
      limb(S + 'ForeArmM', S + 'ForeArm', S + 'Hand', 0.036, 0.032);
      disc(S + 'Wrist', S + 'Hand', [x + s * 0.032, 0.09, 0.23], 0.03, s);
      limb(S + 'HandM', S + 'Hand', S + 'Finger', 0.031, 0.03);
      part(S + 'FrontPaw', S + 'Finger', sphere(1), [x, 0.03, 0.272], [0, 0, 0], [0.048, 0.03, 0.062]);
      limb(S + 'HaunchM', S + 'UpLeg', S + 'Leg', 0.088, 0.05);
      disc(S + 'Hip', S + 'UpLeg', [x + s * 0.06, 0.45, -0.3], 0.05, s);
      disc(S + 'Knee', S + 'Leg', [x + s * 0.035, 0.29, -0.2], 0.034, s);
      limb(S + 'ShinM', S + 'Leg', S + 'Foot', 0.042, 0.033);
      disc(S + 'Hock', S + 'Foot', [x + s * 0.03, 0.13, -0.33], 0.03, s);
      limb(S + 'FootM', S + 'Foot', S + 'Toe', 0.032, 0.03);
      part(S + 'HindPaw', S + 'Toe', sphere(1), [x, 0.03, -0.262], [0, 0, 0], [0.048, 0.03, 0.062]);
    });
    // tail: banded segments, a glowing tip
    limb('TailBase', 'Hips', 'Tail1', 0.034, 0.03);
    for (let i = 1; i < 7; i++) {
      const a = 'Tail' + i, b = 'Tail' + (i + 1), r = 0.03 - i * 0.002;
      limb(a + 'M', a, b, r, r - 0.002);
      if (i % 2) { const h = holder(a + 'Band', a); h.quaternion.setFromUnitVectors(V3(0, 0, 1), R0[b].pos.clone().sub(R0[a].pos).normalize());
        const m = new THREE.Mesh(new THREE.TorusGeometry(r + 0.004, 0.009, 8, 20)); m.name = a + 'Band'; h.add(m); }
    }
    { const d = R0.Tail7.pos.clone().sub(R0.Tail6.pos).normalize(); limb('TailTip', 'Tail7', null, 0.03, 0.036, R0.Tail7.pos.clone().addScaledVector(d, 0.09)); }
  }

  // ── the solver: body offsets, paw targets, head and tail angles → joint rotations (Cat A, live and for baking moves) ──
  const LEGS = [['LF', 'LeftUpperArm', 'LeftForeArm', 'LeftHand', 'LeftFinger'], ['RF', 'RightUpperArm', 'RightForeArm', 'RightHand', 'RightFinger'],
                ['LH', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToe'], ['RH', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToe']];
  const TAIL = ['Tail1', 'Tail2', 'Tail3', 'Tail4', 'Tail5', 'Tail6', 'Tail7'];
  const LEN = {}, BEND = {};
  LEGS.forEach(([k, T, M, L]) => { const t = R0[T].pos, m = R0[M].pos, l = R0[L].pos;
    LEN[k] = [m.distanceTo(t), l.distanceTo(m)];
    BEND[k] = Math.sign(m.z - (t.z + l.z) / 2) || 1; });          // elbows bend back, knees forward — as drawn
  const neutral = k => { const L = LEGS.find(x => x[0] === k)[3]; return R0[L].pos.clone(); };   // where each wrist / hock rests
  const q = new THREE.Quaternion(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), e = new THREE.Euler(), tmp = new THREE.Vector3();

  function solver(root, J) {
    const rootQ = new THREE.Quaternion(), out = {};          // out: name → { q, p } the pose to apply
    const qIn = n => { J[n].getWorldQuaternion(qa); return root.getWorldQuaternion(rootQ).invert().multiply(qa).clone(); };   // a joint's rotation in root space
    const pIn = n => root.worldToLocal(J[n].getWorldPosition(tmp).clone());
    function pose(P) {
      // reset to rest, then the body
      CAT_RIG.joints.forEach(([n]) => { J[n].quaternion.identity(); J[n].position.copy(R0[n].pos).sub(R0[n].parent ? R0[R0[n].parent].pos : V3(0, 0, 0)); });
      J.Hips.position.add(V3(0, P.y || 0, P.z || 0)); J.Hips.quaternion.setFromEuler(e.set(P.pitch || 0, P.yaw || 0, P.roll || 0));
      J.Spine.quaternion.setFromEuler(e.set((P.flex || 0) * 0.5, 0, 0)); J.Chest.quaternion.setFromEuler(e.set((P.flex || 0) * 0.5 + (P.chest || 0), 0, 0));
      root.updateMatrixWorld(true);
      // legs: two-joint IK in each leg's side plane, paw kept level
      LEGS.forEach(([k, T, M, L]) => {
        const tgt = P.feet && P.feet[k] ? P.feet[k] : neutral(k), top = pIn(T), [a, b] = LEN[k];
        const d = tgt.clone().sub(top); d.x = 0; let dist = Math.min(d.length(), a + b - 1e-4); dist = Math.max(dist, Math.abs(a - b) + 1e-3);
        const dir = d.clone().normalize(), side = V3(1, 0, 0);
        const cosA = (a * a + dist * dist - b * b) / (2 * a * dist), ang = Math.acos(THREE.MathUtils.clamp(cosA, -1, 1));
        // knee position: rotate the reach direction about the side axis by ±ang (bend direction per leg)
        const kneeDir = dir.clone().applyAxisAngle(side, -BEND[k] * ang), knee = top.clone().addScaledVector(kneeDir, a);
        const u1 = knee.clone().sub(top).normalize(), u2 = top.clone().addScaledVector(dir, dist).sub(knee).normalize();
        const r1 = R0[M].pos.clone().sub(R0[T].pos).normalize(), r2 = R0[L].pos.clone().sub(R0[M].pos).normalize();
        const W1 = new THREE.Quaternion().setFromUnitVectors(r1, u1), W2 = new THREE.Quaternion().setFromUnitVectors(r2, u2);
        const parentQ = qIn(R0[T].parent);
        J[T].quaternion.copy(parentQ.clone().invert().multiply(W1));
        J[M].quaternion.copy(W1.clone().invert().multiply(W2));
        const pawPitch = P.paw && P.paw[k] || 0;
        J[L].quaternion.copy(W2.clone().invert().multiply(new THREE.Quaternion().setFromEuler(e.set(pawPitch, 0, 0))));
      });
      // head: neck and head angles (and the counter-tilt that keeps it level)
      J.Neck.quaternion.setFromEuler(e.set((P.neck || 0) - ((P.pitch || 0) + (P.flex || 0) + (P.chest || 0)) * 0.6, (P.look || 0) * 0.4, 0));
      J.Head.quaternion.setFromEuler(e.set(P.head || 0, (P.look || 0) * 0.6, P.tilt || 0));
      J.LeftEar.quaternion.setFromEuler(e.set(P.earL || 0, 0, 0)); J.RightEar.quaternion.setFromEuler(e.set(P.earR || 0, 0, 0));
      // tail: each segment bends by its own lift / sway
      TAIL.forEach((n, i) => J[n].quaternion.setFromEuler(e.set(P.tail ? P.tail[i][0] : 0, 0, P.tail ? P.tail[i][1] : 0)));
      root.updateMatrixWorld(true);
      CAT_RIG.joints.forEach(([n]) => out[n] = { q: J[n].quaternion.clone(), p: J[n].position.clone() });
      return out;
    }
    return pose;
  }

  // a move: a pose function sampled over time, baked to a clip (quaternions for every joint, position for the hips)
  function bake(name, T, fps, poseAt, solve) {
    const n = Math.round(T * fps), times = [], Q = {}, hipsP = [];
    CAT_RIG.joints.forEach(([j]) => Q[j] = []);
    for (let i = 0; i <= n; i++) { const t = i / n * T, o = solve(poseAt(t / T, t)); times.push(t);
      CAT_RIG.joints.forEach(([j]) => Q[j].push(...o[j].q.toArray())); hipsP.push(...o.Hips.p.toArray()); }
    return new THREE.AnimationClip(name, T, [new THREE.VectorKeyframeTrack('Hips.position', times, hipsP),
      ...CAT_RIG.joints.map(([j]) => new THREE.QuaternionKeyframeTrack(j + '.quaternion', times, Q[j]))]);
  }
  return { skeleton, body, solver, bake, neutral, LEGS, TAIL, R0 };
})();

// ── the cat's motion ──
const catA = (() => {
  let root, J, solve, phase = 0, prevHeading = null, turnRate = 0, earT = 0, earL = 0, earR = 0, lookT = 0, look = 0, lookGoal = 0;
  const tailS = CAT.TAIL.map(() => [0, 0]), sm = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const env = (t, a, b, c, d) => t < a ? 0 : t < b ? ease((t - a) / (b - a)) : t < c ? 1 : t < d ? 1 - ease((t - c) / (d - c)) : 0;   // up a→b, hold, down c→d
  const N = k => CAT.neutral(k), F = (k, dx, dy, dz) => N(k).add(new THREE.Vector3(dx, dy, dz));
  const restTail = (lift = 0, sway = 0) => CAT.TAIL.map((_, i) => [lift * (0.3 + i * 0.12), sway * (0.2 + i * 0.12)]);

  // the moves, as poses over normalised time u (0…1)
  const MOVES = {
    Sit: [1.0, (u) => { const k = ease(Math.min(1, u * 1.15));
      return { y: -0.17 * k, z: -0.03 * k, pitch: -0.55 * k, neck: 0.15 * k, tail: restTail(-0.6 * k, 0.35 * k),
        feet: { LH: F('LH', 0, 0, 0.07 * k), RH: F('RH', 0, 0, 0.07 * k), LF: F('LF', 0, 0, -0.02 * k), RF: F('RF', 0, 0, -0.02 * k) }, paw: { LH: 0.9 * k, RH: 0.9 * k } }; }],
    Stretch: [2.4, (u) => { const k = env(u, 0, 0.3, 0.7, 1);
      return { y: -0.04 * k, pitch: 0.38 * k, flex: 0.12 * k, neck: -0.45 * k, head: -0.1 * k, tail: restTail(0.35 * k, 0),
        feet: { LF: F('LF', 0, 0, 0.16 * k), RF: F('RF', 0, 0, 0.16 * k) }, earL: -0.3 * k, earR: -0.3 * k }; }],
    Pounce: [2.2, (u) => { const crouch = env(u, 0, 0.25, 0.55, 0.62), wig = u > 0.25 && u < 0.55 ? Math.sin((u - 0.25) / 0.3 * Math.PI * 6) : 0;
      const leap = env(u, 0.55, 0.7, 0.72, 0.95), arc = Math.sin(Math.min(1, Math.max(0, (u - 0.55) / 0.4)) * Math.PI);
      return { y: -0.1 * crouch + 0.16 * arc, z: 0.3 * leap, pitch: 0.12 * crouch - 0.2 * leap, roll: 0.07 * wig, yaw: 0.05 * wig, neck: -0.25 * crouch,
        tail: restTail(-0.3 * crouch, 0.4 * wig), earL: 0.3 * crouch, earR: 0.3 * crouch,
        feet: { LF: F('LF', 0, 0.12 * arc, 0.3 * leap + 0.1 * arc), RF: F('RF', 0, 0.12 * arc, 0.3 * leap + 0.12 * arc),
                LH: F('LH', 0, 0.05 * arc, 0.3 * leap - 0.05 * arc), RH: F('RH', 0, 0.05 * arc, 0.3 * leap - 0.05 * arc) } }; }],
    Jump: [1.1, (u) => { const crouch = env(u, 0, 0.2, 0.25, 0.32) + env(u, 0.78, 0.86, 0.88, 1) * 0.6, arc = Math.sin(Math.min(1, Math.max(0, (u - 0.3) / 0.5)) * Math.PI);
      const up = 0.32 * arc, tuck = 0.12 * arc;
      return { y: -0.08 * crouch + up, pitch: -0.1 * arc, tail: restTail(0.3 * arc, 0),
        feet: { LF: F('LF', 0, up + tuck, 0.03 * arc), RF: F('RF', 0, up + tuck, 0.03 * arc), LH: F('LH', 0, up + tuck * 0.7, 0), RH: F('RH', 0, up + tuck * 0.7, 0) } }; }],
    LieDown: [1.4, (u) => { const k = ease(Math.min(1, u * 1.1));
      return { y: -0.3 * k, z: 0.02 * k, pitch: 0.04 * k, neck: 0.2 * k, tail: restTail(-1.0 * k, 0.5 * k),
        feet: { LF: F('LF', 0, 0, 0.14 * k), RF: F('RF', 0, 0, 0.14 * k), LH: F('LH', 0.02 * k, 0, 0.12 * k), RH: F('RH', -0.02 * k, 0, 0.12 * k) },
        paw: { LH: 1.2 * k, RH: 1.2 * k } }; }],
    Swish: [1.6, (u) => { const s = Math.sin(u * Math.PI * 4) * env(u, 0, 0.1, 0.85, 1);
      return { tail: CAT.TAIL.map((_, i) => [0.1, s * (0.15 + i * 0.1)]), look: 0.3 * s, earL: 0.2 * s, earR: -0.2 * s }; }],
  };

  function build() {
    ({ root, J } = CAT.skeleton()); CAT.body(J); solve = CAT.solver(root, J);
    const clips = Object.entries(MOVES).map(([n, [T, f]]) => CAT.bake(n, T, 30, f, solve));
    solve({}); return { root, clips };
  }

  // live motion each frame, blended under any playing move by (1 − its weight)
  const OFF = { walk: { LH: 0, LF: 0.25, RH: 0.5, RF: 0.75 }, gallop: { LH: 0, RH: 0.1, LF: 0.5, RF: 0.6 } };
  function tick(st, now, dt, M) {
    if (!root) return;
    const w = 1 - st.eW; if (w <= 0.001) return;
    const run = st.w[2] / Math.max(1e-3, st.w[1] + st.w[2]), moving = Math.min(1, st.v / 0.25);
    const stride = lerp(0.2, 0.46, run), duty = lerp(0.62, 0.38, run), lift = lerp(0.06, 0.1, run);
    phase = (phase + dt * st.v * duty / stride) % 1;          // a planted paw slides back exactly as fast as the cat moves
    const feet = {}, paw = {};
    for (const k of ['LF', 'RF', 'LH', 'RH']) {
      let ph = (phase + lerp(OFF.walk[k], OFF.gallop[k], run)) % 1, dz, dy = 0;
      if (ph < duty) dz = stride / 2 - stride * (ph / duty);
      else { const s = (ph - duty) / (1 - duty); dz = -stride / 2 + stride * sm(s, 0, 1); dy = lift * Math.sin(Math.PI * s); paw[k] = -0.5 * Math.sin(Math.PI * s) * moving; }
      feet[k] = F(k, 0, dy * moving, dz * moving);
    }
    // body: a bob per step; at a gallop the back flexes and the body rocks
    const g2 = phase * Math.PI * 2, breathe = 0.004 * Math.sin(now / 900);
    if (prevHeading !== null) { let d = st.heading - prevHeading; d = Math.atan2(Math.sin(d), Math.cos(d)); turnRate = lerp(turnRate, d / Math.max(dt, 1e-3), Math.min(1, dt * 6)); }
    prevHeading = st.heading;
    // ears twitch now and then; the head looks around when it stands still
    if (now > earT) { earT = now + 1500 + Math.random() * 3500; if (Math.random() < 0.5) earL = 0.35; else earR = 0.35; }
    earL = Math.max(0, earL - dt * 1.5); earR = Math.max(0, earR - dt * 1.5);
    if (now > lookT) { lookT = now + 2500 + Math.random() * 3000; lookGoal = (Math.random() - 0.5) * 1.1 * (1 - moving); }
    look = lerp(look, lookGoal * (1 - moving) - turnRate * 0.25, Math.min(1, dt * 2.5));
    // tail: each segment springs toward its target, lagging more toward the tip
    const sway = Math.sin(g2 + 1) * lerp(0.12, 0.05, run) * moving + Math.sin(now / 1300) * 0.12 * (1 - moving) - turnRate * 0.12;
    const tail = CAT.TAIL.map((_, i) => { const tgt = [lerp(0, -0.12, run) * moving + 0.02 * Math.sin(now / 800 + i), sway * (0.25 + i * 0.12)];
      const k = Math.min(1, dt * (14 - i * 1.4)); tailS[i][0] += (tgt[0] - tailS[i][0]) * k; tailS[i][1] += (tgt[1] - tailS[i][1]) * k; return tailS[i].slice(); });
    const P = { y: breathe + (lerp(-0.008 * Math.cos(g2 * 2), 0.03 * Math.sin(g2), run)) * moving, pitch: 0.1 * Math.sin(g2 + 0.6) * run * moving,
      flex: 0.16 * Math.sin(g2) * run * moving, roll: 0.02 * Math.sin(g2) * (1 - run) * moving - turnRate * 0.03,
      look, earL: -earL, earR: -earR, tail, feet, paw };
    // solve onto scratch, then blend into the joints the mixer just wrote
    const saved = CAT_RIG.joints.map(([n]) => [J[n].quaternion.clone(), J[n].position.clone()]);
    const o = solve(P);
    CAT_RIG.joints.forEach(([n], i) => { J[n].quaternion.copy(saved[i][0]).slerp(o[n].q, w); J[n].position.copy(saved[i][1]).lerp(o[n].p, w); });
  }
  return { build, tick };
})();

const CAT_INFO = (title, body) => `<h2>${title}</h2><p>${body}</p><p style="opacity:.7;margin-top:6px">A robot cat built from a sketch.</p>`;
const CAT_LIGHTS = [
  { pick: t => /^Eye[LR]·iso$/.test(t.twin.name), halo: 0.26, spot: { ahead: 0.55 } },
  { pick: t => /Ring·iso$/.test(t.twin.name) },
  { pick: t => /^(EarIn[LR]|TailTip)·iso$/.test(t.twin.name), halo: 0.16 },
];
botFig({ id: 'cat', name: 'Robot cat', badge: '<b>Sketch-built</b> · auto-rigged &amp; animated', build: catA.build, tick: catA.tick, targetY: 0.45, dist: 5.4, size: 1.2,
  speeds: { walk: 0.55, run: 2.0 }, feet: /^(Left|Right)(Hand|Foot)$/, clips: { idle: 'Idle', jump: 'Jump' }, lights: CAT_LIGHTS,
  moves: [['Sit', '1', 'Sit', { hold: true }, 'sitting'], ['Stretch', '2', 'Stretch', {}, 'stretching'], ['Pounce', '3', 'Pounce', {}, 'pouncing'],
          ['Lie down', '4', 'LieDown', { hold: true }, 'lying down'], ['Tail swish', '5', 'Swish', {}, 'swishing']],
  click: 'Swish', clickLabel: 'swish its tail',
  info: CAT_INFO('Robot cat', 'Built from a sketch: Playable read the drawing, built the body and its 30-joint skeleton, and generates all of its movement. A four-legged gait computed live: blending from a walk into a gallop as it speeds up, two-joint IK so each paw plants on the floor and lifts in an arc, a body that bobs and rocks, a head that stays level and a springy tail. Its moves are poses run through the same solver.') });
