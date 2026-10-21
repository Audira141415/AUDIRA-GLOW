/* Fig 2 — Audira Tokamak Fusion Reactor Core (Magnetic Confinement Fusion) */
FIGS.push({
  id: 'audira-tokamak',
  name: 'Tokamak Fusion Core',
  hint: 'Click Core or Space to initiate Plasma Ignition (Q > 10) · Keys 1–4',
  aria: 'Isometric magnetic confinement fusion tokamak reactor with toroidal vacuum vessel, superconducting D-coils, central solenoid, and 150 million Kelvin burning plasma core.',
  css: `
    [data-fig="audira-tokamak"] .plasma-core { cursor:pointer; }
    [data-fig="audira-tokamak"] .plasma-core:hover { filter:url(#glow) brightness(1.2); }
    [data-fig="audira-tokamak"] .mag-coil { cursor:pointer; }
    [data-fig="audira-tokamak"] .mag-coil:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-tokamak"] .plasma-stream { fill:none; stroke-linecap:round; }
    .tok-ignite { animation:tok-shake 0.45s ease-out; }
    @keyframes tok-shake { 0%, 100% { transform:translate(0,0); } 15% { transform:translate(-3px,3px); } 35% { transform:translate(4px,-3px); } 60% { transform:translate(-2px,2px); } 85% { transform:translate(2px,-1px); } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [10, 270, 0], [310, 10, 0], [310, 270, 0], [10, 10, 0],
      [30, 30, 260], [290, 30, 260], [30, 250, 260], [290, 250, 260]
    ]);
    const { TOP, FRONT, SIDE, box, boxc, path, P } = K;
    const slits = api.iso.slits;

    let svg = `<defs>
      <radialGradient id="tok-plasma-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="35%" stop-color="#e040fb"/>
        <stop offset="70%" stop-color="#7c4dff"/>
        <stop offset="95%" stop-color="#00e5ff" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="nbi-beam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00e5ff" stop-opacity="0"/>
        <stop offset="50%" stop-color="#00e5ff"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
    </defs>`;

    // 1. Biological Shield / Reactor Bio-Vault Foundation
    const PLZ = 8;
    svg += boxc(10, 10, 0, 300, 260, PLZ, 16, 'stage-floor');
    svg += `<g transform="${TOP(10, 10, PLZ)}">
      <rect class="detail" x="12" y="12" width="276" height="236" rx="12" stroke-dasharray="10 6"/>
      <circle cx="150" cy="130" r="115" fill="none" stroke="var(--line)" stroke-width="1"/>
      <circle cx="150" cy="130" r="100" fill="none" stroke="var(--detail)" stroke-width="1.2" stroke-dasharray="12 8"/>
      <line class="detail" x1="45" y1="130" x2="255" y2="130"/>
      <line class="detail" x1="150" y1="25" x2="150" y2="235"/>
      <text class="label" x="25" y="248" font-size="4.2" letter-spacing="1.5">AUDIRA TOKAMAK FUSION CORE · D-T MAGNETIC CONFINEMENT (Q >= 10)</text>
    </g>`;

    // 2. Cryostat Octagonal Base Shell
    const CX = 160, CY = 140, BASE_Z = PLZ;
    svg += boxc(CX - 95, CY - 95, BASE_Z, 190, 190, 22, 14, 'cryo-base');
    svg += `<g transform="${TOP(CX - 95, CY - 95, BASE_Z + 22)}">
      <circle cx="95" cy="95" r="90" fill="none" stroke="var(--line)" stroke-width="1.4"/>
      <circle cx="95" cy="95" r="82" fill="none" stroke="var(--detail)" stroke-width="1" stroke-dasharray="8 6"/>
      ${slits(25, 70, 3, 20, 45)}
      ${slits(120, 165, 3, 20, 45)}
    </g>`;

    // 3. Central Solenoid Magnetic Stack
    const CS_Z = BASE_Z + 22, CS_R = 28, CS_H = 135;
    svg += box(CX - CS_R, CY - CS_R, CS_Z, CS_R * 2, CS_R * 2, CS_H, 10);
    svg += `<g transform="${TOP(CX - CS_R, CY - CS_R, CS_Z + CS_H)}">
      <circle cx="${CS_R}" cy="${CS_R}" r="${CS_R - 3}" fill="none" stroke="var(--accent-hi)" stroke-width="1.4"/>
      <circle cx="${CS_R}" cy="${CS_R}" r="${CS_R - 10}" fill="none" stroke="var(--detail)" stroke-width="0.8"/>
      <text class="label" x="${CS_R}" y="${CS_R + 3}" font-size="3.2" text-anchor="middle">CENTRAL SOLENOID</text>
    </g>`;

    // 4. EIGHT SUPERCONDUCTING D-COILS
    const coilAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    coilAngles.forEach((deg) => {
      const rad = deg * Math.PI / 180;
      const cDist = 65;
      const x = CX + cDist * Math.cos(rad);
      const y = CY + cDist * Math.sin(rad);

      svg += `<g class="mag-coil">`;
      svg += box(x - 9, y - 9, CS_Z, 18, 18, CS_H, 4);
      svg += `<g transform="${TOP(x - 9, y - 9, CS_Z + CS_H)}">
        <circle cx="9" cy="9" r="6" fill="none" stroke="var(--accent)" stroke-width="1"/>
      </g>`;
      svg += `</g>`;
    });

    // 5. LIVING TOROIDAL BURNING PLASMA RING WITH MULTI-LAYER STREAMS
    const PLAS_Z = CS_Z + 45;
    const [plasPx, plasPy] = P(CX, CY, PLAS_Z);

    svg += `<g id="plasma-core-unit" class="plasma-core">
      <!-- Toroidal Vacuum Chamber Vessel Outline -->
      <ellipse cx="${plasPx}" cy="${plasPy}" rx="68" ry="40" fill="none" stroke="var(--line)" stroke-width="2.5"/>
      <ellipse cx="${plasPx}" cy="${plasPy}" rx="38" ry="22" fill="none" stroke="var(--line)" stroke-width="2.5"/>

      <!-- Inner High-Intensity Fusion Core -->
      <ellipse id="tok-plasma-inner" cx="${plasPx}" cy="${plasPy}" rx="54" ry="32" fill="none" stroke="url(#tok-plasma-grad)" stroke-width="16" filter="url(#glow)"/>

      <!-- Counter-rotating plasma stream arcs -->
      <path id="tok-stream-cw" class="plasma-stream" stroke="#ffffff" stroke-width="3" stroke-dasharray="16 12" filter="url(#soft)" d="M ${plasPx-54} ${plasPy} A 54 32 0 1 1 ${plasPx+54} ${plasPy} A 54 32 0 1 1 ${plasPx-54} ${plasPy}"/>
      <path id="tok-stream-ccw" class="plasma-stream" stroke="#00e5ff" stroke-width="2.5" stroke-dasharray="10 14" filter="url(#glow)" d="M ${plasPx-46} ${plasPy} A 46 27 0 1 0 ${plasPx+46} ${plasPy} A 46 27 0 1 0 ${plasPx-46} ${plasPy}"/>

      <!-- Central Magnetic Field Pulse Wave -->
      <ellipse id="tok-mag-pulse" cx="${plasPx}" cy="${plasPy}" rx="38" ry="22" fill="none" stroke="var(--accent-hi)" stroke-width="1.5" opacity="0.8"/>
    </g>`;

    // 6. TANGENTIAL NEUTRAL BEAM INJECTOR & RF HEATING PORTS
    const NBI_X = CX + 80, NBI_Y = CY - 20, NBI_Z = CS_Z + 30;
    svg += box(NBI_X, NBI_Y, NBI_Z, 55, 30, 28, 4);
    svg += `<g transform="${TOP(NBI_X, NBI_Y, NBI_Z + 28)}">
      <rect class="detail" x="4" y="4" width="47" height="22" rx="2"/>
      <text class="label" x="27" y="15" font-size="3" text-anchor="middle">NEUTRAL BEAM 1</text>
    </g>`;

    // Injected neutral beam laser line
    const [nb1X, nb1Y] = P(NBI_X, NBI_Y + 15, NBI_Z + 14);
    svg += `<line id="nbi-beam-line" x1="${nb1X}" y1="${nb1Y}" x2="${plasPx + 20}" y2="${plasPy + 10}" stroke="url(#nbi-beam)" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>`;

    // 7. PLASMA IGNITION SHOCKWAVE EFFECT (Activated on Trigger)
    svg += `<g id="fusion-burst-fx" opacity="0" style="transition: opacity 0.2s ease;">
      <ellipse cx="${plasPx}" cy="${plasPy}" rx="110" ry="65" fill="none" stroke="var(--accent-hi)" stroke-width="3.5" filter="url(#glow)"/>
      <ellipse cx="${plasPx}" cy="${plasPy}" rx="140" ry="82" fill="none" stroke="#e040fb" stroke-width="2" stroke-dasharray="12 8" filter="url(#soft)"/>
      ${Array.from({length: 8}).map((_, i) => {
        const a = (i * 45) * Math.PI / 180;
        const x2 = plasPx + 150 * Math.cos(a), y2 = plasPy + 88 * Math.sin(a);
        return `<line x1="${plasPx}" y1="${plasPy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="6 4" filter="url(#soft)"/>`;
      }).join('')}
    </g>`;

    // 8. NOC TELEMETRY CONSOLE (Front left)
    const NOC_X = 25, NOC_Y = 25, NOC_Z = PLZ;
    svg += box(NOC_X, NOC_Y, NOC_Z, 70, 48, 26, 4);
    svg += `<g transform="${TOP(NOC_X, NOC_Y, NOC_Z + 26)}">
      <rect class="detail" x="4" y="4" width="62" height="40" rx="2"/>
      <rect class="glass" x="8" y="8" width="54" height="32" rx="2"/>
      <text class="scr" id="tok-ip" x="12" y="18" font-size="3.8">Ip: 15.24 MA · B: 11.8T</text>
      <text class="scr-accent" id="tok-q" x="12" y="27" font-size="4">GAIN: Q = 10.4</text>
      <text class="label" id="tok-pwr" x="12" y="35" font-size="3.2">OUTPUT: 520 MWth</text>
    </g>`;

    stage.innerHTML = svg;

    // AUDIO SYNTHESIZER
    const playTokamakSound = (type) => {
      try {
        const audio = api.audio();
        if (!audio || !audio.ctx) return;
        const { ctx, out } = audio;
        const now = ctx.currentTime;

        if (type === 'ignition') {
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(45, now);
          osc1.frequency.exponentialRampToValueAtTime(320, now + 0.4);
          gain1.gain.setValueAtTime(0.3, now);
          gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          osc1.connect(gain1);
          gain1.connect(out);
          osc1.start(now);
          osc1.stop(now + 0.7);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(80, now);
          osc2.frequency.linearRampToValueAtTime(35, now + 0.6);
          gain2.gain.setValueAtTime(0.4, now);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc2.connect(gain2);
          gain2.connect(out);
          osc2.start(now);
          osc2.stop(now + 0.65);
        } else if (type === 'confinement') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(120, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.35);
        }
      } catch (e) {}
    };

    // REAL-TIME ANIMATION LOOP
    const streamCw = stage.querySelector('#tok-stream-cw');
    const streamCcw = stage.querySelector('#tok-stream-ccw');
    const magPulse = stage.querySelector('#tok-mag-pulse');
    const ipText = stage.querySelector('#tok-ip');
    const burstFx = stage.querySelector('#fusion-burst-fx');
    const qText = stage.querySelector('#tok-q');
    const pwrText = stage.querySelector('#tok-pwr');

    let tick = 0;
    api.every(40, () => {
      tick++;

      // 1. Counter-rotating plasma stream dashes
      if (streamCw) streamCw.setAttribute('stroke-dashoffset', (-tick * 2.8).toFixed(1));
      if (streamCcw) streamCcw.setAttribute('stroke-dashoffset', (tick * 3.4).toFixed(1));

      // 2. Expanding magnetic pulse wave
      if (magPulse) {
        const pulseProg = (tick % 40) / 40;
        const rx = 38 + pulseProg * 26;
        const ry = 22 + pulseProg * 16;
        magPulse.setAttribute('rx', rx.toFixed(1));
        magPulse.setAttribute('ry', ry.toFixed(1));
        magPulse.style.opacity = (1 - pulseProg).toFixed(2);
      }

      // 3. Telemetry jitter
      if (tick % 7 === 0 && ipText) {
        const jitterIp = (15.20 + Math.sin(tick * 0.2) * 0.08).toFixed(2);
        ipText.textContent = `Ip: ${jitterIp} MA · B: 11.8T`;
      }
    });

    let ignCount = 0;
    const ignitePlasma = () => {
      playTokamakSound('ignition');
      stage.classList.add('tok-ignite');
      ignCount++;
      const qVals = ['GAIN: Q = 11.2', 'GAIN: Q = 14.5 (PEAK)', 'GAIN: Q = 10.8', 'GAIN: Q = 12.1'];
      const pwrVals = ['OUTPUT: 560 MWth', 'OUTPUT: 720 MWth', 'OUTPUT: 540 MWth', 'OUTPUT: 610 MWth'];
      if (qText) qText.textContent = qVals[ignCount % qVals.length];
      if (pwrText) pwrText.textContent = pwrVals[ignCount % pwrVals.length];

      api.readout('PLASMA IGNITION TRIGGERED · LAWSON CRITERION MET · 152M °C · B-FIELD: 11.8 TESLA');
      if (burstFx) burstFx.style.opacity = '1';
      setTimeout(() => {
        if (burstFx) burstFx.style.opacity = '0';
        stage.classList.remove('tok-ignite');
      }, 650);
    };

    const coreUnit = stage.querySelector('#plasma-core-unit');
    if (coreUnit) coreUnit.addEventListener('click', ignitePlasma);

    api.readout('TOKAMAK FUSION CORE · D-T PLASMA CONFINED · 11.8 TESLA · READY');

    return {
      key(e) {
        if (e.key === ' ' || e.code === 'Space') {
          ignitePlasma();
          return true;
        }
        if (e.key === '1') {
          playTokamakSound('confinement');
          api.readout('POLOIDAL FIELD COILS ENGAGED · PLASMA ELONGATION: 1.85');
          return true;
        }
        if (e.key === '2') {
          playTokamakSound('confinement');
          api.readout('DEUTERIUM-TRITIUM PELLET INJECTOR: 20 HZ · DENSITY: 1.4e20 m⁻³');
          return true;
        }
        if (e.key === '3') {
          ignitePlasma();
          return true;
        }
        if (e.key === '4') {
          api.readout('DIVERTOR THERMAL EXHAUST NOMINAL · HEAT FLUX: 8.5 MW/m²');
          return true;
        }
        return false;
      },
      unmount() {
        stage.classList.remove('tok-ignite');
      }
    };
  }
});
