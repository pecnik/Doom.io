import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";
import { store } from "../Store";

export class PaintTool extends Tool {
    public readonly name = "paint";
    public readonly key = KeyCode.F;

    public onMousePressed() {
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            let face = -1;
            if (rsp.normal.x === -1) face = 0;
            if (rsp.normal.x === +1) face = 1;
            if (rsp.normal.y === -1) face = 2;
            if (rsp.normal.y === +1) face = 3;
            if (rsp.normal.z === -1) face = 4;
            if (rsp.normal.z === +1) face = 5;
            if (face > -1) {
                rsp.voxel.faces[face] = store.getters.tileId;
                this.editor.level.updateGeometry();
            }
        }
    }
}
