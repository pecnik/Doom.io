import { ToolState } from "./ToolState";
import { Level, LevelBlock } from "../Level";
import { MeshBasicMaterial, Vector3 } from "three";

export class BlockDrawState extends ToolState {
    public cursorType = "cursor-tool-block";

    private readonly brush = new Level();
    private readonly state = {
        v1: new Vector3(),
        v2: new Vector3(),
    };

    public initialize() {
        this.editor.scene.add(this.brush.mesh);
        this.brush.mesh.renderOrder = 2;
        this.brush.loadMaterial().then(() => {
            const material = this.brush.mesh.material as MeshBasicMaterial;
            material.color.setRGB(0, 1, 0);
        });
    }

    public endAction() {
        this.editor.commitLevelMutation((level) => {
            const { tileId } = this.editor.store.state;
            level.blocks.forEach((block) => {
                if (this.insideBrush(block)) {
                    block.solid = true;
                    block.faces.fill(tileId);
                }
            });
        });
        this.editor.setToolStateDefault();
    }

    public start() {
        const rsp = this.editor.sampleBlock(1);
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
        this.brush.mesh.visible = true;
    }

    public end() {
        this.brush.mesh.visible = false;
    }

    public update() {
        const rsp = this.editor.sampleBlock(1);
        if (rsp !== undefined) {
            this.state.v2.copy(rsp.point);
            this.updateBrush();
        }
    }

    private updateBrush() {
        const { tileId } = this.editor.store.state;
        let updateGeometry = false;
        this.brush.blocks.forEach((block) => {
            const solid = this.insideBrush(block);
            if (block.solid !== solid) {
                block.solid = solid;
                block.faces.fill(tileId);
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
        return true;
    }
}
