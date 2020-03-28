import { Tool } from "./Tool";
import { buildLevelMesh } from "../EditorUtils";

export class BlockTool extends Tool {
    public readonly name = "Block tool";
    public readonly icon = "/assets/sprites/editor_icon_block.png";

    public onMouseOne() {
        const rsp = this.sampleVoxel(1);
        if (rsp !== undefined) {
            rsp.voxel.solid = true;
            for (let i = 0; i < 6; i++) {
                rsp.voxel.faces[i] = this.world.texutreIndex;
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
