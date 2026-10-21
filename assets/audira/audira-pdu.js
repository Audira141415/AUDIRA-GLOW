/* Fig 10 — Audira Smart PDU & Static Transfer Switch (STS) Power Distribution */
FIGS.push({
  id: 'audira-pdu',
  name: 'Smart PDU & STS',
  hint: 'Click circuit breakers to toggle branch feeds · Space triggers overload test · Keys 1–6',
  aria: 'Isometric enterprise power distribution unit (PDU) and static transfer switch cabinet with internal 3-phase isolation transformer, branch circuit breaker matrix, and power quality analyzer display.',
  css: `
    [data-fig="audira-pdu"] .pdu-breaker { cursor:pointer; }
    [data-fig="audira-pdu"] .pdu-breaker:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-pdu"] .pdu-breaker.tripped .face { opacity:.35; }
    [data-fig="audira-pdu"] .copper-coil { fill:none; stroke:var(--accent); stroke-width:2.4; stroke-linecap:round; filter:url(#soft); }
    [data-fig="audira-pdu"] .bus-conduit { fill:none; stroke:var(--accent-hi); stroke-width:2.5; stroke-dasharray:10 20; filter:url(#glow); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [30, 20, 200], [310, 20, 200], [30, 240, 200], [310, 240, 200]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="pdu-lcd-clip"><rect x="4" y="3" width="82" height="24" rx="2"/></clipPath>
    </defs>`;

    // Base Floor Plate (Electrical room demarcations)
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Electrical rubber safety matting outline -->
      <rect class="face recess" x="45" y="160" width="250" height="75" rx="6"/>
      <text class="label" x="50" y="248" font-size="4" letter-spacing="1.5">ELECTRICAL DISTRIBUTION · 3-PHASE 400V / 230V · BRANCH CIRCUIT MONITORING</text>
    </g>`;

    // PDU CABINET CHASSIS (X=70, Y=35, W=200, D=135, H=160)
    const PX = 70, PY = 35, PW = 200, PD = 135, PH = 160, PZ = PLZ;
    const PT = PZ + PH, PF = PY + PD;

    // Outer Cabinet Housing
    svg += box(PX, PY, PZ, PW, PD, PH, 6);

    // Top Overhead Cable Busway Duct
    svg += box(PX - 15, PY + 25, PT, PW + 30, 32, 10, 3);
    svg += `<g transform="${TOP(PX - 15, PY + 25, PT + 10)}">
      ${slits(6, PW + 24, 4, 4, 28, true)}
      <text class="label" x="14" y="18" font-size="4" letter-spacing="1">OVERHEAD 400A BUSWAY RUNNER</text>
    </g>`;

    // Upper Front Door Panel (Power Quality Meter LCD & Main Breaker)
    svg += `<g transform="${FRONT(PX, PF, PT)}">
      <!-- Digital Power Quality Analyzer -->
      <rect class="face recess" x="14" y="8" width="90" height="32" rx="3"/>
      <rect class="halo hot" x="16" y="10" width="86" height="28" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="16" y="10" width="86" height="28" rx="2"/>

      <g clip-path="url(#pdu-lcd-clip)" transform="translate(16 10)">
        <text class="scr" x="4" y="8" font-size="3.5">PHASE A: 231V · 284A</text>
        <text class="scr" x="4" y="14" font-size="3.5">PHASE B: 230V · 276A</text>
        <text class="scr-accent" id="pdu-load-txt" x="4" y="21" font-size="3.8">TOTAL: 194 kW [PF 0.99]</text>
      </g>

      <text class="label" x="115" y="18" font-size="5" font-weight="500" letter-spacing="1.5">AUDIRA · SMART PDU</text>
      <circle class="led hot" filter="url(#soft)" cx="${PW - 16}" cy="16" r="2.5"/>

      <!-- Main Input 400A Molded Case Circuit Breaker (MCCB) -->
      <rect class="face recess" x="115" y="26" width="60" height="18" rx="2"/>
      <line class="detail" id="pdu-main-arm" stroke="var(--accent-hi)" stroke-width="2.5" stroke-linecap="round" x1="130" y1="35" x2="160" y2="35"/>
      <text class="label" x="145" y="42" font-size="2.8" text-anchor="middle">MAIN 400A</text>
    </g>`;

    // Lower Front Bay: 18 Miniature Branch Circuit Breakers (3-Phase Matrix)
    const B_Y = PF;
    svg += `<g transform="${FRONT(PX, B_Y, PZ + 95)}">
      <rect class="face recess" x="10" y="4" width="${PW - 20}" height="84" rx="4"/>
      <text class="label" x="14" y="12" font-size="3.2" letter-spacing=".8">BRANCH CIRCUIT DISTRIBUTION PANEL (42 POLE)</text>
      
      <!-- 3 Rows of 6 Breakers -->
      ${[0, 1, 2].map(r => `
        <text class="label" x="14" y="${28 + r * 22}" font-size="3">PH-${String.fromCharCode(65 + r)}</text>
        ${Array.from({ length: 6 }, (_, c) => {
          const bx = 34 + c * 24;
          const by = 18 + r * 22;
          const bId = r * 6 + c;
          return `<g class="pdu-breaker" id="breaker-${bId}" data-id="${bId}">
            <rect class="face" x="${bx}" y="${by}" width="18" height="15" rx="1.5"/>
            <circle class="led hot breaker-led" id="bled-${bId}" filter="url(#soft)" cx="${bx + 9}" cy="${by + 5}" r="1.3"/>
            <text class="label" x="${bx + 9}" y="${by + 13}" font-size="2.2" text-anchor="middle">${c + 1}</text>
          </g>`;
        }).join('')}
      `).join('')}
    </g>`;

    // Sub-feed bus conduit cables running out to floor
    const C0 = [PX + 30, PF - 4, PZ + 10];
    const C1 = [PX + 30, PF + 25, 10];
    const C2 = [PX + 120, PF + 60, 9];
    const busD = `M ${K.P(...C0).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...C1).map(v => v.toFixed(1)).join(' ')}, ${K.P(...C2).map(v => v.toFixed(1)).join(' ')}`;
    svg += `<path class="detail" stroke="var(--line)" stroke-width="2.5" d="${busD}"/>`;
    svg += `<path class="bus-conduit" d="${busD}">
      <animate attributeName="stroke-dashoffset" from="60" to="0" dur="0.9s" repeatCount="indefinite"/>
    </path>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      breakers: Array(18).fill(true),
      overloaded: false,
      totalKw: 194,
      totalAmps: 284,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function pduAudio(f, dur = 0.05, type = 'sine') {
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

    function toggleBreaker(id) {
      st.breakers[id] = !st.breakers[id];
      pduAudio(st.breakers[id] ? 720 : 280, 0.06);

      const bEl = q(`#breaker-${id}`);
      if (bEl) bEl.classList.toggle('tripped', !st.breakers[id]);
      const lEl = q(`#bled-${id}`);
      if (lEl) lEl.classList.toggle('hot', st.breakers[id]);

      recalcPower();
    }

    function recalcPower() {
      const activeCount = st.breakers.filter(Boolean).length;
      st.totalKw = Math.floor(activeCount * 11.2);
      st.totalAmps = Math.floor(activeCount * 16.4);

      const lTxt = q('#pdu-load-txt');
      if (lTxt) lTxt.textContent = `TOTAL: ${st.totalKw} kW [PF 0.99]`;

      render();
    }

    function triggerOverload() {
      st.overloaded = !st.overloaded;
      pduAudio(st.overloaded ? 1100 : 600, 0.25, 'sawtooth');

      // Trip half the breakers if overloaded
      st.breakers.forEach((b, idx) => {
        if (st.overloaded && idx % 2 === 1) {
          st.breakers[idx] = false;
          const bEl = q(`#breaker-${idx}`);
          if (bEl) bEl.classList.add('tripped');
          const lEl = q(`#bled-${idx}`);
          if (lEl) lEl.classList.remove('hot');
        } else if (!st.overloaded) {
          st.breakers[idx] = true;
          const bEl = q(`#breaker-${idx}`);
          if (bEl) bEl.classList.remove('tripped');
          const lEl = q(`#bled-${idx}`);
          if (lEl) lEl.classList.add('hot');
        }
      });

      recalcPower();
    }

    // Power Micro-Jitter Loop
    st.timer = api.every(50, () => {
      st.tick++;
      if (st.tick % 6 === 0) {
        const jitter = (Math.sin(st.tick * 0.2) * 1.5).toFixed(0);
        const lTxt = q('#pdu-load-txt');
        if (lTxt) lTxt.textContent = `TOTAL: ${st.totalKw + parseInt(jitter, 10)} kW [PF 0.99]`;
      }
    });

    function render() {
      api.power(true);
      const active = st.breakers.filter(Boolean).length;
      api.readout(
        st.overloaded
          ? `PDU OVERLOAD TRIP · ${active}/18 BREAKERS CLOSED · LOAD: ${st.totalKw} kW · 3-PHASE OK`
          : `SMART PDU ONLINE · ${active}/18 BRANCHES ACTIVE · ${st.totalKw} kW · 400V 50Hz`
      );
    }

    stage.addEventListener('click', e => {
      const brk = e.target.closest('.pdu-breaker');
      if (brk && brk.dataset.id) {
        toggleBreaker(+brk.dataset.id);
        return;
      }
      if (e.target.closest('#pdu-main-arm')) {
        triggerOverload();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          triggerOverload();
          return true;
        }
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 6) {
          toggleBreaker(num - 1);
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        triggerOverload();
      }
    };
  }
});
