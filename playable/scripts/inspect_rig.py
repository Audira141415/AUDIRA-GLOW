# Blender (headless): how a rigged model is built — meshes, triangles, bones, how solid its skinning is, its clips.
#   blender -b -P inspect_rig.py -- model.glb|.gltf|.fbx|.blend
import bpy, sys, os
src = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
ext = os.path.splitext(src)[1].lower()
if ext == '.fbx': bpy.ops.import_scene.fbx(filepath=src)
elif ext in ('.glb', '.gltf'): bpy.ops.import_scene.gltf(filepath=src)
else: bpy.ops.wm.open_mainfile(filepath=src)
tot = rig = soft = 0; tris = 0; parts = []
for ob in bpy.data.objects:
    if ob.type != 'MESH': continue
    me = ob.data; tris += sum(len(p.vertices) - 2 for p in me.polygons)
    arm = any(m.type == 'ARMATURE' for m in ob.modifiers)
    if ob.parent_type == 'BONE': parts.append(ob.name)
    if not arm: continue
    for v in me.vertices:
        ws = [g.weight for g in v.groups if g.weight > 0]
        if not ws: continue
        tot += 1; w = max(ws) / sum(ws)
        rig += w >= 0.99; soft += w < 0.9
acts = sorted(a.name for a in bpy.data.actions)
bones = sum(len(o.data.bones) for o in bpy.data.objects if o.type == 'ARMATURE')
print(f"RESULT {os.path.basename(src)} | meshes {sum(o.type=='MESH' for o in bpy.data.objects)} | tris {tris} | bones {bones} | skinned verts {tot}: rigid {100*rig/max(tot,1):.0f}% soft {100*soft/max(tot,1):.0f}% | bone-parented meshes {len(parts)} | {len(acts)} clips: {', '.join(acts)[:400]}")
