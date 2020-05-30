import { ToolState } from "./ToolState";
import { MoveState } from "./MoveState";
import { BlockDrawState } from "./BlockDrawState";
import { BlockEraseState } from "./BlockEraseState";
import { SampleState } from "./SampleState";
import { PaintState } from "./PaintState";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { SelectState } from "./SelectState";

export class BlockState extends ToolState {
    public cursorType = "cursor-tool-block";

    private cursor = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );

    public initialize() {
        this.editor.scene.add(this.cursor);
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

    public startMove() {
        this.editor.setToolState(MoveState);
    }

    public startAction1() {
        this.editor.setToolState(BlockDrawState);
    }

    public startAction2() {
        this.editor.setToolState(BlockEraseState);
    }

    public startSample() {
        this.editor.setToolState(SampleState);
    }

    public hotkeyBlock() {
        this.editor.store.state.defaultTool = "block";
        this.editor.setToolState(BlockState);
    }

    public hotkeyPaint() {
        this.editor.store.state.defaultTool = "paint";
        this.editor.setToolState(PaintState);
    }

    public hotkeySelect() {
        this.editor.store.state.defaultTool = "select";
        this.editor.setToolState(SelectState);
    }
}
