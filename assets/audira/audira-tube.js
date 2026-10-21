/* Fig 3 — Audira Valve Interface & Studio Tube DAC */
FIGS.push({
  id: 'audira-tube',
  name: 'Audira Valve DAC',
  hint: 'Warm tube audio active · Click volume knob or tubes to switch',
  aria: 'Isometric studio tube DAC and audio interface with dual glowing vacuum tubes, analog VU meters, heavy knurled volume knob, and coiled headphone cable. Space plays an audio loop and moves the meter needles.',
  css: `
    [data-fig="audira-tube"] .tube-group { cursor:pointer; }
    [data-fig="audira-tube"] .tube-group:hover .tube-glass { stroke:var(--accent); }
    [data-fig="audira-tube"] .tube-filament { fill:none; stroke:var(--accent); stroke-width:1.8; stroke-linecap:round; filter:url(#glow); transition:opacity .3s; }
    [data-fig="audira-tube"] .vu-needle { stroke:var(--accent-hi); stroke-width:1.4; stroke-linecap:round; vector-effect:non-scaling-stroke; transition:transform .08s ease-out; }
    [data-fig="audira-tube"] .vol-knob { cursor:pointer; }
    [data-fig="audira-tube"] .vol-knob:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-tube"] .headphone-plug { cursor:pointer; }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [320, 0, 7], [320, 260, 0], [0, 0, 7],
      [24, 24, 76], [296, 24, 76], [24, 236, 76], [296, 236, 76],
      [310, 240, 10]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits, esc = api.iso.esc;

    const PLZ = 7;
    const BX = 24, BY = 24, BW = 272, BD = 212, BH = 40, BT = PLZ + BH, BF = BY + BD;

    let svg = `<defs>
      <clipPath id="tube-vu-clip-l"><rect x="6" y="6" width="76" height="52" rx="4"/></clipPath>
      <clipPath id="tube-vu-clip-r"><rect x="6" y="6" width="76" height="52" rx="4"/></clipPath>
    </defs>`;

    // Base plate
    svg += box(0, 0, 0, 320, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="9" y="9" width="302" height="242" rx="10"/>
      ${[[18, 18], [302, 18], [18, 242], [302, 242]].map(([x, y]) =>
        `<circle class="face recess" cx="${x}" cy="${y}" r="3"/><line class="detail" x1="${x - 1.8}" y1="${y}" x2="${x + 1.8}" y2="${y}"/>`
      ).join('')}
    </g>`;

    // Main chassis
    svg += box(BX, BY, PLZ, BW, BD, BH, 8);

    // Front Face
    svg += `<g transform="${FRONT(BX, BF, BT)}">
      <circle class="face recess" cx="42" cy="22" r="7"/>
      <circle class="detail" cx="42" cy="22" r="5"/>
      <text class="label" x="42" y="34" font-size="4" text-anchor="middle">HEADPHONES</text>

      ${[90, 110, 130].map((x, i) => `
        <rect class="face recess" x="${x - 4}" y="14" width="8" height="14" rx="2"/>
        <line class="detail" x1="${x}" y1="17" x2="${x}" y2="25"/>
        <circle class="led hot" filter="url(#soft)" cx="${x}" cy="10" r="1.2"/>
        <text class="label" x="${x}" y="34" font-size="3.5" text-anchor="middle">${['48V', 'PAD', 'MONO'][i]}</text>
      `).join('')}

      <text class="label" x="180" y="24" font-size="6" letter-spacing="1.5">AUDIRA · VALVE DAC</text>

      <circle class="face recess" cx="240" cy="20" r="6"/>
      <circle class="led hot" id="tube-power-led" filter="url(#soft)" cx="240" cy="20" r="2.5"/>
      <text class="label" x="240" y="32" font-size="4" text-anchor="middle">POWER</text>
    </g>`;

    // Side face detail
    svg += `<g transform="${SIDE(BX + BW, BF, BT)}">
      ${slits(16, 80, 3.5, 10, 30)}
      <circle class="face recess" cx="130" cy="20" r="8"/>
      <text class="label" x="118" y="34" font-size="4">USB-C</text>
      ${slits(150, 196, 3.5, 10, 30)}
    </g>`;

    // Top deck plate
    svg += `<g transform="${TOP(BX, BY, BT)}">
      <rect class="face recess" x="8" y="8" width="${BW - 16}" height="${BD - 16}" rx="6"/>
      <line class="detail" x1="12" y1="92" x2="${BW - 12}" y2="92"/>
      <text class="label" x="16" y="20" font-size="5" letter-spacing="1.5">CLASS-A TUBE STAGE</text>
      <text class="label" x="16" y="104" font-size="5" letter-spacing="1.5">ANALOG VU MONITORING</text>
    </g>`;

    // SECTION 1: Dual Vacuum Tubes
    const TUBE_Z = BT + 2;
    const TUBES = [
      { x: BX + 58, y: BY + 34, id: 'l' },
      { x: BX + 158, y: BY + 34, id: 'r' },
    ];

    TUBES.forEach((tb) => {
      svg += box(tb.x, tb.y, TUBE_Z, 56, 50, 6, 8);
      svg += `<g transform="${TOP(tb.x, tb.y, TUBE_Z + 6)}">
        <circle class="face recess" cx="28" cy="25" r="22"/>
        ${Array.from({ length: 12 }, (_, a) => {
          const rad = (a * 30 * Math.PI) / 180;
          return `<circle class="face recess" cx="${(28 + 17 * Math.cos(rad)).toFixed(1)}" cy="${(25 + 17 * Math.sin(rad)).toFixed(1)}" r="1.4"/>`;
        }).join('')}
      </g>`;

      const GX = tb.x + 8, GY = tb.y + 7, GW = 40, GD = 36, GH = 34;
      svg += `<g class="tube-group" id="tube-${tb.id}">`;
      svg += box(GX, GY, TUBE_Z + 6, GW, GD, GH, 16);
      
      svg += `<g transform="${FRONT(GX, GY + GD, TUBE_Z + 6 + GH)}">
        <rect class="halo tube-halo hot" x="6" y="6" width="${GW - 12}" height="${GH - 8}" rx="8" filter="url(#bloom)"/>
        <rect class="face recess" x="12" y="8" width="16" height="20" rx="2"/>
        <line class="detail" x1="14" y1="12" x2="26" y2="12"/>
        <line class="detail" x1="14" y1="18" x2="26" y2="18"/>
        <path class="tube-filament" filter="url(#glow)" d="M16 26 L16 16 L20 12 L20 26 L24 16 L24 26"/>
      </g>`;
      svg += `</g>`;
    });

    // SECTION 2: Dual Analog VU Meters
    const VU_Y = BY + 116, VU_W = 88, VU_D = 64, VU_H = 4;
    const METERS = [
      { x: BX + 16,  id: 'l', name: 'VU CH-L' },
      { x: BX + 168, id: 'r', name: 'VU CH-R' },
    ];

    METERS.forEach(m => {
      svg += box(m.x, VU_Y, BT, VU_W, VU_D, VU_H, 4);
      svg += `<g transform="${TOP(m.x, VU_Y, BT + VU_H)}">
        <rect class="face recess" x="4" y="4" width="${VU_W - 8}" height="${VU_D - 8}" rx="4"/>
        <rect class="halo vu-halo hot" x="6" y="6" width="${VU_W - 12}" height="${VU_D - 12}" rx="3" filter="url(#bloom)"/>
        <rect class="face glass hot" filter="url(#soft)" x="6" y="6" width="${VU_W - 12}" height="${VU_D - 12}" rx="3"/>

        <g clip-path="url(#tube-vu-clip-${m.id})">
          <text class="label" x="12" y="16" font-size="4.5" letter-spacing="1">${m.name}</text>
          <path class="detail" d="M16 46 Q44 24, 72 46"/>
          <text class="label" x="18" y="42" font-size="3">-20</text>
          <text class="label" x="32" y="32" font-size="3">-7</text>
          <text class="label" x="44" y="27" font-size="3">0dB</text>
          <text class="scr-accent" x="60" y="34" font-size="3.2">+3</text>

          <line class="vu-needle" id="vu-needle-${m.id}" x1="44" y1="58" x2="44" y2="28" transform="rotate(-15 44 58)"/>
          <circle class="face recess" cx="44" cy="58" r="4"/>
        </g>
      </g>`;
    });

    // SECTION 3: Giant Master Volume Knob
    const VOL_X = BX + 112, VOL_Y = BY + 120, VOL_SIZE = 48, VOL_H = 14;
    svg += `<g class="vol-knob" id="tube-master-vol">
      ${box(VOL_X, VOL_Y, BT, VOL_SIZE, VOL_SIZE, VOL_H, 24)}
      <g transform="${TOP(VOL_X, VOL_Y, BT + VOL_H)}">
        <circle class="face recess" cx="24" cy="24" r="18"/>
        ${Array.from({ length: 16 }, (_, i) => {
          const a = (i * 22.5 * Math.PI) / 180;
          return `<line class="detail" x1="${(24 + 19 * Math.cos(a)).toFixed(1)}" y1="${(24 + 19 * Math.sin(a)).toFixed(1)}" x2="${(24 + 23 * Math.cos(a)).toFixed(1)}" y2="${(24 + 23 * Math.sin(a)).toFixed(1)}"/>`;
        }).join('')}
        
        <g id="tube-vol-indicator">
          <circle class="led hot" filter="url(#soft)" cx="24" cy="11" r="1.8"/>
          <line class="detail" x1="24" y1="24" x2="24" y2="10"/>
        </g>
        <text class="label" x="24" y="30" font-size="4.5" text-anchor="middle">LEVEL</text>
      </g>
    </g>`;

    // SECTION 4: Headphone Jack & Coiled Cable
    const PLUG_X = BX + 42, PLUG_Y = BF, PLUG_Z = BT - 18;
    svg += `<g class="headphone-plug">
      ${box(PLUG_X - 4, PLUG_Y, PLUG_Z - 4, 8, 14, 8, 2)}
    </g>`;

    const P0 = [PLUG_X, PLUG_Y + 14, PLUG_Z];
    const P1 = [PLUG_X + 20, PLUG_Y + 35, 10];
    const P2 = [PLUG_X + 70, PLUG_Y + 15, 8];
    const P3 = [290, 240, 9];
    const bez = t => P0.map((_, i) => (1 - t) ** 3 * P0[i] + 3 * (1 - t) ** 2 * t * P1[i] + 3 * (1 - t) * t ** 2 * P2[i] + t ** 3 * P3[i]);

    const pts = [];
    for (let i = 0; i <= 600; i++) {
      const t = i / 600, p = bez(t);
      const ang = t * 24 * 2 * Math.PI;
      const env = Math.min(1, Math.max(0, (t - 0.05) / 0.05)) * Math.min(1, Math.max(0, (0.95 - t) / 0.05));
      pts.push([p[0] + env * 3 * Math.cos(ang), p[1] + env * 3 * Math.sin(ang), p[2]]);
    }
    const wireD = path(pts);
    svg += `<path class="wire-under" d="${wireD}"/>
      <path class="wire hot" id="tube-wire" filter="url(#soft)" d="${wireD}"/>
      <path class="pulse go" id="tube-pulse" filter="url(#glow)" pathLength="1000" d="${wireD}"/>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- Logic & Real Audio ---------- */
    const st = {
      playing: true,
      volume: 80,
      meterAngleL: -12,
      meterAngleR: -15,
      timer: null,
      pulseTimer: null,
      animTimer: null
    };

    const q = s => stage.querySelector(s);

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

    const CHORDS = [
      [220, 261.6, 329.6, 392],    // Am7
      [174.6, 220, 261.6, 329.6],  // Fmaj7
      [130.8, 164.8, 196, 246.9],  // Cmaj7
      [196, 246.9, 293.7, 349.2],  // G7
    ];
    let chordIdx = 0;

    function playChord() {
      const a = getAudio();
      if (a) {
        const t = a.ctx.currentTime;
        const chord = CHORDS[chordIdx];
        chordIdx = (chordIdx + 1) % CHORDS.length;

        try {
          chord.forEach(freq => {
            const osc = a.ctx.createOscillator();
            const gain = a.ctx.createGain();
            const filt = a.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            filt.type = 'lowpass';
            filt.frequency.setValueAtTime(900 + (st.volume / 100) * 800, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.exponentialRampToValueAtTime(0.12 * (st.volume / 100), t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

            osc.connect(filt); filt.connect(gain); gain.connect(a.out);
            osc.start(t); osc.stop(t + 1.25);
          });
        } catch (e) {}
      }

      api.replay(q('#tube-pulse'));
    }

    let breathCount = 0;
    function ambientJitter() {
      breathCount++;
      // Warm breathing filament glow
      const filaments = stage.querySelectorAll('.tube-filament');
      const breath = 0.7 + Math.sin(breathCount * 0.15) * 0.25;
      filaments.forEach(f => f.style.opacity = breath.toFixed(2));

      // Dynamic dancing VU needles
      const baseJitter = st.playing ? 18 : 6;
      st.meterAngleL = -15 + Math.sin(breathCount * 0.3) * baseJitter + Math.random() * 4;
      st.meterAngleR = -18 + Math.cos(breathCount * 0.25) * baseJitter + Math.random() * 4;
      updateNeedles();
    }

    st.animTimer = api.every(80, ambientJitter);

    function updateNeedles() {
      const nl = q('#vu-needle-l');
      const nr = q('#vu-needle-r');
      if (nl) nl.setAttribute('transform', `rotate(${st.meterAngleL.toFixed(1)} 44 58)`);
      if (nr) nr.setAttribute('transform', `rotate(${st.meterAngleR.toFixed(1)} 44 58)`);
    }

    function togglePlay() {
      st.playing = !st.playing;
      getAudio();
      if (st.playing) {
        playChord();
        st.timer = api.every(1300, playChord);
      } else {
        if (st.timer) clearInterval(st.timer);
        st.timer = null;
      }
      render();
    }

    // Auto-pulse wire periodically
    st.pulseTimer = api.every(1800, () => {
      if (st.playing) api.replay(q('#tube-pulse'));
    });

    function render() {
      api.power(true);
      q('#tube-power-led').classList.toggle('hot', true);
      q('#tube-wire').classList.toggle('hot', st.playing);

      api.readout(
        st.playing
          ? `TUBE AUDIO ACTIVE · VOL ${st.volume}% · DUAL VU METERING`
          : `AUDIRA VALVE DAC · READY · SPACE TO PLAY`
      );
    }

    stage.addEventListener('click', e => {
      if (e.target.closest('#tube-master-vol')) {
        st.volume = (st.volume + 20) % 100;
        if (st.volume === 0) st.volume = 40;
        const ang = (st.volume / 100) * 270 - 135;
        const ind = q('#tube-vol-indicator');
        if (ind) ind.setAttribute('transform', `rotate(${ang} 24 24)`);
        render();
        return;
      }
      if (e.target.closest('.tube-group') || e.target.closest('.headphone-plug')) {
        togglePlay();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          if (!e.repeat) togglePlay();
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        if (st.pulseTimer) clearInterval(st.pulseTimer);
        if (st.animTimer) clearInterval(st.animTimer);
        api.power(false);
      },
      demo() {
        togglePlay();
      }
    };
  }
});
