---
name: noc-theme-design-system
description: Design system guidelines, color tokens, and switching specifications for Enterprise NOC themes (Studio Dark, Cyber Hologram, Obsidian Blue, Matrix Green).
---

# Enterprise NOC Theme & Design System Skill

Skill ini mendefinisikan standar visual, token warna, ergonomi operator shift malam, dan arsitektur multi-tema untuk platform **AUDIRA NetOps AI**.

---

## 1. Filosofi Desain NOC Enterprise

1. **Anti-Fatigue (Ergonomi Shift 24/7)**:
   - Operator NOC bekerja dalam shift panjang (8–12 jam) di ruangan redup.
   - Hindari putih murni (#FFFFFF) yang menyilaukan pada latar luas. Gunakan warna latar gelap bertingkat (*hierarchical dark elevation*) dengan rasio kontras teks minimal 7:1 (WCAG AAA).
2. **High-Information Density & Visual Clarity**:
   - Metrik jaringan, IP address, CIDR, dan interface counter harus menggunakan font monospasi (*JetBrains Mono*) yang jelas tanpa ambiguitas karakter (e.g. `0` vs `O`, `1` vs `l`).
3. **Pemberian Status Semantik Konsisten**:
   - Hijau/Emerald = Normal / Online / Transmit OK.
   - Kuning/Amber = Warning / Degraded / Soft Flap.
   - Merah/Rose = Alarm Kritis / Interface Down / Link Loss.
   - Biru/Cyan = Info / Protocol Session / Safe Mutating.

---

## 2. Empat Preset Tema NOC Resmi

### Tema 1: Studio Dark Precision (`theme-studio-dark` — Default)
- **Karakter**: Minimalis, berkelas, presisi tinggi ala Apple Developer & Vercel.
- **Warna Kunci**:
  - Canvas: `#09090b` (Zinc 950)
  - Panel / Card: `#121215` / `#18181b`
  - Border Hairline: `#27272a` (Subtle 1px border)
  - Text: `#f4f4f5` (Primer), `#a1a1aa` (Sekunder)
  - Aksen: Zinc-white `#ffffff` & Electric Cyan `#38bdf8`

### Tema 2: Holographic Cyber NOC (`theme-cyber-hologram`)
- **Karakter**: Futuristik, sci-fi command center, neon aurora, glassmorphism.
- **Warna Kunci**:
  - Canvas: `#0a051b` (Deep obsidian violet)
  - Panel / Card: `rgba(21, 11, 51, 0.75)` dengan `backdrop-blur(16px)`
  - Border: `rgba(168, 85, 247, 0.25)` dengan neon glow
  - Text: `#f1f5f9` (Platinum) & Gradient Amethyst
  - Aksen: Neon Aurora Cyan `#2dd4bf` & Fuchsia Pink `#ec4899`

### Tema 3: Obsidian Blue NOC (`theme-obsidian-blue`)
- **Karakter**: Kontras tinggi untuk monitor video-wall, bergaya Datadog & Bloomberg Terminal.
- **Warna Kunci**:
  - Canvas: `#070c18` (Deep midnight navy)
  - Panel / Card: `#0d162a` / `#131f38`
  - Border: `rgba(56, 189, 248, 0.25)`
  - Text: `#e2e8f0` (Slate light)
  - Aksen: Cobalt Blue `#3b82f6` & Cyber Cyan `#06b6d4`

### Tema 4: Matrix Phosphor Green (`theme-matrix-green`)
- **Karakter**: Klasik retro-hacker, konsol Unix/VT100, PuTTY emerald.
- **Warna Kunci**:
  - Canvas: `#050d08` (Deep phosphor black-green)
  - Panel / Card: `#0a170f` / `#0f2216`
  - Border: `rgba(34, 197, 94, 0.25)`
  - Text: `#4ade80` (Phosphor green text)
  - Aksen: Terminal Amber `#f59e0b` & Matrix Bright `#22c55e`

---

## 3. Implementasi CSS Variables

Tema diterapkan melalui atribut data atau class pada root (`html[data-theme="..."]`):

```css
:root, [data-theme="studio-dark"] {
  --bg-canvas: #09090b;
  --bg-panel: #101014;
  --bg-card: #121215;
  --bg-surface: #18181b;
  --border-subtle: #27272a;
  --border-hover: #3f3f46;
  --text-main: #f4f4f5;
  --text-muted: #71717a;
  --accent-color: #38bdf8;
}

[data-theme="cyber-hologram"] {
  --bg-canvas: #0a051b;
  --bg-panel: #130a2e;
  --bg-card: #1c0e3f;
  --bg-surface: #261353;
  --border-subtle: rgba(168, 85, 247, 0.25);
  --border-hover: rgba(236, 72, 153, 0.5);
  --text-main: #f8fafc;
  --text-muted: #c084fc;
  --accent-color: #2dd4bf;
}

[data-theme="obsidian-blue"] {
  --bg-canvas: #070c18;
  --bg-panel: #0d162a;
  --bg-card: #131f38;
  --bg-surface: #1a2a4b;
  --border-subtle: rgba(56, 189, 248, 0.25);
  --border-hover: rgba(59, 130, 246, 0.5);
  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  --accent-color: #06b6d4;
}

[data-theme="matrix-green"] {
  --bg-canvas: #050d08;
  --bg-panel: #0a170f;
  --bg-card: #0f2216;
  --bg-surface: #142e1e;
  --border-subtle: rgba(34, 197, 94, 0.25);
  --border-hover: rgba(74, 222, 128, 0.5);
  --text-main: #bbf7d0;
  --text-muted: #4ade80;
  --accent-color: #22c55e;
}
```
