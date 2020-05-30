import { ToolState } from "./ToolState";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { MoveState } from "./MoveState";
import { BlockState } from "./BlockState";
import { PaintState } from "./PaintState";

export class SelectState extends ToolState {
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

    public startAction1() {
        const rsp = this.editor.sampleBlock(1);
        if (rsp !== undefined) {
            this.editor.store.state.blockIndex = rsp.block.index;
        }
    }

    public startAction2() {
        const rsp = this.editor.sampleBlock(-1);
        if (rsp !== undefined) {
            this.editor.store.state.blockIndex = rsp.block.index;
        }
    }

    public startMove() {
        this.editor.setToolState(MoveState);
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
