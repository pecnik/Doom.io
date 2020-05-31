import { KeyCode, MouseBtn } from "../../game/core/Input";
import { Tool } from "./Tool";
import { MoveTool } from "./MoveTool";
import { Color } from "three";
import { Cursor3D } from "./Cursor3D";

export class SelecTool extends Tool {
    public readonly name = "Select block tool";
    public readonly hotkey = KeyCode.S;
    public readonly cursorType = "tool-cursor-select";

    public getModifiedTool(): Tool {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }
        return this;
    }

    private readonly cursor = new Cursor3D(this.editor, {
        sampleDir: 1,
        color: new Color(1, 1, 1),
        type: "face",
    });

    private readonly highlight = new Cursor3D(this.editor, {
        sampleDir: 1,
        color: new Color(1, 1, 0),
        type: "block",
    });

    public initialize() {
        this.editor.scene.add(this.cursor, this.highlight);
        this.editor.store.watch(
            (state) => state.blockIndex,
            (index) => {
                const block = this.editor.level.blocks[index];
                if (block !== undefined) {
                    this.highlight.visible = true;
                    this.highlight.position.copy(block.origin);
                }
            }
        );
    }

    public start() {
        const { blockIndex } = this.editor.store.state;
        this.cursor.visible = true;
        this.highlight.visible = blockIndex > -1;
    }

    public end() {
        this.cursor.visible = false;
        this.highlight.visible = false;
    }

    public update() {
        this.cursor.update();
    }

    public onPresed() {
        const dir = this.editor.input.isMousePresed(MouseBtn.Left) ? 1 : -1;
        const rsp = this.editor.sampleBlock(dir);
        if (rsp !== undefined) {
            this.editor.store.state.blockIndex = rsp.block.index;
        }
    }
}
