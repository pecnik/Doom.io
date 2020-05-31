import { KeyCode, MouseBtn } from "../../game/core/Input";
import {
    Mesh,
    BoxGeometry,
    MeshBasicMaterial,
    Scene,
    Vector3,
    Color,
    Object3D,
} from "three";
import { MoveTool } from "./MoveTool";
import { Tool } from "./Tool";
import { Level, LevelBlock } from "../Level";
import { EraserTool } from "./EraserTool";
import { SampleTool } from "./SampleTool";
import { Editor } from "../Editor";

export class Cursor3D extends Object3D {
    private readonly editor: Editor;
    private readonly mesh: Mesh;

    public readonly color: Color;
    public sampleDir: -1 | 1 = 1;

    public constructor(editor: Editor, color = new Color(1, 1, 1)) {
        super();
        this.editor = editor;
        this.color = color;
        this.mesh = new Mesh(
            new BoxGeometry(1, 1, 1),
            new MeshBasicMaterial({ color, wireframe: true })
        );
        this.add(this.mesh);
    }

    public update() {
        const rsp = this.editor.sampleBlock(this.sampleDir);
        if (rsp === undefined) {
            this.mesh.visible = false;
        } else {
            this.mesh.visible = true;
            this.mesh.position.copy(rsp.block.origin);
        }

        return rsp;
    }
}

export class BlockTool extends Tool {
    public readonly name = "Block tool";
    public readonly hotkey = KeyCode.B;
    public readonly cursorType = "tool-cursor-block";

    private readonly scene = new Scene();
    private readonly cursor = new Cursor3D(this.editor, new Color(0, 1, 0));

    private readonly brush = new Level();
    private readonly state = {
        v1: new Vector3(),
        v2: new Vector3(),
    };

    public getModifiedTool() {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }

        if (this.editor.input.isKeyDown(KeyCode.ALT)) {
            return this.editor.tools.get(SampleTool);
        }

        if (
            this.editor.input.isMouseReleased(MouseBtn.Right) ||
            this.editor.input.isMousePresed(MouseBtn.Right) ||
            this.editor.input.isMouseDown(MouseBtn.Right)
        ) {
            return this.editor.tools.get(EraserTool);
        }

        return this;
    }

    public initialize() {
        this.editor.scene.add(this.scene);

        this.scene.add(this.cursor, this.brush.mesh);
        this.brush.mesh.renderOrder = 2;
        this.brush.loadMaterial().then(() => {
            const material = this.brush.mesh.material as MeshBasicMaterial;
            material.color.setRGB(0, 1, 0);
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
            const { tileId } = this.editor.store.state;
            level.blocks.forEach((block) => {
                if (this.insideBrush(block)) {
                    block.solid = true;
                    block.faces.fill(tileId);
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
