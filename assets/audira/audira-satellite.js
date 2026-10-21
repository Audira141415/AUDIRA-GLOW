/* Fig 4 — Audira Deep-Space Orbital Recon Satellite (Phased Array Satellite) */
FIGS.push({
  id: 'audira-satellite',
  name: 'Orbital Recon Satellite',
  hint: 'Click Dish Antenna or Space to transmit 100Gbps Laser Uplink · Keys 1–4',
  aria: 'Isometric deep-space reconnaissance satellite with gold thermal foil octagonal bus, deployed dual photovoltaic solar wings, high-gain parabolic phased-array dish antenna, and ion attitude control thrusters.',
  css: `
    [data-fig="audira-satellite"] .sat-dish { cursor:pointer; }
    [data-fig="audira-satellite"] .sat-dish:hover { filter:url(#glow); }
    [data-fig="audira-satellite"] .solar-wing { cursor:pointer; }
    [data-fig="audira-satellite"] .solar-wing:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-satellite"] .laser-beam { stroke-dasharray:8 6; }
    .sat-burst { animation:sat-shake 0.3s ease-out; }
    @keyframes sat-shake { 0%, 100% { transform:translate(0,0); } 25% { transform:translate(-2px,2px); } 75% { transform:translate(2px,-2px); } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 270, 0], [340, 10, 0], [340, 270, 0], [0, 10, 0],
      [20, 20, 260], [320, 20, 260], [20, 260, 260], [320, 260, 260]
    ]);
    const { TOP, FRONT, SIDE, box, boxc, path, P } = K;
    const slits = api.iso.slits;

    let svg = `<defs>
      <linearGradient id="sat-laser-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#00e5ff"/>
        <stop offset="100%" stop-color="#01579b" stop-opacity="0"/>
      </linearGradient>
    </defs>`;

    // 1. Orbital Horizon Base Grid / Earth Vector Arc
    const PLZ = 8;
    svg += boxc(10, 10, 0, 320, 260, PLZ, 16, 'stage-floor');
    svg += `<g transform="${TOP(10, 10, PLZ)}">
      <rect class="detail" x="12" y="12" width="296" height="236" rx="12" stroke-dasharray="10 6"/>
      <path d="M 20,220 Q 160,80 300,220" fill="none" stroke="var(--line)" stroke-width="1.8"/>
      <path d="M 40,230 Q 160,105 280,230" fill="none" stroke="var(--detail)" stroke-width="1.2" stroke-dasharray="12 8"/>
      <circle cx="160" cy="140" r="4" fill="var(--accent)"/>
      <text class="label" x="25" y="248" font-size="4.2" letter-spacing="1.5">AUDIRA ORBITAL COMM · GEOSTATIONARY RECON SATELLITE (ALT: 35,786 KM)</text>
    </g>`;

    // 2. SATELLITE BODY IN ZERO-G (Floating Group)
    svg += `<g id="satellite-group">`;

    // Center Satellite Equipment Bus
    const CX = 160, CY = 140, SAT_Z = 95, SAT_W = 60, SAT_D = 60, SAT_H = 80;
    svg += box(CX - SAT_W / 2, CY - SAT_D / 2, SAT_Z, SAT_W, SAT_D, SAT_H, 8);
    svg += `<g transform="${TOP(CX - SAT_W / 2, CY - SAT_D / 2, SAT_Z + SAT_H)}">
      <rect class="detail" x="4" y="4" width="${SAT_W - 8}" height="${SAT_D - 8}" rx="4"/>
      <circle cx="${SAT_W / 2}" cy="${SAT_D / 2}" r="16" fill="none" stroke="#ffd54f" stroke-width="1.4"/>
      <circle cx="${SAT_W / 2}" cy="${SAT_D / 2}" r="8" fill="var(--accent)" opacity="0.6"/>
      <text class="label" x="${SAT_W / 2}" y="${SAT_D / 2 + 3}" font-size="3" text-anchor="middle">SAT BUS</text>
    </g>`;

    svg += `<g transform="${FRONT(CX - SAT_W / 2, CY + SAT_D / 2, SAT_Z + SAT_H)}">
      ${slits(6, SAT_W - 6, 4, 8, SAT_H - 10, true, 'wire hot')}
    </g>`;

    // 3. DEPLOYED DUAL PHOTOVOLTAIC SOLAR WINGS
    const LW_W = 100, LW_D = 40, LW_Z = SAT_Z + 25;
    svg += `<g class="solar-wing" id="left-solar-wing">`;
    svg += box(CX - SAT_W / 2 - LW_W - 12, CY - LW_D / 2, LW_Z, LW_W, LW_D, 4, 3);
    svg += `<g transform="${TOP(CX - SAT_W / 2 - LW_W - 12, CY - LW_D / 2, LW_Z + 4)}">
      <rect class="glass hot" x="2" y="2" width="${LW_W - 4}" height="${LW_D - 4}" rx="2"/>
      ${slits(6, LW_W - 6, 8, 4, LW_D - 4, true, 'wire hot')}
      ${slits(6, LW_D - 6, 8, 4, LW_W - 4, false, 'detail')}
    </g>`;
    svg += `<line x1="${P(CX - SAT_W / 2, CY, LW_Z + 2)[0]}" y1="${P(CX - SAT_W / 2, CY, LW_Z + 2)[1]}" x2="${P(CX - SAT_W / 2 - 12, CY, LW_Z + 2)[0]}" y2="${P(CX - SAT_W / 2 - 12, CY, LW_Z + 2)[1]}" stroke="#cfd8dc" stroke-width="2.5"/>`;
    svg += `</g>`;

    const RW_W = 100, RW_D = 40, RW_Z = SAT_Z + 25;
    svg += `<g class="solar-wing" id="right-solar-wing">`;
    svg += box(CX + SAT_W / 2 + 12, CY - RW_D / 2, RW_Z, RW_W, RW_D, 4, 3);
    svg += `<g transform="${TOP(CX + SAT_W / 2 + 12, CY - RW_D / 2, RW_Z + 4)}">
      <rect class="glass hot" x="2" y="2" width="${RW_W - 4}" height="${RW_D - 4}" rx="2"/>
      ${slits(6, RW_W - 6, 8, 4, RW_D - 4, true, 'wire hot')}
      ${slits(6, RW_D - 6, 8, 4, RW_W - 4, false, 'detail')}
    </g>`;
    svg += `<line x1="${P(CX + SAT_W / 2, CY, RW_Z + 2)[0]}" y1="${P(CX + SAT_W / 2, CY, RW_Z + 2)[1]}" x2="${P(CX + SAT_W / 2 + 12, CY, RW_Z + 2)[0]}" y2="${P(CX + SAT_W / 2 + 12, CY, RW_Z + 2)[1]}" stroke="#cfd8dc" stroke-width="2.5"/>`;
    svg += `</g>`;

    // 4. HIGH-GAIN PARABOLIC DISH ANTENNA WITH RADAR SWEEP LINE
    const DISH_Z = SAT_Z + SAT_H + 18;
    const [dpx, dpy] = P(CX, CY, DISH_Z);

    svg += `<g id="sat-dish-unit" class="sat-dish">
      <line x1="${P(CX, CY, SAT_Z + SAT_H)[0]}" y1="${P(CX, CY, SAT_Z + SAT_H)[1]}" x2="${dpx}" y2="${dpy}" stroke="#cfd8dc" stroke-width="3"/>
      <ellipse cx="${dpx}" cy="${dpy}" rx="38" ry="24" fill="var(--deck)" stroke="var(--line)" stroke-width="2"/>
      <ellipse cx="${dpx}" cy="${dpy}" rx="32" ry="20" fill="none" stroke="var(--accent-hi)" stroke-width="1.5" stroke-dasharray="8 6"/>
      <circle cx="${dpx}" cy="${dpy}" r="6" fill="#ffd54f" filter="url(#soft)"/>
      <!-- Continuous rotating radar sweep needle on dish -->
      <line id="dish-radar-needle" x1="${dpx}" y1="${dpy}" x2="${dpx+24}" y2="${dpy-10}" stroke="var(--accent-hi)" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
      <line x1="${dpx}" y1="${dpy}" x2="${dpx - 14}" y2="${dpy - 22}" stroke="#cfd8dc" stroke-width="1.4"/>
      <line x1="${dpx}" y1="${dpy}" x2="${dpx + 14}" y2="${dpy - 22}" stroke="#cfd8dc" stroke-width="1.4"/>
      <circle cx="${dpx}" cy="${dpy - 22}" r="3" fill="var(--accent-hi)" filter="url(#glow)"/>
    </g>`;

    // 5. LASER OPTICAL DATA DOWNLINK BEAM
    svg += `<g id="laser-downlink-fx" opacity="0" style="transition: opacity 0.2s ease;">
      <polygon points="${dpx-6},${dpy-22} ${dpx+6},${dpy-22} ${dpx+90},${dpy+180} ${dpx+70},${dpy+180}" fill="url(#sat-laser-grad)" filter="url(#glow)"/>
      <line id="laser-data-stream" class="laser-beam" x1="${dpx}" y1="${dpy-22}" x2="${dpx+80}" y2="${dpy+180}" stroke="#ffffff" stroke-width="3" filter="url(#soft)"/>
      <circle cx="${dpx+80}" cy="${dpy+180}" r="16" fill="none" stroke="var(--accent-hi)" stroke-width="2" filter="url(#glow)"/>
    </g>`;

    // 6. ION PROPULSION RCS THRUSTERS WITH DYNAMIC PUFF PLUMES
    const rcsPts = [
      [CX - SAT_W / 2, CY - SAT_D / 2], [CX + SAT_W / 2, CY - SAT_D / 2],
      [CX - SAT_W / 2, CY + SAT_D / 2], [CX + SAT_W / 2, CY + SAT_D / 2]
    ];
    rcsPts.forEach(([rx, ry], idx) => {
      const [rpx, rpy] = P(rx, ry, SAT_Z - 6);
      svg += `<circle cx="${rpx}" cy="${rpy}" r="3" fill="#212121" stroke="var(--accent)" stroke-width="1"/>`;
      svg += `<line id="rcs-plume-${idx}" x1="${rpx}" y1="${rpy}" x2="${rpx - 8}" y2="${rpy + 8}" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" opacity="0" filter="url(#soft)"/>`;
    });

    svg += `</g>`; // End floating group

    // 7. GROUND TRACKING MISSION CONSOLE (Front left)
    const TRK_X = 25, TRK_Y = 25, TRK_Z = PLZ;
    svg += box(TRK_X, TRK_Y, TRK_Z, 70, 48, 26, 4);
    svg += `<g transform="${TOP(TRK_X, TRK_Y, TRK_Z + 26)}">
      <rect class="detail" x="4" y="4" width="62" height="40" rx="2"/>
      <rect class="glass" x="8" y="8" width="54" height="32" rx="2"/>
      <text class="scr" id="sat-coord" x="12" y="18" font-size="3.8">LAT: 0.00° · LON: 106.8°</text>
      <text class="scr-accent" id="sat-link" x="12" y="27" font-size="4">LINK: 100 Gbps</text>
      <text class="label" id="sat-pwr" x="12" y="35" font-size="3.2">SOLAR: 18.42 kW OK</text>
    </g>`;

    stage.innerHTML = svg;

    // AUDIO SYNTHESIZER
    const playSatSound = (type) => {
      try {
        const audio = api.audio();
        if (!audio || !audio.ctx) return;
        const { ctx, out } = audio;
        const now = ctx.currentTime;

        if (type === 'uplink') {
          [1200, 1600, 2400, 3200].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.08, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.12);
            osc.connect(gain);
            gain.connect(out);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.15);
          });
        } else if (type === 'rcs') {
          const bufferSize = ctx.sampleRate * 0.25;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400, now);
          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.18, now);
          nGain.gain.linearRampToValueAtTime(0, now + 0.25);
          noise.connect(filter);
          filter.connect(nGain);
          nGain.connect(out);
          noise.start(now);
        }
      } catch (e) {}
    };

    // REAL-TIME ORBITAL ANIMATION LOOP
    const satGroup = stage.querySelector('#satellite-group');
    const radarNeedle = stage.querySelector('#dish-radar-needle');
    const dataStream = stage.querySelector('#laser-data-stream');
    const coordText = stage.querySelector('#sat-coord');
    const pwrText = stage.querySelector('#sat-pwr');
    const laserFx = stage.querySelector('#laser-downlink-fx');
    const linkText = stage.querySelector('#sat-link');

    let tick = 0;
    api.every(45, () => {
      tick++;

      // 1. Zero-G slow orbital oscillation
      const zeroG = Math.sin(tick * 0.06) * 5;
      if (satGroup) satGroup.style.transform = `translateY(${zeroG.toFixed(1)}px)`;

      // 2. Rotating radar sweep needle on dish
      if (radarNeedle) {
        const nx = dpx + 26 * Math.cos(tick * 0.12);
        const ny = dpy + 16 * Math.sin(tick * 0.12);
        radarNeedle.setAttribute('x2', nx.toFixed(1));
        radarNeedle.setAttribute('y2', ny.toFixed(1));
      }

      // 3. Continuous packet flow along laser stream
      if (dataStream) {
        dataStream.setAttribute('stroke-dashoffset', (-tick * 3).toFixed(1));
      }

      // 4. Periodic RCS thruster puff firing on corner
      if (tick % 60 === 0) {
        const pIdx = (tick / 60) % 4;
        const plume = stage.querySelector(`#rcs-plume-${pIdx}`);
        if (plume) {
          plume.style.opacity = '1';
          setTimeout(() => { plume.style.opacity = '0'; }, 180);
        }
      }

      // 5. Telemetry updates
      if (tick % 8 === 0) {
        const lon = (106.82 + Math.sin(tick * 0.05) * 0.02).toFixed(2);
        if (coordText) coordText.textContent = `LAT: 0.00° · LON: ${lon}°E`;
        const pwr = (18.40 + Math.sin(tick * 0.1) * 0.05).toFixed(2);
        if (pwrText) pwrText.textContent = `SOLAR: ${pwr} kW OK`;
      }
    });

    let downCount = 0;
    const transmitDownlink = () => {
      playSatSound('uplink');
      stage.classList.add('sat-burst');
      downCount++;
      const links = ['LINK: 100 Gbps LASER', 'LINK: QUANTUM ENCRYPTED', 'LINK: TERABIT UPLINK'];
      if (linkText) linkText.textContent = links[downCount % links.length];
      api.readout('OPTICAL LASER DOWNLINK ACTIVE · 100 Gbps TO GROUND STATION · BIT ERROR: 0%');
      if (laserFx) laserFx.style.opacity = '1';
      setTimeout(() => {
        if (laserFx) laserFx.style.opacity = '0';
        stage.classList.remove('sat-burst');
      }, 700);
    };

    const dishEl = stage.querySelector('#sat-dish-unit');
    if (dishEl) dishEl.addEventListener('click', transmitDownlink);

    api.readout('ORBITAL RECON SATELLITE · SOLAR ARRAY 100% · READY');

    return {
      key(e) {
        if (e.key === ' ' || e.code === 'Space') {
          transmitDownlink();
          return true;
        }
        if (e.key === '1') {
          playSatSound('rcs');
          api.readout('RCS ION MANEUVERING BURN: ATTITUDE ORIENTED +0.02°');
          return true;
        }
        if (e.key === '2') {
          transmitDownlink();
          return true;
        }
        if (e.key === '3') {
          api.readout('STAR TRACKER STELLAR LOCK: 24 CONSTELLATION REFERENCES');
          return true;
        }
        if (e.key === '4') {
          api.readout('SOLAR BATTERY CAPACITY: 98.6% · 18.4 kW BUS POWER');
          return true;
        }
        return false;
      },
      unmount() {
        stage.classList.remove('sat-burst');
      }
    };
  }
});
