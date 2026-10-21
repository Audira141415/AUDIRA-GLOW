/* Fig 9 — Audira Clean Agent Gas Fire Suppression & VESDA Laser Detection */
FIGS.push({
  id: 'audira-fire',
  name: 'Fire Suppression & VESDA',
  hint: 'Click Manual Release or Space to simulate clean agent discharge drill · Click cylinders',
  aria: 'Isometric clean agent gas fire suppression system with 4 high-pressure FM-200 cylinders, overhead discharge manifold nozzles, VESDA laser smoke aspirating detector, and emergency abort/release station.',
  css: `
    [data-fig="audira-fire"] .gas-cylinder { cursor:pointer; }
    [data-fig="audira-fire"] .gas-cylinder:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-fire"] .pull-station { cursor:pointer; }
    [data-fig="audira-fire"] .pull-station:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-fire"] .manifold-pipe { fill:none; stroke:var(--accent); stroke-width:3; stroke-linecap:round; filter:url(#soft); }
    [data-fig="audira-fire"] .vesda-pipe { fill:none; stroke:var(--line); stroke-width:1.6; }
    [data-fig="audira-fire"] .vesda-laser { fill:none; stroke:var(--accent-hi); stroke-width:2; stroke-linecap:round; stroke-dasharray:8 14; filter:url(#glow); }
    [data-fig="audira-fire"] .gas-spray { fill:none; stroke:var(--accent-hi); stroke-width:1.6; opacity:0; filter:url(#glow); transition:opacity .3s; }
    [data-fig="audira-fire"] .gas-spray.discharging { opacity:.9; }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [20, 20, 210], [320, 20, 210], [20, 240, 210], [320, 240, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="vesda-lcd-clip"><rect x="4" y="3" width="62" height="18" rx="2"/></clipPath>
    </defs>`;

    // Base Floor Plate (Fire Protection Zone boundary)
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Hazard zone perimeter demarcation stripes -->
      <line class="detail" x1="40" y1="40" x2="300" y2="40"/>
      <line class="detail" x1="40" y1="210" x2="300" y2="210"/>
      <text class="label" x="40" y="248" font-size="4" letter-spacing="1.5">CLEAN AGENT FIRE SUPPRESSION · NOVEC 1230 / FM-200 · NON-CONDUCTIVE GAS</text>
    </g>`;

    // BACK WALL & STEEL MOUNTING RACK
    const WX = 35, WY = 30, WZ = PLZ, WW = 12, WD = 200, WH = 175;
    svg += box(WX, WY, WZ, WW, WD, WH, 4);
    svg += `<g transform="${SIDE(WX + WW, WY + WD, WZ + WH)}">
      ${slits(16, WD - 16, 4, 15, WH - 15)}
      <text class="label" x="20" y="45" font-size="5" letter-spacing="1">ZONE 01 · CLEAN AGENT BANK</text>
    </g>`;

    // 4 HIGH-PRESSURE GAS CYLINDERS (Mounted along back wall)
    // Cylinders: X=60 to 180, Y=65 to 185
    const CYL_R = 14, CYL_H = 100, CYL_Z = PLZ + 6;
    [65, 105, 145, 185].forEach((cy, idx) => {
      const cx = WX + WW + 14;
      svg += `<g class="gas-cylinder" id="cyl-${idx}">`;
      // Cylinder Base Platform
      svg += box(cx, cy, CYL_Z, 28, 28, CYL_H, 14);

      // Top Dome & Brass Discharge Solenoid Valve Head
      const TOP_Z = CYL_Z + CYL_H;
      svg += box(cx + 4, cy + 4, TOP_Z, 20, 20, 16, 8);
      svg += `<g transform="${TOP(cx + 4, cy + 4, TOP_Z + 16)}">
        <!-- Pressure Gauge Manometer -->
        <circle class="face recess" cx="10" cy="10" r="7"/>
        <line class="detail" stroke="var(--accent-hi)" stroke-width="1.8" x1="10" y1="10" x2="10" y2="4"/>
        <text class="label" x="10" y="18" font-size="2.4" text-anchor="middle">50 BAR</text>
      </g>`;
      // Front Cylinder Label
      svg += `<g transform="${SIDE(cx + 28, cy + 28, TOP_Z)}">
        <text class="label" x="10" y="35" font-size="3.5" letter-spacing="1">FM-200 · 180L</text>
        <circle class="led hot" filter="url(#soft)" cx="14" cy="45" r="1.5"/>
      </g>`;
      svg += `</g>`;

      // High-pressure flexible discharge hose to overhead manifold
      const H_TOP = [cx + 14, cy + 14, TOP_Z + 16];
      const H_MID = [cx + 35, cy + 14, TOP_Z + 35];
      const H_MANI = [cx + 60, cy + 14, PLZ + 140];
      const hoseD = `M ${K.P(...H_TOP).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...H_MID).map(v => v.toFixed(1)).join(' ')}, ${K.P(...H_MANI).map(v => v.toFixed(1)).join(' ')}`;
      svg += `<path class="detail" stroke="var(--accent-hi)" stroke-width="2.2" d="${hoseD}"/>`;
    });

    // OVERHEAD DISCHARGE STEEL MANIFOLD PIPE (Z = PLZ + 140)
    const MANI_X = WX + WW + 74, MANI_Y0 = 55, MANI_Y1 = 195, MANI_Z = PLZ + 140;
    const maniD = `M ${K.P(MANI_X, MANI_Y0, MANI_Z).map(v => v.toFixed(1)).join(' ')} L ${K.P(MANI_X, MANI_Y1, MANI_Z).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="manifold-pipe" d="${maniD}"/>`;

    // 3 Ceiling Overhead Discharge Nozzles spraying downward
    [80, 125, 170].forEach((ny, idx) => {
      // Nozzle drop tube
      const N0 = [MANI_X, ny, MANI_Z];
      const N1 = [MANI_X + 30, ny, MANI_Z - 20];
      const nozD = `M ${K.P(...N0).map(v => v.toFixed(1)).join(' ')} L ${K.P(...N1).map(v => v.toFixed(1)).join(' ')}`;
      svg += `<path class="manifold-pipe" stroke-width="2" d="${nozD}"/>`;

      // Conical Gas Spray Cloud (Activated during drill)
      const S_TIP = N1;
      const sprayPts = [
        S_TIP,
        [MANI_X + 10, ny - 25, PLZ + 10],
        [MANI_X + 50, ny + 25, PLZ + 10],
        S_TIP
      ];
      svg += `<path class="gas-spray" id="spray-${idx}" d="${path(sprayPts)}Z"/>`;
    });

    // VESDA LASER SMOKE ASPIRATING DETECTION MODULE (Mounted on wall left)
    const VX = WX + WW + 8, VY = 25, VZ = PLZ + 105, VW = 32, VD = 28, VH = 40;
    svg += box(VX, VY, VZ, VW, VD, VH, 4);
    svg += `<g transform="${FRONT(VX, VY + VD, VZ + VH)}">
      <rect class="face recess" x="3" y="4" width="${VW - 6}" height="${VH - 8}" rx="2"/>
      <circle class="led hot" filter="url(#soft)" cx="10" cy="12" r="2"/>
      <text class="label" x="15" y="14" font-size="3.2">VESDA VLI</text>
      <!-- Aspirating Smoke Obscuration Display -->
      <g clip-path="url(#vesda-lcd-clip)" transform="translate(3 18)">
        <text class="scr-accent" id="vesda-ppm-txt" x="2" y="8" font-size="2.8">0.000% OBS/M</text>
        <text class="scr" x="2" y="14" font-size="2.6">LASER: ARMED</text>
      </g>
    </g>`;

    // Sampling Air Pipe running across room with animated photon laser sampling stream
    const S0 = [VX + 16, VY + 10, VZ + VH - 5];
    const S1 = [VX + 120, VY + 10, VZ + VH + 10];
    const S2 = [VX + 180, VY + 140, VZ + VH + 5];
    const sampD = `M ${K.P(...S0).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...S1).map(v => v.toFixed(1)).join(' ')}, ${K.P(...S2).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="vesda-pipe" d="${sampD}"/>`;
    svg += `<path class="vesda-laser" d="${sampD}">
      <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1.2s" repeatCount="indefinite"/>
    </path>`;

    // EMERGENCY MANUAL PULL / ABORT STATION (Front Floor Pedestal)
    const PULL_X = 220, PULL_Y = 175, PULL_Z = PLZ, PULL_W = 38, PULL_D = 28, PULL_H = 55;
    svg += `<g class="pull-station" id="fire-pull-station">`;
    svg += box(PULL_X, PULL_Y, PULL_Z, PULL_W, PULL_D, PULL_H, 3);
    svg += `<g transform="${FRONT(PULL_X, PULL_Y + PULL_D, PULL_Z + PULL_H)}">
      <rect class="face recess" x="4" y="6" width="${PULL_W - 8}" height="${PULL_H - 12}" rx="2"/>
      <!-- Dual Buttons: Abort and Manual Release -->
      <circle class="led hot" id="fire-strobe-led" filter="url(#glow)" cx="19" cy="16" r="3.5">
        <animate attributeName="r" values="2.5; 4.5; 2.5" dur="1s" repeatCount="indefinite"/>
      </circle>
      <rect class="face glass hot" x="8" y="24" width="22" height="12" rx="2"/>
      <text class="scr-accent" x="19" y="32" font-size="2.6" text-anchor="middle">MANUAL</text>
      <text class="label" x="19" y="44" font-size="2.8" text-anchor="middle">RELEASE</text>
    </g>`;
    svg += `</g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      discharging: false,
      countdown: 30,
      smokePpm: 0.000,
      pressureBar: 50,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function fireAudio(f, dur = 0.08, type = 'sawtooth') {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) {}
    }

    function triggerDischarge() {
      st.discharging = !st.discharging;
      fireAudio(st.discharging ? 1600 : 400, 0.35, 'square');

      const sprays = stage.querySelectorAll('.gas-spray');
      sprays.forEach(s => s.classList.toggle('discharging', st.discharging));

      render();
    }

    // VESDA Air Sampling Jitter & Countdown Loop
    st.timer = api.every(50, () => {
      st.tick++;

      if (st.discharging) {
        st.smokePpm = (0.045 + Math.sin(st.tick * 0.3) * 0.01).toFixed(3);
        const pTxt = q('#vesda-ppm-txt');
        if (pTxt) pTxt.textContent = `ALERT: ${st.smokePpm}%`;
      } else {
        st.smokePpm = (0.001 + Math.abs(Math.sin(st.tick * 0.1)) * 0.002).toFixed(3);
        const pTxt = q('#vesda-ppm-txt');
        if (pTxt && st.tick % 8 === 0) pTxt.textContent = `${st.smokePpm}% OBS/M`;
      }
    });

    function render() {
      api.power(true);
      api.readout(
        st.discharging
          ? `FIRE ALARM DISCHARGE ACTIVE · FM-200 RELEASED (50 BAR) · HALON REPLACEMENT`
          : `FIRE SYSTEM ARMED · VESDA LASER SENSORS OK (0 PPM) · 4x CYLINDERS 50 BAR`
      );
    }

    stage.addEventListener('click', e => {
      if (e.target.closest('#fire-pull-station') || e.target.closest('.gas-cylinder')) {
        triggerDischarge();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ' || e.key === '1') {
          triggerDischarge();
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        triggerDischarge();
      }
    };
  }
});
