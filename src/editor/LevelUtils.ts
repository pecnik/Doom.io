import { MeshBasicMaterial, BoxGeometry, Mesh, NearestFilter } from "three";
import { Level } from "./Level";



export function buildLevelMesh(level: Level) {
    const voxelGeo = new BoxGeometry(1, 1, 1);
    const voxelMat = new MeshBasicMaterial({ map: level.textrue });

    if (level.textrue) {
        level.textrue.minFilter = NearestFilter;
        level.textrue.magFilter = NearestFilter;
    }

    level.scene.remove(...level.scene.children);
    level.forEachVoxel(voxel => {
        if (voxel.solid) {
            const mesh = new Mesh(voxelGeo, voxelMat);
            mesh.position.copy(voxel.origin);
            level.scene.add(mesh);
        }
    });
}

