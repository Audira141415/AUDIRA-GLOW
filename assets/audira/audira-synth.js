/* Fig 1 — Audira DJ Synth & Performance Mixer */
FIGS.push({
  id: 'audira-synth',
  name: 'Audira DJ Synth',
  hint: 'Pads 1-4 & Q-R · Space loop · Click faders & knobs',
  aria: 'Isometric DJ synthesizer and mixer with 8 performance pads, OLED spectrum visualizer, 3 channel faders, crossfader, and rotary knobs. Press keys 1-4 and Q-R to trigger drum and synth voices, or press space to start the groove loop.',
  css: `
    [data-fig="audira-synth"] .pad { cursor:pointer; }
    [data-fig="audira-synth"] .pad:hover .face.top { stroke:var(--ink-hi); }
    [data-fig="audira-synth"] .pad.lit .face { fill:var(--accent); stroke:var(--accent-hi); }
    [data-fig="audira-synth"] .pad.lit .face.top { fill:var(--accent-hi); }
    [data-fig="audira-synth"] .fader-cap { cursor:pointer; transition:transform .12s cubic-bezier(.2,.8,.3,1); }
    [data-fig="audira-synth"] .fader-cap:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-synth"] .oled-spec { fill:none; stroke:var(--accent); stroke-width:1.4; vector-effect:non-scaling-stroke; }
    [data-fig="audira-synth"] .oled-bar { fill:var(--accent); opacity:.85; transition:height .08s ease-out, y .08s ease-out; }
    [data-fig="audira-synth"] .rotary { cursor:pointer; }
    [data-fig="audira-synth"] .rotary:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-synth"] .play-btn.latched .face { fill:var(--accent); stroke:var(--accent-hi); }
    [data-fig="audira-synth"] .play-btn.latched .face.top { fill:var(--accent-hi); }
    [data-fig="audira-synth"] .play-btn.latched path { fill:var(--panel); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [320, 0, 7], [320, 260, 0], [0, 0, 7],
      [20, 20, 52], [300, 20, 52], [20, 240, 52], [300, 240, 52]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits, esc = api.iso.esc;

    const PLZ = 7;
    const BX = 20, BY = 20, BW = 280, BD = 220, BH = 32, BT = PLZ + BH, BF = BY + BD;

    let svg = `<defs>
      <clipPath id="synth-screen-clip"><rect x="6" y="6" width="108" height="68" rx="4"/></clipPath>
    </defs>`;

    // Base plate
    svg += box(0, 0, 0, 320, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="9" y="9" width="302" height="242" rx="10"/>
      ${[[18, 18], [302, 18], [18, 242], [302, 242]].map(([x, y]) =>
        `<circle class="face recess" cx="${x}" cy="${y}" r="3"/><line class="detail" x1="${x - 1.8}" y1="${y}" x2="${x + 1.8}" y2="${y}"/>`
      ).join('')}
      <rect class="face recess" x="24" y="238" width="60" height="4" rx="2"/>
    </g>`;

    // Main chassis
    svg += box(BX, BY, PLZ, BW, BD, BH, 8);

    // Front face detail
    svg += `<g transform="${FRONT(BX, BF, BT)}">
      ${slits(12, 60, 3, 6, 22)}
      <text class="label" x="80" y="19" font-size="7" letter-spacing="2">AUDIRA · DJ-8X</text>
      <circle class="led hot" id="synth-power-led" filter="url(#soft)" cx="210" cy="18" r="2"/>
      <text class="label" x="218" y="20" font-size="5" letter-spacing="1">PWR</text>
      ${slits(242, 268, 3, 6, 22)}
    </g>`;

    // Side face detail (audio outputs)
    svg += `<g transform="${SIDE(BX + BW, BF, BT)}">
      ${slits(16, 70, 3.5, 8, 24)}
      <circle class="face recess" cx="120" cy="16" r="6"/>
      <circle class="face recess" cx="138" cy="16" r="6"/>
      <text class="label" x="110" y="28" font-size="4">MASTER OUT</text>
      ${slits(160, 204, 3.5, 8, 24)}
    </g>`;

    // Top deck plate recess
    svg += `<g transform="${TOP(BX, BY, BT)}">
      <rect class="face recess" x="8" y="8" width="${BW - 16}" height="${BD - 16}" rx="6"/>
      <line class="detail" x1="126" y1="14" x2="126" y2="${BD - 14}"/>
      <line class="detail" x1="14" y1="120" x2="120" y2="120"/>
      <line class="detail" x1="134" y1="120" x2="${BW - 14}" y2="120"/>
      
      <text class="label" x="18" y="22" font-size="5" letter-spacing="1.5">PERFORMANCE PADS</text>
      <text class="label" x="136" y="22" font-size="5" letter-spacing="1.5">AUDIO SPECTRUM</text>
      <text class="label" x="18" y="132" font-size="5" letter-spacing="1.5">MACRO CONTROLS</text>
      <text class="label" x="136" y="132" font-size="5" letter-spacing="1.5">4-CH MIXER</text>
    </g>`;

    // SECTION 1: 8 Performance Pads (4x2)
    const PAD_NAMES = ['KICK', 'SNARE', 'HI-HAT', 'CLAP', 'SUB BASS', 'LEAD', 'CHORD', 'VOCAL FX'];
    const PAD_KEYS = ['1', '2', '3', '4', 'q', 'w', 'e', 'r'];
    const PAD_W = 20, PAD_D = 20, PAD_H = 5;
    const P0X = BX + 16, P0Y = BY + 32;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 4 + col;
        const px = P0X + col * 24;
        const py = P0Y + row * 26;
        svg += `<g class="press pad" id="synth-pad-${idx}" data-idx="${idx}" data-key="${PAD_KEYS[idx]}">
          ${box(px, py, BT, PAD_W, PAD_D, PAD_H, 2)}
          <g transform="${TOP(px, py, BT + PAD_H)}">
            <text class="label" x="${PAD_W / 2}" y="${PAD_D / 2 + 1}" font-size="4.2" text-anchor="middle">${PAD_NAMES[idx]}</text>
            <text class="label" x="${PAD_W - 3}" y="6" font-size="3.2" text-anchor="end">${PAD_KEYS[idx].toUpperCase()}</text>
          </g>
        </g>`;
      }
    }

    // Macro Knobs below pads (Left bottom)
    const KNOB_Y = BY + 150;
    for (let k = 0; k < 3; k++) {
      const kx = BX + 24 + k * 34;
      svg += `<g class="rotary" id="synth-macro-${k}" data-k="${k}">
        ${box(kx, KNOB_Y, BT, 18, 18, 7, 9)}
        <g transform="${TOP(kx, KNOB_Y, BT + 7)}">
          <circle class="face recess" cx="9" cy="9" r="6"/>
          <line class="detail macro-pointer" id="synth-ptr-${k}" x1="9" y1="9" x2="9" y2="3"/>
          <text class="label" x="9" y="24" font-size="4" text-anchor="middle">${['FILTER', 'REVERB', 'TEMPO'][k]}</text>
        </g>
      </g>`;
    }

    // Play / Loop Button
    const PLAY_X = BX + 22, PLAY_Y = BY + 190;
    svg += `<g class="press play-btn latched" id="synth-play-btn">
      ${box(PLAY_X, PLAY_Y, BT, 38, 18, 5, 3)}
      <g transform="${TOP(PLAY_X, PLAY_Y, BT + 5)}">
        <path d="M12 5 L26 9 L12 13 Z" fill="var(--ink)"/>
        <text class="label" x="25" y="10.5" font-size="4.5" letter-spacing="1">AUTO</text>
      </g>
    </g>`;

    // Tap Tempo Button
    const TAP_X = BX + 68, TAP_Y = BY + 190;
    svg += `<g class="press" id="synth-tap-btn">
      ${box(TAP_X, TAP_Y, BT, 38, 18, 5, 3)}
      <g transform="${TOP(TAP_X, TAP_Y, BT + 5)}">
        <text class="label" x="19" y="10.5" font-size="4.5" text-anchor="middle" letter-spacing="1">TAP BPM</text>
      </g>
    </g>`;

    // SECTION 2: Center OLED Spectrum Display
    const SX = BX + 144, SY = BY + 28, SW = 120, SD = 80;
    svg += box(SX, SY, BT, SW, SD, 4, 3);
    svg += `<g transform="${TOP(SX, SY, BT + 4)}">
      <rect class="face recess" x="4" y="4" width="${SW - 8}" height="${SD - 8}" rx="4"/>
      <rect class="halo hot" x="6" y="6" width="${SW - 12}" height="${SD - 12}" rx="3" filter="url(#bloom)"/>
      <rect class="face glass hot" id="synth-screen-glass" filter="url(#soft)" x="6" y="6" width="${SW - 12}" height="${SD - 12}" rx="3"/>
      
      <g clip-path="url(#synth-screen-clip)">
        <text class="scr" x="12" y="15" font-size="5" letter-spacing="1">128.0 BPM · STEREO</text>
        <text class="scr-accent" id="synth-status" x="78" y="15" font-size="4.5">GROOVE ON</text>
        <line class="detail" x1="10" y1="18" x2="104" y2="18"/>

        <!-- Realtime Spectrum Bars -->
        <g id="synth-bars">
          ${Array.from({ length: 12 }, (_, i) =>
            `<rect class="oled-bar" id="synth-bar-${i}" x="${12 + i * 8}" y="${60 - (i % 3 + 1) * 8}" width="5" height="${(i % 3 + 1) * 8}" rx="1"/>`
          ).join('')}
        </g>

        <!-- Oscilloscope Waveform Line -->
        <path class="oled-spec" id="synth-wave" filter="url(#soft)" d="M12 40 Q30 25, 50 40 T90 35 T104 40"/>
        
        <text class="scr" x="12" y="70" font-size="4">CH-1: +1.2dB</text>
        <text class="scr" x="64" y="70" font-size="4">MASTER: 0dB</text>
      </g>
    </g>`;

    // SECTION 3: 4-Channel Mixer Faders & Crossfader
    const FX = BX + 144, FY = BY + 130;
    for (let ch = 0; ch < 3; ch++) {
      const cx = FX + 12 + ch * 28;
      svg += `<g transform="${TOP(cx, FY + 8, BT)}">
        <rect class="face recess" x="4" y="0" width="3" height="42" rx="1.5"/>
        ${[0, 10, 20, 30, 40].map(v => `<line class="detail" x1="0" y1="${v}" x2="2" y2="${v}"/>`).join('')}
        <text class="label" x="5.5" y="48" font-size="4" text-anchor="middle">CH ${ch + 1}</text>
      </g>`;
      svg += `<g class="fader-cap" id="synth-fader-${ch}" data-ch="${ch}" data-val="60">
        ${box(cx - 2, FY + 20, BT, 15, 10, 6, 1.5)}
        <g transform="${TOP(cx - 2, FY + 20, BT + 6)}">
          <line class="detail" x1="1" y1="5" x2="14" y2="5"/>
          <circle class="led hot" filter="url(#soft)" cx="7.5" cy="5" r="1"/>
        </g>
      </g>`;
    }

    // Master Volume Knob
    const MV_X = FX + 96, MV_Y = FY + 14;
    svg += `<g class="rotary" id="synth-master-vol">
      ${box(MV_X, MV_Y, BT, 22, 22, 8, 11)}
      <g transform="${TOP(MV_X, MV_Y, BT + 8)}">
        <circle class="face recess" cx="11" cy="11" r="7"/>
        <line class="detail" id="synth-master-ptr" x1="11" y1="11" x2="11" y2="4"/>
        <text class="label" x="11" y="27" font-size="4.5" text-anchor="middle">MASTER</text>
      </g>
    </g>`;

    // Horizontal Crossfader at bottom right
    const CF_X = FX + 12, CF_Y = FY + 66;
    svg += `<g transform="${TOP(CF_X, CF_Y, BT)}">
      <rect class="face recess" x="0" y="4" width="76" height="3" rx="1.5"/>
      <text class="label" x="0" y="2" font-size="3.5">A</text>
      <text class="label" x="76" y="2" font-size="3.5" text-anchor="end">B</text>
    </g>`;
    svg += `<g class="fader-cap" id="synth-crossfader" data-val="50">
      ${box(CF_X + 32, CF_Y, BT, 12, 11, 6, 1.5)}
      <g transform="${TOP(CF_X + 32, CF_Y, BT + 6)}">
        <line class="detail" x1="6" y1="1" x2="6" y2="10"/>
      </g>
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      on: true,
      looping: true,
      step: 0,
      bpm: 128,
      lastVoice: 'GROOVE ON',
      faderVals: [75, 60, 85],
      crossVal: 50,
      macros: [50, 30, 65],
      masterVol: 80,
      timer: null,
      idleAnim: null
    };

    const q = s => stage.querySelector(s);
    const pads = [...stage.querySelectorAll('.pad')];

    /* ---------- Web Audio Synthesis ---------- */
    let A = null;
    function getAudio() {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
      } catch (e) {
        A = null;
      }
      return A;
    }

    const PITCHES = [55, 110, 440, 220, 65.4, 329.6, 261.6, 523.2];

    function triggerVoice(idx, playSound = true) {
      st.lastVoice = PAD_NAMES[idx];
      api.flash(pads[idx], 120);

      if (playSound) {
        const a = getAudio();
        if (a) {
          const t = a.ctx.currentTime;
          const dest = a.out;
          try {
            if (idx === 0) {
              const osc = a.ctx.createOscillator(), gain = a.ctx.createGain();
              osc.frequency.setValueAtTime(140, t);
              osc.frequency.exponentialRampToValueAtTime(38, t + 0.35);
              gain.gain.setValueAtTime(1, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
              osc.connect(gain); gain.connect(dest);
              osc.start(t); osc.stop(t + 0.36);
            } else if (idx === 1) {
              const osc = a.ctx.createOscillator(), oscG = a.ctx.createGain();
              osc.type = 'triangle'; osc.frequency.setValueAtTime(180, t);
              oscG.gain.setValueAtTime(0.6, t); oscG.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
              osc.connect(oscG); oscG.connect(dest);
              osc.start(t); osc.stop(t + 0.16);
            } else if (idx === 2) {
              const osc = a.ctx.createOscillator(), g = a.ctx.createGain();
              osc.type = 'square'; osc.frequency.setValueAtTime(8000, t);
              g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
              osc.connect(g); g.connect(dest);
              osc.start(t); osc.stop(t + 0.07);
            } else {
              const osc = a.ctx.createOscillator(), gain = a.ctx.createGain();
              osc.type = idx === 4 ? 'sine' : idx === 5 ? 'sawtooth' : 'triangle';
              osc.frequency.setValueAtTime(PITCHES[idx], t);
              gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
              osc.connect(gain); gain.connect(dest);
              osc.start(t); osc.stop(t + 0.42);
            }
          } catch (e) {}
        }
      }

      bounchWaveform();
      render();
    }

    let tCount = 0;
    function bounchWaveform() {
      tCount++;
      const bars = stage.querySelectorAll('.oled-bar');
      bars.forEach((b, i) => {
        const wave = Math.sin((tCount * 0.4) + i * 0.6);
        const h = Math.floor(10 + Math.abs(wave) * 22 + Math.random() * 6);
        b.setAttribute('y', 64 - h);
        b.setAttribute('height', h);
      });
      const wave = q('#synth-wave');
      if (wave) {
        const y1 = 26 + Math.sin(tCount * 0.5) * 14;
        const y2 = 48 - Math.cos(tCount * 0.4) * 16;
        wave.setAttribute('d', `M12 40 Q30 ${y1.toFixed(1)}, 50 40 T90 ${y2.toFixed(1)} T104 40`);
      }
    }

    // Ambient living motion: waves and spectrum bounce continuously
    st.idleAnim = api.every(90, bounchWaveform);

    function render() {
      api.power(st.on);
      q('#synth-power-led').classList.toggle('hot', st.on);
      q('#synth-screen-glass').classList.toggle('hot', st.on);
      q('.halo').classList.toggle('hot', st.on);
      q('#synth-play-btn').classList.toggle('latched', st.looping);
      const stEl = q('#synth-status');
      if (stEl) stEl.textContent = st.looping ? 'LOOP ON' : st.lastVoice;

      api.readout(
        st.looping
          ? `GROOVING · ${st.bpm} BPM · STEP ${st.step + 1}/8 · PAD ${st.lastVoice}`
          : `AUDIRA DJ · ${st.lastVoice} · 128 BPM`
      );
    }

    function startLoopTimer() {
      if (st.timer) clearInterval(st.timer);
      const PATTERN = [0, 2, 1, 2, 4, 2, 1, 6];
      st.timer = api.every(60000 / st.bpm / 2, () => {
        if (!st.looping) return;
        const v = PATTERN[st.step];
        triggerVoice(v, true);
        st.step = (st.step + 1) % 8;
      });
    }

    function toggleLoop() {
      getAudio();
      st.looping = !st.looping;
      if (st.looping) {
        st.step = 0;
        startLoopTimer();
      } else {
        if (st.timer) clearInterval(st.timer);
        st.timer = null;
      }
      render();
    }

    /* Start loop right away so the synth is immediately groove-playing! */
    startLoopTimer();

    stage.addEventListener('click', e => {
      const pad = e.target.closest('.pad');
      if (pad) {
        triggerVoice(+pad.dataset.idx, true);
        return;
      }
      if (e.target.closest('#synth-play-btn')) {
        toggleLoop();
        return;
      }
      if (e.target.closest('#synth-tap-btn')) {
        api.flash(q('#synth-tap-btn'), 80);
        st.bpm = st.bpm === 128 ? 140 : st.bpm === 140 ? 115 : 128;
        if (st.looping) startLoopTimer();
        render();
        return;
      }
      const fader = e.target.closest('.fader-cap');
      if (fader && fader.dataset.ch) {
        const ch = +fader.dataset.ch;
        st.faderVals[ch] = (st.faderVals[ch] + 25) % 100;
        const dy = (st.faderVals[ch] / 100) * -16;
        fader.style.transform = `translate(0px, ${dy}px)`;
        getAudio();
        bounchWaveform();
        return;
      }
      const rot = e.target.closest('.rotary');
      if (rot && rot.dataset.k) {
        const k = +rot.dataset.k;
        st.macros[k] = (st.macros[k] + 30) % 100;
        const ang = (st.macros[k] / 100) * 270 - 135;
        const ptr = q(`#synth-ptr-${k}`);
        if (ptr) ptr.setAttribute('transform', `rotate(${ang} 9 9)`);
        bounchWaveform();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          if (!e.repeat) toggleLoop();
          return true;
        }
        const k = e.key.toLowerCase();
        const idx = PAD_KEYS.indexOf(k);
        if (idx >= 0) {
          if (!e.repeat) triggerVoice(idx, true);
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        if (st.idleAnim) clearInterval(st.idleAnim);
        api.power(false);
      },
      demo() {
        if (!st.looping) toggleLoop();
      }
    };
  }
});
