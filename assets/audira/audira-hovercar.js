/* Fig 3 — Audira Cyberpunk Hovercar / Spinner (VTOL Aerodyne) */
FIGS.push({
  id: 'audira-hovercar',
  name: 'Cyberpunk Hovercar',
  hint: 'Click Door to open · Click Thrusters or Space for Nitro Jet Boost · Keys 1–4',
  aria: 'Isometric cyberpunk aerodyne hovercar with four anti-gravity VTOL ion lift thrusters, opening gull-wing scissor doors, holographic cockpit HUD, and dual plasma afterburners.',
  css: `
    [data-fig="audira-hovercar"] .car-body { cursor:pointer; }
    [data-fig="audira-hovercar"] .car-body:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-hovercar"] .ion-pool { fill:var(--accent); opacity:0.25; filter:url(#soft); transition:all 0.1s ease; }
    .car-boost { animation:nitro-shake 0.4s ease-out; }
    @keyframes nitro-shake { 0%, 100% { transform:translate(0,0); } 20% { transform:translate(5px,-4px); } 40% { transform:translate(-4px,3px); } 70% { transform:translate(2px,-2px); } }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [10, 270, 0], [330, 10, 0], [330, 270, 0], [10, 10, 0],
      [20, 20, 240], [320, 20, 240], [20, 260, 240], [320, 260, 240]
    ]);
    const { TOP, FRONT, SIDE, box, boxc, path, P } = K;
    const slits = api.iso.slits;

    let svg = `<defs>
      <linearGradient id="nitro-flame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="#00e5ff"/>
        <stop offset="70%" stop-color="#0288d1"/>
        <stop offset="100%" stop-color="#01579b" stop-opacity="0"/>
      </linearGradient>
    </defs>`;

    // 1. Skyport Landing Platform / Rooftop Helipad
    const PLZ = 8;
    svg += boxc(10, 10, 0, 320, 260, PLZ, 16, 'stage-floor');
    svg += `<g transform="${TOP(10, 10, PLZ)}">
      <rect class="detail" x="12" y="12" width="296" height="236" rx="12" stroke-dasharray="10 6"/>
      <circle cx="160" cy="130" r="95" fill="none" stroke="var(--line)" stroke-width="1.2"/>
      <circle cx="160" cy="130" r="75" fill="none" stroke="var(--detail)" stroke-width="1.5" stroke-dasharray="12 8"/>
      <!-- Dynamic Ground Shadow & 4 Ion Ground Light Pools -->
      <ellipse id="ground-shadow" cx="160" cy="130" rx="90" ry="52" fill="var(--recess)" opacity="0.6"/>
      ${[
        [75, 75], [245, 75], [75, 185], [245, 185]
      ].map(([vx, vy], idx) => {
        return `<ellipse id="ion-pool-${idx}" class="ion-pool" cx="${vx}" cy="${vy}" rx="22" ry="14"/>`;
      }).join('')}
      <text class="label" x="25" y="248" font-size="4.2" letter-spacing="1.5">AUDIRA SKYPORT · AERODYNE VTOL HOVERCAR · DUAL ION DRIVES</text>
    </g>`;

    // 2. HOVERING VEHICLE GROUP (Controlled by live JS physics)
    svg += `<g id="car-hover-group">`;

    // Four Underbody Anti-Gravity VTOL Lift Rings (Elevated at Z: 40)
    const vtolZ = PLZ + 32;
    const vtols = [
      [75, 75], [245, 75],
      [75, 185], [245, 185]
    ];
    vtols.forEach(([vx, vy], idx) => {
      const [px, py] = P(vx, vy, vtolZ);
      svg += `<g>
        <ellipse cx="${px}" cy="${py}" rx="24" ry="14" fill="none" stroke="var(--line)" stroke-width="2"/>
        <ellipse id="vtol-glow-${idx}" cx="${px}" cy="${py}" rx="18" ry="10" fill="none" stroke="var(--accent)" stroke-width="2.5" filter="url(#glow)"/>
        <polygon points="${px-16},${py} ${px+16},${py} ${px+22},${py+24} ${px-22},${py+24}" fill="var(--accent)" opacity="0.18"/>
      </g>`;
    });

    // 3. HOVERCAR LOWER CHASSIS & AERODYNAMIC WEDGE BODY
    const CAR_X = 65, CAR_Y = 65, CAR_Z = vtolZ + 10, CAR_W = 190, CAR_D = 130, CAR_H = 34;
    svg += `<g id="car-chassis" class="car-body">`;
    svg += boxc(CAR_X, CAR_Y, CAR_Z, CAR_W, CAR_D, CAR_H, 12, 'car-hull');
    svg += `<g transform="${FRONT(CAR_X, CAR_Y + CAR_D, CAR_Z + CAR_H)}">
      <rect class="detail" x="12" y="16" width="166" height="8" rx="3"/>
      <!-- Scanning Cyber Headlight Beam -->
      <line id="headlight-bar" x1="20" y1="20" x2="170" y2="20" stroke="var(--accent-hi)" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
      ${slits(35, 80, 4, 25, 32)}
      ${slits(110, 155, 4, 25, 32)}
    </g>`;

    // 4. COCKPIT CANOPY & TINTED GLASS
    const CAB_X = CAR_X + 25, CAB_Y = CAR_Y + 18, CAB_Z = CAR_Z + CAR_H, CAB_W = 140, CAB_D = 94, CAB_H = 26;
    svg += box(CAB_X, CAB_Y, CAB_Z, CAB_W, CAB_D, CAB_H, 8);
    svg += `<g transform="${TOP(CAB_X, CAB_Y, CAB_Z + CAB_H)}">
      <rect class="glass hot" x="6" y="6" width="${CAB_W - 12}" height="${CAB_D - 12}" rx="6"/>
      <line class="q-wave" x1="18" y1="25" x2="65" y2="25"/>
      <circle cx="95" cy="45" r="14" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 3"/>
      <text class="scr" id="hud-status" x="20" y="70" font-size="4">HUD: ALT 1.82M · SPD 0 KM/H</text>
    </g>`;

    // 5. GULL-WING SCISSOR DOOR
    svg += `<g id="gullwing-door" class="car-body" style="transition: transform 0.4s ease; transform-origin: ${P(CAB_X+20, CAB_Y+CAB_D, CAB_Z+CAB_H)[0]}px ${P(CAB_X+20, CAB_Y+CAB_D, CAB_Z+CAB_H)[1]}px;">`;
    svg += `<g transform="${FRONT(CAB_X + 15, CAB_Y + CAB_D, CAB_Z + CAB_H)}">
      <rect class="face" x="4" y="2" width="70" height="22" rx="4" fill="var(--deck)" stroke="var(--line)"/>
      <line class="wire hot" x1="10" y1="12" x2="68" y2="12"/>
      <text class="label" x="12" y="18" font-size="3.5">GULL-WING 01</text>
    </g>`;
    svg += `</g>`;

    // 6. TWIN REAR AFTERBURNER NITRO THRUSTER NOZZLES
    const NOZ_Z = CAR_Z + 8;
    const [nz1X, nz1Y] = P(CAR_X - 10, CAR_Y + 35, NOZ_Z);
    const [nz2X, nz2Y] = P(CAR_X - 10, CAR_Y + 95, NOZ_Z);

    svg += `<g id="nitro-thrusters" class="car-body">
      <ellipse cx="${nz1X}" cy="${nz1Y}" rx="14" ry="10" fill="#212121" stroke="var(--accent)" stroke-width="2"/>
      <ellipse cx="${nz1X}" cy="${nz1Y}" rx="8" ry="6" fill="var(--accent-hi)" filter="url(#glow)"/>
      <ellipse cx="${nz2X}" cy="${nz2Y}" rx="14" ry="10" fill="#212121" stroke="var(--accent)" stroke-width="2"/>
      <ellipse cx="${nz2X}" cy="${nz2Y}" rx="8" ry="6" fill="var(--accent-hi)" filter="url(#glow)"/>
    </g>`;

    // Nitro Jet Flame Eruption FX
    svg += `<g id="nitro-flame-fx" opacity="0" style="transition: opacity 0.15s ease;">
      <polygon points="${nz1X},${nz1Y-6} ${nz1X},${nz1Y+6} ${nz1X-90},${nz1Y+24} ${nz1X-110},${nz1Y-18}" fill="url(#nitro-flame)" filter="url(#glow)"/>
      <polygon points="${nz2X},${nz2Y-6} ${nz2X},${nz2Y+6} ${nz2X-90},${nz2Y+24} ${nz2X-110},${nz2Y-18}" fill="url(#nitro-flame)" filter="url(#glow)"/>
      <ellipse cx="${nz1X-30}" cy="${nz1Y+6}" rx="18" ry="10" fill="none" stroke="#ffffff" stroke-width="2" filter="url(#soft)"/>
      <ellipse cx="${nz2X-30}" cy="${nz2Y+6}" rx="18" ry="10" fill="none" stroke="#ffffff" stroke-width="2" filter="url(#soft)"/>
    </g>`;

    svg += `</g>`; // End hover-float group

    stage.innerHTML = svg;

    // AUDIO SYNTHESIZER
    const playHoverSound = (type) => {
      try {
        const audio = api.audio();
        if (!audio || !audio.ctx) return;
        const { ctx, out } = audio;
        const now = ctx.currentTime;

        if (type === 'boost') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.6);

          const bufferSize = ctx.sampleRate * 0.4;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(800, now);
          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.2, now);
          nGain.gain.linearRampToValueAtTime(0, now + 0.4);
          noise.connect(filter);
          filter.connect(nGain);
          nGain.connect(out);
          noise.start(now);
        } else if (type === 'door') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(640, now + 0.2);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.22);
          osc.connect(gain);
          gain.connect(out);
          osc.start(now);
          osc.stop(now + 0.25);
        }
      } catch (e) {}
    };

    // REAL-TIME HOVER PHYSICS & SCANNING ANIMATION LOOP
    const carGroup = stage.querySelector('#car-hover-group');
    const shadowEl = stage.querySelector('#ground-shadow');
    const hudStatus = stage.querySelector('#hud-status');
    const flameFx = stage.querySelector('#nitro-flame-fx');
    const doorEl = stage.querySelector('#gullwing-door');

    let tick = 0;
    let doorOpen = false;

    api.every(35, () => {
      tick++;

      // 1. Natural floating bob & tilt
      const bobY = Math.sin(tick * 0.08) * 7;
      const tiltX = Math.cos(tick * 0.05) * 1.5;
      if (carGroup) {
        carGroup.style.transform = `translateY(${bobY.toFixed(1)}px) rotate(${tiltX.toFixed(2)}deg)`;
      }

      // 2. Dynamic ground shadow expansion
      if (shadowEl) {
        const shadowScale = 90 - bobY * 1.5;
        shadowEl.setAttribute('rx', shadowScale.toFixed(1));
        shadowEl.style.opacity = (0.6 - (bobY + 7) * 0.015).toFixed(2);
      }

      // 3. Ion ground light pools pulsing
      for (let i = 0; i < 4; i++) {
        const pool = stage.querySelector(`#ion-pool-${i}`);
        if (pool) {
          const poolR = 22 + Math.sin(tick * 0.15 + i) * 3;
          pool.setAttribute('rx', poolR.toFixed(1));
        }
      }

      // 4. Live HUD altitude readout
      if (tick % 6 === 0 && hudStatus) {
        const alt = (1.80 + Math.sin(tick * 0.08) * 0.25).toFixed(2);
        hudStatus.textContent = `HUD: ALT ${alt}M · SPD 0 KM/H`;
      }
    });

    const triggerNitroBoost = () => {
      playHoverSound('boost');
      stage.classList.add('car-boost');
      api.readout('NITRO AFTERBURNER IGNITION · SPEED: 420 KM/H · ALTITUDE: 150M');
      if (flameFx) flameFx.style.opacity = '1';
      setTimeout(() => {
        if (flameFx) flameFx.style.opacity = '0';
        stage.classList.remove('car-boost');
      }, 550);
    };

    const toggleDoor = () => {
      playHoverSound('door');
      doorOpen = !doorOpen;
      if (doorEl) {
        doorEl.style.transform = doorOpen ? 'translateY(-14px) rotate(-18deg)' : 'none';
      }
      api.readout(doorOpen ? 'GULL-WING SCISSOR DOOR OPENED · CABIN PRESSURIZED' : 'CABIN SEALED · COCKPIT SECURE');
    };

    const chassisEl = stage.querySelector('#car-chassis');
    if (chassisEl) chassisEl.addEventListener('click', toggleDoor);

    const thrusterEl = stage.querySelector('#nitro-thrusters');
    if (thrusterEl) thrusterEl.addEventListener('click', triggerNitroBoost);

    api.readout('CYBERPUNK AERODYNE HOVERCAR · VTOL ENGINES ONLINE · READY');

    return {
      key(e) {
        if (e.key === ' ' || e.code === 'Space') {
          triggerNitroBoost();
          return true;
        }
        if (e.key === '1') {
          toggleDoor();
          return true;
        }
        if (e.key === '2') {
          triggerNitroBoost();
          return true;
        }
        if (e.key === '3') {
          api.readout('AUTOPILOT ENGAGED · AIR TRAFFIC GRID SYNCHRONIZED');
          return true;
        }
        if (e.key === '4') {
          api.readout('ANTI-GRAV FLUX CALIBRATED · HOVER HEIGHT: 2.4 METERS');
          return true;
        }
        return false;
      },
      unmount() {
        stage.classList.remove('car-boost');
      }
    };
  }
});
