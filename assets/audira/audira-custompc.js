/* Fig 5 — Audira Custom Dual-Loop Liquid-Cooled Super PC Rig */
FIGS.push({
  id: 'audira-custompc',
  name: 'Liquid-Cooled Super PC',
  hint: 'Click GPU Waterblock or Space to run 3D Benchmark Stress Test · Keys 1–4',
  aria: 'Isometric open-frame enthusiast showcase PC with dual-loop hardline liquid cooling, transparent GPU waterblock, dual cylindrical vortex reservoirs, and 360mm radiators.',
  css: `
    [data-fig="audira-custompc"] .pc-block { cursor:pointer; }
    [data-fig="audira-custompc"] .pc-block:hover { filter:url(#glow); }
    [data-fig="audira-custompc"] .coolant-pipe { fill:none; stroke-linecap:round; }
    .bench-run { animation:bench-shake 0.35s ease-out; }
    @keyframes bench-shake { 0%, 100% { transform:translate(0,0); } 20% { transform:translate(-2px,2px); } 60% { transform:translate(3px,-2px); } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [10, 260, 0], [310, 10, 0], [310, 260, 0], [10, 10, 0],
      [20, 20, 250], [300, 20, 250], [20, 250, 250], [300, 250, 250]
    ]);
    const { TOP, FRONT, SIDE, box, boxc, path, P } = K;
    const slits = api.iso.slits;

    let svg = `<defs>
      <linearGradient id="coolant-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00e5ff"/>
        <stop offset="100%" stop-color="#0288d1"/>
      </linearGradient>
    </defs>`;

    // 1. Desk Mount Dais
    const PLZ = 8;
    svg += boxc(10, 10, 0, 300, 250, PLZ, 14, 'stage-floor');
    svg += `<g transform="${TOP(10, 10, PLZ)}">
      <rect class="detail" x="10" y="10" width="280" height="230" rx="10" stroke-dasharray="8 6"/>
      <circle cx="150" cy="125" r="100" fill="none" stroke="var(--line)" stroke-width="0.8"/>
      <text class="label" x="25" y="235" font-size="4.2" letter-spacing="1.5">AUDIRA ULTRA WORKSTATION · DUAL-LOOP HARDLINE CUSTOM WATERCOOLING RIG</text>
    </g>`;

    // 2. Open-Frame Chassis Backplate
    const CH_X = 40, CH_Y = 50, CH_Z = PLZ, CH_W = 220, CH_D = 150, CH_H = 18;
    svg += boxc(CH_X, CH_Y, CH_Z, CH_W, CH_D, CH_H, 8, 'chassis-base');

    // Vertical Motherboard Tray Tower Panel
    const TRAY_X = CH_X + 15, TRAY_Y = CH_Y + 15, TRAY_Z = CH_Z + CH_H, TRAY_W = 190, TRAY_D = 24, TRAY_H = 160;
    svg += box(TRAY_X, TRAY_Y, TRAY_Z, TRAY_W, TRAY_D, TRAY_H, 6);
    svg += `<g transform="${FRONT(TRAY_X, TRAY_Y + TRAY_D, TRAY_Z + TRAY_H)}">
      <rect class="face recess" x="12" y="12" width="166" height="136" rx="4"/>
      <!-- CPU Socket Area & Waterblock -->
      <rect class="detail" x="35" y="25" width="45" height="45" rx="3"/>
      <!-- DDR5 RAM Slots -->
      ${[0, 1, 2, 3].map(i => `<line class="wire hot" x1="${88 + i * 5}" y1="25" x2="${88 + i * 5}" y2="70" stroke-width="2"/>`).join('')}
      <rect class="detail" x="35" y="80" width="120" height="12" rx="2"/>
      <rect class="detail" x="35" y="100" width="120" height="12" rx="2"/>
    </g>`;

    // 3. TRANSPARENT GPU WATERBLOCK
    const GPU_X = TRAY_X + 35, GPU_Y = TRAY_Y + TRAY_D + 18, GPU_Z = TRAY_Z + 45;
    svg += `<g id="gpu-block-unit" class="pc-block">`;
    svg += box(GPU_X, GPU_Y, GPU_Z, 115, 20, 60, 4);
    svg += `<g transform="${FRONT(GPU_X, GPU_Y + 20, GPU_Z + 60)}">
      <rect class="glass hot" x="4" y="4" width="107" height="52" rx="2"/>
      ${slits(35, 75, 2.5, 12, 42, true, 'wire hot')}
      <rect class="face recess" x="10" y="12" width="20" height="12" rx="1"/>
      <text class="scr-accent" id="gpu-temp-text" x="12" y="20" font-size="3.5">42°C</text>
      <text class="label" id="gpu-pwr-text" x="10" y="32" font-size="3">RTX 5090 · 450W</text>
    </g>`;
    svg += `</g>`;

    // 4. DUAL CYLINDRICAL VORTEX RESERVOIRS WITH D5 PUMPS
    const RES1_X = CH_X + 165, RES1_Y = CH_Y + 50, RES1_Z = CH_Z + CH_H;
    svg += boxc(RES1_X, RES1_Y, RES1_Z, 28, 28, 85, 8, 'reservoir-tube');
    svg += `<g transform="${FRONT(RES1_X, RES1_Y + 28, RES1_Z + 85)}">
      <rect class="glass hot" x="3" y="10" width="22" height="65" rx="3"/>
      <!-- Dynamic Swirling Liquid Vortex Path -->
      <path id="res-vortex-1" d="M 6,20 Q 22,35 6,50 Q 22,65 6,72" fill="none" stroke="var(--accent-hi)" stroke-width="2.5" filter="url(#glow)"/>
      <text class="label" x="14" y="8" font-size="2.8" text-anchor="middle">LOOP 1</text>
    </g>`;

    const RES2_X = CH_X + 165, RES2_Y = CH_Y + 95, RES2_Z = CH_Z + CH_H;
    svg += boxc(RES2_X, RES2_Y, RES2_Z, 28, 28, 85, 8, 'reservoir-tube');
    svg += `<g transform="${FRONT(RES2_X, RES2_Y + 28, RES2_Z + 85)}">
      <rect class="glass hot" x="3" y="10" width="22" height="65" rx="3"/>
      <path id="res-vortex-2" d="M 22,20 Q 6,35 22,50 Q 6,65 22,72" fill="none" stroke="var(--accent)" stroke-width="2.5" filter="url(#soft)"/>
      <text class="label" x="14" y="8" font-size="2.8" text-anchor="middle">LOOP 2</text>
    </g>`;

    // 5. 360MM THICK RADIATOR WITH THREE 120MM ROTATING RGB FANS
    const RAD_X = TRAY_X + 10, RAD_Y = TRAY_Y + 5, RAD_Z = TRAY_Z + TRAY_H + 6;
    svg += box(RAD_X, RAD_Y, RAD_Z, 170, 32, 22, 4);
    svg += `<g transform="${FRONT(RAD_X, RAD_Y + 32, RAD_Z + 22)}">
      ${[0, 1, 2].map(i => {
        const fx = 28 + i * 55, fy = 11;
        return `
          <circle cx="${fx}" cy="${fy}" r="9" fill="none" stroke="var(--line)" stroke-width="1.2"/>
          <g id="fan-unit-${i}">
            <line id="fan-b1-${i}" x1="${fx-8}" y1="${fy}" x2="${fx+8}" y2="${fy}" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"/>
            <line id="fan-b2-${i}" x1="${fx}" y1="${fy-8}" x2="${fx}" y2="${fy+8}" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"/>
          </g>
        `;
      }).join('')}
    </g>`;

    // 6. HARDLINE ACRYLIC CRYSTAL TUBING WITH LIVE COOLANT BUBBLE STREAMS
    const pRes1 = P(RES1_X + 14, RES1_Y + 14, RES1_Z + 75);
    const pGpuIn = P(GPU_X + 25, GPU_Y + 10, GPU_Z + 50);
    const pGpuOut = P(GPU_X + 90, GPU_Y + 10, GPU_Z + 50);
    const pRadIn = P(RAD_X + 30, RAD_Y + 16, RAD_Z);

    // Static clear tube shells
    svg += `<path d="M ${pRes1.join(',')} L ${pGpuIn.join(',')}" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/>`;
    svg += `<path d="M ${pGpuOut.join(',')} L ${pRadIn.join(',')}" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/>`;

    // Dynamic flowing fluid streams
    svg += `<path id="coolant-stream-1" class="coolant-pipe" d="M ${pRes1.join(',')} L ${pGpuIn.join(',')}" stroke="var(--accent-hi)" stroke-width="3" stroke-dasharray="8 6" filter="url(#glow)"/>`;
    svg += `<path id="coolant-stream-2" class="coolant-pipe" d="M ${pGpuOut.join(',')} L ${pRadIn.join(',')}" stroke="var(--accent-hi)" stroke-width="3" stroke-dasharray="8 6" filter="url(#glow)"/>`;

    // 7. STRESS BENCHMARK BENCH SCREEN (Front left)
    const MON_X = 25, MON_Y = 25, MON_Z = PLZ;
    svg += box(MON_X, MON_Y, MON_Z, 70, 48, 26, 4);
    svg += `<g transform="${TOP(MON_X, MON_Y, MON_Z + 26)}">
      <rect class="detail" x="4" y="4" width="62" height="40" rx="2"/>
      <rect class="glass" x="8" y="8" width="54" height="32" rx="2"/>
      <text class="scr" x="12" y="18" font-size="4">CPU: 5.9 GHz BOOST</text>
      <text class="scr-accent" id="pc-fps" x="12" y="27" font-size="4">FPS: 240 · 4K ULTRA</text>
      <text class="label" id="pc-flow" x="12" y="35" font-size="3.2">FLOW: 242 L/H (D5 OK)</text>
    </g>`;

    stage.innerHTML = svg;

    // AUDIO SYNTHESIZER
    const playPcSound = (type) => {
      try {
        const audio = api.audio();
        if (!audio || !audio.ctx) return;
        const { ctx, out } = audio;
        const now = ctx.currentTime;

        if (type === 'benchmark') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(750, now + 0.4);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
          gain.gain.linearRampToValueAtTime(0, now + 0.5);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.5);

          [880, 1108, 1320, 1760].forEach((freq, idx) => {
            const bOsc = ctx.createOscillator();
            const bGain = ctx.createGain();
            bOsc.type = 'sine';
            bOsc.frequency.setValueAtTime(freq, now + 0.45 + idx * 0.05);
            bGain.gain.setValueAtTime(0.1, now + 0.45 + idx * 0.05);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9 + idx * 0.05);
            bOsc.connect(bGain);
            bGain.connect(out);
            bOsc.start(now + 0.45 + idx * 0.05);
            bOsc.stop(now + 1.0);
          });
        } else if (type === 'click') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.12);
        }
      } catch (e) {}
    };

    // REAL-TIME HARDWARE & FLUID ANIMATION LOOP
    const stream1 = stage.querySelector('#coolant-stream-1');
    const stream2 = stage.querySelector('#coolant-stream-2');
    const vort1 = stage.querySelector('#res-vortex-1');
    const vort2 = stage.querySelector('#res-vortex-2');
    const flowText = stage.querySelector('#pc-flow');
    const fpsText = stage.querySelector('#pc-fps');
    const tempText = stage.querySelector('#gpu-temp-text');
    const pwrText = stage.querySelector('#gpu-pwr-text');

    let tick = 0;
    api.every(40, () => {
      tick++;

      // 1. Coolant liquid bubble flow along hardline pipes
      if (stream1) stream1.setAttribute('stroke-dashoffset', (-tick * 3.5).toFixed(1));
      if (stream2) stream2.setAttribute('stroke-dashoffset', (-tick * 3.5).toFixed(1));

      // 2. Spinning 120mm Radiator Fan Blades
      for (let i = 0; i < 3; i++) {
        const b1 = stage.querySelector(`#fan-b1-${i}`);
        const b2 = stage.querySelector(`#fan-b2-${i}`);
        if (b1 && b2) {
          const fx = 28 + i * 55, fy = 11;
          const a = (tick * 0.35 + i * 0.4);
          const r = 8;
          b1.setAttribute('x1', (fx - r * Math.cos(a)).toFixed(1));
          b1.setAttribute('y1', (fy - r * Math.sin(a)).toFixed(1));
          b1.setAttribute('x2', (fx + r * Math.cos(a)).toFixed(1));
          b1.setAttribute('y2', (fy + r * Math.sin(a)).toFixed(1));

          b2.setAttribute('x1', (fx + r * Math.sin(a)).toFixed(1));
          b2.setAttribute('y1', (fy - r * Math.cos(a)).toFixed(1));
          b2.setAttribute('x2', (fx - r * Math.sin(a)).toFixed(1));
          b2.setAttribute('y2', (fy + r * Math.cos(a)).toFixed(1));
        }
      }

      // 3. Dynamic liquid vortex inside reservoirs
      if (vort1 && vort2) {
        const offset = Math.sin(tick * 0.2) * 5;
        vort1.setAttribute('d', `M ${6+offset.toFixed(1)},20 Q 22,35 ${6-offset.toFixed(1)},50 Q 22,65 6,72`);
        vort2.setAttribute('d', `M ${22-offset.toFixed(1)},20 Q 6,35 ${22+offset.toFixed(1)},50 Q 6,65 22,72`);
      }

      // 4. Flow meter and telemetry jitter
      if (tick % 8 === 0 && flowText) {
        const flow = (240 + Math.sin(tick * 0.15) * 4).toFixed(0);
        flowText.textContent = `FLOW: ${flow} L/H (D5 OK)`;
      }
    });

    let benchCount = 0;
    const runBenchmark = () => {
      playPcSound('benchmark');
      stage.classList.add('bench-run');
      benchCount++;
      const fpsVals = ['FPS: 285 · 4K ULTRA', 'TIME SPY: 38,450', 'FPS: 310 · DLSS 3.5'];
      const tempVals = ['58°C', '62°C', '55°C'];
      const pwrVals = ['RTX 5090 · 580W', 'RTX 5090 · 600W (PEAK)', 'RTX 5090 · 520W'];
      if (fpsText) fpsText.textContent = fpsVals[benchCount % fpsVals.length];
      if (tempText) tempText.textContent = tempVals[benchCount % tempVals.length];
      if (pwrText) pwrText.textContent = pwrVals[benchCount % pwrVals.length];

      api.readout('3D BENCHMARK STRESS TEST COMPLETED · SCORE: 38,450 · LIQUID DELTA T: 4.2°C');
      setTimeout(() => {
        stage.classList.remove('bench-run');
        if (pwrText) pwrText.textContent = 'RTX 5090 · 450W';
      }, 550);
    };

    const gpuEl = stage.querySelector('#gpu-block-unit');
    if (gpuEl) gpuEl.addEventListener('click', runBenchmark);

    api.readout('CUSTOM DUAL-LOOP SUPER PC RIG · D5 PUMPS 240 L/H · LIQUID COOLED');

    return {
      key(e) {
        if (e.key === ' ' || e.code === 'Space') {
          runBenchmark();
          return true;
        }
        if (e.key === '1') {
          playPcSound('click');
          api.readout('D5 PUMP SPEED STEPPED: 100% PWM · 4800 RPM');
          return true;
        }
        if (e.key === '2') {
          runBenchmark();
          return true;
        }
        if (e.key === '3') {
          playPcSound('click');
          api.readout('RGB ARGB SYNC: CYBERPUNK SYNTHWAVE PALETTE APPLIED');
          return true;
        }
        if (e.key === '4') {
          api.readout('OVERCLOCK PROFILE ACTIVE: +250 MHz CORE, +1000 MHz VRAM');
          return true;
        }
        return false;
      },
      unmount() {
        stage.classList.remove('bench-run');
      }
    };
  }
});
