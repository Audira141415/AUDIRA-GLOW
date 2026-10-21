/* Fig 3 — Audira Enterprise Modular UPS & Battery Vault */
FIGS.push({
  id: 'audira-ups',
  name: 'Modular UPS Vault',
  hint: 'Click transfer switch or Space to simulate grid blackout · Click EPO button',
  aria: 'Isometric enterprise 120kVA modular UPS system with lithium battery storage drawers, static bypass switch, and live battery discharge telemetry.',
  css: `
    [data-fig="audira-ups"] .ups-switch { cursor:pointer; }
    [data-fig="audira-ups"] .ups-switch:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-ups"] .epo-btn { cursor:pointer; }
    [data-fig="audira-ups"] .epo-btn:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-ups"] .busbar-pipe { fill:none; stroke:var(--accent); stroke-width:2.4; stroke-linecap:round; filter:url(#soft); opacity:.85; }
    [data-fig="audira-ups"] .bat-cell { fill:var(--accent); opacity:.85; transition:opacity .15s ease-out; }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 240, 0], [320, 0, 7], [320, 240, 0], [0, 0, 7],
      [40, 30, 190], [280, 30, 190], [40, 210, 190], [280, 210, 190]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits, esc = api.iso.esc;

    const PLZ = 7;
    const BX = 55, BY = 35, BW = 210, BD = 160, BH = 145, BT = PLZ + BH, BF = BY + BD;

    let svg = `<defs>
      <clipPath id="ups-mon-clip"><rect x="6" y="4" width="76" height="18" rx="2"/></clipPath>
    </defs>`;

    // Floor Base Plate
    svg += box(0, 0, 0, 320, 240, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="304" height="224" rx="10"/>
      <!-- Ground busbar grounding lines -->
      <line class="detail" x1="20" y1="40" x2="20" y2="220"/>
      <line class="detail" x1="300" y1="40" x2="300" y2="220"/>
      <text class="label" x="40" y="230" font-size="4" letter-spacing="1.5">DC FACILITY POWER · 400V 3-PHASE N+1 REDUNDANCY</text>
    </g>`;

    // Main UPS Heavy Cabinet Frame
    svg += box(BX, BY, PLZ, BW, BD, BH, 6);

    // Side Ventilation & High-Voltage Busway Entry
    svg += `<g transform="${SIDE(BX + BW, BF, BT)}">
      ${slits(16, 110, 3.2, 10, 45)}
      ${slits(16, 110, 3.2, 60, 95)}
      ${slits(16, 110, 3.2, 110, 145)}
      <text class="label" x="20" y="55" font-size="4.5" letter-spacing="1">HV INPUT A/B</text>
    </g>`;

    // Top Exhaust Fan Grille
    svg += box(BX + 25, BY + 20, BT, 160, 120, 8, 3);
    svg += `<g transform="${TOP(BX + 25, BY + 20, BT + 8)}">
      ${slits(10, 150, 4, 10, 110, true)}
      <text class="label" x="18" y="18" font-size="4.5" letter-spacing="1">HEAT EXHAUST</text>
    </g>`;

    // Front Control Panel Header
    svg += `<g transform="${FRONT(BX, BF, BT)}">
      <text class="label" x="12" y="14" font-size="6" font-weight="500" letter-spacing="1.5">AUDIRA · UPS-120kVA</text>
      <circle class="led hot" id="ups-mains-led" filter="url(#soft)" cx="${BW - 16}" cy="12" r="2.5"/>

      <!-- Digital Inverter Telemetry LCD -->
      <rect class="face recess" x="12" y="20" width="86" height="26" rx="3"/>
      <rect class="halo hot" x="14" y="22" width="82" height="22" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="14" y="22" width="82" height="22" rx="2"/>
      <g clip-path="url(#ups-mon-clip)" transform="translate(14 22)">
        <text class="scr" x="4" y="8" font-size="4">GRID: 400V · 50.0Hz</text>
        <text class="scr-accent" id="ups-status-txt" x="4" y="15" font-size="4.2">MODE: ONLINE (MAINS)</text>
      </g>

      <!-- Battery Runtime & Capacity Bar -->
      <rect class="face recess" x="110" y="20" width="86" height="26" rx="3"/>
      <text class="label" x="115" y="28" font-size="3.5">LITHIUM RESERVE</text>
      <rect class="face recess" x="115" y="32" width="76" height="8" rx="1.5"/>
      <rect class="bat-cell" id="ups-charge-bar" x="115" y="32" width="76" height="8" rx="1.5"/>
      <text class="scr" id="ups-runtime-txt" x="115" y="44" font-size="3.5">RUNTIME: 180 MIN [100%]</text>

      <line class="detail" x1="12" y1="52" x2="${BW - 12}" y2="52"/>
    </g>`;

    // 4 Modular Lithium Battery Drawers (Stacked)
    const BAT_H = 18, BAT_W = BW - 24, BAT_D = BD - 20;
    const BAT_Z0 = PLZ + 6;
    for (let b = 0; b < 4; b++) {
      const bz = BAT_Z0 + b * 22;
      svg += `<g class="ups-battery-pack" id="bat-pack-${b}">`;
      svg += box(BX + 12, BY + 10, bz, BAT_W, BAT_D, BAT_H, 2);
      svg += `<g transform="${FRONT(BX + 12, BF, bz + BAT_H)}">
        <text class="label" x="8" y="11" font-size="3.5">BATTERY BANK 0${b + 1} · LiFePO4</text>
        <!-- 8 Cell Status LEDs per drawer -->
        ${Array.from({ length: 8 }, (_, c) =>
        `<circle class="led hot ups-cell-led" id="cell-${b}-${c}" filter="url(#soft)" cx="${80 + c * 10}" cy="9" r="1.2"/>`
      ).join('')}
        <rect class="face recess" x="${BAT_W - 24}" y="6" width="16" height="7" rx="1.5"/>
        <text class="label" x="${BAT_W - 16}" y="11" font-size="3" text-anchor="middle">48V</text>
      </g>`;
      svg += `</g>`;
    }

    // Heavy Rotary Static Transfer Switch (Floor left)
    const SW_X = BX - 35, SW_Y = BF - 30;
    svg += `<g class="ups-switch" id="ups-trans-sw">
      ${box(SW_X, SW_Y, PLZ, 30, 30, 20, 15)}
      <g transform="${TOP(SW_X, SW_Y, PLZ + 20)}">
        <circle class="face recess" cx="15" cy="15" r="12"/>
        <line class="detail" id="ups-sw-pointer" x1="15" y1="15" x2="15" y2="5"/>
        <text class="label" x="15" y="24" font-size="3.2" text-anchor="middle">MAINS</text>
      </g>
    </g>`;

    // Emergency Power Off (EPO) Big Push Button (Floor right)
    const EPO_X = BX + BW + 6, EPO_Y = BF - 25;
    svg += `<g class="epo-btn" id="ups-epo-btn">
      ${box(EPO_X, EPO_Y, PLZ, 26, 26, 6, 4)}
      ${box(EPO_X + 4, EPO_Y + 4, PLZ + 6, 18, 18, 10, 9)}
      <g transform="${TOP(EPO_X + 4, EPO_Y + 4, PLZ + 16)}">
        <circle class="led hot" filter="url(#glow)" cx="9" cy="9" r="6"/>
        <text class="label" x="9" y="19" font-size="3" text-anchor="middle">EPO</text>
      </g>
    </g>`;

    // High Current Busbars & Glowing Power Pulses
    const P0 = [SW_X + 15, SW_Y + 15, PLZ + 10];
    const P1 = [SW_X + 5, BF + 25, 9];
    const P2 = [BX + 12, BF, PLZ + 15];
    const busD = `M ${K.P(...P0).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...P1).map(v => v.toFixed(1)).join(' ')}, ${K.P(...P2).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="busbar-pipe" d="${busD}"/>`;
    svg += `<path id="ups-power-stream" d="${busD}" fill="none" stroke="var(--accent-hi)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="25 60" filter="url(#glow)">
      <animate attributeName="stroke-dashoffset" from="170" to="0" dur="1s" repeatCount="indefinite"/>
    </path>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      gridOnline: true,
      batteryPct: 100,
      runtimeMin: 180,
      epoTripped: false,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function upsBeep(f, dur = 0.08, type = 'sine') {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) { }
    }

    function toggleGrid() {
      st.gridOnline = !st.gridOnline;
      upsBeep(st.gridOnline ? 880 : 380, 0.25, 'sawtooth');

      const swPtr = q('#ups-sw-pointer');
      if (swPtr) {
        swPtr.setAttribute('transform', st.gridOnline ? 'rotate(0 15 15)' : 'rotate(90 15 15)');
      }

      const stTxt = q('#ups-status-txt');
      if (stTxt) {
        stTxt.textContent = st.gridOnline ? 'MODE: ONLINE (MAINS)' : 'MODE: BATTERY INVERTER';
      }

      render();
    }

    function tripEPO() {
      st.epoTripped = !st.epoTripped;
      api.flash(q('#ups-epo-btn'), 300);
      upsBeep(1400, 0.4, 'square');
      st.gridOnline = !st.epoTripped;
      render();
    }

    // Battery runtime & cascading LED wave
    let tick = 0;
    st.timer = api.every(70, () => {
      tick++;

      // Cascading battery cell LED chasing wave across all 4 banks
      const step = tick % 8;
      for (let b = 0; b < 4; b++) {
        for (let c = 0; c < 8; c++) {
          const led = q(`#cell-${b}-${c}`);
          if (led) {
            const isWave = (c === (step + b) % 8) || (c === (step + b + 1) % 8);
            led.classList.toggle('hot', isWave || (st.gridOnline && c < 6));
          }
        }
      }

      if (!st.gridOnline && st.batteryPct > 5) {
        st.batteryPct = Math.max(5, st.batteryPct - 0.2);
        st.runtimeMin = Math.floor(st.batteryPct * 1.8);

        const bar = q('#ups-charge-bar');
        if (bar) bar.setAttribute('width', (st.batteryPct * 0.76).toFixed(1));

        const rTxt = q('#ups-runtime-txt');
        if (rTxt) rTxt.textContent = `RUNTIME: ${st.runtimeMin} MIN [${Math.floor(st.batteryPct)}%]`;

        if (tick % 15 === 0) upsBeep(500, 0.08); // Outage alarm beep
      } else if (st.gridOnline && st.batteryPct < 100) {
        st.batteryPct = Math.min(100, st.batteryPct + 0.3);
        st.runtimeMin = Math.floor(st.batteryPct * 1.8);
        const bar = q('#ups-charge-bar');
        if (bar) bar.setAttribute('width', (st.batteryPct * 0.76).toFixed(1));
      }
    });

    function render() {
      api.power(true);
      const mainsLed = q('#ups-mains-led');
      if (mainsLed) mainsLed.classList.toggle('hot', st.gridOnline);

      api.readout(
        st.gridOnline
          ? `UPS ONLINE · MAINS 400V OK · BATTERY: ${Math.floor(st.batteryPct)}% (180 MIN)`
          : `GRID BLACKOUT · ON BATTERY INVERTER · ${st.runtimeMin} MIN REMAINING`
      );
    }

    stage.addEventListener('click', e => {
      if (e.target.closest('#ups-trans-sw')) {
        toggleGrid();
        return;
      }
      if (e.target.closest('#ups-epo-btn')) {
        tripEPO();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          toggleGrid();
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        toggleGrid();
      }
    };
  }
});
