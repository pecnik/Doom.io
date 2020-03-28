import { Tool } from "./Tool";
import { buildLevelMesh } from "../EditorUtils";

export class BlockTool extends Tool {
    public readonly name = "Block tool";
    public readonly icon = "/assets/sprites/editor_icon_block.png";

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
}
