import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";

export class EntityTool extends Tool {
    public readonly name = "entity";
    public readonly key = KeyCode.G;

    public onMousePressed() {
        const rsp = this.sampleVoxel(1);
        if (rsp !== undefined) {
            rsp.voxel.bounce++;
            rsp.voxel.bounce %= 4;
            this.editor.level.updateGeometry();
        }
    }

    public onRightMousePressed() {
        const rsp = this.sampleVoxel(1);
        if (rsp !== undefined) {
            rsp.voxel.bounce = 0;
            this.editor.level.updateGeometry();
        }
    }
}
