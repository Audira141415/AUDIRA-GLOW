/* Fig 5 — Audira DCIM Data Center Infrastructure & Traffic Monitoring Center */
FIGS.push({
  id: 'audira-dcim',
  name: 'DCIM Traffic & Monitor',
  hint: 'Click screens or buttons to toggle metrics · Space triggers traffic spike · Keys 1–4',
  aria: 'Isometric DCIM data center infrastructure monitoring station with triple-display video wall showing live network bandwidth traffic waveforms, packet flow analysis, thermal cold-aisle heatmap, and facility PUE power telemetry.',
  css: `
    [data-fig="audira-dcim"] .dcim-screen { cursor:pointer; }
    [data-fig="audira-dcim"] .dcim-screen:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-dcim"] .dcim-btn { cursor:pointer; }
    [data-fig="audira-dcim"] .dcim-btn:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-dcim"] .traffic-wave { fill:none; stroke:var(--accent); stroke-width:1.6; stroke-linecap:round; filter:url(#soft); }
    [data-fig="audira-dcim"] .traffic-stream { fill:none; stroke:var(--accent-hi); stroke-width:2.2; stroke-linecap:round; stroke-dasharray:8 14; filter:url(#glow); }
    [data-fig="audira-dcim"] .heat-rack { cursor:pointer; transition:fill .25s ease-out, stroke .25s ease-out; }
    [data-fig="audira-dcim"] .heat-rack:hover { stroke:var(--accent-hi); stroke-width:1.5; }
    [data-fig="audira-dcim"] .strobe-beacon { animation:dcim-beacon-spin 2.2s ease-in-out infinite; }
    @keyframes dcim-beacon-spin { 0%, 100% { opacity:.3; filter:url(#soft); } 50% { opacity:1; filter:url(#glow); } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [20, 20, 210], [320, 20, 210], [20, 240, 210], [320, 240, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="main-traffic-clip"><rect x="4" y="4" width="132" height="74" rx="3"/></clipPath>
      <clipPath id="side-therm-clip"><rect x="4" y="4" width="72" height="62" rx="3"/></clipPath>
      <clipPath id="side-pwr-clip"><rect x="4" y="4" width="72" height="62" rx="3"/></clipPath>
    </defs>`;

    // Base Floor Plate (NOC Control Room Tiles)
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Raised access floor grid demarcations -->
      <line class="detail" x1="20" y1="30" x2="320" y2="30"/>
      <line class="detail" x1="20" y1="120" x2="320" y2="120"/>
      <line class="detail" x1="20" y1="210" x2="320" y2="210"/>
      <text class="label" x="35" y="250" font-size="4" letter-spacing="1.5">DATA CENTER INFRASTRUCTURE MANAGEMENT (DCIM) · 24/7 NOC MONITORING</text>
    </g>`;

    // NOC Curved Multi-Display Stand Framework
    const STAND_X = 35, STAND_Y = 25, STAND_Z = PLZ, STAND_W = 270, STAND_D = 120, STAND_H = 35;
    svg += box(STAND_X, STAND_Y, STAND_Z, STAND_W, STAND_D, STAND_H, 6);
    svg += `<g transform="${FRONT(STAND_X, STAND_Y + STAND_D, STAND_Z + STAND_H)}">
      ${slits(16, 90, 3, 6, 24)}
      <text class="label" x="100" y="20" font-size="6" letter-spacing="2">AUDIRA · DCIM OPS WALL</text>
      ${slits(210, 254, 3, 6, 24)}
    </g>`;

    // TRIPLE MONITOR VIDEO WALL (Mounted elevated on desk)
    const SCR_Z = STAND_Z + STAND_H + 4;

    // 1. CENTER SCREEN: High-Bandwidth Network Traffic & Packet Analyzer
    const CW_X = STAND_X + 65, CW_Y = STAND_Y + 14, CW_W = 140, CW_D = 82, CW_H = 6;
    svg += `<g class="dcim-screen" id="scr-traffic" data-scr="traffic">`;
    svg += box(CW_X, CW_Y, SCR_Z, CW_W, CW_D, CW_H, 4);
    svg += `<g transform="${TOP(CW_X, CW_Y, SCR_Z + CW_H)}">
      <rect class="face recess" x="4" y="4" width="${CW_W - 8}" height="${CW_D - 8}" rx="4"/>
      <rect class="halo hot" x="6" y="6" width="${CW_W - 12}" height="${CW_D - 12}" rx="3" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="6" y="6" width="${CW_W - 12}" height="${CW_D - 12}" rx="3"/>

      <g clip-path="url(#main-traffic-clip)" transform="translate(4 4)">
        <!-- Header -->
        <text class="scr" x="6" y="11" font-size="4.2" letter-spacing="1">NETWORK TRAFFIC & BANDWIDTH FLOW</text>
        <text class="scr-accent" id="dcim-thruput-head" x="80" y="11" font-size="4">LIVE: 3.42 Tbps</text>
        <line class="detail" x1="6" y1="15" x2="126" y2="15"/>

        <!-- Real-Time Bandwidth Waveform Graph -->
        <text class="label" x="6" y="24" font-size="3">EAST-WEST FABRIC (CLOS)</text>
        <path class="traffic-wave" id="dcim-traffic-wave-1" d="M6 35 Q20 22, 35 34 T65 24 T95 32 T126 26"/>
        <path class="traffic-stream" id="dcim-traffic-stream-1" d="M6 35 Q20 22, 35 34 T65 24 T95 32 T126 26">
          <animate attributeName="stroke-dashoffset" from="120" to="0" dur="1s" repeatCount="indefinite"/>
        </path>

        <text class="label" x="6" y="46" font-size="3">NORTH-SOUTH EDGE (TRANSIT 400G)</text>
        <path class="traffic-wave" id="dcim-traffic-wave-2" d="M6 56 Q25 48, 45 57 T80 47 T105 55 T126 50"/>
        <path class="traffic-stream" id="dcim-traffic-stream-2" d="M6 56 Q25 48, 45 57 T80 47 T105 55 T126 50">
          <animate attributeName="stroke-dashoffset" from="120" to="0" dur="1.4s" repeatCount="indefinite"/>
        </path>

        <!-- Dynamic Packet Throughput Bar Columns -->
        ${Array.from({ length: 14 }, (_, i) => {
          const bx = 10 + i * 8.2;
          const bh = 8 + (i % 5) * 2.5;
          return `<rect class="oled-bar" id="traffic-bar-${i}" x="${bx}" y="${70 - bh}" width="4.5" height="${bh}" rx=".8" fill="var(--accent)"/>`;
        }).join('')}
      </g>
    </g>`;
    svg += `</g>`;

    // 2. LEFT SCREEN: Facility Thermal & Environment Heatmap
    const LW_X = STAND_X + 6, LW_Y = STAND_Y + 22, LW_W = 54, LW_D = 72, LW_H = 6;
    svg += `<g class="dcim-screen" id="scr-thermal" data-scr="thermal">`;
    svg += box(LW_X, LW_Y, SCR_Z, LW_W, LW_D, LW_H, 4);
    svg += `<g transform="${TOP(LW_X, LW_Y, SCR_Z + LW_H)}">
      <rect class="face recess" x="3" y="3" width="${LW_W - 6}" height="${LW_D - 6}" rx="3"/>
      <rect class="halo hot" x="5" y="5" width="${LW_W - 10}" height="${LW_D - 10}" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="5" y="5" width="${LW_W - 10}" height="${LW_D - 10}" rx="2"/>

      <g clip-path="url(#side-therm-clip)" transform="translate(3 3)">
        <text class="scr" x="4" y="9" font-size="3.5">THERMAL MAP</text>
        <line class="detail" x1="4" y1="12" x2="${LW_W - 10}" y2="12"/>

        <!-- 3 Rows of 3 Rack Cells on Thermal Grid -->
        ${[0, 1, 2].map(r => `
          ${[0, 1, 2].map(c => `
            <rect class="heat-rack" id="dcim-rack-${r}-${c}" x="${6 + c * 14}" y="${16 + r * 13}" width="11" height="9" rx="1.5" fill="var(--deck)" stroke="var(--accent)" stroke-width="1"/>
          `).join('')}
        `).join('')}
        <text class="scr-accent" id="dcim-cold-txt" x="4" y="58" font-size="3">COLD: 18.2°C</text>
      </g>
    </g>`;
    svg += `</g>`;

    // 3. RIGHT SCREEN: Power PUE & Energy Telemetry
    const RW_X = CW_X + CW_W + 5, RW_Y = STAND_Y + 22, RW_W = 54, RW_D = 72, RW_H = 6;
    svg += `<g class="dcim-screen" id="scr-power" data-scr="power">`;
    svg += box(RW_X, RW_Y, SCR_Z, RW_W, RW_D, RW_H, 4);
    svg += `<g transform="${TOP(RW_X, RW_Y, SCR_Z + RW_H)}">
      <rect class="face recess" x="3" y="3" width="${RW_W - 6}" height="${RW_D - 6}" rx="3"/>
      <rect class="halo hot" x="5" y="5" width="${RW_W - 10}" height="${RW_D - 10}" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="5" y="5" width="${RW_W - 10}" height="${RW_D - 10}" rx="2"/>

      <g clip-path="url(#side-pwr-clip)" transform="translate(3 3)">
        <text class="scr" x="4" y="9" font-size="3.5">FACILITY PUE</text>
        <line class="detail" x1="4" y1="12" x2="${RW_W - 10}" y2="12"/>

        <!-- Circular PUE Meter -->
        <circle class="face recess" cx="24" cy="28" r="14"/>
        <circle class="detail" cx="24" cy="28" r="11"/>
        <text class="scr-accent" id="dcim-pue-num" x="24" y="30" font-size="5" text-anchor="middle" font-weight="500">1.08</text>

        <!-- Power Bar -->
        <text class="label" x="4" y="48" font-size="2.8">LOAD: 480 kW</text>
        <rect class="face recess" x="4" y="51" width="38" height="4" rx="1"/>
        <rect class="oled-bar" id="dcim-load-bar" x="4" y="51" width="30" height="4" rx="1" fill="var(--accent-hi)"/>
      </g>
    </g>`;
    svg += `</g>`;

    // BOTTOM OPERATOR CONSOLE CONTROLS & STROBE ALARM BEACON
    // Front control table extension
    const TBL_X = STAND_X + 20, TBL_Y = STAND_Y + STAND_D + 8, TBL_W = 230, TBL_D = 45, TBL_H = 14;
    svg += box(TBL_X, TBL_Y, PLZ, TBL_W, TBL_D, TBL_H, 4);
    svg += `<g transform="${TOP(TBL_X, TBL_Y, PLZ + TBL_H)}">
      <rect class="face recess" x="4" y="4" width="${TBL_W - 8}" height="${TBL_D - 8}" rx="3"/>
      <text class="label" x="12" y="14" font-size="4" letter-spacing="1">DCIM TELEMETRY FOCUS & CONTROLS</text>
      
      <!-- Interactive Metric Focus Buttons -->
      ${[
        { id: 'traffic', x: 10,  lbl: '1: TRAFFIC' },
        { id: 'thermal', x: 55,  lbl: '2: THERMAL' },
        { id: 'power',   x: 100, lbl: '3: POWER' },
        { id: 'burst',   x: 145, lbl: '4: TRAFFIC SPIKE' }
      ].map(b => `
        <g class="dcim-btn" id="dcim-btn-${b.id}" data-id="${b.id}">
          <rect class="face recess" x="${b.x}" y="20" width="40" height="18" rx="2"/>
          <text class="label" x="${b.x + 20}" y="31" font-size="3.2" text-anchor="middle">${b.lbl}</text>
        </g>
      `).join('')}

      <!-- Strobe Alarm Beacon on Right Desk -->
      <g class="strobe-beacon" id="dcim-alarm-strobe" transform="translate(198 12)">
        <circle class="face recess" cx="12" cy="12" r="10"/>
        <circle class="led hot" filter="url(#glow)" cx="12" cy="12" r="6">
          <animate attributeName="r" values="4; 7; 4" dur="1.2s" repeatCount="indefinite"/>
        </circle>
        <text class="label" x="12" y="27" font-size="2.6" text-anchor="middle">STATUS</text>
      </g>
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Real-Time Traffic Logic ---------- */
    const st = {
      focus: 'traffic',
      trafficSpike: false,
      thruputTbps: 3.42,
      pue: 1.08,
      coldTemp: 18.2,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function dcimBeep(f, dur = 0.05, type = 'sine') {
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

    function setFocus(mode) {
      st.focus = mode;
      dcimBeep(700, 0.06);
      render();
    }

    function triggerSpike() {
      st.trafficSpike = !st.trafficSpike;
      api.flash(q('#dcim-btn-burst'), 260);
      dcimBeep(st.trafficSpike ? 1300 : 500, 0.2, 'sawtooth');
      render();
    }

    // Continuous Real-Time Traffic Waveform & Telemetry Jitter
    st.timer = api.every(45, () => {
      st.tick++;

      // Waveform 1 dynamic oscillation
      const w1 = q('#dcim-traffic-wave-1');
      if (w1) {
        const amp = st.trafficSpike ? 16 : 8;
        const y1 = 35 + Math.sin(st.tick * 0.2) * amp;
        const y2 = 24 + Math.cos(st.tick * 0.25) * amp;
        w1.setAttribute('d', `M6 35 Q20 ${y1.toFixed(1)}, 35 34 T65 ${y2.toFixed(1)} T95 32 T126 26`);
      }

      // Dynamic throughput packet bar columns
      for (let i = 0; i < 14; i++) {
        const b = q(`#traffic-bar-${i}`);
        if (b) {
          const mult = st.trafficSpike ? 1.6 : 1.0;
          const h = (6 + Math.abs(Math.sin(st.tick * 0.3 + i * 0.5)) * 14 * mult).toFixed(1);
          b.setAttribute('height', h);
          b.setAttribute('y', (70 - h).toFixed(1));
        }
      }

      // Live throughput numbers
      if (st.tick % 5 === 0) {
        const base = st.trafficSpike ? 6.84 : 3.42;
        const jitter = (Math.sin(st.tick * 0.2) * 0.12).toFixed(2);
        st.thruputTbps = (base + parseFloat(jitter)).toFixed(2);
        const hEl = q('#dcim-thruput-head');
        if (hEl) hEl.textContent = `LIVE: ${st.thruputTbps} Tbps [${st.trafficSpike ? 'PEAK BURST' : 'STABLE'}]`;
      }

      // Live PUE micro-jitter
      if (st.tick % 6 === 0) {
        const pueEl = q('#dcim-pue-num');
        if (pueEl) {
          const jitter = (Math.sin(st.tick * 0.15) * 0.015).toFixed(2);
          pueEl.textContent = (st.pue + parseFloat(jitter)).toFixed(2);
        }
      }

      // Thermal Heatmap Rack cell breathing
      if (st.tick % 3 === 0) {
        const r = Math.floor(Math.random() * 3);
        const c = Math.floor(Math.random() * 3);
        const cell = q(`#dcim-rack-${r}-${c}`);
        if (cell) {
          cell.style.fill = st.trafficSpike ? 'var(--accent)' : 'var(--accent-dim)';
          cell.style.stroke = 'var(--accent-hi)';
          setTimeout(() => {
            if (cell) {
              cell.style.fill = 'var(--deck)';
              cell.style.stroke = 'var(--accent)';
            }
          }, 400);
        }
      }
    });

    function render() {
      api.power(true);
      api.readout(
        st.trafficSpike
          ? `DCIM TRAFFIC SPIKE · ${st.thruputTbps} Tbps · PACKET LOAD 94% · PUE: ${st.pue}`
          : `DCIM MONITORING · TRAFFIC: ${st.thruputTbps} Tbps · PUE: ${st.pue} · COLD AISLE: ${st.coldTemp}°C`
      );
    }

    stage.addEventListener('click', e => {
      const scr = e.target.closest('.dcim-screen');
      if (scr && scr.dataset.scr) {
        setFocus(scr.dataset.scr);
        return;
      }
      const btn = e.target.closest('.dcim-btn');
      if (btn && btn.dataset.id) {
        const id = btn.dataset.id;
        if (id === 'burst') triggerSpike();
        else setFocus(id);
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          triggerSpike();
          return true;
        }
        if (e.key === '1') { setFocus('traffic'); return true; }
        if (e.key === '2') { setFocus('thermal'); return true; }
        if (e.key === '3') { setFocus('power'); return true; }
        if (e.key === '4') { triggerSpike(); return true; }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        triggerSpike();
      }
    };
  }
});
