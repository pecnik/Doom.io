import { Tool, ToolType } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { Level, LevelBlock } from "../Level";
import { Editor } from "../Editor";
import { Vector3, MeshBasicMaterial, Scene } from "three";

enum BlockToolState {
    Idle,
    Block,
    Erase,
}

export class BlockTool extends Tool {
    public readonly name = "Block tool";
    public readonly type = ToolType.Block;
    public readonly hotkey = KeyCode.D;

    private readonly scene = new Scene();
    private readonly eraseBrush = new Level();
    private readonly blockBrush = new Level();
    private readonly state = {
        state: BlockToolState.Idle,
        v1: new Vector3(),
        v2: new Vector3(),
    };

    public constructor(editor: Editor) {
        super(editor);

        this.blockBrush.mesh.renderOrder = 2;
        this.blockBrush.loadMaterial().then(() => {
            const material = this.blockBrush.mesh.material as MeshBasicMaterial;
            material.color.setRGB(0, 1, 0);
        });

        this.eraseBrush.mesh.renderOrder = 2;
        this.eraseBrush.loadMaterial().then(() => {
            const material = this.eraseBrush.mesh.material as MeshBasicMaterial;
            material.color.setRGB(1, 0, 0);
        });

        this.scene.add(this.blockBrush.mesh, this.eraseBrush.mesh);
        this.editor.scene.add(this.scene);
    }

    public start() {
        this.blockBrush.resize(
            this.editor.level.width,
            this.editor.level.height,
            this.editor.level.depth
        );

        this.eraseBrush.resize(
            this.editor.level.width,
            this.editor.level.height,
            this.editor.level.depth
        );

        this.blockBrush.updateGeometry();
        this.eraseBrush.updateGeometry();

        this.scene.visible = true;
        this.state.state = BlockToolState.Idle;
    }

    public end() {
        this.scene.visible = false;
        this.state.state = BlockToolState.Idle;
    }

    public update() {
        this.blockBrush.mesh.visible = false;
        this.eraseBrush.mesh.visible = false;

        switch (this.state.state) {
            case BlockToolState.Idle: {
                const rsp = this.editor.sampleBlock(1);
                if (rsp !== undefined) {
                    this.blockBrush.mesh.visible = true;
                    this.state.v1.copy(rsp.point);
                    this.state.v2.copy(rsp.point);
                    this.updateBrush(this.blockBrush);

                    // Start drawing blocks
                    if (this.input.isMousePresed(MouseBtn.Left)) {
                        this.state.state = BlockToolState.Block;
                    }
                }

                // Star erasing blocks
                if (this.input.isMousePresed(MouseBtn.Right)) {
                    const rsp = this.editor.sampleBlock(-1);
                    if (rsp !== undefined) {
                        this.state.state = BlockToolState.Erase;
                        this.state.v1.copy(rsp.point);
                        this.state.v2.copy(rsp.point);
                    }
                }

                break;
            }

            case BlockToolState.Block: {
                this.blockBrush.mesh.visible = true;

                const rsp = this.editor.sampleBlock(1);
                if (rsp !== undefined) {
                    this.state.v1.copy(rsp.point);
                    this.updateBrush(this.blockBrush);
                }

                // Apply
                if (this.input.isMouseReleased(MouseBtn.Left)) {
                    this.applyBlockBrush();
                    this.state.state = BlockToolState.Idle;
                }

                // Cancel
                if (this.input.isMousePresed(MouseBtn.Right)) {
                    this.state.state = BlockToolState.Idle;
                }

                break;
            }

            case BlockToolState.Erase: {
                this.eraseBrush.mesh.visible = true;

                const rsp = this.editor.sampleBlock(-1);
                if (rsp !== undefined) {
                    this.state.v1.copy(rsp.point);
                    this.updateBrush(this.eraseBrush);
                }

                // Apply
                if (this.input.isMouseReleased(MouseBtn.Right)) {
                    this.applyEraseBrush();
                    this.state.state = BlockToolState.Idle;
                }

                // Cancel
                if (this.input.isMousePresed(MouseBtn.Left)) {
                    this.state.state = BlockToolState.Idle;
                }

                break;
            }
        }
    }

    private applyEraseBrush() {
        this.editor.level.blocks.forEach((block) => {
            if (this.insideBrush(block)) {
                block.solid = false;
            }
        });
        this.editor.level.updateGeometry();
    }

    private applyBlockBrush() {
        const { tileId } = this.editor.store.state.block;
        this.editor.level.blocks.forEach((block) => {
            if (this.insideBrush(block)) {
                block.solid = true;
                block.faces.fill(tileId);
            }
        });
        this.editor.level.updateGeometry();
    }

    private updateBrush(brush: Level) {
        const { tileId } = this.editor.store.state.block;

        let updateGeometry = false;
        brush.blocks.forEach((block) => {
            const solid = this.insideBrush(block);
            if (block.solid !== solid) {
                block.solid = solid;
                block.faces.fill(tileId);
                updateGeometry = true;
            }
        });

        if (updateGeometry) {
            brush.updateGeometry();
        }
    }

    private insideBrush(block: LevelBlock) {
        const { v1, v2 } = this.state;
        const { brushSize } = this.editor.store.state.block;

        const min = (v1: number, v2: number) => {
            return Math.round(Math.min(v1, v2));
        };

        const max = (v1: number, v2: number) => {
            return Math.round(Math.max(v1, v2)) + brushSize - 1;
        };

        const minx = min(v1.x, v2.x);
        const miny = min(v1.y, v2.y);
        const minz = min(v1.z, v2.z);
        const maxx = max(v1.x, v2.x);
        const maxy = max(v1.y, v2.y);
        const maxz = max(v1.z, v2.z);

        if (block.origin.x < minx) return false;
        if (block.origin.y < miny) return false;
        if (block.origin.z < minz) return false;
        if (block.origin.x > maxx) return false;
        if (block.origin.y > maxy) return false;
        if (block.origin.z > maxz) return false;
        return true;
    }
}
