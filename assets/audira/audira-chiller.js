/* Fig 2 — Audira Liquid Cooling Distribution Unit (CDU & Chiller) */
FIGS.push({
  id: 'audira-chiller',
  name: 'Liquid Chiller & CDU',
  hint: 'Click pump switches to toggle · Click valve knob to regulate flow · Space purge',
  aria: 'Isometric enterprise liquid cooling distribution unit (CDU) with dual redundant centrifugal pumps, flow rate display, analog pressure gauges, and radiator fans.',
  css: `
    [data-fig="audira-chiller"] .cdu-pump { cursor:pointer; }
    [data-fig="audira-chiller"] .cdu-pump:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-chiller"] .cdu-valve { cursor:pointer; }
    [data-fig="audira-chiller"] .cdu-valve:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-chiller"] .pressure-needle { stroke:var(--accent-hi); stroke-width:1.4; stroke-linecap:round; vector-effect:non-scaling-stroke; transition:transform .1s ease-out; }
    [data-fig="audira-chiller"] .chiller-pipe { fill:none; stroke:var(--accent); stroke-width:2.5; stroke-linecap:round; filter:url(#soft); opacity:.85; }
    [data-fig="audira-chiller"] .chiller-blade { stroke:var(--accent-hi) !important; stroke-width:2.2px !important; stroke-linecap:round; filter:url(#soft); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 240, 0], [320, 0, 7], [320, 240, 0], [0, 0, 7],
      [40, 30, 180], [280, 30, 180], [40, 210, 180], [280, 210, 180]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits, esc = api.iso.esc;

    const PLZ = 7;
    const BX = 50, BY = 35, BW = 220, BD = 170, BH = 110, BT = PLZ + BH, BF = BY + BD;

    let svg = `<defs>
      <clipPath id="cdu-lcd-clip"><rect x="4" y="3" width="76" height="18" rx="2"/></clipPath>
      <clipPath id="gauge-clip-1"><rect x="4" y="4" width="32" height="32" rx="16"/></clipPath>
      <clipPath id="gauge-clip-2"><rect x="4" y="4" width="32" height="32" rx="16"/></clipPath>
    </defs>`;

    // Floor Base Plate (Water containment bund)
    svg += box(0, 0, 0, 320, 240, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="304" height="224" rx="10"/>
      <rect class="face recess" x="30" y="25" width="260" height="190" rx="6"/>
      <text class="label" x="38" y="228" font-size="4" letter-spacing="1.5">SECONDARY CONTAINMENT · LEAK SENSOR ACTIVE</text>
    </g>`;

    // Heavy Industrial Chiller Chassis
    svg += box(BX, BY, PLZ, BW, BD, BH, 6);

    // Top Radiator Exhaust Grille
    svg += box(BX + 20, BY + 20, BT, 180, 130, 10, 4);
    svg += `<g transform="${TOP(BX + 20, BY + 20, BT + 10)}">
      <circle class="face recess" cx="45" cy="65" r="38"/>
      <circle class="led hot" id="cdu-fan-1" filter="url(#soft)" cx="45" cy="65" r="3.5"/>
      <g id="cdu-fan-rotor-1">
        <animateTransform attributeName="transform" type="rotate" from="0 45 65" to="360 45 65" dur="0.4s" repeatCount="indefinite"/>
        ${Array.from({ length: 8 }, (_, i) => {
          const rad = (i * 45 * Math.PI) / 180;
          return `<line class="chiller-blade" x1="45" y1="65" x2="${(45 + 32 * Math.cos(rad)).toFixed(1)}" y2="${(65 + 32 * Math.sin(rad)).toFixed(1)}"/>`;
        }).join('')}
      </g>

      <circle class="face recess" cx="135" cy="65" r="38"/>
      <circle class="led hot" id="cdu-fan-2" filter="url(#soft)" cx="135" cy="65" r="3.5"/>
      <g id="cdu-fan-rotor-2">
        <animateTransform attributeName="transform" type="rotate" from="360 135 65" to="0 135 65" dur="0.52s" repeatCount="indefinite"/>
        ${Array.from({ length: 8 }, (_, i) => {
          const rad = (i * 45 * Math.PI) / 180;
          return `<line class="chiller-blade" x1="135" y1="65" x2="${(135 + 32 * Math.cos(rad)).toFixed(1)}" y2="${(65 + 32 * Math.sin(rad)).toFixed(1)}"/>`;
        }).join('')}
      </g>
    </g>`;

    // Front Control Panel & Manifold
    svg += `<g transform="${FRONT(BX, BF, BT)}">
      <!-- Title header -->
      <text class="label" x="12" y="14" font-size="6" letter-spacing="1.5">AUDIRA · CDU CHILLER 500kW</text>
      <circle class="led hot" filter="url(#soft)" cx="${BW - 16}" cy="12" r="2"/>

      <!-- Digital Telemetry Screen -->
      <rect class="face recess" x="12" y="20" width="84" height="24" rx="3"/>
      <rect class="halo hot" x="14" y="22" width="80" height="20" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="14" y="22" width="80" height="20" rx="2"/>
      <g clip-path="url(#cdu-lcd-clip)" transform="translate(14 22)">
        <text class="scr" x="4" y="8" font-size="4">FLOW: 54.2 L/MIN</text>
        <text class="scr-accent" id="cdu-temp-read" x="4" y="15" font-size="4.2">CHILLED: 16.4°C</text>
      </g>

      <!-- Dual Analog Pressure Gauges -->
      <!-- Gauge 1: Intake Pressure -->
      <g transform="translate(110 20)">
        <circle class="face recess" cx="18" cy="18" r="16"/>
        <path class="detail" d="M8 22 A12 12 0 1 1 28 22"/>
        <line class="pressure-needle" id="gauge-needle-1" x1="18" y1="18" x2="18" y2="8" transform="rotate(-15 18 18)"/>
        <circle class="face recess" cx="18" cy="18" r="2.5"/>
        <text class="label" x="18" y="26" font-size="3" text-anchor="middle">BAR IN</text>
      </g>

      <!-- Gauge 2: Return Pressure -->
      <g transform="translate(155 20)">
        <circle class="face recess" cx="18" cy="18" r="16"/>
        <path class="detail" d="M8 22 A12 12 0 1 1 28 22"/>
        <line class="pressure-needle" id="gauge-needle-2" x1="18" y1="18" x2="18" y2="8" transform="rotate(25 18 18)"/>
        <circle class="face recess" cx="18" cy="18" r="2.5"/>
        <text class="label" x="18" y="26" font-size="3" text-anchor="middle">BAR OUT</text>
      </g>

      <!-- Airflow vents below -->
      ${slits(12, BW - 12, 3, 56, BH - 12)}
    </g>`;

    // Dual Centrifugal Pumps on Front Deck
    const PUMP_Y = BF;
    const PUMPS = [
      { id: '1', x: BX + 30, name: 'PUMP 01 (PRIMARY)' },
      { id: '2', x: BX + 120, name: 'PUMP 02 (BACKUP)' }
    ];

    PUMPS.forEach(p => {
      svg += `<g class="cdu-pump" id="cdu-pump-${p.id}" data-id="${p.id}">`;
      svg += box(p.x, PUMP_Y, PLZ, 70, 35, 30, 4);
      svg += `<g transform="${FRONT(p.x, PUMP_Y + 35, PLZ + 30)}">
        <circle class="face recess" cx="20" cy="16" r="8"/>
        <circle class="led hot" id="pump-led-${p.id}" filter="url(#soft)" cx="20" cy="16" r="2.5"/>
        <text class="label" x="35" y="18" font-size="3.5">${p.name}</text>
      </g>`;
      svg += `</g>`;
    });

    // Rotary Valve Regulating Knob (Right Deck)
    const VALVE_X = BX + BW - 45, VALVE_Y = BF + 6;
    svg += `<g class="cdu-valve" id="cdu-valve">
      ${box(VALVE_X, VALVE_Y, PLZ, 30, 30, 16, 15)}
      <g transform="${TOP(VALVE_X, VALVE_Y, PLZ + 16)}">
        <circle class="face recess" cx="15" cy="15" r="11"/>
        <line class="detail" id="cdu-valve-ptr" x1="15" y1="15" x2="15" y2="4"/>
        <text class="label" x="15" y="22" font-size="3.2" text-anchor="middle">VALVE</text>
      </g>
    </g>`;

    // Heavy Coolant Loop Hoses (Side to Floor)
    const H0 = [BX + 5, BF - 20, PLZ + 40];
    const H1 = [BX - 25, BF + 20, 10];
    const H2 = [BX + 60, BF + 50, 9];
    const hoseD1 = `M ${K.P(...H0).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...H1).map(v => v.toFixed(1)).join(' ')}, ${K.P(...H2).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="chiller-pipe" d="${hoseD1}"/>`;
    svg += `<path id="cdu-stream-1" d="${hoseD1}" fill="none" stroke="var(--accent-hi)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="30 70" filter="url(#glow)">
      <animate attributeName="stroke-dashoffset" from="200" to="0" dur="1.2s" repeatCount="indefinite"/>
    </path>`;

    const H3 = [BX + 15, BF - 30, PLZ + 35];
    const H4 = [BX - 35, BF + 10, 10];
    const H5 = [BX + 150, BF + 50, 9];
    const hoseD2 = `M ${K.P(...H3).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...H4).map(v => v.toFixed(1)).join(' ')}, ${K.P(...H5).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="chiller-pipe" d="${hoseD2}"/>`;
    svg += `<path id="cdu-stream-2" d="${hoseD2}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="30 70" filter="url(#glow)">
      <animate attributeName="stroke-dashoffset" from="200" to="0" dur="1.4s" repeatCount="indefinite"/>
    </path>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      pump1: true,
      pump2: false,
      flowRate: 54.2,
      temp: 16.4,
      valvePct: 65,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function chillerBeep(f, dur = 0.08) {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) { }
    }

    function togglePump(id) {
      if (id === '1') st.pump1 = !st.pump1;
      if (id === '2') st.pump2 = !st.pump2;
      chillerBeep(st.pump1 || st.pump2 ? 600 : 250);
      recalcCooling();
    }

    function recalcCooling() {
      const activePumps = (st.pump1 ? 1 : 0) + (st.pump2 ? 1 : 0);
      st.flowRate = (activePumps * (st.valvePct / 100) * 44 + 4).toFixed(1);
      st.temp = (24.0 - activePumps * 4.2 - (st.valvePct / 100) * 3.4).toFixed(1);

      const q1 = q('#pump-led-1');
      if (q1) q1.classList.toggle('hot', st.pump1);
      const q2 = q('#pump-led-2');
      if (q2) q2.classList.toggle('hot', st.pump2);

      const tEl = q('#cdu-temp-read');
      if (tEl) tEl.textContent = `CHILLED: ${st.temp}°C`;

      render();
    }

    let pulseTick = 0;
    st.fanDeg = 0;
    st.timer = api.every(45, () => {
      pulseTick++;
      // Needle deflection according to flow rate & pressure
      const g1 = q('#gauge-needle-1'), g2 = q('#gauge-needle-2');
      if (g1) {
        const ang1 = -35 + (st.flowRate / 80) * 70 + Math.sin(pulseTick * 0.3) * 3;
        g1.setAttribute('transform', `rotate(${ang1.toFixed(1)} 18 18)`);
      }
      if (g2) {
        const ang2 = 5 + (st.flowRate / 80) * 55 + Math.cos(pulseTick * 0.35) * 3;
        g2.setAttribute('transform', `rotate(${ang2.toFixed(1)} 18 18)`);
      }

      // Continuous radiator fan rotation
      if (st.pump1 || st.pump2) {
        st.fanDeg = (st.fanDeg + 20) % 360;
        const f1 = q('#cdu-fan-rotor-1');
        if (f1) f1.setAttribute('transform', `rotate(${st.fanDeg} 45 65)`);
        const f2 = q('#cdu-fan-rotor-2');
        if (f2) f2.setAttribute('transform', `rotate(${-st.fanDeg * 1.15} 135 65)`);
      }
    });

    function render() {
      api.power(st.pump1 || st.pump2);
      api.readout(
        `CDU CHILLER · FLOW: ${st.flowRate} L/MIN · TEMP: ${st.temp}°C · VALVE: ${st.valvePct}%`
      );
    }

    stage.addEventListener('click', e => {
      const p = e.target.closest('.cdu-pump');
      if (p && p.dataset.id) {
        togglePump(p.dataset.id);
        return;
      }
      if (e.target.closest('#cdu-valve')) {
        st.valvePct = (st.valvePct + 25) % 100;
        if (st.valvePct === 0) st.valvePct = 30;
        const ang = (st.valvePct / 100) * 270 - 135;
        const ptr = q('#cdu-valve-ptr');
        if (ptr) ptr.setAttribute('transform', `rotate(${ang} 15 15)`);
        recalcCooling();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          st.valvePct = st.valvePct > 70 ? 40 : 95;
          recalcCooling();
          return true;
        }
        if (e.key === '1') { togglePump('1'); return true; }
        if (e.key === '2') { togglePump('2'); return true; }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        togglePump('2');
      }
    };
  }
});
