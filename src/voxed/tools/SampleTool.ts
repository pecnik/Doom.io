import { KeyCode } from "../../game/core/Input";
import { Tool, Tool_ID } from "./Tool";

export class SampleTool extends Tool {
    private prevToolId = Tool_ID.Block;
    public readonly id = Tool_ID.Sample;
    public readonly hotkey = KeyCode.ALT;
    public readonly faicon = "fa-eye-dropper";

    public onStart(prevToolId: Tool_ID) {
        this.prevToolId = prevToolId;
    }

    public onLeftPressed() {
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
                const tileId = rsp.voxel.faces[face];
                const { texture } = this.editor.store.state;
                texture.slots[texture.index] = tileId;
                texture.slots = [...texture.slots]; // Force vue update
                this.editor.setActiveTool(this.prevToolId);
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
