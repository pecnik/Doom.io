import { Tool } from "./Tool";
import { buildLevelMesh } from "../EditorUtils";

export class BlockTool extends Tool {
    public readonly name = "Block tool";
    public readonly icon = "/assets/sprites/editor_icon_block.png";

    public onMouseOne() {
        const rsp = this.sampleVoxel(1);
        const tileId = this.getActiveTextureId();
        if (rsp !== undefined) {
            if (tileId < 8) {
                rsp.voxel.light = true;
                rsp.voxel.solid = false;
            } else {
                rsp.voxel.solid = true;
                rsp.voxel.light = false;
            }

            for (let i = 0; i < 6; i++) {
                rsp.voxel.faces[i] = tileId;
            }

            buildLevelMesh(this.world.level);
        }
    }

    public onMouseTwo() {
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            rsp.voxel.solid = false;
            buildLevelMesh(this.world.level);
        }
    }
}
