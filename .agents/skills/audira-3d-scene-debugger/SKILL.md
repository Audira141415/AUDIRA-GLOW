---
name: audira-3d-scene-debugger
description: >-
  Use this skill when diagnosing 3D WebGL performance issues, frame drops below 60 FPS,
  excessive draw calls, WebGL context loss, memory leaks, EffectComposer post-processing passes, or shadow map artifacts.
---

# Audira 3D Scene Debugger & Performance Runbook

Petunjuk operasional untuk mendiagnosis, memprofiling, dan mengatasi isu performa rendering 3D Three.js, kebocoran memori WebGL, dan stabilitas pasca-pemrosesan di **AUDIRA-AGENT**.

---

## 1. Quick Telemetry & WebGL Diagnostics

Gunakan renderer info Three.js untuk memeriksa beban rendering pada aula studio:

```typescript
// Di dalam render loop scene.ts
function logRenderStats(renderer: THREE.WebGLRenderer) {
  const info = renderer.info;
  console.log({
    fps: currentFPS,
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  });
}
```

### Ambang Batas Sehat (Health Benchmarks Studio):
- **Framerate**: Stabil di **60 FPS**.
- **Draw Calls**: $\le 150$ calls per frame untuk seluruh studio 68m x 52m.
- **Triangles Count**: $\le 1.500.000$ triangles per frame saat 8 model pod aktif dimuat.
- **VRAM GPU**: $< 1.8\text{ GB}$.

---

## 2. Prosedur Investigasi Kebocoran Memori (Memory Leak Audit)

Jika memori tab browser terus membengkak saat beralih preset runway atau mengunggah model:

1. **Periksa Jumlah Geometri & Tekstur**:
   - Bandingkan `renderer.info.memory.geometries` sebelum dan sesudah penggantian model pod.
   - Jika angka tidak berkurang, pastikan hierarki model lama di-dispose secara rekursif.
2. **Eksekusi Pembersihan Manual**:
   ```typescript
   export function disposeHierarchy(root: THREE.Object3D) {
     root.traverse((node) => {
       if ((node as THREE.Mesh).isMesh) {
         const mesh = node as THREE.Mesh;
         mesh.geometry?.dispose();
         if (Array.isArray(mesh.material)) {
           mesh.material.forEach((m) => m.dispose());
         } else if (mesh.material) {
           mesh.material.dispose();
         }
       }
     });
   }
   ```
3. **Pembersihan CSS2D Object**:
   - Pastikan label nama agen dan balon percakapan dihapus dari DOM saat avatar di-respawn.

---

## 3. Menangani Artefak Bayangan & EffectComposer

- **Shadow Acne**: Sesuaikan `directionalLight.shadow.bias = -0.00015` pada Key Light studio.
- **GTAOPass Noise**: Pastikan sampling radius tidak melebihi `2.5` dan gunakan blur pass bawaan.
- **Bloom Blown-Out**: Jaga `bloomPass.threshold >= 0.85` agar hanya lampu emisive cyan/neon yang berpendar.
