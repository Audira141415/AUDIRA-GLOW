// the three robots (Quaternius, CC0): their clips, how they move, what lights up, and their moves
const Q = 'Model: Quaternius, CC0. Restyled.';
botFig({ id: 'leela', name: 'Leela', el: 'glb-leela', size: 1.8, targetY: 0.8,
  clips: { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump' }, feet: /^Foot[LR]$/,
  // the round eye on the front of the head (its own piece on the Head bone, not the head shell)
  lights: [{ pick: t => t.island.bone === 'Head' && t.island.rank > 0 && t.island.tris < 400, halo: 0.5, spot: { ahead: 0.75 } }],
  moves: [['Wave', '1', 'Hello', {}, 'waving'], ['Shoot', '2', 'Shoot', {}, 'shooting'], ['Punch', '3', 'Punch', {}, 'punching'], ['Kick', '4', 'Kick', {}, 'kicking'],
          ['Sword slash', '5', 'SwordSlash', {}, 'slashing'], ['Dance', '6', 'Dance', { loop: true }, 'dancing'], ['Yes', '7', 'Yes', {}, 'nodding'], ['No', '8', 'No', {}, 'shaking head'],
          ['Pick up', '9', 'Pickup', {}, 'picking up'], ['Fall / get up', '0', 'Death', { hold: true }, 'down']],
  click: 'Hello', clickLabel: 'wave',
  info: '<h2>Leela</h2><p>An armoured mech driven by its own animation clips. Walk and run blend as it speeds up, at exactly the pace its stride steps, so the feet stay planted. WASD or the arrows walk (relative to the camera), shift runs, and the camera follows. Press L for its lights: the eye lights up, a light in its head lights the floor ahead, and every footstep lights its square.</p><p style="opacity:.7;margin-top:6px">' + Q + '</p>' });

botFig({ id: 'quad', name: 'Quad shell', el: 'glb-quad', size: 1.7, targetY: 0.45,
  clips: { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Attack' }, jumpLabel: 'Fire', jumpWord: 'firing', feet: /_Leg_IK[LR]$/,
  lights: [
    { pick: t => t.island.bone === 'Body' && t.island.tris <= 16, halo: 0.25, spot: { ahead: 0.65 } },               // the two sensor blocks by the guns
    { pick: t => /^Gun[LR]$/.test(t.island.bone) && t.c.z > 0.85, halo: 0.45, flashOn: { clip: /^(Attack|Charge)$/, at: 0.06 } },   // muzzles: flash on fire
  ],
  moves: [['Charge', '1', 'Charge', {}, 'charging'], ['Look around', '2', 'Look', {}, 'looking around'],
          ['Take a hit', '3', 'Hit', {}, 'hit'], ['Power down / up', '4', 'TurnOff', { hold: true }, 'powered down']],
  click: 'Attack', clickLabel: 'fire',
  info: '<h2>Quad shell</h2><p>A four-legged walker with twin guns. Its stride sets its speed, so the feet stay planted. WASD walks it, shift runs, space fires. Press L for its lights: the sensors light up and light the floor ahead, footsteps light their squares, and the muzzles flash when it fires.</p><p style="opacity:.7;margin-top:6px">' + Q + '</p>' });

botFig({ id: 'drone', name: 'Eye drone', el: 'glb-drone', size: 1.0, targetY: 1.0, hover: { height: 0.75 }, speeds: { walk: 1.6, run: 3.4 },
  clips: { idle: 'Idle', jump: 'BackFlip' }, jumpLabel: 'Back flip', jumpWord: 'flipping',
  // the lens: front-facing faces in the middle of the shell, behind the eyelids
  lights: [{ pick: t => t.island.rank === 0 && Math.abs(t.c.x) < 0.3 && Math.abs(t.c.y) < 0.3 && t.c.z > 0.55, halo: 0.6, spot: { ahead: 0.9 },
             level: (st, S) => S === 'Charging' ? 2 : S === 'Attack' ? 1.6 : 1 }],
  moves: [['Look around', '1', 'Look', {}, 'looking around'], ['Charge up', '2', 'Charging', { loop: true }, 'charging'], ['Lunge', '3', 'Attack', {}, 'lunging'], ['Take a hit', '4', 'Hit', {}, 'hit']],
  click: 'Look', clickLabel: 'look around',
  info: '<h2>Eye drone</h2><p>A hovering drone with one big eye. It leans into its speed and banks into turns; WASD flies it, shift boosts, space does a back flip. Press L for its lights: the eye lights up and lights the floor ahead, and charging it up turns the eye brighter.</p><p style="opacity:.7;margin-top:6px">' + Q + '</p>' });
