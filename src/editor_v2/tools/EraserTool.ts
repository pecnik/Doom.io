import { Tool, ToolType } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { Level, LevelBlock } from "../Level";
import { Editor } from "../Editor";
import { Vector3, MeshBasicMaterial, AdditiveBlending } from "three";

export class EraserTool extends Tool {
    public readonly name = "Eraser tool";
    public readonly type = ToolType.Eraser;
    public readonly hotkey = KeyCode.E;

    private readonly brush = new Level();
    private readonly state = {
        drawing: false,
        v1: new Vector3(),
        v2: new Vector3(),
    };

    public constructor(editor: Editor) {
        super(editor);
        editor.scene.add(this.brush.mesh);

        this.brush.mesh.renderOrder = 2;
        this.brush.loadMaterial().then(() => {
            const material = this.brush.mesh.material as MeshBasicMaterial;
            material.blending = AdditiveBlending;
            material.color.setRGB(1, 0, 0);
        });
    }

    public start() {
        this.brush.resize(
            this.editor.level.width,
            this.editor.level.height,
            this.editor.level.depth
        );
        this.brush.updateGeometry();
        this.brush.mesh.visible = true;
        this.state.drawing = false;
    }

    public end() {
        this.brush.mesh.visible = false;
    }

    public update() {
        const rsp = this.editor.sampleBlock(-1);

        if (!this.state.drawing) {
            if (this.input.isMousePresed(MouseBtn.Left)) {
                this.state.drawing = true;
            }

            if (rsp !== undefined) {
                this.state.v1.copy(rsp.point);
                this.state.v2.copy(rsp.point);
                this.updateBrush();
            }
        } else {
            if (rsp !== undefined) {
                this.state.v2.copy(rsp.point);
                this.updateBrush();
            }

            if (this.input.isMouseReleased(MouseBtn.Left)) {
                this.state.drawing = false;
                this.applyBrush();
            }
        }
    }

    private insideBrush(block: LevelBlock) {
        const { v1, v2 } = this.state;
        const { brushSize } = this.editor.store.state.eraser;

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

    private updateBrush() {
        this.brush.blocks.forEach((block) => {
            block.solid = this.insideBrush(block);
        });
        this.brush.updateGeometry();
    }

    private applyBrush() {
        this.editor.level.blocks.forEach((block) => {
            if (this.insideBrush(block)) {
                block.solid = false;
            }
        });
        this.editor.level.updateGeometry();
    }
}
