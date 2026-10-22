# Blender (headless): convert a rigged model to .glb, keeping its node tree and every action as a clip (no materials).
#   blender -b -P to_glb.py -- in.blend|.gltf|.fbx out.glb
import bpy, sys, os
src, dst = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
ext = os.path.splitext(src)[1].lower()
if ext == '.blend': bpy.ops.wm.open_mainfile(filepath=src)
elif ext == '.fbx': bpy.ops.import_scene.fbx(filepath=src)
else: bpy.ops.import_scene.gltf(filepath=src)
for ob in list(bpy.data.objects):            # keep meshes + armatures only (no cameras, lights, empties left over)
    if ob.type not in ('MESH', 'ARMATURE', 'EMPTY'): bpy.data.objects.remove(ob, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS',
                          export_apply=False, export_materials='NONE', export_yup=True)
print('OK', os.path.basename(dst), os.path.getsize(dst) // 1024, 'KB')
