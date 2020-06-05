import { KeyCode } from "../../game/core/Input";
import { Tool } from "./Tool";
import { MoveTool } from "./MoveTool";
import { Cursor3D } from "./Cursor3D";
import { Color } from "three";

export class SampleTool extends Tool {
    public readonly name = "Eyedropper tool";
    public readonly hotkey = KeyCode.I;
    public readonly cursorType = "tool-cursor-eyedropper";

    private readonly cursor = new Cursor3D(this.editor, {
        sampleDir: -1,
        color: new Color(1, 1, 1),
        type: "face",
    });

    public getModifiedTool(): Tool {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }
        return this;
    }

    public initialize() {
        this.editor.scene.add(this.cursor);
    }

    public start() {
        this.cursor.visible = true;
    }

    public end() {
        this.cursor.visible = false;
    }

    public onUp() {
        this.cursor.update();
        this.cursor.color.setRGB(1, 1, 1);
    }

    public onDown() {
        const rsp = this.cursor.update();
        this.cursor.color.setRGB(1, 1, 0);
        if (rsp !== undefined) {
            const index = rsp.block.getFaceIndex(rsp.normal);
            const textureId = rsp.block.faces[index];
            this.editor.store.state.textureId = textureId;
        }
    }
}
