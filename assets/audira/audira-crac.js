/* Fig 8 — Audira Precision CRAC / CRAH In-Row Computer Room Air Handler */
FIGS.push({
  id: 'audira-crac',
  name: 'CRAC Air Handler',
  hint: 'Click blowers to step EC fan speed · Space triggers thermal boost · Keys 1–3',
  aria: 'Isometric enterprise downflow computer room air handler (CRAH/CRAC) unit with dual centrifugal EC fan impellers, chilled water heat exchanger coil, micro-climate ΔT controller, and subfloor plenum airflow.',
  css: `
    [data-fig="audira-crac"] .crac-blower { cursor:pointer; }
    [data-fig="audira-crac"] .crac-blower:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-crac"] .crac-valve { cursor:pointer; }
    [data-fig="audira-crac"] .crac-valve:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-crac"] .blower-fin { stroke:var(--accent-hi) !important; stroke-width:2.2px !important; stroke-linecap:round; filter:url(#soft); }
    [data-fig="audira-crac"] .airflow-stream { fill:none; stroke:var(--accent); stroke-width:2.2; stroke-linecap:round; stroke-dasharray:12 24; filter:url(#glow); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [30, 20, 210], [310, 20, 210], [30, 240, 210], [310, 240, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="crac-lcd-clip"><rect x="4" y="3" width="76" height="18" rx="2"/></clipPath>
    </defs>`;

    // Base Floor Plate (Perforated Cold-Aisle Floor Plenum)
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Perforated floor grilles where cold air exhausts -->
      ${Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 18 }, (_, c) =>
          `<circle class="face recess" cx="${65 + c * 12}" cy="${180 + r * 7}" r="1.4"/>`
        ).join('')
      ).join('')}
      <text class="label" x="40" y="248" font-size="4" letter-spacing="1.5">SUBFLOOR AIRFLOW PLENUM · DOWNFLOW DISCHARGE 18,500 CFM</text>
    </g>`;

    // CRAC CHASSIS (Tall precision cooling tower: X=80, Y=35, W=180, D=130, H=170)
    const CX = 80, CY = 35, CW = 180, CD = 130, CH = 170, CZ = PLZ;
    const CT = CZ + CH, CF = CY + CD;

    // Main Steel Housing
    svg += box(CX, CY, CZ, CW, CD, CH, 6);

    // Top Air Intake Louver Grille (Warm return air suction)
    svg += box(CX + 15, CY + 15, CT, CW - 30, CD - 30, 10, 4);
    svg += `<g transform="${TOP(CX + 15, CY + 15, CT + 10)}">
      ${slits(10, CW - 40, 3.5, 10, CD - 40, true)}
      <text class="label" x="18" y="18" font-size="4.2" letter-spacing="1">WARM RETURN AIR INTAKE · 24.5°C</text>
    </g>`;

    // Front Control Header (Digital Climate Microprocessor)
    svg += `<g transform="${FRONT(CX, CF, CT)}">
      <rect class="face recess" x="12" y="8" width="84" height="26" rx="3"/>
      <rect class="halo hot" x="14" y="10" width="80" height="22" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="14" y="10" width="80" height="22" rx="2"/>
      <g clip-path="url(#crac-lcd-clip)" transform="translate(14 10)">
        <text class="scr" x="4" y="8" font-size="3.8">SUPPLY: 17.2°C · ΔT 7.3°C</text>
        <text class="scr-accent" id="crac-cfm-txt" x="4" y="16" font-size="4">EC FANS: 85% · 18,500 CFM</text>
      </g>
      <text class="label" x="106" y="20" font-size="5" font-weight="500" letter-spacing="1.5">AUDIRA · CRAC-200</text>
      <circle class="led hot" filter="url(#soft)" cx="${CW - 16}" cy="18" r="2.5"/>
    </g>`;

    // Lower Inspection Window / Viewing Bay (Dual Centrifugal EC Impeller Fans)
    const FAN_Y = CY + CD;
    svg += `<g transform="${FRONT(CX, FAN_Y, CZ + 70)}">
      <rect class="face recess" x="12" y="4" width="${CW - 24}" height="58" rx="4"/>
      <rect class="halo hot" x="16" y="8" width="${CW - 32}" height="50" rx="3" filter="url(#bloom)"/>
      
      <!-- Impeller 1 Housing (Left) -->
      <circle class="face recess" cx="48" cy="33" r="24"/>
      <circle class="led hot" filter="url(#soft)" cx="48" cy="33" r="3"/>
      <g id="crac-rotor-1">
        <animateTransform attributeName="transform" type="rotate" from="0 48 33" to="360 48 33" dur="0.38s" repeatCount="indefinite"/>
        ${Array.from({ length: 8 }, (_, i) => {
          const rad = (i * 45 * Math.PI) / 180;
          return `<line class="blower-fin" x1="48" y1="33" x2="${(48 + 22 * Math.cos(rad)).toFixed(1)}" y2="${(33 + 22 * Math.sin(rad)).toFixed(1)}"/>`;
        }).join('')}
      </g>

      <!-- Impeller 2 Housing (Right) -->
      <circle class="face recess" cx="112" cy="33" r="24"/>
      <circle class="led hot" filter="url(#soft)" cx="112" cy="33" r="3"/>
      <g id="crac-rotor-2">
        <animateTransform attributeName="transform" type="rotate" from="360 112 33" to="0 112 33" dur="0.42s" repeatCount="indefinite"/>
        ${Array.from({ length: 8 }, (_, i) => {
          const rad = (i * 45 * Math.PI) / 180;
          return `<line class="blower-fin" x1="112" y1="33" x2="${(112 + 22 * Math.cos(rad)).toFixed(1)}" y2="${(33 + 22 * Math.sin(rad)).toFixed(1)}"/>`;
        }).join('')}
      </g>
    </g>`;

    // Downflow Airflow Streaming Lines emerging from base into floor
    [CX + 35, CX + 75, CX + 115, CX + 145].forEach((ax, idx) => {
      const A0 = [ax, CF - 4, CZ + 10];
      const A1 = [ax, CF + 20, 10];
      const A2 = [ax, CF + 55, 9];
      const airD = `M ${K.P(...A0).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...A1).map(v => v.toFixed(1)).join(' ')}, ${K.P(...A2).map(v => v.toFixed(1)).join(' ')}`;
      svg += `<path class="airflow-stream" d="${airD}">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="${(0.7 + idx * 0.15).toFixed(2)}s" repeatCount="indefinite"/>
      </path>`;
    });

    // Side Chilled Water Supply & Return Actuator Valve
    const V_X = CX - 25, V_Y = CY + 40, V_Z = PLZ;
    svg += box(V_X, V_Y, V_Z, 20, 45, 55, 3);
    svg += `<g class="crac-valve" id="crac-actuator-valve">
      ${box(V_X - 6, V_Y + 12, V_Z + 55, 32, 22, 18, 6)}
      <g transform="${TOP(V_X - 6, V_Y + 12, V_Z + 73)}">
        <circle class="face recess" cx="16" cy="11" r="8"/>
        <line class="detail" id="crac-valve-ptr" stroke="var(--accent-hi)" stroke-width="2" x1="16" y1="11" x2="16" y2="3"/>
        <text class="label" x="16" y="19" font-size="2.6" text-anchor="middle">VALVE</text>
      </g>
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      fanSpeedPct: 85,
      cfm: 18500,
      supplyTemp: 17.2,
      returnTemp: 24.5,
      deltaT: 7.3,
      fanDeg: 0,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function cracAudio(f, dur = 0.06, type = 'sine') {
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

    function stepFanSpeed() {
      st.fanSpeedPct = st.fanSpeedPct === 100 ? 50 : st.fanSpeedPct === 85 ? 100 : 85;
      st.cfm = Math.floor(st.fanSpeedPct * 218);
      st.supplyTemp = (20.5 - (st.fanSpeedPct / 100) * 3.8).toFixed(1);
      st.deltaT = (st.returnTemp - st.supplyTemp).toFixed(1);

      cracAudio(500 + st.fanSpeedPct * 4, 0.08);

      const cfmEl = q('#crac-cfm-txt');
      if (cfmEl) cfmEl.textContent = `EC FANS: ${st.fanSpeedPct}% · ${st.cfm.toLocaleString()} CFM`;

      render();
    }

    // Continuous Impeller Rotation & Telemetry Loop
    st.timer = api.every(45, () => {
      st.tick++;
      st.fanDeg = (st.fanDeg + (st.fanSpeedPct / 100) * 28) % 360;

      const r1 = q('#crac-rotor-1'), r2 = q('#crac-rotor-2');
      if (r1) r1.setAttribute('transform', `rotate(${st.fanDeg} 48 33)`);
      if (r2) r2.setAttribute('transform', `rotate(${-st.fanDeg * 1.1} 112 33)`);
    });

    function render() {
      api.power(true);
      api.readout(
        `CRAC PRECISION COOLING · EC BLOWER: ${st.fanSpeedPct}% · ${st.cfm.toLocaleString()} CFM · SUPPLY: ${st.supplyTemp}°C · ΔT: ${st.deltaT}°C`
      );
    }

    stage.addEventListener('click', e => {
      stepFanSpeed();
    });

    render();

    return {
      key(e) {
        if (e.key === ' ' || e.key === '1') {
          stepFanSpeed();
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        stepFanSpeed();
      }
    };
  }
});
