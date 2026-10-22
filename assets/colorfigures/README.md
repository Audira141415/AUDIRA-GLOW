# Colorfigures · Hand-Inked Isometric Mechanics Engine

A collection of **26 hand-inked, interactive isometric figures** built with native SVG, pure ES6+, and Web Audio. Originally created by April Zhu and fully adopted into the **AUDIRA GLOW** ecosystem.

## 🌟 The 26 Playable Figures

| No. | Figure ID | Name | Category | Interactive Mechanics & Features |
| :---: | :--- | :--- | :--- | :--- |
| **01** | `washer` | **Washing Machine** | Appliances | Door latch, rotating drum, cycle selector, water slosh & spin cycle |
| **02** | `espresso` | **Espresso Machine** | Kitchen | Portafilter locking torque, steam wand purge, 9-bar pressure dial gauge, espresso drip |
| **03** | `vending` | **Vending Machine** | Games & Toys | Matrix keypad item codes, coin slot acceptor, delivery flap, drop chute physics |
| **04** | `toaster` | **Toaster** | Kitchen | Dual bread slots, pushdown carriage lever, browning potentiometer, pop-up release |
| **05** | `microwave` | **Microwave Oven** | Kitchen | Motorized turntable rotation, door latch, digital LED countdown, food cooking |
| **06** | `sharpener` | **Pencil Sharpener** | Everyday | Geared hand crank handle, shavings drawer, pencil insertion, core sharpening |
| **07** | `windup` | **Wind-Up Toy** | Games & Toys | Winding key spring tension, escapement ratchet, bipedal mechanical clockwork walk |
| **08** | `crossing` | **Traffic Light** | Everyday | Crosswalk push-button, 3-state vehicular traffic signals, pedestrian walk countdown |
| **09** | `smokealarm` | **Smoke Alarm** | Appliances | Piezoelectric test button, 9V battery drawer, intermittent strobe LED, alarm siren |
| **10** | `fridge` | **Refrigerator** | Kitchen | Magnetic double doors, automatic door light trigger, crisper drawers, freezer shelves |
| **11** | `cistern` | **Toilet Flush** | Everyday | Dual-flush lever, rubber flapper valve, siphonic whirlpool, float ball valve refill |
| **12** | `gashapon` | **Capsule Toy Machine** | Games & Toys | 100-yen coin slot, rotary turn dial, tumbling capsule dispenser & unboxing |
| **13** | `foodtruck` | **Food Truck** | Everyday | Fold-down serving counter, overhead awning, kitchen stove & exhaust stack |
| **14** | `pourover` | **Pour-Over Coffee** | Kitchen | Gooseneck kettle with spiral water stream, paper cone bloom, glass drip carafe |
| **15** | `lamp` | **Desk Lamp** | Everyday | Articulated scissor counterweight arm, adjustable shade angle, toggle push switch |
| **16** | `ekettle` | **Electric Kettle** | Kitchen | 360° cordless heating base, bimetallic auto-shutoff steam sensor, boil bubbles |
| **17** | `fan` | **Desk Fan** | Appliances | 3-speed push buttons (1/2/3), oscillation clutch pin, wire safety cage, spinning blades |
| **18** | `claw` | **Arcade Claw Machine** | Games & Toys | **Playable!** Arrow keys steer X/Y gantry crane, Space drops claw to grab prizes |
| **19** | `vacuum` | **Vacuum Cleaner** | Appliances | Cyclone separation chamber, foot pedal power switch, spring-loaded cord retraction reel |
| **20** | `blender` | **Countertop Blender** | Kitchen | High-torque motor base, 4-blade vortex fluid simulation, pulse switch, speed dial |
| **21** | `booth` | **Toilet Booth** | Everyday | Privacy slide latch with Vacant/Engaged disc, toilet roll dispenser, sanitary stall |
| **22** | `gumball` | **Gumball Machine** | Games & Toys | Coin turn handle, spherical glass globe, multi-turn spiral gravity race track |
| **23** | `recordplayer` | **Vinyl Record Player** | Audio & Music | Motorized vinyl platter, 33/45 RPM speed selector, tonearm cueing lift & needle drop |
| **24** | `musicbox` | **Cylinder Music Box** | Audio & Music | Winding key, revolving studded brass cylinder, tuned steel comb resonant chime |
| **25** | `photobooth` | **Vintage Photo Booth** | Games & Toys | Privacy curtain, coin slot trigger, 4 timed xenon strobe flashes, 4-shot photo strip print |
| **26** | `arcade` | **Retro Arcade Cabinet** | Games & Toys | **Playable!** 8-way microswitch joystick, dual fire buttons, CRT scanlines & mini-game |

---

## 🎨 Architectural Innovations Adopted

### 1. Free Orthographic 3D Camera & Turntable
Unlike fixed 2D isometric layouts, Colorfigures features a free camera system:
- **Basis Vectors**: `CAM_R`, `CAM_U`, `CAM_V`, `CAM_D` calculated dynamically from `YAW` and `PITCH`.
- **Mouse Drag Orbiting**: Click and drag anywhere across the figure stage to smoothly inspect in 3D (`#fig.drag`).
- **Turntable Mode**: Auto-rotates around the vertical axis at 60 FPS.
- **Double-Click Reset**: Snaps back to standard true isometric angle ($35.26^\circ$ pitch, $45^\circ$ yaw).

### 2. Hand-Drawn Wobble Shader (`#hand`)
Creates authentic organic ink drafting texture over pure vector shapes:
```xml
<filter id="hand" filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise"/>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```
- Real-time wobble slider (`0.0` to `7.0`) allows dialing from razor-sharp CAD vectors to loose sketchbook inking.

### 3. Dynamic Sun Lighting & Hermite 3-Tone Shading
- 3 distinct tone levels (`light`, `mid`, `dark`) with smooth cubic Hermite transition (`step3()`) to prevent banding while objects turn.
- Real-time projected cast shadows (`castShadow(pts3, z0, clip)`) pushed along the sun azimuth angle onto boards or floors.

### 4. Interactive Annotation Badges (`tag(...)`)
- Leader lines connect 3D vertices to floating cream pill badges.
- Automatically highlight in accent color when that specific component is actively working.
- Adapts to numbered badges on compact mobile viewports.
