import { Tool } from "./Tool";
import { VoxelType } from "../../game/data/Level";

export class BlockTool extends Tool {
    public onMousePressed() {
        const rsp = this.sampleVoxel(1);
        if (rsp !== undefined) {
            rsp.voxel.type = VoxelType.Block;
            this.editor.level.updateGeometry();
        }
    }
}
