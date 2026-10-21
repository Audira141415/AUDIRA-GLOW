/* Fig 12 — Audira Cold Aisle Containment Pod & Biometric Sliding Airflow Corridor */
FIGS.push({
  id: 'audira-containment',
  name: 'Cold Aisle Containment',
  hint: 'Click sliding doors or Space to toggle motorized pod doors · Click aisle floor',
  aria: 'Isometric dual-row cold aisle containment pod with opposing 42U server racks, transparent poly-carbonate ceiling roof canopy, motorized optical sliding doors, and subfloor cold airflow circulation.',
  css: `
    [data-fig="audira-containment"] .pod-door { cursor:pointer; }
    [data-fig="audira-containment"] .pod-door:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-containment"] .sliding-glass { fill:var(--accent-dim); stroke:var(--accent-hi); stroke-width:1.2; opacity:.75; transition:transform .35s cubic-bezier(.2,.8,.3,1); }
    [data-fig="audira-containment"] .canopy-roof { fill:var(--glass); stroke:var(--accent); stroke-width:1; opacity:.6; filter:url(#soft); }
    [data-fig="audira-containment"] .aisle-stream { fill:none; stroke:var(--accent-hi); stroke-width:1.8; stroke-dasharray:8 18; filter:url(#glow); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [20, 20, 210], [320, 20, 210], [20, 240, 210], [320, 240, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="pod-lcd-clip"><rect x="4" y="3" width="76" height="18" rx="2"/></clipPath>
    </defs>`;

    // Base Floor Plate (Contained Room Perimeter)
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Perforated Cold Aisle Center Floor Tiles -->
      ${Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) =>
          `<circle class="face recess" cx="${125 + c * 12}" cy="${55 + r * 25}" r="1.5"/>`
        ).join('')
      ).join('')}
      <text class="label" x="35" y="248" font-size="4" letter-spacing="1.5">CONTAINMENT POD · SEPARATED COLD AISLE (18.0°C) VS EXHAUST HOT AISLE (32.5°C)</text>
    </g>`;

    // DUAL-ROW OPPOSING RACKS
    // Row 1 (Left Rack Bank): X=45, Y=40, W=70, D=150, H=160
    const R1_X = 45, R1_Y = 40, RW = 70, RD = 150, RH = 160, RZ = PLZ;
    svg += box(R1_X, R1_Y, RZ, RW, RD, RH, 4);
    svg += `<g transform="${SIDE(R1_X + RW, R1_Y + RD, RZ + RH)}">
      <!-- Inward facing rack mesh doors facing cold corridor -->
      ${slits(12, RD - 12, 3.2, 10, RH - 15)}
      <text class="label" x="18" y="40" font-size="4.5">ROW A · SERVER NODES</text>
    </g>`;

    // Row 2 (Right Rack Bank): X=225, Y=40, W=70, D=150, H=160
    const R2_X = 225, R2_Y = 40;
    svg += box(R2_X, R2_Y, RZ, RW, RD, RH, 4);
    svg += `<g transform="${SIDE(R2_X, R2_Y + RD, RZ + RH)}">
      ${slits(12, RD - 12, 3.2, 10, RH - 15)}
      <text class="label" x="18" y="40" font-size="4.5">ROW B · AI CLUSTERS</text>
    </g>`;

    // CENTER COLD AISLE (Corridor between Row 1 and Row 2): X=115 to 225 (Width 110)
    const CORR_X = R1_X + RW, CORR_Y = R1_Y, CORR_W = R2_X - (R1_X + RW), CORR_D = RD;

    // Overhead Clear Polycarbonate Canopy Roof (Traps cold air)
    const ROOF_Z = RZ + RH;
    svg += `<g class="canopy-roof">`;
    svg += box(CORR_X, CORR_Y, ROOF_Z, CORR_W, CORR_D, 6, 2);
    svg += `<g transform="${TOP(CORR_X, CORR_Y, ROOF_Z + 6)}">
      ${[25, 60, 95, 130].map(y => `<line class="detail" stroke="var(--accent)" stroke-width="1.2" x1="4" y1="${y}" x2="${CORR_W - 4}" y2="${y}"/>`).join('')}
      <text class="label" x="55" y="75" font-size="4" text-anchor="middle" letter-spacing="1">CLEAR CANOPY ROOF</text>
    </g>`;
    svg += `</g>`;

    // Front Motorized Optical Sliding Doors (Entrance to Pod)
    const DOOR_Y = CORR_Y + CORR_D;
    svg += `<g class="pod-door" id="pod-door-assembly">`;
    // Door outer arch frame
    svg += box(CORR_X, DOOR_Y, RZ, CORR_W, 14, RH, 4);

    // Door Header with Status Display & Biometric Reader
    svg += `<g transform="${FRONT(CORR_X, DOOR_Y + 14, RZ + RH)}">
      <rect class="face recess" x="12" y="6" width="${CORR_W - 24}" height="22" rx="3"/>
      <rect class="halo hot" x="14" y="8" width="${CORR_W - 28}" height="18" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="14" y="8" width="${CORR_W - 28}" height="18" rx="2"/>

      <g clip-path="url(#pod-lcd-clip)" transform="translate(14 8)">
        <text class="scr" x="4" y="8" font-size="3.5">AISLE 01 · CONTAINED</text>
        <text class="scr-accent" id="pod-status-txt" x="4" y="15" font-size="3.8">DOORS: SEALED [18.0°C]</text>
      </g>
      <!-- Biometric scanner light -->
      <circle class="led hot" id="door-bio-led" filter="url(#soft)" cx="${CORR_W - 20}" cy="17" r="2.5"/>
    </g>`;

    // Left and Right Motorized Optical Sliding Glass Panels
    const GLASS_H = RH - 35, GLASS_W = (CORR_W - 20) / 2;
    svg += `<g transform="${FRONT(CORR_X, DOOR_Y + 10, RZ + GLASS_H + 4)}">
      <rect class="sliding-glass" id="glass-left" x="10" y="4" width="${GLASS_W}" height="${GLASS_H}" rx="2"/>
      <rect class="sliding-glass" id="glass-right" x="${10 + GLASS_W}" y="4" width="${GLASS_W}" height="${GLASS_H}" rx="2"/>
    </g>`;
    svg += `</g>`; // end pod-door

    // Rising Cold Airflow Particle Streams inside the contained corridor
    [CORR_X + 25, CORR_X + 55, CORR_X + 85].forEach((ax, idx) => {
      const A0 = [ax, CORR_Y + 30 + idx * 30, PLZ + 6];
      const A1 = [ax, CORR_Y + 30 + idx * 30, PLZ + 80];
      const A2 = [ax, CORR_Y + 30 + idx * 30, PLZ + 145];
      const airD = `M ${K.P(...A0).map(v => v.toFixed(1)).join(' ')} L ${K.P(...A2).map(v => v.toFixed(1)).join(' ')}`;
      svg += `<path class="aisle-stream" d="${airD}">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="${(0.9 + idx * 0.2).toFixed(2)}s" repeatCount="indefinite"/>
      </path>`;
    });

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      doorsOpen: false,
      coldTemp: 18.0,
      hotTemp: 32.5,
      deltaT: 14.5,
      pue: 1.05,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function podAudio(f, dur = 0.08, type = 'sine') {
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

    function toggleDoors() {
      st.doorsOpen = !st.doorsOpen;
      podAudio(st.doorsOpen ? 720 : 380, 0.25);

      const gl = q('#glass-left'), gr = q('#glass-right');
      if (gl) gl.style.transform = st.doorsOpen ? 'translateX(-36px)' : '';
      if (gr) gr.style.transform = st.doorsOpen ? 'translateX(36px)' : '';

      const stTxt = q('#pod-status-txt');
      if (stTxt) stTxt.textContent = st.doorsOpen ? 'DOORS: OPEN [LEAKAGE]' : 'DOORS: SEALED [18.0°C]';

      const bioLed = q('#door-bio-led');
      if (bioLed) bioLed.classList.toggle('hot', !st.doorsOpen);

      render();
    }

    // Temperature Micro-Jitter Loop
    st.timer = api.every(50, () => {
      st.tick++;
      if (st.doorsOpen) {
        st.coldTemp = Math.min(24.0, (parseFloat(st.coldTemp) + 0.04)).toFixed(1);
      } else {
        st.coldTemp = Math.max(18.0, (parseFloat(st.coldTemp) - 0.05)).toFixed(1);
      }
    });

    function render() {
      api.power(true);
      api.readout(
        st.doorsOpen
          ? `POD DOORS OPEN · THERMAL MIXING · COLD AISLE: ${st.coldTemp}°C · HOT: ${st.hotTemp}°C`
          : `COLD AISLE SEALED · PUE: 1.05 OPTIMAL · COLD: ${st.coldTemp}°C · HOT: ${st.hotTemp}°C (ΔT 14.5°C)`
      );
    }

    stage.addEventListener('click', e => {
      toggleDoors();
    });

    render();

    return {
      key(e) {
        if (e.key === ' ' || e.key === '1') {
          toggleDoors();
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        toggleDoors();
      }
    };
  }
});
