# GROUND LEVEL & RUNWAY ALIGNMENT RULE (`y >= 0`)

> **Rule ID**: `AUDIRA-GROUND-01`  
> **Target**: Seluruh AI Agent, 3D Engine (`modelLoader.ts`, `AssetShowcaseConveyor.ts`, `autoSlicer.ts`), dan Blender Bridge Pipeline.  
> **Level**: MANDATORY & CRITICAL (DILARANG DILANGGAR TANPA PENGECUALIAN).

---

## 1. Pernyataan Kebijakan Mutlak

Setiap objek 3D model GLB (Gundam, Mecha, Robot, Monster, Karakter Anime, Kendaraan, Senjata) yang ditempatkan di Catwalk Runway 56m (Pod Alpha s/d Theta) maupun lantai Studio Cyber 68m x 52m **WAJIB SELALU BERADA PERSIS DI ATAS PERMUKAAN ALAS** dengan koordinat ketinggian vertikal minimum:

$$Y_{\text{kontak}} \ge Y_{\text{alas}}$$

### ⛔ Pantangan Mutlak:
- **DILARANG** membiarkan kaki mecha, roda kendaraan, alas armor, atau telapak kaki karakter tenggelam/tembus ke dalam piringan turntable pod runway atau lantai studio (`y < 0`).
- **DILARANG** berasumsi bahwa pivot origin `(0, 0, 0)` dari file model `.glb` pihak ketiga berada di bagian alas. Mayoritas model 3D memiliki pivot point di tengah geometri (*center of mass / bounding box center*).

---

## 2. Rumus Normalisasi Bounding Box Wajib di AUDIRA-AGENT

Di dalam pipeline Three.js (`modelLoader.ts` dan `autoSlicer.ts`), algoritma normalisasi berikut wajib dijalankan saat memuat model:

```typescript
import * as THREE from 'three';

export function normalizeAndGroundModel(
  modelScene: THREE.Object3D,
  targetHeight: number = 3.5
): THREE.Object3D {
  // 1. Hitung Bounding Box aktual secara rekursif
  const box = new THREE.Box3().setFromObject(modelScene);
  const size = new THREE.Vector3();
  box.getSize(size);

  // 2. Normalisasi skala agar proporsional dengan Catwalk Runway 56m
  if (size.y > 0) {
    const scaleFactor = targetHeight / size.y;
    modelScene.scale.setScalar(scaleFactor);
  }

  // 3. Hitung ulang bounding box setelah scaling
  box.setFromObject(modelScene);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // 4. Pusatkan posisi X dan Z ke origin pod, dan letakkan alas terbawah persis di Y = 0
  modelScene.position.x = -center.x;
  modelScene.position.z = -center.z;
  modelScene.position.y = -box.min.y; // Mengangkat model agar titik terendah persis Y = 0

  return modelScene;
}
```

---

## 3. Penegakan pada Catwalk Runway 56m & Turntable Pods

1. **Pod Turntable Elevation ($Y = 1.25\text{ m}$)**:
   - Pedestal turntable 8-Slot Catwalk Runway memiliki ketinggian permukaan piringan di $Y \approx 1.25\text{ m}$.
   - Posisi root model pod diatur sedemikian rupa sehingga alas mesh bersentuhan tepat dengan permukaan piringan putar tanpa celah melayang (*floating*) dan tanpa amblas (*clipping*).
2. **Dynamic Conveyor Belt Motion**:
   - Selama animasi pergerakan conveyor belt linear, elevasi vertikal $Y$ harus tetap terkunci pada bidang referensi runway.

---

## 4. Penegakan pada Blender Bridge (`audira_blender_bridge.py`)

Saat mengekspor model dari Blender 3D ke Catwalk Runway:
1. Operator wajib mengeksekusi grounding:
   ```python
   # Menghitung vertex terendah pada sumbu Z di Blender (Z-up)
   min_z = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
   obj.location.z -= min_z  # Turunkan/naikkan agar titik terbawah menyentuh Z = 0
   ```
2. Menerapkan *Apply All Transforms* (`bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)`).

---

## 5. Konsekuensi Pelanggaran

Kelalaian menerapkan aturan ini akan membuat model Gundam/Mecha terlihat terpotong di dalam turntable runway, merusak estetika visual presentasi, dan memicu kalkulasi bayangan kontak (*contact shadow*) yang salah pada `GTAOPass` dan directional light studio.
