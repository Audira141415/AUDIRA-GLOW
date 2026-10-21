/* Fig 7 — Audira 2.5 MVA Industrial Diesel Backup Generator & ATS */
FIGS.push({
  id: 'audira-generator',
  name: 'Diesel Generator 2.5MVA',
  hint: 'Click ATS Switch or Space to simulate mains grid failure · Click engine to inspect',
  aria: 'Isometric 2.5 MVA industrial data center backup diesel generator with V16 engine block, overhead dual exhaust mufflers, high-output cooling radiator fan, day fuel tank, and automatic transfer switch cabinet.',
  css: `
    [data-fig="audira-generator"] .gen-engine { cursor:pointer; }
    [data-fig="audira-generator"] .gen-engine:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-generator"] .ats-switch { cursor:pointer; }
    [data-fig="audira-generator"] .ats-switch:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-generator"] .fan-blade { stroke:var(--accent-hi) !important; stroke-width:2.4px !important; stroke-linecap:round; filter:url(#soft); }
    [data-fig="audira-generator"] .exhaust-puff { fill:none; stroke:var(--accent); stroke-width:1.8; opacity:.7; filter:url(#glow); }
    [data-fig="audira-generator"] .fuel-line { fill:none; stroke:var(--accent-hi); stroke-width:2.2; stroke-linecap:round; stroke-dasharray:10 20; filter:url(#glow); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [20, 20, 200], [320, 20, 200], [20, 240, 200], [320, 240, 200]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="gen-lcd-clip"><rect x="4" y="3" width="76" height="18" rx="2"/></clipPath>
    </defs>`;

    // Heavy Concrete Skid Base Plate
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Vibration isolation dampener mount pads -->
      ${[40, 140, 240].map(x => `
        <circle class="face recess" cx="${x}" cy="45" r="5"/>
        <circle class="face recess" cx="${x}" cy="195" r="5"/>
      `).join('')}
      <text class="label" x="40" y="248" font-size="4" letter-spacing="1.5">EMERGENCY POWER SYSTEM · 2500 kVA V16 TURBOCHARGED STANDBY GENERATOR</text>
    </g>`;

    // DIESEL GENERATOR ASSEMBLY (X=40, Y=35, W=210, D=160)
    const GX = 40, GY = 35;

    // 1. Heavy Base Fuel Day Tank (Sub-base belly tank)
    const TANK_H = 22;
    svg += box(GX, GY, PLZ, 210, 160, TANK_H, 6);
    svg += `<g transform="${FRONT(GX, GY + 160, PLZ + TANK_H)}">
      <rect class="face recess" x="12" y="5" width="60" height="12" rx="2"/>
      <text class="scr-accent" id="gen-fuel-txt" x="16" y="13" font-size="3.5">DIESEL: 4,200 L [94%]</text>
      ${slits(80, 195, 3, 5, TANK_H - 5)}
    </g>`;

    // 2. High-Efficiency Radiator Cooling Fan Housing (Front of Generator)
    const RAD_X = GX + 140, RAD_Y = GY + 10, RAD_Z = PLZ + TANK_H;
    const RAD_W = 60, RAD_D = 140, RAD_H = 95;
    svg += box(RAD_X, RAD_Y, RAD_Z, RAD_W, RAD_D, RAD_H, 4);
    svg += `<g transform="${SIDE(RAD_X + RAD_W, RAD_Y + RAD_D, RAD_Z + RAD_H)}">
      <!-- Big Radiator Fan Shroud -->
      <circle class="face recess" cx="70" cy="48" r="42"/>
      <circle class="led hot" id="gen-fan-hub" filter="url(#soft)" cx="70" cy="48" r="5"/>
      <!-- Rotating Industrial Radiator Fan Blades -->
      <g id="gen-fan-rotor">
        <animateTransform attributeName="transform" type="rotate" from="0 70 48" to="360 70 48" dur="0.4s" repeatCount="indefinite"/>
        ${Array.from({ length: 8 }, (_, i) => {
          const rad = (i * 45 * Math.PI) / 180;
          return `<line class="fan-blade" x1="70" y1="48" x2="${(70 + 36 * Math.cos(rad)).toFixed(1)}" y2="${(48 + 36 * Math.sin(rad)).toFixed(1)}"/>`;
        }).join('')}
      </g>
    </g>`;

    // 3. V16 Heavy Diesel Engine Block & Cylinder Heads (Center)
    const ENG_X = GX + 25, ENG_Y = GY + 25, ENG_Z = PLZ + TANK_H;
    const ENG_W = 110, ENG_D = 110, ENG_H = 75;
    svg += `<g class="gen-engine" id="gen-engine-block">`;
    svg += box(ENG_X, ENG_Y, ENG_Z, ENG_W, ENG_D, ENG_H, 8);
    svg += `<g transform="${TOP(ENG_X, ENG_Y, ENG_Z + ENG_H)}">
      <!-- Dual V-Bank Valve Covers -->
      <rect class="face recess" x="8" y="12" width="${ENG_W - 16}" height="32" rx="3"/>
      ${slits(12, ENG_W - 12, 4, 16, 40)}
      <rect class="face recess" x="8" y="66" width="${ENG_W - 16}" height="32" rx="3"/>
      ${slits(12, ENG_W - 12, 4, 70, 94)}
      <text class="label" x="55" y="58" font-size="4" text-anchor="middle" letter-spacing="1">V16 DIESEL · 1500 RPM</text>
    </g>`;
    svg += `</g>`;

    // 4. Dual Overhead Industrial Exhaust Mufflers & Rain Caps
    [ENG_Y + 28, ENG_Y + 76].forEach((my, idx) => {
      const MZ = ENG_Z + ENG_H;
      // Vertical exhaust riser pipes
      svg += box(ENG_X + 25, my, MZ, 16, 16, 28, 7);
      // Silencer body
      svg += box(ENG_X + 15, my - 4, MZ + 28, 36, 24, 20, 8);
      // Exhaust Puff Animation
      svg += `<circle class="exhaust-puff" id="gen-exhaust-${idx}" cx="${K.P(ENG_X + 25, my + 8, MZ + 55)[0]}" cy="${K.P(ENG_X + 25, my + 8, MZ + 55)[1]}" r="4">
        <animate attributeName="r" values="3; 9; 3" dur="0.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8; 0.1; 0.8" dur="0.8s" repeatCount="indefinite"/>
      </circle>`;
    });

    // 5. Fuel Delivery Line from Sub-base Tank
    const F0 = [GX + 20, GY + 140, PLZ + 10];
    const F1 = [GX + 10, GY + 100, PLZ + 45];
    const F2 = [ENG_X + 10, ENG_Y + 20, ENG_Z + 15];
    const fuelD = `M ${K.P(...F0).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...F1).map(v => v.toFixed(1)).join(' ')}, ${K.P(...F2).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="detail" stroke="var(--line)" stroke-width="2" d="${fuelD}"/>`;
    svg += `<path class="fuel-line" d="${fuelD}">
      <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1s" repeatCount="indefinite"/>
    </path>`;

    // 6. Automatic Transfer Switch (ATS) Cabinet (Mounted on Right Skid)
    const ATS_X = 265, ATS_Y = 50, ATS_Z = PLZ, ATS_W = 55, ATS_D = 130, ATS_H = 125;
    svg += `<g class="ats-switch" id="ats-cabinet">`;
    svg += box(ATS_X, ATS_Y, ATS_Z, ATS_W, ATS_D, ATS_H, 4);

    // Front Control Panel of ATS
    svg += `<g transform="${FRONT(ATS_X, ATS_Y + ATS_D, ATS_Z + ATS_H)}">
      <text class="label" x="8" y="14" font-size="4.5" letter-spacing="1">ATS CONTROLLER</text>
      <!-- Mode & Frequency LCD -->
      <rect class="face recess" x="6" y="20" width="43" height="24" rx="2"/>
      <rect class="halo hot" x="8" y="22" width="39" height="20" rx="1.5" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="8" y="22" width="39" height="20" rx="1.5"/>
      <g clip-path="url(#gen-lcd-clip)" transform="translate(6 20)">
        <text class="scr" x="4" y="8" font-size="3.2">GRID: 400V 50Hz</text>
        <text class="scr-accent" id="ats-status-txt" x="4" y="16" font-size="3.4">STATUS: STANDBY</text>
      </g>

      <!-- Big Rotary Utility / Generator Selector -->
      <circle class="face recess" cx="27" cy="62" r="14"/>
      <line class="detail" id="ats-switch-arm" stroke="var(--accent-hi)" stroke-width="2.4" stroke-linecap="round" x1="27" y1="62" x2="27" y2="52"/>
      <text class="label" x="12" y="84" font-size="3">PLN</text>
      <text class="label" x="42" y="84" font-size="3" text-anchor="end">GEN</text>

      <!-- Indicator Lights -->
      <circle class="led hot" id="led-mains" filter="url(#soft)" cx="14" cy="94" r="2.5"/>
      <circle class="led" id="led-gen" cx="40" cy="94" r="2.5"/>
      ${slits(6, 49, 3, 102, ATS_H - 10)}
    </g>`;
    svg += `</g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Real-Time Logic ---------- */
    const st = {
      mainsOnline: true,
      genRunning: false,
      rpm: 0,
      kwOutput: 0,
      fuelPct: 94,
      fanDeg: 0,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function genAudio(f, dur = 0.08, type = 'sawtooth') {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) {}
    }

    function togglePowerFail() {
      st.mainsOnline = !st.mainsOnline;
      st.genRunning = !st.mainsOnline;

      genAudio(st.genRunning ? 220 : 880, 0.35, 'sawtooth');

      const arm = q('#ats-switch-arm');
      if (arm) arm.setAttribute('transform', st.genRunning ? 'rotate(45 27 62)' : 'rotate(-45 27 62)');

      const lMains = q('#led-mains'), lGen = q('#led-gen');
      if (lMains) lMains.classList.toggle('hot', st.mainsOnline);
      if (lGen) lGen.classList.toggle('hot', st.genRunning);

      const stTxt = q('#ats-status-txt');
      if (stTxt) stTxt.textContent = st.genRunning ? 'STATUS: DIESEL ON' : 'STATUS: MAINS OK';

      render();
    }

    // Engine Rotation & Telemetry Vibration Loop
    st.timer = api.every(45, () => {
      st.tick++;

      if (st.genRunning) {
        st.rpm = 1500 + Math.floor(Math.sin(st.tick * 0.4) * 12);
        st.kwOutput = 1840 + Math.floor(Math.sin(st.tick * 0.3) * 35);
        st.fanDeg = (st.fanDeg + 25) % 360;
        const fRotor = q('#gen-fan-rotor');
        if (fRotor) fRotor.setAttribute('transform', `rotate(${st.fanDeg} 70 48)`);
      } else {
        st.rpm = 0;
        st.kwOutput = 0;
        st.fanDeg = (st.fanDeg + 6) % 360; // idle wind down
        const fRotor = q('#gen-fan-rotor');
        if (fRotor) fRotor.setAttribute('transform', `rotate(${st.fanDeg} 70 48)`);
      }
    });

    function render() {
      api.power(true);
      api.readout(
        st.genRunning
          ? `GRID OUTAGE · DIESEL GEN V16 ACTIVE · ${st.rpm} RPM · 2.5 MVA LOAD: ${st.kwOutput} kW`
          : `MAINS UTILITY ONLINE · ATS STANDBY · GEN COOLDOWN READY · FUEL: ${st.fuelPct}%`
      );
    }

    stage.addEventListener('click', e => {
      if (e.target.closest('#ats-cabinet') || e.target.closest('#gen-engine-block')) {
        togglePowerFail();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          togglePowerFail();
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        togglePowerFail();
      }
    };
  }
});
