import { Tool } from "./Tool";

export class SampleTool extends Tool {
    public readonly name = "Sample tool";
    public readonly icon = "/assets/sprites/editor_icon_pick.png";

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
                const tileId = rsp.voxel.faces[index];
                this.world.textureSlots[this.world.textureSlotIndex] = tileId;
            }
        }
    }
}
