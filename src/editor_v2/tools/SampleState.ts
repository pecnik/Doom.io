import { ToolState } from "./ToolState";

export class SampleState extends ToolState {
    public endSample() {
        this.editor.setToolStateDefault();
    }

    public update() {
        const rsp = this.editor.sampleBlock(-1);
        if (rsp !== undefined) {
            const index = rsp.block.getFaceIndex(rsp.normal);
            const tileId = rsp.block.faces[index];
            this.editor.store.state.tileId = tileId;
        }
    }
}
