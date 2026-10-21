/* Fig 11 — Audira Automated Robotic Tape Library & LTO Cold Archive Vault */
FIGS.push({
  id: 'audira-tape',
  name: 'Robotic Tape Library',
  hint: 'Click tape slots to pick cartridge · Space triggers robot inventory sweep · Keys 1–4',
  aria: 'Isometric enterprise robotic tape library archive vault with dual motorized picker robotics moving on precision rails, hundreds of LTO-9 tape slots, barcode laser scanner, and high-speed tape drive bays.',
  css: `
    [data-fig="audira-tape"] .tape-slot { cursor:pointer; }
    [data-fig="audira-tape"] .tape-slot:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-tape"] .tape-drive { cursor:pointer; }
    [data-fig="audira-tape"] .tape-drive:hover .face.top { stroke:var(--accent-hi); }
    [data-fig="audira-tape"] .robot-laser { fill:none; stroke:var(--accent); stroke-width:1.8; stroke-dasharray:8 12; opacity:.9; filter:url(#glow); }
    [data-fig="audira-tape"] .cartridge { fill:var(--deck); stroke:var(--line); stroke-width:.8; }
    [data-fig="audira-tape"] .cartridge.loaded { fill:var(--accent-dim); stroke:var(--accent); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 260, 0], [340, 0, 7], [340, 260, 0], [0, 0, 7],
      [20, 20, 210], [320, 20, 210], [20, 240, 210], [320, 240, 210]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits;

    const PLZ = 7;
    let svg = `<defs>
      <clipPath id="tape-lcd-clip"><rect x="4" y="3" width="76" height="18" rx="2"/></clipPath>
    </defs>`;

    // Base Floor Plate (Clean Storage Archive Room)
    svg += box(0, 0, 0, 340, 260, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="8" y="8" width="324" height="244" rx="10"/>
      <text class="label" x="40" y="248" font-size="4" letter-spacing="1.5">COLD STORAGE ARCHIVE · AUTOMATED LTO-9 ROBOTIC TAPE LIBRARY (18 TB / CART)</text>
    </g>`;

    // TAPE LIBRARY HIGH CABINET (X=50, Y=35, W=240, D=140, H=170)
    const TX = 50, TY = 35, TW = 240, TD = 140, TH = 170, TZ = PLZ;
    const TT = TZ + TH, TF = TY + TD;

    // Outer Cabinet Housing
    svg += box(TX, TY, TZ, TW, TD, TH, 6);

    // Top Header (Status Display & Air Filtration)
    svg += `<g transform="${FRONT(TX, TF, TT)}">
      <rect class="face recess" x="14" y="6" width="80" height="24" rx="3"/>
      <rect class="halo hot" x="16" y="8" width="76" height="20" rx="2" filter="url(#bloom)"/>
      <rect class="face glass hot" filter="url(#soft)" x="16" y="8" width="76" height="20" rx="2"/>

      <g clip-path="url(#tape-lcd-clip)" transform="translate(16 8)">
        <text class="scr" x="4" y="8" font-size="3.5">LTO-9 VAULT · 18TB CARTS</text>
        <text class="scr-accent" id="tape-status-txt" x="4" y="16" font-size="3.8">ROBOT: READY [SLOT A-04]</text>
      </g>
      <text class="label" x="104" y="18" font-size="5" font-weight="500" letter-spacing="1.5">AUDIRA · TAPE-VAULT</text>
      <circle class="led hot" filter="url(#soft)" cx="${TW - 16}" cy="16" r="2.5"/>
    </g>`;

    // Central Glass Viewing Window (Shows the Cartridge Grid & Robotic Picker)
    const WIN_Y = TF;
    svg += `<g transform="${FRONT(TX, WIN_Y, TZ + 140)}">
      <rect class="face recess" x="12" y="4" width="${TW - 24}" height="130" rx="4"/>
      <rect class="face glass" x="14" y="6" width="${TW - 28}" height="126" rx="3"/>

      <!-- Matrix of LTO Tape Cartridge Cells (6 Rows x 12 Cols) -->
      ${Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 12 }, (_, c) => {
          const sx = 20 + c * 15.5;
          const sy = 14 + r * 16;
          const sId = `slot-${r}-${c}`;
          return `<rect class="cartridge tape-slot" id="${sId}" data-row="${r}" data-col="${c}" x="${sx}" y="${sy}" width="12" height="11" rx="1"/>
                  <line class="detail" x1="${sx + 2}" y1="${sy + 5}" x2="${sx + 10}" y2="${sy + 5}"/>`;
        }).join('')
      ).join('')}

      <!-- Vertical & Horizontal Precision Guide Rails for Robot -->
      <line class="detail" stroke="var(--line)" stroke-width="2" x1="16" y1="112" x2="${TW - 16}" y2="112"/>
      <line class="detail" stroke="var(--line)" stroke-width="2" id="robot-v-rail" x1="110" y1="12" x2="110" y2="112"/>

      <!-- Motorized Robotic Picker Head Carriage -->
      <g id="tape-robot-picker" transform="translate(100 45)">
        <rect class="face" x="0" y="0" width="20" height="16" rx="2" fill="var(--body)" stroke="var(--accent-hi)" stroke-width="1.2"/>
        <circle class="led hot" filter="url(#soft)" cx="10" cy="8" r="2"/>
        <!-- Optical Barcode Laser Scanner Beam -->
        <line class="robot-laser" x1="10" y1="8" x2="10" y2="28">
          <animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.6s" repeatCount="indefinite"/>
        </line>
      </g>
    </g>`;

    // High-Speed LTO-9 Tape Drive Bays (Bottom Right Bay)
    const DRV_X = TX + TW - 65, DRV_Y = TF, DRV_Z = TZ + 6;
    svg += `<g class="tape-drive" id="tape-drive-bay">`;
    svg += box(DRV_X, DRV_Y, DRV_Z, 55, 30, 24, 2);
    svg += `<g transform="${FRONT(DRV_X, DRV_Y + 30, DRV_Z + 24)}">
      <rect class="face recess" x="4" y="4" width="47" height="16" rx="2"/>
      <circle class="led hot" filter="url(#soft)" cx="10" cy="12" r="2"/>
      <!-- Dual Tape Spools -->
      <circle class="face recess" cx="24" cy="12" r="5"/>
      <circle class="face recess" cx="38" cy="12" r="5"/>
      <text class="label" x="4" y="22" font-size="2.6">DRIVE 01: MOUNTED</text>
    </g>`;
    svg += `</g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- State & Logic ---------- */
    const st = {
      targetRow: 2,
      targetCol: 5,
      robotX: 100,
      robotY: 45,
      sweeping: false,
      tick: 0,
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function tapeAudio(f, dur = 0.05, type = 'sine') {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) {}
    }

    function moveRobotTo(row, col) {
      st.targetRow = row;
      st.targetCol = col;
      const targetX = 20 + col * 15.5 - 4;
      const targetY = 14 + row * 16 - 2;

      tapeAudio(640, 0.08);

      const picker = q('#tape-robot-picker');
      if (picker) {
        picker.style.transition = 'transform .4s cubic-bezier(.2,.8,.3,1)';
        picker.setAttribute('transform', `translate(${targetX} ${targetY})`);
      }

      const vRail = q('#robot-v-rail');
      if (vRail) {
        vRail.setAttribute('x1', targetX + 10);
        vRail.setAttribute('x2', targetX + 10);
      }

      const rowName = String.fromCharCode(65 + row);
      const colNum = String(col + 1).padStart(2, '0');
      const stTxt = q('#tape-status-txt');
      if (stTxt) stTxt.textContent = `ROBOT: PICKED [${rowName}-${colNum}]`;

      render();
    }

    function triggerSweep() {
      st.sweeping = !st.sweeping;
      tapeAudio(st.sweeping ? 1200 : 480, 0.2);

      let step = 0;
      const sweepTimer = setInterval(() => {
        if (step >= 6) {
          clearInterval(sweepTimer);
          return;
        }
        moveRobotTo(step % 6, (step * 2) % 12);
        step++;
      }, 450);
    }

    // Gentle robot laser jitter
    st.timer = api.every(60, () => {
      st.tick++;
    });

    function render() {
      api.power(true);
      const rName = String.fromCharCode(65 + st.targetRow);
      const cNum = String(st.targetCol + 1).padStart(2, '0');
      api.readout(
        `LTO TAPE ROBOT · ACTIVE SLOT: ${rName}-${cNum} · 18 TB CARTRIDGE · 480 MB/s TRANSFER`
      );
    }

    stage.addEventListener('click', e => {
      const slot = e.target.closest('.tape-slot');
      if (slot && slot.dataset.row) {
        moveRobotTo(+slot.dataset.row, +slot.dataset.col);
        return;
      }
      if (e.target.closest('#tape-drive-bay')) {
        triggerSweep();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === ' ') {
          triggerSweep();
          return true;
        }
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 6) {
          moveRobotTo(num - 1, (num * 2) % 12);
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        triggerSweep();
      }
    };
  }
});
