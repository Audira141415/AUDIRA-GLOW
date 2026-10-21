/* Fig 2 — Audira Retro Pocket Console */
FIGS.push({
  id: 'audira-pocket',
  name: 'Audira Pocket',
  hint: 'Auto-playing game! Arrow keys or D-Pad take control · A/B jump',
  aria: 'Isometric retro handheld game console with D-pad, A/B buttons, cartridge slot, and playable neon dot-matrix screen. Use arrow keys or click D-pad to bounce the ball.',
  css: `
    [data-fig="audira-pocket"] .dpad-btn, [data-fig="audira-pocket"] .act-btn { cursor:pointer; }
    [data-fig="audira-pocket"] .dpad-btn:hover .face.top, [data-fig="audira-pocket"] .act-btn:hover .face.top { stroke:var(--accent); }
    [data-fig="audira-pocket"] .cartridge { cursor:pointer; transition:transform .2s ease-out; }
    [data-fig="audira-pocket"] .cartridge:hover { transform:translateY(-4px); }
    [data-fig="audira-pocket"] .game-ball { fill:var(--accent-hi); }
    [data-fig="audira-pocket"] .game-paddle { fill:var(--accent); stroke:var(--accent-hi); stroke-width:.8; transition:x .04s ease-out; }
    [data-fig="audira-pocket"] .game-brick { fill:var(--accent); opacity:.8; }
    [data-fig="audira-pocket"] .dpad-btn.lit .face { fill:var(--accent); stroke:var(--accent-hi); }
    [data-fig="audira-pocket"] .dpad-btn.lit .face.top { fill:var(--accent-hi); }
  `,
  mount(stage, api) {
    const K = api.iso.frame([
      [0, 240, 0], [260, 0, 7], [260, 240, 0], [0, 0, 7],
      [65, 30, 75], [195, 30, 75], [65, 210, 75], [195, 210, 75]
    ]);
    const { TOP, FRONT, SIDE, box, path } = K, slits = api.iso.slits, esc = api.iso.esc;

    const PLZ = 7;
    const BX = 65, BY = 30, BW = 130, BD = 180, BH = 34, BT = PLZ + BH, BF = BY + BD;

    let svg = `<defs>
      <clipPath id="pocket-screen-clip"><rect x="10" y="8" width="88" height="66" rx="4"/></clipPath>
    </defs>`;

    // Base plate
    svg += box(0, 0, 0, 260, 240, PLZ, 14);
    svg += `<g transform="${TOP(0, 0, PLZ)}">
      <rect class="detail" x="9" y="9" width="242" height="222" rx="10"/>
      ${[[18, 18], [242, 18], [18, 222], [242, 222]].map(([x, y]) =>
        `<circle class="face recess" cx="${x}" cy="${y}" r="3"/><line class="detail" x1="${x - 1.8}" y1="${y}" x2="${x + 1.8}" y2="${y}"/>`
      ).join('')}
      <rect class="face recess" x="22" y="224" width="46" height="4" rx="2"/>
    </g>`;

    // Game Cartridge (recessed in back top)
    const CX = BX + 24, CY = BY + 6, CW = 82, CD = 16, CH = 24;
    svg += `<g class="cartridge" id="pocket-cart">
      ${box(CX, CY, BT - 8, CW, CD, CH, 3)}
      <g transform="${TOP(CX, CY, BT - 8 + CH)}">
        <rect class="face recess" x="6" y="2" width="${CW - 12}" height="${CD - 4}" rx="2"/>
        <text class="label" x="${CW / 2}" y="10" font-size="4.5" text-anchor="middle" letter-spacing="1">AUDIRA · ROM</text>
      </g>
    </g>`;

    // Main console chassis
    svg += box(BX, BY, PLZ, BW, BD, BH, 10);

    // Front bottom face detail
    svg += `<g transform="${FRONT(BX, BF, BT)}">
      <circle class="face recess" cx="40" cy="18" r="4"/>
      <circle class="led hot" id="pocket-hp-led" filter="url(#soft)" cx="40" cy="18" r="1.8"/>
      <text class="label" x="48" y="20" font-size="4">PHONES</text>
      ${slits(70, 110, 3, 10, 22)}
    </g>`;

    // Side face detail (volume dial & power slider)
    svg += `<g transform="${SIDE(BX + BW, BF, BT)}">
      <rect class="face recess" x="30" y="10" width="22" height="6" rx="2"/>
      <text class="label" x="24" y="22" font-size="4">VOL</text>
      <rect class="face recess" x="120" y="8" width="16" height="12" rx="2"/>
      <circle class="led hot" filter="url(#soft)" cx="128" cy="14" r="2"/>
      <text class="label" x="118" y="26" font-size="4">PWR</text>
    </g>`;

    // Top deck plate
    svg += `<g transform="${TOP(BX, BY, BT)}">
      <rect class="face recess" x="6" y="6" width="${BW - 12}" height="${BD - 12}" rx="6"/>
      <text class="label" x="12" y="16" font-size="6" font-weight="500" letter-spacing="2">AUDIRA POCKET</text>
      <line class="detail" x1="12" y1="19" x2="${BW - 12}" y2="19"/>
    </g>`;

    // SECTION 1: Dot-Matrix LCD Screen
    const SX = BX + 11, SY = BY + 28, SW = 108, SD = 82;
    svg += box(SX, SY, BT, SW, SD, 3, 3);
    svg += `<g transform="${TOP(SX, SY, BT + 3)}">
      <rect class="face recess" x="4" y="4" width="${SW - 8}" height="${SD - 8}" rx="4"/>
      <rect class="halo hot" x="6" y="6" width="${SW - 12}" height="${SD - 12}" rx="3" filter="url(#bloom)"/>
      <rect class="face glass hot" id="pocket-screen-glass" filter="url(#soft)" x="6" y="6" width="${SW - 12}" height="${SD - 12}" rx="3"/>

      <g clip-path="url(#pocket-screen-clip)">
        <text class="scr" x="14" y="18" font-size="4.5" letter-spacing="1">SCORE</text>
        <text class="scr-accent" id="pocket-score" x="32" y="18" font-size="5" font-weight="500">000</text>
        <text class="scr" x="66" y="18" font-size="4.5" letter-spacing="1">AUTO-PLAY</text>
        <line class="detail" x1="12" y1="21" x2="96" y2="21"/>

        <!-- Bricks row -->
        <g id="pocket-bricks">
          ${[0, 1, 2, 3, 4, 5].map(i =>
            `<rect class="game-brick" id="p-brick-${i}" x="${16 + i * 13}" y="26" width="11" height="4" rx="1"/>`
          ).join('')}
        </g>
        
        <!-- Bouncing Ball -->
        <circle class="game-ball" id="pocket-ball" filter="url(#glow)" cx="54" cy="46" r="2.2"/>
        
        <!-- Player Paddle -->
        <rect class="game-paddle" id="pocket-paddle" filter="url(#soft)" x="44" y="64" width="20" height="3" rx="1.5"/>

        ${Array.from({ length: 15 }, (_, i) =>
          `<line class="detail" x1="12" y1="${24 + i * 3.2}" x2="96" y2="${24 + i * 3.2}" opacity=".15"/>`
        ).join('')}
      </g>
    </g>`;

    // Battery / Power LED next to screen
    svg += `<g transform="${TOP(BX, BY, BT)}">
      <circle class="led hot" id="pocket-bat-led" filter="url(#soft)" cx="14" cy="56" r="1.4"/>
      <text class="label" x="18" y="57" font-size="3">BAT</text>
    </g>`;

    // SECTION 2: D-PAD (Directional Cross)
    const DPX = BX + 24, DPY = BY + 124;
    svg += box(DPX + 11, DPY + 11, BT, 11, 11, 4, 1);
    const DPAD_BTNS = [
      { id: 'left',  x: DPX,       y: DPY + 11, w: 11, d: 11, lbl: '◀' },
      { id: 'right', x: DPX + 22,  y: DPY + 11, w: 11, d: 11, lbl: '▶' },
      { id: 'up',    x: DPX + 11,  y: DPY,      w: 11, d: 11, lbl: '▲' },
      { id: 'down',  x: DPX + 11,  y: DPY + 22, w: 11, d: 11, lbl: '▼' },
    ];
    DPAD_BTNS.forEach(b => {
      svg += `<g class="press dpad-btn" id="dpad-${b.id}" data-dir="${b.id}">
        ${box(b.x, b.y, BT, b.w, b.d, 5, 2)}
        <g transform="${TOP(b.x, b.y, BT + 5)}">
          <text class="label" x="${b.w / 2}" y="${b.d / 2 + 1.2}" font-size="4" text-anchor="middle">${b.lbl}</text>
        </g>
      </g>`;
    });

    // SECTION 3: Action Buttons A & B
    const BTNS = [
      { id: 'b', x: BX + 78, y: BY + 140, lbl: 'B' },
      { id: 'a', x: BX + 98, y: BY + 126, lbl: 'A' },
    ];
    BTNS.forEach(b => {
      svg += `<g class="press act-btn" id="btn-${b.id}" data-btn="${b.id}">
        ${box(b.x, b.y, BT, 16, 16, 6, 8)}
        <g transform="${TOP(b.x, b.y, BT + 6)}">
          <circle class="face recess" cx="8" cy="8" r="6"/>
          <text class="label" x="8" y="10" font-size="5" text-anchor="middle" font-weight="500">${b.lbl}</text>
        </g>
      </g>`;
    });

    // SECTION 4: SELECT & START Pill Buttons
    const PILLS = [
      { id: 'select', x: BX + 44, y: BY + 168, lbl: 'SELECT' },
      { id: 'start',  x: BX + 68, y: BY + 168, lbl: 'START' },
    ];
    PILLS.forEach(p => {
      svg += `<g class="press act-btn" id="btn-${p.id}" data-btn="${p.id}">
        ${box(p.x, p.y, BT, 18, 7, 3, 2)}
        <g transform="${TOP(p.x, p.y, BT + 3)}">
          <text class="label" x="9" y="5.5" font-size="3" text-anchor="middle" letter-spacing=".5">${p.lbl}</text>
        </g>
      </g>`;
    });

    // Speaker grill slits at bottom right
    svg += `<g transform="${TOP(BX + 96, BY + 154, BT)}">
      ${slits(0, 18, 3, 0, 14, false)}
    </g>`;

    stage.setAttribute('viewBox', K.viewBox);
    stage.innerHTML = svg;

    /* ---------- Game Engine & Audio ---------- */
    const st = {
      score: 120,
      paddleX: 44,
      ballX: 54,
      ballY: 46,
      ballVX: 1.2,
      ballVY: -1.1,
      active: true,
      userControl: false,
      lastUserTime: 0,
      bricks: [true, true, true, true, true, true],
      timer: null
    };

    const q = s => stage.querySelector(s);

    let A = null;
    function beep(freq, dur = 0.08, type = 'square') {
      try {
        if (!A) A = api.audio();
        else if (A.ctx.state === 'suspended') A.ctx.resume();
        const t = A.ctx.currentTime;
        const osc = A.ctx.createOscillator();
        const g = A.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(A.out);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      } catch (e) {}
    }

    function movePaddle(dir) {
      st.userControl = true;
      st.lastUserTime = performance.now();
      if (dir === 'left') {
        st.paddleX = Math.max(14, st.paddleX - 6);
        api.flash(q('#dpad-left'), 60);
      } else if (dir === 'right') {
        st.paddleX = Math.min(74, st.paddleX + 6);
        api.flash(q('#dpad-right'), 60);
      }
      const padEl = q('#pocket-paddle');
      if (padEl) padEl.setAttribute('x', st.paddleX);
    }

    function gameTick() {
      if (!st.active) return;

      st.ballX += st.ballVX;
      st.ballY += st.ballVY;

      // Auto-Paddle AI: smoothly tracks the ball if user hasn't pressed keys recently
      if (!st.userControl || performance.now() - st.lastUserTime > 3000) {
        st.userControl = false;
        const targetX = Math.max(14, Math.min(74, st.ballX - 10));
        st.paddleX += (targetX - st.paddleX) * 0.25;
        const padEl = q('#pocket-paddle');
        if (padEl) padEl.setAttribute('x', st.paddleX.toFixed(1));
      }

      // Wall bounce
      if (st.ballX <= 14) {
        st.ballX = 14;
        st.ballVX = Math.abs(st.ballVX);
        beep(440);
      } else if (st.ballX >= 94) {
        st.ballX = 94;
        st.ballVX = -Math.abs(st.ballVX);
        beep(440);
      }

      // Ceiling bounce
      if (st.ballY <= 24) {
        st.ballY = 24;
        st.ballVY = Math.abs(st.ballVY);
        beep(520);
      }

      // Paddle bounce
      if (st.ballY >= 62 && st.ballY <= 66) {
        if (st.ballX >= st.paddleX - 4 && st.ballX <= st.paddleX + 24) {
          st.ballVY = -Math.abs(st.ballVY);
          st.ballVX += (Math.random() - 0.5) * 0.5;
          beep(660);
        }
      }

      // Bottom out
      if (st.ballY > 72) {
        st.ballX = 54;
        st.ballY = 46;
        st.ballVY = -1.0;
        st.score = Math.max(0, st.score - 5);
        beep(180, 0.2, 'sawtooth');
      }

      // Check Brick collision
      if (st.ballY <= 32 && st.ballY >= 25) {
        const brickIdx = Math.floor((st.ballX - 16) / 13);
        if (brickIdx >= 0 && brickIdx < 6 && st.bricks[brickIdx]) {
          st.bricks[brickIdx] = false;
          st.ballVY = Math.abs(st.ballVY);
          st.score += 20;
          beep(880, 0.1);
          const bEl = q(`#p-brick-${brickIdx}`);
          if (bEl) bEl.style.display = 'none';

          if (st.bricks.every(b => !b)) {
            st.bricks = [true, true, true, true, true, true];
            stage.querySelectorAll('.game-brick').forEach(b => (b.style.display = ''));
            beep(1200, 0.25);
          }
        }
      }

      // Update ball SVG
      const bEl = q('#pocket-ball');
      if (bEl) {
        bEl.setAttribute('cx', st.ballX.toFixed(1));
        bEl.setAttribute('cy', st.ballY.toFixed(1));
      }
      const scoreEl = q('#pocket-score');
      if (scoreEl) scoreEl.textContent = String(st.score).padStart(3, '0');
    }

    st.timer = api.every(35, gameTick);

    function render() {
      api.power(true);
      q('#pocket-screen-glass').classList.add('hot');
      q('.halo').classList.add('hot');
      api.readout(`AUDIRA POCKET · LIVE RUNNING · SCORE: ${st.score}`);
    }

    stage.addEventListener('click', e => {
      const dpad = e.target.closest('.dpad-btn');
      if (dpad && dpad.dataset.dir) {
        movePaddle(dpad.dataset.dir);
        return;
      }
      const act = e.target.closest('.act-btn');
      if (act && act.dataset.btn) {
        api.flash(act, 80);
        if (act.dataset.btn === 'a') {
          beep(980);
          movePaddle('right');
        } else if (act.dataset.btn === 'b') {
          beep(330);
          movePaddle('left');
        }
        return;
      }
      if (e.target.closest('#pocket-cart')) {
        api.flash(q('#pocket-cart'), 120);
        beep(1400, 0.2);
        st.score += 50;
        render();
        return;
      }
    });

    render();

    return {
      key(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          movePaddle('left');
          return true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          movePaddle('right');
          return true;
        }
        if (e.key === ' ' || e.key === 'Enter') {
          beep(880, 0.1);
          return true;
        }
        return false;
      },
      unmount() {
        if (st.timer) clearInterval(st.timer);
        api.power(false);
      },
      demo() {
        // Auto-play is already running continuously!
      }
    };
  }
});
