import { Tool } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { buildLevelMesh } from "../LevelUtils";
import { Intersection } from "three";
import { Hitscan } from "../../game/utils/EntityUtils";

export class BlockTool extends Tool {
    public readonly title = "Block tool";
    public readonly hotkey = KeyCode.R;

    public update() {
        const mousebtn1 = this.input.isMousePresed(MouseBtn.Left);
        const mousebtn2 = this.input.isMousePresed(MouseBtn.Right);
        if (mousebtn1) this.placeVoxel();
        if (mousebtn2) this.removeVoxel();
    }

    private placeVoxel() {
        const [hit] = this.hitscan();
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1);
        point.add(normal);

        const voxel = this.world.level.getVoxel(point);
        if (voxel !== undefined) {
            voxel.solid = true;

            for (let i = 0; i < 6; i++) {
                voxel.faces[i] = this.world.texutreIndex;
            }

            buildLevelMesh(this.world.level);
        }
    }

    private removeVoxel() {
        const [hit] = this.hitscan();
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1);
        point.sub(normal);

        const voxel = this.world.level.getVoxel(point);
        if (voxel !== undefined) {
            voxel.solid = false;
            buildLevelMesh(this.world.level);
        }
    }

    private hitscan() {
        const buffer: Intersection[] = [];
        Hitscan.origin.set(0, 0);
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.world.camera);
        Hitscan.raycaster.intersectObject(this.world.floor, true, buffer);
        Hitscan.raycaster.intersectObject(this.world.level.scene, true, buffer);
        return buffer;
    }
}