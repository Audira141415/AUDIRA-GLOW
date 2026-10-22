/**
 * AUDIRA GLOW · UNIVERSAL SEARCH & NAVIGATION ENGINE
 * Provides instant fuzzy search across all 75+ interactive models and 10 suites,
 * keyboard shortcut handlers (Ctrl+K, /), and unified theme/color sync.
 */
(function() {
  'use strict';

  // --- CATALOG OF ALL 75+ INTERACTIVE FIGURES & SUITES ---
  const CATALOG = [
    // 1. PLAYABLE 3D & MECHA (3 figures / rigs)
    {
      id: 'gundam',
      title: 'AUDIRA-01 Gundam Striker',
      suite: 'Playable 3D',
      category: '3d',
      icon: '🤖',
      url: 'gundam.html',
      badge: 'MECHA 3D',
      desc: '30-joint rigged mecha with Beam Rifle recoil, Saber slash, Vernier dash, Shield guard, and WASD controls.',
      tags: ['gundam', 'striker', 'robot', 'mecha', 'combat', 'beam rifle', 'saber', 'dash', 'wasd', 'playable']
    },
    {
      id: 'catbot',
      title: 'CatBot Four-Legged IK Robot',
      suite: 'Playable 3D',
      category: '3d',
      icon: '🐱',
      url: 'playable.html#catbot',
      badge: 'IK GAIT 3D',
      desc: 'Procedural 2-joint inverse kinematics four-legged feline robot with spring tail lag physics and gait blending.',
      tags: ['cat', 'catbot', 'ik', 'quadruped', 'robot', 'tail', 'pounce', 'procedural', 'playable']
    },
    {
      id: 'playable-hub',
      title: 'Playable 3D Character Playground',
      suite: 'Playable 3D',
      category: '3d',
      icon: '🎮',
      url: 'playable.html',
      badge: 'PLAYGROUND',
      desc: 'Full character controller studio with follow camera, jump, run, spotlight ground projections, and move bar.',
      tags: ['playable', 'playground', 'controller', 'threejs', '3d', 'walk', 'run', 'character']
    },

    // 2. THE SHIPWRIGHT 3D (Procedural Naval Studio)
    {
      id: 'shipwright-bucentaure',
      title: 'The Shipwright · 3D Naval Studio',
      suite: 'The Shipwright 3D',
      category: '3d',
      icon: '⛵',
      url: 'shipwright.html',
      badge: 'PARAMETRIC 3D',
      desc: '18th-century French 80-gun flagship & HMS Victory simulator with dynamic sails, rigging, and 1-click GLB export.',
      tags: ['shipwright', 'ship', 'naval', 'warship', 'bucentaure', 'victory', 'sails', 'rigging', 'guns', 'glb', 'export', '3d']
    },

    // 3. COLORFIGURES (26 Playable Everyday Machines)
    {
      id: 'fig-arcade',
      title: 'Retro Arcade Cabinet',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🕹️',
      url: 'colorfigures.html?fig=arcade',
      badge: 'PLAYABLE GAME',
      desc: 'Playable arcade video game with 8-way joystick, dual fire buttons, CRT curvature, and scanline shader.',
      tags: ['arcade', 'game', 'joystick', 'crt', 'retro', 'cabinet', 'pixel', 'playable']
    },
    {
      id: 'fig-claw',
      title: 'Arcade Claw Machine',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🧸',
      url: 'colorfigures.html?fig=claw',
      badge: 'PLAYABLE GAME',
      desc: 'Controllable prize crane gantry with motorized claw drop, prize grab collision, and chute drop physics.',
      tags: ['claw', 'crane', 'machine', 'prize', 'plush', 'gantry', 'arcade', 'playable']
    },
    {
      id: 'fig-espresso',
      title: 'Espresso Barista Machine',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '☕',
      url: 'colorfigures.html?fig=espresso',
      badge: 'INTERACTIVE',
      desc: 'Manual portafilter lock, dual extraction stream, analog pressure dial gauge, and steam purge.',
      tags: ['espresso', 'coffee', 'barista', 'portafilter', 'steam', 'cafe', 'latte']
    },
    {
      id: 'fig-vending',
      title: 'Automated Vending Machine',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🥤',
      url: 'colorfigures.html?fig=vending',
      badge: 'INTERACTIVE',
      desc: 'Matrix keypad code input, mechanical coil drop chute, coin acceptor slot, and illuminated shelf.',
      tags: ['vending', 'soda', 'snack', 'drink', 'keypad', 'coil', 'drop']
    },
    {
      id: 'fig-recordplayer',
      title: 'Vinyl Turntable Record Player',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🎵',
      url: 'colorfigures.html?fig=recordplayer',
      badge: 'AUDIO',
      desc: 'Motorized revolving platter, 33/45 RPM speed pitch selector, cueing tonearm lift, and vinyl needle.',
      tags: ['record', 'vinyl', 'turntable', 'player', 'lp', 'music', 'tonearm', 'groove']
    },
    {
      id: 'fig-musicbox',
      title: 'Cylinder Mechanical Music Box',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🎼',
      url: 'colorfigures.html?fig=musicbox',
      badge: 'CHIME',
      desc: 'Winding spring key, revolving studded brass barrel, and tuned steel comb acoustic chime synthesis.',
      tags: ['musicbox', 'cylinder', 'clockwork', 'chime', 'melody', 'winding']
    },
    {
      id: 'fig-photobooth',
      title: 'Vintage Photo Booth',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '📸',
      url: 'colorfigures.html?fig=photobooth',
      badge: 'INTERACTIVE',
      desc: 'Privacy curtain, coin slot trigger, 4 timed xenon strobe flashes, and developing photo print ejection.',
      tags: ['photobooth', 'photo', 'camera', 'flash', 'strip', 'portrait']
    },
    {
      id: 'fig-toaster',
      title: 'Pop-Up Kitchen Toaster',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🍞',
      url: 'colorfigures.html?fig=toaster',
      badge: 'INTERACTIVE',
      desc: 'Dual toast bread slots, spring-loaded depression lever, heating coils, and browning rotary dial.',
      tags: ['toaster', 'bread', 'breakfast', 'toast', 'spring', 'kitchen']
    },
    {
      id: 'fig-microwave',
      title: 'Countertop Microwave Oven',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🍲',
      url: 'colorfigures.html?fig=microwave',
      badge: 'INTERACTIVE',
      desc: 'Motorized glass turntable rotation, door latch, digital LED countdown timer, and interior illumination.',
      tags: ['microwave', 'oven', 'kitchen', 'turntable', 'reheat', 'timer']
    },
    {
      id: 'fig-washer',
      title: 'Front-Loading Washing Machine',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🧺',
      url: 'colorfigures.html?fig=washer',
      badge: 'INTERACTIVE',
      desc: 'Spin cycle tumble drum, water fill & drain simulation, transparent circular porthole door.',
      tags: ['washer', 'washing', 'laundry', 'drum', 'spin', 'clean']
    },
    {
      id: 'fig-fridge',
      title: 'Double-Door Refrigerator',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🧊',
      url: 'colorfigures.html?fig=fridge',
      badge: 'INTERACTIVE',
      desc: 'Magnetic gasket dual doors, interior light trigger, crisper vegetable bins, and freezer compartment.',
      tags: ['fridge', 'refrigerator', 'kitchen', 'cooling', 'freezer', 'door']
    },
    {
      id: 'fig-blender',
      title: 'Vortex Countertop Blender',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🍹',
      url: 'colorfigures.html?fig=blender',
      badge: 'INTERACTIVE',
      desc: 'High-torque motor base, 4-blade stainless vortex, pulse switch, and variable speed dial.',
      tags: ['blender', 'smoothie', 'vortex', 'juice', 'kitchen', 'motor']
    },
    {
      id: 'fig-vacuum',
      title: 'Canister Cyclone Vacuum Cleaner',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🧹',
      url: 'colorfigures.html?fig=vacuum',
      badge: 'INTERACTIVE',
      desc: 'Centrifugal cyclonic dust bin, foot pedal power switch, and spring cord reel retraction.',
      tags: ['vacuum', 'cleaner', 'suction', 'cyclone', 'dust', 'cleaning']
    },
    {
      id: 'fig-fan',
      title: 'Oscillating Aerodynamic Desk Fan',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🌀',
      url: 'colorfigures.html?fig=fan',
      badge: 'INTERACTIVE',
      desc: '3-speed push buttons, oscillation clutch pin, wire safety grille, and rotating 3-blade propeller.',
      tags: ['fan', 'cooling', 'desk', 'breeze', 'wind', 'motor', 'oscillating']
    },
    {
      id: 'fig-ekettle',
      title: 'Cordless Electric Boiling Kettle',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🫖',
      url: 'colorfigures.html?fig=ekettle',
      badge: 'INTERACTIVE',
      desc: '360° rotational power base, auto-shutoff bimetallic steam switch, and boiling bubble physics.',
      tags: ['kettle', 'tea', 'boiling', 'water', 'hot', 'steam']
    },
    {
      id: 'fig-booth',
      title: 'Public Restroom Privacy Booth',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🚪',
      url: 'colorfigures.html?fig=booth',
      badge: 'INTERACTIVE',
      desc: 'Privacy slide latch with Vacant/Engaged indicator disc and sanitary interior accessories.',
      tags: ['booth', 'restroom', 'toilet', 'door', 'latch', 'privacy']
    },
    {
      id: 'fig-cistern',
      title: 'Toilet Dual-Flush Cistern',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🚽',
      url: 'colorfigures.html?fig=cistern',
      badge: 'INTERACTIVE',
      desc: 'Dual-flush chrome top buttons, rubber flapper valve, siphonic flush whirlpool, and float refill valve.',
      tags: ['cistern', 'toilet', 'flush', 'plumbing', 'water', 'valve']
    },
    {
      id: 'fig-gashapon',
      title: 'Gashapon Toy Capsule Machine',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🔮',
      url: 'colorfigures.html?fig=gashapon',
      badge: 'INTERACTIVE',
      desc: '100-yen coin mechanism, rotary turn dial, tumbling toy capsule drop, and unboxing animation.',
      tags: ['gashapon', 'capsule', 'toy', 'coin', 'japan', 'vending']
    },
    {
      id: 'fig-foodtruck',
      title: 'Gourmet Street Food Truck',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🚐',
      url: 'colorfigures.html?fig=foodtruck',
      badge: 'INTERACTIVE',
      desc: 'Fold-down serving awning, griddle exhaust stack, customer service window, and vehicle detailing.',
      tags: ['foodtruck', 'truck', 'kitchen', 'street food', 'van', 'vehicle']
    },
    {
      id: 'fig-pourover',
      title: 'Pour-Over Artisan Coffee Set',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '☕',
      url: 'colorfigures.html?fig=pourover',
      badge: 'INTERACTIVE',
      desc: 'Gooseneck stainless kettle with spiral water stream, paper filter coffee bloom, and glass server carafe.',
      tags: ['pourover', 'coffee', 'dripper', 'kettle', 'carafe', 'barista']
    },
    {
      id: 'fig-lamp',
      title: 'Articulated Counterbalance Desk Lamp',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '💡',
      url: 'colorfigures.html?fig=lamp',
      badge: 'LIGHTING',
      desc: 'Double-scissor spring counterbalance arm, tiltable conical shade, and illuminated light beam.',
      tags: ['lamp', 'desk lamp', 'light', 'spring', 'bulb', 'lighting']
    },
    {
      id: 'fig-sharpener',
      title: 'Rotary Hand-Crank Pencil Sharpener',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '✏️',
      url: 'colorfigures.html?fig=sharpener',
      badge: 'INTERACTIVE',
      desc: 'Geared rotary hand crank, shavings collection bin, progressive graphite sharpening clamp.',
      tags: ['sharpener', 'pencil', 'crank', 'stationary', 'desk', 'shavings']
    },
    {
      id: 'fig-windup',
      title: 'Clockwork Wind-Up Robot Toy',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🤖',
      url: 'colorfigures.html?fig=windup',
      badge: 'CLOCKWORK',
      desc: 'Ratchet winding key, spring tension energy store, and bipedal mechanical clockwork walk.',
      tags: ['windup', 'toy', 'clockwork', 'key', 'robot', 'spring', 'walk']
    },
    {
      id: 'fig-crossing',
      title: 'Pedestrian Crossing Traffic Light',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🚦',
      url: 'colorfigures.html?fig=crossing',
      badge: 'INTERACTIVE',
      desc: 'Push-button crosswalk controller with 3-state automotive traffic & pedestrian walk signals.',
      tags: ['crossing', 'traffic', 'signal', 'walk', 'pedestrian', 'light']
    },
    {
      id: 'fig-smokealarm',
      title: 'Ceiling Smoke & Fire Alarm',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🚨',
      url: 'colorfigures.html?fig=smokealarm',
      badge: 'SENSOR',
      desc: 'Piezoelectric buzzer test button, battery compartment drawer, and intermittent alert LED.',
      tags: ['smoke', 'alarm', 'fire', 'buzzer', 'detector', 'safety']
    },
    {
      id: 'fig-gumball',
      title: 'Spiral Gravity Gumball Machine',
      suite: 'Colorfigures',
      category: 'everyday',
      icon: '🍬',
      url: 'colorfigures.html?fig=gumball',
      badge: 'INTERACTIVE',
      desc: 'Turn crank coin mechanism, spherical glass globe, and multi-turn spiral gravity race track.',
      tags: ['gumball', 'candy', 'spiral', 'coin', 'machine', 'gravity']
    },

    // 4. DATA CENTER INFRASTRUCTURE (12 Figures)
    {
      id: 'dc-gpu-rack',
      title: '42U AI GPU Supercomputer Rack',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '🖥️',
      url: 'datacenter.html#fig-0',
      badge: 'TIER IV',
      desc: '8x blade chassis with live LED activity bars, cooling fans, and fiber cable harness. Space triggers benchmark.',
      tags: ['gpu', 'rack', '42u', 'server', 'nvidia', 'supercomputer', 'ai', 'datacenter']
    },
    {
      id: 'dc-chiller',
      title: 'Liquid Chiller & CDU Distribution',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '❄️',
      url: 'datacenter.html#fig-1',
      badge: 'TIER IV',
      desc: 'Primary coolant manifold, proportional valve, and continuous dual spinning pump impellers.',
      tags: ['chiller', 'cdu', 'liquid', 'cooling', 'hvac', 'pump', 'datacenter']
    },
    {
      id: 'dc-ups',
      title: 'Modular UPS Battery Vault',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '🔋',
      url: 'datacenter.html#fig-2',
      badge: 'TIER IV',
      desc: 'LiFePO4 battery modules, dual static bypass switches, and interactive Mains Grid Blackout simulator.',
      tags: ['ups', 'battery', 'power', 'backup', 'blackout', 'ats', 'datacenter']
    },
    {
      id: 'dc-cctv',
      title: 'Industrial PTZ CCTV Surveillance',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '📹',
      url: 'datacenter.html#fig-3',
      badge: 'TIER IV',
      desc: '360° motorized gimbal dome camera, 4K optical lens, 8 IR night vision LEDs, and live OSD monitor.',
      tags: ['cctv', 'ptz', 'camera', 'security', 'surveillance', 'laser', 'datacenter']
    },
    {
      id: 'dc-dcim',
      title: 'DCIM NOC Video Wall & Telemetry',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '📊',
      url: 'datacenter.html#fig-4',
      badge: 'TIER IV',
      desc: 'High-bandwidth traffic waveform analyzer, packet throughput histogram bars, and PUE 1.12 gauge.',
      tags: ['dcim', 'noc', 'telemetry', 'videowall', 'traffic', 'pue', 'network', 'datacenter']
    },
    {
      id: 'dc-spineleaf',
      title: 'Spine-Leaf 400G CLOS Network Fabric',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '🌐',
      url: 'datacenter.html#fig-5',
      badge: 'TIER IV',
      desc: '2 Spine + 4 Leaf switches with pulsating QSFP-DD fiber optic cables and RoCEv2 AI fabric traffic.',
      tags: ['spine', 'leaf', '400g', 'switch', 'fiber', 'clos', 'network', 'datacenter']
    },
    {
      id: 'dc-generator',
      title: '2.5 MVA Diesel Prime Generator & ATS',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '⚡',
      url: 'datacenter.html#fig-6',
      badge: 'TIER IV',
      desc: 'V16 diesel prime mover, high-speed radiator fan, Automatic Transfer Switch (ATS) cabinet.',
      tags: ['generator', 'diesel', 'ats', 'emergency', 'power', 'v16', 'engine', 'datacenter']
    },
    {
      id: 'dc-crac',
      title: 'CRAC / CRAH Precision Air Handler',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '💨',
      url: 'datacenter.html#fig-7',
      badge: 'TIER IV',
      desc: 'Dual spinning EC centrifugal blowers, thermal differential controller, subfloor cold airflow.',
      tags: ['crac', 'crah', 'air handler', 'hvac', 'blower', 'cooling', 'datacenter']
    },
    {
      id: 'dc-fire',
      title: 'Clean Agent Fire Suppression FM-200',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '🧯',
      url: 'datacenter.html#fig-8',
      badge: 'TIER IV',
      desc: '4 high-pressure cylinders, discharge nozzles, VESDA laser smoke sampling stream, pull station.',
      tags: ['fire', 'fm200', 'suppression', 'vesda', 'smoke', 'gas', 'datacenter']
    },
    {
      id: 'dc-pdu',
      title: 'Smart PDU & STS Power Distribution',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '🔌',
      url: 'datacenter.html#fig-9',
      badge: 'TIER IV',
      desc: '3-phase isolation transformer, 42-pole branch circuit breaker matrix, and power quality analyzer.',
      tags: ['pdu', 'sts', 'transformer', 'breaker', 'power', 'distribution', 'datacenter']
    },
    {
      id: 'dc-tape',
      title: 'Automated Robotic Tape Library',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '📼',
      url: 'datacenter.html#fig-10',
      badge: 'TIER IV',
      desc: 'LTO-9 cartridge bay, motorized dual-axis robotic picker arm, barcode scanner, and drive spool.',
      tags: ['tape', 'library', 'robotic', 'lto9', 'archive', 'backup', 'datacenter']
    },
    {
      id: 'dc-containment',
      title: 'Cold Aisle Containment Pod',
      suite: 'Data Center',
      category: 'datacenter',
      icon: '🧊',
      url: 'datacenter.html#fig-11',
      badge: 'TIER IV',
      desc: 'Dual server rack row, transparent roof canopy, motorized sliding biometric doors, and rising cold air.',
      tags: ['containment', 'cold aisle', 'pod', 'rack', 'biometric', 'hvac', 'datacenter']
    },

    // 5. CYBER LAB SUITE (5 Figures)
    {
      id: 'lab-quantum',
      title: '127-Qubit Quantum Cryo-Chandelier',
      suite: 'Cyber Lab',
      category: 'scifi',
      icon: '⚛️',
      url: 'cyberlab.html#fig-0',
      badge: 'SCI-FI LAB',
      desc: '5-tier dilution refrigerator (15 mK), coiled gold microwave coax wires, and Bloch sphere probability wave.',
      tags: ['quantum', 'qubit', 'cryo', 'dilution', 'superposition', 'chandelier', 'physics', 'cyberlab']
    },
    {
      id: 'lab-tokamak',
      title: 'Tokamak Fusion Reactor Core',
      suite: 'Cyber Lab',
      category: 'scifi',
      icon: '☢️',
      url: 'cyberlab.html#fig-1',
      badge: 'SCI-FI LAB',
      desc: 'Toroidal magnetic confinement donut, 8 superconducting D-coils, and burning counter-rotating plasma stream.',
      tags: ['tokamak', 'fusion', 'plasma', 'torus', 'magnetic', 'reactor', 'energy', 'cyberlab']
    },
    {
      id: 'lab-hovercar',
      title: 'Cyberpunk Aerodyne Hovercar VTOL',
      suite: 'Cyber Lab',
      category: 'scifi',
      icon: '🚗',
      url: 'cyberlab.html#fig-2',
      badge: 'SCI-FI LAB',
      desc: 'Physics hover bobbing with 3D tilt, 4 anti-gravity VTOL lift rings, gull-wing door, and nitro boost.',
      tags: ['hovercar', 'aerodyne', 'vtol', 'flying car', 'cyberpunk', 'anti-gravity', 'cyberlab']
    },
    {
      id: 'lab-satellite',
      title: 'Deep-Space Orbital Recon Satellite',
      suite: 'Cyber Lab',
      category: 'scifi',
      icon: '🛰️',
      url: 'cyberlab.html#fig-3',
      badge: 'SCI-FI LAB',
      desc: 'Octagonal gold MLI body, solar wings, 360° phased-array radar sweep, and cold-gas RCS thruster puffs.',
      tags: ['satellite', 'orbital', 'space', 'radar', 'recon', 'solar', 'cyberlab']
    },
    {
      id: 'lab-custompc',
      title: 'Dual-Loop Liquid-Cooled Super PC',
      suite: 'Cyber Lab',
      category: 'scifi',
      icon: '💻',
      url: 'cyberlab.html#fig-4',
      badge: 'SCI-FI LAB',
      desc: 'Open chassis, GPU waterblock (RTX 5090), dual vortex reservoirs, coolant bubble streams, and RGB fans.',
      tags: ['pc', 'custom loop', 'water cooling', 'rtx 5090', 'supercomputer', 'gaming', 'cyberlab']
    },

    // 6. AUDIRA STUDIO (5 Figures)
    {
      id: 'studio-synth',
      title: 'Modular Analog Synthesizer',
      suite: 'Audira Studio',
      category: 'audio',
      icon: '🎛️',
      url: 'audira-studio.html#fig-0',
      badge: 'ANALOG SYNTH',
      desc: 'Patchbay jacks, voltage-controlled oscillators (VCO), resonant ladder filter, and step sequencer.',
      tags: ['synth', 'synthesizer', 'modular', 'vco', 'patchbay', 'filter', 'analog', 'audio']
    },
    {
      id: 'studio-pocket',
      title: 'Handheld Retro Pocket Console',
      suite: 'Audira Studio',
      category: 'audio',
      icon: '🎮',
      url: 'audira-studio.html#fig-1',
      badge: 'PORTABLE',
      desc: 'Precision D-pad, tactile micro-switches, and illuminated dot-matrix LCD display with chip sound.',
      tags: ['pocket', 'console', 'gameboy', 'handheld', 'retro', 'gaming', 'dpad']
    },
    {
      id: 'studio-tube',
      title: 'Studio Valve Tube DAC',
      suite: 'Audira Studio',
      category: 'audio',
      icon: '💡',
      url: 'audira-studio.html#fig-2',
      badge: 'AUDIOPHILE',
      desc: 'Dual glowing 12AX7 vacuum triodes, analog backlit VU meters, and heavy knurled volume knob.',
      tags: ['dac', 'tube', 'valve', '12ax7', 'vacuum', 'vu meter', 'audiophile', 'harmonics']
    },
    {
      id: 'studio-deck',
      title: 'Cyberdeck Magnetic Tape Station',
      suite: 'Cyber Studio',
      category: 'audio',
      icon: '📼',
      url: 'audira-studio.html#fig-3',
      badge: 'CYBERDECK',
      desc: 'Dual-spool cassette deck with spinning reels, mechanical transport levers, and glowing interface.',
      tags: ['tape', 'cassette', 'cyberdeck', 'deck', 'analog', 'reels', 'audio']
    },
    {
      id: 'studio-radio',
      title: 'Vintage World Band Tube Radio WR-88',
      suite: 'Audira Studio',
      category: 'audio',
      icon: '📻',
      url: 'audira-studio.html#fig-4',
      badge: 'TUBE RADIO',
      desc: 'Analog tuning glass needle, EM84 Magic Eye tuning tube flutter, and 5 procedural synthesized audio stations.',
      tags: ['radio', 'tuning', 'em84', 'magic eye', 'morse', 'shortwave', 'stations', 'audio']
    },

    // 7. CITIES (10 Cityscapes)
    {
      id: 'cities-hub',
      title: 'Architectural Cyber Cities (10 Models)',
      suite: 'Cities Gallery',
      category: 'art',
      icon: '🏙️',
      url: 'cities.html',
      badge: 'URBAN ARCOLOGY',
      desc: '10 dense futuristic urban megastructures, hyperloop transit interchanges, and elevated skybridge rings.',
      tags: ['cities', 'city', 'architecture', 'skyscraper', 'hyperloop', 'arcology', 'urban', 'isometric']
    },

    // 8. OBJECTS (10 Artifacts)
    {
      id: 'objects-hub',
      title: 'Classic Objects & Workstations (10 Artifacts)',
      suite: 'Objects Gallery',
      category: 'art',
      icon: '📠',
      url: 'objects.html',
      badge: 'RETRO ARTIFACTS',
      desc: '10 classic mechanical and digital artifacts: vintage desktop workstations, microwave relays, open-reel decks.',
      tags: ['objects', 'vintage', 'workstation', 'retro', 'terminal', 'relay', 'hardware', 'isometric']
    },

    // 9. LUMEN (12 Light Sculptures)
    {
      id: 'lumen-hub',
      title: 'Lumen Geometric Light Sculptures (12 Figures)',
      suite: 'Lumen Gallery',
      category: 'art',
      icon: '💎',
      url: 'lumen.html',
      badge: 'SOLID GEOMETRY',
      desc: '12 minimalist mathematical light sculptures: hypercubes, rhombic dodecahedrons, and radiant crystal monoliths.',
      tags: ['lumen', 'geometry', 'crystal', 'hypercube', 'prism', 'math', 'sculpture', 'light']
    },

    // 10. COMPUTER DEMO & 3D CANVAS
    {
      id: 'computer-demo',
      title: 'Standalone Desk Computer & 3D Orbit Canvas',
      suite: 'Computer Demo',
      category: 'art',
      icon: '🖥️',
      url: 'computer-demo.html',
      badge: '3D WORKSTATION',
      desc: 'Interactive retro desktop workstation with WebGL Three.js 3D canvas viewer, orbit controls, and metallic shaders.',
      tags: ['computer', 'desktop', 'canvas', '3d', 'threejs', 'orbit', 'workstation']
    }
  ];

  // --- CREATE SEARCH MODAL DOM IF NOT PRESENT ---
  function ensureSearchModal() {
    if (document.getElementById('audiraSearchOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'audiraSearchOverlay';
    overlay.className = 'audira-search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search all 75+ models and suites');

    overlay.innerHTML = `
      <div class="audira-search-dialog" id="audiraSearchDialog">
        <div class="audira-search-head">
          <svg class="audira-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="audiraSearchInput" class="audira-search-input" placeholder="Search 75+ models (Gundam, Arcade, Chiller, Radio, Ship, Tokamak...)" autocomplete="off" spellcheck="false" />
          <button type="button" class="audira-search-close" id="audiraSearchCloseBtn" aria-label="Close search">ESC</button>
        </div>

        <div class="audira-search-filters" id="audiraSearchFilters">
          <button type="button" class="audira-filter-btn active" data-cat="all">All (${CATALOG.length}+)</button>
          <button type="button" class="audira-filter-btn" data-cat="3d">🎮 3D WebGL &amp; Mecha</button>
          <button type="button" class="audira-filter-btn" data-cat="everyday">🕹️ Colorfigures (26)</button>
          <button type="button" class="audira-filter-btn" data-cat="datacenter">🏢 Data Center (12)</button>
          <button type="button" class="audira-filter-btn" data-cat="scifi">⚛️ Cyber Lab (5)</button>
          <button type="button" class="audira-filter-btn" data-cat="audio">📻 Studio (5)</button>
          <button type="button" class="audira-filter-btn" data-cat="art">🏙️ Isometric Art (32+)</button>
        </div>

        <div class="audira-search-results" id="audiraSearchResults" role="listbox"></div>

        <div class="audira-search-foot">
          <span><kbd style="padding:2px 5px; border-radius:3px; background:rgba(255,255,255,0.08); font-size:10px;">↑</kbd> <kbd style="padding:2px 5px; border-radius:3px; background:rgba(255,255,255,0.08); font-size:10px;">↓</kbd> to navigate · <kbd style="padding:2px 5px; border-radius:3px; background:rgba(255,255,255,0.08); font-size:10px;">↵</kbd> to select</span>
          <span style="color:var(--accent, #ff9a2e); font-weight:600;">AUDIRA GLOW · Command Palette</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('audiraSearchInput');
    const resultsContainer = document.getElementById('audiraSearchResults');
    const filterBtns = document.querySelectorAll('.audira-filter-btn');
    const closeBtn = document.getElementById('audiraSearchCloseBtn');

    let currentFilter = 'all';
    let selectedIdx = 0;
    let visibleItems = [];

    function renderResults() {
      const q = input.value.trim().toLowerCase();
      visibleItems = CATALOG.filter(item => {
        const matchesCategory = (currentFilter === 'all' || item.category === currentFilter);
        if (!matchesCategory) return false;
        if (!q) return true;

        const inTitle = item.title.toLowerCase().includes(q);
        const inSuite = item.suite.toLowerCase().includes(q);
        const inDesc = item.desc.toLowerCase().includes(q);
        const inTags = item.tags.some(t => t.toLowerCase().includes(q));
        return inTitle || inSuite || inDesc || inTags;
      });

      if (visibleItems.length === 0) {
        resultsContainer.innerHTML = `
          <div class="audira-search-empty">
            No matching models or suites found for "<strong style="color:var(--ink-hi);">${escapeHtml(q)}</strong>"<br>
            <span style="font-size:11px; opacity:0.7;">Try searching for "Gundam", "Arcade", "Chiller", "Radio", "Cities", or "Ship"</span>
          </div>
        `;
        return;
      }

      if (selectedIdx >= visibleItems.length) selectedIdx = 0;

      resultsContainer.innerHTML = visibleItems.map((item, idx) => `
        <a href="${item.url}" class="audira-search-item ${idx === selectedIdx ? 'selected' : ''}" role="option" aria-selected="${idx === selectedIdx}">
          <div class="audira-search-item-info">
            <div class="audira-search-item-title-row">
              <span class="audira-search-item-icon">${item.icon}</span>
              <span class="audira-search-item-title">${highlight(item.title, q)}</span>
            </div>
            <div class="audira-search-item-desc">${highlight(item.desc, q)}</div>
          </div>
          <div class="audira-search-item-meta">
            <span class="audira-search-badge">${item.badge}</span>
            <span class="audira-search-arrow">→</span>
          </div>
        </a>
      `).join('');
    }

    function highlight(text, q) {
      if (!q) return escapeHtml(text);
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${safeQ})`, 'gi');
      return escapeHtml(text).replace(regex, '<span style="color:var(--accent, #ff9a2e); font-weight:700; text-decoration:underline;">$1</span>');
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    // Filter clicks
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.cat;
        selectedIdx = 0;
        renderResults();
      });
    });

    // Input changes
    input.addEventListener('input', () => {
      selectedIdx = 0;
      renderResults();
    });

    // Keyboard navigation inside search
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (visibleItems.length > 0) {
          selectedIdx = (selectedIdx + 1) % visibleItems.length;
          renderResults();
          scrollSelectedIntoView();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (visibleItems.length > 0) {
          selectedIdx = (selectedIdx - 1 + visibleItems.length) % visibleItems.length;
          renderResults();
          scrollSelectedIntoView();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (visibleItems[selectedIdx]) {
          window.location.href = visibleItems[selectedIdx].url;
        }
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    });

    function scrollSelectedIntoView() {
      const activeEl = resultsContainer.querySelector('.audira-search-item.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    // Close actions
    closeBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeSearch();
    });

    renderResults();
  }

  // --- OPEN / CLOSE SEARCH ---
  function openSearch() {
    ensureSearchModal();
    const overlay = document.getElementById('audiraSearchOverlay');
    const input = document.getElementById('audiraSearchInput');
    if (overlay) {
      overlay.classList.add('open');
      if (input) {
        input.value = '';
        input.focus();
        // trigger render
        input.dispatchEvent(new Event('input'));
      }
    }
  }

  function closeSearch() {
    const overlay = document.getElementById('audiraSearchOverlay');
    if (overlay) {
      overlay.classList.remove('open');
    }
  }

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  window.addEventListener('keydown', e => {
    // Open on Ctrl+K, Cmd+K, or slash ('/') when not in an input
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const overlay = document.getElementById('audiraSearchOverlay');
      if (overlay && overlay.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    } else if (e.key === '/' && !e.target.closest('input, textarea, [contenteditable="true"]')) {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  // --- HOOK SEARCH BUTTONS ON PAGE ---
  function initHeaderButtons() {
    document.querySelectorAll('.dh-search-btn, #openSearchBtn, [data-action="open-search"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        openSearch();
      });
    });

    // Swatches click
    const sw = document.getElementById('swatches') || document.querySelector('.dh-swatches');
    if (sw && typeof window.setAccent === 'function') {
      sw.addEventListener('click', e => {
        const b = e.target.closest('button[data-accent]');
        if (b) window.setAccent(b.dataset.accent);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderButtons);
  } else {
    initHeaderButtons();
  }

  // Expose API
  window.AUDIRA_SEARCH = {
    open: openSearch,
    close: closeSearch,
    catalog: CATALOG
  };
})();
