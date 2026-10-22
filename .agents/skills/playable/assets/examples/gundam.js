// AUDIRA-01 "Gundam Striker" · Iconic Bipedal Mecha Mobile Suit
// Built from code using the Playable skill: 30-joint skeleton, geometric mecha parts,
// live two-legged biped gait, dynamic arm swing, thruster physics, and keyframed combat moves.
// Metres, y up, facing +z, left side +x.

const GUNDAM_RIG = {
  about: "AUDIRA-01 Mecha Gundam Striker rig. y up, facing +z, left side +x.",
  joints: [
    ["Hips", null, [0, 1.15, 0]],
    ["Waist", "Hips", [0, 1.28, 0]],
    ["Chest", "Waist", [0, 1.48, 0]],
    ["Neck", "Chest", [0, 1.70, 0.02]],
    ["Head", "Neck", [0, 1.82, 0.04]],

    // Left Arm
    ["LeftShoulder", "Chest", [0.26, 1.60, 0]],
    ["LeftUpperArm", "LeftShoulder", [0.34, 1.46, 0]],
    ["LeftForeArm", "LeftUpperArm", [0.36, 1.20, 0.02]],
    ["LeftHand", "LeftForeArm", [0.36, 0.94, 0.04]],

    // Right Arm
    ["RightShoulder", "Chest", [-0.26, 1.60, 0]],
    ["RightUpperArm", "RightShoulder", [-0.34, 1.46, 0]],
    ["RightForeArm", "RightUpperArm", [-0.36, 1.20, 0.02]],
    ["RightHand", "RightForeArm", [-0.36, 0.94, 0.04]],

    // Left Leg
    ["LeftUpLeg", "Hips", [0.15, 1.05, 0]],
    ["LeftLeg", "LeftUpLeg", [0.16, 0.58, -0.01]],
    ["LeftFoot", "LeftLeg", [0.16, 0.12, 0.02]],

    // Right Leg
    ["RightUpLeg", "Hips", [-0.15, 1.05, 0]],
    ["RightLeg", "RightUpLeg", [-0.16, 0.58, -0.01]],
    ["RightFoot", "RightLeg", [-0.16, 0.12, 0.02]],

    // Backpack & Thruster Flight Pack
    ["Backpack", "Chest", [0, 1.54, -0.16]],
    ["SaberHiltR", "Backpack", [-0.12, 1.76, -0.14]],
    ["SaberHiltL", "Backpack", [0.12, 1.76, -0.14]]
  ]
};

const GUNDAM = (() => {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const R0 = {};
  GUNDAM_RIG.joints.forEach(([n, p, pos]) => { R0[n] = { parent: p, pos: V3(...pos) }; });

  function skeleton() {
    const root = new THREE.Group(); root.name = 'GundamRoot'; const J = {};
    GUNDAM_RIG.joints.forEach(([n, p]) => {
      const g = new THREE.Group(); g.name = n;
      g.position.copy(R0[n].pos).sub(p ? R0[p].pos : V3(0, 0, 0));
      (p ? J[p] : root).add(g);
      J[n] = g;
    });
    return { root, J };
  }

  function body(J) {
    const holder = (name, jn) => { const h = new THREE.Group(); h.name = name + '_h'; J[jn].add(h); return h; };
    const local = (jn, w) => V3(...w).sub(R0[jn].pos);
    const part = (name, jn, geo, w, rot = [0, 0, 0], scale = [1, 1, 1]) => {
      const h = holder(name, jn);
      h.position.copy(local(jn, w));
      h.rotation.set(...rot);
      h.scale.set(...scale);
      const m = new THREE.Mesh(geo); m.name = name; h.add(m);
      return m;
    };

    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);

    // ── 1. HEAD & HELMET (Iconic Gundam Head with V-Fin & Glowing Optics) ──
    part('HeadHelmet', 'Head', box(0.18, 0.18, 0.20), [0, 1.84, 0.04]);
    part('HeadForeheadCrest', 'Head', box(0.08, 0.08, 0.06), [0, 1.93, 0.12]);
    part('HeadChin', 'Head', box(0.06, 0.07, 0.08), [0, 1.74, 0.12]);
    part('HeadCheekL', 'Head', box(0.04, 0.10, 0.14), [0.10, 1.80, 0.08], [0, 0.18, 0]);
    part('HeadCheekR', 'Head', box(0.04, 0.10, 0.14), [-0.10, 1.80, 0.08], [0, -0.18, 0]);

    // Visor / Eyes (Glowing Light source!)
    part('EyeVisor', 'Head', box(0.12, 0.032, 0.04), [0, 1.83, 0.14]);

    // Red Center Jewel on Crest
    part('HeadJewel', 'Head', box(0.04, 0.05, 0.03), [0, 1.94, 0.155]);

    // V-Fin Antennas (Iconic Golden / White V-Wings)
    part('VFinLeft', 'Head', box(0.024, 0.22, 0.015), [0.085, 2.01, 0.14], [0, 0, -0.72]);
    part('VFinRight', 'Head', box(0.024, 0.22, 0.015), [-0.085, 2.01, 0.14], [0, 0, 0.72]);
    part('VFinCenterBlade', 'Head', box(0.02, 0.12, 0.015), [0, 1.98, 0.145]);

    // Vulcan Cannons (Head side mounts)
    part('HeadVulcanL', 'Head', cyl(0.012, 0.012, 0.05, 8), [0.07, 1.89, 0.11], [Math.PI / 2, 0, 0]);
    part('HeadVulcanR', 'Head', cyl(0.012, 0.012, 0.05, 8), [-0.07, 1.89, 0.11], [Math.PI / 2, 0, 0]);

    // Neck ring
    part('NeckCollar', 'Neck', cyl(0.065, 0.075, 0.08, 16), [0, 1.70, 0.02]);

    // ── 2. TORSO & COCKPIT ──
    // Main Chest Block
    part('ChestMain', 'Chest', box(0.38, 0.26, 0.24), [0, 1.50, 0.01]);
    // Yellow Air Intake Vents
    part('ChestIntakeL', 'Chest', box(0.09, 0.07, 0.06), [0.12, 1.52, 0.13]);
    part('ChestIntakeR', 'Chest', box(0.09, 0.07, 0.06), [-0.12, 1.52, 0.13]);
    // Center Cockpit Hatch Block
    part('CockpitHatch', 'Chest', box(0.12, 0.16, 0.10), [0, 1.45, 0.14], [-0.15, 0, 0]);
    // Glowing Core Reactor Prism
    part('ChestReactor', 'Chest', box(0.06, 0.06, 0.02), [0, 1.48, 0.19]);
    // Collar Armor Guard
    part('CollarGuardL', 'Chest', box(0.05, 0.08, 0.12), [0.14, 1.62, 0.04]);
    part('CollarGuardR', 'Chest', box(0.05, 0.08, 0.12), [-0.14, 1.62, 0.04]);

    // ── 3. WAIST & SKIRT ARMOR ──
    part('WaistAbdomen', 'Waist', box(0.24, 0.16, 0.18), [0, 1.30, 0]);
    part('WaistBelt', 'Hips', box(0.30, 0.08, 0.22), [0, 1.18, 0]);
    // Front Skirt Armor Plates (left & right)
    part('FrontSkirtL', 'Hips', box(0.12, 0.18, 0.035), [0.07, 1.07, 0.12], [-0.22, 0, 0.05]);
    part('FrontSkirtR', 'Hips', box(0.12, 0.18, 0.035), [-0.07, 1.07, 0.12], [-0.22, 0, -0.05]);
    // Side Skirt Thruster Pods
    part('SideSkirtL', 'Hips', box(0.05, 0.18, 0.14), [0.17, 1.06, 0], [0, 0, -0.15]);
    part('SideSkirtR', 'Hips', box(0.05, 0.18, 0.14), [-0.17, 1.06, 0], [0, 0, 0.15]);
    // Rear Skirt Guard
    part('RearSkirt', 'Hips', box(0.26, 0.16, 0.04), [0, 1.08, -0.12], [0.20, 0, 0]);

    // ── 4. SHOULDERS & ARMS ──
    // Massive Pauldron Armor Blocks
    part('ShoulderBlockL', 'LeftShoulder', box(0.18, 0.16, 0.22), [0.30, 1.62, 0]);
    part('ShoulderBlockR', 'RightShoulder', box(0.18, 0.16, 0.22), [-0.30, 1.62, 0]);
    // Shoulder Outer Vernier Thruster Fins
    part('ShoulderFinL', 'LeftShoulder', box(0.03, 0.12, 0.16), [0.40, 1.62, 0]);
    part('ShoulderFinR', 'RightShoulder', box(0.03, 0.12, 0.16), [-0.40, 1.62, 0]);

    // Biceps
    part('BicepL', 'LeftUpperArm', cyl(0.055, 0.05, 0.20, 12), [0.34, 1.42, 0]);
    part('BicepR', 'RightUpperArm', cyl(0.055, 0.05, 0.20, 12), [-0.34, 1.42, 0]);

    // Elbow Joints
    part('ElbowL', 'LeftForeArm', cyl(0.045, 0.045, 0.08, 16), [0.35, 1.24, 0.01], [0, 0, Math.PI / 2]);
    part('ElbowR', 'RightForeArm', cyl(0.045, 0.045, 0.08, 16), [-0.35, 1.24, 0.01], [0, 0, Math.PI / 2]);

    // Forearm Gauntlets
    part('ForeArmL', 'LeftForeArm', box(0.11, 0.22, 0.12), [0.36, 1.12, 0.02]);
    part('ForeArmR', 'RightForeArm', box(0.11, 0.22, 0.12), [-0.36, 1.12, 0.02]);

    // Hands (Manipulators)
    part('HandL', 'LeftHand', box(0.07, 0.09, 0.08), [0.36, 0.94, 0.04]);
    part('HandR', 'RightHand', box(0.07, 0.09, 0.08), [-0.36, 0.94, 0.04]);

    // ── WEAPON 1: BEAM RIFLE (Equipped in Right Hand) ──
    part('RifleBody', 'RightHand', box(0.06, 0.10, 0.32), [-0.36, 0.94, 0.22]);
    part('RifleScope', 'RightHand', cyl(0.025, 0.025, 0.12, 12), [-0.36, 1.02, 0.18], [Math.PI / 2, 0, 0]);
    part('RifleBarrel', 'RightHand', cyl(0.018, 0.018, 0.30, 12), [-0.36, 0.95, 0.48], [Math.PI / 2, 0, 0]);
    part('RifleMuzzle', 'RightHand', cyl(0.024, 0.028, 0.06, 12), [-0.36, 0.95, 0.64], [Math.PI / 2, 0, 0]);
    part('RifleMag', 'RightHand', box(0.045, 0.14, 0.08), [-0.36, 0.84, 0.16], [0.15, 0, 0]);

    // ── WEAPON 2: ANTI-BEAM SHIELD (Mounted on Left Forearm) ──
    part('ShieldPlate', 'LeftForeArm', box(0.24, 0.54, 0.04), [0.44, 1.12, 0.06], [0, 0.25, 0]);
    part('ShieldSpine', 'LeftForeArm', box(0.06, 0.58, 0.05), [0.44, 1.12, 0.08], [0, 0.25, 0]);
    part('ShieldStar', 'LeftForeArm', box(0.08, 0.08, 0.02), [0.44, 1.24, 0.11], [0, 0.25, Math.PI / 4]);

    // ── WEAPON 3: BEAM SABER BLADE (Mounted on Backpack or Activated) ──
    part('SaberHandleL', 'SaberHiltL', cyl(0.018, 0.018, 0.18, 12), [0.12, 1.76, -0.14], [-0.35, 0, 0.2]);
    part('SaberHandleR', 'SaberHiltR', cyl(0.018, 0.018, 0.18, 12), [-0.12, 1.76, -0.14], [-0.35, 0, -0.2]);

    // Active Beam Saber Blade on Right Hand (Activated during Saber Slash!)
    part('ActiveSaberBlade', 'RightHand', cyl(0.005, 0.016, 0.85, 12), [-0.36, 1.40, 0.12], [0.35, 0, 0]);

    // ── 5. BACKPACK & HIGH-MOBILITY FLIGHT PACK ──
    part('BackpackCore', 'Backpack', box(0.28, 0.28, 0.14), [0, 1.54, -0.16]);
    // Twin Main Rocket Thruster Bells
    part('ThrusterBellL', 'Backpack', cyl(0.06, 0.04, 0.12, 16), [0.09, 1.42, -0.22], [0.4, 0, 0]);
    part('ThrusterBellR', 'Backpack', cyl(0.06, 0.04, 0.12, 16), [-0.09, 1.42, -0.22], [0.4, 0, 0]);
    // Glowing Thruster Flame Cones
    part('ThrusterFlameL', 'Backpack', cyl(0.01, 0.05, 0.16, 12), [0.09, 1.32, -0.26], [0.4, 0, 0]);
    part('ThrusterFlameR', 'Backpack', cyl(0.01, 0.05, 0.16, 12), [-0.09, 1.32, -0.26], [0.4, 0, 0]);

    // ── 6. LEGS & FEET ──
    // Thighs
    part('ThighL', 'LeftUpLeg', box(0.14, 0.38, 0.16), [0.15, 0.86, 0]);
    part('ThighR', 'RightUpLeg', box(0.14, 0.38, 0.16), [-0.15, 0.86, 0]);

    // Knee Armor Guards
    part('KneeGuardL', 'LeftLeg', box(0.12, 0.14, 0.10), [0.16, 0.60, 0.08], [-0.18, 0, 0]);
    part('KneeGuardR', 'RightLeg', box(0.12, 0.14, 0.10), [-0.16, 0.60, 0.08], [-0.18, 0, 0]);

    // Shin & Calf Thrusters
    part('ShinL', 'LeftLeg', box(0.16, 0.38, 0.18), [0.16, 0.36, 0.01]);
    part('ShinR', 'RightLeg', box(0.16, 0.38, 0.18), [-0.16, 0.36, 0.01]);
    // Calf Vernier Thrusters on the back of legs
    part('CalfThrusterL', 'LeftLeg', box(0.10, 0.18, 0.08), [0.16, 0.32, -0.10], [0.25, 0, 0]);
    part('CalfThrusterR', 'RightLeg', box(0.10, 0.18, 0.08), [-0.16, 0.32, -0.10], [0.25, 0, 0]);

    // Ankle Armor Cuffs
    part('AnkleL', 'LeftFoot', box(0.14, 0.10, 0.16), [0.16, 0.14, 0.02]);
    part('AnkleR', 'RightFoot', box(0.14, 0.10, 0.16), [-0.16, 0.14, 0.02]);

    // Combat Articulated Feet (Soles)
    part('FootL', 'LeftFoot', box(0.14, 0.08, 0.28), [0.16, 0.05, 0.06]);
    part('FootR', 'RightFoot', box(0.14, 0.08, 0.28), [-0.16, 0.05, 0.06]);
    // Foot Toe Claw / Tip
    part('ToeL', 'LeftFoot', box(0.12, 0.06, 0.10), [0.16, 0.04, 0.22]);
    part('ToeR', 'RightFoot', box(0.12, 0.06, 0.10), [-0.16, 0.04, 0.22]);
  }

  // Animation Clip Baker
  function bake(name, T, fps, poseAt, solve) {
    const n = Math.round(T * fps), times = [], Q = {}, hipsP = [];
    GUNDAM_RIG.joints.forEach(([j]) => { Q[j] = []; });
    for (let i = 0; i <= n; i++) {
      const t = i / n * T;
      const o = solve(poseAt(t / T, t));
      times.push(t);
      GUNDAM_RIG.joints.forEach(([j]) => { Q[j].push(...o[j].q.toArray()); });
      hipsP.push(...o.Hips.p.toArray());
    }
    return new THREE.AnimationClip(name, T, [
      new THREE.VectorKeyframeTrack('Hips.position', times, hipsP),
      ...GUNDAM_RIG.joints.map(([j]) => new THREE.QuaternionKeyframeTrack(j + '.quaternion', times, Q[j]))
    ]);
  }

  return { skeleton, body, bake, R0 };
})();

// ── GUNDAM MOTION CONTROLLER & SOLVER ──
const gundamA = (() => {
  let root, J, walkPhase = 0;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const Q = () => new THREE.Quaternion();
  const E = (x, y, z) => new THREE.Euler(x, y, z);
  const sm = THREE.MathUtils.smoothstep;
  const lerp = THREE.MathUtils.lerp;
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const env = (t, a, b, c, d) => (t < a ? 0 : t < b ? ease((t - a) / (b - a)) : t < c ? 1 : t < d ? 1 - ease((t - c) / (d - c)) : 0);

  function solve(pose) {
    const out = {};
    GUNDAM_RIG.joints.forEach(([n]) => {
      out[n] = {
        q: Q().setFromEuler(E(
          pose[n] && pose[n].rot ? pose[n].rot[0] : 0,
          pose[n] && pose[n].rot ? pose[n].rot[1] : 0,
          pose[n] && pose[n].rot ? pose[n].rot[2] : 0
        )),
        p: pose[n] && pose[n].pos ? V3(...pose[n].pos) : GUNDAM.R0[n].pos.clone()
      };
    });
    return out;
  }

  function build() {
    const s = GUNDAM.skeleton();
    root = s.root;
    J = s.J;
    GUNDAM.body(J);

    // Initial state: hide active saber blade until slashing
    const activeBlade = root.getObjectByName('ActiveSaberBlade');
    if (activeBlade) activeBlade.visible = false;

    // ── BAKE KEYFRAME ANIMATION CLIPS ──
    const clips = [];

    // 1. IDLE CLIP (Gentle combat standby breathing)
    clips.push(GUNDAM.bake('Idle', 2.0, 24, (u) => {
      const breath = Math.sin(u * Math.PI * 2) * 0.015;
      return {
        Hips: { pos: [0, 1.15 + breath, 0], rot: [0.03, 0, 0] },
        Chest: { rot: [breath * 2, 0, 0] },
        Head: { rot: [-0.04, 0, 0] },
        LeftUpperArm: { rot: [0.1, 0, 0.15] },
        RightUpperArm: { rot: [-0.15, 0, -0.15] },
        RightForeArm: { rot: [0.35, 0, 0] },
        LeftForeArm: { rot: [0.25, 0, 0] }
      };
    }, solve));

    // 2. JUMP CLIP (High-altitude vernier boost leap)
    clips.push(GUNDAM.bake('Jump', 1.2, 24, (u) => {
      const arc = Math.sin(u * Math.PI);
      return {
        Hips: { pos: [0, 1.15 + arc * 0.6, arc * 0.2], rot: [0.25 * arc, 0, 0] },
        LeftUpLeg: { rot: [-0.4 * arc, 0, -0.1 * arc] },
        LeftLeg: { rot: [0.7 * arc, 0, 0] },
        RightUpLeg: { rot: [-0.2 * arc, 0, 0.1 * arc] },
        RightLeg: { rot: [0.5 * arc, 0, 0] },
        LeftUpperArm: { rot: [-0.3 * arc, 0, 0.4 * arc] },
        RightUpperArm: { rot: [-0.5 * arc, 0, -0.3 * arc] },
        RightForeArm: { rot: [0.6 * arc, 0, 0] }
      };
    }, solve));

    // 3. MOVE 1: BEAM RIFLE SNIPE
    clips.push(GUNDAM.bake('BeamRifle', 1.4, 24, (u) => {
      const aim = env(u, 0, 0.25, 0.70, 1.0);
      const recoil = u > 0.35 && u < 0.55 ? Math.sin((u - 0.35) / 0.2 * Math.PI) : 0;
      return {
        Hips: { rot: [0, -0.2 * aim, 0] },
        Chest: { rot: [0, 0.25 * aim, 0] },
        Head: { rot: [0, -0.1 * aim, 0] },
        RightShoulder: { rot: [0, 0.3 * aim, 0] },
        RightUpperArm: { rot: [-1.45 * aim - recoil * 0.3, 0.2 * aim, -0.1 * aim] },
        RightForeArm: { rot: [0.1 * aim, 0, 0] },
        LeftUpperArm: { rot: [-0.4 * aim, 0, 0.5 * aim] },
        LeftForeArm: { rot: [0.8 * aim, 0, 0] }
      };
    }, solve));

    // 4. MOVE 2: BEAM SABER SLASH
    clips.push(GUNDAM.bake('SaberSlash', 1.6, 24, (u) => {
      const slash = env(u, 0, 0.25, 0.75, 1.0);
      const sweep = Math.sin(Math.min(1, Math.max(0, (u - 0.25) / 0.5)) * Math.PI);
      return {
        Hips: { pos: [0, 1.15, 0.1 * sweep], rot: [0.1 * sweep, 0.4 * sweep - 0.2, 0] },
        Chest: { rot: [0.1 * sweep, -0.6 * sweep + 0.3, 0] },
        RightUpperArm: { rot: [-1.6 * slash + sweep * 0.8, -0.8 * sweep, -0.5 * slash] },
        RightForeArm: { rot: [0.5 * slash + sweep * 0.4, 0, 0] },
        LeftUpperArm: { rot: [0.2 * slash, 0, 0.4 * slash] },
        LeftForeArm: { rot: [0.6 * slash, 0, 0] }
      };
    }, solve));

    // 5. MOVE 3: VERNIER HIGH-SPEED DASH
    clips.push(GUNDAM.bake('VernierBoost', 1.5, 24, (u) => {
      const dash = env(u, 0, 0.2, 0.8, 1.0);
      return {
        Hips: { pos: [0, 1.05 * dash + 1.15 * (1 - dash), 0.4 * dash], rot: [0.45 * dash, 0, 0] },
        Chest: { rot: [0.15 * dash, 0, 0] },
        Head: { rot: [-0.45 * dash, 0, 0] },
        LeftUpLeg: { rot: [-0.3 * dash, 0, 0] },
        RightUpLeg: { rot: [0.4 * dash, 0, 0] },
        LeftLeg: { rot: [0.5 * dash, 0, 0] },
        RightLeg: { rot: [0.7 * dash, 0, 0] },
        LeftUpperArm: { rot: [0.4 * dash, 0, 0.3 * dash] },
        RightUpperArm: { rot: [0.4 * dash, 0, -0.3 * dash] }
      };
    }, solve));

    // 6. MOVE 4: SHIELD GUARD DEFENSE
    clips.push(GUNDAM.bake('ShieldGuard', 1.8, 24, (u) => {
      const guard = env(u, 0, 0.25, 0.75, 1.0);
      return {
        Hips: { pos: [0, 1.10 * guard + 1.15 * (1 - guard), 0], rot: [0.08 * guard, -0.35 * guard, 0] },
        Chest: { rot: [0, 0.4 * guard, 0] },
        LeftUpperArm: { rot: [-0.85 * guard, 0.3 * guard, 0.8 * guard] },
        LeftForeArm: { rot: [1.2 * guard, 0, 0] },
        RightUpperArm: { rot: [-0.3 * guard, 0, -0.2 * guard] },
        RightForeArm: { rot: [0.6 * guard, 0, 0] },
        LeftUpLeg: { rot: [-0.2 * guard, 0, -0.1 * guard] },
        RightUpLeg: { rot: [0.25 * guard, 0, 0.1 * guard] }
      };
    }, solve));

    // 7. MOVE 5: VICTORY POSE
    clips.push(GUNDAM.bake('VictoryPose', 2.0, 24, (u) => {
      const pose = env(u, 0, 0.3, 0.7, 1.0);
      return {
        Hips: { rot: [-0.05 * pose, 0, 0] },
        Chest: { rot: [-0.1 * pose, 0, 0] },
        Head: { rot: [-0.15 * pose, 0, 0] },
        RightUpperArm: { rot: [-2.4 * pose, 0, -0.2 * pose] },
        RightForeArm: { rot: [0.1 * pose, 0, 0] },
        LeftUpperArm: { rot: [0.1 * pose, 0, 0.3 * pose] },
        LeftForeArm: { rot: [0.4 * pose, 0, 0] }
      };
    }, solve));

    return { root, clips };
  }

  // ── FRAME TICK: LIVE 2-LEGGED GAIT & DYNAMICS ──
  function tick(st, now, dt, M) {
    if (!root || !J) return;
    const w = 1 - st.eW; // weight of natural procedural movement vs clip actions
    if (w <= 0.001) return;

    const moving = Math.min(1, st.v / 0.3);
    const run = Math.min(1, Math.max(0, (st.v - 1.2) / 2.0)); // 0 = walk, 1 = run sprint
    const strideFreq = lerp(1.6, 3.2, run);
    const strideAngle = lerp(0.35, 0.75, run);
    const armSwing = lerp(0.35, 0.65, run);
    const kneeBend = lerp(0.55, 0.95, run);

    walkPhase = (walkPhase + dt * st.v * strideFreq) % (Math.PI * 2);

    // Leg angles
    const leftHipPitch = Math.sin(walkPhase) * strideAngle * moving;
    const rightHipPitch = -Math.sin(walkPhase) * strideAngle * moving;

    // Knees bend when swinging backward/lifting
    const leftKnee = Math.max(0, -Math.sin(walkPhase)) * kneeBend * moving;
    const rightKnee = Math.max(0, Math.sin(walkPhase)) * kneeBend * moving;

    // Arms counter-swing
    const leftArmPitch = -Math.sin(walkPhase) * armSwing * moving;
    const rightArmPitch = Math.sin(walkPhase) * (armSwing * 0.6) * moving; // rifle hand swings slightly less

    // Vertical bobbing
    const bob = Math.abs(Math.sin(walkPhase * 2)) * lerp(0.02, 0.05, run) * moving;
    const sway = Math.sin(walkPhase) * lerp(0.015, 0.035, run) * moving;

    // Apply procedural walk to joints with slerp weight w
    const curHipsQ = J.Hips.quaternion.clone();
    const targetHipsQ = Q().setFromEuler(E(lerp(0.04, 0.18, run) * moving, 0, sway));
    J.Hips.quaternion.copy(curHipsQ.slerp(targetHipsQ, w * 0.7));
    J.Hips.position.y = 1.15 - bob;

    const targetLLegQ = Q().setFromEuler(E(leftHipPitch, 0, 0));
    J.LeftUpLeg.quaternion.slerp(targetLLegQ, w);
    const targetLKneeQ = Q().setFromEuler(E(leftKnee, 0, 0));
    J.LeftLeg.quaternion.slerp(targetLKneeQ, w);

    const targetRLegQ = Q().setFromEuler(E(rightHipPitch, 0, 0));
    J.RightUpLeg.quaternion.slerp(targetRLegQ, w);
    const targetRKneeQ = Q().setFromEuler(E(rightKnee, 0, 0));
    J.RightLeg.quaternion.slerp(targetRKneeQ, w);

    // Upper body counter rotation
    const targetChestQ = Q().setFromEuler(E(-0.04 * moving, -sway * 1.5, 0));
    J.Chest.quaternion.slerp(targetChestQ, w);

    const targetLArmQ = Q().setFromEuler(E(leftArmPitch + 0.1, 0, 0.15));
    J.LeftUpperArm.quaternion.slerp(targetLArmQ, w);

    const targetRArmQ = Q().setFromEuler(E(rightArmPitch - 0.2, 0, -0.15));
    J.RightUpperArm.quaternion.slerp(targetRArmQ, w);

    // Active Saber Blade visibility toggle during SaberSlash move
    const activeBlade = root.getObjectByName('ActiveSaberBlade');
    if (activeBlade) {
      const isSlashing = M && M.actions && M.actions.some(a => a.getClip().name === 'SaberSlash' && a.isRunning());
      activeBlade.visible = isSlashing;
    }
  }

  return { build, tick };
})();

// ── LIGHTS & HALO SELECTION ──
const GUNDAM_LIGHTS = [
  // 1. Visor / Dual Optical Eyes (Cyan / Green laser visor)
  { pick: t => /EyeVisor·iso$/i.test(t.twin.name), halo: 0.65, spot: { ahead: 1.4 } },
  // 2. Head Forehead Jewel & V-Fin crest
  { pick: t => /HeadJewel·iso$/i.test(t.twin.name), halo: 0.4 },
  // 3. Chest Reactor Core (High-output Minovsky ultracompact fusion reactor)
  { pick: t => /ChestReactor·iso$/i.test(t.twin.name), halo: 0.55, point: { intensity: 2.2, distance: 2.5 } },
  // 4. Beam Rifle Muzzle Flash (Flashes upon firing!)
  { pick: t => /RifleMuzzle·iso$/i.test(t.twin.name), halo: 0.85, flashOn: { clip: /^BeamRifle$/, at: 0.35 } },
  // 5. Active Beam Saber Blade (Glows while active)
  { pick: t => /ActiveSaberBlade·iso$/i.test(t.twin.name), halo: 0.8, point: { intensity: 3.0, distance: 3.5 } },
  // 6. Backpack Main Flight Thrusters (Flare up when boosting / running)
  { pick: t => /ThrusterFlame[LR]·iso$/i.test(t.twin.name), halo: 0.6, level: (st) => (st.v > 1.2 ? 2.5 : 1.0) }
];

// ── BOT FIGURE REGISTRATION ──
botFig({
  id: 'gundam',
  name: 'Gundam Striker',
  badge: '<b>AUDIRA-01</b> · Mobile Suit Mecha',
  build: gundamA.build,
  tick: gundamA.tick,
  targetY: 1.25,
  dist: 8.2,
  size: 2.4,
  speeds: { walk: 1.5, run: 4.5 },
  feet: /^(Left|Right)Foot$/,
  clips: { idle: 'Idle', jump: 'Jump' },
  lights: GUNDAM_LIGHTS,
  moves: [
    ['Beam Rifle Snipe', '1', 'BeamRifle', {}, 'firing beam rifle'],
    ['Beam Saber Slash', '2', 'SaberSlash', {}, 'slashing beam saber'],
    ['Vernier Dash', '3', 'VernierBoost', {}, 'vernier dash'],
    ['Shield Guard', '4', 'ShieldGuard', { hold: true }, 'shield guard stance'],
    ['Victory Salute', '5', 'VictoryPose', {}, 'victory salute']
  ],
  jumpLabel: 'Vernier Jump',
  click: 'BeamRifle',
  clickLabel: 'fire beam rifle',
  info: '<h2>AUDIRA-01 Gundam Striker</h2><p>High-mobility bipedal mecha mobile suit engineered with Skill 1 (Playable). Powered by procedural 2-legged IK inverse kinematics gait, angular armor plating, high-energy Beam Rifle, anti-beam shield, plasma beam saber, and twin vernier flight pack.</p><p style="opacity:.7;margin-top:6px">Controls: WASD to walk · Shift to supersonic vernier run · Space to jump · L to toggle reactor & eye headlights · 1-5 for tactical combat maneuvers.</p>'
});
