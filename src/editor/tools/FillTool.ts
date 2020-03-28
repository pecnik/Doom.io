import { Tool } from "./Tool";
import { buildLevelMesh } from "../EditorUtils";

export class FillTool extends Tool {
    public readonly name = "Fill tool";
    public readonly icon = "/assets/sprites/editor_icon_fill.png";

    public onMouseOne() {
        const voxel = this.getVoxel(-1);
        if (voxel !== undefined) {
            voxel.solid = true;
            for (let i = 0; i < 6; i++) {
                voxel.faces[i] = this.world.texutreIndex;
            }
            buildLevelMesh(this.world.level);
        }
    }
}
