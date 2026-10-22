---
name: audira-3d-digital-twin
description: >-
  Inspect, debug, and validate the Three.js 3D Virtual Twin environment, avatar biomechanics, 10 Golden Rules compliance, A* door waypoints, obstacle collision prevention, and tactical emergency alarm behaviors. Use when working on agent-world, 3D avatars, pathfinding, or office builder modules.
---

# AUDIRA DCOS 3D Digital Twin & Avatar Simulation Skill

This skill provides procedures for inspecting, developing, and auditing the Three.js 3D Virtual Office and Autonomous Specialist Avatar simulation located in `datacenter-dashboard/lib/agent-world/`.

## Core Engine Modules Reference

- `three-scene-manager.ts`: Scene lifecycle, WebGL rendering loop, camera raycasting, physics repulsion loop ($r \ge 0.70\text{ m}$), automatic proximity doors, and Physical Proximity Gatekeeper ($d \le 0.40\text{ m}$).
- `three-office-builder.ts`: Office architectural geometry, glass acoustic partitions, sliding doors with infrared sensors, workstations, Quantum Airlock gate, and White Space data hall.
- `three-avatar.ts`: Avatar 3D meshes (Gundam Titan & Procedural Gunpla), articulated manipulator hands (5 fingers), dynamic dual monitors, LED keyboards, and kinematic posture updates.
- `pathfinding.ts`: A* navigation grid, line-of-sight checks, solid obstacle avoidance, and mandatory room door waypoints (`ROOM_DOOR_WAYPOINTS`).
- `agent-engine.ts`: Agent state machine (`IDLE`, `WORKING`, `PATROLLING`, `COLLABORATING`, `SPRINTING`), continuous walking transit logic, and anti-stuck re-pathfinding.

---

## 10 Golden Rules Quality Assurance Checklist

When modifying or reviewing 3D code, verify all 10 Golden Rules:

| Rule # | Requirement | Implementation Point | Verification Method |
| :--- | :--- | :--- | :--- |
| **Rule 1** | Mandatory Door Passage | `pathfinding.ts` (`ROOM_DOOR_WAYPOINTS`) | Verify route traverses door inner/outer points when switching rooms. |
| **Rule 2** | Automatic Proximity Doors | `three-scene-manager.ts` (`updateDoors`) | Confirm doors slide open at distance $\le 2.8\text{ m}$ and LEDs turn emerald (`#10b981`). |
| **Rule 3** | Zero Physical & Visual Collision | `three-scene-manager.ts` (`SOLID_OBSTACLES_3D`) | Check avatar separation repulsion ($r \ge 0.70\text{ m}$) and obstacle clamping. |
| **Rule 4** | Symmetric Dialogue Posture | `three-avatar.ts` & `agent-engine.ts` | Confirm both agents stand OR both sit, facing each other eye-to-eye during collaboration. |
| **Rule 5** | Anti-Stuck & Non-Teleportation | `agent-engine.ts` | Detect $\Delta d < 0.05\text{ m}$ over 1.5s, trigger re-pathfinding or gentle nudge without teleporting. |
| **Rule 6** | Continuous Physical Walk Transit | `agent-engine.ts` & `three-scene-manager.ts` | Prohibit instant disappearing/reappearing; require $d \le 0.40\text{ m}$ before sitting. |
| **Rule 7** | Natural Parallel Stride (No Ngangkang) | `three-avatar.ts` | Check lateral step width $x = \pm 0.11\text{ m}$, thigh gap $6-8\text{ cm}$, toe angle $0^\circ-3^\circ$. |
| **Rule 8** | Brisk Walk vs Emergency Sprint | `three-avatar.ts` | Walk cadence $\sim 2.05\text{ rad/s}$ ($0.88\times$ speed); sprint cadence $\sim 3.8\text{ rad/s}$ ($1.50\times$), lean $0.20\text{ rad}$. |
| **Rule 9** | Desk-Facing Seated Alignment | `three-scene-manager.ts` & `three-avatar.ts` | North Pod $\text{rot.y} = 0$, South Pod $\text{rot.y} = \pi$; Z offset $+0.08\text{ m}$; shield auto-stowed. |
| **Rule 10**| Articulated Manipulator Hands | `three-avatar.ts` | 5 segmented fingers, dorsal knuckle plate, keyboard flutter and mouse glide animation. |

---

## Validation & Debugging Procedures

1. **Verify Scene Type Safety**:
   ```bash
   cd f:\AUDIRA-DCOS\datacenter-dashboard
   npx tsc --noEmit
   ```
2. **Launch Dev Environment & Inspect 3D Canvas**:
   ```bash
   npm run dev
   # Open browser at http://localhost:3214/agent-world
   ```
3. **Trigger Emergency Alarm in Testbed**:
   - Navigate to `/device-integrations`.
   - Send simulated threshold breach payload.
   - Observe in `/agent-world`: 3D holographic alarm beacon, dual-tone klaxon siren, and autonomous specialist sprint response.
