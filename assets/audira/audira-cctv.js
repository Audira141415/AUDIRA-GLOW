/* Fig 4 — Audira Industrial PTZ Surveillance Camera System */
FIGS.push({
  id: 'audira-cctv',
  name: 'CCTV Surveillance',
  hint: 'Click controls or Space to steer PTZ · Keys 1–4 zoom & IR night vision · Click lens',
  aria: 'Isometric industrial 4K motorized PTZ security surveillance camera with pan-tilt gimbal, optical zoom barrel, 12-point IR night vision illuminator ring, targeting laser beam, and local operator joystick console.',
  css: `
    [data-fig="audira-cctv"] .cctv-lens { cursor:pointer; }
    [data-fig="audira-cctv"] .cctv-lens:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-cctv"] .ptz-btn { cursor:pointer; }
    [data-fig="audira-cctv"] .ptz-btn:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-cctv"] .laser-beam { fill:none; stroke:var(--accent); stroke-width:1.8; stroke-dasharray:12 18; opacity:.85; filter:url(#glow); }
    [data-fig="audira-cctv"] .laser-cone { fill:var(--accent); opacity:.14; filter:url(#bloom); transition:opacity .3s; }
    [data-fig="audira-cctv"] .laser-cone.alert { opacity:.38; fill:var(--accent-hi); }
    [data-fig="audira-cctv"] .ir-led { fill:var(--detail); transition:fill .2s; }
    [data-fig="audira-cctv"] .ir-led.lit { fill:var(--accent-hi); filter:url(#soft); }
    [data-fig="audira-cctv"] .rec-dot { animation:cctv-rec-blink 1s steps(1) infinite; }
    @keyframes cctv-rec-blink { 50% { opacity:0; } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [320, 0, 7], [320, 260, 0], [0, 0, 7],
      [20, 20, 210], [300, 20, 210], [20, 240, 210], [300, 240, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="cam-lcd-clip"><rect x="4" y="3" width="72" height="16" rx="2"/></clipPath>
      <clipPath id="feed-screen-clip"><rect x="4" y="4" width="76" height="50" rx="3"/></clipPath>
    </defs>`;

    // Base Floor Plate (Monitoring Zone demarcations)
    svg += box(0, 0, 0, 320, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="304" height="244" rx="10"/>
      <!-- CCTV Field-of-View Demarcation Cone on Floor -->
      <path class="detail" d="M160 50 L70 230 L250 230 Z"/>
      <!-- Floor Laser Target Grid Lines -->
      <line class="laser-beam" id="cctv-floor-target" x1="100" y1="180" x2="220" y2="180">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1s" repeatCount="indefinite"/>
      </line>
      <circle class="face recess" cx="160" cy="180" r="14"/>
      <circle class="detail" cx="160" cy="180" r="8"/>
      <text class="label" x="50" y="250" font-size="4" letter-spacing="1.5">PERIMETER CCTV SURVEILLANCE · OPTICAL TARGETING ZONE</text>
    </g>`;

    // Robust Wall Mount Plate & Arm (Left-Rear)
    const WX = 26, WY = 20, WZ = PLZ + 60, WW = 16, WD = 50, WH = 100;
    svg += box(WX, WY, WZ, WW, WD, WH, 4);
    svg += `<g transform="${SIDE(WX + WW, WY + WD, WZ + WH)}">
      ${slits(10, WD - 10, 4, 10, WH - 10)}
      <text class="label" x="12" y="30" font-size="4.5" letter-spacing="1">CAM-04 · HIGH ELEVATION</text>
      <!-- Heavy industrial mounting bolt heads -->
      ${[15, 45, 75].map(y => `<circle class="face recess" cx="25" cy="${y}" r="3"/><circle class="face" cx="25" cy="${y}" r="1.5"/>`).join('')}
    </g>`;

    // Heavy Horizontal Tubular Support Boom Arm extending into center
    const ARM_X = WX + WW, ARM_Y = WY + 18, ARM_Z = WZ + 65, ARM_L = 85, ARM_W = 18, ARM_H = 18;
    svg += box(ARM_X, ARM_Y, ARM_Z, ARM_L, ARM_W, ARM_H, 4);
    svg += `<g transform="${FRONT(ARM_X, ARM_Y + ARM_W, ARM_Z + ARM_H)}">
      ${slits(6, ARM_L - 6, 4, 4, ARM_H - 4)}
      <text class="label" x="14" y="11" font-size="3.5" letter-spacing="1">INTERNAL FIBER & 48V PoE++ CONDUIT</text>
    </g>`;

    // MOTORIZED PTZ TURRET GIMBAL ASSEMBLY
    // 1. Pan Base Turret (Rotating horizontal disc under the arm)
    const TURRET_X = ARM_X + ARM_L - 25, TURRET_Y = ARM_Y - 5, TURRET_Z = ARM_Z - 18;
    const TURRET_W = 32, TURRET_D = 32, TURRET_H = 18;
    svg += box(TURRET_X, TURRET_Y, TURRET_Z, TURRET_W, TURRET_D, TURRET_H, 15);
    svg += `<g transform="${TOP(TURRET_X, TURRET_Y, TURRET_Z + TURRET_H)}">
      <circle class="face recess" cx="16" cy="16" r="14"/>
      <circle class="led hot" filter="url(#soft)" cx="16" cy="16" r="2.5"/>
      <text class="label" x="16" y="24" font-size="3" text-anchor="middle">PAN 360°</text>
    </g>`;

    // 2. Dual Yoke / Fork Support Brackets
    const FORK_X = TURRET_X + 2, FORK_Y = TURRET_Y + 2, FORK_Z = TURRET_Z - 26;
    svg += box(FORK_X, FORK_Y, FORK_Z, 6, 28, 26, 2);
    svg += box(FORK_X + 22, FORK_Y, FORK_Z, 6, 28, 26, 2);

    // 3. Central Cylindrical Camera Housing (Gimbal suspended inside fork)
    const CAM_CX = FORK_X + 6, CAM_CY = FORK_Y + 2, CAM_CZ = FORK_Z - 10;
    const CAM_W = 16, CAM_D = 55, CAM_H = 34;

    svg += `<g class="cctv-lens" id="cctv-body-rig">`;
    svg += box(CAM_CX, CAM_CY, CAM_CZ, CAM_W, CAM_D, CAM_H, 8);

    // Camera Top Sunshield & Status Display
    svg += `<g transform="${TOP(CAM_CX, CAM_CY, CAM_CZ + CAM_H)}">
      <rect class="face recess" x="2" y="4" width="${CAM_W - 4}" height="${CAM_D - 8}" rx="3"/>
      <circle class="led hot rec-dot" cx="8" cy="12" r="1.8"/>
      <text class="scr-accent" x="8" y="22" font-size="3" text-anchor="middle">REC</text>
      <text class="label" x="8" y="34" font-size="2.6" text-anchor="middle">4K 60</text>
      <text class="label" x="8" y="44" font-size="2.6" text-anchor="middle">32X</text>
    </g>`;

    // Front Camera Face with Big Optical Lens & 12 IR LEDs Ring
    const FRONT_Z = CAM_CZ + CAM_H;
    svg += `<g transform="${FRONT(CAM_CX, CAM_CY + CAM_D, FRONT_Z)}">
      <!-- Outer Lens Bezel -->
      <rect class="face recess" x="1" y="2" width="${CAM_W - 2}" height="${CAM_H - 4}" rx="5"/>
      <circle class="face recess" cx="${CAM_W / 2}" cy="${CAM_H / 2}" r="12"/>
      
      <!-- 8-Point IR Night Vision Illuminator Array -->
      ${Array.from({ length: 8 }, (_, i) => {
        const rad = (i * 45 * Math.PI) / 180;
        const lx = CAM_W / 2 + 9.5 * Math.cos(rad);
        const ly = CAM_H / 2 + 9.5 * Math.sin(rad);
        return `<circle class="ir-led lit" id="ir-${i}" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="1.1"/>`;
      }).join('')}

      <!-- Center Coated Optical Glass Lens Element -->
      <circle class="face glass hot" id="cctv-main-lens" filter="url(#glow)" cx="${CAM_W / 2}" cy="${CAM_H / 2}" r="6"/>
      <circle class="face" cx="${CAM_W / 2}" cy="${CAM_H / 2}" r="3"/>
      <circle class="led hot" id="cctv-laser-diode" cx="${CAM_W / 2}" cy="${CAM_H / 2}" r="1.2"/>
    </g>`;
    svg += `</g>`; // end cctv-lens

    // 4. Sweeping Optical Targeting Laser Cone extending to floor
    const LENS_TIP = [CAM_CX + CAM_W / 2, CAM_CY + CAM_D + 2, CAM_CZ + CAM_H / 2];
    const beamPts = [
      LENS_TIP,
      [120, 200, PLZ + 2],
      [200, 200, PLZ + 2],
      LENS_TIP
    ];
    const beamD = path(beamPts) + 'Z';
    svg += `<path class="laser-cone" id="cctv-laser-cone" d="${beamD}">
      <animate attributeName="opacity" values="0.14; 0.35; 0.14" dur="2s" repeatCount="indefinite"/>
    </path>`;

    // LOCAL CCTV OPERATOR MONITOR & PTZ CONSOLE (Bottom Right Floor)
    const MON_X = 200, MON_Y = 140, MON_W = 85, MON_D = 60, MON_H = 14, MON_T = PLZ + MON_H;
    svg += box(MON_X, MON_Y, PLZ, MON_W, MON_D, MON_H, 4);
    svg += `<g transform="${TOP(MON_X, MON_Y, MON_T)}">
      <rect class="face recess" x="4" y="4" width="${MON_W - 8}" height="${MON_D - 8}" rx="3"/>
      <!-- Live CCTV Video Monitor Feed -->
      <rect class="halo hot" x="6" y="6" width="${MON_W - 12}" height="32" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="6" y="6" width="${MON_W - 12}" height="32" rx="2"/>
      
      <g clip-path="url(#feed-screen-clip)" transform="translate(4 4)">
        <!-- Video OSD (On-Screen Display) -->
        <text class="scr-accent" x="6" y="8" font-size="3.5">CAM 04 · LIVE FEED</text>
        <circle class="led hot rec-dot" cx="62" cy="7" r="1.5"/>
        <text class="scr" x="66" y="8" font-size="3">REC</text>
        <!-- Targeting Crosshairs -->
        <line class="detail" stroke="var(--accent)" x1="28" y1="20" x2="48" y2="20"/>
        <line class="detail" stroke="var(--accent)" x1="38" y1="12" x2="38" y2="28"/>
        <circle class="detail" stroke="var(--accent)" cx="38" cy="20" r="5"/>
        <text class="scr" id="cctv-osd-coords" x="6" y="30" font-size="3">AZ: 142° · EL: -24° · 12.4X</text>
      </g>

      <!-- Hardware PTZ Steering Control Buttons on console deck -->
      ${[
        { id: 'pan-l',  x: 10, y: 42, lbl: '◀ PAN' },
        { id: 'tilt-u', x: 28, y: 42, lbl: '▲ TILT' },
        { id: 'zoom',   x: 48, y: 42, lbl: 'ZOOM' },
        { id: 'night',  x: 64, y: 42, lbl: 'IR NITE' }
      ].map(b => `
        <g class="ptz-btn" id="ptz-btn-${b.id}" data-btn="${b.id}">
          <rect class="face recess" x="${b.x}" y="${b.y}" width="16" height="11" rx="1.5"/>
          <text class="label" x="${b.x + 8}" y="${b.y + 7}" font-size="2.6" text-anchor="middle">${b.lbl}</text>
        </g>
      `).join('')}
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Real-Time Motion Logic ---------- */
    const st = {
      panAngle: 0,
      tiltAngle: -24,
      zoomLevel: 12.4,
      nightVision: true,
      alarmLocked: false,
      panDir: 1,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function ptzBeep(f, dur = 0.05, type = 'sine') {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) {}
    }

    function toggleNightVision() {
      st.nightVision = !st.nightVision;
      ptzBeep(st.nightVision ? 880 : 440, 0.1);
      const irLeds = stage.querySelectorAll('.ir-led');
      irLeds.forEach(l => l.classList.toggle('lit', st.nightVision));
      render();
    }

    function stepZoom() {
      st.zoomLevel = st.zoomLevel >= 32 ? 4 : st.zoomLevel + 8;
      ptzBeep(700 + st.zoomLevel * 15, 0.08);
      render();
    }

    function triggerLock() {
      st.alarmLocked = !st.alarmLocked;
      ptzBeep(st.alarmLocked ? 1200 : 520, 0.25, 'sawtooth');
      const cone = q('#cctv-laser-cone');
      if (cone) cone.classList.toggle('alert', st.alarmLocked);
      render();
    }

    // Continuous Motorized PTZ Scanning Animation
    st.timer = api.every(45, () => {
      st.tick++;

      // Pan sweeping
      if (!st.alarmLocked) {
        st.panAngle += st.panDir * 0.8;
        if (st.panAngle > 35) st.panDir = -1;
        if (st.panAngle < -35) st.panDir = 1;
      }

      // Smooth laser target cone ground movement
      const cone = q('#cctv-laser-cone');
      if (cone) {
        const sweepX = Math.sin(st.tick * 0.05) * 35;
        const bPts = [
          LENS_TIP,
          [120 + sweepX, 200, PLZ + 2],
          [200 + sweepX, 200, PLZ + 2],
          LENS_TIP
        ];
        cone.setAttribute('d', path(bPts) + 'Z');
      }

      // Move floor target circle
      const floorTgt = q('#cctv-floor-target');
      if (floorTgt) {
        const sweepX = Math.sin(st.tick * 0.05) * 35;
        floorTgt.setAttribute('x1', (100 + sweepX).toFixed(1));
        floorTgt.setAttribute('x2', (220 + sweepX).toFixed(1));
      }

      // Update OSD coordinates on screen
      if (st.tick % 6 === 0) {
        const osd = q('#cctv-osd-coords');
        if (osd) {
          const az = (142 + st.panAngle).toFixed(0);
          osd.textContent = `AZ: ${az}° · EL: ${st.tiltAngle}° · ${st.zoomLevel}X`;
        }
      }
    });

    function render() {
      api.power(true);
      api.readout(
        st.alarmLocked
          ? `CCTV ALERT · TARGET LOCKED · ${st.zoomLevel}X OPTICAL ZOOM · IR NIGHT ON`
          : `CCTV MONITORING · PTZ SWEEPING · 4K 60FPS · ZOOM: ${st.zoomLevel}X · IR: ${st.nightVision ? 'ON' : 'OFF'}`
      );
    }

    stage.addEventListener('click', e => {
      const btn = e.target.closest('.ptz-btn');
      if (btn && btn.dataset.btn) {
        const b = btn.dataset.btn;
        if (b === 'pan-l') { st.panDir = -st.panDir; ptzBeep(600, 0.05); }
        else if (b === 'tilt-u') { st.tiltAngle = st.tiltAngle === -24 ? -10 : -24; ptzBeep(650, 0.05); }
        else if (b === 'zoom') stepZoom();
        else if (b === 'night') toggleNightVision();
        render();
        return;
      }
      if (e.target.closest('#cctv-body-rig')) {
        triggerLock();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          triggerLock();
          return true;
        }
        if (e.key === '1') { st.panDir = -st.panDir; render(); return true; }
        if (e.key === '2') { stepZoom(); return true; }
        if (e.key === '3') { toggleNightVision(); return true; }
        if (e.key === '4') { triggerLock(); return true; }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        triggerLock();
      }
    };
  }
});
