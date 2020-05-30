import { KeyCode } from "../../game/core/Input";
import { Tool } from "./Tool";
import { MoveTool } from "./MoveTool";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";

export class SelecTool extends Tool {
    public readonly name = "Select block tool";
    public readonly hotkey = KeyCode.S;
    public readonly cursorType = "cursor-tool-select";

    public getModifiedTool(): Tool {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }
        return this;
    }

    private cursor = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );

    private highlight = new Mesh(
        new BoxGeometry(1.05, 1.05, 1.05),
        new MeshBasicMaterial({ color: 0xffff00, wireframe: true })
    );

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
        this.cursor.visible = true;
    }

    public end() {
        this.cursor.visible = false;
    }

    public update() {
        const rsp = this.editor.sampleBlock(1);
        if (rsp === undefined) {
            this.cursor.visible = false;
            return;
        }

        this.cursor.visible = true;
        this.cursor.position.copy(rsp.block.origin);
    }

    public onPresed() {
        const rsp = this.editor.sampleBlock(1);
        if (rsp !== undefined) {
            this.editor.store.state.blockIndex = rsp.block.index;
        }
    }
}
