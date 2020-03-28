import { Tool } from "./Tool";
import { buildLevelMesh } from "../EditorUtils";

export class FillTool extends Tool {
    public readonly name = "Fill tool";
    public readonly icon = "/assets/sprites/editor_icon_fill.png";

    public onMouseTwo() {
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            const tileId = this.getActiveTextureId();
            rsp.voxel.solid = true;
            for (let i = 0; i < 6; i++) {
                rsp.voxel.faces[i] = tileId;
            }
            buildLevelMesh(this.world.level);
        }
    }

    public onMouseOne() {
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            let index = -1;
            if (rsp.normal.x === -1) index = 0;
            if (rsp.normal.x === +1) index = 1;
            if (rsp.normal.y === -1) index = 2;
            if (rsp.normal.y === +1) index = 3;
            if (rsp.normal.z === -1) index = 4;
            if (rsp.normal.z === +1) index = 5;

            if (index > -1) {
                rsp.voxel.faces[index] = this.getActiveTextureId();
                buildLevelMesh(this.world.level);
            }
        }
    }
}
