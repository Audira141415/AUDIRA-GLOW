/* Fig 4 — Audira Cyberdeck Hacker Terminal */
FIGS.push({
  id: 'audira-deck',
  name: 'Audira Cyberdeck',
  hint: 'Live stream active · Type anywhere to inject hex · Space overdrive',
  aria: 'Isometric cyberpunk hacker console with triple monitor array, toggle switches, real-time matrix terminal, and glowing data cores. Type on your keyboard to stream hex code.',
  css: `
    [data-fig="audira-deck"] .deck-sw { cursor:pointer; }
    [data-fig="audira-deck"] .deck-sw:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-deck"] .deck-sw.on .face { fill:var(--accent); stroke:var(--accent-hi); }
    [data-fig="audira-deck"] .deck-sw.on .face.top { fill:var(--accent-hi); }
    [data-fig="audira-deck"] .overdrive-btn { cursor:pointer; }
    [data-fig="audira-deck"] .overdrive-btn:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-deck"] .radar-beam { stroke:var(--accent); stroke-width:1.2; opacity:.85; }
    [data-fig="audira-deck"] .matrix-txt { fill:var(--accent-hi); font-family:var(--mono); font-size:4.2px; }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [20, 20, 68], [300, 20, 68], [20, 240, 68], [300, 240, 68]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits, esc = api.iso.esc;

    const PLZ = 7;
    const BX = 20, BY = 20, BW = 280, BD = 220, BH = 32, BT = PLZ + BH, BF = BY + BD;

    let svg = `<defs>
      <clipPath id="deck-main-clip"><rect x="8" y="8" width="134" height="74" rx="4"/></clipPath>
      <clipPath id="deck-left-clip"><rect x="6" y="6" width="48" height="74" rx="4"/></clipPath>
      <clipPath id="deck-right-clip"><rect x="6" y="6" width="48" height="74" rx="4"/></clipPath>
    </defs>`;

    // Base plate
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="9" y="9" width="322" height="242" rx="10"/>
      ${[[18, 18], [322, 18], [18, 242], [322, 242]].map(([x, y]) =>
        `<circle class="face recess" cx="${x}" cy="${y}" r="3"/><line class="detail" x1="${x - 1.8}" y1="${y}" x2="${x + 1.8}" y2="${y}"/>`
      ).join('')}
    </g>`;

    // Cyberdeck chassis
    svg += box(BX, BY, PLZ, BW, BD, BH, 8);

    // Front Face
    svg += `<g transform="${FRONT(BX, BF, BT)}">
      ${slits(12, 60, 3, 6, 20)}
      <text class="label" x="80" y="19" font-size="7" letter-spacing="2">AUDIRA · CYBERDECK 09</text>
      <rect class="face recess" x="210" y="8" width="50" height="12" rx="2"/>
      <text class="scr-accent" x="216" y="17" font-size="5" letter-spacing="1">ROOT: OK</text>
    </g>`;

    // Side face detail
    svg += `<g transform="${SIDE(BX + BW, BF, BT)}">
      ${slits(16, 70, 3.5, 8, 22)}
      <rect class="face recess" x="110" y="10" width="30" height="12" rx="2"/>
      <text class="label" x="114" y="19" font-size="4">NEURAL BUS</text>
      ${slits(160, 204, 3.5, 8, 22)}
    </g>`;

    // Top deck plate
    svg += `<g transform="${TOP(BX, BY, BT)}">
      <rect class="face recess" x="6" y="6" width="${BW - 12}" height="${BD - 12}" rx="6"/>
      <line class="detail" x1="12" y1="116" x2="${BW - 12}" y2="116"/>
    </g>`;

    // SECTION 1: Triple Monitor Array
    // Left Screen: Radar
    const LS_X = BX + 14, LS_Y = BY + 16, LS_W = 60, LS_D = 86;
    svg += box(LS_X, LS_Y, BT, LS_W, LS_D, 4, 3);
    svg += `<g transform="${TOP(LS_X, LS_Y, BT + 4)}">
      <rect class="face recess" x="4" y="4" width="${LS_W - 8}" height="${LS_D - 8}" rx="4"/>
      <rect class="halo hot" x="6" y="6" width="${LS_W - 12}" height="${LS_D - 12}" rx="3" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="6" y="6" width="${LS_W - 12}" height="${LS_D - 12}" rx="3"/>
      
      <g clip-path="url(#deck-left-clip)">
        <text class="scr" x="10" y="15" font-size="4">RADAR SCAN</text>
        <circle class="detail" cx="30" cy="46" r="20"/>
        <circle class="detail" cx="30" cy="46" r="12"/>
        <circle class="detail" cx="30" cy="46" r="5"/>
        <line class="detail" x1="10" y1="46" x2="50" y2="46"/>
        <line class="detail" x1="30" y1="26" x2="30" y2="66"/>
        <line class="radar-beam" id="deck-radar" filter="url(#soft)" x1="30" y1="46" x2="48" y2="34"/>
        <circle class="led hot" filter="url(#soft)" cx="42" cy="38" r="1.4"/>
      </g>
    </g>`;

    // Center Ultrawide Screen: Real-Time Matrix Terminal
    const CS_X = BX + 80, CS_Y = BY + 14, CS_W = 150, CS_D = 90;
    svg += box(CS_X, CS_Y, BT, CS_W, CS_D, 5, 4);
    svg += `<g transform="${TOP(CS_X, CS_Y, BT + 5)}">
      <rect class="face recess" x="4" y="4" width="${CS_W - 8}" height="${CS_D - 8}" rx="4"/>
      <rect class="halo hot" x="6" y="6" width="${CS_W - 12}" height="${CS_D - 12}" rx="3" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="6" y="6" width="${CS_W - 12}" height="${CS_D - 12}" rx="3"/>
      
      <g clip-path="url(#deck-main-clip)">
        <text class="scr" x="12" y="16" font-size="4.5" letter-spacing="1">TERMINAL: /DEV/TTY0</text>
        <text class="scr-accent" id="deck-sec-status" x="90" y="16" font-size="4">SYSTEM SECURE</text>
        <line class="detail" x1="10" y1="19" x2="140" y2="19"/>
        
        <g id="deck-matrix-lines">
          <text class="matrix-txt" id="deck-line-0" x="12" y="28">0x7F4B > QUANTUM LINK ACTIVE</text>
          <text class="matrix-txt" id="deck-line-1" x="12" y="36">0x8A12 > ROUTE 127.0.0.1 VERIFIED</text>
          <text class="matrix-txt" id="deck-line-2" x="12" y="44">0x3D90 > DECRYPTING PACKET STREAM...</text>
          <text class="matrix-txt" id="deck-line-3" x="12" y="52">0xC401 > INJECT: READY [KEYBOARD HOOKED]</text>
          <text class="matrix-txt" id="deck-user-line" x="12" y="60">> LIVE RUNNING_</text>
        </g>
      </g>
    </g>`;

    // Right Screen: CPU Core & Telemetry
    const RS_X = BX + 236, RS_Y = BY + 16, RS_W = 60, RS_D = 86;
    svg += box(RS_X, RS_Y, BT, RS_W, RS_D, 4, 3);
    svg += `<g transform="${TOP(RS_X, RS_Y, BT + 4)}">
      <rect class="face recess" x="4" y="4" width="${RS_W - 8}" height="${RS_D - 8}" rx="4"/>
      <rect class="halo hot" x="6" y="6" width="${RS_W - 12}" height="${RS_D - 12}" rx="3" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="6" y="6" width="${RS_W - 12}" height="${RS_D - 12}" rx="3"/>
      
      <g clip-path="url(#deck-right-clip)">
        <text class="scr" x="8" y="15" font-size="4">CORE LOAD</text>
        ${[0, 1, 2, 3].map(c => `
          <text class="label" x="8" y="${28 + c * 11}" font-size="3.5">C${c}</text>
          <rect class="face recess" x="18" y="${22 + c * 11}" width="34" height="5" rx="1"/>
          <rect class="oled-bar" id="deck-core-${c}" x="18" y="${22 + c * 11}" width="${14 + c * 5}" height="5" rx="1"/>
        `).join('')}
        <text class="scr" x="8" y="74" font-size="3.8">TEMP: 42°C</text>
      </g>
    </g>`;

    // SECTION 2: 4 Heavy Industrial Toggle Switches
    const SW_Y = BY + 130;
    const SWITCHES = ['NET LINK', 'FIREWALL', 'SONAR', 'OVERDRIVE'];
    SWITCHES.forEach((name, i) => {
      const sx = BX + 24 + i * 36;
      svg += `<g class="deck-sw on" id="deck-sw-${i}" data-i="${i}">
        ${box(sx, SW_Y, BT, 22, 28, 6, 2)}
        <g transform="${TOP(sx, SW_Y, BT + 6)}">
          <rect class="face recess" x="8" y="4" width="6" height="20" rx="2"/>
          <circle class="face" cx="11" cy="8" r="4"/>
          <circle class="led hot" id="deck-sw-led-${i}" filter="url(#soft)" cx="11" cy="8" r="1.6"/>
          <text class="label" x="11" y="35" font-size="3.6" text-anchor="middle">${name}</text>
        </g>
      </g>`;
    });

    // Big Protected Overdrive Button
    const OVD_X = BX + 190, OVD_Y = BY + 134;
    svg += `<g class="overdrive-btn" id="deck-overdrive">
      ${box(OVD_X - 4, OVD_Y - 4, BT, 44, 44, 4, 6)}
      ${box(OVD_X, OVD_Y, BT + 4, 36, 36, 10, 18)}
      <g transform="${TOP(OVD_X, OVD_Y, BT + 14)}">
        <circle class="face recess" cx="18" cy="18" r="14"/>
        <circle class="led hot" id="deck-ovd-led" filter="url(#glow)" cx="18" cy="18" r="8"/>
        <text class="label" x="18" y="38" font-size="4.5" text-anchor="middle" letter-spacing="1">PURGE</text>
      </g>
    </g>`;

    // Translucent glowing data core
    const CORE_X = BX + 248, CORE_Y = BY + 132;
    svg += box(CORE_X, CORE_Y, BT, 24, 46, 12, 3);
    svg += `<g transform="${TOP(CORE_X, CORE_Y, BT + 12)}">
      <rect class="halo hot" x="2" y="2" width="20" height="42" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="2" y="2" width="20" height="42" rx="2"/>
      ${[6, 14, 22, 30, 38].map(y => `<line class="detail" x1="4" y1="${y}" x2="20" y2="${y}"/>`).join('')}
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Cyber Audio ---------- */
    const st = {
      switches: [true, true, true, false],
      radarAngle: 0,
      typedChars: 'LIVE RUNNING',
      overdrive: false,
      radarTimer: null,
      streamTimer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function cyberBeep(f, dur = 0.06, type = 'sine') {
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

    function rotateRadar() {
      st.radarAngle = (st.radarAngle + 9) % 360;
      const rad = (st.radarAngle * Math.PI) / 180;
      const x2 = (30 + 18 * Math.cos(rad)).toFixed(1);
      const y2 = (46 + 18 * Math.sin(rad)).toFixed(1);
      const rEl = q('#deck-radar');
      if (rEl) {
        rEl.setAttribute('x2', x2);
        rEl.setAttribute('y2', y2);
      }

      // Live fluctuating CPU bars
      for (let c = 0; c < 4; c++) {
        const bar = q(`#deck-core-${c}`);
        if (bar) {
          const w = Math.floor(10 + Math.random() * (st.overdrive ? 22 : 14));
          bar.setAttribute('width', w);
        }
      }
    }

    st.radarTimer = api.every(60, rotateRadar);

    // Continuous Matrix Stream generator
    const PACKETS = [
      'SYN_ACK >> NODE 192.168.1.42 [OK]',
      '0xFA09 >> MEMORY BUS INTEGRITY: 99.4%',
      'SEC_TOKEN >> RE-ENCRYPTING HANDSHAKE...',
      'FIREWALL >> PACKET 1024 FILTERED',
      'QUANTUM >> ENTANGLEMENT LOCKED',
      'CPU_THROTTLE >> NORMAL TEMP: 41.8°C',
      'OVERLINK >> BANDWIDTH 10.4 GB/S'
    ];
    let pIdx = 0;
    st.streamTimer = api.every(900, () => {
      const line0 = q('#deck-line-0'), line1 = q('#deck-line-1');
      const line2 = q('#deck-line-2'), line3 = q('#deck-line-3');
      if (line0 && line1 && line2 && line3) {
        line0.textContent = line1.textContent;
        line1.textContent = line2.textContent;
        line2.textContent = line3.textContent;
        line3.textContent = PACKETS[pIdx % PACKETS.length];
        pIdx++;
      }
    });

    function triggerOverdrive() {
      st.overdrive = !st.overdrive;
      cyberBeep(1200, 0.4, 'sawtooth');
      api.flash(q('#deck-overdrive'), 240);
      const secEl = q('#deck-sec-status');
      if (secEl) {
        secEl.textContent = st.overdrive ? 'OVERDRIVE ACTIVE!' : 'SYSTEM SECURE';
      }
      render();
    }

    function addKeyInput(char) {
      if (char.length === 1) {
        st.typedChars = (st.typedChars + char).slice(-26);
        cyberBeep(600 + Math.random() * 800, 0.04);
        const line = q('#deck-user-line');
        if (line) line.textContent = `> ${st.typedChars}_`;
      }
    }

    function toggleSwitch(idx) {
      st.switches[idx] = !st.switches[idx];
      cyberBeep(st.switches[idx] ? 900 : 350, 0.08);
      const swEl = q(`#deck-sw-${idx}`);
      if (swEl) swEl.classList.toggle('on', st.switches[idx]);
      const ledEl = q(`#deck-sw-led-${idx}`);
      if (ledEl) ledEl.classList.toggle('hot', st.switches[idx]);
      if (idx === 3) triggerOverdrive();
      render();
    }

    function render() {
      api.power(true);
      q('#deck-ovd-led').classList.toggle('hot', st.overdrive);
      api.readout(
        st.overdrive
          ? `CYBERDECK · OVERDRIVE SPEED · CPU 98% · BUFFER: ${st.typedChars.length}`
          : `AUDIRA CYBERDECK · LIVE ACTIVE · TYPE TO INJECT HEX`
      );
    }

    stage.addEventListener('click', e => {
      const sw = e.target.closest('.deck-sw');
      if (sw && sw.dataset.i) {
        toggleSwitch(+sw.dataset.i);
        return;
      }
      if (e.target.closest('#deck-overdrive')) {
        triggerOverdrive();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          triggerOverdrive();
          return true;
        }
        if (e.key.length === 1) {
          addKeyInput(e.key);
          return true;
        }
        return false;
      },
      unmount() {
        if (st.radarTimer) clearInterval(st.radarTimer);
        if (st.streamTimer) clearInterval(st.streamTimer);
        api.power(false);
      },
      demo() {
        // Continuous stream is already running
      }
    };
  }
});
