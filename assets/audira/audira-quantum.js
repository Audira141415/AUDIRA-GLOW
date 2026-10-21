/* Fig 1 — Audira Quantum Computing Cryo-Chandelier (IBM/Google Qubit Dilution Refrigerator) */
FIGS.push({
  id: 'audira-quantum',
  name: 'Quantum Cryo-Chandelier',
  hint: 'Click Qubit Core or Space to execute quantum superposition circuit · Keys 1–4',
  aria: 'Isometric cryogenic quantum computer dilution refrigerator chandelier with gold-plated thermal plates, coiled microwave coaxial lines, and 15 millikelvin superconducting qubit quantum processor.',
  css: `
    [data-fig="audira-quantum"] .qubit-core { cursor:pointer; }
    [data-fig="audira-quantum"] .qubit-core:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-quantum"] .cryo-plate { cursor:pointer; }
    [data-fig="audira-quantum"] .cryo-plate:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-quantum"] .q-wave { fill:none; stroke:var(--accent-hi); stroke-width:1.8; stroke-linecap:round; filter:url(#soft); }
    [data-fig="audira-quantum"] .gold-wire { fill:none; stroke:#ffd54f; stroke-width:1.2; stroke-linecap:round; opacity:0.85; }
    [data-fig="audira-quantum"] .qubit-glow { animation:q-pulse 1.8s ease-in-out infinite; }
    @keyframes q-pulse { 0%, 100% { opacity:0.5; filter:url(#soft); } 50% { opacity:1; filter:url(#glow); r:9; } }
    .q-burst { animation:q-shake 0.35s ease-out; }
    @keyframes q-shake { 0%, 100% { transform:translate(0,0); } 25% { transform:translate(-2px,2px); } 50% { transform:translate(3px,-2px); } 75% { transform:translate(-2px,1px); } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [20, 260, 0], [300, 20, 0], [300, 260, 0], [20, 20, 0],
      [40, 40, 290], [280, 40, 290], [40, 240, 290], [280, 240, 290]
    ]);
    const { TOP, FRONT, SIDE, box, boxc, path, P } = K;
    const slits = api.iso.slits;

    let svg = `<defs>
      <radialGradient id="q-laser-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#00e5ff"/>
        <stop offset="85%" stop-color="#0288d1" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#01579b" stop-opacity="0"/>
      </radialGradient>
    </defs>`;

    // 1. Stage Floor Dais with Sub-Zero Thermal Exhaust & Isolation Pillars
    svg += boxc(20, 20, 0, 280, 240, 8, 12, 'stage-floor');
    svg += `<g transform="${TOP(20, 20, 8)}">
      <rect class="detail" x="10" y="10" width="260" height="220" rx="8" stroke-dasharray="8 6"/>
      <circle cx="140" cy="120" r="95" fill="none" stroke="var(--line)" stroke-width="0.8"/>
      <circle cx="140" cy="120" r="75" fill="none" stroke="var(--detail)" stroke-width="1.2" stroke-dasharray="10 8"/>
      <!-- Glowing Floor Data Traces -->
      <path id="q-floor-trace" class="q-wave" d="M 40,120 Q 90,140 140,120 T 240,120" opacity="0.6"/>
      <text class="label" x="25" y="225" font-size="4.2" letter-spacing="1.5">AUDIRA QUANTUM LAB · 127-QUBIT SUPERCONDUCTING DILUTION CRYOSTAT</text>
    </g>`;

    // 2. Ceiling Cryo Gantry Support Rig
    const GANTRY_Z = 270;
    svg += boxc(50, 50, GANTRY_Z, 220, 180, 14, 8, 'gantry-steel');
    svg += `<g transform="${TOP(50, 50, GANTRY_Z + 14)}">
      <rect class="detail" x="10" y="10" width="200" height="160" rx="4"/>
      <circle cx="110" cy="90" r="60" fill="none" stroke="var(--line)" stroke-width="1"/>
      ${slits(30, 85, 3, 20, 70)}
      ${slits(135, 190, 3, 20, 70)}
    </g>`;

    // 3. FIVE-TIER GOLD CHANDELIER (From Room Temp 300K down to 15 mK)
    const CX = 160, CY = 140;
    
    // Support Tie Rods
    const rods = [
      [CX - 55, CY - 45], [CX + 55, CY - 45],
      [CX - 55, CY + 45], [CX + 55, CY + 45]
    ];
    rods.forEach(([rx, ry]) => {
      svg += `<line x1="${P(rx, ry, GANTRY_Z)[0]}" y1="${P(rx, ry, GANTRY_Z)[1]}" x2="${P(rx, ry, 70)[0]}" y2="${P(rx, ry, 70)[1]}" stroke="#cfd8dc" stroke-width="1.8" stroke-linecap="round"/>`;
    });

    // Tier 1: 50K Flange Plate
    const T1_Z = 230, T1_R = 75;
    svg += box(CX - T1_R, CY - T1_R, T1_Z, T1_R * 2, T1_R * 2, 6, 20);
    svg += `<g transform="${TOP(CX - T1_R, CY - T1_R, T1_Z + 6)}">
      <circle cx="${T1_R}" cy="${T1_R}" r="${T1_R - 8}" fill="none" stroke="#ffb300" stroke-width="1.2"/>
      <circle cx="${T1_R}" cy="${T1_R}" r="${T1_R - 22}" fill="none" stroke="var(--detail)" stroke-width="0.8"/>
      <text class="label" x="${T1_R}" y="${T1_R + 3}" font-size="4" text-anchor="middle">50 KELVIN STAGE · THERMAL SHIELD</text>
    </g>`;

    // Tier 2: 4K Flange Plate
    const T2_Z = 185, T2_R = 62;
    svg += box(CX - T2_R, CY - T2_R, T2_Z, T2_R * 2, T2_R * 2, 6, 16);
    svg += `<g transform="${TOP(CX - T2_R, CY - T2_R, T2_Z + 6)}">
      <circle cx="${T2_R}" cy="${T2_R}" r="${T2_R - 6}" fill="none" stroke="#ffb300" stroke-width="1.2"/>
      <text class="label" x="${T2_R}" y="${T2_R + 3}" font-size="3.8" text-anchor="middle">4.2 KELVIN · 1K POT / L-He4</text>
    </g>`;

    // Tier 3: 800 mK Still Plate
    const T3_Z = 145, T3_R = 50;
    svg += box(CX - T3_R, CY - T3_R, T3_Z, T3_R * 2, T3_R * 2, 5, 14);
    svg += `<g transform="${TOP(CX - T3_R, CY - T3_R, T3_Z + 5)}">
      <circle cx="${T3_R}" cy="${T3_R}" r="${T3_R - 5}" fill="none" stroke="#ffb300" stroke-width="1"/>
      <text class="label" x="${T3_R}" y="${T3_R + 3}" font-size="3.5" text-anchor="middle">800 mK · STILL DISTILLATION</text>
    </g>`;

    // Tier 4: 100 mK Cold Plate
    const T4_Z = 110, T4_R = 38;
    svg += box(CX - T4_R, CY - T4_R, T4_Z, T4_R * 2, T4_R * 2, 5, 10);
    svg += `<g transform="${TOP(CX - T4_R, CY - T4_R, T4_Z + 5)}">
      <circle cx="${T4_R}" cy="${T4_R}" r="${T4_R - 4}" fill="none" stroke="#ffb300" stroke-width="1"/>
      <text class="label" x="${T4_R}" y="${T4_R + 3}" font-size="3.2" text-anchor="middle">100 mK COLD PLATE</text>
    </g>`;

    // Tier 5: 15 milliKelvin Mixing Chamber & Superconducting Qubit Package!
    const T5_Z = 65, T5_R = 26;
    svg += `<g id="qubit-chamber" class="qubit-core">`;
    svg += box(CX - T5_R, CY - T5_R, T5_Z, T5_R * 2, T5_R * 2, 8, 8);
    svg += `<g transform="${TOP(CX - T5_R, CY - T5_R, T5_Z + 8)}">
      <circle cx="${T5_R}" cy="${T5_R}" r="${T5_R - 3}" fill="none" stroke="#ffd54f" stroke-width="1.5"/>
      <circle class="qubit-glow" cx="${T5_R}" cy="${T5_R}" r="7" fill="url(#q-laser-grad)"/>
      <text class="label" x="${T5_R}" y="${T5_R + 2.5}" font-size="3" text-anchor="middle" font-weight="bold">15 mK · QPU</text>
    </g>`;

    // Hanging Qubit Cryo-Can Canister Shield at bottom
    svg += boxc(CX - 16, CY - 16, 25, 32, 32, 40, 6, 'qubit-shield');
    svg += `<g transform="${FRONT(CX - 16, CY + 16, 65)}">
      <rect class="detail" x="4" y="4" width="24" height="32" rx="2"/>
      <circle cx="16" cy="18" r="8" fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="4 3"/>
      <circle class="qubit-glow" cx="16" cy="18" r="4" fill="var(--accent-hi)"/>
      <text class="label" x="16" y="34" font-size="3" text-anchor="middle">127 QUBITS</text>
    </g>`;
    svg += `</g>`;

    // 4. COILED GOLD MICROWAVE COAXIAL CABLE HARNESSES WITH LIVE PULSING PHOTON NODES
    for (let i = 0; i < 6; i++) {
      const ang = (i * 60) * Math.PI / 180;
      const r1 = 60, r2 = 48, r3 = 38, r4 = 28, r5 = 18;
      
      const p1 = P(CX + r1 * Math.cos(ang), CY + r1 * Math.sin(ang), T1_Z);
      const p2 = P(CX + r2 * Math.cos(ang + 0.3), CY + r2 * Math.sin(ang + 0.3), T2_Z);
      const p3 = P(CX + r3 * Math.cos(ang + 0.6), CY + r3 * Math.sin(ang + 0.6), T3_Z);
      const p4 = P(CX + r4 * Math.cos(ang + 0.9), CY + r4 * Math.sin(ang + 0.9), T4_Z);
      const p5 = P(CX + r5 * Math.cos(ang + 1.2), CY + r5 * Math.sin(ang + 1.2), T5_Z);

      svg += `<path class="gold-wire" d="M ${p1.join(',')} Q ${P(CX+r1*0.8, CY+r1*0.8, (T1_Z+T2_Z)/2).join(',')} ${p2.join(',')}" />`;
      svg += `<path class="gold-wire" d="M ${p2.join(',')} Q ${P(CX+r2*0.8, CY+r2*0.8, (T2_Z+T3_Z)/2).join(',')} ${p3.join(',')}" />`;
      svg += `<path class="gold-wire" d="M ${p3.join(',')} Q ${P(CX+r3*0.8, CY+r3*0.8, (T3_Z+T4_Z)/2).join(',')} ${p4.join(',')}" />`;
      svg += `<path class="gold-wire" d="M ${p4.join(',')} Q ${P(CX+r4*0.8, CY+r4*0.8, (T4_Z+T5_Z)/2).join(',')} ${p5.join(',')}" />`;
    }

    // Dynamic photon packets traveling down wires
    svg += `<g id="live-photons">
      ${[0, 1, 2, 3].map(i => `<circle id="q-photon-${i}" r="2.5" fill="#00e5ff" filter="url(#glow)"/>`).join('')}
    </g>`;

    // 5. LIVE CONTINUOUS SUPERPOSITION PROBABILITY WAVE STREAM
    const [qpx, qpy] = P(CX, CY, 45);
    svg += `<g id="quantum-live-stream">
      <ellipse cx="${qpx}" cy="${qpy}" rx="48" ry="28" fill="none" stroke="var(--line)" stroke-width="1.2"/>
      <!-- Live dynamic oscillating Bloch wave path -->
      <path id="q-live-wave-path" class="q-wave" d="M ${qpx-45} ${qpy} Q ${qpx-20} ${qpy-14} ${qpx} ${qpy} T ${qpx+45} ${qpy}"/>
      <!-- Rotating precession ring -->
      <ellipse id="q-precess-ring" cx="${qpx}" cy="${qpy}" rx="32" ry="18" fill="none" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="6 4"/>
      <!-- Precession vector pointer -->
      <line id="q-state-arrow" x1="${qpx}" y1="${qpy}" x2="${qpx+18}" y2="${qpy-12}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" filter="url(#soft)"/>
    </g>`;

    // 6. QUANTUM SUPERPOSITION PROBABILITY WAVE STREAM (Interactive Burst FX)
    svg += `<g id="quantum-wave-fx" opacity="0" style="transition: opacity 0.2s ease;">
      <circle cx="${qpx}" cy="${qpy}" r="55" fill="none" stroke="var(--accent-hi)" stroke-width="2.5" filter="url(#glow)"/>
      <circle cx="${qpx}" cy="${qpy}" r="85" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="8 6" filter="url(#soft)"/>
      <circle cx="${qpx}" cy="${qpy}" r="120" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 8" opacity="0.75"/>
    </g>`;

    // 7. CONTROL CONSOLE BENCH (Front left)
    const CTRL_X = 35, CTRL_Y = 25, CTRL_Z = 8;
    svg += box(CTRL_X, CTRL_Y, CTRL_Z, 70, 48, 26, 4);
    svg += `<g transform="${TOP(CTRL_X, CTRL_Y, CTRL_Z + 26)}">
      <rect class="detail" x="4" y="4" width="62" height="40" rx="2"/>
      <rect class="glass" id="q-mon" x="8" y="8" width="54" height="32" rx="2"/>
      <text class="scr" x="12" y="18" font-size="3.8">STATE: |Ψ⟩ = α|0⟩+β|1⟩</text>
      <text class="scr-accent" id="q-val" x="12" y="27" font-size="3.8">0.707|0⟩ + 0.707|1⟩</text>
      <text class="label" id="q-temp" x="12" y="35" font-size="3.2">T: 14.812 mK (±0.003)</text>
    </g>`;

    stage.innerHTML = svg;

    // AUDIO SYNTHESIZER
    const playQuantumSound = (mode) => {
      try {
        const audio = api.audio();
        if (!audio || !audio.ctx) return;
        const { ctx, out } = audio;
        const now = ctx.currentTime;

        if (mode === 'circuit') {
          [528, 792, 1056, 1584].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.08 / (idx + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9 + idx * 0.2);
            osc.connect(gain);
            gain.connect(out);
            osc.start(now);
            osc.stop(now + 1.2);
          });
        } else if (mode === 'coherence') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(880, now + 0.3);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.4);
        }
      } catch (e) {}
    };

    // LIVE ANIMATION TIMER (Continuous real-time update)
    const waveEl = stage.querySelector('#q-live-wave-path');
    const ringEl = stage.querySelector('#q-precess-ring');
    const arrowEl = stage.querySelector('#q-state-arrow');
    const tempEl = stage.querySelector('#q-temp');
    const valText = stage.querySelector('#q-val');
    const waveFx = stage.querySelector('#quantum-wave-fx');

    let tick = 0;
    const animTimer = api.every(40, () => {
      tick++;

      // 1. Live dynamic superposition wave
      if (waveEl) {
        const y1 = qpy - 12 * Math.sin(tick * 0.15);
        const y2 = qpy + 12 * Math.cos(tick * 0.18);
        waveEl.setAttribute('d', `M ${qpx-45} ${qpy} Q ${qpx-22} ${y1.toFixed(1)} ${qpx} ${qpy} T ${qpx+45} ${y2.toFixed(1)}`);
      }

      // 2. Precessing Bloch sphere pointer
      if (arrowEl) {
        const rad = 22;
        const ax = qpx + rad * Math.cos(tick * 0.08);
        const ay = qpy + (rad * 0.55) * Math.sin(tick * 0.08);
        arrowEl.setAttribute('x2', ax.toFixed(1));
        arrowEl.setAttribute('y2', ay.toFixed(1));
      }

      // 3. Photon packets traveling down the coaxial wires
      for (let i = 0; i < 4; i++) {
        const pNode = stage.querySelector(`#q-photon-${i}`);
        if (pNode) {
          const progress = ((tick * 0.02 + i * 0.25) % 1);
          const zPos = 230 - progress * 165;
          const [px, py] = P(CX + 35 * Math.cos(i * 1.57), CY + 35 * Math.sin(i * 1.57), zPos);
          pNode.setAttribute('cx', px.toFixed(1));
          pNode.setAttribute('cy', py.toFixed(1));
        }
      }

      // 4. Live millikelvin temperature jitter
      if (tick % 8 === 0 && tempEl) {
        const jitter = (14.810 + Math.sin(tick * 0.3) * 0.005).toFixed(3);
        tempEl.textContent = `T: ${jitter} mK (±0.003)`;
      }
    });

    let qCount = 0;
    const runQuantumCircuit = () => {
      playQuantumSound('circuit');
      stage.classList.add('q-burst');
      qCount++;
      const states = [
        '0.707|0⟩ + 0.707|1⟩',
        'ENTANGLED: (|00⟩+|11⟩)',
        'FIDELITY: 99.88%',
        'SHOR FACTOR: 100%'
      ];
      if (valText) valText.textContent = states[qCount % states.length];
      api.readout(`QUANTUM CIRCUIT EXECUTED · FIDELITY: 99.91% · COHERENCE: 142µs · T: 14.8mK`);
      if (waveFx) waveFx.style.opacity = '1';
      setTimeout(() => {
        if (waveFx) waveFx.style.opacity = '0';
        stage.classList.remove('q-burst');
      }, 650);
    };

    const chamberEl = stage.querySelector('#qubit-chamber');
    if (chamberEl) chamberEl.addEventListener('click', runQuantumCircuit);

    api.readout('CRYOGENIC DILUTION REFRIGERATOR · 127-QUBIT READY · 14.8 mK');

    return {
      key(e) {
        if (e.key === ' ' || e.code === 'Space') {
          runQuantumCircuit();
          return true;
        }
        if (e.key === '1') {
          playQuantumSound('coherence');
          api.readout('RAMSEY COHERENCE MEASUREMENT: T1=160µs, T2=125µs');
          return true;
        }
        if (e.key === '2') {
          playQuantumSound('coherence');
          api.readout('BELL STATE ENTANGLEMENT VERIFIED · CHSH SCORE: 2.82');
          return true;
        }
        if (e.key === '3') {
          runQuantumCircuit();
          return true;
        }
        if (e.key === '4') {
          api.readout('CRYOGENIC CYCLE STABLE · STILL: 0.82K · MIXING: 14.8mK');
          return true;
        }
        return false;
      },
      unmount() {
        stage.classList.remove('q-burst');
      }
    };
  }
});
