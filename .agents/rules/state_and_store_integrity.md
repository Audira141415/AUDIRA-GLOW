# STATE & REPOSITORY INTEGRITY RULES

> **Rule ID**: `AUDIRA-STATE-01`  
> **Target**: Seluruh AI Agent, State Management (`AgentRegistry.js`, `showcase_state.json`), WebSocket Sync, dan SPA Router.  
> **Level**: MANDATORY (Integritas Data, Sinkronisasi Spasial, dan Persistensi).

---

## 1. Pemisahan Modular Lapisan State

State aplikasi AUDIRA-AGENT diisolasi ke dalam domain yang teratur dan saling melengkapi:

```
State Architecture:
├── AgentRegistry.js       # Registri armada AI Agent, localStorage 'audira_custom_agents_v2'
├── showcase_state.json    # Status persisten 8 slot pod Catwalk Runway 56m (Alpha - Theta)
├── asset_metadata.json    # Metadata taksonomi 8 kategori model 3D (Gundam, Mecha, Anime, dll)
├── ai_config.json         # Konfigurasi dual-tier Ollama lokal & 9Router Gateway
├── api_keys.json          # Manajemen API key eksternal & rate limiting developer hub
└── src/utils/router.js    # Client-side hash SPA routing & active modal states
```

---

## 2. Protokol Sinkronisasi Real-Time (WebSocket & Reactive Sync)

1. **Broadcast Event Berbobot Rendah**:
   - Event `RUNWAY_MODEL_UPDATED` hanya memancarkan `podId`, `modelUrl`, `category`, dan timestamp.
   - Scene client 3D menerima event dan memuat model secara asinkron tanpa memblokir thread render Three.js.
2. **Safe Fallback Deserialisasi**:
   - Jika `showcase_state.json` atau `localStorage` korup, sistem wajib otomatis melakukan fallback ke preset awal tanpa melempar runtime crash unhandled exception.
3. **Penyimpanan Atomic**:
   - Penulisan ke `data/showcase_state.json` di `server.js` dilakukan secara atomic (tulis ke berkas sementara lalu rename) untuk mencegah file korup saat server terhenti tiba-tiba.

---

## 3. Protokol Navigasi SPA & Kontrol Modal

- Setiap modal (`AssetManagerModal`, `BlenderBridgeModal`, `AIConfigModal`, `ApiManagerModal`, `RunwayAssetSpecModal`) memiliki pemetaan rute hash yang sinkron (`#/assets`, `#/blender`, `#/ai-config`, `#/api-manager`, dll).
- Penutupan modal wajib mengembalikan hash URL ke `#/studio` atau rute sebelumnya secara bersih.
- Dilarang membiarkan dua modal fullscreen terbuka saling menindih (*modal collision*).
