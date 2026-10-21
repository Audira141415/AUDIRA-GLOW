/* Fig 5 — Audira Radiophonic World Band Tube Radio (Vintage Valve Shortwave Receiver) */
FIGS.push({
  id: 'audira-radio',
  name: 'Audira Tube Radio',
  hint: 'Click Tuning Dial or Keys 1–5 to tune stations · Space auto-seeks · Band AM/FM/SW',
  aria: 'Isometric vintage world-band tube radio with backlit analog frequency glass, sweeping tuning needle, glowing EM84 magic eye tube, exposed triode valves, signal strength meter, and telescopic antenna.',
  css: `
    [data-fig="audira-radio"] .tuning-glass { cursor:pointer; }
    [data-fig="audira-radio"] .tuning-glass:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-radio"] .radio-knob { cursor:pointer; }
    [data-fig="audira-radio"] .radio-knob:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-radio"] .magic-eye { fill:#00e676; filter:url(#glow); }
    [data-fig="audira-radio"] .sound-ripple { fill:none; stroke:var(--accent-hi); stroke-width:1.5; stroke-linecap:round; opacity:0; }
    [data-fig="audira-radio"] .rf-wave { fill:none; stroke:var(--accent); stroke-linecap:round; opacity:0.6; }
    [data-fig="audira-radio"] .tube-filament { fill:#ffd54f; filter:url(#glow); }
    .dial-static { animation:rad-flicker 0.15s infinite alternate; }
    @keyframes rad-flicker { 0% { opacity:0.3; } 100% { opacity:0.8; } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [320, 0, 7], [320, 260, 0], [0, 0, 7],
      [20, 20, 240], [300, 20, 240], [20, 240, 240], [300, 240, 240]
    ]);
    const { TOP, FRONT, SIDE, box, boxc, path, P } = K;
    const slits = api.iso.slits;

    const PLZ = 8;
    const BX = 26, BY = 26, BW = 268, BD = 208, BH = 100, BT = PLZ + BH, BF = BY + BD;

    let svg = `<defs>
      <linearGradient id="radio-dial-glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffb300" stop-opacity="0.25"/>
        <stop offset="50%" stop-color="#ffd54f" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#ffb300" stop-opacity="0.25"/>
      </linearGradient>
      <radialGradient id="magic-eye-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#00e676"/>
        <stop offset="85%" stop-color="#00897b"/>
        <stop offset="100%" stop-color="#004d40"/>
      </radialGradient>
    </defs>`;

    // 1. Base Dais Foundation (Polished dark walnut stand)
    svg += box(0, 0, 0, 320, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="10" y="10" width="300" height="240" rx="10"/>
      <circle class="face recess" cx="20" cy="20" r="3"/>
      <circle class="face recess" cx="300" cy="20" r="3"/>
      <circle class="face recess" cx="20" cy="240" r="3"/>
      <circle class="face recess" cx="300" cy="240" r="3"/>
      <text class="label" x="25" y="248" font-size="4.2" letter-spacing="1.5">AUDIRA RADIOPHONIC LABORATORY · MODEL WR-88 VALVE RECEIVER</text>
    </g>`;

    // 2. MAIN VINTAGE BAKELITE / WALNUT CABINET
    svg += boxc(BX, BY, PLZ, BW, BD, BH, 12, 'radio-cabinet');

    // 3. FRONT CONTROL PANEL & LOUVERED SPEAKER GRILLE
    svg += `<g transform="${FRONT(BX, BF, BT)}">
      <!-- Outer Brass Bezel Rim -->
      <rect class="detail" x="8" y="8" width="${BW - 16}" height="${BH - 16}" rx="6" stroke-width="1.5"/>

      <!-- LEFT SIDE: Vintage Woven Acoustic Cloth Speaker Louvers with Live Sound Ripples -->
      <g id="speaker-grille">
        <rect class="face recess" x="14" y="14" width="96" height="${BH - 28}" rx="4"/>
        ${slits(18, 106, 4.5, 18, BH - 18, true, 'detail')}
        <!-- Dynamic Acoustic Sound Waves Expanding from Speaker Center -->
        <circle id="sound-ripple-1" class="sound-ripple" cx="62" cy="${BH / 2}" r="18"/>
        <circle id="sound-ripple-2" class="sound-ripple" cx="62" cy="${BH / 2}" r="28"/>
        <circle id="sound-ripple-3" class="sound-ripple" cx="62" cy="${BH / 2}" r="38"/>
        <circle cx="62" cy="${BH / 2}" r="32" fill="none" stroke="var(--line)" stroke-width="1"/>
        <circle cx="62" cy="${BH / 2}" r="16" fill="var(--deck)" stroke="var(--detail)" stroke-width="1"/>
        <!-- Golden Center Badge -->
        <rect class="face" x="48" y="${BH / 2 - 5}" width="28" height="10" rx="2" fill="#ffd54f" stroke="#ffb300"/>
        <text class="label" x="62" y="${BH / 2 + 2}" font-size="3" font-weight="bold" text-anchor="middle" fill="#000000">AUDIRA</text>
      </g>

      <!-- RIGHT TOP: Illuminated Analog Tuning Glass Scale -->
      <g id="tuning-dial-panel" class="tuning-glass">
        <!-- Backlit Glass Window Frame -->
        <rect class="face recess" x="120" y="14" width="134" height="42" rx="3"/>
        <rect id="dial-backlight" x="122" y="16" width="130" height="38" rx="2" fill="url(#radio-dial-glow)"/>

        <!-- Frequency Scales: FM, AM, SW -->
        <text class="scr" x="126" y="24" font-size="3">FM  88  · 92  · 96  · 100 · 104 · 108 MHz</text>
        <text class="scr" x="126" y="32" font-size="3">AM  530 · 700 · 900 · 1200 · 1400 · 1700 kHz</text>
        <text class="scr" x="126" y="40" font-size="3">SW  3.2 · 6.0 · 9.5 · 12.0 · 15.4 · 21.5 MHz</text>

        <!-- Frequency Scale Ticks -->
        ${slits(128, 246, 3, 20, 22, true, 'wire hot')}
        ${slits(128, 246, 3, 28, 30, true, 'wire hot')}
        ${slits(128, 246, 3, 36, 38, true, 'wire hot')}

        <!-- Red Glowing Sweeping Tuning Needle (Animated smoothly with flywheel inertia) -->
        <line id="dial-needle" x1="165" y1="16" x2="165" y2="52" stroke="#ff1744" stroke-width="2.2" stroke-linecap="round" filter="url(#glow)"/>
      </g>

      <!-- RIGHT MIDDLE: EM84 Magic Eye Green Tuning Indicator Tube -->
      <g id="magic-eye-unit">
        <rect class="face recess" x="120" y="60" width="48" height="12" rx="2"/>
        <!-- Phosphor Green Tuning Target Beams (Animated closing & fluttering) -->
        <rect id="magic-eye-beam-l" class="magic-eye" x="124" y="63" width="16" height="6" rx="1"/>
        <rect id="magic-eye-beam-r" class="magic-eye" x="148" y="63" width="16" height="6" rx="1"/>
        <text class="label" x="120" y="78" font-size="3">MAGIC EYE (EM84)</text>
      </g>

      <!-- S-METER / SIGNAL STRENGTH VU METER -->
      <g id="s-meter-unit">
        <rect class="face recess" x="180" y="60" width="40" height="22" rx="2"/>
        <path d="M 184 76 Q 200 66 216 76" fill="none" stroke="var(--detail)" stroke-width="1"/>
        <line id="s-meter-needle" x1="200" y1="80" x2="208" y2="65" stroke="var(--accent-hi)" stroke-width="1.4" stroke-linecap="round" filter="url(#soft)"/>
        <text class="label" x="200" y="80" font-size="2.5" text-anchor="middle">SIGNAL dB</text>
      </g>

      <!-- Power On Pilot Jewel Indicator -->
      <circle cx="236" cy="68" r="4" fill="none" stroke="var(--line)" stroke-width="1"/>
      <circle id="radio-pilot-led" class="tube-filament" cx="236" cy="68" r="2.5"/>
      <text class="label" x="236" y="78" font-size="2.8" text-anchor="middle">MAINS</text>

      <!-- BOTTOM CONTROL KNOBS -->
      <!-- Knob 1: Tuning Flywheel (Right) with rotating indicator pointer -->
      <g id="knob-tuning" class="radio-knob">
        <circle class="face recess" cx="235" cy="88" r="10"/>
        <circle cx="235" cy="88" r="8" fill="var(--deck)" stroke="var(--accent)" stroke-width="1.2"/>
        <line id="knob-tuning-ptr" x1="235" y1="88" x2="235" y2="80" stroke="var(--accent-hi)" stroke-width="2" stroke-linecap="round"/>
        <text class="label" x="235" y="103" font-size="3" text-anchor="middle">TUNING</text>
      </g>

      <!-- Knob 2: Volume / Power (Center Right) -->
      <g id="knob-vol" class="radio-knob">
        <circle class="face recess" cx="195" cy="88" r="9"/>
        <circle cx="195" cy="88" r="7" fill="var(--deck)" stroke="var(--line)" stroke-width="1.2"/>
        <line id="knob-vol-ptr" x1="195" y1="88" x2="190" y2="82" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
        <text class="label" x="195" y="103" font-size="3" text-anchor="middle">VOLUME</text>
      </g>

      <!-- Knob 3: Band Selector Rotary Switch (Center Left) -->
      <g id="knob-band" class="radio-knob">
        <circle class="face recess" cx="155" cy="88" r="9"/>
        <circle cx="155" cy="88" r="7" fill="var(--deck)" stroke="var(--line)" stroke-width="1.2"/>
        <line id="knob-band-ptr" x1="155" y1="88" x2="155" y2="81" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round"/>
        <text class="label" id="lbl-band-name" x="155" y="103" font-size="3" text-anchor="middle">BAND: FM</text>
      </g>
    </g>`;

    // 4. TOP DECK: EXPOSED DUAL VACUUM TUBES & TELESCOPIC ANTENNA
    // Valve 1 (Left Triode Preamp)
    const TUBE1_X = BX + 65, TUBE1_Y = BY + 45, TUBE_Z = BT;
    svg += `<g id="tube-valve-1" class="radio-knob">`;
    svg += box(TUBE1_X - 12, TUBE1_Y - 12, TUBE_Z, 24, 24, 6, 4);
    svg += `<g transform="${TOP(TUBE1_X - 12, TUBE1_Y - 12, TUBE_Z + 6)}">
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--line)" stroke-width="1"/>
      <circle id="valve-filament-1" class="tube-filament" cx="12" cy="12" r="7"/>
      <circle cx="12" cy="12" r="3" fill="#ffffff"/>
    </g>`;
    const [t1Px, t1Py] = P(TUBE1_X, TUBE1_Y, TUBE_Z + 36);
    svg += `<ellipse id="valve-glass-1" cx="${t1Px}" cy="${t1Py}" rx="14" ry="22" fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.65"/>`;
    svg += `</g>`;

    // Valve 2 (Right Power Pentode)
    const TUBE2_X = BX + 115, TUBE2_Y = BY + 45;
    svg += `<g id="tube-valve-2" class="radio-knob">`;
    svg += box(TUBE2_X - 12, TUBE2_Y - 12, TUBE_Z, 24, 24, 6, 4);
    svg += `<g transform="${TOP(TUBE2_X - 12, TUBE2_Y - 12, TUBE_Z + 6)}">
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--line)" stroke-width="1"/>
      <circle id="valve-filament-2" class="tube-filament" cx="12" cy="12" r="7"/>
      <circle cx="12" cy="12" r="3" fill="#ffffff"/>
    </g>`;
    const [t2Px, t2Py] = P(TUBE2_X, TUBE2_Y, TUBE_Z + 36);
    svg += `<ellipse id="valve-glass-2" cx="${t2Px}" cy="${t2Py}" rx="14" ry="22" fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.65"/>`;
    svg += `</g>`;

    // 5. TELESCOPIC CHROME ANTENNA WITH RADIATING RF PROPAGATION RINGS
    const ANT_X = BX + 22, ANT_Y = BY + 25, ANT_Z = BT;
    const [antBaseX, antBaseY] = P(ANT_X, ANT_Y, ANT_Z);
    const [antTipX, antTipY] = P(ANT_X - 35, ANT_Y - 45, ANT_Z + 115);

    svg += `<g id="radio-antenna">
      <circle cx="${antBaseX}" cy="${antBaseY}" r="4" fill="var(--deck)" stroke="var(--line)" stroke-width="1.2"/>
      <line x1="${antBaseX}" y1="${antBaseY}" x2="${antTipX}" y2="${antTipY}" stroke="#cfd8dc" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${antTipX}" cy="${antTipY}" r="3.5" fill="#ffd54f" filter="url(#soft)"/>
      <!-- Radiating Skywave RF propagation rings -->
      <circle id="rf-wave-1" class="rf-wave" cx="${antTipX}" cy="${antTipY}" r="12"/>
      <circle id="rf-wave-2" class="rf-wave" cx="${antTipX}" cy="${antTipY}" r="22"/>
      <circle id="rf-wave-3" class="rf-wave" cx="${antTipX}" cy="${antTipY}" r="32"/>
    </g>`;

    stage.innerHTML = svg;

    // -------------------------------------------------------------
    // AUDIO ENGINE: Real Web Audio Tuner with Music & Shortwave
    // -------------------------------------------------------------
    const STATIONS = [
      { name: '88.5 CYBER-FM · SYNTH ARPEGGIO', pos: 135, freq: '88.5 MHz', band: 'FM', type: 'synth' },
      { name: '96.4 TOKYO-JAZZ · ELECTRIC CHORD', pos: 165, freq: '96.4 MHz', band: 'FM', type: 'jazz' },
      { name: '104.2 SYNTHWAVE · COSMIC LO-FI', pos: 205, freq: '104.2 MHz', band: 'FM', type: 'ambient' },
      { name: '7.200 NUMBERS · MYSTERY SHORTWAVE', pos: 150, freq: '7.20 MHz', band: 'SW', type: 'numbers' },
      { name: '14.150 BEACON · MORSE TELEGRAPHY', pos: 220, freq: '14.15 MHz', band: 'SW', type: 'morse' }
    ];

    let currentStationIdx = 1;
    let targetNeedleX = 165;
    let currentNeedleX = 165;
    let isTuning = false;

    let audioLoopStep = 0;
    let audioBeatTrigger = 0;

    const playRadioTone = () => {
      try {
        const audio = api.audio();
        if (!audio || !audio.ctx) return;
        const { ctx, out } = audio;
        const now = ctx.currentTime;
        const st = STATIONS[currentStationIdx];
        audioBeatTrigger = 1.0;

        if (st.type === 'synth') {
          const scale = [220, 277.18, 329.63, 440, 554.37];
          const freq = scale[audioLoopStep % scale.length];
          audioLoopStep++;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (st.type === 'jazz') {
          const chord = [330, 415.3, 493.88];
          chord.forEach(f => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(out);
            osc.start(now);
            osc.stop(now + 0.38);
          });
        } else if (st.type === 'ambient') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(164.81 + (audioLoopStep % 3) * 20, now);
          audioLoopStep++;
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.5);
        } else if (st.type === 'numbers') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600 + (audioLoopStep % 5) * 150, now);
          audioLoopStep++;
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.12);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (st.type === 'morse') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.08);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.09);
        }
      } catch (e) {}
    };

    const playStaticTuning = () => {
      try {
        const audio = api.audio();
        if (!audio || !audio.ctx) return;
        const { ctx, out } = audio;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(out);
        osc.start(now);
        osc.stop(now + 0.25);

        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.12, now);
        nGain.gain.linearRampToValueAtTime(0, now + 0.2);
        noise.connect(nGain);
        noise.connect(out);
        noise.start(now);
      } catch (e) {}
    };

    // -------------------------------------------------------------
    // REAL-TIME ANIMATION LOOP & FLYWHEEL TUNING PHYSICS
    // -------------------------------------------------------------
    const needleEl = stage.querySelector('#dial-needle');
    const eyeBeamL = stage.querySelector('#magic-eye-beam-l');
    const eyeBeamR = stage.querySelector('#magic-eye-beam-r');
    const sMeterNeedle = stage.querySelector('#s-meter-needle');
    const bandLabel = stage.querySelector('#lbl-band-name');
    const dialBacklight = stage.querySelector('#dial-backlight');
    const tuningPtr = stage.querySelector('#knob-tuning-ptr');

    const rip1 = stage.querySelector('#sound-ripple-1');
    const rip2 = stage.querySelector('#sound-ripple-2');
    const rip3 = stage.querySelector('#sound-ripple-3');

    const rf1 = stage.querySelector('#rf-wave-1');
    const rf2 = stage.querySelector('#rf-wave-2');
    const rf3 = stage.querySelector('#rf-wave-3');

    const fil1 = stage.querySelector('#valve-filament-1');
    const fil2 = stage.querySelector('#valve-filament-2');

    let tick = 0;

    api.every(30, () => {
      tick++;

      // 1. Smooth Flywheel Needle Sweeping (Lerp physics)
      if (needleEl) {
        currentNeedleX += (targetNeedleX - currentNeedleX) * 0.22;
        needleEl.setAttribute('x1', currentNeedleX.toFixed(1));
        needleEl.setAttribute('x2', currentNeedleX.toFixed(1));

        // Rotate tuning knob pointer in sync with needle
        if (tuningPtr) {
          const ang = currentNeedleX * 0.15;
          const kx = 235 + 8 * Math.cos(ang);
          const ky = 88 + 8 * Math.sin(ang);
          tuningPtr.setAttribute('x2', kx.toFixed(1));
          tuningPtr.setAttribute('y2', ky.toFixed(1));
        }
      }

      // 2. Speaker Grille Acoustic Sound Ripples (Expanding on audio beat)
      if (audioBeatTrigger > 0) {
        audioBeatTrigger -= 0.08;
      }
      if (rip1 && rip2 && rip3) {
        const rBase = 18 + (tick % 24) * 0.8;
        rip1.setAttribute('r', rBase.toFixed(1));
        rip1.style.opacity = (Math.max(0, audioBeatTrigger) * (1 - (tick % 24) / 24)).toFixed(2);

        const r2 = 28 + (tick % 24) * 0.6;
        rip2.setAttribute('r', r2.toFixed(1));
        rip2.style.opacity = (Math.max(0, audioBeatTrigger * 0.8) * (1 - (tick % 24) / 24)).toFixed(2);

        const r3 = 38 + (tick % 24) * 0.4;
        rip3.setAttribute('r', r3.toFixed(1));
        rip3.style.opacity = (Math.max(0, audioBeatTrigger * 0.5) * (1 - (tick % 24) / 24)).toFixed(2);
      }

      // 3. EM84 Magic Eye Tube Live Audio Flutter
      if (eyeBeamL && eyeBeamR) {
        if (isTuning) {
          eyeBeamL.setAttribute('width', '8');
          eyeBeamR.setAttribute('x', '156');
          eyeBeamR.setAttribute('width', '8');
        } else {
          // Closed beams with music vibration pulse
          const beamW = 20 + Math.sin(tick * 0.3) * 3 * audioBeatTrigger;
          eyeBeamL.setAttribute('width', beamW.toFixed(1));
          eyeBeamR.setAttribute('x', (164 - beamW).toFixed(1));
          eyeBeamR.setAttribute('width', beamW.toFixed(1));
        }
      }

      // 4. Ballistic S-Meter Flutter
      if (sMeterNeedle) {
        if (isTuning) {
          sMeterNeedle.setAttribute('x2', '190');
          sMeterNeedle.setAttribute('y2', '75');
        } else {
          const meterPeak = 206 + Math.sin(tick * 0.25) * 4 * Math.max(0.2, audioBeatTrigger);
          sMeterNeedle.setAttribute('x2', meterPeak.toFixed(1));
          sMeterNeedle.setAttribute('y2', (65 - (meterPeak - 206) * 0.5).toFixed(1));
        }
      }

      // 5. Radiating RF Waves from Antenna Tip
      if (rf1 && rf2 && rf3) {
        const rfR1 = 10 + (tick % 30) * 1.0;
        rf1.setAttribute('r', rfR1.toFixed(1));
        rf1.style.opacity = (0.7 * (1 - (tick % 30) / 30)).toFixed(2);

        const rfR2 = 18 + (tick % 30) * 1.0;
        rf2.setAttribute('r', rfR2.toFixed(1));
        rf2.style.opacity = (0.5 * (1 - (tick % 30) / 30)).toFixed(2);

        const rfR3 = 26 + (tick % 30) * 1.0;
        rf3.setAttribute('r', rfR3.toFixed(1));
        rf3.style.opacity = (0.3 * (1 - (tick % 30) / 30)).toFixed(2);
      }

      // 6. Filament Thermal Hum
      if (fil1 && fil2) {
        const fR = 7 + Math.sin(tick * 0.15) * 0.6;
        fil1.setAttribute('r', fR.toFixed(1));
        fil2.setAttribute('r', fR.toFixed(1));
      }
    });

    const tuneToStation = (idx) => {
      playStaticTuning();
      isTuning = true;
      currentStationIdx = (idx + STATIONS.length) % STATIONS.length;
      const st = STATIONS[currentStationIdx];
      targetNeedleX = st.pos;

      if (dialBacklight) dialBacklight.classList.add('dial-static');
      if (bandLabel) bandLabel.textContent = `BAND: ${st.band}`;

      setTimeout(() => {
        isTuning = false;
        if (dialBacklight) dialBacklight.classList.remove('dial-static');
        api.readout(`TUNED: ${st.name} · SIGNAL 99% · MAGIC EYE LOCKED`);
        playRadioTone();
      }, 250);
    };

    // Continuous Periodic Music Notes
    api.every(260, () => {
      if (!isTuning) playRadioTone();
    });

    // CLICK HANDLERS
    const dialGlass = stage.querySelector('#tuning-dial-panel');
    if (dialGlass) dialGlass.addEventListener('click', () => tuneToStation(currentStationIdx + 1));

    const tuningKnob = stage.querySelector('#knob-tuning');
    if (tuningKnob) tuningKnob.addEventListener('click', () => tuneToStation(currentStationIdx + 1));

    const bandKnob = stage.querySelector('#knob-band');
    if (bandKnob) {
      bandKnob.addEventListener('click', () => {
        tuneToStation(currentStationIdx + 1);
      });
    }

    const st0 = STATIONS[currentStationIdx];
    api.readout(`TUNED: ${st0.name} · SIGNAL 99% · MAGIC EYE LOCKED`);

    return {
      key(e) {
        if (e.key === ' ' || e.code === 'Space') {
          tuneToStation(currentStationIdx + 1);
          return true;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          tuneToStation(currentStationIdx + 1);
          return true;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          tuneToStation(currentStationIdx - 1);
          return true;
        }
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          tuneToStation(parseInt(e.key, 10) - 1);
          return true;
        }
        return false;
      },
      unmount() {}
    };
  }
});
