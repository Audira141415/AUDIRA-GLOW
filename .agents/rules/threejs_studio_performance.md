# THREE.JS & CYBER STUDIO WEBGL PERFORMANCE RULES

> **Rule ID**: `AUDIRA-PERF-01`  
> **Target**: Seluruh AI Agent, Scene Engine (`scene.ts`, `build.ts`), EffectComposer, dan Post-Processing Passes.  
> **Level**: MANDATORY (Kinerja WebGL 60 FPS dan Stabilitas Memori Tab Browser).

---

## 1. Target Kinerja Utama

Pusat Komando 3D AUDIRA-AGENT beroperasi pada benchmark visual resolusi tinggi:
- **Framerate Target**: Konsisten **60 FPS** pada layar Full HD (1920x1080) desktop/laptop.
- **Batas Draw Calls**: $\le 150$ draw calls untuk seluruh aula studio (Master Wall 9-layar, 10 battlestations, 8 pod runway).
- **Budget VRAM**: $< 1.8\text{ GB}$ memori GPU untuk mencegah insiden WebGL Context Lost.
- **Shading Compilation**: Pre-warm shader program agar tidak terjadi *frame hitching* saat beralih shading mode (PBR, Wireframe, Normal, Hologram).

---

## 2. Aturan Wajib Siklus Hidup Memori & Resource Disposal

Setiap kali model GLB di runway diganti, mesh dipotong oleh auto-slicer, atau modal ditutup, wajib dilakukan pembersihan rekursif:

```typescript
export function disposeThreeHierarchy(root: THREE.Object3D) {
  root.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.geometry?.dispose();
      
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => disposeMaterial(mat));
      } else if (mesh.material) {
        disposeMaterial(mesh.material);
      }
    }
  });
}

function disposeMaterial(mat: THREE.Material) {
  // Bersihkan seluruh tekstur yang terasosiasi dengan PBR material
  for (const key of Object.keys(mat)) {
    const val = (mat as any)[key];
    if (val && typeof val === 'object' && val.isTexture) {
      val.dispose();
    }
  }
  mat.dispose();
}
```

---

## 3. Aturan `requestAnimationFrame` Render Loop

Dalam loop render utama di [`src/engine/3d/scene.ts`](file:///f:/AUDIRA-AGENT/src/engine/3d/scene.ts):
1. **Dilarang Alokasi Objek Baru di Tiap Frame**:
   - ⛔ JANGAN pernah membuat `new THREE.Vector3()`, `new THREE.Raycaster()`, atau `new THREE.Matrix4()` di dalam render loop.
   - ✅ Gunakan reusable scratch vector di luar loop (*module-level scratch objects*).
2. **Throttling Proyeksi Raycasting & DOM**:
   - Raycasting hover kursor dibatasi dengan throttle ($15 - 30\text{ ms}$) saat mouse bergerak.
   - `CSS2DRenderer` hanya memperbarui label avatar yang berada di dalam frustum pandangan kamera aktif.

---

## 4. Post-Processing Pipeline Optimization (`EffectComposer`)

- **GTAOPass (Ground Truth Ambient Occlusion)**:
  - Resolusi scale: `0.5x` s/d `1.0x` viewport resolution.
  - Jari-jari sampling dibatasi pada rentang studio ($0.5\text{ m} - 2.5\text{ m}$).
- **UnrealBloomPass**:
  - Threshold pendar neon: $\ge 0.85$ (hanya elemen emisive lampu neon pod, battlestation, dan Master Wall yang berpendar).
  - Radius bloom: `0.45` untuk mencegah efek kabur berlebihan yang membebani fragment shader.
- **Shadow Map Engine**:
  - Gunakan `THREE.PCFSoftShadowMap` dengan resolusi directional spotlight $2048 \times 2048$.
  - Bias bayangan: `-0.00015` untuk mengeliminasi shadow acne tanpa peter-panning.
