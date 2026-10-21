/* Fig 5 — Audira Enterprise Data Center Rack & AI GPU Cluster */
FIGS.push({
  id: 'audira-datacenter',
  name: 'Audira Data Center',
  hint: 'Click server blades to toggle · Space triggers DDoS/AI benchmark · Keys 1–6',
  aria: 'Isometric enterprise 42U data center server rack with AI GPU accelerator nodes, NVMe storage vault, liquid cooling manifold, and ToR fiber optic switches.',
  css: `
    [data-fig="audira-datacenter"] .dc-blade { cursor:pointer; }
    [data-fig="audira-datacenter"] .dc-blade:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-datacenter"] .dc-blade.off .face { opacity:.35; }
    [data-fig="audira-datacenter"] .dc-port { fill:var(--recess); stroke:var(--line); stroke-width:.8; vector-effect:non-scaling-stroke; }
    [data-fig="audira-datacenter"] .dc-port.rx { fill:var(--accent); }
    [data-fig="audira-datacenter"] .coolant-pipe { fill:none; stroke:var(--accent); stroke-width:2.4; stroke-linecap:round; opacity:.85; filter:url(#soft); }
    [data-fig="audira-datacenter"] .dc-fan-blade { stroke:var(--accent-hi) !important; stroke-width:2.2px !important; stroke-linecap:round; filter:url(#soft); }
    [data-fig="audira-datacenter"] .bench-btn { cursor:pointer; }
    [data-fig="audira-datacenter"] .bench-btn:hover .face.top { stroke:var(--accent-hi); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [40, 30, 210], [280, 30, 210], [40, 230, 210], [280, 230, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits, esc = api.iso.esc;

    const PLZ = 7;
    // Data Center 42U Cabinet dimensions
    const RX = 70, RY = 45, RW = 200, RD = 140, RH = 180, RZ = PLZ;
    const RT = RZ + RH, RF = RY + RD;
    const UX = RX + 16, UY = RY + 12, UW = RW - 32, UD = RD - 18, UF = UY + UD;

    let svg = `<defs>
      <clipPath id="dc-mon-clip"><rect x="4" y="3" width="72" height="12" rx="2"/></clipPath>
    </defs>`;

    // Perforated Data Center Cold-Aisle Floor Tiles
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Perforated airflow floor tiles in front of rack -->
      ${Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) =>
        `<circle class="face recess" cx="${80 + c * 11}" cy="${200 + r * 6}" r="1.3"/>`
      ).join('')
    ).join('')}
      <!-- Ground demarcation lines -->
      <line class="detail" x1="40" y1="30" x2="40" y2="240"/>
      <line class="detail" x1="300" y1="30" x2="300" y2="240"/>
      <text class="label" x="85" y="254" font-size="4" letter-spacing="1">COLD AISLE · AIRFLOW CONTAINMENT</text>
    </g>`;

    // Main 42U Rack Steel Skeleton Frame
    svg += box(RX, RY, RZ, RW, RD, RH, 6);

    // Overhead Cable Ladder / Fiber Duct (Top of rack)
    svg += box(RX - 20, RY + 20, RT, RW + 40, 30, 8, 2);
    svg += `<g transform="${TOP(RX - 20, RY + 20, RT + 8)}">
      ${slits(6, RW + 34, 6, 2, 28, true)}
      <text class="label" x="20" y="16" font-size="4.2" letter-spacing="1.5">FIBER TRAY 100G</text>
    </g>`;

    // Top Roof Exhaust Fan Pods
    // Top Roof Exhaust Fan Pods with Rotating Blades
    svg += box(RX + 30, RY + 60, RT, 60, 60, 6, 4);
    svg += `<g transform="${TOP(RX + 30, RY + 60, RT + 6)}">
      <circle class="face recess" cx="30" cy="30" r="24"/>
      <circle class="led hot" id="dc-fan-led-1" filter="url(#soft)" cx="30" cy="30" r="3"/>
      <g id="dc-fan-rotor-1">
        ${Array.from({ length: 6 }, (_, i) => {
          const rad = (i * 60 * Math.PI) / 180;
          return `<line class="dc-fan-blade" x1="30" y1="30" x2="${(30 + 20 * Math.cos(rad)).toFixed(1)}" y2="${(30 + 20 * Math.sin(rad)).toFixed(1)}"/>`;
        }).join('')}
      </g>
    </g>`;

    svg += box(RX + 110, RY + 60, RT, 60, 60, 6, 4);
    svg += `<g transform="${TOP(RX + 110, RY + 60, RT + 6)}">
      <circle class="face recess" cx="30" cy="30" r="24"/>
      <circle class="led hot" id="dc-fan-led-2" filter="url(#soft)" cx="30" cy="30" r="3"/>
      <g id="dc-fan-rotor-2">
        ${Array.from({ length: 6 }, (_, i) => {
          const rad = (i * 60 * Math.PI) / 180;
          return `<line class="dc-fan-blade" x1="30" y1="30" x2="${(30 + 20 * Math.cos(rad)).toFixed(1)}" y2="${(30 + 20 * Math.sin(rad)).toFixed(1)}"/>`;
        }).join('')}
      </g>
    </g>`;

    // Rack Side Panel (Ventilation grills & PDU conduits)
    svg += `<g transform="${SIDE(RX + RW, RF, RT)}">
      ${slits(16, 120, 3.2, 10, 50)}
      ${slits(16, 120, 3.2, 70, 110)}
      ${slits(16, 120, 3.2, 130, 170)}
      <text class="label" x="18" y="60" font-size="5" letter-spacing="1">ZONE A · RACK 04</text>
    </g>`;

    // Rack Front Top Header (OLED Climate & Power Monitor)
    svg += `<g transform="${FRONT(RX, RF, RT)}">
      <rect class="face recess" x="14" y="4" width="${RW - 28}" height="18" rx="3"/>
      <rect class="halo hot" x="16" y="6" width="80" height="14" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="16" y="6" width="80" height="14" rx="2"/>
      <g clip-path="url(#dc-mon-clip)">
        <text class="scr" x="20" y="14" font-size="4" letter-spacing=".5">PUE: 1.08 · 22.4°C</text>
        <text class="scr-accent" id="dc-telemetry-pwr" x="20" y="19" font-size="3.8">38.2 kW [NORMAL]</text>
      </g>
      <text class="label" x="106" y="14" font-size="5.5" font-weight="500" letter-spacing="1.5">AUDIRA · DC-42U</text>
    </g>`;

    // SERVER BLADES SPECIFICATION (Stacked bottom to top)
    const BLADES = [
      { id: 0, name: 'UPS & REDUNDANT PDU', kind: 'pwr', h: 22, z: RZ + 4 },
      { id: 1, name: 'SAN STORAGE VAULT', kind: 'nvme', h: 26, z: RZ + 30 },
      { id: 2, name: 'K8S COMPUTE NODE 01', kind: 'node', h: 20, z: RZ + 60 },
      { id: 3, name: 'K8S COMPUTE NODE 02', kind: 'node', h: 20, z: RZ + 84 },
      { id: 4, name: 'AI HGX GPU ACCELERATOR', kind: 'gpu', h: 32, z: RZ + 108 },
      { id: 5, name: 'TOP-OF-RACK 100G SWITCH', kind: 'tor', h: 18, z: RZ + 144 }
    ];

    BLADES.forEach(b => {
      const topZ = b.z + b.h;
      svg += `<g class="dc-blade" id="blade-${b.id}" data-id="${b.id}">`;
      svg += box(UX, UY, b.z, UW, UD, b.h, 2);

      // Front Face for this blade
      svg += `<g transform="${FRONT(UX, UF, topZ)}">`;
      svg += `<text class="label" x="8" y="10" font-size="3.8" letter-spacing=".5">${b.name}</text>`;
      svg += `<circle class="led hot dc-blade-led" id="blade-led-${b.id}" filter="url(#soft)" cx="${UW - 12}" cy="8" r="1.5"/>`;

      if (b.kind === 'pwr') {
        // Dual power supplies & voltage LED readouts
        svg += `<rect class="face recess" x="8" y="13" width="60" height="7" rx="1"/>`;
        svg += `<text class="scr" x="12" y="18" font-size="3.5">230V A/B · 99.4% EFF</text>`;
        svg += slits(80, UW - 20, 2.8, 12, b.h - 3);
      } else if (b.kind === 'nvme') {
        // 16 Hot-swap NVMe drive sleds with flickering LEDs
        const cols = 8, rows = 2;
        const dw = (UW - 24) / cols, dh = (b.h - 14) / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const dx = 10 + c * dw, dy = 11 + r * (dh + 1);
            svg += `<rect class="face recess" x="${dx}" y="${dy}" width="${dw - 2}" height="${dh}" rx=".6"/>`;
            svg += `<circle class="led hot dc-drive-led" id="drive-${r * 8 + c}" filter="url(#soft)" cx="${dx + dw - 4}" cy="${dy + dh / 2}" r=".8"/>`;
          }
        }
      } else if (b.kind === 'node') {
        // Compute node: air vents, USB-C diagnostic, mini OLED
        svg += slits(8, 80, 2.5, 12, b.h - 3);
        svg += `<rect class="face recess" x="90" y="11" width="50" height="7" rx="1"/>`;
        svg += `<text class="scr" x="93" y="16" font-size="3.2">CPU: 48% · 256GB</text>`;
      } else if (b.kind === 'gpu') {
        // Heavy GPU Node with dual liquid cooling intake ports & massive intake vents
        svg += `<circle class="face recess" cx="16" cy="18" r="4.5"/>
          <circle class="coolant-intake" filter="url(#soft)" cx="16" cy="18" r="2.5" fill="var(--accent)"/>
          <circle class="face recess" cx="30" cy="18" r="4.5"/>
          <circle class="coolant-outtake" filter="url(#soft)" cx="30" cy="18" r="2.5" fill="var(--accent-hi)"/>
          <text class="label" x="40" y="20" font-size="3.5">8x TENSOR GPU · LIQUID MANIFOLD</text>`;
        svg += slits(8, UW - 12, 2.2, 23, b.h - 2);
      } else if (b.kind === 'tor') {
        // 24-Port QSFP28 Fiber Switch
        for (let p = 0; p < 18; p++) {
          const px = 10 + p * 7.5;
          svg += `<rect class="dc-port" id="dc-port-${p}" x="${px}" y="11" width="5" height="4" rx=".5"/>`;
        }
      }

      svg += `</g>`;
      svg += `</g>`;
    });

    // Vertical Liquid Coolant Pipes (Side manifold routing into GPU node)
    const PIPE_X = RX + 10, PIPE_Y = RF - 4;
    const P0 = [PIPE_X, PIPE_Y, RZ + 4];
    const P1 = [PIPE_X, PIPE_Y + 12, RZ + 60];
    const P2 = [UX + 16, UF, RZ + 118];
    const pipeD = `M ${K.P(...P0).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...P1).map(v => v.toFixed(1)).join(' ')}, ${K.P(...P2).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="coolant-pipe" d="${pipeD}"/>`;
    svg += `<path class="coolant-stream" id="dc-coolant-stream" d="${pipeD}" fill="none" stroke="var(--accent-hi)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="25 60" filter="url(#glow)">
      <animate attributeName="stroke-dashoffset" from="170" to="0" dur="1.1s" repeatCount="indefinite"/>
    </path>`;

    // Benchmark / DDoS Simulation Button (Pill on front floor)
    const BTN_X = RX + RW - 70, BTN_Y = RF + 15;
    svg += `<g class="bench-btn" id="dc-bench-btn">
      ${box(BTN_X, BTN_Y, PLZ, 60, 20, 5, 3)}
      <g transform="${TOP(BTN_X, BTN_Y, PLZ + 5)}">
        <text class="label" x="30" y="11.5" font-size="4" text-anchor="middle" letter-spacing="1">BENCHMARK / AI</text>
      </g>
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- Logic & Real-Time Telemetry ---------- */
    const st = {
      bladesOn: [true, true, true, true, true, true],
      highLoad: false,
      pwrKw: 38.2,
      tempC: 22.4,
      packetCount: 0,
      fanDeg: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function serverBeep(f, dur = 0.05) {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) { }
    }

    function toggleBlade(id) {
      st.bladesOn[id] = !st.bladesOn[id];
      const bladeEl = q(`#blade-${id}`);
      if (bladeEl) bladeEl.classList.toggle('off', !st.bladesOn[id]);
      const ledEl = q(`#blade-led-${id}`);
      if (ledEl) ledEl.classList.toggle('hot', st.bladesOn[id]);
      serverBeep(st.bladesOn[id] ? 750 : 320);
      recalcTelemetry();
    }

    function recalcTelemetry() {
      const activeCount = st.bladesOn.filter(Boolean).length;
      st.pwrKw = (12.4 + activeCount * (st.highLoad ? 8.2 : 4.4)).toFixed(1);
      st.tempC = (18.0 + activeCount * (st.highLoad ? 2.8 : 1.1)).toFixed(1);
      const pwrEl = q('#dc-telemetry-pwr');
      if (pwrEl) {
        pwrEl.textContent = `${st.pwrKw} kW [${st.highLoad ? 'AI OVERDRIVE' : 'NORMAL'}]`;
      }
      render();
    }

    function triggerBenchmark() {
      st.highLoad = !st.highLoad;
      api.flash(q('#dc-bench-btn'), 260);
      serverBeep(st.highLoad ? 1200 : 500, 0.2);
      recalcTelemetry();
    }

    // Real-Time Flickering Drive Activity, Fiber Ports & Fan Rotation
    st.timer = api.every(50, () => {
      st.packetCount++;

      // Real-time fan rotation
      st.fanDeg = (st.fanDeg + (st.highLoad ? 24 : 14)) % 360;
      const fan1 = q('#dc-fan-rotor-1');
      if (fan1) fan1.setAttribute('transform', `rotate(${st.fanDeg} 30 30)`);
      const fan2 = q('#dc-fan-rotor-2');
      if (fan2) fan2.setAttribute('transform', `rotate(${st.fanDeg * 0.75} 30 30)`);

      // Flickering NVMe drive LEDs
      const driveLeds = stage.querySelectorAll('.dc-drive-led');
      driveLeds.forEach((led, i) => {
        const active = Math.random() > (st.highLoad ? 0.15 : 0.55);
        led.classList.toggle('hot', active && st.bladesOn[1]);
      });

      // Flashing fiber optic ports
      const ports = stage.querySelectorAll('.dc-port');
      ports.forEach((p, i) => {
        const active = (st.packetCount + i) % 3 === 0 || Math.random() > 0.65;
        p.classList.toggle('rx', active && st.bladesOn[5]);
      });

      // Micro-fluctuation in temperature & power readout
      if (st.packetCount % 6 === 0) {
        const pwrEl = q('#dc-telemetry-pwr');
        if (pwrEl) {
          const jitter = (Math.sin(st.packetCount * 0.2) * 0.3).toFixed(1);
          pwrEl.textContent = `${(parseFloat(st.pwrKw) + parseFloat(jitter)).toFixed(1)} kW [${st.highLoad ? 'AI OVERDRIVE' : 'NORMAL'}]`;
        }
      }
    });

    function render() {
      api.power(true);
      api.readout(
        `DATA CENTER 42U · POWER: ${st.pwrKw} kW · TEMP: ${st.tempC}°C · STATUS: ${st.highLoad ? 'AI BENCHMARK' : 'OPTIMAL'}`
      );
    }

    stage.addEventListener('click', e => {
      const blade = e.target.closest('.dc-blade');
      if (blade && blade.dataset.id) {
        toggleBlade(+blade.dataset.id);
        return;
      }
      if (e.target.closest('#dc-bench-btn')) {
        triggerBenchmark();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          triggerBenchmark();
          return true;
        }
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 6) {
          toggleBlade(num - 1);
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        triggerBenchmark();
      }
    };
  }
});
