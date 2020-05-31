import { KeyCode } from "../../game/core/Input";
import { Tool } from "./Tool";
import { MoveTool } from "./MoveTool";

export class SampleTool extends Tool {
    public readonly name = "Eyedropper tool";
    public readonly hotkey = KeyCode.I;
    public readonly cursorType = "tool-cursor-eyedropper";

    public getModifiedTool(): Tool {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }
        return this;
    }

    public onDown() {
        const rsp = this.editor.sampleBlock(-1);
        if (rsp !== undefined) {
            const index = rsp.block.getFaceIndex(rsp.normal);
            const tileId = rsp.block.faces[index];
            this.editor.store.state.tileId = tileId;
        }
    }
}
