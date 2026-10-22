---
name: audira-3d-asset-pipeline
description: >-
  Use this skill when adding, optimizing, or inspecting 3D GLB/GLTF models, calculating bounding boxes,
  ensuring ground level alignment (y >= 0), configuring 8-slot runway showcase pods, or updating taxonomy metadata.
---

# Audira 3D Asset Pipeline & Model Normalization Runbook

Petunjuk operasional untuk mengintegrasikan model berkas 3D (`.glb`), normalisasi geometri, penyesuaian skala model, alokasi pod runway, dan registri metadata taksonomi di **AUDIRA-AGENT** (3D AI Game Dev Studio & Cyber Asset Command Center).

---

## 1. Aturan Wajib Bounding Box & Ground Alignment (`y >= 0`)

Model GLB dari Blender atau desainer pihak ketiga sering kali memiliki titik origin `(0, 0, 0)` di bagian tengah (*center of mass*).

### Prosedur Normalisasi Model:
1. Hitung kotak pembatas model aktual menggunakan Three.js `Box3`:
   ```typescript
   import * as THREE from 'three';

   export function normalizeModelGround(clonedScene: THREE.Object3D, targetHeight = 3.5) {
     const box = new THREE.Box3().setFromObject(clonedScene);
     const size = new THREE.Vector3();
     box.getSize(size);

     // Skalakan ke proporsi catwalk runway studio
     if (size.y > 0) {
       clonedScene.scale.setScalar(targetHeight / size.y);
     }

     // Hitung ulang bounding box pasca-skala
     box.setFromObject(clonedScene);
     const minY = box.min.y;

     // Angkat posisi model sehingga titik terendah tepat menempel di y = 0
     clonedScene.position.y = -minY;
     return clonedScene;
   }
   ```
2. Pastikan bayangan objek terhitung benar dengan mengaktifkan `castShadow` dan `receiveShadow` pada seluruh mesh anak:
   ```typescript
   clonedScene.traverse((child) => {
     if ((child as THREE.Mesh).isMesh) {
       child.castShadow = true;
       child.receiveShadow = true;
     }
   });
   ```

---

## 2. Struktur Penyimpanan & Taksonomi Asset

- **Model GLB**: Simpan berkas biner `.glb` di:
  - Bawaan: `public/models/<asset-name>.glb`
  - Unggahan Pengguna: `public/models/uploads/<asset-name>.glb`
- **Metadata Taksonomi**:
  - Daftarkan ke `data/asset_metadata.json` dengan salah satu dari 8 kategori:
    `gundam`, `anime`, `cars`, `mecha`, `monsters`, `weapons`, `warriors`, `standby`.
- **Showcase State Runway**:
  - Sinkronkan alokasi 8 slot pod Catwalk Runway (Alpha s/d Theta) di `data/showcase_state.json`.

---

## 3. Checklist Registrasi Asset Baru

Sebelum asset dapat muncul di Asset Library dan Runway Catwalk:
1. File berkas `.glb` sudah berada di direktori `public/models/` atau diunggah via `AssetManagerModal`.
2. Model diverifikasi via endpoint `/api/asset-inspect` atau modal inspeksi 3D.
3. Model diuji di atas catwalk runway 56m untuk memastikan alas kaki/roda menempel sempurna di piringan turntable pod ($y \ge 0$).
4. Jalankan `npm run build` untuk memverifikasi tidak ada path asset yang terputus.
