import { KeyCode } from "../../game/core/Input";
import { Tool, Tool_ID } from "./Tool";

export class PaintTool extends Tool {
    public readonly id = Tool_ID.Paint;
    public readonly hotkey = KeyCode.F;

    public onLeftPressed() {
        const tileId = this.editor.getSelectedTileId();
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
                rsp.voxel.faces[face] = tileId;
                this.editor.level.updateGeometry();
            }
        }
    }
    public onRightPressed() {
        const tileId = this.editor.getSelectedTileId();
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            rsp.voxel.faces.fill(tileId);
            this.editor.level.updateGeometry();
        }
    }
}
