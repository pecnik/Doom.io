import { Tool } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { buildLevelMesh } from "../LevelUtils";
import { Intersection } from "three";
import { Hitscan } from "../../game/utils/EntityUtils";

export class FillBlockTool extends Tool {
    private readonly world = this.editor.world;
    private readonly input = this.editor.input;

    public readonly name = "fill-select";
    public readonly hotkey = KeyCode.F;


    public update() {
        const fillInput = this.input.isMousePresed(MouseBtn.Left);
        if (!fillInput) return;

        const [hit] = this.hitscan();
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1);
        point.sub(normal);

        const voxel = this.world.level.getVoxel(point);
        if (voxel !== undefined && voxel.solid) {
            for (let i = 0; i < voxel.faces.length; i++) {
                voxel.faces[i] = this.world.texutreIndex;
            }
            buildLevelMesh(this.world.level);
        }
    }


    private hitscan() {
        const buffer: Intersection[] = [];
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.world.camera);
        Hitscan.raycaster.intersectObject(this.world.floor, true, buffer);
        Hitscan.raycaster.intersectObject(this.world.level.scene, true, buffer);
        return buffer;
    }
}