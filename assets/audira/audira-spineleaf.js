/* Fig 6 — Audira Spine-Leaf Clos Network Fabric & 800G Optical Cross-Connect */
FIGS.push({
  id: 'audira-spineleaf',
  name: 'Spine-Leaf Network',
  hint: 'Click switches to inspect routing · Space triggers RoCEv2 AI burst · Keys 1–6',
  aria: 'Isometric enterprise Spine-Leaf Clos network fabric with dual 800G Spine switches, 4 Top-of-Rack Leaf switches, full-mesh optical fiber harnesses with streaming photons, and BGP EVPN telemetry display.',
  css: `
    [data-fig="audira-spineleaf"] .switch-box { cursor:pointer; }
    [data-fig="audira-spineleaf"] .switch-box:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-spineleaf"] .switch-box.selected .face.top { stroke:var(--accent-hi); stroke-width:1.5; }
    [data-fig="audira-spineleaf"] .fiber-link { fill:none; stroke:var(--line); stroke-width:1.2; stroke-linecap:round; opacity:.55; transition:stroke .3s, opacity .3s; }
    [data-fig="audira-spineleaf"] .fiber-link.active { stroke:var(--accent); opacity:.9; }
    [data-fig="audira-spineleaf"] .fiber-photon { fill:none; stroke:var(--accent-hi); stroke-width:2.2; stroke-linecap:round; stroke-dasharray:14 45; filter:url(#glow); }
    [data-fig="audira-spineleaf"] .qsfp-port { fill:var(--recess); stroke:var(--line); stroke-width:.6; }
    [data-fig="audira-spineleaf"] .qsfp-port.txrx { fill:var(--accent); }
    [data-fig="audira-spineleaf"] .burst-btn { cursor:pointer; }
    [data-fig="audira-spineleaf"] .burst-btn:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-spineleaf"] .status-tag { fill:var(--deck); stroke:var(--line); stroke-width:.8; }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [20, 20, 210], [320, 20, 210], [20, 240, 210], [320, 240, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="net-mon-clip"><rect x="4" y="3" width="94" height="20" rx="2"/></clipPath>
    </defs>`;

    // Base Floor Plate (Perforated Network Room Tiles)
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <!-- Demarcation cable duct channels -->
      <line class="detail" x1="30" y1="30" x2="310" y2="30"/>
      <line class="detail" x1="30" y1="130" x2="310" y2="130"/>
      <line class="detail" x1="30" y1="230" x2="310" y2="230"/>
      <text class="label" x="40" y="248" font-size="4" letter-spacing="1.5">HYPERSCALE FABRIC · 3.2 Tbps NON-BLOCKING CLOS ARCHITECTURE</text>
    </g>`;

    // SWITCH CHASSIS COORDINATES
    // Spine Layer: Upper Tier (Z = 135)
    // 2 High-Radix Spine Switches
    const SPINES = [
      { id: 'spine-1', name: 'SPINE-01 (800G)', x: 70,  y: 35, z: 135, w: 90, d: 55, h: 22 },
      { id: 'spine-2', name: 'SPINE-02 (800G)', x: 180, y: 35, z: 135, w: 90, d: 55, h: 22 }
    ];

    // Leaf Layer: Lower Tier (Z = 30)
    // 4 Top-of-Rack Leaf Switches
    const LEAFS = [
      { id: 'leaf-1', name: 'LEAF-01 · TOR-A', x: 26,  y: 145, z: 30, w: 66, d: 50, h: 18 },
      { id: 'leaf-2', name: 'LEAF-02 · TOR-B', x: 104, y: 145, z: 30, w: 66, d: 50, h: 18 },
      { id: 'leaf-3', name: 'LEAF-03 · TOR-C', x: 182, y: 145, z: 30, w: 66, d: 50, h: 18 },
      { id: 'leaf-4', name: 'LEAF-04 · TOR-D', x: 260, y: 145, z: 30, w: 66, d: 50, h: 18 }
    ];

    // ALL SWITCHES
    const ALL_SWITCHES = [
      ...SPINES.map(s => ({ ...s, type: 'spine' })),
      ...LEAFS.map(l => ({ ...l, type: 'leaf' }))
    ];

    // Draw Overhead Support Trusses & Structural Racks
    // Vertical mounting rails
    [40, 300].forEach(rx => {
      svg += box(rx, 30, PLZ, 12, 12, 160, 2);
    });
    // Horizontal crossbars
    svg += box(40, 32, PLZ + 155, 272, 8, 8, 2);
    svg += box(40, 142, PLZ + 50, 272, 8, 8, 2);

    // DRAW FULL-MESH OPTICAL FIBER CABLING (Every Leaf -> Every Spine)
    const FIBER_LINKS = [];
    SPINES.forEach((sp, sIdx) => {
      LEAFS.forEach((lf, lIdx) => {
        const linkId = `${sp.id}-${lf.id}`;
        // Output port on Spine front-bottom
        const pSpine = [sp.x + 20 + lIdx * 14, sp.y + sp.d, sp.z + 6];
        // Input port on Leaf front-top
        const pLeaf = [lf.x + 18 + sIdx * 20, lf.y, lf.z + lf.h + 2];
        // Midpoint arch in 3D space
        const pMid = [
          (pSpine[0] + pLeaf[0]) / 2 + (sIdx === 0 ? -12 : 12),
          (pSpine[1] + pLeaf[1]) / 2 - 10,
          Math.max(pSpine[2], pLeaf[2]) + 15
        ];

        const dCurve = `M ${K.P(...pSpine).map(v => v.toFixed(1)).join(' ')} Q ${K.P(...pMid).map(v => v.toFixed(1)).join(' ')}, ${K.P(...pLeaf).map(v => v.toFixed(1)).join(' ')}`;
        FIBER_LINKS.push({ id: linkId, spine: sp.id, leaf: lf.id, d: dCurve });

        // Base cable path
        svg += `<path class="fiber-link active" id="link-${linkId}" d="${dCurve}"/>`;
        // High-speed photon pulse stream (Native SMIL SVG animate)
        const dur = (0.7 + (sIdx * 0.15) + (lIdx * 0.1)).toFixed(2);
        svg += `<path class="fiber-photon" id="photon-${linkId}" d="${dCurve}">
          <animate attributeName="stroke-dashoffset" from="140" to="0" dur="${dur}s" repeatCount="indefinite"/>
        </path>`;
      });
    });

    // DRAW SWITCH BOXES
    ALL_SWITCHES.forEach(sw => {
      const isSpine = sw.type === 'spine';
      svg += `<g class="switch-box" id="sw-${sw.id}" data-id="${sw.id}">`;
      svg += box(sw.x, sw.y, sw.z, sw.w, sw.d, sw.h, 3);

      // Top Lid Details
      svg += `<g transform="${TOP(sw.x, sw.y, sw.z + sw.h)}">
        <rect class="face recess" x="4" y="4" width="${sw.w - 8}" height="${sw.d - 8}" rx="2"/>
        ${slits(8, sw.w - 8, 3, 6, sw.d - 6)}
        <circle class="led hot" filter="url(#soft)" cx="10" cy="10" r="1.5"/>
        <text class="label" x="16" y="12" font-size="3.2" letter-spacing=".8">${sw.name}</text>
      </g>`;

      // Front Face (Port Matrix & Status LEDs)
      svg += `<g transform="${FRONT(sw.x, sw.y + sw.d, sw.z + sw.h)}">
        <rect class="face recess" x="4" y="4" width="${sw.w - 8}" height="${sw.h - 8}" rx="2"/>
        <!-- QSFP-DD / OSFP 800G Optical Ports -->
        ${Array.from({ length: isSpine ? 12 : 8 }, (_, p) => {
          const px = 6 + p * (isSpine ? 6.8 : 7.2);
          return `<rect class="qsfp-port txrx" id="port-${sw.id}-${p}" x="${px}" y="6" width="4.8" height="6" rx=".6"/>
                  <circle class="led hot" filter="url(#soft)" cx="${px + 2.4}" cy="14" r=".8"/>`;
        }).join('')}
        <text class="scr-accent" x="6" y="${sw.h - 3}" font-size="2.6">${isSpine ? '800G OSFP' : '400G TOR'}</text>
      </g>`;
      svg += `</g>`;
    });

    // Central Fabric Telemetry OLED Display Console (Center Front Floor)
    const O_X = 110, O_Y = 210, O_W = 120, O_D = 38, O_H = 16, O_T = PLZ + O_H;
    svg += box(O_X, O_Y, PLZ, O_W, O_D, O_H, 4);
    svg += `<g transform="${TOP(O_X, O_Y, O_T)}">
      <rect class="face recess" x="4" y="4" width="${O_W - 8}" height="${O_D - 8}" rx="3"/>
      <rect class="halo hot" x="6" y="6" width="${O_W - 12}" height="${O_D - 12}" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="6" y="6" width="${O_W - 12}" height="${O_D - 12}" rx="2"/>

      <g clip-path="url(#net-mon-clip)" transform="translate(6 6)">
        <text class="scr" x="4" y="8" font-size="4">FABRIC: BGP EVPN · ECMP 100%</text>
        <text class="scr-accent" id="net-thruput-txt" x="4" y="16" font-size="4.2">TRAFFIC: 1.84 Tbps [NON-BLOCKING]</text>
      </g>
    </g>`;

    // RoCEv2 AI Burst Simulation Button (Pill button on right floor)
    const B_X = 245, B_Y = 215;
    svg += `<g class="burst-btn" id="net-burst-btn">
      ${box(B_X, B_Y, PLZ, 70, 26, 6, 3)}
      <g transform="${TOP(B_X, B_Y, PLZ + 6)}">
        <text class="label" x="35" y="15" font-size="3.8" text-anchor="middle" letter-spacing="1">RoCEv2 AI BURST</text>
      </g>
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Real-Time Logic ---------- */
    const st = {
      selectedSw: 'spine-1',
      burstMode: false,
      throughputTbps: 1.84,
      packetLoss: '0.000%',
      latencyNs: 420,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function netChirp(f, dur = 0.04, type = 'sawtooth') {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) {}
    }

    function selectSwitch(id) {
      st.selectedSw = id;
      netChirp(840, 0.06);

      // Highlight links connected to this switch
      FIBER_LINKS.forEach(l => {
        const active = l.spine === id || l.leaf === id;
        const el = q(`#link-${l.id}`);
        if (el) el.classList.toggle('active', active);
        const pEl = q(`#photon-${l.id}`);
        if (pEl) pEl.style.opacity = active ? '1' : '0.25';
      });

      render();
    }

    function triggerBurst() {
      st.burstMode = !st.burstMode;
      api.flash(q('#net-burst-btn'), 260);
      netChirp(st.burstMode ? 1400 : 600, 0.2, 'square');

      // Increase photon animation speeds
      FIBER_LINKS.forEach((l, idx) => {
        const pEl = q(`#photon-${l.id}`);
        if (pEl) {
          const anim = pEl.querySelector('animate');
          if (anim) {
            anim.setAttribute('dur', st.burstMode ? '0.25s' : `${(0.7 + (idx % 3) * 0.2).toFixed(2)}s`);
          }
        }
      });

      render();
    }

    // Real-Time Optical Transceiver Jitter & Packet Activity
    st.timer = api.every(45, () => {
      st.tick++;

      // Flash QSFP ports on all switches
      const ports = stage.querySelectorAll('.qsfp-port');
      ports.forEach((p, idx) => {
        const tx = Math.random() > (st.burstMode ? 0.1 : 0.45);
        p.classList.toggle('txrx', tx);
      });

      // Micro-fluctuation in throughput telemetry
      if (st.tick % 5 === 0) {
        const base = st.burstMode ? 3.12 : 1.84;
        const jitter = (Math.sin(st.tick * 0.25) * 0.08).toFixed(2);
        st.throughputTbps = (base + parseFloat(jitter)).toFixed(2);
        const tEl = q('#net-thruput-txt');
        if (tEl) {
          tEl.textContent = `TRAFFIC: ${st.throughputTbps} Tbps [${st.burstMode ? 'AI ALL-REDUCE BURST' : 'NON-BLOCKING'}]`;
        }
      }
    });

    function render() {
      api.power(true);
      const sw = ALL_SWITCHES.find(s => s.id === st.selectedSw) || ALL_SWITCHES[0];
      api.readout(
        st.burstMode
          ? `RoCEv2 BURST · ${st.throughputTbps} Tbps · LOSS: ${st.packetLoss} · 420ns LATENCY`
          : `FABRIC ONLINE · ${sw.name} · BGP EVPN SYNC · CLOS NON-BLOCKING`
      );
    }

    stage.addEventListener('click', e => {
      const sw = e.target.closest('.switch-box');
      if (sw && sw.dataset.id) {
        selectSwitch(sw.dataset.id);
        return;
      }
      if (e.target.closest('#net-burst-btn')) {
        triggerBurst();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          triggerBurst();
          return true;
        }
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= ALL_SWITCHES.length) {
          selectSwitch(ALL_SWITCHES[num - 1].id);
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        triggerBurst();
      }
    };
  }
});
