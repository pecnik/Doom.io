import { Tool } from "./Tool";
import { buildLevelMesh } from "../EditorUtils";
import { Intersection } from "three";
import { Hitscan } from "../../game/utils/EntityUtils";

export class BlockTool extends Tool {
    public readonly name = "Block tool";
    public readonly icon = "/assets/sprites/editor_icon_block.png";

    // public fillVoxel() {
    //     const voxel = this.getVoxel(-1);
    //     if (voxel !== undefined) {
    //         voxel.solid = true;
    //         for (let i = 0; i < 6; i++) {
    //             voxel.faces[i] = this.world.texutreIndex;
    //         }
    //         buildLevelMesh(this.world.level);
    //     }
    // }

    public onMouseOne() {
        const voxel = this.getVoxel(1);
        if (voxel !== undefined) {
            voxel.solid = true;
            for (let i = 0; i < 6; i++) {
                voxel.faces[i] = this.world.texutreIndex;
            }
            buildLevelMesh(this.world.level);
        }
    }

    public onMouseTwo() {
        const voxel = this.getVoxel(-1);
        if (voxel !== undefined) {
            voxel.solid = false;
            buildLevelMesh(this.world.level);
        }
    }

    private getVoxel(dir: 1 | -1) {
        const buffer: Intersection[] = [];
        Hitscan.origin.set(0, 0);
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.world.camera);
        Hitscan.raycaster.intersectObject(this.world.floor, true, buffer);
        Hitscan.raycaster.intersectObject(this.world.level.scene, true, buffer);

        const [hit] = buffer;
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1 * dir);
        point.add(normal);

        return this.world.level.getVoxel(point);
    }
}
