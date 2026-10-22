---
name: playable
description: Turn a rigged 3D model (.glb / .gltf / .fbx / .blend — robots, mechs, drones, creatures, vehicles) or a sketch / drawing / photo of a robot into a playable character in the browser — one self-contained HTML page (three.js) with third-person game controls (WASD relative to the camera, shift to run, follow camera), the model's own animation clips blended by gait, one-key moves, tap-to-walk and a phone button bar, drawn in the iso-glow hairline style with lights (eyes, lamps, footprints, muzzle flashes). For a sketch it builds the robot from solid parts on joints and authors its animations. Use whenever someone wants to play with, drive, control, walk around or animate a 3D model or character in the browser, make a .glb "playable" or "controllable", rig or bring to life a robot from a drawing, or build a small character playground — even if they don't say "playable".
---

# Playable

Two ways in, one result: a robot you drive in the browser.

1. **A rigged model** (.glb with bones and clips, or a .blend / .fbx you convert): the page keeps its node tree, plays its own clips, blends idle → walk → run by speed, and moves it across the floor exactly as fast as its feet step.
2. **A sketch or image of a robot**: you build it from solid parts on a skeleton you design, and generate its motion: a gait computed live (legs that plant and lift, a springy tail, a level head) plus moves posed through the same solver and baked to clips. The same controller drives it.

Either way the result is one HTML file that opens from disk (three.js from jsDelivr through the template's import map; models embedded as base64).

## Files

- `assets/template.html` — the page shell (the iso-glow 3D template: renderer, hairline materials, themes, accent picker, tabs, panels, readout), with the header set to **Playable**. Never edit it per robot.
- `assets/anim.js` — loads and styles a model (`isoGlb`) or a code-built robot (`isoBuilt`): body material, silhouette shell, crease hairlines, contact lines, fit.
- `assets/bots.js` — the controller: `botFig(config)` adds one drivable robot as a tab.
- `assets/examples/bots-config.js` — three loaded robots (a biped mech, a four-legged walker, a hover drone).
- `assets/examples/catbot.js` — a robot cat built from a sketch: its skeleton as data, the body on it, a live four-legged gait with two-joint IK, moves baked from poses, and its config.
- `scripts/build.py` — assembles the page: `python3 scripts/build.py out.html my-robots.js --glb leela=Leela.glb`.
- `scripts/inspect_rig.py`, `scripts/to_glb.py` — Blender (headless) helpers: inspect a rig, convert to .glb with every action as a clip.

## Workflow A — a rigged model

1. **Inspect it** (Blender headless): `blender -b -P scripts/inspect_rig.py -- model.glb`. It prints meshes, triangles, bones, clip names, and how *solid* the skinning is (share of vertices fully on one bone).
   - 90–100 % solid (robots, mechs, machines): exact — every part keeps clean hairlines while it moves.
   - Parts parented to bones with no skin at all: exact.
   - Soft, smoothly weighted skin (people, animals, cloth): the outline still bends with the body, but crease hairlines ride the nearest bone and drift a little across bends. Say so before building.
2. **Convert** if it isn't a .glb: `blender -b -P scripts/to_glb.py -- in.blend out.glb` (keeps the node tree and every action; drops materials — the page replaces them anyway).
3. **Find its parts** for the config: which clips are idle / walk / run / jump; which bones are the **feet** (the bones that touch the ground — on IK rigs that is often the IK target, e.g. `Front_Leg_IKL`, not the last leg bone); which triangles should **light** (an eye disc, a lens, sensor blocks, gun muzzles). Load the page once and list each mesh's separate islands with their bone, size and centre (see "Finding the lit parts").
4. **Write the config** (one `botFig` call, below) and **build**: `python3 scripts/build.py robots.html robots.js --glb id=model.glb`.
5. **Verify** (below) and fix.

## Workflow B — a sketch or image

Read the drawing first and write down: the silhouette, each part and its shape, which parts move against which (that is the joint tree), what lights up (eyes, buttons, lamps), how it moves (legs, wheels, hover, tracks), and what its personality suggests for moves. Hidden sides are your call; say what you assumed.

Then build it like `examples/catbot.js`:

- **The skeleton as data**: `[joint, parent, rest position]` rows, a joint wherever the drawing bends (the cat: hips, spine, chest, neck, head, two ears, four three-joint legs ending in paws, a seven-part tail; 30 joints). Name joints the usual way (`LeftUpLeg`, `LeftForeArm`, `Tail3`). Build them as Groups with identity rest rotation.
- **The body on it**: every part is one solid mesh **inside its own holder** on a joint, so contact lines can outline where parts meet (eyes set into a face). Shapes: tapered capsules from `LatheGeometry` for limbs and tails, scaled spheres for shells and paws, `TorusGeometry` for joint rings and bands, `ConeGeometry` for ears, rounded plates from `ExtrudeGeometry` with a small bevel. Drawn details that aren't solids (whiskers, a smile, a flame) are hairlines: `fat()` / `loopL()` with `majorMat`. Metres, facing **+z**, up **+y**.
- **Motion, generated**: a solver turns a pose (body offset and tilt, paw targets, head and tail angles) into joint rotations, with two-joint IK per leg (bend directions from the drawing: elbows back, knees forward). Live, in `tick`: each leg runs its own phase (walk: one leg at a time; gallop: hind pair then front pair), a planted paw slides back exactly as fast as the body moves (so it never skates), the swing lifts in an arc, the body bobs, the head stays level, the tail is a chain of springs. Blend this under any playing move by `1 − st.eW`.
- **Moves**: pose functions over time (sit, stretch, pounce, jump, lie down, tail swish) run through the same solver and baked to `THREE.AnimationClip`s, so the controller plays them like a model's own clips. Hovering or wheeled robots skip the gait and just author clips (keyframes on joint names; full turns need a key every 45°).
- Hand it over: `botFig({ id, name, build, tick, badge, ... })` — no glb. `badge` shows one highlighted line while its tab is open.

Keep it recognisable rather than literal: silhouette, proportions and the two or three features people remember. Pencil curves become cleaner, slightly faceted machined parts; that's the style.

## The config

```js
botFig({ id: 'leela', name: 'Leela',
  el: 'glb-leela',            // the embedded model (build.py --glb leela=…) — or build: myBot for a code-built robot
  size: 1.8,                  // longest side of the rest pose, metres
  targetY: 0.8,               // camera aim height;  dist: camera distance (default 9.8)
  clips: { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump', walkJump: null },
  feet: /^Foot[LR]$/,         // ground speed = how fast a planted foot slides back; also lights the footprint cells
  speeds: { walk, run },      // only when there are no feet (hover, wheels): metres per second
  hover: { height: 0.75 },    // floats: leans into speed, banks into turns, shadow stays on the floor
  lights: [                   // triangles that light up in the accent; each group:
    { pick: t => t.island.bone === 'Head' && t.island.rank > 0, halo: 0.5, spot: { ahead: 0.75 } },   // spot: a real light aimed at the floor ahead (one per robot)
    { pick: t => /^Gun/.test(t.island.bone) && t.c.z > 0.85, halo: 0.45, flashOn: { clip: /^Attack$/, at: 0.06 } },   // fires with a move
    { pick: t => t.twin.name === 'NozzleRim·iso', point: { intensity: 2.2, distance: 2.2 } },          // a steady light of its own
  ],                          // level: (st, clipName, now) => 0…2 scales a group (blinking buttons, brighter while charging)
  moves: [['Wave', '1', 'Hello', {}, 'waving'], ['Fall / get up', '0', 'Death', { hold: true }, 'down'], ['Dance', '6', 'Dance', { loop: true }, 'dancing']],
  jumpLabel: 'Jump', click: 'Hello', clickLabel: 'wave',
  tick: (st, now, dt, M) => {},   // per-frame extras (a flickering flame)
  info: '<h2>…</h2><p>…</p>' });
```

`pick(t)` sees one triangle: `t.twin` (the styled mesh; name = original + `·iso`), `t.island` (`{ tris, size, centre, bone, rank }` — rank 0 is the largest piece of that mesh), `t.c` (its centre within the island's box, −1…1 per axis, +z = front), `t.n` (face normal).

Controls every robot gets: WASD / arrows relative to the camera, shift run, Q auto walk, L lights, space jump, number keys for moves, click the floor to walk there, click the robot for its `click` move, drag to orbit; on phones a scrolling button bar replaces the panel.

## Finding the lit parts

In the browser console of a first build, list each skinned or rigid twin's islands with their dominant bone, triangle count, size and centre (`window.__anim[id]` exposes `root`, `clips`, `A` (actions) and `st`). Eyes are usually a small round island on the head bone; lenses are front-facing triangles inside a big shell (`|t.c.x|, |t.c.y| < 0.3 && t.c.z > 0.55`); muzzles are the front ends of gun islands (`t.c.z > 0.85`). Render once with the lights on and look.

## Rules (learned the hard way)

- **Never bake transforms or join meshes** for an animated model: clips animate nodes. The loader leaves every animated node alone and draws a styled twin as each mesh's child, rescaled to scene units — the crease finder's tolerances (merge 1e-4, fragments < 6 cm) only work at scene scale, and many rigs store tiny geometry blown up by node scale.
- **Skinned meshes stay skinned** (no cracks): the silhouette shell is a skin- and morph-aware shader extruded along smoothed normals; crease hairlines are pinned to each segment's heaviest bone.
- **Contact lines**: where parts that move together pass into each other (eyes in a face), the visible edge is neither a silhouette nor a crease — they're computed once and drawn as folds. They're computed in the first part's own space; in a tiny parent space the segments fall under the degenerate-length cut.
- **Fit characters to their rest pose**, machines to the box their clips sweep (a character's fall and walk clips would shrink it).
- **Ground speed from planted feet**, never a guess: sample the walk, keep the moments a foot is lowest, take the median of its backward speed. Feet don't skate. Measure with the robot's heading at zero *and its matrices updated*.
- **"All clips at once"** only when clips move different nodes; a character's clips fight over the same bones.
- **Lights are real sources**: eyes, lenses, LEDs, nozzles. A light pool comes from an actual three.js light. No glow on exhausts or flames — a flame is a drawn hairline that flickers. Light theme: the same accent, flat, no halos, no light pools. Patch multi-material meshes for the light theme's flat accent (`accentFill` skips them).
- **Arms and props must read from the iso camera**: a raised arm straight up hides behind a big head — swing it out to the side and a little forward.
- **Code-built robots load after the page's setup** (`isoBuilt` defers one tick) or `setTheme` runs before the template is ready.
- No trademarked characters on public pages (Gundam, Transformers, …): original designs in that spirit are fine.
- Credit the model's author and licence in `info` (CC0 still deserves a credit).

## Verify before handing over

Render deterministic stills (virtual clock, as the iso-glow 3D template's tooling does) or drive the page: no console errors; each robot idles, walks and runs with feet planted; every move plays and returns; holds (fall, power down) get back up; lights in dark (halo, pool, footprints) and light (flat accent, nothing glowing); phone width (bar instead of panel, only the active tab's bar); tab switching. Look at a close-up of the face and hands — that's where outlines go missing.

## Footer credit

The template ends with **Made with ISO-GLOW ↗**. Keep it unless the user asks to remove it.
