# BRAIN & LIVING MEMORY SYNCHRONIZATION PROTOCOL

> **Rule ID**: `AUDIRA-BRAIN-SYNC-01`  
> **Target**: Seluruh AI Agent (Antigravity, Copilot, Cursor, Windsurf, Claude) & Pengembang di AUDIRA-AGENT.  
> **Level**: MANDATORY (Wajib Dipatuhi Tanpa Pengecualian).

---

## 1. Tujuan Kebijakan

Dokumen [`.agents/BRAIN.md`](file:///f:/AUDIRA-AGENT/.agents/BRAIN.md) dan modul di dalam [`.agents/brain/`](file:///f:/AUDIRA-AGENT/.agents/brain/) merupakan **Single Source of Truth (SSOT)** dan **Living Memory Bank** dari proyek AUDIRA-AGENT.

Kebijakan ini menjamin:
1. **Preservasi Identitas Studio 3D**: Mencegah salah sangka konsep (proyek ini adalah 3D Game Studio & Runway, bukan datacenter pendingin).
2. **Pencegahan Amnesia Spasial**: Memastikan seluruh kalkulasi Catwalk Runway 56m, 8-pod turntable, dan koordinat Three.js selalu dipahami.
3. **Pembaruan Berkelanjutan**: Menjamin dokumentasi arsitektur tidak pernah tertinggal (*stale*).

---

## 2. Siklus Hidup: "READ FIRST, ACT SECOND, UPDATE ON FINISH"

Setiap kali Anda (AI Agent / Pengembang) berinteraksi dengan proyek ini:

### A. Awal Sesi (Wajib Membaca)
1. Baca [`AGENTS.md`](file:///f:/AUDIRA-AGENT/AGENTS.md) dan [`.agents/BRAIN.md`](file:///f:/AUDIRA-AGENT/.agents/BRAIN.md).
2. Periksa aturan di [`.agents/rules/`](file:///f:/AUDIRA-AGENT/.agents/rules/) sebelum memodifikasi kode.

### B. Selama Eksekusi (Wajib Mematuhi)
1. Pertahankan arsitektur **100% 3D Three.js WebGL**. Dilarang menggunakan canvas 2D retro atau overlay HTML yang menutupi runway.
2. Gunakan **Web Audio API prosedural** di [`AudioManager.js`](file:///f:/AUDIRA-AGENT/src/engine/AudioManager.js); dilarang mengimpor file MP3 eksternal.
3. Pastikan grounding objek diatur dengan benar (`y >= 0`) mengikuti [`ground_level_alignment.md`](file:///f:/AUDIRA-AGENT/.agents/rules/ground_level_alignment.md).

### C. Akhir Sesi / Milestone Selesai (Wajib Memperbarui)
1. **Jika Menambah / Mengubah Modul UI atau 3D**: Daftarkan file di Bab 2 [`BRAIN.md`](file:///f:/AUDIRA-AGENT/.agents/BRAIN.md).
2. **Jika Menambah Rute Baru**: Catat di Bab 3 [`BRAIN.md`](file:///f:/AUDIRA-AGENT/.agents/BRAIN.md).
3. **Jika Menyelesaikan Fitur**: Tandai checkbox `[x]` pada Bab 7 *Living Feature Ledger* di [`BRAIN.md`](file:///f:/AUDIRA-AGENT/.agents/BRAIN.md) dan perbarui [`.agents/brain/UPDATE_HISTORY_AND_ROADMAP.md`](file:///f:/AUDIRA-AGENT/.agents/brain/UPDATE_HISTORY_AND_ROADMAP.md).
