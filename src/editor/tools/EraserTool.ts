import { KeyCode } from "../../game/core/Input";
import { Scene, Vector3, Color } from "three";
import { MoveTool } from "./MoveTool";
import { Tool } from "./Tool";
import { Level, LevelBlock } from "../Level";
import { Cursor3D } from "./Cursor3D";

export class EraserTool extends Tool {
    public readonly name = "Eraser tool";
    public readonly hotkey = KeyCode.E;
    public readonly cursorType = "tool-cursor-eraser";

    private readonly scene = new Scene();
    private readonly cursor = new Cursor3D(this.editor, {
        sampleDir: -1,
        color: new Color(1, 0, 0),
    });

    private readonly brush = new Level();
    private readonly state = {
        v1: new Vector3(),
        v2: new Vector3(),
    };

    public getModifiedTool(): Tool {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }
        return this;
    }

    public initialize() {
        this.editor.scene.add(this.scene);
        this.scene.add(this.cursor, this.brush.mesh);
        this.brush.mesh.renderOrder = 2;
        this.brush.loadMaterial().then(() => {
            this.brush.textures.forEach((textrue) => {
                textrue.material.color = new Color(0xff0000);
                textrue.material.needsUpdate = true;
            });
        });
    }

    public start() {
        this.scene.visible = true;
    }

    public end() {
        this.scene.visible = false;
    }

    public onPresed() {
        this.cursor.visible = false;
        this.brush.mesh.visible = true;

        const rsp = this.cursor.update();
        if (rsp !== undefined) {
            this.state.v1.copy(rsp.point);
        }

        this.brush.resize(
            this.editor.level.width,
            this.editor.level.height,
            this.editor.level.depth
        );
        this.brush.updateGeometry();
    }

    public onReleased() {
        this.cursor.visible = true;
        this.brush.mesh.visible = false;
        this.editor.commitLevelMutation((level) => {
            level.blocks.forEach((block) => {
                if (this.insideBrush(block)) {
                    block.solid = false;
                }
            });
        });
    }

    public onUp() {
        const rsp = this.cursor.update();
        if (rsp !== undefined) {
            this.state.v1.copy(rsp.point);
        }
    }

    public onDown() {
        const rsp = this.cursor.update();
        if (rsp !== undefined) {
            this.state.v2.copy(rsp.point);
            this.updateBrush();
        }
    }

    private updateBrush() {
        const { textureId } = this.editor.store.state;
        let updateGeometry = false;
        this.brush.blocks.forEach((block) => {
            const solid = this.insideBrush(block);
            if (block.solid !== solid) {
                block.solid = solid;
                block.faces.fill(textureId);
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
