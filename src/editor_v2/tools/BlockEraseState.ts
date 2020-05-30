import { ToolState } from "./ToolState";
import { Level, LevelBlock } from "../Level";
import { MeshBasicMaterial, Vector3 } from "three";

export class BlockEraseState extends ToolState {
    public cursorType = "cursor-tool-eraser";

    private readonly brush = new Level();
    private readonly state = {
        v1: new Vector3(),
        v2: new Vector3(),
    };

    public initialize() {
        this.editor.scene.add(this.brush.meshMesh);
        this.brush.meshMesh.renderOrder = 2;
        this.brush.loadMaterial().then(() => {
            const material = this.brush.meshMesh.material as MeshBasicMaterial;
            material.color.setRGB(1, 0, 0);
        });
    }

    public endAction() {
        this.editor.commitLevelMutation((level) => {
            level.blocks.forEach((block) => {
                if (this.insideBrush(block)) {
                    block.solid = false;
                }
            });
        });
        this.editor.setToolStateDefault();
    }

    public start() {
        const rsp = this.editor.sampleBlock(-1);
        if (rsp !== undefined) {
            this.state.v1.copy(rsp.point);
            this.updateBrush();
        }

        this.brush.resize(
            this.editor.level.width,
            this.editor.level.height,
            this.editor.level.depth
        );
        this.brush.updateGeometry();
        this.brush.meshMesh.visible = true;
    }

    public end() {
        this.brush.meshMesh.visible = false;
    }

    public update() {
        const rsp = this.editor.sampleBlock(-1);
        if (rsp !== undefined) {
            this.state.v2.copy(rsp.point);
            this.updateBrush();
        }
    }

    private updateBrush() {
        let updateGeometry = false;
        this.brush.blocks.forEach((block) => {
            const solid = this.insideBrush(block);
            if (block.solid !== solid) {
                block.solid = solid;
                updateGeometry = true;
            }
        });

        if (updateGeometry) {
            this.brush.updateGeometry();
        }
    }

    private insideBrush(block: LevelBlock) {
        const { v1, v2 } = this.state;
        const { brushSize } = this.editor.store.state;

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

        const editorBlock = this.editor.level.getBlockAt(block.origin);
        if (editorBlock === undefined) return false;
        if (editorBlock.solid === false) return false;

        return true;
    }
}
