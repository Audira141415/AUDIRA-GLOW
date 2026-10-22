---
name: blender-bridge-pipeline
description: >-
  Use this skill when working with the AUDIRA Blender 3D add-on integration, live WebSocket asset deployment, 11-zone biomechanical auto-slicer, armature preserving, secondary spring physics, or 7-suite kinematic animations.
---

# AUDIRA Blender 3D Bridge & Kinematic Pipeline Runbook

Panduan tata kelola dan SOP operasional integrasi Blender 3D (v3.0 - 5.2+), live WebSocket pipeline, in-engine auto-slicer, dan rigging gerak prosedural pada [AUDIRA-AGENT](file:///f:/AUDIRA-AGENT/AGENTS.md).

---

## 1. File & Komponen Terkait

- **Add-on Resmi Blender**: [public/integrations/audira_blender_bridge.py](file:///f:/AUDIRA-AGENT/public/integrations/audira_blender_bridge.py)  
  N-Panel add-on resmi di `View3D > Sidebar > AUDIRA Studio` dengan zero-dependency (menggunakan Python standard library).
- **In-Engine 3D Auto-Slicer**: [src/engine/3d/autoSlicer.ts](file:///f:/AUDIRA-AGENT/src/engine/3d/autoSlicer.ts)  
  Pemotong otomatis model .GLB monolitik menjadi 11 zona anatomi dan universal cyber endoskeleton.
- **UI Modal Blender Bridge**: [src/ui/BlenderBridgeModal.js](file:///f:/AUDIRA-AGENT/src/ui/BlenderBridgeModal.js)  
  Modal pemantauan status bridge, unduhan add-on, dan simulator interaktif di rute `#/blender`.
- **Backend Bridge & Endpoints**: [server.js](file:///f:/AUDIRA-AGENT/server.js)  
  Endpoint `/api/blender/download-addon`, `/api/blender/status`, `/api/blender/slots`, dan penanganan broadcast WebSocket.

---

## 2. Fitur Inti Arsitektur Bridge

### A. Ekspor & Impor Dua Arah (Bi-Directional)
1. **Export to Web Runway**:
   - Operator Blender `audira.deploy_animated_model` mengekspor active mesh/armature ke temporary GLB, membake animasi, dan mengunggahnya via HTTP POST multipart/json ke server AUDIRA (`http://localhost:8080/api/upload-asset`).
   - Server memancarkan event WebSocket `RUNWAY_MODEL_UPDATED` ke klien browser secara real-time.
2. **Import from Runway 56m to Blender**:
   - Operator `audira.import_from_runway` membaca cache slot Runway (`Alpha` s/d `Theta`) atau katalog disk `public/models/`.
   - Mengunduh file `.glb`, mengimpor ke Blender, melakukan auto-centering ke origin, dan menata Z=0 (auto-grounding).

### B. In-Engine 3D Auto-Slicer (`autoSlicer.ts`)
Jika model `.glb` tidak memiliki skeletal rig (model statis / monolitik seperti robot, Gundam, creature):
1. **11 Anatomical Zones**:
   - `Head & Crest` (Y > 0.82)
   - `Chest & Upper Torso` (0.55 < Y <= 0.82)
   - `Pelvis & Waist Skirts` (0.42 < Y <= 0.55)
   - `Left & Right Thigh` (0.22 < Y <= 0.42)
   - `Left & Right Calf / Foot` (Y <= 0.22)
   - `Left & Right Upper Arm`
   - `Left & Right Forearm / Hand`
2. **Universal Cyber Endoskeleton Inner Frame**:
   - Piston hidrolik ganda chrome menghubungkan pelvis ke dada.
   - Ball-and-socket hip joints titanium.
   - Rotary disc dampers pada lutut dan siku.
   - Mengunci material PBR dan UV asli 100% tanpa distorsi.

### C. Preservasi Armature Eksis & 19-Bone Canonical Mapping
Jika model sudah memiliki skeletal armature (Mixamo, Rigify, Tripo, biped):
- Add-on Blender mendeteksi vertex groups dan TIDAK menghapus skinning weights.
- Memetakan tulang ke 19 kanonik bone standard:
  `Hips`, `Spine`, `Chest`, `Neck`, `Head`, `LeftShoulder`, `LeftUpperArm`, `LeftLowerArm`, `LeftHand`, `RightShoulder`, `RightUpperArm`, `RightLowerArm`, `RightHand`, `LeftUpperLeg`, `LeftLowerLeg`, `LeftFoot`, `RightUpperLeg`, `RightLowerLeg`, `RightFoot`.

### D. 7 Suite Animasi Kinematik Dinamis
1. 🏃 **Run**: Fleksi lutut agresif (-80°), heel-kick tinggi, rotasi torso dinamis.
2. 🚶 **Walk**: Heel-strike natural, pelvic roll, dan counter-rotation lengan.
3. 🛑 **Idle Standby**: Respirasi mikro, bobbing vertikal halus.
4. 🧘 **Sit**: Horizontal thigh 90°, lutut 90°, tangan bertumpu di paha.
5. 🛋️ **Relaxed Contrapposto**: Tumpuan berat satu kaki, pinggul miring elegan.
6. ⚔️ **Combat Guard**: Posisi kuda-kuda atletik, siku ditekuk melindungi torso.
7. 👋 **Wave Greeting**: Tangan kanan melambai bersahabat dengan gesture fluid.

### E. Secondary Spring Physics Engine
- Deteksi otomatis sayap dan armor binder (`Wing.L`, `Wing.R`, `Binder.L`, `Binder.R`, `Cape`, `Hair`).
- Menerapkan fisika pegas inersia teredam (damped harmonic oscillation) saat locomotion (Walk / Run).

---

## 3. Standard Operating Procedures (SOP)

### A. Pengujian & Verifikasi Skrip Blender Bridge
1. Jalankan test otomatis pipeline bridge via Python di root project:
   ```bash
   python test_blender_bridge.py
   ```
2. Pastikan respons server:
   - Status endpoint HTTP 200 di `http://localhost:8080/api/blender/status`.
   - Data slot runway sinkron di `http://localhost:8080/api/blender/slots`.

### B. Menambahkan Suite Animasi Baru di Add-on
1. Buka [public/integrations/audira_blender_bridge.py](file:///f:/AUDIRA-AGENT/public/integrations/audira_blender_bridge.py).
2. Tambahkan fungsi generator Action baru di class kinematic generator.
3. Gunakan interpolasi Bezier atau Linear sesuai tipe gerakan (mekanikal vs organik).
4. Daftarkan action name ke enum list `suite_type`.

### C. Sinkronisasi Model ke Runway Tanpa Reload Halaman
1. Pastikan WebSocket server aktif di Port 8080 (`node server.js` atau via `start.bat`).
2. Setelah add-on mengunggah file atau memanggil `/api/deploy-runway-asset`, kirimkan event payload:
   ```json
   {
     "type": "RUNWAY_MODEL_UPDATED",
     "podIndex": 0,
     "modelData": {
       "url": "/models/my_robot.glb",
       "filename": "my_robot.glb",
       "scale": 1.0
     }
   }
   ```
3. [AssetShowcaseConveyor.ts](file:///f:/AUDIRA-AGENT/src/engine/3d/AssetShowcaseConveyor.ts) di Three.js akan menangkap pesan dan merender model secara live.
